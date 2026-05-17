// One-off diagnostic — counts External-broker-only deals.
//
// Identifies leads that would be (or already have been) rejected by the
// "primary_sales_recipient_required" guard in POST/PUT /api/leads when
// dealType=external, externalBrokerId is set, but Lead.agentId is empty
// and externalSalesAgentEnabled is OFF.
//
// Read-only. No writes. Mirrors diagnose-lead-counts.js setup.
//
// Run: node -r dotenv/config diagnose-external-broker-only.js \
//        dotenv_config_path=../../crm-aro-backend-main/crm-aro-backend-main/.env

"use strict";

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required"); process.exit(1); }

var LeadSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Lead = mongoose.model("Lead", LeadSchema);
var CommissionSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Commission = mongoose.model("Commission", CommissionSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected.\n");

  var totalExternal = await Lead.countDocuments({ dealType: "external" });
  var doneExternal  = await Lead.countDocuments({ dealType: "external", status: "DoneDeal" });
  var eoiExternal   = await Lead.countDocuments({ dealType: "external", status: "EOI" });

  // External + DoneDeal/EOI + broker set + no agentId + toggle off — the
  // exact shape the new guard rejects. Existing rows in this shape were
  // saved before the guard shipped (or via a path that bypasses it).
  var brokerOnlyFilter = {
    dealType: "external",
    status: { $in: ["DoneDeal", "EOI"] },
    externalBrokerId: { $ne: null },
    $and: [
      { $or: [{ agentId: null }, { agentId: { $exists: false } }] },
      { $or: [{ externalSalesAgentEnabled: { $ne: true } }, { externalSalesAgentId: null }, { externalSalesAgentId: { $exists: false } }] }
    ]
  };
  var brokerOnlyStuck = await Lead.find(brokerOnlyFilter)
    .select("_id name status dealType externalBrokerId externalSalesAgentEnabled agentId createdAt").lean();

  console.log("=== External deal counts ===");
  console.log("Total External leads:                 " + totalExternal);
  console.log("External DoneDeal:                    " + doneExternal);
  console.log("External EOI:                         " + eoiExternal);
  console.log("\n=== Broker-only (rejected shape) ===");
  console.log("External DoneDeal/EOI w/ broker only, no agentId, toggle off: " + brokerOnlyStuck.length);
  brokerOnlyStuck.forEach(function(l) {
    console.log("  - " + l._id + "  " + (l.name||"(no name)") + "  status=" + l.status + "  created=" + (l.createdAt && new Date(l.createdAt).toISOString()));
  });

  // Commissions side — any active commissions on External leads where
  // snapshot.salesAgent is null. These rendered fine before the broker-only
  // fix; verifying they exist confirms the FE recipient list must already
  // tolerate a null salesAgent (or not — we'll handle either way).
  var commsBrokerOnly = await Commission.countDocuments({
    "snapshot.salesAgent": null,
    "externalSplit.isExternal": true,
    status: "active"
  });
  console.log("\n=== Commissions side ===");
  console.log("Active External commissions w/ null snapshot.salesAgent: " + commsBrokerOnly);

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch(function(e) {
  console.error("ERROR:", e && e.message);
  process.exit(1);
});