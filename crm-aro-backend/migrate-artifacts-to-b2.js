// ============================================================================
// migrate-artifacts-to-b2.js  —  one-time migration of embedded base64 file
// blobs (EOI/deal images + documents) OFF the Mongo Lead documents and INTO
// Backblaze B2, replacing each blob with its B2 object key.
//
// Backward-compatible with the live backend: it writes the SAME key convention
// and the SAME entry shape ({key,name,contentType,size,uploadedAt,storage:"b2"})
// that server.js upload endpoints now write, so resolveArtifacts() signs them.
//
// SAFETY MODEL
//   • DRY_RUN defaults to TRUE. A real run REQUIRES `DRY_RUN=false`. In DRY_RUN
//     nothing is uploaded and nothing is written to Mongo — it only reports.
//   • Idempotent: values not starting with "data:" are already migrated → skipped.
//     Safe to re-run.
//   • Per-lead discipline: upload ALL of a lead's blobs to B2 and VERIFY each
//     with HeadObject FIRST; only then perform ONE Mongo update swapping
//     blobs→keys. ANY upload/verify failure ⇒ the whole lead is skipped, logged,
//     and its base64 is left intact. Base64 is NEVER removed before its B2
//     object is confirmed present.
//   • Sidecar (LeadArtifactArchive.eoiDocuments) is migrated to B2 and its keys
//     are folded back onto lead.eoiDocuments (archived first, then live — same
//     order resolveArtifacts uses); the lead update + sidecar delete run in a
//     transaction so they commit together.
//
// USAGE
//   DRY run (default), all leads, biggest-first:
//     MONGODB_URI=... B2_ENDPOINT=... B2_REGION=... B2_ACCESS_KEY_ID=... \
//     B2_SECRET_ACCESS_KEY=... B2_BUCKET=aro-crm-files \
//     node migrate-artifacts-to-b2.js
//
//   DRY run, single lead:      node migrate-artifacts-to-b2.js --only=6a3c12c0f9f153c6ea88bcc1
//   REAL run, single lead:     DRY_RUN=false node migrate-artifacts-to-b2.js --only=6a3c...bcc1
//   REAL run, all (batches):   DRY_RUN=false node migrate-artifacts-to-b2.js
//   Optional cap for a first real batch:  --limit=25
// ============================================================================
"use strict";

var mongoose = require("mongoose");
var crypto = require("crypto");
var s3lib = require("@aws-sdk/client-s3");
var S3Client = s3lib.S3Client, PutObjectCommand = s3lib.PutObjectCommand, HeadObjectCommand = s3lib.HeadObjectCommand;

// ---- flags & config --------------------------------------------------------
var DRY_RUN = process.env.DRY_RUN !== "false";           // default TRUE
var ONLY = (argVal("--only") || "").trim();              // single leadId
var LIMIT = Number(argVal("--limit") || 0) || 0;         // 0 = no cap
var BATCH = 25;

var MONGODB_URI = process.env.MONGODB_URI || "";
var B2_ENDPOINT = process.env.B2_ENDPOINT || "";
var B2_REGION = process.env.B2_REGION || "";
var B2_ACCESS_KEY_ID = process.env.B2_ACCESS_KEY_ID || "";
var B2_SECRET_ACCESS_KEY = process.env.B2_SECRET_ACCESS_KEY || "";
var B2_BUCKET = process.env.B2_BUCKET || "";

function argVal(name) {
  var hit = process.argv.find(function (a) { return a.indexOf(name + "=") === 0; });
  return hit ? hit.split("=").slice(1).join("=") : "";
}
function safeHost(u) { try { return new URL(u).host; } catch (e) { return "(unparseable)"; } }
function isDataStr(v) { return typeof v === "string" && v.indexOf("data:") === 0; }
function docUrl(d) { return typeof d === "string" ? d : (d && d.url) || ""; }
function docName(d) { return (d && typeof d === "object" && d.name) ? d.name : ""; }
function docUploadedAt(d) { return (d && typeof d === "object" && d.uploadedAt) ? d.uploadedAt : new Date(); }
var MB = 1024 * 1024;
function fmtMB(b) { return (b / MB).toFixed(3); }

// data:<ct>;base64,<payload>  → { contentType, ext, buffer, size } | null
function parseDataUrl(raw) {
  if (!isDataStr(raw)) return null;
  var m = raw.match(/^data:([^;,]+);base64,(.+)$/i);
  if (!m) return null;
  var contentType = m[1].toLowerCase();
  var buffer;
  try { buffer = Buffer.from(m[2], "base64"); } catch (e) { return null; }
  if (!buffer || !buffer.length) return null;
  return { contentType: contentType, ext: extFor(contentType), buffer: buffer, size: buffer.length };
}
function extFor(ct) {
  ct = (ct || "").toLowerCase();
  if (ct === "application/pdf") return "pdf";
  if (ct === "image/jpeg" || ct === "image/jpg") return "jpg";
  if (ct === "image/png") return "png";
  if (ct === "image/webp") return "webp";
  return ((ct.split("/")[1] || "bin").replace(/[^a-z0-9]/g, "")) || "bin";
}
function keyFor(leadId, category, ext) {
  return "leads/" + leadId + "/" + category + "/" + crypto.randomUUID() + "." + ext;
}

