// One-shot seed — create the canonical Developer docs (D3).
//
// The Developer managed entity (D2) added the `developers` collection +
// Lead.developerId. This script seeds the two canonical developers discovered in
// the D1 data scan, with the exact spellings approved by the user:
//
//     "El Masria Group"   (normalizedName "elmasriagroup")
//     "MNHD"              (normalizedName "mnhd")
//
// normalizedName MUST match server.js normalizeDeveloperName() exactly, so the
// app's case/space/punctuation-insensitive uniqueness keeps working and the D6
// backfill can resolve old free-text values to these docs.
//
// Idempotent: matches on normalizedName, so re-running leaves existing docs
// untouched (no duplicates).
//
// USAGE — run MANUALLY from the crm-aro-backend/ directory (or the Railway
// service shell, where MONGODB_URI is already in the environment). Do NOT wire
// into any startup path.
//
//   Preview only (no writes — recommended first):
//     DRY_RUN=1 node seed-developers.js
//
//   Apply:
//     node seed-developers.js
//
//   Override the connection explicitly if needed:
//     MONGODB_URI="mongodb+srv://..." node seed-developers.js
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.env.DRY_RUN === "1";
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required (set it in .env or inline)"); process.exit(1); }

// MUST stay identical to normalizeDeveloperName() in server.js: lowercase, then
// strip every non-alphanumeric codepoint (Unicode-aware, so Arabic names survive).
function normalizeDeveloperName(s){ return String(s||"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ""); }

// Minimal strict:false model. No explicit collection name — mongoose pluralizes
// "Developer" -> "developers", the SAME collection the app uses.
var DeveloperSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Developer = mongoose.model("Developer", DeveloperSchema);

var CANONICAL = ["El Masria Group", "MNHD"];

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no") + "\n");

  for (var i = 0; i < CANONICAL.length; i++) {
    var name = CANONICAL[i];
    var normalizedName = normalizeDeveloperName(name);
    var existing = await Developer.findOne({ normalizedName: normalizedName }).lean();
    if (existing) {
      console.log("exists:   \"" + name + "\" [" + normalizedName + "]  _id=" + String(existing._id) + " — left unchanged");
      continue;
    }
    if (DRY_RUN) {
      console.log("WOULD create: \"" + name + "\" [" + normalizedName + "]");
      continue;
    }
    var doc = await Developer.create({ name: name, normalizedName: normalizedName });
    console.log("created:  \"" + name + "\" [" + normalizedName + "]  _id=" + String(doc._id));
  }

  var all = await Developer.find({}).sort({ name: 1 }).lean();
  console.log("\nDevelopers in DB (" + all.length + "):");
  all.forEach(function(d){ console.log("  " + String(d._id) + "  " + d.name + "  [" + d.normalizedName + "]"); });

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });
