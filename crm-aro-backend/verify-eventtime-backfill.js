// Verify: backfilled deal notifications have eventTime, and that the
// eventTime spread differs meaningfully from the createdAt spread (i.e.
// the dropdown will now render distinct "X days ago" labels per row).
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}
var mongoose = require("mongoose");
var Notification = mongoose.model("Notification", new mongoose.Schema({}, { strict: false, timestamps: true }), "notifications");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  var rows = await Notification.find({ type: "deal" }).select("_id status leadName createdAt eventTime").sort({ createdAt: -1 }).limit(20).lean();
  console.log("Most recent 20 deal notifications:");
  console.log("".padEnd(20) + "createdAt".padEnd(28) + "eventTime".padEnd(28) + "leadName");
  rows.forEach(function(r){
    var ct = r.createdAt ? r.createdAt.toISOString().slice(0,19) : "—";
    var et = r.eventTime ? r.eventTime.toISOString().slice(0,19) : "—";
    console.log((r.status||"").padEnd(20) + ct.padEnd(28) + et.padEnd(28) + (r.leadName||""));
  });

  var missing = await Notification.countDocuments({ type: "deal", $or: [{ eventTime: null }, { eventTime: { $exists: false } }] });
  console.log("\nDeal notifications still missing eventTime: " + missing);

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message); process.exit(1); });
