// Diagnostic — frozen leads (DoneDeal / EOI / Pending EOI / Approved EOI)
// whose agentId was set by the manual-window sweeper or another auto path
// AFTER createdAt. Read-only. No writes. Mirrors diagnose-lead-counts.js.
//
// "Frozen" definition (matches isLeadFrozen helper introduced in this fix):
//   status ∈ {"DoneDeal","EOI"} OR
//   eoiStatus ∈ {"Pending","Approved"} OR
//   globalStatus ∈ {"donedeal","eoi"}
//
// Signal of auto-assignment: a Lead.agentHistory entry whose `reason` or
// `action` mentions "manual window expired" / "Auto-assigned" / "rotation",
// OR an assignments[] entry whose assignedAt > createdAt + 10s (i.e. NOT
// the initial assignment baked into Lead.create).

"use strict";
var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required"); process.exit(1); }

var LeadSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Lead = mongoose.model("Lead", LeadSchema);
var UserSchema = new mongoose.Schema({}, { strict: false });
var User = mongoose.model("User", UserSchema);

function iso(d) {
  if (!d) return "—";
  var dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toISOString().replace("T"," ").slice(0,19);
}
function ms(d) { var dt = new Date(d); return isNaN(dt.getTime()) ? 0 : dt.getTime(); }

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected.\n");

  var frozenQuery = {
    $or: [
      { status: { $in: ["DoneDeal", "EOI"] } },
      { eoiStatus: { $in: ["Pending", "Approved"] } },
      { globalStatus: { $in: ["donedeal", "eoi"] } }
    ]
  };
  var frozen = await Lead.find(frozenQuery)
    .select("_id name status eoiStatus globalStatus agentId dealType externalBrokerId externalSalesAgentEnabled externalSalesAgentId externalSalesAgentName createdAt assignments agentHistory")
    .lean();

  console.log("Frozen leads total: " + frozen.length);
  console.log("=== Candidates: agentId set AFTER createdAt (likely auto-assigned) ===\n");

  // Build a name cache for the agentIds we'll print.
  var userIds = {};
  frozen.forEach(function(l){ if (l.agentId) userIds[String(l.agentId._id || l.agentId)] = true; });
  var users = await User.find({ _id: { $in: Object.keys(userIds) } }).select("_id name").lean();
  var nameById = {};
  users.forEach(function(u){ nameById[String(u._id)] = u.name; });

  var suspects = [];
  frozen.forEach(function(l){
    if (!l.agentId) return; // no agent — nothing to suspect
    var aidStr = String(l.agentId._id || l.agentId);
    var createdAtMs = ms(l.createdAt);
    if (!createdAtMs) return;

    // 1) Look for an agentHistory entry whose `action` or `reason` mentions
    //    "manual window expired" / "Auto-assigned" / "rotation" / "Bulk".
    var historyHit = null;
    (l.agentHistory || []).forEach(function(h){
      var blob = String((h.action || "") + " " + (h.reason || "") + " " + (h.by || ""));
      if (/manual window expired|auto-assign|bulk redistribute|Rotation|rotated/i.test(blob)) {
        historyHit = h;
      }
    });

    // 2) Look for an assignments[] entry assigned > 60s after createdAt
    //    AND matching the current agentId — this is the "set after creation"
    //    signature.
    var lateAssign = null;
    (l.assignments || []).forEach(function(a){
      var assignedMs = ms(a.assignedAt);
      var aaid = a.agentId && a.agentId._id ? String(a.agentId._id) : String(a.agentId || "");
      if (aaid === aidStr && assignedMs > createdAtMs + 60*1000) {
        lateAssign = a;
      }
    });

    if (historyHit || lateAssign) {
      suspects.push({ lead: l, historyHit: historyHit, lateAssign: lateAssign });
    }
  });

  if (suspects.length === 0) {
    console.log("(none — no frozen leads show evidence of auto-assignment after create)\n");
  } else {
    suspects.forEach(function(s){
      var l = s.lead;
      var aidStr = String(l.agentId._id || l.agentId);
      console.log("- " + l._id + "  name=" + (l.name || "(no name)"));
      console.log("    status=" + (l.status||"") + "  eoiStatus=" + (l.eoiStatus||"-") + "  globalStatus=" + (l.globalStatus||"-"));
      console.log("    dealType=" + (l.dealType||"internal") + "  externalSalesAgentEnabled=" + !!l.externalSalesAgentEnabled);
      console.log("    current agentId=" + aidStr + " (" + (nameById[aidStr] || "(unknown user)") + ")");
      console.log("    createdAt=" + iso(l.createdAt));
      if (s.lateAssign) {
        console.log("    late assignments[] entry: assignedAt=" + iso(s.lateAssign.assignedAt)
          + "  ΔfromCreate=" + Math.round((ms(s.lateAssign.assignedAt) - ms(l.createdAt))/1000) + "s");
      }
      if (s.historyHit) {
        console.log("    history entry: action=" + (s.historyHit.action||"") + "  reason=" + (s.historyHit.reason||"") + "  by=" + (s.historyHit.by||"") + "  date=" + iso(s.historyHit.date));
      }
      console.log("");
    });
  }

  console.log("Total suspects: " + suspects.length);
  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch(function(e) {
  console.error("ERROR:", e && e.message);
  process.exit(1);
});
