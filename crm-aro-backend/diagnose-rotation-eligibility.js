// Read-only diagnostic for the Lead-side rotation eligibility funnel.
// Mirrors the filter/eligibility logic in POST /api/leads/bulk-redistribute-backlog
// so we can see exactly where leads drop out.
//
// DRs are explicitly excluded — this tool inspects the Lead collection only.
// No writes, no mutations; just countDocuments / find / aggregate.
//
// Run:
//   MONGODB_URI="mongodb+srv://..." node diagnose-rotation-eligibility.js
//
// Optional:
//   SAMPLE_NE=10  (how many not-eligible leads to sample in detail; default 10)
//   VERBOSE=1     (also print a per-agent breakdown of the passing pool)

"use strict";

var mongoose = require("mongoose");

var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI env var is required.");
  process.exit(1);
}
var SAMPLE_NE = Number(process.env.SAMPLE_NE) || 10;
var VERBOSE   = !!process.env.VERBOSE;

// Minimal, permissive schemas so any field in the live docs is accessible.
// strict:false lets Mongoose return every field present in the document,
// including ones that aren't declared in the production models.
var LeadSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var ActivitySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var AppSettingSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

var Lead = mongoose.model("Lead", LeadSchema);
var User = mongoose.model("User", UserSchema);
var Activity = mongoose.model("Activity", ActivitySchema);
var AppSetting = mongoose.model("AppSetting", AppSettingSchema);

