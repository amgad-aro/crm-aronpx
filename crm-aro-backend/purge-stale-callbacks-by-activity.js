// One-shot purge of stale CallbackBell rows by the 2026-05-18 rebuild rule:
// clear callbackTime on every non-archived Lead/DailyRequest where
// lastActivityTime > callbackTime (the callback has been handled, but the
// scheduled time was never cleared).
//
// Mirrors the BE auto-clear wired into PUT /api/leads/:id and
// PUT /api/daily-requests/:id — this drains the existing backlog so the bell
// stops showing rows that the live read filter would already exclude.
//
// Usage:
//   MONGODB_URI="..." DRY_RUN=1 node purge-stale-callbacks-by-activity.js   (preview)
//   MONGODB_URI="..." node purge-stale-callbacks-by-activity.js              (apply)
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.env.DRY_RUN === "1";
if (!MONGODB_URI) { console.error("MONGODB_URI required"); process.exit(1); }

var Lead = mongoose.model("Lead", new mongoose.Schema({}, { strict: false, timestamps: true }), "leads");
var DailyRequest = mongoose.model("DailyRequest", new mongoose.Schema({}, { strict: false, timestamps: true }), "dailyrequests");

// $expr filter: rows where lastActivityTime > callbackTime (date-converted).
// $convert with onError/onNull = null keeps unparseable rows out of the
// "stale" bucket — they stay in the DB until repaired by a write.
function staleFilter() {
  return {
    archived: { $ne: true },
    callbackTime: { $type: "string", $gt: "" },
    $expr: {
      $let: {
        vars: { cbDate: { $convert: { input: "$callbackTime", to: "date", onError: null, onNull: null } } },
        in: { $and: [
          { $ne: ["$$cbDate", null] },
          { $gt: [{ $ifNull: ["$lastActivityTime", new Date(0)] }, "$$cbDate"] }
        ]}
      }
    }
  };
}

// Bell-eligible filter (pre-purge total): rows that WOULD show on the bell
// today without the lastActivityTime filter — non-archived + callbackTime set
// + status not in the bell's exclude list. Use this to report "1171 → N".
function bellEligibleFilter(excludeStatuses) {
  return {
    archived: { $ne: true },
    callbackTime: { $type: "string", $gt: "" },
    status: { $nin: excludeStatuses }
  };
}

// Bell-effective filter (post-purge view): bell-eligible AND
// lastActivityTime <= callbackTime — i.e. what the rebuilt BE endpoint
// will return.
function bellEffectiveFilter(excludeStatuses) {
  return {
    archived: { $ne: true },
    callbackTime: { $type: "string", $gt: "" },
    status: { $nin: excludeStatuses },
    $expr: {
      $let: {
        vars: { cbDate: { $convert: { input: "$callbackTime", to: "date", onError: null, onNull: null } } },
        in: { $and: [
          { $ne: ["$$cbDate", null] },
          { $lte: [{ $ifNull: ["$lastActivityTime", new Date(0)] }, "$$cbDate"] }
        ]}
      }
    }
  };
}

var LEAD_EXCLUDE = ["DoneDeal", "NotInterested", "EOI"];
var DR_EXCLUDE   = ["DoneDeal", "Done Deal", "Deal Cancelled", "NotInterested"];

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no"));

  // BEFORE
  var leadBellBefore = await Lead.countDocuments(bellEligibleFilter(LEAD_EXCLUDE));
  var drBellBefore   = await DailyRequest.countDocuments(bellEligibleFilter(DR_EXCLUDE));
  var leadStale      = await Lead.countDocuments(staleFilter());
  var drStale        = await DailyRequest.countDocuments(staleFilter());
  var leadEffBefore  = await Lead.countDocuments(bellEffectiveFilter(LEAD_EXCLUDE));
  var drEffBefore    = await DailyRequest.countDocuments(bellEffectiveFilter(DR_EXCLUDE));

  console.log("");
  console.log("BEFORE PURGE");
  console.log("  Leads bell-eligible (callbackTime set + open status): " + leadBellBefore);
  console.log("  DRs   bell-eligible:                                  " + drBellBefore);
  console.log("  Leads stale (lastActivityTime > callbackTime):        " + leadStale);
  console.log("  DRs   stale:                                          " + drStale);
  console.log("  Leads effective bell rows (post-filter):              " + leadEffBefore);
  console.log("  DRs   effective bell rows:                            " + drEffBefore);
  console.log("  COMBINED bell-eligible (before):                      " + (leadBellBefore + drBellBefore));
  console.log("  COMBINED effective bell rows:                         " + (leadEffBefore + drEffBefore));

  if (DRY_RUN) { console.log("\nDRY_RUN — no writes."); await mongoose.disconnect(); return; }

  // PURGE
  var leadRes = await Lead.updateMany(staleFilter(), { $set: { callbackTime: "" } });
  var drRes   = await DailyRequest.updateMany(staleFilter(), { $set: { callbackTime: "" } });

  console.log("");
  console.log("PURGED");
  console.log("  Leads callbackTime cleared: " + (leadRes.modifiedCount || leadRes.nModified || 0));
  console.log("  DRs   callbackTime cleared: " + (drRes.modifiedCount   || drRes.nModified   || 0));

  // AFTER
  var leadBellAfter = await Lead.countDocuments(bellEligibleFilter(LEAD_EXCLUDE));
  var drBellAfter   = await DailyRequest.countDocuments(bellEligibleFilter(DR_EXCLUDE));
  var leadEffAfter  = await Lead.countDocuments(bellEffectiveFilter(LEAD_EXCLUDE));
  var drEffAfter    = await DailyRequest.countDocuments(bellEffectiveFilter(DR_EXCLUDE));

  console.log("");
  console.log("AFTER PURGE");
  console.log("  Leads bell-eligible: " + leadBellAfter);
  console.log("  DRs   bell-eligible: " + drBellAfter);
  console.log("  Leads effective bell rows: " + leadEffAfter);
  console.log("  DRs   effective bell rows: " + drEffAfter);
  console.log("  COMBINED bell-eligible (after): " + (leadBellAfter + drBellAfter));
  console.log("  COMBINED effective bell rows:   " + (leadEffAfter + drEffAfter));

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message); process.exit(1); });
