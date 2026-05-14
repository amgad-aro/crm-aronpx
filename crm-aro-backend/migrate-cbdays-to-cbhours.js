// One-time migration — convert rotation setting value.cbDays (days) to
// value.cbHours (hours) in the AppSetting doc keyed by "rotation".
//
// Why this exists: the "CallBack overdue — rotate after" admin setting was
// reworked from days to hours. The backend / frontend now read+write
// value.cbHours. getRotationSettings() has a back-compat read that
// translates legacy value.cbDays * 24 on the fly, so production keeps
// rotating correctly between deploy and this script's run — but the legacy
// field stays in the document until cleaned up here.
//
// Operation:
//   - For the rotation AppSetting doc:
//     - If value.cbDays exists and value.cbHours is missing/null:
//         set value.cbHours = value.cbDays * 24
//     - Always: $unset value.cbDays
//
// Dry-run by default. Set CONFIRM=yes to commit.
//
// Run (dry-run):
//   MONGODB_URI="mongodb+srv://..." node migrate-cbdays-to-cbhours.js
//
// Run (commit):
//   MONGODB_URI="mongodb+srv://..." CONFIRM=yes node migrate-cbdays-to-cbhours.js

"use strict";

var mongoose = require("mongoose");

var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI env var is required.");
  process.exit(1);
}
var CONFIRM = String(process.env.CONFIRM || "").toLowerCase() === "yes";

var AppSettingSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var AppSetting = mongoose.model("AppSetting", AppSettingSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected.");

  var doc = await AppSetting.findOne({ key: "rotation" }).lean();
  if (!doc) {
    console.log("No rotation AppSetting doc found — nothing to migrate.");
    await mongoose.disconnect();
    return;
  }
  var v = (doc && doc.value) || {};
  var hadDays = (v.cbDays !== undefined && v.cbDays !== null);
  var hadHours = (v.cbHours !== undefined && v.cbHours !== null);

  console.log("Current rotation settings:");
  console.log("  value.cbDays  = " + (hadDays  ? v.cbDays  : "(not present)"));
  console.log("  value.cbHours = " + (hadHours ? v.cbHours : "(not present)"));

  if (!hadDays) {
    console.log("\nNo value.cbDays field present — nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  var newHours = hadHours ? Number(v.cbHours) : Number(v.cbDays) * 24;
  console.log("\nPlanned change:");
  if (!hadHours) {
    console.log("  $set   value.cbHours = " + v.cbDays + " * 24 = " + newHours);
  } else {
    console.log("  value.cbHours already set (" + v.cbHours + ") — keeping as-is");
  }
  console.log("  $unset value.cbDays");

  if (!CONFIRM) {
    console.log("\nDRY RUN — pass CONFIRM=yes to commit.");
    await mongoose.disconnect();
    return;
  }

  var update = { $unset: { "value.cbDays": "" } };
  if (!hadHours) update.$set = { "value.cbHours": newHours };

  var res = await AppSetting.updateOne({ key: "rotation" }, update);
  console.log("\nUpdate result: matched=" + res.matchedCount + " modified=" + res.modifiedCount);

  var verify = await AppSetting.findOne({ key: "rotation" }).lean();
  var vv = (verify && verify.value) || {};
  console.log("\nPost-migration:");
  console.log("  value.cbDays  = " + (vv.cbDays  !== undefined ? vv.cbDays  : "(removed)"));
  console.log("  value.cbHours = " + (vv.cbHours !== undefined ? vv.cbHours : "(not set)"));

  await mongoose.disconnect();
}

main().catch(function(err){
  console.error("FATAL:", err && err.message || err);
  process.exit(1);
});
