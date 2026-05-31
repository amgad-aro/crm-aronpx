// crm-aro-backend/diagnose-status-pollution.js
//
// READ-ONLY dry-run. Measures pre-existing slice.status pollution caused by the
// holder-slice status sync firing for sales callers (fixed in commit 703ef2f).
// Performs NO writes — only find().lean(). Safe to run against production.
//
// Usage:
//   MONGODB_URI="mongodb+srv://..." node diagnose-status-pollution.js
//
// Heuristic (approved, STRICT/conservative mode):
//   A slice is POLLUTED if ALL of:
//     (a) it is ACTIVE (removedAt == null), AND
//     (b) it is NOT the current holder's slice (slice.agentId !== lead.agentId), AND
//     (c) slice.status is a STRONG status (MeetingDone / DoneDeal / EOI), AND
//     (d) the slice's OWN agentHistory has NO status_change to that same status
//         AT ALL — feedback-bearing or not. (Any same-status status_change, even
//         a pre-4f28831 feedback-less one, counts the status as genuinely set by
//         the agent and exempts the slice. We under-report rather than over-fix.)
//   Proposed repair value:
//     1. last (most recent) feedback-bearing status_change  -> its status
//     2. else last non-strong status_change                 -> its status
//     3. else "NewLead"

try { require("dotenv").config(); } catch (_) {}
var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required"); process.exit(1); }

var Loose = new mongoose.Schema({}, { strict: false, timestamps: true });
var Lead = mongoose.model("Lead", Loose, "leads");
var User = mongoose.model("User", new mongoose.Schema({}, { strict: false }), "users");

var STRONG = { MeetingDone: 1, "Meeting Done": 1, DoneDeal: 1, "Done Deal": 1, EOI: 1 };
var CANON = {
  "Meeting Done": "MeetingDone", "Done Deal": "DoneDeal", "New Lead": "NewLead",
  "No Answer": "NoAnswer", "Hot Case": "HotCase", "Call Back": "CallBack",
  "Not Interested": "NotInterested"
};
var canon = function (s) { return CANON[s] || s || "NewLead"; };

var parseHistStatus = function (h) {
  if (!h) return null;
  if (h.note) {
    var m = String(h.note).match(/^Status:\s*(.+)$/i);
    if (m) return m[1].trim();
  }
  if (h.status) return String(h.status).trim();
  return null;
};
var hasFeedback = function (h) { return h && h.feedback != null && String(h.feedback).trim() !== ""; };

// Pure, write-free analysis. Shared shape with the temporary admin endpoint.
function analyze(leads, nameOf) {
  var total = 0, byStatus = {}, byRepair = {}, leadsAffected = {}, samples = [];

  leads.forEach(function (lead) {
    var holderId = lead.agentId ? String(lead.agentId._id ? lead.agentId._id : lead.agentId) : "";
    var assigns = Array.isArray(lead.assignments) ? lead.assignments : [];

    assigns.forEach(function (a) {
      if (!a || a.removedAt) return;                                  // (a)
      var aId = a.agentId ? String(a.agentId._id ? a.agentId._id : a.agentId) : "";
      if (aId && holderId && aId === holderId) return;                // (b)
      if (!STRONG[a.status]) return;                                  // (c)

      var hist = Array.isArray(a.agentHistory) ? a.agentHistory : [];
      var statusChanges = hist
        .filter(function (h) { return h && h.type === "status_change"; })
        .map(function (h) {
          return { status: parseHistStatus(h), feedback: hasFeedback(h), at: new Date(h.createdAt || 0).getTime() };
        })
        .filter(function (e) { return e.status; });

      // (d) STRICT: any same-status status_change (feedback optional) = genuine.
      var genuine = statusChanges.some(function (e) { return canon(e.status) === canon(a.status); });
      if (genuine) return;

      // ---- POLLUTED ----
      total++;
      var ps = canon(a.status);
      byStatus[ps] = (byStatus[ps] || 0) + 1;
      leadsAffected[String(lead._id)] = true;

      var repair, signal;
      var fb = statusChanges.filter(function (e) { return e.feedback; }).sort(function (x, y) { return y.at - x.at; });
      if (fb.length) {
        repair = canon(fb[0].status); signal = "last feedback-bearing status_change";
      } else {
        var ns = statusChanges.filter(function (e) { return !STRONG[e.status]; }).sort(function (x, y) { return y.at - x.at; });
        if (ns.length) { repair = canon(ns[0].status); signal = "last non-strong status_change (no feedback-bearing entry)"; }
        else { repair = "NewLead"; signal = "no usable status_change in agentHistory"; }
      }
      byRepair[repair] = (byRepair[repair] || 0) + 1;

      if (samples.length < 10) {
        samples.push({
          leadId: String(lead._id),
          leadName: lead.name || "(no name)",
          agent: aId ? (nameOf[aId] || aId) : "(no agentId)",
          current: a.status,
          proposed: repair,
          signal: signal,
          historyStatusChanges: statusChanges.length
        });
      }
    });
  });

  return { mode: "strict", total: total, leadsAffected: Object.keys(leadsAffected).length, byStatus: byStatus, byRepair: byRepair, samples: samples };
}

(async function () {
  console.log("READ-ONLY DRY RUN — NO WRITES");
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  var users = await User.find({}, { name: 1 }).lean();
  var nameOf = {};
  users.forEach(function (u) { nameOf[String(u._id)] = u.name || "(unknown)"; });

  var leads = await Lead.find(
    { "assignments.0": { $exists: true } },
    { name: 1, agentId: 1, assignments: 1 }
  ).lean();

  var r = analyze(leads, nameOf);

  console.log("\n=== STATUS POLLUTION DRY-RUN (READ-ONLY — no writes) ===\n");
  console.log("Mode:                           " + r.mode);
  console.log("Total polluted slices detected: " + r.total);
  console.log("Across unique leads:            " + r.leadsAffected);
  console.log("\n-- Breakdown by polluted status --");
  Object.keys(r.byStatus).sort().forEach(function (k) { console.log("  " + k + ": " + r.byStatus[k]); });
  console.log("\n-- Breakdown by proposed repair value --");
  Object.keys(r.byRepair).sort().forEach(function (k) { console.log("  " + k + ": " + r.byRepair[k]); });
  console.log("\n-- Sample (up to 10 affected slices) --");
  r.samples.forEach(function (s, i) {
    console.log(
      "  " + (i + 1) + ". \"" + s.leadName + "\" [" + s.leadId + "]" +
      "\n       agent: " + s.agent + " | current: " + s.current + " -> proposed: " + s.proposed +
      "\n       signal: " + s.signal + " (" + s.historyStatusChanges + " status_change entries in slice history)"
    );
  });
  console.log("\nNOTE: this script wrote nothing. Repair is a separate, opt-in step.\n");

  await mongoose.disconnect();
  process.exit(0);
})().catch(function (e) { console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });

module.exports = { analyze: analyze };