// One-shot, idempotent backfill: create synthetic deal-Notification rows for
// every existing EOI / Approved-EOI / DoneDeal lead that doesn't already have
// one. Rationale lives in CLAUDE.md "Deal Notifications — DO NOT BREAK".
//
// Why this exists:
// Before the 2026-05-16 read-state fix, the deal bell's unread count was
// driven by a client-side localStorage cutoff and the dropdown LIST was
// derived live from leads/DRs. After the fix, both the icon badge and the
// dropdown header count read from Notification documents (seenBy[] per user).
// Leads that became EOI/DoneDeal before the live creation path was wired up
// (or via paths that never fired addDealNotif) therefore contribute zero to
// the unread count even though they appear in the dropdown. This backfill
// closes that gap by minting a synthetic Notification per legacy lead.
//
// Idempotency:
// Uniqueness is enforced by an explicit (type, leadId) check before each
// insert — re-running the script never produces duplicates. No unique index
// is created here (would risk colliding with existing index plans and would
// block real-time creates if a legacy row had any data issue).
//
// Read-only by default. Pass CONFIRM=yes to actually write the new rows.
//
// Run (dry-run — counts only, no writes):
//   MONGODB_URI="mongodb+srv://..." node scripts/backfill-deal-notifications.js
//
// Run (commit):
//   MONGODB_URI="mongodb+srv://..." CONFIRM=yes node scripts/backfill-deal-notifications.js
//
// Optional:
//   BATCH=200  (insertMany batch size; default 200)

"use strict";

var mongoose = require("mongoose");

var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI env var is required.");
  process.exit(1);
}
var CONFIRM = String(process.env.CONFIRM || "").toLowerCase() === "yes";
var BATCH   = Math.max(1, Number(process.env.BATCH) || 200);

// strict:false so we can read any legacy fields without re-declaring the full
// schema. timestamps:true keeps the createdAt/updatedAt we depend on for the
// timestamp pick.
var LeadSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Lead       = mongoose.model("Lead", LeadSchema);

var UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var User       = mongoose.model("User", UserSchema);

// Match the server-side Notification schema exactly. Defaults mirror the
// production schema at server.js:282-293 — most importantly seenBy:[] so every
// admin sees these as unread on their next bell open.
var NotificationSchema = new mongoose.Schema({
  type:      { type: String, required: true },
  leadName:  { type: String, default: "" },
  leadId:    { type: String, default: "" },
  agentName: { type: String, default: "" },
  fromName:  { type: String, default: "" },
  toName:    { type: String, default: "" },
  status:    { type: String, default: "" },
  budget:    { type: String, default: "" },
  reason:    { type: String, default: "" },
  seenBy:    [{ type: String }]
}, { timestamps: true });
var Notification = mongoose.model("Notification", NotificationSchema);

// Pick the most-recent available transition timestamp so the synthetic
// notification slots into the bell timeline at roughly the right place.
// Order of signals (most → least specific):
//   DoneDeal: dealDate, eoiDate (EOI→Deal carries over), lastActivityTime, updatedAt, createdAt
//   EOI:      eoiDate, lastActivityTime, updatedAt, createdAt
// Returned as a JS Date. Any string is parsed; invalid/missing values are
// skipped. Falls back to lead.createdAt (always present on real docs).
function pickTransitionTimestamp(lead, isDeal) {
  var candidates = [];
  if (isDeal) candidates.push(lead.dealDate);
  candidates.push(lead.eoiDate, lead.lastActivityTime, lead.updatedAt, lead.createdAt);
  var best = null;
  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    if (!c) continue;
    var d = c instanceof Date ? c : new Date(c);
    if (isNaN(d.getTime())) continue;
    if (best === null || d.getTime() > best.getTime()) best = d;
  }
  return best || new Date(); // last-resort, should never happen on real leads
}

// Live creation shape from src/App.js addDealNotif:
//   { type:"deal", leadName, leadId, agentName, status, budget }
// Match field-for-field so the dropdown renders synthetic rows identically.
// agentName is best-effort: populated from the User doc when agentId resolves,
// otherwise "" (matches what live creates do when cu.name is empty).
function buildNotifDoc(lead, agentNameById, isDeal, when) {
  var aid = lead.agentId ? String(lead.agentId._id || lead.agentId) : "";
  var aname = aid && agentNameById[aid] ? agentNameById[aid] : "";
  // Status field mirrors what the live FE sends: "DoneDeal" or "EOI". The bell
  // dropdown doesn't currently read this back (it derives label from kind on
  // the live item), but we keep it for symmetry + future use.
  var st = isDeal ? "DoneDeal" : "EOI";
  return {
    type:      "deal",
    leadName:  lead.name || "",
    leadId:    String(lead._id),
    agentName: aname,
    fromName:  "",
    toName:    "",
    status:    st,
    budget:    lead.budget || "",
    reason:    "",
    seenBy:    [],
    createdAt: when,
    updatedAt: when
  };
}