function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
function daysAgo(d) {
  if (!d) return "—";
  var ms = Date.now() - new Date(d).getTime();
  if (!isFinite(ms) || ms < 0) return "—";
  var days = ms / (24*3600*1000);
  if (days < 1) return (ms / 3600000).toFixed(1) + "h ago";
  return days.toFixed(1) + "d ago";
}

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. Loading rotation settings...");

  var settingsDoc = await AppSetting.findOne({ key: "rotation" }).lean();
  var sv = (settingsDoc && settingsDoc.value) || {};
  var thresholds = {
    naCount:    Number(sv.naCount    != null ? sv.naCount    : 2),
    naHours:    Number(sv.naHours    != null ? sv.naHours    : 1),
    niDays:     Number(sv.niDays     != null ? sv.niDays     : 1),
    noActDays:  Number(sv.noActDays  != null ? sv.noActDays  : 2),
    cbHours:    Number(sv.cbHours    != null ? sv.cbHours    : (sv.cbDays != null ? sv.cbDays * 24 : 24)),
    hotDays:    Number(sv.hotDays    != null ? sv.hotDays    : 2),
    rotationStopAfterDays: Number(sv.rotationStopAfterDays != null ? sv.rotationStopAfterDays : 45)
  };
  console.log("Thresholds:", thresholds);

  var now = new Date();
  var DAY  = 24*60*60*1000;
  var HOUR = 60*60*1000;
  var ageCutoff    = new Date(now.getTime() - thresholds.rotationStopAfterDays*DAY);
  var rotatedGuard = new Date(now.getTime() - 1*HOUR);

  // Stage 0: total assigned, non-archived Leads. No other filters yet.
  //          (DR exclusion is one of the labeled stages below, per spec.)
  var baseFilter = { archived: { $ne: true }, agentId: { $ne: null } };
  var N = await Lead.countDocuments(baseFilter);
  console.log("\n=== Funnel (Leads collection only) ===");
  console.log("N  Total Leads (archived:false, agentId!=null):                              " + N);

  // Pull the full candidate set with just the fields we need for the funnel.
  // strict:false means we get whatever's in the doc; defensive reads below.
  var fields = "_id name agentId source archived rotationStopped globalStatus createdAt lastRotationAt assignments";
  var candidates = await Lead.find(baseFilter).select(fields).lean();
  if (candidates.length !== N) {
    console.log("  (warning: count="+N+" but find returned "+candidates.length+" — continuing with the find result)");
  }

  // Waterfall. Each stage drops from the survivor list; counters record the drop.
  var X1=0,X2=0,X3=0,X4=0,X5=0,X6=0,X7=0;
  var survivors = [];
  for (var i = 0; i < candidates.length; i++) {
    var l = candidates[i];
    // X1: createdAt older than 45 days ago
    if (!l.createdAt || new Date(l.createdAt) < ageCutoff) { X1++; continue; }
    // X2: rotationStopped === true
    if (l.rotationStopped === true) { X2++; continue; }
    // X3: globalStatus in {eoi, donedeal}
    if (l.globalStatus === "eoi" || l.globalStatus === "donedeal") { X3++; continue; }
    // X4: source === "Daily Request" (DR mirror Lead)
    if (l.source === "Daily Request") { X4++; continue; }
    // X5: lastRotationAt within the last hour
    if (l.lastRotationAt && new Date(l.lastRotationAt) >= rotatedGuard) { X5++; continue; }
    // X6: no current assignment slice (agentId doesn't match any assignments[].agentId)
    var curAid = l.agentId && l.agentId._id ? String(l.agentId._id) : String(l.agentId || "");
    var cur = null;
    if (curAid) {
      cur = (l.assignments || []).find(function(a){
        var aid = a && a.agentId && a.agentId._id ? a.agentId._id : (a && a.agentId);
        return String(aid || "") === curAid;
      }) || null;
    }
    if (!cur) { X6++; continue; }
    // X7: current slice has noRotation === true
    if (cur.noRotation === true) { X7++; continue; }

    l._cur = cur;
    l._curAid = curAid;
    survivors.push(l);
  }
  var P = survivors.length;

  console.log("   - excluded: createdAt older than 45d ago:                                 " + X1);
  console.log("   - excluded: rotationStopped = true:                                       " + X2);
  console.log("   - excluded: globalStatus in [eoi, donedeal]:                              " + X3);
  console.log("   - excluded: source = \"Daily Request\":                                     " + X4);
  console.log("   - excluded: lastRotationAt within 1h:                                     " + X5);
  console.log("   - excluded: no current assignment slice:                                  " + X6);
  console.log("   - excluded: current slice has noRotation = true:                          " + X7);
  console.log("P  Passed all DB-shape filters:                                              " + P);

  // NoAnswer activity counts for the passing leads — one batch query.
  var survivorIds = survivors.map(function(l){ return l._id; });
  var naByLead = {};
  if (survivorIds.length) {
    var naActs = await Activity.find({
      leadId: { $in: survivorIds },
      type: "status_change",
      note: { $regex: /^\[NoAnswer\]/ }
    }).select("leadId createdAt").lean();
    naActs.forEach(function(a){
      var k = String(a.leadId);
      var slot = naByLead[k] || (naByLead[k] = { count: 0, latest: null });
      slot.count += 1;
      if (!slot.latest || new Date(a.createdAt) > slot.latest) slot.latest = new Date(a.createdAt);
    });
  }

  // Per-agent-slice eligibility.
  var E1=0,E2=0,E3=0,E4=0,E5=0,NE=0;
  var notEligible = [];
  survivors.forEach(function(l){
    var cur = l._cur;
    var lastAct = cur.lastActionAt ? new Date(cur.lastActionAt).getTime() : 0;
    var ageMs = lastAct ? (now.getTime() - lastAct) : Infinity;
    var status = String(cur.status || "");
    var verdict = null, reason = "";
    switch (status) {
      case "NoAnswer": {
        var slot = naByLead[String(l._id)];
        if (!slot)                                        { verdict="NE"; reason="no [NoAnswer] activities logged"; }
        else if (slot.count < thresholds.naCount)         { verdict="NE"; reason="NoAnswer count "+slot.count+" < "+thresholds.naCount; }
        else if (!slot.latest)                             { verdict="NE"; reason="latest NoAnswer timestamp missing"; }
        else if ((now.getTime() - slot.latest.getTime()) < thresholds.naHours*HOUR) { verdict="NE"; reason="latest NoAnswer only "+((now.getTime()-slot.latest.getTime())/HOUR).toFixed(1)+"h ago (threshold "+thresholds.naHours+"h)"; }
        else                                               { verdict="E5"; }
        break;
      }
      case "NotInterested":
        if (ageMs >= thresholds.niDays*DAY) verdict="E2";
        else { verdict="NE"; reason="lastActionAt "+(ageMs/DAY).toFixed(2)+"d ago < niDays "+thresholds.niDays; }
        break;
      case "NewLead":
        if (ageMs >= thresholds.noActDays*DAY) verdict="E1";
        else { verdict="NE"; reason="lastActionAt "+(ageMs/DAY).toFixed(2)+"d ago < noActDays "+thresholds.noActDays; }
        break;
      case "CallBack": {
        if (!cur.callbackTime) { verdict="NE"; reason="callbackTime not set on slice"; break; }
        var cb = new Date(cur.callbackTime).getTime();
        if (!cb) { verdict="NE"; reason="callbackTime unparseable ("+cur.callbackTime+")"; break; }
        var cbAge = now.getTime() - cb;
        if (cbAge >= thresholds.cbHours*HOUR) verdict="E3";
        else { verdict="NE"; reason="callback "+(cbAge/HOUR).toFixed(2)+"h ago < cbHours "+thresholds.cbHours+(cbAge<0?" (in future)":""); }
        break;
      }
      case "HotCase":
      case "Potential":
      case "MeetingDone":
        if (ageMs >= thresholds.hotDays*DAY) verdict="E4";
        else { verdict="NE"; reason="lastActionAt "+(ageMs/DAY).toFixed(2)+"d ago < hotDays "+thresholds.hotDays; }
        break;
      default:
        verdict = "NE";
        reason = "slice status \""+status+"\" not in eligible set";
    }
    if      (verdict==="E1") E1++;
    else if (verdict==="E2") E2++;
    else if (verdict==="E3") E3++;
    else if (verdict==="E4") E4++;
    else if (verdict==="E5") E5++;
    else { NE++; notEligible.push({ lead: l, reason: reason }); }
  });

  console.log("\n=== Per-agent-slice eligibility (of P=" + P + ") ===");
  console.log("E1 NewLead AND lastActionAt >= " + thresholds.noActDays + "d:                 " + E1);
  console.log("E2 NotInterested AND lastActionAt >= " + thresholds.niDays + "d:              " + E2);
  console.log("E3 CallBack AND callbackTime >= " + thresholds.cbHours + "h ago:               " + E3);
  console.log("E4 Hot/Potential/MeetingDone AND lastActionAt >= " + thresholds.hotDays + "d: " + E4);
  console.log("E5 NoAnswer matching "+thresholds.naCount+"x / "+thresholds.naHours+"h rule:                         " + E5);
  console.log("NE Not eligible (failed threshold or unknown status):                         " + NE);
  var totalE = E1+E2+E3+E4+E5;
  console.log("Total eligible (E1+E2+E3+E4+E5):                                              " + totalE);

  // Sample NE leads with detail.
  if (NE > 0) {
    // Resolve agent names for the sample only, plus verbose breakdown if requested.
    var sampleSize = Math.min(SAMPLE_NE, NE);
    var sample = notEligible.slice(0, sampleSize); // deterministic; first-N in scan order
    var agentIds = {};
    sample.forEach(function(row){ agentIds[String(row.lead._curAid)] = true; });
    var agentDocs = await User.find({ _id: { $in: Object.keys(agentIds) } }).select("_id name").lean();
    var agentNameById = {};
    agentDocs.forEach(function(u){ agentNameById[String(u._id)] = u.name || "(no name)"; });

    console.log("\n=== Sample of " + sampleSize + " NOT-eligible leads ===");
    console.log(pad("#",3)+pad("Lead",26)+pad("Agent",22)+pad("Status",15)+pad("lastActionAt",18)+pad("callbackTime",18)+"Reason");
    sample.forEach(function(row, idx){
      var l = row.lead;
      var cur = l._cur;
      console.log(
        pad(idx+1, 3) +
        pad(String(l.name||"").slice(0,24), 26) +
        pad((agentNameById[String(l._curAid)] || "(unknown)").slice(0,20), 22) +
        pad(String(cur.status||"—"), 15) +
        pad(daysAgo(cur.lastActionAt), 18) +
        pad(cur.callbackTime ? daysAgo(cur.callbackTime) : "—", 18) +
        row.reason
      );
    });
  }

  if (VERBOSE && totalE > 0) {
    console.log("\n=== VERBOSE: per-agent breakdown of eligible pool ===");
    var byAgent = {};
    survivors.forEach(function(l){
      // Re-run eligibility quickly; count only eligibles.
      // (Cheap — we already have l._cur.)
      var cur = l._cur;
      var lastAct = cur.lastActionAt ? new Date(cur.lastActionAt).getTime() : 0;
      var ageMs = lastAct ? (now.getTime() - lastAct) : Infinity;
      var status = String(cur.status||"");
      var eligible = false;
      switch (status) {
        case "NoAnswer": { var s = naByLead[String(l._id)]; eligible = !!(s && s.count >= thresholds.naCount && s.latest && (now.getTime()-s.latest.getTime()) >= thresholds.naHours*HOUR); break; }
        case "NotInterested": eligible = ageMs >= thresholds.niDays*DAY; break;
        case "NewLead":       eligible = ageMs >= thresholds.noActDays*DAY; break;
        case "CallBack":      { if (cur.callbackTime) { var cb = new Date(cur.callbackTime).getTime(); eligible = cb && (now.getTime()-cb) >= thresholds.cbHours*HOUR; } break; }
        case "HotCase": case "Potential": case "MeetingDone": eligible = ageMs >= thresholds.hotDays*DAY; break;
      }
      if (eligible) byAgent[String(l._curAid)] = (byAgent[String(l._curAid)] || 0) + 1;
    });
    var agentIds2 = Object.keys(byAgent);
    var agentDocs2 = await User.find({ _id: { $in: agentIds2 } }).select("_id name role active").lean();
    var map2 = {};
    agentDocs2.forEach(function(u){ map2[String(u._id)] = u; });
    var rows = agentIds2.map(function(id){
      var u = map2[id] || {};
      return { id: id, name: u.name || "(unknown)", role: u.role || "—", active: u.active !== false, count: byAgent[id] };
    }).sort(function(a,b){ return b.count - a.count; });
    console.log(pad("Count",8) + pad("Agent",28) + pad("Role",15) + "Active");
    rows.forEach(function(r){
      console.log(pad(r.count, 8) + pad(r.name.slice(0,26), 28) + pad(r.role, 15) + (r.active ? "yes" : "NO"));
    });
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch(function(err){
  console.error("FAILED:", err && err.stack ? err.stack : err);
  try { mongoose.disconnect(); } catch(e) {}
  process.exit(2);
});
