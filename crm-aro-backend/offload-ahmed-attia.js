// One-time, MANUAL offload of the oversized "Ahmed attia" lead's eoiDocuments[]
// (~14.3 MB) into LeadArtifactArchive, dropping the Lead doc ~15.1MB -> ~0.8MB
// (safely under Mongo's 16MB hard limit). DRY-RUN by default; pass --apply.
//
// PREREQUISITE: the LeadArtifactArchive model + GET /api/leads/:id hydration must
// be DEPLOYED first, or the docs vanish from the UI until they are.
//
// Order of operations is read -> write sidecar -> VERIFY round-trip -> only then
// $unset on the lead. If verification fails it aborts BEFORE removing anything.
//
// Usage (from crm-aro-backend/, with MONGODB_URI in env or .env):
//   node offload-ahmed-attia.js            # dry-run (no writes)
//   node offload-ahmed-attia.js --apply    # perform the offload
require("dotenv").config();
const mongoose = require("mongoose");
const BSON = mongoose.mongo.BSON;   // reuse the driver's BSON (no extra dependency)

const LEAD_ID = "6a0f4f6e830c1d48bd8de774";   // Ahmed attia
const APPLY = process.argv.includes("--apply");

(async () => {
  if (!process.env.MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);
  const Lead = mongoose.connection.collection("leads");
  const Arch = mongoose.connection.collection("leadartifactarchives");
  const oid = new mongoose.Types.ObjectId(LEAD_ID);

  const lead = await Lead.findOne({ _id: oid });
  if (!lead) { console.error("lead not found:", LEAD_ID); process.exit(1); }
  // Name guard — refuse to touch the wrong doc if the _id were ever reused.
  if (lead.name !== "Ahmed attia") { console.error("NAME GUARD failed — got:", JSON.stringify(lead.name)); process.exit(1); }

  const docs = lead.eoiDocuments || [];
  const before = BSON.calculateObjectSize(lead);
  console.log("lead:", lead.name, "| size:", (before / 1048576).toFixed(2), "MB | eoiDocuments:", docs.length);
  // Guard: removing eoiDocuments must not drop the lead out of EOI views — it
  // must still qualify via another EOI signal. Conservative superset of the
  // /api/eois EOI signals (never wrongly aborts a legitimately-classified lead).
  const stillEoi = !!(lead.eoiStatus || lead.status === "EOI" || lead.eoiDate || lead.eoiApproved || lead.eoiImage);
  if (!stillEoi) { console.error("ABORT: removing eoiDocuments would drop this lead from EOI classification (no eoiStatus/status=EOI/eoiDate/eoiApproved/eoiImage)."); process.exit(1); }
  if (!docs.length) { console.log("nothing to offload (eoiDocuments empty)"); await mongoose.disconnect(); return; }
  // Resumable: a prior run may have written the sidecar but not completed the
  // $unset (e.g. the concurrency guard below aborted). The fully-done state
  // (sidecar present + lead docs already gone) is handled by the empty-docs
  // return above; we reach here only with docs still on the lead, so just
  // verify any existing sidecar matches before the apply block skips re-insert.
  const existingArch = await Arch.findOne({ leadId: oid });
  if (existingArch && (existingArch.eoiDocuments || []).length !== docs.length) {
    console.error("ABORT: existing sidecar count (" + (existingArch.eoiDocuments || []).length + ") != lead docs (" + docs.length + "). Investigate before proceeding."); process.exit(1);
  }

  if (!APPLY) {
    const projected = (before - BSON.calculateObjectSize({ eoiDocuments: docs })) / 1048576;
    console.log("[DRY-RUN]" + (existingArch ? " sidecar already present; would COMPLETE the $unset only." : " would move " + docs.length + " docs to sidecar 'leadartifactarchives'.") + " lead -> ~" + projected.toFixed(2) + " MB.");
    console.log("[DRY-RUN] no writes performed. Re-run with --apply to perform the offload.");
    await mongoose.disconnect();
    return;
  }

  // 1. write sidecar (skip if a verified one already exists from a prior run)
  if (!existingArch) {
    await Arch.insertOne({ leadId: oid, eoiDocuments: docs, reason: "16MB-limit stopgap (Ahmed attia)", createdAt: new Date(), updatedAt: new Date() });
  }
  // 2. verify round-trip BEFORE removing anything from the lead
  const saved = await Arch.findOne({ leadId: oid });
  const okCount = saved && (saved.eoiDocuments || []).length === docs.length;
  const okBytes = saved && BSON.calculateObjectSize({ eoiDocuments: saved.eoiDocuments }) === BSON.calculateObjectSize({ eoiDocuments: docs });
  if (!okCount || !okBytes) {
    console.error("VERIFY FAILED — sidecar mismatch (count:", okCount, "bytes:", okBytes, "). NOT unsetting. Investigate.");
    process.exit(1);
  }
  // 3. only now remove from the lead — guarded on the snapshot length so a
  // concurrent eoiDocuments $push between our read and here ABORTS the unset
  // (sidecar already holds the originals; safe to re-run). NOTE: count-only
  // guard — catches a pure upload (count grows) but not a net-zero
  // delete+reupload in the same window; run while uploads to this lead are
  // quiescent (it is a frozen DoneDeal record, so effectively always).
  const r = await Lead.updateOne({ _id: oid, eoiDocuments: { $size: docs.length } }, { $unset: { eoiDocuments: "" } });
  if (!r.modifiedCount) {
    console.error("ABORT: lead.eoiDocuments changed since snapshot (concurrent upload?). Sidecar is intact; re-run to complete the unset.");
    process.exit(1);
  }
  const after = await Lead.findOne({ _id: oid });
  console.log("DONE. lead now", (BSON.calculateObjectSize(after) / 1048576).toFixed(2), "MB | sidecar holds", docs.length, "docs.");
  await mongoose.disconnect();
})().catch(e => { console.error("ERR", e && e.message); process.exit(1); });