(async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.\n");

    // Bucket A: DoneDeal leads (status === "DoneDeal" OR globalStatus === "donedeal").
    // Bucket B: EOI leads (status === "EOI" OR globalStatus === "eoi" OR eoiStatus
    //          is "Pending" / "Approved" — covers the "Approved EOI" branch).
    // Archived leads are EXCLUDED — matching getVisibleNotifications which
    // already filters them out of the bell.
    var dealQuery = {
      archived: { $ne: true },
      $or: [{ status: "DoneDeal" }, { globalStatus: "donedeal" }]
    };
    var eoiQuery = {
      archived: { $ne: true },
      $or: [
        { status: "EOI" },
        { globalStatus: "eoi" },
        { eoiStatus: "Pending" },
        { eoiStatus: "Approved" }
      ],
      // Exclude leads that are ALREADY in DoneDeal — they'll be handled by
      // the deal bucket. The eoiStatus field can carry "Approved" on a
      // deal-converted lead, so this guard prevents counting the same lead twice.
      status: { $ne: "DoneDeal" },
      globalStatus: { $ne: "donedeal" }
    };

    var dealLeads = await Lead.find(dealQuery).lean();
    var eoiLeads  = await Lead.find(eoiQuery).lean();

    console.log("Found " + dealLeads.length + " DoneDeal leads.");
    console.log("Found " + eoiLeads.length + " EOI / Approved-EOI leads.\n");

    // Pre-load existing deal-notification leadIds in ONE query, so per-lead
    // dedupe is a Set lookup instead of N round-trips. Same as how the
    // server-side existing offsite backfill checks for existing rows but
    // batched up-front.
    var existingRows = await Notification.find(
      { type: "deal" },
      { leadId: 1 }
    ).lean();
    var existingLeadIds = new Set(existingRows.map(function(r){ return String(r.leadId || ""); }));
    console.log("Found " + existingLeadIds.size + " existing deal notifications (will be skipped).\n");

    // Resolve agentId → name in one pass for all leads we might insert. Most
    // legacy leads share a small pool of agents; populate() would issue many
    // queries per lead, so we batch.
    var agentIds = new Set();
    var collectAgent = function(lead) {
      if (lead.agentId) agentIds.add(String(lead.agentId._id || lead.agentId));
    };
    dealLeads.forEach(collectAgent);
    eoiLeads.forEach(collectAgent);
    var agentNameById = {};
    if (agentIds.size > 0) {
      var users = await User.find(
        { _id: { $in: Array.from(agentIds) } },
        { name: 1 }
      ).lean();
      users.forEach(function(u){ agentNameById[String(u._id)] = u.name || ""; });
    }

    function plan(leads, isDeal) {
      var toInsert = [];
      var skipped  = 0;
      for (var i = 0; i < leads.length; i++) {
        var lead = leads[i];
        var lid  = String(lead._id);
        if (existingLeadIds.has(lid)) { skipped++; continue; }
        var when = pickTransitionTimestamp(lead, isDeal);
        toInsert.push(buildNotifDoc(lead, agentNameById, isDeal, when));
        // Add to the in-memory set so an EOI lead that somehow also matched
        // the deal bucket (shouldn't, but defense in depth) isn't double-inserted.
        existingLeadIds.add(lid);
      }
      return { toInsert: toInsert, skipped: skipped };
    }

    var dealPlan = plan(dealLeads, true);
    var eoiPlan  = plan(eoiLeads,  false);

    console.log("DoneDeal: " + dealPlan.toInsert.length + " to insert, " + dealPlan.skipped + " skipped (already had one).");
    console.log("EOI:      " + eoiPlan.toInsert.length  + " to insert, " + eoiPlan.skipped  + " skipped (already had one).");

    if (!CONFIRM) {
      console.log("\nDRY-RUN ONLY. Re-run with CONFIRM=yes to commit the inserts.");
      await mongoose.disconnect();
      return;
    }

    console.log("\nCOMMIT mode. Inserting in batches of " + BATCH + "...");
    var all = dealPlan.toInsert.concat(eoiPlan.toInsert);
    var inserted = 0;
    for (var off = 0; off < all.length; off += BATCH) {
      var chunk = all.slice(off, off + BATCH);
      var res = await Notification.insertMany(chunk, { ordered: false });
      inserted += res.length;
      process.stdout.write("\r  inserted " + inserted + " / " + all.length);
    }
    console.log("\n");

    console.log("=== SUMMARY ===");
    console.log("DoneDeal leads found:           " + dealLeads.length);
    console.log("EOI / Approved-EOI leads found: " + eoiLeads.length);
    console.log("Notifications created:          " + inserted);
    console.log("Notifications skipped (existed): " + (dealPlan.skipped + eoiPlan.skipped));

    await mongoose.disconnect();
  } catch (e) {
    console.error("[backfill-deal-notifications]", e && e.stack ? e.stack : e);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();
