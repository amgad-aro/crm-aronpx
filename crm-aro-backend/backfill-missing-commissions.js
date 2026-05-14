// One-shot backfill — create active commissions for DoneDeal leads that
// don't have one. Companion to backfill-zombie-commissions.js.
//
// Background: at the DoneDeal transition, `ensureCommissionForLead` is
// invoked by lifecycle hooks. If the lead had no agentId at that moment,
// OR the hook threw silently, the lead reaches DoneDeal without a paired
// Commission. The /api/diagnose/missing-commissions endpoint surfaces the
// gap; this script auto-fixes the agent-present rows in bulk.
//
// USAGE — run ONCE after the zombie backfill, in the same Railway shell
// or via `railway run`:
//   cd crm-aro-backend && node backfill-missing-commissions.js
//
// Auto-creates a commission for every missing-commission lead that has an
// agentId. Logs (without writing) the leads that have NO agentId — those
// need manual agent-assignment first, then either click "Create commission"
// in the Diagnostics UI or re-run this script.
//
// Approach: requires server.js (listen-guard prevents double-binding), which
// triggers mongoose.connect + seeders. Once connected, the script imports
// the canonical `ensureCommissionForLead` and calls it directly — same
// behavior as the live HTTP endpoint, no logic duplication, no drift risk.

"use strict";

// require server.js BEFORE doing anything else — this triggers the DB
// connection and seeders. The listen-guard at the bottom of server.js
// prevents the HTTP listener from starting because we're not require.main.
var serverExports = require("./server.js");
var mongoose      = require("mongoose");

var ensureCommissionForLead = serverExports.ensureCommissionForLead;
if (typeof ensureCommissionForLead !== "function") {
  console.error("FATAL: server.js did not export ensureCommissionForLead — check the module.exports block at the bottom of server.js");
  process.exit(1);
}

// Permissive schemas — we only need a couple of fields for the lead lookup;
// the Commission writes go through ensureCommissionForLead which uses its
// own (canonical) model.
var Lead       = mongoose.models.Lead       || mongoose.model("Lead",       new mongoose.Schema({}, { strict: false, timestamps: true }));
var Commission = mongoose.models.Commission || mongoose.model("Commission", new mongoose.Schema({}, { strict: false, timestamps: true }));

async function waitForConnection() {
  if (mongoose.connection.readyState === 1) return;
  await new Promise(function(resolve, reject){
    var done = false;
    mongoose.connection.once("open", function(){ if (!done) { done = true; resolve(); } });
    mongoose.connection.once("error", function(err){ if (!done) { done = true; reject(err); } });
    // Hard timeout — if we can't connect in 30s, bail loudly.
    setTimeout(function(){ if (!done) { done = true; reject(new Error("connection timeout (30s)")); } }, 30000);
  });
}

async function main() {
  console.log("Waiting for MongoDB connection (via server.js require)…");
  await waitForConnection();
  console.log("Connected.\n");

  // Same predicate as GET /api/diagnose/missing-commissions and the Deals
  // page Active filter. Population on agentId so we can read the agent name
  // for the skip-log without a second roundtrip.
  var leads = await Lead.find({
    archived: { $ne: true },
    $and: [
      { $or: [{ status: "DoneDeal" }, { globalStatus: "donedeal" }] },
      { dealStatus: { $ne: "Deal Cancelled" } },
      { status:     { $ne: "Deal Cancelled" } }
    ]
  }).select("name phone status globalStatus dealStatus dealDate project agentId").populate("agentId", "name username").lean();

  if (leads.length === 0) {
    console.log("No active DoneDeal leads found. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  // Filter to leads with no ACTIVE commission. (Same logic as the endpoint.)
  var leadIds = leads.map(function(l){ return l._id; });
  var commissions = await Commission.find({ leadId: { $in: leadIds } }).select("leadId status").lean();
  var byLead = Object.create(null);
  commissions.forEach(function(c){
    var k = String(c.leadId);
    if (!byLead[k]) byLead[k] = [];
    byLead[k].push(c);
  });

  var missing = leads.filter(function(l){
    var lst = byLead[String(l._id)] || [];
    return !lst.some(function(c){ return c.status === "active"; });
  });

  console.log("Active DoneDeal leads:                  " + leads.length);
  console.log("Missing an active commission:           " + missing.length + "\n");

  if (missing.length === 0) {
    console.log("Nothing to backfill. Exiting cleanly.");
    await mongoose.disconnect();
    return;
  }

  var noAgent = missing.filter(function(l){ return !l.agentId; });
  var withAgent = missing.filter(function(l){ return !!l.agentId; });

  console.log("With agentId (will auto-create):        " + withAgent.length);
  console.log("Without agentId (skipped — needs manual fix): " + noAgent.length + "\n");

  if (noAgent.length > 0) {
    console.log("=== Skipped (no agentId) ===");
    noAgent.forEach(function(l, idx){
      console.log("  " + (idx + 1) + ") leadId=" + String(l._id) + "  \"" + (l.name || "") + "\"" +
                  (l.project ? "  (" + l.project + ")" : "") +
                  "  → assign an agent on this lead, then re-run or use Diagnostics UI");
    });
    console.log("");
  }

  if (withAgent.length === 0) {
    console.log("No auto-fix candidates remaining.");
    await mongoose.disconnect();
    return;
  }

  console.log("=== Auto-creating commissions ===");
  var created = 0, failed = 0;
  for (var i = 0; i < withAgent.length; i++) {
    var l = withAgent[i];
    var agentLabel = l.agentId && typeof l.agentId === "object"
      ? (l.agentId.name || l.agentId.username || "(unknown)")
      : String(l.agentId);
    var prefix = "  " + (i + 1) + ") \"" + (l.name || "(unknown)") + "\"" +
                 (l.project ? "  (" + l.project + ")" : "") +
                 "  agent=" + agentLabel + "  → ";
    try {
      // ensureCommissionForLead accepts a populated lead doc OR an id. We pass
      // the populated doc to skip the redundant Lead.findById inside.
      var result = await ensureCommissionForLead(l, null);
      if (!result) {
        console.log(prefix + "SKIP (ensureCommissionForLead returned null — likely a snapshot/agent edge case; check server logs)");
        failed++;
      } else {
        console.log(prefix + "OK (commission " + String(result._id).slice(-6) + ")");
        created++;
      }
    } catch(e) {
      console.log(prefix + "ERROR: " + (e && e.message ? e.message : e));
      failed++;
    }
  }

  console.log("");
  console.log("=== Summary ===");
  console.log("Auto-created:      " + created);
  console.log("Failed (logged):   " + failed);
  console.log("Skipped no-agent:  " + noAgent.length);

  await mongoose.disconnect();
}

main().catch(function(e){
  console.error("FATAL:", e && e.message ? e.message : e);
  process.exit(1);
});
