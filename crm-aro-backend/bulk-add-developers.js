// Bulk-add Developer docs from a cleaned name list (one-shot, idempotent).
//
// Adds the 506 developers from developers-list.js (1 intra-input collision ->
// 505 distinct) to the `developers` collection. Mirrors seed-developers.js:
// self-contained (own dotenv + mongoose), strict:false model, normalizedName =
// lowercase + strip every non-alphanumeric codepoint (Unicode-aware),
// idempotent (skip-by-normalizedName) so re-running is a no-op.
//
// The name list lives in developers-list.js (single source of truth, also used
// by the temporary POST /api/admin/bulk-add-developers endpoint).
//
// IDEMPOTENT on two axes:
//  - Against the DB: any name whose normalizedName already exists (e.g. the
//    seeded "El Masria Group" / "MNHD") is detected and skipped.
//  - Within the input: distinct spellings that collapse to the SAME normalizedName
//    (e.g. "Al Marassem" / "Almarassem" -> "almarassem") are reported as
//    collisions; only the FIRST spelling is added. Nothing collapses silently.
//
// USAGE — run MANUALLY from crm-aro-backend/ (or the Railway service shell).
//
//   Collision/count preview only, NO database connection (safe anywhere):
//     ANALYZE=1 node bulk-add-developers.js
//
//   DRY-RUN against the DB (no writes — lists WOULD-add vs already-exists):
//     DRY_RUN=1 node bulk-add-developers.js
//
//   Apply (creates the missing developers):
//     node bulk-add-developers.js
//
//   Override the connection explicitly if needed:
//     MONGODB_URI="mongodb+srv://..." node bulk-add-developers.js
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");

// MUST stay identical to normalizeDeveloperName() in server.js.
function normalizeDeveloperName(s){ return String(s||"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ""); }

// 506 cleaned names — single source of truth shared with the bulk-add endpoint.
var NAMES = require("./developers-list");

// Pre-scan the input: dedupe by normalizedName (keep the FIRST spelling) and
// collect intra-input collisions + invalid (no-key) entries.
function scanInput(){
  var firstByKey = {}, order = [], collisions = [], invalid = [];
  NAMES.forEach(function(raw){
    var name = String(raw||"").trim();
    var key = normalizeDeveloperName(name);
    if (!key) { invalid.push(name); return; }
    if (firstByKey[key] == null) { firstByKey[key] = name; order.push(key); }
    else { collisions.push({ key:key, kept:firstByKey[key], dropped:name }); }
  });
  return { firstByKey:firstByKey, order:order, collisions:collisions, invalid:invalid };
}

function printScan(scan){
  console.log("Input names:                  " + NAMES.length);
  console.log("Distinct normalizedName keys: " + scan.order.length);
  if (scan.invalid.length) console.log("Invalid (no letters/digits):  " + scan.invalid.length + "  -> " + scan.invalid.map(function(x){return '"'+x+'"';}).join(", "));
  if (scan.collisions.length) {
    console.log("\n! " + scan.collisions.length + " intra-input collision(s) — same normalizedName; only the FIRST spelling is kept:");
    scan.collisions.forEach(function(c){ console.log('   "' + c.dropped + '"  collapses into kept  "' + c.kept + '"   [' + c.key + ']'); });
  } else {
    console.log("No intra-input normalizedName collisions.");
  }
}

// ANALYZE mode — print the scan and exit. No DB connection, no creds needed.
if (process.env.ANALYZE === "1") { printScan(scanInput()); process.exit(0); }

var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.env.DRY_RUN === "1";
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required (set it in .env or inline)"); process.exit(1); }

// Minimal strict:false model — pluralizes "Developer" -> "developers", the SAME
// collection the app uses; timestamps:true so create() stamps createdAt/updatedAt.
var DeveloperSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Developer = mongoose.model("Developer", DeveloperSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no") + "\n");

  var scan = scanInput();
  printScan(scan);
  console.log("");

  // Existing normalizedName set (so re-runs + the seeded El Masria Group / MNHD
  // are detected as already-present without per-name round-trips).
  var existing = await Developer.find({}).select("normalizedName").lean();
  var existingByKey = {};
  existing.forEach(function(d){ if (d && d.normalizedName) existingByKey[d.normalizedName] = true; });
  console.log("Developers already in DB: " + existing.length + "\n");

  var created = 0, already = 0;
  for (var i = 0; i < scan.order.length; i++) {
    var key = scan.order[i];
    var name = scan.firstByKey[key];
    if (existingByKey[key]) { already++; console.log("exists:    \"" + name + "\"  [" + key + "]"); continue; }
    if (DRY_RUN) { created++; console.log("WOULD add: \"" + name + "\"  [" + key + "]"); continue; }
    try {
      await Developer.create({ name: name, normalizedName: key });
      created++;
      console.log("added:     \"" + name + "\"  [" + key + "]");
    } catch(e) {
      // Unique-index backstop for a concurrent insert — treat as already-present.
      if (e && e.code === 11000) { already++; console.log("exists(rc):\"" + name + "\"  [" + key + "]"); }
      else throw e;
    }
  }

  var finalCount = await Developer.countDocuments({});
  console.log("\n=== Summary ===");
  console.log("Input names:                 " + NAMES.length);
  console.log("Distinct keys (attempted):   " + scan.order.length);
  console.log("Intra-input collisions:      " + scan.collisions.length + " (dropped — first spelling kept)");
  console.log("Invalid (no key):            " + scan.invalid.length);
  console.log("Already in DB (skipped):     " + already);
  console.log((DRY_RUN ? "WOULD create:                " : "Created:                     ") + created);
  console.log("Developers in DB now:        " + finalCount);
  if (DRY_RUN) console.log("\nDRY_RUN — no writes. Re-run WITHOUT DRY_RUN=1 to apply the " + created + " addition(s).");

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });
