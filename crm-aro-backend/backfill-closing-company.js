// One-shot backfill — stamp closingCompanyId = ARO on existing closed deals.
//
// Feature B (Closing Company) added Lead.closingCompanyId. New deals default to
// the seeded "ARO" company on close (PUT /api/leads/:id and POST /api/leads
// DoneDeal paths), but deals closed BEFORE that deploy have closingCompanyId =
// null and render as "—" on the Deals / Commissions surfaces. This script sets
// them all to ARO so every closed deal carries a closing company.
//
// Scope: leads where (status === "DoneDeal" OR globalStatus === "donedeal")
// AND closingCompanyId is null/missing. Archived closed deals are included on
// purpose — they are still closed deals. Purely an informational tag: NO
// commission / tax / payout impact.
//
// Idempotent: re-running finds nothing (the field is set after the first run).
//
// USAGE — run MANUALLY from the crm-aro-backend/ directory. Do NOT wire into
// any startup path. MONGODB_URI is read from .env automatically (same as the
// other backfill-*.js scripts); the inline form below just overrides it.
//
//   Preview only (no writes — recommended first):
//     DRY_RUN=1 node backfill-closing-company.js
//
//   Apply:
//     node backfill-closing-company.js
//
//   Override the connection explicitly if needed:
//     MONGODB_URI="mongodb+srv://..." node backfill-closing-company.js
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.env.DRY_RUN === "1";
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required (set it in .env or inline)"); process.exit(1); }

// Minimal strict:false models. No explicit collection name — mongoose pluralizes
// the model name identically to server.js, so these resolve to the SAME
// collections ("leads" / "closingcompanies") the app uses.
var LeadSchema           = new mongoose.Schema({}, { strict: false, timestamps: true });
var ClosingCompanySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Lead           = mongoose.model("Lead", LeadSchema);
var ClosingCompany = mongoose.model("ClosingCompany", ClosingCompanySchema);

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no"));

  // Ensure the non-deletable default "ARO" exists (mirrors seedClosingCompany()
  // in server.js) so the script is self-sufficient even if run before a deploy.
  // Skipped in DRY_RUN (no writes); the count below doesn't depend on it.
  if (!DRY_RUN) {
    await ClosingCompany.updateOne(
      { name: "ARO" },
      { $setOnInsert: { name: "ARO" }, $set: { isDefault: true } },
      { upsert: true }
    );
  }
  var aro = await ClosingCompany.findOne({ name: "ARO" }).lean();
  if (!aro && !DRY_RUN) {
    console.error("ERROR: ARO closing company missing after upsert — aborting.");
    await mongoose.disconnect();
    process.exit(1);
  }
  if (aro) console.log("ARO closing company _id: " + String(aro._id));
  else console.log("ARO not found yet (would be created on apply) — continuing dry-run for the count only.");

  // Closed deals with no company yet. Archived closed deals are included.
  var query = {
    $and: [
      { $or: [ { status: "DoneDeal" }, { globalStatus: "donedeal" } ] },
      { $or: [ { closingCompanyId: null }, { closingCompanyId: { $exists: false } } ] }
    ]
  };

  var totalClosed = await Lead.countDocuments({ $or: [ { status: "DoneDeal" }, { globalStatus: "donedeal" } ] });
  var toUpdate    = await Lead.countDocuments(query);
  console.log("");
  console.log("Closed deals (total):            " + totalClosed);
  console.log("Closed deals missing a company:  " + toUpdate);

  if (toUpdate === 0) {
    console.log("\nNothing to backfill. Exiting cleanly.");
    await mongoose.disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log("\nDRY_RUN — no writes. " + toUpdate + " lead(s) WOULD be set to ARO.");
    await mongoose.disconnect();
    return;
  }

  var res = await Lead.updateMany(query, { $set: { closingCompanyId: aro._id } });
  var modified = (res && (res.modifiedCount != null ? res.modifiedCount : res.nModified)) || 0;
  console.log("");
  console.log("=== Summary ===");
  console.log("Leads updated to ARO: " + modified + " / " + toUpdate);
  if (modified !== toUpdate) {
    console.log("(Mismatch — some rows may have been written concurrently; re-run to confirm 0 remaining.)");
  }

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });
