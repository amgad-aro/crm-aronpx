// One-shot backfill — link existing Leads to Developer docs (D6).
//
// Before the Developer managed entity (D2), the developer was free text on the
// commission snapshot (Commission.snapshot.developer). The D1 scan found exactly
// two non-empty values across 44 commissions: "Elmasria" and "mnhd". This script
// resolves each such commission's free-text value to a canonical Developer doc
// (seeded by seed-developers.js) and stamps Lead.developerId on the linked lead
// (via Commission.leadId).
//
// snapshot.developer is LEFT IN PLACE — it's a historical point-in-time snapshot
// and harmless; only Lead.developerId is written.
//
// WHY AN EXPLICIT MAP (not pure auto-match): "Elmasria" normalizes to "elmasria",
// but the approved canonical "El Masria Group" normalizes to "elmasriagroup" —
// they do NOT auto-match. OLD_TO_CANON below encodes the D3 merge decision. Any
// old value not in the map falls back to a direct normalizedName match, and is
// reported as UNMATCHED if no Developer doc exists for it (nothing is guessed).
//
// Idempotent: a lead already pointing at the right Developer is reported "OK" and
// skipped. Safe to re-run.
//
// USAGE — run MANUALLY from the crm-aro-backend/ directory (or the Railway
// service shell). Run seed-developers.js FIRST so the canonical docs exist.
//
//   Preview only (no writes — ALWAYS run this first):
//     DRY_RUN=1 node backfill-developer-links.js
//
//   Apply:
//     node backfill-developer-links.js
//
//   Override the connection explicitly if needed:
//     MONGODB_URI="mongodb+srv://..." node backfill-developer-links.js
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.env.DRY_RUN === "1";
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required (set it in .env or inline)"); process.exit(1); }

// MUST stay identical to normalizeDeveloperName() in server.js.
function normalizeDeveloperName(s){ return String(s||"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ""); }

// D3 merge decision: normalized OLD snapshot.developer value -> canonical
// Developer normalizedName. Required because "Elmasria" (norm "elmasria") does
// NOT auto-match canonical "El Masria Group" (norm "elmasriagroup"). "mnhd"
// already auto-matches "MNHD" but is listed explicitly for an exact, auditable map.
var OLD_TO_CANON = {
  "elmasria": "elmasriagroup",  // "Elmasria"  -> "El Masria Group"
  "mnhd":     "mnhd"            // "mnhd"       -> "MNHD"
};

// Minimal strict:false models. Model names pluralize to the SAME collections the
// app uses: "leads", "developers", "commissions".
var LeadSchema       = new mongoose.Schema({}, { strict: false, timestamps: true });
var DeveloperSchema  = new mongoose.Schema({}, { strict: false, timestamps: true });
var CommissionSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Lead       = mongoose.model("Lead", LeadSchema);
var Developer  = mongoose.model("Developer", DeveloperSchema);
var Commission = mongoose.model("Commission", CommissionSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no") + "\n");

  var devs = await Developer.find({}).lean();
  if (devs.length === 0) {
    console.error("ERROR: no Developer docs found — run seed-developers.js first.");
    await mongoose.disconnect();
    process.exit(1);
  }
  var devByNorm = {};
  devs.forEach(function(d){ devByNorm[d.normalizedName] = d; });
  console.log("Canonical developers loaded: " + devs.length);

  var comms = await Commission.find(
    { "snapshot.developer": { $nin: [null, ""] } },
    { leadId: 1, "snapshot.developer": 1 }
  ).lean();
  console.log("Commissions with snapshot.developer: " + comms.length + "\n");

  var toLink = 0, already = 0, unmatched = 0, noLead = 0, wrote = 0;

  for (var i = 0; i < comms.length; i++) {
    var c = comms[i];
    var raw = (c.snapshot && c.snapshot.developer) || "";
    var normOld = normalizeDeveloperName(raw);
    var canonNorm = OLD_TO_CANON[normOld] || normOld; // fall back to a direct match
    var dev = devByNorm[canonNorm];

    if (!dev) {
      unmatched++;
      console.log("UNMATCHED: commission " + String(c._id) + " developer=\"" + raw + "\" (norm=" + normOld + ") — no canonical Developer for \"" + canonNorm + "\". Add a mapping / create the doc, then re-run.");
      continue;
    }
    if (!c.leadId) {
      noLead++;
      console.log("NO-LEAD:   commission " + String(c._id) + " developer=\"" + raw + "\" — commission has no leadId; cannot link.");
      continue;
    }
    var lead = await Lead.findOne({ _id: c.leadId }, { developerId: 1, name: 1 }).lean();
    if (!lead) {
      noLead++;
      console.log("NO-LEAD:   commission " + String(c._id) + " leadId=" + String(c.leadId) + " — lead not found.");
      continue;
    }
    if (lead.developerId && String(lead.developerId) === String(dev._id)) {
      already++;
      console.log("OK:        lead " + String(c.leadId) + " (\"" + (lead.name||"") + "\") already -> \"" + dev.name + "\"");
      continue;
    }

    toLink++;
    var fromStr = lead.developerId ? ("from " + String(lead.developerId)) : "from (none)";
    console.log((DRY_RUN ? "WOULD LINK:" : "LINK:      ") + " lead " + String(c.leadId) + " (\"" + (lead.name||"") + "\") " + fromStr + " -> \"" + dev.name + "\" (" + String(dev._id) + ")  [developer=\"" + raw + "\"]");

    if (!DRY_RUN) {
      await Lead.updateOne({ _id: c.leadId }, { $set: { developerId: dev._id } });
      wrote++;
    }
  }

  console.log("\n=== Summary ===");
  console.log("To link:        " + toLink);
  console.log("Already linked: " + already);
  console.log("Unmatched:      " + unmatched);
  console.log("No-lead:        " + noLead);
  if (DRY_RUN) console.log("\nDRY_RUN — no writes. Re-run WITHOUT DRY_RUN=1 to apply the " + toLink + " link(s).");
  else console.log("Wrote: " + wrote + " lead(s) updated.");
  if (unmatched > 0) console.log("\n! " + unmatched + " unmatched — review the lines above before treating the backfill as complete.");

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });
