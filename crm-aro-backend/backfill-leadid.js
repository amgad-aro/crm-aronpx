// ONE-TIME backfill — assign permanent sequential Lead IDs (1000..N) to every
// lead that has EVER been EOI or DoneDeal, in first-frozen chronological order.
//
// Context (Feature A, redesigned): a Lead's permanent `leadId` is minted the
// first time it enters EOI or DoneDeal (server.js mintLeadIdIfEntering). The
// earlier build wrongly minted an id on EVERY lead at creation; this script
// resets that: it CLEARS all existing numeric ids, then re-derives clean
// sequential ids (starting at 1000) for the leads that genuinely belong in the
// ID space — anything that ever entered EOI/DoneDeal (the id must survive later
// reverts/cancels, so we detect "ever frozen", not just current status).
//
// Ordering: by the FIRST time each lead froze = earliest of (eoiDate, dealDate),
// falling back to createdAt. So the oldest deal/EOI gets #01000, next #01001, …
//
// Live mints (new EOI/DoneDeal transitions) come from the Counter, floored at
// 50000 — a separate range that never collides with this 1000.. backfill.
//
// ⚠️ ONE-TIME — DO NOT RE-RUN after go-live. It clears ALL numeric ids and
// renumbers, so re-running after real post-backfill deals exist would CHANGE
// their (meant-to-be-permanent) ids. Run it once, during the same maintenance
// window as the Feature B backfill. Use DRY_RUN first to preview.
//
// USAGE — run MANUALLY from crm-aro-backend/ (MONGODB_URI read from .env):
//   Preview (no writes — do this first):
//     DRY_RUN=1 node backfill-leadid.js
//   Apply (ONE TIME):
//     node backfill-leadid.js
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.env.DRY_RUN === "1";
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required (set it in .env or inline)"); process.exit(1); }

// Minimal strict:false models. No explicit collection name — mongoose pluralizes
// to the same collections server.js uses ("leads" / "counters").
var Lead    = mongoose.model("Lead", new mongoose.Schema({}, { strict: false, timestamps: true }));
var Counter = mongoose.model("Counter", new mongoose.Schema({ _id: String, seq: Number }, { versionKey: false }));

var START = 1000;   // backfill numbering starts here
var FLOOR = 50000;  // live-mint counter floor (matches seedLeadIdCounter in server.js)

function parseDate(v) { if (!v) return null; var d = new Date(v); return isNaN(d.getTime()) ? null : d; }
// Earliest "froze" moment: min of eoiDate/dealDate, else createdAt, else epoch.
function firstFrozenMs(l) {
  var c = [parseDate(l.eoiDate), parseDate(l.dealDate)].filter(Boolean).map(function(d){ return d.getTime(); });
  if (c.length) return Math.min.apply(null, c);
  var cr = parseDate(l.createdAt);
  return cr ? cr.getTime() : 0;
}

// "Ever entered EOI/DoneDeal" — current status OR any durable marker of a past
// transition (eoiDate/dealDate are stamped on first freeze and never cleared;
// preEoiStatus/preDealStatus + cancel markers capture reverted/cancelled ones).
var EVER_FROZEN = {
  $or: [
    { status: "EOI" }, { status: "DoneDeal" },
    { globalStatus: "eoi" }, { globalStatus: "donedeal" },
    { eoiDate:   { $nin: [null, ""] } },
    { dealDate:  { $nin: [null, ""] } },
    { eoiStatus:  "EOI Cancelled" },
    { dealStatus: "Deal Cancelled" },
    { preEoiStatus:  { $nin: [null, ""] } },
    { preDealStatus: { $nin: [null, ""] } }
  ]
};

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no"));

  var withId  = await Lead.countDocuments({ leadId: { $type: "number" } });
  var targets = await Lead.find(EVER_FROZEN)
    .select("_id eoiDate dealDate createdAt status globalStatus")
    .lean();
  targets.sort(function(a, b){ return firstFrozenMs(a) - firstFrozenMs(b); });

  console.log("");
  console.log("Leads currently carrying a numeric id (will be CLEARED): " + withId);
  console.log("Leads ever EOI/DoneDeal (will be numbered " + START + "..): " + targets.length);
  if (targets.length) {
    console.log("  first-frozen range: " +
      new Date(firstFrozenMs(targets[0])).toISOString().slice(0,10) + "  ->  " +
      new Date(firstFrozenMs(targets[targets.length-1])).toISOString().slice(0,10));
    console.log("  ID range to assign: " + START + " .. " + (START + targets.length - 1));
  }

  if (DRY_RUN) {
    console.log("\nDRY_RUN — no writes. Preview only.");
    await mongoose.disconnect();
    return;
  }

  // Step 1 — clear ALL existing numeric ids (re-derived cleanly below).
  var cleared = await Lead.updateMany({ leadId: { $type: "number" } }, { $set: { leadId: null } });
  console.log("\nCleared " + (cleared.modifiedCount != null ? cleared.modifiedCount : (cleared.nModified || 0)) + " existing id(s).");

  // Step 2 — assign 1000..N in first-frozen order.
  var ops = targets.map(function(l, i){
    return { updateOne: { filter: { _id: l._id }, update: { $set: { leadId: START + i } } } };
  });
  var BATCH = 500, written = 0;
  for (var i = 0; i < ops.length; i += BATCH) {
    var r = await Lead.bulkWrite(ops.slice(i, i + BATCH), { ordered: false });
    written += (r.modifiedCount != null ? r.modifiedCount : (r.nModified || 0));
    console.log("  assigned " + Math.min(i + BATCH, ops.length) + " / " + ops.length);
  }
  var maxAssigned = targets.length ? (START + targets.length - 1) : (START - 1);

  // Step 3 — ensure the live-mint counter floors at 50000 so future EOI/DoneDeal
  // transitions never collide with the 1000.. range above. Never lowered.
  var cdoc = await Counter.findOne({ _id: "leadId" }).lean();
  var curSeq = cdoc ? Number(cdoc.seq || 0) : 0;
  if (curSeq < FLOOR) {
    await Counter.updateOne({ _id: "leadId" }, { $set: { seq: FLOOR } }, { upsert: true });
    curSeq = FLOOR;
  }

  console.log("");
  console.log("=== Summary ===");
  console.log("IDs assigned:      " + written + " (range " + START + ".." + maxAssigned + ")");
  console.log("Live-mint counter: " + curSeq + " (next live id = " + (curSeq + 1) + ")");

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });
