// Backfill Notification.eventTime for existing deal notifications.
// Source of truth: lead.dealDate (DoneDeal) / lead.eoiDate (EOI) / createdAt
// fallback. For notifications whose lead is missing (orphan) or that have
// neither dealDate nor eoiDate, fall back to the notification's own createdAt.
//
// Usage:
//   MONGODB_URI="mongodb+srv://..." node backfill-notification-eventtime.js
//   MONGODB_URI="..." DRY_RUN=1 node backfill-notification-eventtime.js
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.env.DRY_RUN === "1";
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required"); process.exit(1); }

var NotifSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var LeadSchema  = new mongoose.Schema({}, { strict: false, timestamps: true });
var Notification = mongoose.model("Notification", NotifSchema, "notifications");
var Lead         = mongoose.model("Lead", LeadSchema, "leads");

function parseToDate(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "string") {
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no"));

  // Target only deal notifications missing eventTime.
  var query = { type: "deal", $or: [ { eventTime: null }, { eventTime: { $exists: false } } ] };
  var total = await Notification.countDocuments(query);
  console.log("Deal notifications needing backfill: " + total);
  if (total === 0) { await mongoose.disconnect(); return; }

  // Pull all leadIds in one go to bulk-load the leads.
  var notifs = await Notification.find(query).select("_id leadId status createdAt").lean();

  // Deduplicate leadIds and fetch in one query.
  var leadIds = Array.from(new Set(
    notifs.map(function(n){ return String(n.leadId || ""); }).filter(function(s){ return s && mongoose.Types.ObjectId.isValid(s); })
  ));
  console.log("Unique leadIds to look up: " + leadIds.length);

  var leads = await Lead.find({ _id: { $in: leadIds } }).select("_id dealDate eoiDate createdAt").lean();
  var leadMap = {};
  leads.forEach(function(l){ leadMap[String(l._id)] = l; });
  console.log("Leads resolved: " + leads.length + " (orphans: " + (leadIds.length - leads.length) + ")");

  var resolvedFromDeal = 0, resolvedFromEoi = 0, fellBackToCreated = 0, fellBackToNotifCreated = 0;
  var ops = [];
  notifs.forEach(function(n){
    var lead = leadMap[String(n.leadId || "")];
    var picked = null;
    if (lead) {
      if (n.status === "DoneDeal") {
        picked = parseToDate(lead.dealDate) || parseToDate(lead.eoiDate) || parseToDate(lead.createdAt);
        if (parseToDate(lead.dealDate)) resolvedFromDeal++;
        else if (parseToDate(lead.eoiDate)) resolvedFromEoi++;
        else if (parseToDate(lead.createdAt)) fellBackToCreated++;
      } else {
        picked = parseToDate(lead.eoiDate) || parseToDate(lead.dealDate) || parseToDate(lead.createdAt);
        if (parseToDate(lead.eoiDate)) resolvedFromEoi++;
        else if (parseToDate(lead.dealDate)) resolvedFromDeal++;
        else if (parseToDate(lead.createdAt)) fellBackToCreated++;
      }
    }
    if (!picked) {
      picked = parseToDate(n.createdAt);
      fellBackToNotifCreated++;
    }
    if (picked) {
      ops.push({ updateOne: { filter: { _id: n._id }, update: { $set: { eventTime: picked } } } });
    }
  });

  console.log("");
  console.log("Resolved from lead.dealDate     : " + resolvedFromDeal);
  console.log("Resolved from lead.eoiDate      : " + resolvedFromEoi);
  console.log("Fell back to lead.createdAt     : " + fellBackToCreated);
  console.log("Fell back to notif.createdAt    : " + fellBackToNotifCreated);
  console.log("Total bulk ops queued           : " + ops.length);

  if (DRY_RUN) { console.log("DRY_RUN — no writes."); await mongoose.disconnect(); return; }

  if (ops.length) {
    var BATCH = 500;
    var written = 0;
    for (var i = 0; i < ops.length; i += BATCH) {
      var slice = ops.slice(i, i + BATCH);
      var result = await Notification.bulkWrite(slice, { ordered: false });
      written += (result.modifiedCount || result.nModified || 0);
      console.log("  wrote batch " + (Math.floor(i/BATCH)+1) + " / " + Math.ceil(ops.length/BATCH));
    }
    console.log("\nTotal modified: " + written);
  }

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message); process.exit(1); });
