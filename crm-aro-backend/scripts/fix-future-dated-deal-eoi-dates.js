// One-shot fix for leads whose dealDate / eoiDate is set to a future
// timestamp (data-entry mistake — e.g. dealDate "2026-12-15" typed when
// "2026-02-15" was meant). FE timeAgo() renders any future date as the date
// itself (after the 2026-05-16 defensive patch), but the underlying data is
// still wrong and bleeds into reports, the EOI/Deals page sort order, and
// the synthetic notification.createdAt minted by the deal-backfill script.
//
// Strategy (per lead, for whichever of dealDate / eoiDate is future):
//   1. Look for the most recent Activity row with type="status_change" for
//      this leadId whose note marks the relevant transition:
//        - DoneDeal: note contains "[DoneDeal]" OR "deal close" (the
//          commission lifecycle hook fires "[Commission] Auto-created on
//          deal close" — server.js writes this on every DoneDeal transition,
//          so it's the most reliable signal for converted leads).
//        - EOI:      note contains "[EOI]" OR "eoi" (case-insensitive).
//      Pick that row's createdAt.
//   2. If no matching Activity row, fall back to:
//        - For DoneDeal: assignments[i].lastActionAt where assignments[i].status
//          == "DoneDeal" (the slice whose snapshot of the lead is in deal state).
//        - For EOI:      assignments[i].lastActionAt where assignments[i].status
//          == "EOI" or eoiStatus is set.
//      Then lead.lastActivityTime as final fallback. lead.createdAt is
//      INTENTIONALLY EXCLUDED — using it would put dealDate at the lead
//      creation moment, which is rarely the conversion moment and produces
//      "1 second after createdAt" timestamps that look weird in reports.
//   3. If even fallback fails, log a warning and skip.
//
// Notification mirror:
// For each lead whose dealDate is fixed, the corresponding type="deal"
// Notification row's createdAt is mirrored to the same resolved timestamp.
// Uses raw collection.updateOne to bypass Mongoose's timestamps:true
// middleware (which would otherwise re-stamp updatedAt and could interact
// badly with explicit createdAt writes).
//
// Idempotency: re-running after a successful commit is a no-op. Once
// dealDate/eoiDate is set to a non-future value, the lead is no longer a
// candidate. The notification mirror only runs when the lead is found,
// and the new createdAt equals the resolved value, so re-running is
// idempotent there too.
//
// Read-only by default. Pass CONFIRM=yes to commit.
//
// Run (dry-run):
//   MONGODB_URI="mongodb+srv://..." node scripts/fix-future-dated-deal-eoi-dates.js
//
// Run (commit):
//   MONGODB_URI="mongodb+srv://..." CONFIRM=yes node scripts/fix-future-dated-deal-eoi-dates.js

"use strict";

var mongoose = require("mongoose");

var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI env var is required.");
  process.exit(1);
}
var CONFIRM = String(process.env.CONFIRM || "").toLowerCase() === "yes";

var LeadSchema         = new mongoose.Schema({}, { strict: false, timestamps: true });
var Lead               = mongoose.model("Lead", LeadSchema);
var ActivitySchema     = new mongoose.Schema({}, { strict: false, timestamps: true });
var Activity           = mongoose.model("Activity", ActivitySchema);
var NotificationSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Notification       = mongoose.model("Notification", NotificationSchema);

function isFutureTs(v) {
  if (!v) return false;
  var t = new Date(v).getTime();
  return isFinite(t) && t > Date.now();
}

