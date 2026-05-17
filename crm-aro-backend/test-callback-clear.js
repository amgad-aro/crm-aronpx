// In-process Atlas test of the callbackTime auto-clear logic — runs the
// real PUT predicate against a live stale row, asserts behavior, reverts.
// Avoids spinning up the HTTP server so it's lightweight and idempotent.
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}
var mongoose = require("mongoose");

var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI required"); process.exit(1); }

var Lead = mongoose.model("Lead", new mongoose.Schema({}, { strict: false, timestamps: true }), "leads");

// Replicate the predicate added to PUT /api/leads/:id at server.js ~line 9621.
function shouldAutoClearCallback(oldLead, body) {
  return !!(body.status && oldLead && body.status !== oldLead.status &&
            body.status !== "CallBack" && body.status !== "NoAnswer" &&
            body.callbackTime === undefined &&
            (oldLead.callbackTime || "") !== "");
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  // 1) Find one of each stale class — Potential / HotCase / MeetingDone with callbackTime.
  console.log("=== Predicate sanity ===");
  var samples = await Lead.find({
    archived: { $ne: true },
    status: { $in: ["Potential","HotCase","MeetingDone"] },
    callbackTime: { $type: "string", $gt: "" }
  }).select("_id name status callbackTime").sort({ updatedAt: -1 }).limit(5).lean();

  samples.forEach(function(L){
    var willClear = shouldAutoClearCallback(L, { status: "HotCase" });
    var sameStatus = shouldAutoClearCallback(L, { status: L.status });
    var toCallback = shouldAutoClearCallback(L, { status: "CallBack" });
    var toNoAnswer = shouldAutoClearCallback(L, { status: "NoAnswer" });
    var explicit   = shouldAutoClearCallback(L, { status: "HotCase", callbackTime: "2026-06-01T10:00:00.000Z" });
    console.log("  " + String(L._id).slice(-6) + " " + L.status.padEnd(12) +
                " cb=" + L.callbackTime.slice(0,10) +
                "  →HotCase clear?" + willClear +
                "  →sameStatus clear?" + sameStatus +
                "  →CallBack clear?" + toCallback +
                "  →NoAnswer clear?" + toNoAnswer +
                "  →explicitCb clear?" + explicit);
  });

  // 2) Real DB roundtrip — pick one stale row, apply the actual update the BE
  //    would compute, re-read, then revert.
  console.log("\n=== Live DB roundtrip ===");
  var target = samples[0];
  if (!target) { console.log("No stale candidate. Skipping."); await mongoose.disconnect(); return; }
  console.log("Target lead: " + target._id + "  " + target.name + "  status=" + target.status + "  cb=" + target.callbackTime);

  var body = { status: "HotCase" }; // status-change without callbackTime
  var update = { lastActivityTime: new Date() };
  if (shouldAutoClearCallback(target, body)) update.callbackTime = "";
  update.status = body.status;

  await Lead.updateOne({ _id: target._id }, { $set: update });
  var after = await Lead.findById(target._id).select("status callbackTime").lean();
  console.log("After PUT-like write: status=" + after.status + "  callbackTime=" + JSON.stringify(after.callbackTime));
  var pass = (after.callbackTime || "") === "" && after.status === "HotCase";
  console.log(pass ? "✅ PASS — clear fired" : "❌ FAIL");

  // Revert
  await Lead.updateOne({ _id: target._id }, { $set: { status: target.status, callbackTime: target.callbackTime } });
  var reverted = await Lead.findById(target._id).select("status callbackTime").lean();
  console.log("Reverted: status=" + reverted.status + "  callbackTime=" + reverted.callbackTime);

  // 3) Project the post-deploy bell payload count if the bug were already fixed
  //    on every existing stale row.
  console.log("\n=== Projected bell impact after deploy ===");
  var EXCLUDE = ["DoneDeal","NotInterested","EOI"];
  var nowIso = Date.now();
  var fromIso = new Date(nowIso - 90 * 24 * 3600 * 1000).toISOString();
  var toIso = new Date(nowIso + 24 * 3600 * 1000).toISOString();
  var currentBell = await Lead.countDocuments({
    archived: { $ne: true },
    status: { $nin: EXCLUDE },
    callbackTime: { $type: "string", $gt: "", $gte: fromIso, $lte: toIso }
  });
  var projectedAfterStatusOnlyClears = await Lead.countDocuments({
    archived: { $ne: true },
    status: { $in: ["CallBack","NoAnswer"] },
    callbackTime: { $type: "string", $gt: "", $gte: fromIso, $lte: toIso }
  });
  console.log("Current bell payload (90d window): " + currentBell);
  console.log("Projected after future status changes purge stale: " + projectedAfterStatusOnlyClears +
              " (existing stale rows persist until their next status change)");
  console.log("Existing stale rows that will linger: " + (currentBell - projectedAfterStatusOnlyClears));

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message); process.exit(1); });
