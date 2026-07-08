// One-time unset of the dormant Lead.expiresAt field (2026-07-08).
//
// Background: Lead.expiresAt was written as `now + 30 days` on almost every
// lead by POST /api/leads and POST /api/leads/inbound, but NOTHING reads it —
// there is no TTL index and no query/sort/delete references it. It is a
// mass-delete footgun: adding a TTL index on this field would delete every
// lead older than 30 days. The two write sites have been removed; this script
// clears the ~2.2k legacy values so no lead carries a stale expiry timestamp.
//
// Only $unset — this NEVER deletes a document, only removes one inert field.
// Idempotent: a second run finds 0 remaining and does nothing.
//
// Run in Railway Shell (NOT wired into deploy):
//   DRY_RUN=1 node unset-lead-expiresat.js   (preview — no writes)
//   node unset-lead-expiresat.js             (apply)
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.env.DRY_RUN === "1";
if (!MONGODB_URI) { console.error("MONGODB_URI required"); process.exit(1); }

var Lead = mongoose.model("Lead", new mongoose.Schema({}, { strict: false, timestamps: true }), "leads");

// Docs whose expiresAt is present AND non-null. In MongoDB, {$ne:null} excludes
// both null values and missing fields, so this targets exactly the legacy rows
// that still carry a timestamp — the ones we want cleared.
function withExpiresAt() { return { expiresAt: { $ne: null } }; }

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no"));

  var total     = await Lead.countDocuments({});
  var withField = await Lead.countDocuments(withExpiresAt());

  console.log("");
  console.log("BEFORE");
  console.log("  Leads total:                 " + total);
  console.log("  Leads with expiresAt set:    " + withField);

  if (DRY_RUN) {
    console.log("\nDRY_RUN — no writes. Would $unset expiresAt on " + withField + " lead(s).");
    await mongoose.disconnect();
    return;
  }

  var res = await Lead.updateMany(withExpiresAt(), { $unset: { expiresAt: "" } });
  var cleared = res.modifiedCount || res.nModified || 0;

  var remaining = await Lead.countDocuments(withExpiresAt());

  console.log("");
  console.log("APPLIED");
  console.log("  Leads expiresAt unset:       " + cleared);
  console.log("  Leads with expiresAt (after): " + remaining);
  if (remaining !== 0) console.log("  ⚠️  expected 0 remaining — re-run or investigate.");

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message); process.exit(1); });
