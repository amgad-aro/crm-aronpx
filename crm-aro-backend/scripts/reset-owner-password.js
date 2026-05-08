// Emergency owner password reset.
//
// Use ONLY when the email-based forgot-password flow is unavailable
// (e.g. Resend outage, RESEND_API_KEY unset, mailbox locked out).
//
// Refuses to run unless the target user has isOwner === true — sales /
// manager / etc. passwords are reset from the Users page, not this script.
//
// Usage:
//   node scripts/reset-owner-password.js <email> <newPassword>
//
// Reads MONGODB_URI from .env (cwd = crm-aro-backend).

"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });
var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");

var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI env var is required.");
  process.exit(1);
}

var args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node scripts/reset-owner-password.js <email> <newPassword>");
  process.exit(1);
}
var email = String(args[0] || "").trim().toLowerCase();
var newPassword = String(args[1] || "");

if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
  console.error("ERROR: password must be at least 8 chars and contain a letter and a number.");
  process.exit(1);
}

// Mirror the production User schema's strict:false so we can read isOwner
// regardless of any model drift in this script.
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
  if (user.isOwner !== true) {
    console.error("FAIL: user " + email + " is not flagged as owner (isOwner !== true). Refusing to reset.");
    console.error("      Use the Users page in the CRM to reset non-owner passwords.");
    process.exit(3);
  }

  var hash = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ _id: user._id }, { $set: {
    password: hash,
    resetToken: null,
    resetTokenExpiry: null,
    passwordChangedAt: new Date()
  }});

  console.log("OK: password reset for owner " + email + " (id " + user._id + ").");
  console.log("    Existing JWT sessions for this user are now invalidated.");
}

main()
  .then(function(){ return mongoose.disconnect(); })
  .then(function(){ process.exit(0); })
  .catch(function(e){
    console.error("ERROR:", e && e.message ? e.message : e);
    process.exit(1);
  });
