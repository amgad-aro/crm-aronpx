// One-shot backfill — flip "zombie active" commissions to fully_paid.
//
// Background: post-R-5, the rollover guard in the stage-advance handler
// required `expectedTotal > 0`, but expectedTotal is no longer admin-edited
// (always 0). That trapped every commission in status="active" forever even
// after all cycles reached terminal state. The guard was relaxed in commit
// 9f77c67; this script rolls the already-stuck rows out of "active".
//
// USAGE — run ONCE manually after the guard fix deploy:
//   cd crm-aro-backend && node backfill-zombie-commissions.js
//
// OR via the admin HTTP trigger (Diagnostics page button):
//   POST /api/admin/run-backfill?type=zombies
// (same implementation — both routes call runZombieBackfill in server.js)
//
// READ-MOSTLY: only mutates Commission.status from "active" → "fully_paid"
// for rows where all cycles are terminal and the cycles array is non-empty.
// Idempotent — re-running finds nothing to update.

"use strict";

// require server.js triggers mongoose.connect + seeders. The listen-guard
// at the bottom of server.js prevents the HTTP listener from starting since
// this file is require.main, not server.js.
var serverExports = require("./server.js");
var mongoose      = require("mongoose");

var runZombieBackfill = serverExports.runZombieBackfill;
if (typeof runZombieBackfill !== "function") {
  console.error("FATAL: server.js did not export runZombieBackfill — check the module.exports block at the bottom of server.js");
  process.exit(1);
}

async function waitForConnection() {
  if (mongoose.connection.readyState === 1) return;
  await new Promise(function(resolve, reject){
    var done = false;
    mongoose.connection.once("open", function(){ if (!done) { done = true; resolve(); } });
    mongoose.connection.once("error", function(err){ if (!done) { done = true; reject(err); } });
    setTimeout(function(){ if (!done) { done = true; reject(new Error("connection timeout (30s)")); } }, 30000);
  });
}

async function main() {
  console.log("Waiting for MongoDB connection (via server.js require)…");
  await waitForConnection();
  console.log("Connected.\n");

  var summary = await runZombieBackfill();

  console.log("=== Zombie candidates (all cycles terminal, status still active) ===");
  console.log("Scanned active commissions:  " + summary.scanned);
  console.log("To flip:                     " + summary.candidates.length);
  console.log("Skipped (empty cycles):      " + summary.skipped.emptyCycles);
  console.log("Skipped (non-terminal left): " + summary.skipped.hasNonTerminal);
  console.log("");

  if (summary.candidates.length === 0) {
    console.log("Nothing to do. Exiting cleanly.");
    await mongoose.disconnect();
    return;
  }

  console.log("Listing each zombie:");
  summary.candidates.forEach(function(z, idx){
    console.log("  " + (idx + 1) + ") " + z.commissionId + "  \"" + z.customerName + "\"" +
                (z.projectName ? "  (" + z.projectName + ")" : "") +
                "  cycles=" + z.cycleCount + "  states=[" + z.cycleStates.join(", ") + "]" +
                "  flipped=" + (z.flipped ? "yes" : "NO"));
  });
  console.log("");

  console.log("=== Summary ===");
  console.log("Rolled " + summary.updated + " zombie commission" + (summary.updated === 1 ? "" : "s") + " to fully_paid.");
  if (summary.notUpdated > 0) {
    console.log("(" + summary.notUpdated + " candidate(s) were not updated — likely raced with a concurrent write; re-run to retry.)");
  }

  await mongoose.disconnect();
}

main().catch(function(e){
  console.error("FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});
