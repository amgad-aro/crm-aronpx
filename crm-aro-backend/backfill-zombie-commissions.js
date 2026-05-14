// One-shot backfill — flip "zombie active" commissions to fully_paid.
//
// Background: post-R-5, the rollover guard in the stage-advance handler
// required `expectedTotal > 0`, but expectedTotal is no longer admin-edited
// (always 0). That trapped every commission in status="active" forever even
// after all cycles reached terminal state. The guard was relaxed in commit
// {THIS_COMMIT}; this script rolls the already-stuck rows out of "active".
//
// USAGE — run ONCE manually after the deploy that lands the guard fix:
//   cd crm-aro-backend && node backfill-zombie-commissions.js
//
// READ-MOSTLY: only mutates Commission.status from "active" → "fully_paid"
// for rows where all cycles are terminal and the cycles array is non-empty.
// Does not touch cycles, payouts, snapshot, or any other field. Idempotent —
// re-running finds nothing to update.

"use strict";

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required"); process.exit(1); }

// Permissive schema — the production server.js owns the canonical shape; here
// we only need to read `status`, `cycles[].state`, `snapshot.customerName`,
// and write back `status`.
var CommissionSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Commission = mongoose.model("Commission", CommissionSchema);

function isTerminal(state) {
  return state === "paid_to_team" || state === "cancelled";
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected.\n");

  var actives = await Commission.find({ status: "active" })
    .select("snapshot.customerName snapshot.projectName cycles status")
    .lean();
  console.log("Found " + actives.length + " active commissions.");

  var toFlip = [];
  var skipped = { emptyCycles: 0, hasNonTerminal: 0 };
  for (var i = 0; i < actives.length; i++) {
    var c = actives[i];
    var cycles = Array.isArray(c.cycles) ? c.cycles : [];
    if (cycles.length === 0) { skipped.emptyCycles++; continue; }
    var allTerminal = cycles.every(function(cy){ return isTerminal(cy && cy.state); });
    if (!allTerminal) { skipped.hasNonTerminal++; continue; }
    toFlip.push({
      _id: c._id,
      customerName: (c.snapshot && c.snapshot.customerName) || "(unknown)",
      projectName:  (c.snapshot && c.snapshot.projectName)  || "",
      cycleCount:   cycles.length,
      cycleStates:  cycles.map(function(cy){ return cy && cy.state; })
    });
  }

  console.log("");
  console.log("=== Zombie candidates (all cycles terminal, status still active) ===");
  console.log("To flip: " + toFlip.length);
  console.log("Skipped (empty cycles array — stay active):     " + skipped.emptyCycles);
  console.log("Skipped (still has non-terminal cycles):        " + skipped.hasNonTerminal);
  console.log("");
  if (toFlip.length === 0) {
    console.log("Nothing to do. Exiting cleanly.");
    await mongoose.disconnect();
    return;
  }

  console.log("Listing each zombie before update:");
  toFlip.forEach(function(z, idx){
    console.log("  " + (idx + 1) + ") " + String(z._id) + "  \"" + z.customerName + "\"" +
                (z.projectName ? "  (" + z.projectName + ")" : "") +
                "  cycles=" + z.cycleCount + "  states=[" + z.cycleStates.join(", ") + "]");
  });
  console.log("");

  // Batch update — one $set per id. Mongoose's updateOne is fast enough at
  // this scale (expected dozens, not thousands).
  var updated = 0;
  for (var k = 0; k < toFlip.length; k++) {
    var r = await Commission.updateOne(
      { _id: toFlip[k]._id, status: "active" },
      { $set: { status: "fully_paid" } }
    );
    if (r && (r.modifiedCount === 1 || r.nModified === 1)) updated++;
  }

  console.log("=== Summary ===");
  console.log("Rolled " + updated + " zombie commission" + (updated === 1 ? "" : "s") + " to fully_paid.");
  console.log("(" + (toFlip.length - updated) + " target rows were not updated — likely raced with a concurrent write; re-run to retry.)");

  await mongoose.disconnect();
}

main().catch(function(e){
  console.error("FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});
