// ============================================================================
// Target-period historical backfill (Phase 5 of the time-locked Target overhaul).
//
//   DRY-RUN (default): node migrate-target-periods.js            (READ-ONLY)
//   APPLY:             node migrate-target-periods.js --apply
//   options:
//     --year=YYYY       year to backfill        (default: current UTC year)
//     --quarters=1,2    quarters to backfill    (default: COMPLETED quarters of that year)
//     --force           regenerate existing DRAFT periods (NEVER touches CLOSED)
//
// For each (leader, quarter) it generates a DRAFT TargetPeriod from the leader's
// CURRENT roster, setting every member's joinedAt to an "active-since" proxy =
// min(startingDate, createdAt, earliest activity, earliest deal dealDate,
// earliest agentHistory date). computePresenceFraction then:
//   - active-since <= quarter start  -> present all quarter (full pro-rated target)
//   - active-since within the quarter -> partial presence (pro-rated down)
//   - active-since after quarter end  -> 0% present (excluded from the team target)
// That last case is exactly the retroactive-collapse fix: a member who joined
// AFTER a past quarter no longer inflates that quarter's team target.
//
// Commission.snapshot leader chains are mined only to FLAG (not auto-move) agents
// whose team-leader/manager at deal-time differs from their current leader, so the
// admin knows which rows to double-check.
//
// Output is a DRAFT the admin then reviews + Closes in the "Manage Periods" UI
// (decision 4 = manual confirm every past period). NEVER touches User.qTargets, so
// no commission is affected. Idempotent: skips an existing period unless --force,
// and NEVER overwrites a CLOSED one.
// ============================================================================
var mongoose = require("mongoose");
var URI = process.env.MONGODB_URI;
if (!URI) { console.error("no MONGODB_URI in env"); process.exit(1); }

var APPLY = process.argv.indexOf("--apply") >= 0;
var FORCE = process.argv.indexOf("--force") >= 0;
function argVal(name) {
  var hit = process.argv.filter(function(a){ return a.indexOf("--" + name + "=") === 0; })[0];
  return hit ? hit.split("=")[1] : null;
}
var nowUTC = new Date();
var CUR_YEAR = nowUTC.getUTCFullYear();
var CUR_Q = Math.floor(nowUTC.getUTCMonth() / 3) + 1;
var YEAR = argVal("year") ? parseInt(argVal("year"), 10) : CUR_YEAR;
var QUARTERS = (function(){
  var q = argVal("quarters");
  if (q) return q.split(",").map(function(x){ return parseInt(x, 10); }).filter(function(n){ return n >= 1 && n <= 4; });
  if (YEAR < CUR_YEAR) return [1, 2, 3, 4];
  if (YEAR > CUR_YEAR) return [];
  var out = []; for (var i = 1; i < CUR_Q; i++) out.push(i); return out; // completed quarters of the current year
})();

// ---------- helpers (mirrors of the server.js Phase 2 math) ----------
function qPeriodBounds(year, quarter) {
  var qStart = new Date(Date.UTC(year, (quarter - 1) * 3, 1, 0, 0, 0, 0));
  var qEnd   = new Date(Date.UTC(year, quarter * 3, 1, 0, 0, 0, 0));
  return { qStart: qStart, qEnd: qEnd, qStartIso: qStart.toISOString().slice(0, 10), qEndIso: qEnd.toISOString().slice(0, 10), qKey: year + "-Q" + quarter };
}
function computePresenceFraction(joinedAt, leftAt, qStart, qEnd) {
  var qs = qStart.getTime(), qe = qEnd.getTime();
  var span = qe - qs;
  if (span <= 0) return 0;
  var start = joinedAt ? Math.max(new Date(joinedAt).getTime(), qs) : qs;
  var end   = leftAt   ? Math.min(new Date(leftAt).getTime(),   qe) : qe;
  if (end <= start) return 0;
  var frac = (end - start) / span;
  if (frac < 0) return 0;
  if (frac > 1) return 1;
  return frac;
}
function readQTarget(user, year, qNum) {
  if (!user || !user.qTargets) return 0;
  var qt = user.qTargets, newKey = year + "-Q" + qNum;
  if (qt[newKey] !== undefined) return Number(qt[newKey]) || 0;
  if (year === CUR_YEAR) { var lk = "Q" + qNum; if (qt[lk] !== undefined) return Number(qt[lk]) || 0; }
  return 0;
}
function minDate(list) {
  var m = null;
  for (var i = 0; i < list.length; i++) {
    var d = list[i]; if (!d) continue;
    var tt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(tt.getTime())) continue;
    if (m === null || tt < m) m = tt;
  }
  return m;
}
function fmtEGP(n) { return (Number(n) || 0).toLocaleString(); }
function fmtD(d) { return d ? new Date(d).toISOString().slice(0, 10) : "—"; }

(async function(){
  await mongoose.connect(URI, { dbName: "test" });
  var User            = mongoose.model("User",            new mongoose.Schema({}, { strict: false, collection: "users" }));
  var Lead            = mongoose.model("Lead",            new mongoose.Schema({}, { strict: false, collection: "leads" }));
  var Activity        = mongoose.model("Activity",        new mongoose.Schema({}, { strict: false, collection: "activities" }));
  var Commission      = mongoose.model("Commission",      new mongoose.Schema({}, { strict: false, collection: "commissions" }));
  var TargetPeriod    = mongoose.model("TargetPeriod",    new mongoose.Schema({}, { strict: false, collection: "targetperiods" }));

  console.log("=== TARGET-PERIOD BACKFILL — " + (APPLY ? "APPLY" : "DRY-RUN (READ-ONLY)") + " ===");
  console.log("Year " + YEAR + ", quarters: " + (QUARTERS.length ? QUARTERS.map(function(q){ return "Q" + q; }).join(", ") : "(none)") + (FORCE ? "  [--force]" : ""));
  if (!QUARTERS.length) { console.log("No completed quarters to backfill. Pass --year/--quarters explicitly."); await mongoose.disconnect(); return; }

  // Leaders whose team periods we build (managers + team_leaders with reports).
  var leaders = await User.find({ role: { $in: ["manager", "team_leader"] }, active: { $ne: false } })
    .select("_id name role teamId teamName qTargets startingDate createdAt").lean();
  console.log("Leaders (manager/team_leader): " + leaders.length + "\n");

  // active-since signals, batched across ALL users (one aggregation each).
  var actAgg  = await Activity.aggregate([{ $group: { _id: "$userId", d: { $min: "$createdAt" } } }]);
  var dealAgg = await Lead.aggregate([
    { $match: { $or: [{ status: "DoneDeal" }, { globalStatus: "donedeal" }], dealDate: { $type: "string", $gt: "" } } },
    { $group: { _id: "$agentId", d: { $min: "$dealDate" } } }
  ]);
  var histAgg = await Lead.aggregate([
    { $unwind: "$agentHistory" },
    { $match: { "agentHistory.date": { $ne: null } } },
    { $group: { _id: "$agentHistory.agentId", d: { $min: "$agentHistory.date" } } }
  ]);
  var earliestAct = {}, earliestDeal = {}, earliestHist = {};
  actAgg.forEach(function(r){ if (r._id) earliestAct[String(r._id)] = r.d; });
  dealAgg.forEach(function(r){ if (r._id) earliestDeal[String(r._id)] = r.d; });
  histAgg.forEach(function(r){ if (r._id) earliestHist[String(r._id)] = r.d; });

  function activeSince(u) {
    return minDate([u.startingDate, u.createdAt, earliestAct[String(u._id)], earliestDeal[String(u._id)], earliestHist[String(u._id)]]);
  }

  // All users we may need as roster members (sales + team_leader), by leader.
  var members = await User.find({ role: { $in: ["sales", "team_leader"] }, active: { $ne: false } })
    .select("_id name role reportsTo teamId teamName qTargets startingDate createdAt").lean();
  function rosterOf(leaderId) {
    var lid = String(leaderId);
    return members.filter(function(u){
      var rt = u.reportsTo && u.reportsTo._id ? String(u.reportsTo._id) : String(u.reportsTo || "");
      return rt === lid;
    });
  }

  // Departed-member awareness (policy: anyone on a team during a period counts,
  // deactivated or hard-deleted). Load ALL users (incl. inactive) to detect both.
  var allUsers = await User.find({}).select("_id name role active reportsTo").lean();
  var allUserIds = {}; allUsers.forEach(function(u){ allUserIds[String(u._id)] = u; });
  function leaderName(id){ for (var i = 0; i < leaders.length; i++){ if (String(leaders[i]._id) === String(id)) return leaders[i].name; } return null; }
  var deact = allUsers.filter(function(u){
    if (u.active !== false) return false;
    var rt = u.reportsTo && u.reportsTo._id ? String(u.reportsTo._id) : String(u.reportsTo || "");
    return !!leaderName(rt);
  });
  if (deact.length) {
    console.log("--- DEACTIVATED members still linked to a team (add each via the Manage Periods picker) ---");
    deact.forEach(function(u){ var rt = u.reportsTo && u.reportsTo._id ? String(u.reportsTo._id) : String(u.reportsTo || ""); console.log("  • " + u.name + " (" + u.role + ") → team of " + leaderName(rt)); });
    console.log("");
  }

  var totals = { create: 0, skipClosed: 0, skipExisting: 0, skipNoTeam: 0, flags: 0 };

  for (var qi = 0; qi < QUARTERS.length; qi++) {
    var Q = QUARTERS[qi];
    var b = qPeriodBounds(YEAR, Q);
    console.log("--- " + b.qKey + "  (" + b.qStartIso + " .. " + b.qEndIso + ") ---");

    // Mine commission snapshots dated in this quarter: agentId -> set of leaderIds
    // (teamLeader/manager) seen, for the "different leader at deal-time" flag.
    var comms = await Commission.find({ "snapshot.dealDate": { $gte: b.qStartIso, $lt: b.qEndIso } }).select("snapshot").lean();
    var agentSnapLeaders = {};
    comms.forEach(function(c){
      var s = c.snapshot; if (!s || !s.salesAgent || !s.salesAgent.userId) return;
      var ag = String(s.salesAgent.userId);
      agentSnapLeaders[ag] = agentSnapLeaders[ag] || {};
      ["teamLeader", "manager"].forEach(function(slot){
        if (s[slot] && s[slot].userId) agentSnapLeaders[ag][String(s[slot].userId)] = true;
      });
    });

    // Orphaned producers — DoneDeal agentIds this quarter that belong to NO user
    // doc (hard-deleted). Add as manual rows in the UI with the agentId linked so
    // their deals still count at close. Names recovered from commission snapshots.
    var snapName = {};
    comms.forEach(function(c){ var s = c.snapshot; if (s && s.salesAgent && s.salesAgent.userId) snapName[String(s.salesAgent.userId)] = s.salesAgent.userName || snapName[String(s.salesAgent.userId)]; });
    var dealByAgent = await Lead.aggregate([
      { $match: { $or: [{ status: "DoneDeal" }, { globalStatus: "donedeal" }], archived: { $ne: true } } },
      { $addFields: { _eff: { $let: { vars: { d1: { $convert: { input: "$dealDate", to: "date", onError: null, onNull: null } } },
        in: { $ifNull: ["$$d1", { $ifNull: [{ $convert: { input: "$eoiDate", to: "date", onError: null, onNull: null } }, { $ifNull: ["$updatedAt", "$createdAt"] }] }] } } } } },
      { $match: { _eff: { $gte: b.qStart, $lt: b.qEnd } } },
      { $group: { _id: "$agentId", deals: { $sum: 1 } } }
    ]);
    var orphans = dealByAgent.filter(function(r){ return r._id && !allUserIds[String(r._id)]; });
    if (orphans.length) {
      console.log("  ⚑ ORPHANED PRODUCERS (hard-deleted, had deals this quarter — add as manual rows, link the agentId):");
      orphans.forEach(function(r){ console.log("      • " + (snapName[String(r._id)] || "(name unknown)") + " — " + r.deals + " deal(s) — agentId " + String(r._id)); });
    }

    for (var li = 0; li < leaders.length; li++) {
      var lead = leaders[li];
      var roster = rosterOf(lead._id);
      if (roster.length === 0) { totals.skipNoTeam++; continue; }

      var existing = await TargetPeriod.findOne({ leaderId: lead._id, year: YEAR, quarter: Q }).select("status").lean();
      var action = "create";
      if (existing) {
        if (existing.status === "closed") { totals.skipClosed++; console.log("  [skip closed]  " + lead.name); continue; }
        if (!FORCE) { totals.skipExisting++; console.log("  [skip exists]  " + lead.name + " (draft — use --force to regenerate)"); continue; }
        action = "regen";
      }

      // Build members[] — leader first (isLeader, always present), then roster.
      var out = [];
      var leadFull = readQTarget(lead, YEAR, Q);
      out.push({ userId: lead._id, userName: lead.name || "", role: lead.role || "", isLeader: true,
        fullQuarterTarget: leadFull, joinedAt: null, leftAt: null, presenceFraction: 1, proratedTarget: leadFull, achievedSnapshot: 0 });

      var rowFlags = [];
      roster.forEach(function(u){
        var since = activeSince(u);
        var joinedAt = (since && since.getTime() > b.qStart.getTime()) ? since : null; // null = present at/before qStart
        var frac = computePresenceFraction(joinedAt, null, b.qStart, b.qEnd);
        var full = readQTarget(u, YEAR, Q);
        out.push({ userId: u._id, userName: u.name || "", role: u.role || "", isLeader: false,
          fullQuarterTarget: full, joinedAt: joinedAt, leftAt: null,
          presenceFraction: Math.round(frac * 10000) / 10000, proratedTarget: Math.round(full * frac), achievedSnapshot: 0 });

        if (frac <= 0) rowFlags.push("⚠ " + (u.name || "?") + ": 0% present (active-since " + fmtD(since) + ", after quarter) → excluded");
        else if (frac < 0.999) rowFlags.push("⚠ " + (u.name || "?") + ": " + Math.round(frac * 100) + "% present (joined " + fmtD(joinedAt) + ")");
        var snap = agentSnapLeaders[String(u._id)];
        if (snap && !snap[String(lead._id)] && Object.keys(snap).length > 0) {
          rowFlags.push("⚠ " + (u.name || "?") + ": commission snapshots this quarter show a different team-leader/manager — verify they were under " + (lead.name || "this leader"));
        }
      });

      var teamTarget = out.reduce(function(s, m){ return s + (m.isLeader ? 0 : (m.proratedTarget || 0)); }, 0);
      if (teamTarget === 0) teamTarget = leadFull; // subs-only fallback -> leader's own (mirrors member-stats)
      totals.flags += rowFlags.length;
      totals.create++;

      console.log("  [" + (action === "regen" ? "regen" : "create") + "]  " + lead.name + " (" + lead.role + ") — " + roster.length + " members, teamTarget " + fmtEGP(teamTarget));
      rowFlags.forEach(function(f){ console.log("      " + f); });

      if (APPLY) {
        await TargetPeriod.updateOne(
          { leaderId: lead._id, year: YEAR, quarter: Q },
          { $set: {
              teamId: lead.teamId || "", teamName: lead.teamName || "", qKey: b.qKey,
              status: "draft", members: out, teamTarget: teamTarget,
              teamAchievedSnapshot: 0, teamDealsSnapshot: 0, teamLeadsSnapshot: 0,
              closedAt: null, closedBy: null, updatedAt: new Date()
            },
            $setOnInsert: { createdAt: new Date() }
          },
          { upsert: true }
        );
      }
    }
    console.log("");
  }

  console.log("=== SUMMARY ===");
  console.log((APPLY ? "Created/updated" : "Would create") + " " + totals.create + " draft period(s)  ·  " +
    totals.skipClosed + " closed skipped  ·  " + totals.skipExisting + " existing-draft skipped  ·  " +
    totals.skipNoTeam + " leader-quarters with no team  ·  " + totals.flags + " member row(s) flagged for review");
  if (!APPLY) {
    console.log("\n(DRY-RUN complete — READ-ONLY, no writes. Re-run with --apply to create the drafts,");
    console.log(" then review each in Sales Team → 🎯 Manage Periods and press Close to freeze.)");
  } else {
    console.log("\nDrafts written. Review + Close each in Sales Team → 🎯 Manage Periods (nothing shows on the");
    console.log("Sales Team page until a period is CLOSED).");
  }
  await mongoose.disconnect();
})().catch(function(e){ console.error("ERR:", e && e.message); process.exit(1); });
