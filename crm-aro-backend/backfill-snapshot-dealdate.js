// ONE-TIME backfill — heal Commission snapshots whose frozen `snapshot.dealDate`
// is empty, so the Commissions card stops reading "closed —" and the deal re-enters
// its correct quarter/year in the date-filtered + attribution queries.
//
// Root cause: buildSnapshotForLead used to freeze `leadDoc.dealDate || ""` (raw
// dealDate only). For a lead whose raw dealDate was empty at commission-create time
// (but which has an eoiDate/updatedAt/createdAt), the snapshot froze "", while the
// Deals page showed a date via the effective-date chain. server.js now stamps the
// effective date going forward (effectiveDealDateIso); this script fixes the
// pre-existing rows.
//
// SAFETY — this script ONLY `$set`s snapshot.dealDate. It does NOT run
// computeAllRecipientShares / recomputeQuarterSiblings, so NO computed or paid
// amount changes. See the "RECOMPUTE IMPACT" section printed in DRY_RUN: once a
// healed deal is in its quarter, a LATER recompute (next deal close / revive /
// manual) could raise OWED shares via the retroactive-tier system — never PAID
// amounts (payouts[] live outside the snapshot). That recompute is a separate,
// admin-reviewed decision; this script never triggers it.
//
// USAGE — from crm-aro-backend/ (MONGODB_URI from env; via `railway run` on prod):
//   Preview only (DEFAULT — no writes):
//     railway run node backfill-snapshot-dealdate.js
//   Apply (writes snapshot.dealDate only):
//     railway run node backfill-snapshot-dealdate.js --apply
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
var APPLY = process.argv.indexOf("--apply") !== -1;
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required (railway run injects it)"); process.exit(1); }

var Commission = mongoose.model("Commission", new mongoose.Schema({}, { strict: false, timestamps: true }));
var Lead       = mongoose.model("Lead",       new mongoose.Schema({}, { strict: false, timestamps: true }));

