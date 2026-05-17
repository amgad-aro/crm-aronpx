// Diagnose: how many of the 1234 callbacks on the bell are genuinely
// pending (status === "CallBack") vs. STALE (status moved on but
// callbackTime was never cleared)? READ-ONLY.
//
// Usage:
//   MONGODB_URI="mongodb+srv://..." node diagnose-stale-callbacks.js
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required"); process.exit(1); }

var LeadSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Lead = mongoose.model("Lead", LeadSchema, "leads");

var EXCLUDE = ["DoneDeal", "NotInterested", "EOI"];

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  var now = Date.now();
  var fromIso = new Date(now - 90 * 24 * 3600 * 1000).toISOString();
  var toIso   = new Date(now + 24 * 3600 * 1000).toISOString();

  var cbNonEmpty = { $type: "string", $gt: "" };
  var cbWindow   = { $type: "string", $gt: "", $gte: fromIso, $lte: toIso };

  // Bell payload — matches /api/leads/callbacks BE filter exactly
  var bellQuery = { $and: [
    { archived: { $ne: true } },
    { status: { $nin: EXCLUDE } },
    { callbackTime: cbWindow }
  ]};
  var bellTotal = await Lead.countDocuments(bellQuery);

  // Genuine: status === "CallBack"
  var genuine = await Lead.countDocuments({ $and: [
    { archived: { $ne: true } },
    { status: "CallBack" },
    { callbackTime: cbWindow }
  ]});

  // Stale: callbackTime non-empty + status is anything ELSE that's not in
  // the exclude list (NewLead, Potential, HotCase, MeetingDone, NoAnswer, etc.)
  var staleByStatus = {};
  var statuses = ["NewLead","Potential","HotCase","MeetingDone","NoAnswer"];
  for (var i = 0; i < statuses.length; i++) {
    var s = statuses[i];
    staleByStatus[s] = await Lead.countDocuments({ $and: [
      { archived: { $ne: true } },
      { status: s },
      { callbackTime: cbWindow }
    ]});
  }

  // Same breakdown OUTSIDE the bell's 90d window — the broader hygiene picture
  var bellTotalAll = await Lead.countDocuments({ $and: [
    { archived: { $ne: true } },
    { status: { $nin: EXCLUDE } },
    { callbackTime: cbNonEmpty }
  ]});
  var genuineAll = await Lead.countDocuments({ $and: [
    { archived: { $ne: true } },
    { status: "CallBack" },
    { callbackTime: cbNonEmpty }
  ]});

  // Overdue subset of genuine — callbackTime < now
  var nowIso = new Date(now).toISOString();
  var overdueGenuine = await Lead.countDocuments({ $and: [
    { archived: { $ne: true } },
    { status: "CallBack" },
    { callbackTime: { $type: "string", $gt: "", $lt: nowIso } }
  ]});

  console.log("=".repeat(70));
  console.log("CALLBACK BELL DIAGNOSTIC");
  console.log("=".repeat(70));
  console.log("Bell window: " + fromIso + "  ..  " + toIso);
  console.log("");
  console.log("WITHIN BELL WINDOW (90d back, 24h fwd):");
  console.log("  Total bell payload                   : " + bellTotal);
  console.log("  Genuine (status === CallBack)        : " + genuine);
  console.log("  STALE (callbackTime + wrong status)  : " + (bellTotal - genuine));
  console.log("  Breakdown of STALE by current status:");
  Object.keys(staleByStatus).forEach(function(k){
    console.log("    " + k.padEnd(14) + ": " + staleByStatus[k]);
  });
  console.log("");
  console.log("ENTIRE COLLECTION (no date window):");
  console.log("  Total non-archived w/ callbackTime + open status : " + bellTotalAll);
  console.log("  Genuine (status === CallBack, all-time)          : " + genuineAll);
  console.log("");
  console.log("OVERDUE (genuine + callbackTime < now): " + overdueGenuine);
  console.log("");

  // Sample 5 stale rows for spot-check
  console.log("Sample STALE rows (status moved on but callbackTime set):");
  var sample = await Lead.find({ $and: [
    { archived: { $ne: true } },
    { status: { $nin: EXCLUDE.concat(["CallBack"]) } },
    { callbackTime: cbWindow }
  ]}).select("name status callbackTime updatedAt").sort({ updatedAt: -1 }).limit(5).lean();
  if (!sample.length) console.log("  (none)");
  sample.forEach(function(l){
    console.log("  " + String(l.callbackTime).slice(0,16) + "  status=" + (l.status||"").padEnd(12) +
                "  updated=" + (l.updatedAt ? l.updatedAt.toISOString().slice(0,16) : "?") + "  " + (l.name||""));
  });

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message); process.exit(1); });