// ---- B2 client -------------------------------------------------------------
var _client = null;
function b2Configured() { return !!(B2_ENDPOINT && B2_REGION && B2_ACCESS_KEY_ID && B2_SECRET_ACCESS_KEY && B2_BUCKET); }
function b2() {
  if (!_client) {
    _client = new S3Client({
      endpoint: B2_ENDPOINT, region: B2_REGION,
      credentials: { accessKeyId: B2_ACCESS_KEY_ID, secretAccessKey: B2_SECRET_ACCESS_KEY },
      forcePathStyle: true,
    });
  }
  return _client;
}
async function putAndVerify(key, buffer, contentType) {
  await b2().send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: key, Body: buffer, ContentType: contentType }));
  var head = await b2().send(new HeadObjectCommand({ Bucket: B2_BUCKET, Key: key }));
  if (Number(head.ContentLength) !== Number(buffer.length)) {
    throw new Error("HeadObject size mismatch for " + key + " (got " + head.ContentLength + ", expected " + buffer.length + ")");
  }
  return key;
}

// ---- loose models (read/write arbitrary fields on the real collections) ----
var Lead = mongoose.model("Lead", new mongoose.Schema({}, { strict: false, collection: "leads" }));
var LeadArtifactArchive = mongoose.model("LeadArtifactArchive", new mongoose.Schema({}, { strict: false, collection: "leadartifactarchives" }));

// ---- per-lead planning -----------------------------------------------------
// Returns { blobs:[{slot,index?,category,contentType,ext,size,name?,uploadedAt?,source}], hasSidecar, archiveEntries }
function buildPlan(lead, sidecar) {
  var blobs = [];
  function pushImg(slot, index, val, category) {
    var p = parseDataUrl(val); if (p) blobs.push({ slot: slot, index: index, category: category, contentType: p.contentType, ext: p.ext, size: p.size, _buf: p.buffer, source: "lead", kind: "image" });
  }
  function pushDoc(slot, index, entry, category, source) {
    var p = parseDataUrl(docUrl(entry)); if (p) blobs.push({ slot: slot, index: index, category: category, contentType: p.contentType, ext: p.ext, size: p.size, _buf: p.buffer, name: docName(entry) || ("document-" + Date.now() + "." + p.ext), uploadedAt: docUploadedAt(entry), source: source, kind: "doc" });
  }
  pushImg("eoiImage", null, lead.eoiImage, "eoi-image");
  pushImg("dealImage", null, lead.dealImage, "deal-images"); // legacy singular
  (lead.dealImages || []).forEach(function (v, i) { pushImg("dealImages", i, v, "deal-images"); });
  (lead.eoiDocuments || []).forEach(function (d, i) { pushDoc("eoiDocuments", i, d, "eoi-docs", "lead"); });
  (lead.dealDocuments || []).forEach(function (d, i) { pushDoc("dealDocuments", i, d, "deal-docs", "lead"); });
  var archiveEntries = (sidecar && Array.isArray(sidecar.eoiDocuments)) ? sidecar.eoiDocuments : [];
  archiveEntries.forEach(function (d, i) { pushDoc("archiveEoiDocuments", i, d, "eoi-docs", "archive"); });
  return { blobs: blobs, hasSidecar: !!sidecar, archiveEntries: archiveEntries };
}

// ---- migrate a single lead -------------------------------------------------
async function migrateLead(lead, sidecar, stats) {
  var leadId = String(lead._id);
  var plan = buildPlan(lead, sidecar);
  var name = lead.name || "(no name)";

  if (!plan.blobs.length && !plan.hasSidecar) { stats.skippedNone++; return; }

  // ---- report the plan (always) ----
  console.log("\n── LEAD " + leadId + "  " + JSON.stringify(name) + (plan.hasSidecar ? "  [has sidecar]" : ""));
  var totalBytes = 0;
  plan.blobs.forEach(function (b) {
    totalBytes += b.size;
    var label = b.slot + (b.index != null ? "[" + b.index + "]" : "") + (b.source === "archive" ? " (archive)" : "");
    console.log("   • " + label.padEnd(28) + " " + b.contentType.padEnd(16) + fmtMB(b.size) + " MB → " +
      "leads/" + leadId + "/" + b.category + "/" + (DRY_RUN ? "<uuid>" : "…") + "." + b.ext);
  });
  console.log("   Σ " + plan.blobs.length + " blob(s), " + fmtMB(totalBytes) + " MB" +
    (plan.hasSidecar ? "  (+ fold " + plan.archiveEntries.length + " archive doc(s) → lead.eoiDocuments, drop sidecar)" : ""));

  if (DRY_RUN) {
    stats.dryLeads++; stats.dryBlobs += plan.blobs.length; stats.dryBytes += totalBytes;
    return;
  }

  // ---- REAL: upload + verify ALL blobs first ----
  try {
    for (var i = 0; i < plan.blobs.length; i++) {
      var b = plan.blobs[i];
      b.key = keyFor(leadId, b.category, b.ext);
      await putAndVerify(b.key, b._buf, b.contentType);
      console.log("   ✓ uploaded+verified " + b.key);
    }
  } catch (e) {
    console.error("   ✗ SKIPPING LEAD " + leadId + " — upload/verify failed: " + (e && e.message));
    console.error("     (base64 left intact; any already-uploaded objects for this lead are orphans — safe to re-run)");
    stats.skippedError++; stats.errors.push({ leadId: leadId, error: e && e.message });
    return;
  }

  // ---- build new field values from the verified keys ----
  var byKey = {}; // slot -> handling
  var update = {};
  // images (plain key strings)
  plan.blobs.forEach(function (b) { byKey[b.slot + ":" + b.index] = b.key; });
  if (isDataStr(lead.eoiImage)) update.eoiImage = keyOf(plan, "eoiImage", null);
  if (isDataStr(lead.dealImage)) update.dealImage = keyOf(plan, "dealImage", null);
  if ((lead.dealImages || []).some(isDataStr)) {
    update.dealImages = (lead.dealImages || []).map(function (v, i) { return isDataStr(v) ? keyOf(plan, "dealImages", i) : v; });
  }
  if ((lead.dealDocuments || []).some(function (d) { return isDataStr(docUrl(d)); })) {
    update.dealDocuments = (lead.dealDocuments || []).map(function (d, i) { return migratedDocEntry(plan, "dealDocuments", i, d); });
  }

  // eoiDocuments: migrate live entries, and if a sidecar exists, fold archive keys in FRONT.
  var liveEoi = (lead.eoiDocuments || []).map(function (d, i) { return migratedDocEntry(plan, "eoiDocuments", i, d); });
  var needEoiRewrite = (lead.eoiDocuments || []).some(function (d) { return isDataStr(docUrl(d)); });
  if (plan.hasSidecar) {
    var archMigrated = plan.archiveEntries.map(function (d, i) { return migratedDocEntry(plan, "archiveEoiDocuments", i, d); });
    update.eoiDocuments = archMigrated.concat(liveEoi); // archived first, then live (resolver order)
    needEoiRewrite = true;
  } else if (needEoiRewrite) {
    update.eoiDocuments = liveEoi;
  }

  // ---- one atomic write ----
  if (plan.hasSidecar) {
    var session = await mongoose.startSession();
    try {
      await session.withTransaction(async function () {
        await Lead.updateOne({ _id: lead._id }, { $set: update }, { session: session });
        await LeadArtifactArchive.deleteOne({ _id: sidecar._id }, { session: session });
      });
      console.log("   ✓ MIGRATED (lead updated + sidecar dropped, txn)");
    } finally { await session.endSession(); }
  } else {
    await Lead.updateOne({ _id: lead._id }, { $set: update });
    console.log("   ✓ MIGRATED (lead updated)");
  }
  stats.migrated++; stats.migratedBlobs += plan.blobs.length; stats.migratedBytes += totalBytes;
}

// find the verified key for a planned image slot/index
function keyOf(plan, slot, index) {
  var b = plan.blobs.find(function (x) { return x.slot === slot && x.index === index; });
  return b ? b.key : null;
}
// build the new doc entry for a doc slot/index, preserving name + uploadedAt; passes through already-migrated entries
function migratedDocEntry(plan, slot, index, original) {
  if (!isDataStr(docUrl(original))) return original; // already a B2 entry or non-data → keep as-is
  var b = plan.blobs.find(function (x) { return x.slot === slot && x.index === index; });
  if (!b) return original;
  return { key: b.key, name: b.name, contentType: b.contentType, size: b.size, uploadedAt: b.uploadedAt || new Date(), storage: "b2" };
}

