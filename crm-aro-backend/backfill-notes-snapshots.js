/**
 * Backfill frozen author-notes snapshots for existing EOIs and Deals.
 *
 *   eoiNotes  <- the EOI author's (eoiAgentId)  own active-slice notes/lastFeedback
 *   dealNotes <- the deal author's (dealAgentId) own active-slice notes/lastFeedback
 *
 * NEVER copies the shared top-level lead.notes (a prior/other agent's handoff
 * text can live there — the cross-agent leak this fix closes). When the author
 * has no slice text, the snapshot stays "" and the card shows "—".
 *
 * DRY-RUN by default (no writes). Set APPLY=1 to persist.
 *   railway run node backfill-notes-snapshots.js          # dry-run (counts)
 *   APPLY=1 railway run node backfill-notes-snapshots.js  # apply
 */
const mongoose = require("mongoose");

function norm(s){ return String(s == null ? "" : s).trim(); }
function idOf(a){ return a && a._id ? String(a._id) : String(a || ""); }

// The author's OWN active-slice text — mirrors server.js snapshotAuthorNotes'
// slice branch (backfill has no "submitted notes", so slice text is the source).
function authorSliceText(lead, authorId){
  var aid = authorId ? idOf(authorId) : "";
  if (!aid || !Array.isArray(lead.assignments)) return "";
  var slice = lead.assignments.find(function(a){
    if (!a || a.removedAt) return false;
    var sid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
    return String(sid || "") === aid;
  });
  if (!slice) return "";
  return norm(slice.notes) || norm(slice.lastFeedback);
}

(async function(){
  var APPLY = process.env.APPLY === "1";
  var uri = process.env.MONGODB_URI;
  if (!uri) { console.log("NO_MONGODB_URI_IN_ENV"); process.exit(2); }
  await mongoose.connect(uri);
  var Lead = mongoose.connection.collection("leads");
  console.log("DB:", mongoose.connection.name, "| MODE:", APPLY ? "APPLY (writing)" : "DRY-RUN (no writes)");

  var wasEOI = { $or: [
    { eoiDate:{$type:"string",$gt:""} }, { eoiApproved:true },
    { eoiImage:{$type:"string",$gt:""} }, { eoiDocuments:{$exists:true,$not:{$size:0}} }
  ]};
  var eoiScope = { $and:[ {archived:{$ne:true}}, { $or:[
    { eoiStatus:{$type:"string",$gt:""} }, { status:"EOI" },
    { $and:[{status:"Deal Cancelled"}, wasEOI] }
  ]}]};
  var dealScope = { $and:[ {archived:{$ne:true}}, { $or:[
    { status:"DoneDeal" }, { globalStatus:"donedeal" }, { dealStatus:"Deal Cancelled" }
  ]}]};

  async function run(kind, scope, authorField, targetField){
    var rows = await Lead.find(scope, { projection:{
      _id:1, notes:1, assignments:1, eoiStatus:1, status:1,
      eoiAgentId:1, dealAgentId:1, eoiNotes:1, dealNotes:1
    }}).toArray();

    var stats = { total:rows.length, willSet:0, authorEmpty:0, foreignDropped:0, alreadyOk:0, ops:[] };
    for (const l of rows) {
      var derived = authorSliceText(l, l[authorField]);   // author's own text (or "")
      var current = norm(l[targetField]);                  // existing snapshot (default "")
      var top = norm(l.notes);                             // the shared/leaky field

      if (derived && derived !== current) {
        stats.willSet++;
        if (top && top !== derived) stats.foreignDropped++; // was showing foreign/none, now author's
        stats.ops.push({ updateOne:{ filter:{_id:l._id}, update:{ $set:{ [targetField]: derived } } } });
      } else if (!derived) {
        stats.authorEmpty++;                                // no author text → snapshot stays "", card shows "—"
        // If a foreign top-level note existed, it is simply no longer read (card uses targetField).
        if (top) stats.foreignDropped++;
      } else {
        stats.alreadyOk++;                                  // derived === current, nothing to do
      }
    }

    console.log("\n==== " + kind + " ====");
    console.log("  scanned:", stats.total);
    console.log("  will set " + targetField + " from author slice:", stats.willSet);
    console.log("  author has no slice text (snapshot stays \"\" → card shows —):", stats.authorEmpty);
    console.log("  rows whose displayed note WAS foreign/none and is now author-only:", stats.foreignDropped);
    console.log("  already correct (no change):", stats.alreadyOk);

    if (APPLY && stats.ops.length) {
      var res = await Lead.bulkWrite(stats.ops, { ordered:false });
      console.log("  APPLIED bulkWrite — modified:", res.modifiedCount);
    } else if (!APPLY) {
      console.log("  (dry-run — no writes)");
    }
    return stats;
  }

  try {
    await run("EOIs  (eoiNotes  <- eoiAgentId slice)",  eoiScope,  "eoiAgentId",  "eoiNotes");
    await run("Deals (dealNotes <- dealAgentId slice)", dealScope, "dealAgentId", "dealNotes");
  } catch(e){
    console.log("BACKFILL_ERROR:", e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
