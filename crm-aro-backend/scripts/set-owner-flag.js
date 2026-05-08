// One-time setup: flag a user as the Owner so the forgot-password endpoint
// will accept their email. Idempotent — safe to re-run.
//
// Usage:
//   node scripts/set-owner-flag.js <email>
//
// Reads MONGODB_URI from .env (cwd = crm-aro-backend).

"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
var mongoose = require("mongoose");

var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI env var is required.");
  process.exit(1);
}

var email = String(process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/set-owner-flag.js <email>");
  process.exit(1);
}

var User = mongoose.model("User", new mongoose.Schema({}, { strict: false, timestamps: true }));

async function main() {
  await mongoose.connect(MONGODB_URI);

  var user = await User.findOne({
    email: { $regex: "^" + email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", $options: "i" }
  });
  if (!user) {
    console.error("FAIL: no user found with email " + email);
    process.exit(2);
  }

  if (user.isOwner === true) {
    console.log("OK (no change): " + email + " is already isOwner=true (id " + user._id + ").");
    return;
  }

  await User.updateOne({ _id: user._id }, { $set: { isOwner: true } });
  console.log("OK: isOwner=true set for " + email + " (id " + user._id + ").");
}

main()
  .then(function(){ return mongoose.disconnect(); })
  .then(function(){ process.exit(0); })
  .catch(function(e){
    console.error("ERROR:", e && e.message ? e.message : e);
    process.exit(1);
  });
