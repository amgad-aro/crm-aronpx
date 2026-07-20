/*
 * One-off data correction (owner-confirmed 2026-07-20).
 *
 * Corrects the `project` field on two specific EOI leads, resolves a developer
 * for one of them via the normalized Developers flow, and unifies a misspelled
 * "Hacienda Ras El Hekma" project to the canonical "Hacienda Ras El Hikma".
 *
 * SAFETY: dry-run by default (no writes). Every target is matched by leadId AND
 * a name check AND the expected CURRENT project value; if any guard fails the
 * record is SKIPPED (never blind-written). Pass --confirm to apply.
 *
 *   MONGODB_URI="..." node correct-eoi-projects.js            # dry run
 *   MONGODB_URI="..." node correct-eoi-projects.js --confirm  # apply
 *
 * Does NOT require server.js/models.js (would boot the server) — defines its
 * own minimal models against the same `leads` / `developers` collections.
 */
"use strict";
var mongoose = require("mongoose");

var CONFIRM = process.argv.indexOf("--confirm") !== -1;
var URI = process.env.MONGODB_URI;
if (!URI) { console.error("ERROR: set MONGODB_URI env var"); process.exit(1); }

// Mirror server.js normalizeDeveloperName exactly (line ~1650).
function normalizeDeveloperName(s){ return String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ""); }

// Minimal models on the existing collections (strict:false so we never drop
// fields we don't declare when saving).
var Lead = mongoose.model("Lead", new mongoose.Schema({
  name: String, project: String, eoiStatus: String, dealStatus: String,
  status: String, archived: Boolean, leadId: Number,
  developerId: mongoose.Schema.Types.ObjectId, developerPending: String
}, { strict: false, collection: "leads" }));
var Developer = mongoose.model("Developer", new mongoose.Schema({
  name: String, normalizedName: String
}, { strict: false, collection: "developers" }));

var CANON_HACIENDA = "Hacienda Ras El Hikma";

function fmtLead(l){
  if (!l) return "(not found)";
  return "leadId=" + l.leadId + " | name=\"" + (l.name || "") + "\" | project=\"" + (l.project || "") + "\"" +
    " | eoiStatus=\"" + (l.eoiStatus || "") + "\" | developerId=" + (l.developerId ? String(l.developerId) : "null");
}

// Guarded single-lead project fix. Returns a result record.
async function fixLeadProject(leadId, nameNeedle, expectFrom, to){
  var l = await Lead.findOne({ leadId: leadId });
  var r = { leadId: leadId, expectFrom: expectFrom, to: to, before: l ? l.project : null, action: "" };
  if (!l) { r.action = "SKIP (lead not found)"; return r; }
  console.log("  BEFORE  " + fmtLead(l));
  if (nameNeedle && String(l.name || "").toLowerCase().indexOf(nameNeedle.toLowerCase()) === -1) {
    r.action = "SKIP (name guard failed: expected to contain \"" + nameNeedle + "\")"; return r;
  }
  if ((l.project || "") === to) { r.action = "SKIP (already \"" + to + "\")"; return r; }
  if ((l.project || "").trim() !== expectFrom) {
    r.action = "SKIP (value guard failed: expected current project \"" + expectFrom + "\", found \"" + (l.project || "") + "\")"; return r;
  }
  if (CONFIRM) { l.project = to; await l.save(); r.after = l.project; r.action = "UPDATED"; }
  else { r.action = "WOULD UPDATE (dry run)"; }
  return r;
}

// Resolve (find or create) a Developer via the normalized flow, then link to a lead.
async function resolveAndLinkDeveloper(leadId, devName){
  var norm = normalizeDeveloperName(devName);
  var dev = await Developer.findOne({ normalizedName: norm });
  var r = { leadId: leadId, devName: devName, norm: norm, existed: !!dev, action: "" };
  if (dev) { console.log("  Developer \"" + devName + "\" exists: _id=" + dev._id + " name=\"" + dev.name + "\""); }
  else { console.log("  Developer \"" + devName + "\" (norm=\"" + norm + "\") NOT found — would create"); }
  var l = await Lead.findOne({ leadId: leadId });
  if (!l) { r.action = "SKIP (lead not found)"; return r; }
  if (l.developerId && dev && String(l.developerId) === String(dev._id)) { r.action = "SKIP (already linked)"; return r; }
  if (CONFIRM) {
    if (!dev) {
      try { dev = await Developer.create({ name: devName, normalizedName: norm }); }
      catch (e) { if (e && e.code === 11000) dev = await Developer.findOne({ normalizedName: norm }); else throw e; }
      r.created = true;
    }
    l.developerId = dev._id;
    if (l.developerPending) l.developerPending = ""; // clear any pending free-text now that it's resolved
    await l.save();
    r.developerId = String(dev._id); r.action = "LINKED" + (r.created ? " (dev created)" : "");
  } else {
    r.action = "WOULD LINK" + (dev ? "" : " (after creating dev)") + " (dry run)";
  }
  return r;
}

async function printEoiDistinctProjects(){
  // "EOI leads" = active (non-archived) leads currently in the EOI stage:
  // eoiStatus Pending/Approved (not cancelled), matching the EOI page scope.
  var eoiLeads = await Lead.find({
    archived: { $ne: true },
    eoiStatus: { $in: ["Pending", "Approved"] }
  }).select("project").lean();
  var counts = {};
  eoiLeads.forEach(function(l){ var p = (l.project || "").trim() || "(blank)"; counts[p] = (counts[p] || 0) + 1; });
  var rows = Object.keys(counts).map(function(k){ return { project: k, n: counts[k] }; })
    .sort(function(a, b){ return a.project.localeCompare(b.project); });
  console.log("\n===== DISTINCT PROJECTS ON EOI LEADS (" + eoiLeads.length + " active EOI leads, " + rows.length + " distinct) =====");
  rows.forEach(function(r){ console.log("  " + String(r.n).padStart(4) + "  " + r.project); });
}

(async function main(){
  var masked = URI.replace(/mongodb(\+srv)?:\/\/[^@]*@/, "mongodb$1://***:***@");
  console.log("Connecting to: " + masked);
  console.log("MODE: " + (CONFIRM ? "*** CONFIRM (writes enabled) ***" : "dry run (no writes)") + "\n");
  await mongoose.connect(URI, { dbName: "test" });

  console.log("===== #1  leadId 50016 (mostashar hassan): \"Naia\" -> \"Naia Bay\" =====");
  var r1 = await fixLeadProject(50016, "mostashar hassan", "Naia", "Naia Bay");
  console.log("  => " + r1.action + (r1.after ? "  AFTER project=\"" + r1.after + "\"" : "") + "\n");

  console.log("===== #2  leadId 1036 (Alaa Youssef): \"Naia Sahel\" -> \"" + CANON_HACIENDA + "\" + developer \"Palm Hills\" =====");
  var r2 = await fixLeadProject(1036, "Alaa Youssef", "Naia Sahel", CANON_HACIENDA);
  console.log("  => " + r2.action + (r2.after ? "  AFTER project=\"" + r2.after + "\"" : ""));
  var r2dev = await resolveAndLinkDeveloper(1036, "Palm Hills");
  console.log("  => " + r2dev.action + "\n");

  console.log("===== #3  Unify misspelled \"Hacienda Ras El Hekma\" -> \"" + CANON_HACIENDA + "\" (scoped) =====");
  // Visibility: list every distinct project containing "hacienda" (case-insensitive).
  var hac = await Lead.find({ project: { $regex: "hacienda", $options: "i" } }).select("leadId name project eoiStatus").lean();
  var hacDistinct = {};
  hac.forEach(function(l){ var p = (l.project || "").trim(); hacDistinct[p] = (hacDistinct[p] || 0) + 1; });
  console.log("  All 'hacienda' project variants found (" + hac.length + " leads):");
  Object.keys(hacDistinct).sort().forEach(function(k){ console.log("    " + String(hacDistinct[k]).padStart(3) + "  \"" + k + "\""); });
  // Target: exact (case-insensitive) match of the misspelled variant, excluding
  // anything already canonical.
  var targets = hac.filter(function(l){
    var p = (l.project || "").trim();
    return p.toLowerCase() === "hacienda ras el hekma" && p !== CANON_HACIENDA;
  });
  console.log("  Leads to unify (exact \"Hacienda Ras El Hekma\"): " + targets.length);
  for (var i = 0; i < targets.length; i++){
    var t = targets[i];
    console.log("    BEFORE  " + fmtLead(t) + "   ->   AFTER project=\"" + CANON_HACIENDA + "\"");
    if (CONFIRM) { await Lead.updateOne({ _id: t._id }, { $set: { project: CANON_HACIENDA } }); }
  }
  console.log("  => " + (CONFIRM ? "UPDATED " + targets.length : "WOULD UPDATE " + targets.length + " (dry run)") + "\n");

  await printEoiDistinctProjects();

  await mongoose.disconnect();
  console.log("\nDone" + (CONFIRM ? "" : " (dry run — no changes written; re-run with --confirm to apply)") + ".");
})().catch(function(e){ console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });
