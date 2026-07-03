// ============================================================================
// Departure-evidence report (READ-ONLY) — prep for a Manage Periods review.
// For every DEACTIVATED user still linked to a team leader, prints:
//   • active-since   = earliest evidence they existed (join estimate)
//   • last-seen      = latest activity / deal / lead-assignment (still-working)
//   • deactivated≈   = User.updatedAt (deactivation proxy — the "left team" date)
//   • deals per quarter
// then a per-quarter READY-TO-ENTER joinedAt / leftAt table to type straight into
// Manage Periods → Edit roster (blank = present the whole quarter). NO WRITES.
//
//   node report-departed-members.js                 (Q1,Q2 of current year)
//   --year=YYYY   --quarters=1,2
// ============================================================================
var mongoose = require("mongoose");
var URI = process.env.MONGODB_URI;
if (!URI) { console.error("no MONGODB_URI in env"); process.exit(1); }
function argVal(name){ var h = process.argv.filter(function(a){ return a.indexOf("--" + name + "=") === 0; })[0]; return h ? h.split("=")[1] : null; }
var now = new Date();
var CUR_YEAR = now.getUTCFullYear(), CUR_Q = Math.floor(now.getUTCMonth() / 3) + 1;
var YEAR = argVal("year") ? parseInt(argVal("year"), 10) : CUR_YEAR;
var QUARTERS = (function(){
  var q = argVal("quarters"); if (q) return q.split(",").map(function(x){ return parseInt(x, 10); }).filter(function(n){ return n >= 1 && n <= 4; });
  if (YEAR < CUR_YEAR) return [1, 2, 3, 4]; if (YEAR > CUR_YEAR) return [];
  var out = []; for (var i = 1; i < CUR_Q; i++) out.push(i); return out;
})();

function qBounds(y, q){ return { qStart: new Date(Date.UTC(y, (q - 1) * 3, 1)), qEnd: new Date(Date.UTC(y, q * 3, 1)), qKey: y + "-Q" + q }; }
function toDate(d){ if (!d) return null; var t = (d instanceof Date) ? d : new Date(d); return isNaN(t.getTime()) ? null : t; }
function minDate(list){ var m = null; list.forEach(function(d){ var t = toDate(d); if (t && (m === null || t < m)) m = t; }); return m; }
function maxDate(list){ var m = null; list.forEach(function(d){ var t = toDate(d); if (t && (m === null || t > m)) m = t; }); return m; }
function fmtD(d){ var t = toDate(d); return t ? t.toISOString().slice(0, 10) : "—"; }
function pad(s, n){ s = String(s); while (s.length < n) s += " "; return s; }

// suggested joinedAt for a quarter: "" = present at/before start; date string =
// joined mid-quarter; null = active-since is AFTER the quarter (not on team then).
function sJoin(activeSince, b){ if (!activeSince) return ""; if (activeSince.getTime() <= b.qStart.getTime()) return ""; if (activeSince.getTime() >= b.qEnd.getTime()) return null; return fmtD(activeSince); }
// suggested leftAt: "" = present through end; date string = left mid-quarter;
// null = departure is at/before quarter start (had already left / not on team).
function sLeft(departure, b){ if (!departure) return ""; if (departure.getTime() <= b.qStart.getTime()) return null; if (departure.getTime() >= b.qEnd.getTime()) return ""; return fmtD(departure); }

