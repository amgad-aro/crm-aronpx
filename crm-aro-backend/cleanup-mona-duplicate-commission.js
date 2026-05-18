// ===========================================================================
// One-shot cleanup — mona ali mohamed duplicate commission (2026-05-18)
// ===========================================================================
// Background: PUT /api/leads/:id's needsBackfill check used to match
// status:"active" only, so editing dealDate on a DoneDeal lead whose
// commission had advanced to status:"fully_paid" caused
// ensureCommissionForLead to re-fire and create a duplicate cycle-1
// commission. Fixed in commit aa4eb0e. This script deletes the one
// duplicate it produced before the fix shipped.
//
// Hard-coded targets — DO NOT generalise this script. It is purpose-built
// for exactly one row and contains 5 verification checks. Any drift from
// the expected shape (status, customer name, cycle state, received amount)
// aborts the script before any delete happens.
//
// Safety properties:
//   - Read-and-verify FIRST, then deleteOne with a belt-and-suspenders
//     filter (_id + leadId + status) so the wrong doc cannot be hit even
//     if the _id was somehow wrong.
//   - The keeper commission's _id is hard-coded and explicitly checked
//     before delete (catastrophic-safety check).
//   - Re-verifies the keeper still exists after the delete.
//   - Re-runs the diagnostic scan to confirm allDupes.totalLeads is 0.
//   - Idempotent: re-running after the delete already happened exits
//     cleanly with "not found" — no double-delete possible.
//
// Run from the live backend dir (where .env lives):
//   cd C:\Users\solutions\Desktop\crm\crm-aro-backend-main\crm-aro-backend-main
//   node cleanup-mona-duplicate-commission.js
// ===========================================================================

"use strict";
require("dotenv").config();
var mongoose = require("mongoose");

var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI required (set in .env)");
  process.exit(1);
}

// Pulled directly from the diagnostic endpoint output, 2026-05-18 13:39 UTC.
var DUPLICATE_COMMISSION_ID = "6a0a1d8153aa22412c561e46"; // Commission B — delete
var KEEP_COMMISSION_ID      = "6a08683154378f505d463aa4"; // Commission A — NEVER TOUCH
var MONA_LEAD_ID            = "6a08683054378f505d463a66"; // mona ali mohamed

var Commission = mongoose.model(
  "Commission",
  new mongoose.Schema({}, { strict: false, timestamps: true })
);

function fail(msg) {
  console.error("");
  console.error("*** ABORT: " + msg);
  console.error("*** NO DELETE PERFORMED.");
  console.error("");
  process.exit(1);
}