// Resolve the transition timestamp for a given lead + bucket. Returns a
// Date or null. Logs the resolution path used (for the dry-run plan output).
async function resolveTransitionDate(lead, bucket /* "DoneDeal" | "EOI" */) {
  // 1. Activity collection — primary signal.
  var notePatterns;
  if (bucket === "DoneDeal") {
    notePatterns = ["[DoneDeal]", "deal close"];
  } else {
    notePatterns = ["[EOI]", "EOI"];
  }
  var acts = await Activity.find(
    { leadId: lead._id, type: "status_change" },
    { createdAt: 1, note: 1 }
  ).sort({ createdAt: -1 }).lean();
  for (var i = 0; i < acts.length; i++) {
    var note = String(acts[i].note || "");
    var match = notePatterns.some(function(p){ return note.indexOf(p) !== -1; });
    if (match) {
      return { ts: new Date(acts[i].createdAt), source: "Activity.status_change(" + note.slice(0, 40) + ")" };
    }
  }

  // 2. assignments[i].lastActionAt for the slice currently in the target state.
  var slices = Array.isArray(lead.assignments) ? lead.assignments : [];
  for (var j = 0; j < slices.length; j++) {
    var a = slices[j];
    if (!a) continue;
    var matchState = (bucket === "DoneDeal" && a.status === "DoneDeal")
                  || (bucket === "EOI"      && a.status === "EOI");
    if (matchState && a.lastActionAt) {
      var d = new Date(a.lastActionAt);
      if (isFinite(d.getTime())) {
        return { ts: d, source: "assignments[" + j + "].lastActionAt" };
      }
    }
  }

  // 3. lead.lastActivityTime — final fallback.
  if (lead.lastActivityTime) {
    var d2 = new Date(lead.lastActivityTime);
    if (isFinite(d2.getTime())) {
      return { ts: d2, source: "lead.lastActivityTime" };
    }
  }

  // No usable signal.
  return null;
}