(async function(){
  await mongoose.connect(URI, { dbName: "test" });
  var User     = mongoose.model("User",     new mongoose.Schema({}, { strict: false, collection: "users" }));
  var Lead     = mongoose.model("Lead",     new mongoose.Schema({}, { strict: false, collection: "leads" }));
  var Activity = mongoose.model("Activity", new mongoose.Schema({}, { strict: false, collection: "activities" }));

  var users = await User.find({}).select("_id name role active reportsTo startingDate createdAt updatedAt").lean();
  var byId = {}; users.forEach(function(u){ byId[String(u._id)] = u; });
  function leaderOf(u){ var rt = u.reportsTo && u.reportsTo._id ? String(u.reportsTo._id) : String(u.reportsTo || ""); var l = byId[rt]; return (l && (l.role === "manager" || l.role === "team_leader")) ? l : null; }
  var deact = users.filter(function(u){ return u.active === false && leaderOf(u); });

  console.log("=== DEPARTURE-EVIDENCE REPORT (READ-ONLY) ===");
  console.log("Deactivated members still linked to a team: " + deact.length + "  ·  quarters: " + QUARTERS.map(function(q){ return "Q" + q; }).join(", ") + " " + YEAR + "\n");
  if (!deact.length) { console.log("None."); await mongoose.disconnect(); return; }

  // Batched activity / deal / agentHistory min+max per user.
  var actMM  = await Activity.aggregate([{ $group: { _id: "$userId", min: { $min: "$createdAt" }, max: { $max: "$createdAt" } } }]);
  var dealMM = await Lead.aggregate([
    { $match: { $or: [{ status: "DoneDeal" }, { globalStatus: "donedeal" }], dealDate: { $type: "string", $gt: "" } } },
    { $group: { _id: "$agentId", min: { $min: "$dealDate" }, max: { $max: "$dealDate" } } }
  ]);
  var histMM = await Lead.aggregate([{ $unwind: "$agentHistory" }, { $match: { "agentHistory.date": { $ne: null } } },
    { $group: { _id: "$agentHistory.agentId", min: { $min: "$agentHistory.date" }, max: { $max: "$agentHistory.date" } } }]);
  var A = {}, D = {}, H = {};
  actMM.forEach(function(r){ if (r._id) A[String(r._id)] = r; });
  dealMM.forEach(function(r){ if (r._id) D[String(r._id)] = r; });
  histMM.forEach(function(r){ if (r._id) H[String(r._id)] = r; });

  // Deals per quarter per agent.
  var dealsByQ = {};
  for (var qi = 0; qi < QUARTERS.length; qi++) {
    var b = qBounds(YEAR, QUARTERS[qi]);
    var rows = await Lead.aggregate([
      { $match: { $or: [{ status: "DoneDeal" }, { globalStatus: "donedeal" }], archived: { $ne: true } } },
      { $addFields: { _eff: { $let: { vars: { d1: { $convert: { input: "$dealDate", to: "date", onError: null, onNull: null } } },
        in: { $ifNull: ["$$d1", { $ifNull: [{ $convert: { input: "$eoiDate", to: "date", onError: null, onNull: null } }, { $ifNull: ["$updatedAt", "$createdAt"] }] }] } } } } },
      { $match: { _eff: { $gte: b.qStart, $lt: b.qEnd } } },
      { $group: { _id: "$agentId", n: { $sum: 1 } } }
    ]);
    dealsByQ[QUARTERS[qi]] = {}; rows.forEach(function(r){ if (r._id) dealsByQ[QUARTERS[qi]][String(r._id)] = r.n; });
  }

  // Per-member evidence.
  function ev(u){
    var id = String(u._id);
    var activeSince = minDate([u.startingDate, u.createdAt, A[id] && A[id].min, D[id] && D[id].min, H[id] && H[id].min]);
    var lastSeen    = maxDate([A[id] && A[id].max, D[id] && D[id].max, H[id] && H[id].max]);
    var deactAt     = toDate(u.updatedAt);
    var departure   = deactAt || lastSeen; // prefer deactivation date as the "left team" date
    return { activeSince: activeSince, lastSeen: lastSeen, deactAt: deactAt, departure: departure };
  }

  deact.sort(function(a, b){ var la = leaderOf(a).name || "", lb = leaderOf(b).name || ""; return la === lb ? String(a.name).localeCompare(b.name) : la.localeCompare(lb); });

  deact.forEach(function(u){
    var e = ev(u); var id = String(u._id);
    console.log("── " + u.name + " (" + u.role + ") → " + leaderOf(u).name + "'s team ──");
    console.log("   active-since : " + fmtD(e.activeSince) + "   (startingDate " + fmtD(u.startingDate) + " · created " + fmtD(u.createdAt) + " · 1st activity " + fmtD(A[id] && A[id].min) + " · 1st deal " + fmtD(D[id] && D[id].min) + ")");
    console.log("   last-seen    : " + fmtD(e.lastSeen) + "   (last activity " + fmtD(A[id] && A[id].max) + " · last deal " + fmtD(D[id] && D[id].max) + ")");
    console.log("   deactivated≈ : " + fmtD(e.deactAt) + "   (User.updatedAt — deactivation proxy, verify)");
    console.log("   deals        : " + QUARTERS.map(function(q){ return "Q" + q + " " + (dealsByQ[q][id] || 0); }).join(" · "));
    console.log("");
  });

  // Per-quarter ready-to-enter table.
  console.log("=== READY-TO-ENTER (copy into Manage Periods → Edit roster; blank = present whole quarter) ===");
  QUARTERS.forEach(function(q){
    var b = qBounds(YEAR, q);
    console.log("\n--- " + b.qKey + "  (" + fmtD(b.qStart) + " .. " + fmtD(new Date(b.qEnd.getTime() - 1)) + ") ---");
    console.log("  " + pad("MEMBER (team)", 34) + pad("joinedAt", 14) + pad("leftAt", 14) + pad("deals", 7) + "note");
    deact.forEach(function(u){
      var e = ev(u); var id = String(u._id);
      var js = sJoin(e.activeSince, b), ls = sLeft(e.departure, b);
      var label = pad((u.name + " (" + leaderOf(u).name.split(" ")[0] + ")").slice(0, 33), 34);
      if (js === null || ls === null) { console.log("  " + label + "— not on team this quarter —"); return; }
      console.log("  " + label + pad(js === "" ? "—" : js, 14) + pad(ls === "" ? "—" : ls, 14) + pad(dealsByQ[q][id] || 0, 7) + (js === "" && ls === "" ? "present all quarter" : ""));
    });
  });
  console.log("\n(READ-ONLY report — no writes. '—' in joinedAt/leftAt = leave the field blank in the UI.)");
  await mongoose.disconnect();
})().catch(function(e){ console.error("ERR:", e && e.message); process.exit(1); });