// ---- driver ----------------------------------------------------------------
(async function main() {
  // config summary (masked)
  console.log("=== migrate-artifacts-to-b2 ===");
  console.log("MODE:        " + (DRY_RUN ? "DRY_RUN (no uploads, no writes)" : "!!! LIVE — will upload to B2 and write Mongo !!!"));
  console.log("MONGODB_URI: " + (MONGODB_URI ? "set (" + safeHost(MONGODB_URI) + ")" : "MISSING"));
  console.log("B2 endpoint: " + (B2_ENDPOINT ? safeHost(B2_ENDPOINT) : "MISSING") + " | region: " + (B2_REGION || "MISSING") + " | bucket: " + (B2_BUCKET || "MISSING"));
  console.log("B2 creds:    accessKeyId=" + (B2_ACCESS_KEY_ID ? "present" : "MISSING") + ", secret=" + (B2_SECRET_ACCESS_KEY ? "present" : "MISSING"));
  console.log("SCOPE:       " + (ONLY ? "--only=" + ONLY : "ALL leads, biggest-first, batches of " + BATCH) + (LIMIT ? "  (--limit=" + LIMIT + ")" : ""));
  if (!MONGODB_URI) { console.error("Abort: MONGODB_URI missing"); process.exit(1); }
  // B2 creds are only needed for a LIVE run (DRY never uploads). This lets a DRY
  // run happen locally without the secrets present.
  if (!DRY_RUN && !b2Configured()) { console.error("Abort: B2_* env incomplete (required for a live run)"); process.exit(1); }
  if (DRY_RUN && !b2Configured()) { console.warn("Note: B2_* not fully set — fine for DRY_RUN (no uploads will happen)."); }

  await mongoose.connect(MONGODB_URI);

  var stats = { dryLeads: 0, dryBlobs: 0, dryBytes: 0, migrated: 0, migratedBlobs: 0, migratedBytes: 0, skippedNone: 0, skippedError: 0, errors: [] };

  // precompute which leadIds have a sidecar (tiny set)
  var sidecarIds = new Set((await LeadArtifactArchive.find({}).select("leadId").lean()).map(function (a) { return String(a.leadId); }));

  var ARTIFACT_FIELDS = "name eoiImage eoiDocuments dealImages dealImage dealDocuments";

  async function handleOne(lead) {
    var sidecar = sidecarIds.has(String(lead._id)) ? await LeadArtifactArchive.findOne({ leadId: lead._id }).lean() : null;
    await migrateLead(lead, sidecar, stats);
  }

  if (ONLY) {
    var one = await Lead.findById(ONLY).select(ARTIFACT_FIELDS);
    if (!one) { console.error("Lead " + ONLY + " not found"); }
    else await handleOne(one);
  } else {
    // ordered _ids by BSON size, descending
    var ordered = await Lead.aggregate([{ $project: { size: { $bsonSize: "$$ROOT" } } }, { $sort: { size: -1 } }, { $project: { _id: 1 } }]);
    var ids = ordered.map(function (r) { return r._id; });
    var processed = 0;
    for (var start = 0; start < ids.length; start += BATCH) {
      var batchIds = ids.slice(start, start + BATCH);
      var leads = await Lead.find({ _id: { $in: batchIds } }).select(ARTIFACT_FIELDS);
      // keep the size-desc order within the batch
      var byId = {}; leads.forEach(function (l) { byId[String(l._id)] = l; });
      for (var j = 0; j < batchIds.length; j++) {
        var lead = byId[String(batchIds[j])];
        if (!lead) continue;
        var needs = plannedNeeds(lead) || sidecarIds.has(String(lead._id));
        if (!needs) { stats.skippedNone++; continue; }
        await handleOne(lead);
        processed++;
        if (LIMIT && processed >= LIMIT) { console.log("\n[--limit] reached " + LIMIT + " processed leads — stopping."); start = ids.length; break; }
      }
    }
  }

  // summary
  console.log("\n=== SUMMARY ===");
  if (DRY_RUN) {
    console.log("DRY_RUN — would migrate " + stats.dryLeads + " lead(s), " + stats.dryBlobs + " blob(s), " + fmtMB(stats.dryBytes) + " MB");
  } else {
    console.log("Migrated: " + stats.migrated + " lead(s), " + stats.migratedBlobs + " blob(s), " + fmtMB(stats.migratedBytes) + " MB");
    console.log("Skipped (error): " + stats.skippedError);
    if (stats.errors.length) stats.errors.forEach(function (e) { console.log("   ! " + e.leadId + ": " + e.error); });
  }
  console.log("Skipped (nothing to migrate): " + stats.skippedNone);

  await mongoose.disconnect();
})().catch(function (e) { console.error("FATAL:", e && e.stack ? e.stack : e); process.exit(1); });

// quick check: does this lead have ANY base64 blob to migrate?
function plannedNeeds(lead) {
  if (isDataStr(lead.eoiImage) || isDataStr(lead.dealImage)) return true;
  if ((lead.dealImages || []).some(isDataStr)) return true;
  if ((lead.eoiDocuments || []).some(function (d) { return isDataStr(docUrl(d)); })) return true;
  if ((lead.dealDocuments || []).some(function (d) { return isDataStr(docUrl(d)); })) return true;
  return false;
}