// EXACT copy of server.js effectiveDealDateIso — keep in lockstep. Date-only
// "YYYY-MM-DD" so it stays comparable with the string quarter/range bounds.
function effectiveDealDateIso(lead) {
  if (!lead) return "";
  var toCairoDay = function(v){
    var dt = (v instanceof Date) ? v : new Date(v);
    if (isNaN(dt.getTime())) return "";
    return new Date(dt.getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
  };
  var strSrc = lead.dealDate || lead.eoiDate || "";
  if (strSrc) {
    var s = String(strSrc).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return toCairoDay(strSrc);
  }
  return toCairoDay(lead.updatedAt || lead.createdAt || "");
}

// Which source the date came from (for the preview only).
function sourceOf(lead) {
  if (!lead) return "(no lead)";
  if (lead.dealDate && String(lead.dealDate).slice(0,10)) return "dealDate";
  if (lead.eoiDate  && String(lead.eoiDate).slice(0,10))  return "eoiDate";
  if (lead.updatedAt) return "updatedAt";
  if (lead.createdAt) return "createdAt";
  return "(none)";
}
function quarterOf(iso) { // iso = YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "?";
  var y = iso.slice(0,4), m = parseInt(iso.slice(5,7), 10);
  return y + "-Q" + (Math.floor((m - 1) / 3) + 1);
}
var EMPTY_MATCH = { $or: [ { "snapshot.dealDate": "" }, { "snapshot.dealDate": { $exists: false } }, { "snapshot.dealDate": null } ] };

(async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  console.log("Connected. Mode: " + (APPLY ? "APPLY (writing snapshot.dealDate)" : "DRY_RUN (no writes)") + "\n");

  var totalComms  = await Commission.countDocuments({});
  var emptyAll    = await Commission.countDocuments(EMPTY_MATCH);
  var emptyActive = await Commission.countDocuments(Object.assign({ status: { $ne: "cancelled" } }, EMPTY_MATCH));
  var emptyCancel = emptyAll - emptyActive;

  console.log("===== DIAGNOSTIC (read-only) =====");
  console.log("Total commissions:                 " + totalComms);
  console.log("Empty snapshot.dealDate (ALL):     " + emptyAll);
  console.log("  · non-cancelled (heal targets):  " + emptyActive);
  console.log("  · cancelled (ignored):           " + emptyCancel);
  console.log("");

  // Heal targets = non-cancelled with empty dealDate.
  var targets = await Commission.find(Object.assign({ status: { $ne: "cancelled" } }, EMPTY_MATCH))
    .select("_id leadId status snapshot.customerName snapshot.salesAgent.userId snapshot.salesAgent.userName snapshot.dealTotal").lean();

  var leadIds = targets.map(function(t){ return t.leadId; }).filter(Boolean);
  var leads = leadIds.length ? await Lead.find({ _id: { $in: leadIds } })
    .select("dealDate eoiDate updatedAt createdAt leadId").lean() : [];
  var leadById = {}; leads.forEach(function(l){ leadById[String(l._id)] = l; });

  var healable = [], orphan = [], noDate = [];
  var buckets = {}; // "agentId|quarter" -> { agentName, quarter, deals, dealTotalSum }

  targets.forEach(function(c){
    var lead = c.leadId ? leadById[String(c.leadId)] : null;
    if (!lead) { orphan.push(c); return; }
    var eff = effectiveDealDateIso(lead);
    if (!eff) { noDate.push(c); return; }
    var agentId = (c.snapshot && c.snapshot.salesAgent && c.snapshot.salesAgent.userId) ? String(c.snapshot.salesAgent.userId) : "";
    var agentName = (c.snapshot && c.snapshot.salesAgent && c.snapshot.salesAgent.userName) || "(unknown)";
    var q = quarterOf(eff);
    var row = {
      commissionId: String(c._id),
      leadDisplayId: (lead.leadId != null ? lead.leadId : "—"),
      customer: (c.snapshot && c.snapshot.customerName) || "(unknown)",
      agent: agentName, agentId: agentId,
      from: sourceOf(lead), to: eff, quarter: q,
      dealTotal: Number((c.snapshot && c.snapshot.dealTotal) || 0)
    };
    healable.push(row);
    var key = agentId + "|" + q;
    if (!buckets[key]) buckets[key] = { agentName: agentName, quarter: q, deals: 0, dealTotalSum: 0 };
    buckets[key].deals++; buckets[key].dealTotalSum += row.dealTotal;
  });

  console.log("===== HEAL PREVIEW (\"\" -> date) =====");
  console.log("Healable: " + healable.length + " | Orphan (no lead): " + orphan.length + " | No derivable date: " + noDate.length + "\n");
  healable.forEach(function(r){
    console.log("  #" + r.leadDisplayId + "  " + r.customer + "  [" + r.agent + "]  \"\" -> " + r.to + " (from " + r.from + ", " + r.quarter + ")  comm=" + r.commissionId);
  });
  if (orphan.length) { console.log("\n  ORPHANS (commission.leadId has no lead — left as \"\"):"); orphan.forEach(function(c){ console.log("    comm=" + String(c._id) + " customer=" + ((c.snapshot&&c.snapshot.customerName)||"?")); }); }

  console.log("\n===== RECOMPUTE IMPACT (agents/quarters that gain deals) =====");
  console.log("This script does NOT recompute. But these agent+quarter buckets now include");
  console.log("healed deals, so a LATER recompute could shift OWED shares (never PAID):");
  Object.keys(buckets).sort().forEach(function(k){
    var b = buckets[k];
    console.log("  " + b.agentName + " · " + b.quarter + ": +" + b.deals + " deal(s), +" + b.dealTotalSum.toLocaleString() + " EGP to quarter achievement");
  });

  if (APPLY) {
    console.log("\n===== APPLYING (snapshot.dealDate only) =====");
    var applied = 0;
    for (var i = 0; i < healable.length; i++) {
      var r = healable[i];
      await Commission.updateOne({ _id: r.commissionId }, { $set: { "snapshot.dealDate": r.to } });
      applied++;
    }
    console.log("Applied snapshot.dealDate to " + applied + " commission(s). No amounts touched.");
  } else {
    console.log("\nDRY_RUN — no writes. Re-run with --apply to write snapshot.dealDate (amount-safe).");
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch(function(e){ console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });
