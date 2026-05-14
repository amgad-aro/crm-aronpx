// One-shot backfill — create active commissions for DoneDeal leads that
// don't have one. Companion to backfill-zombie-commissions.js.
//
// Background: at the DoneDeal transition, `ensureCommissionForLead` is
// invoked by lifecycle hooks. If the lead had no agentId at that moment,
// OR the hook threw silently, the lead reaches DoneDeal without a paired
// Commission. The /api/diagnose/missing-commissions endpoint surfaces the
// gap; this script auto-fixes the agent-present rows in bulk.
//
// USAGE — run ONCE after the zombie backfill:
//   cd crm-aro-backend && node backfill-missing-commissions.js
//
// OR via the admin HTTP trigger (Diagnostics page button):
//   POST /api/admin/run-backfill?type=missing
// (same implementation — both routes call runMissingBackfill in server.js)

"use strict";

var serverExports = require("./server.js");
var mongoose      = require("mongoose");

var runMissingBackfill = serverExports.runMissingBackfill;
if (typeof runMissingBackfill !== "function") {
  console.error("FATAL: server.js did not export runMissingBackfill — check the module.exports block at the bottom of server.js");
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

  // Pass null for actingUser — CLI invocation has no req.user context.
  // The function tolerates null (used for activity log fields only).
  var summary = await runMissingBackfill(null);

  console.log("Active DoneDeal leads:                  " + summary.scannedLeads);
  console.log("Missing an active commission:           " + summary.missingCount + "\n");

  if (summary.missingCount === 0) {
    console.log("Nothing to backfill. Exiting cleanly.");
    await mongoose.disconnect();
    return;
  }

  console.log("With agentId (auto-created):            " + summary.withAgent.length);
  console.log("Without agentId (skipped — needs manual fix): " + summary.noAgent.length + "\n");

  if (summary.noAgent.length > 0) {
    console.log("=== Skipped (no agentId) ===");
    summary.noAgent.forEach(function(l, idx){
      console.log("  " + (idx + 1) + ") leadId=" + l.leadId + "  \"" + l.customerName + "\"" +
                  (l.projectName ? "  (" + l.projectName + ")" : "") +
                  "  → assign an agent on this lead, then re-run or use Diagnostics UI");
    });
    console.log("");
  }

  if (summary.withAgent.length > 0) {
    console.log("=== Auto-create results ===");
    summary.withAgent.forEach(function(r, idx){
      var tail = r.result === "ok"
        ? "OK (commission " + String(r.commissionId).slice(-6) + ")"
        : "FAIL: " + (r.error || "(unknown)");
      console.log("  " + (idx + 1) + ") \"" + r.customerName + "\"" +
                  (r.projectName ? "  (" + r.projectName + ")" : "") +
                  "  agent=" + r.agentName + "  → " + tail);
    });
    console.log("");
  }

  console.log("=== Summary ===");
  console.log("Auto-created:      " + summary.created);
  console.log("Failed (logged):   " + summary.failed);
  console.log("Skipped no-agent:  " + summary.noAgent.length);

  await mongoose.disconnect();
}

main().catch(function(e){
  console.error("FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});