(async function(){
  console.log("============================================================");
  console.log("Cleanup — mona ali mohamed duplicate commission (2026-05-18)");
  console.log("============================================================");
  console.log("");
  console.log("Target to DELETE:    " + DUPLICATE_COMMISSION_ID);
  console.log("Target to KEEP:      " + KEEP_COMMISSION_ID);
  console.log("Mona's lead _id:     " + MONA_LEAD_ID);
  console.log("");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to Atlas.");
  console.log("");

  // ---------- 1) Fetch the candidate ----------
  var doc = await Commission.findById(DUPLICATE_COMMISSION_ID).lean();
  if (!doc) {
    fail("Commission " + DUPLICATE_COMMISSION_ID + " not found. " +
         "It may have already been deleted by a previous run. " +
         "Run the diagnostic endpoint to confirm.");
  }

  console.log("Fetched candidate doc:");
  console.log("  _id:                      " + String(doc._id));
  console.log("  leadId:                   " + String(doc.leadId));
  console.log("  status:                   " + doc.status);
  console.log("  snapshot.customerName:    " + (doc.snapshot && doc.snapshot.customerName));
  console.log("  snapshot.dealDate:        " + (doc.snapshot && doc.snapshot.dealDate));
  console.log("  cycles count:             " + (doc.cycles || []).length);
  if (doc.cycles && doc.cycles[0]) {
    console.log("  cycles[0].state:          " + doc.cycles[0].state);
    console.log("  cycles[0].claimAmount:    " + doc.cycles[0].claimAmount);
    console.log("  cycles[0].receivedAmount: " + doc.cycles[0].receivedAmount);
  }
  console.log("  createdAt:                " + doc.createdAt);
  console.log("");

  // ---------- 2) Five verification checks — all must pass ----------
  console.log("Verifying preconditions:");

  // (a) leadId matches mona's lead
  if (String(doc.leadId) !== MONA_LEAD_ID) {
    fail("leadId mismatch: expected " + MONA_LEAD_ID + ", got " + String(doc.leadId));
  }
  console.log("  [pass] leadId === " + MONA_LEAD_ID);

  // (b) status === "active"
  if (doc.status !== "active") {
    fail("status mismatch: expected 'active', got '" + doc.status + "'. " +
         "Someone may have already advanced or cancelled this doc.");
  }
  console.log("  [pass] status === 'active'");

  // (c) customerName matches
  var custName = doc.snapshot && doc.snapshot.customerName;
  if (custName !== "mona ali mohamed") {
    fail("snapshot.customerName mismatch: expected 'mona ali mohamed', got '" + custName + "'");
  }
  console.log("  [pass] snapshot.customerName === 'mona ali mohamed'");

  // (d) cycles[0].receivedAmount === 0 — no real payout data
  var cycles = doc.cycles || [];
  if (!cycles[0]) {
    fail("Doc has no cycles[0]. Unexpected commission shape — refusing to delete.");
  }
  if (cycles[0].receivedAmount !== 0) {
    fail("cycles[0].receivedAmount is " + cycles[0].receivedAmount + ", expected 0. " +
         "This commission may contain real payout history — NOT safe to delete.");
  }
  console.log("  [pass] cycles[0].receivedAmount === 0 (no payout data)");

  // (e) cycles[0].state === "pending_claim"
  if (cycles[0].state !== "pending_claim") {
    fail("cycles[0].state is '" + cycles[0].state + "', expected 'pending_claim'. " +
         "Cycle has been advanced — admin may have been working on it. NOT safe to delete.");
  }
  console.log("  [pass] cycles[0].state === 'pending_claim'");

  console.log("");
  console.log("All 5 preconditions passed.");
  console.log("");

  // ---------- 3) Catastrophic safety: must not be the keeper ----------
  if (String(doc._id) === KEEP_COMMISSION_ID) {
    fail("CATASTROPHIC: candidate _id equals KEEP_COMMISSION_ID. Refusing to proceed.");
  }
  console.log("  [pass] candidate _id is NOT the keeper");
  console.log("");

  // ---------- 4) Delete with narrow filter ----------
  console.log("Deleting Commission " + DUPLICATE_COMMISSION_ID + " ...");
  var result = await Commission.deleteOne({
    _id:    new mongoose.Types.ObjectId(DUPLICATE_COMMISSION_ID),
    leadId: new mongoose.Types.ObjectId(MONA_LEAD_ID),
    status: "active"
  });
  console.log("deleteOne result: deletedCount = " + result.deletedCount);
  if (result.deletedCount !== 1) {
    fail("deletedCount was " + result.deletedCount + ", expected 1. " +
         "Doc state may have changed between fetch and delete. Investigate immediately.");
  }
  console.log("");
  console.log("OK — Commission " + DUPLICATE_COMMISSION_ID + " deleted.");
  console.log("");

  // ---------- 5) Verify keeper still exists ----------
  console.log("Verifying KEEP commission still exists and is untouched:");
  var keeper = await Commission.findById(KEEP_COMMISSION_ID).lean();
  if (!keeper) {
    fail("DISASTER: keeper commission " + KEEP_COMMISSION_ID + " is GONE after the delete. " +
         "This should be impossible — investigate manually NOW.");
  }
  console.log("  [pass] Commission " + KEEP_COMMISSION_ID + " still present");
  console.log("  keeper.status:                   " + keeper.status);
  console.log("  keeper.cycles[0].state:          " + (keeper.cycles && keeper.cycles[0] && keeper.cycles[0].state));
  console.log("  keeper.cycles[0].receivedAmount: " + (keeper.cycles && keeper.cycles[0] && keeper.cycles[0].receivedAmount));
  console.log("");

  // ---------- 6) Re-run diagnostic queries ----------
  console.log("============================================================");
  console.log("Post-delete diagnostic scan");
  console.log("============================================================");

  var monaCommissions = await Commission.find(
    { leadId: new mongoose.Types.ObjectId(MONA_LEAD_ID) },
    { _id: 1, status: 1, "snapshot.customerName": 1, "snapshot.dealDate": 1, createdAt: 1 }
  ).sort({ createdAt: 1 }).lean();
  console.log("");
  console.log("Mona's remaining commissions: " + monaCommissions.length + " (expected: 1)");
  monaCommissions.forEach(function(c, i){
    console.log("  [" + (i + 1) + "] _id=" + String(c._id) +
                " status=" + c.status +
                " dealDate=" + (c.snapshot && c.snapshot.dealDate));
  });

  var dupes = await Commission.aggregate([
    { $group: { _id: "$leadId", count: { $sum: 1 }, statuses: { $push: "$status" } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  console.log("");
  console.log("allDupes.totalLeads: " + dupes.length + " (expected: 0)");

  var dangerous = dupes.filter(function(d){
    var nonCancelled = (d.statuses || []).filter(function(s){ return s !== "cancelled"; });
    return nonCancelled.length >= 2;
  });
  console.log("dangerous.totalLeads: " + dangerous.length + " (expected: 0)");

  console.log("");
  console.log("============================================================");
  if (monaCommissions.length === 1 && dupes.length === 0 && dangerous.length === 0) {
    console.log("DONE — clean state verified.");
  } else {
    console.log("WARNING — scan results don't match expectations. Review above.");
  }
  console.log("============================================================");

  await mongoose.disconnect();
})().catch(function(e){
  console.error("FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});
