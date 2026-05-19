// Backfill Notification.eventTime for ROTATION notifications that were
// incorrectly stamped with the lead's createdAt / eoiDate / dealDate by the
// POST /api/notifications eventTime-population block (regression introduced
// 2026-05-18, fixed by gating that block to type === "deal").
//
// Strategy: for any rotation notification where eventTime is set AND differs
// from createdAt, reset eventTime to createdAt. createdAt is the row's insert
// time, which for rotation notifications equals the moment the rotation
// happened (the POST fires immediately after /api/leads/:id/rotate succeeds).
//
// Safe to re-run — idempotent (the second run finds 0 rows because the first
// run already aligned eventTime with createdAt).
//
// Touches ONLY documents with type === "rotation". Deal / callback / offsite /
// commission / attendance notifications are not scanned and not modified.
//
// Usage:
//   MONGODB_URI="mongodb+srv://..." node backfill-rotation-eventtime.js
//   MONGODB_URI="..." node backfill-rotation-eventtime.js --dry-run
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.argv.indexOf("--dry-run") !== -1;
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required"); process.exit(1); }

var NotifSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Notification = mongoose.model("Notification", NotifSchema, "notifications");

function toMs(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.getTime();
  if (typeof v === "string" || typeof v === "number") {
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d.getTime();
  }
  return null;
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no"));

  // Scan all rotation rows with a non-null eventTime. The "differs from
  // createdAt" check happens in JS so we don't have to express it in a Mongo
  // query (cross-field comparison would need $expr). Rotation rows are a
  // bounded slice of the collection.
  var query = { type: "rotation", eventTime: { $ne: null } };
  var totalScanned = await Notification.countDocuments(query);
  console.log("Rotation notifications scanned: " + totalScanned);
  if (totalScanned === 0) { await mongoose.disconnect(); return; }

  var cursor = Notification.find(query).select("_id eventTime createdAt").lean().cursor();
  var ops = [];
  var skippedAlreadyAligned = 0;
  var skippedNoCreatedAt = 0;
  var skippedUnparseable = 0;
  var toUpdate = 0;

  for (var doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    var evMs = toMs(doc.eventTime);
    var caMs = toMs(doc.createdAt);
    if (caMs === null) { skippedNoCreatedAt++; continue; }
    if (evMs === null) { skippedUnparseable++; continue; }
    if (evMs === caMs) { skippedAlreadyAligned++; continue; }
    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { eventTime: doc.createdAt } } } });
    toUpdate++;
  }

  console.log("");
  console.log("Already aligned (eventTime === createdAt) : " + skippedAlreadyAligned);
  console.log("No createdAt (skipped)                    : " + skippedNoCreatedAt);
  console.log("Unparseable eventTime (skipped)           : " + skippedUnparseable);
  console.log("Rows queued for update                    : " + toUpdate);

  if (DRY_RUN) { console.log("\nDRY_RUN — no writes performed."); await mongoose.disconnect(); return; }

  if (ops.length) {
    var BATCH = 500;
    var written = 0;
    for (var i = 0; i < ops.length; i += BATCH) {
      var slice = ops.slice(i, i + BATCH);
      var result = await Notification.bulkWrite(slice, { ordered: false });
      written += (result.modifiedCount || result.nModified || 0);
      console.log("  wrote batch " + (Math.floor(i / BATCH) + 1) + " / " + Math.ceil(ops.length / BATCH));
    }
    console.log("\nTotal modified: " + written);
  }

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message); process.exit(1); });