(async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.\n");

    // Future-dated dealDate / eoiDate leads. Dates are stored as ISO strings,
    // so we fetch all candidates and filter in JS (collection is small).
    var dealCandidates = await Lead.find(
      { archived: { $ne: true }, dealDate: { $exists: true, $ne: "", $ne: null } },
      { name: 1, status: 1, eoiStatus: 1, globalStatus: 1, dealDate: 1, eoiDate: 1, lastActivityTime: 1, createdAt: 1, assignments: 1 }
    ).lean();
    var futureDealLeads = dealCandidates.filter(function(l){ return isFutureTs(l.dealDate); });

    var eoiCandidates = await Lead.find(
      { archived: { $ne: true }, eoiDate: { $exists: true, $ne: "", $ne: null } },
      { name: 1, status: 1, eoiStatus: 1, globalStatus: 1, dealDate: 1, eoiDate: 1, lastActivityTime: 1, createdAt: 1, assignments: 1 }
    ).lean();
    var futureEoiLeads = eoiCandidates.filter(function(l){ return isFutureTs(l.eoiDate); });

    console.log("Future-dated dealDate leads: " + futureDealLeads.length);
    console.log("Future-dated eoiDate  leads: " + futureEoiLeads.length);
    console.log("");

    // Resolve a target timestamp for each affected (lead, field).
    var plan = []; // { lead, field, oldValue, newTs, source, notifId?, notifOldCreatedAt? }
    var skipped = [];

    for (var i = 0; i < futureDealLeads.length; i++) {
      var l = futureDealLeads[i];
      var r = await resolveTransitionDate(l, "DoneDeal");
      if (!r) {
        skipped.push({ id: l._id, name: l.name, field: "dealDate", reason: "no Activity/slice/lastActivityTime signal" });
        continue;
      }
      // Look up the corresponding deal-notification (if any) to mirror createdAt.
      var notif = await Notification.findOne(
        { type: "deal", leadId: String(l._id) },
        { createdAt: 1 }
      ).lean();
      plan.push({
        lead: l,
        field: "dealDate",
        oldValue: l.dealDate,
        newTs: r.ts,
        source: r.source,
        notifId: notif ? notif._id : null,
        notifOldCreatedAt: notif ? notif.createdAt : null
      });
    }
    for (var k = 0; k < futureEoiLeads.length; k++) {
      var le = futureEoiLeads[k];
      var re = await resolveTransitionDate(le, "EOI");
      if (!re) {
        skipped.push({ id: le._id, name: le.name, field: "eoiDate", reason: "no Activity/slice/lastActivityTime signal" });
        continue;
      }
      // EOI side: notification.createdAt mirror runs for the matching notif too —
      // a single notification can represent either EOI or DoneDeal state.
      var notifE = await Notification.findOne(
        { type: "deal", leadId: String(le._id) },
        { createdAt: 1 }
      ).lean();
      plan.push({
        lead: le,
        field: "eoiDate",
        oldValue: le.eoiDate,
        newTs: re.ts,
        source: re.source,
        notifId: notifE ? notifE._id : null,
        notifOldCreatedAt: notifE ? notifE.createdAt : null
      });
    }

    if (plan.length === 0 && skipped.length === 0) {
      console.log("Nothing to do. No future-dated dealDate/eoiDate leads found.");
      await mongoose.disconnect();
      return;
    }

    console.log("=== PLAN ===");
    plan.forEach(function(p){
      var leadName = p.lead.name || "(no name)";
      console.log("  Lead " + p.lead._id + "  " + leadName);
      console.log("    " + p.field + ":  " + p.oldValue + "  →  " + p.newTs.toISOString());
      console.log("    source:     " + p.source);
      if (p.notifId) {
        var oldNotifTs = p.notifOldCreatedAt ? new Date(p.notifOldCreatedAt).toISOString() : "(none)";
        console.log("    notif " + p.notifId + " createdAt:  " + oldNotifTs + "  →  " + p.newTs.toISOString());
      } else {
        console.log("    (no matching deal-notification row to mirror)");
      }
    });
    if (skipped.length > 0) {
      console.log("");
      console.log("SKIPPED:");
      skipped.forEach(function(s){
        console.warn("  WARN " + s.id + " (" + (s.name || "(no name)") + ") " + s.field + " — " + s.reason);
      });
    }

    if (!CONFIRM) {
      console.log("");
      console.log("DRY-RUN ONLY. Re-run with CONFIRM=yes to commit.");
      await mongoose.disconnect();
      return;
    }

    console.log("");
    console.log("COMMIT mode. Applying updates...");
    var leadUpdates = 0;
    var notifUpdates = 0;
    for (var p_i = 0; p_i < plan.length; p_i++) {
      var p = plan[p_i];
      var leadField = {}; leadField[p.field] = p.newTs.toISOString();
      // lead update — go through Mongoose (timestamps:true is FINE here:
      // we're not setting createdAt/updatedAt explicitly).
      var lr = await Lead.updateOne({ _id: p.lead._id }, { $set: leadField });
      if (lr.modifiedCount === 1) {
        leadUpdates++;
        console.log("  Lead " + p.lead._id + " " + p.field + " → " + p.newTs.toISOString());
      } else {
        console.warn("  WARN: lead update for " + p.lead._id + " modified " + lr.modifiedCount);
      }
      // Notification mirror — raw collection.updateOne to bypass timestamps middleware.
      if (p.notifId) {
        var nr = await Notification.collection.updateOne(
          { _id: p.notifId },
          { $set: { createdAt: p.newTs, updatedAt: p.newTs } }
        );
        if (nr.modifiedCount === 1) {
          notifUpdates++;
          console.log("  Notification " + p.notifId + " createdAt → " + p.newTs.toISOString());
        } else if (nr.matchedCount === 0) {
          console.warn("  WARN: notification " + p.notifId + " not matched");
        } else {
          console.log("  Notification " + p.notifId + " — no-op (already at target)");
        }
      }
    }

    console.log("");
    console.log("=== SUMMARY ===");
    console.log("Leads updated:         " + leadUpdates);
    console.log("Notifications updated: " + notifUpdates);
    console.log("Skipped (no signal):   " + skipped.length);

    await mongoose.disconnect();
  } catch (e) {
    console.error("[fix-future-dated-deal-eoi-dates]", e && e.stack ? e.stack : e);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();
