// Backfill Lead.eoiAgentId / Lead.eoiSplitAgent2Id (EOI-author anchoring) for
// every lead that has ever been in the EOI flow. These fields drive the EOI
// page's cancelled-tab visibility (GET /api/eois): a cancelled EOI un-freezes
// the lead, which then keeps auto-rotating, so top-level agentId drifts off the
// agent who actually made the EOI. New EOIs capture the author at creation
// (server.js EOI transition + DR mirror); this script fills legacy rows.
//
// Author is taken from the EARLIEST non-removed assignments[] slice (the agent
// who held the lead when it first became an EOI). Fallbacks, in order:
//   1. earliest non-removed slice  (preferred)
//   2. earliest slice of any kind  (all slices removed)
//   3. top-level agentId           (no assignments[] at all)
//   4. unresolvable                (no agent anywhere) -> skipped, reported
// eoiSplitAgent2Id is set from the lead's current splitAgent2Id (no historical
// split record exists; null when absent).
//
//   DRY RUN (default):  MONGODB_URI="..." node backfill-eoi-agent.js
//   APPLY:              MONGODB_URI="..." APPLY=1 node backfill-eoi-agent.js
//
// Read-only unless APPLY=1. Never prints the connection string. Idempotent —
// only touches leads that do NOT already have eoiAgentId set, so re-running (or
// running after new EOIs self-capture) never clobbers a good anchor.
const mongoose = require("mongoose");
const URI = process.env.MONGODB_URI;
const APPLY = process.env.APPLY === "1";
if (!URI) { console.error("MONGODB_URI required"); process.exit(1); }

function earliestSlice(assignments, requireActive) {
  var slices = (assignments || []).filter(function(a) {
    if (!a || !a.agentId) return false;
    if (requireActive && a.removedAt) return false;
    return true;
  });
  if (!slices.length) return null;
  slices.sort(function(a, b) {
    var ta = a.assignedAt ? new Date(a.assignedAt).getTime() : Infinity;
    var tb = b.assignedAt ? new Date(b.assignedAt).getTime() : Infinity;
    return ta - tb;
  });
  var aid = slices[0].agentId;
  return (aid && aid._id) ? aid._id : aid;
}

(async () => {
  await mongoose.connect(URI, { dbName: "test" });
  const leads = mongoose.connection.db.collection("leads");

  // "ever had an EOI" — mirrors the endpoint's eoiScope + wasEOI artifacts.
  const everEoi = { $or: [
    { eoiStatus:    { $type: "string", $gt: "" } },
    { status:       "EOI" },
    { globalStatus: "eoi" },
    { eoiApproved:  true },
    { eoiDate:      { $type: "string", $gt: "" } },
    { eoiImage:     { $type: "string", $gt: "" } },
    { eoiDocuments: { $exists: true, $not: { $size: 0 } } }
  ]};
  const missingAnchor = { $or: [ { eoiAgentId: null }, { eoiAgentId: { $exists: false } } ] };
  const pred = { $and: [ everEoi, missingAnchor ] };

  const rows = await leads.find(pred)
    .project({ leadId:1, name:1, agentId:1, splitAgent2Id:1, eoiStatus:1, status:1, assignments:1 })
    .toArray();

  console.log("MODE:", APPLY ? "APPLY (writing)" : "DRY RUN (no writes)");
  console.log("Leads ever in EOI flow with no eoiAgentId yet:", rows.length, "\n");

  var stat = { active: 0, anySlice: 0, topAgent: 0, unresolved: 0, withSplit: 0 };
  var applied = 0;
  var samples = [];

  for (const r of rows) {
    var author = earliestSlice(r.assignments, true);
    var src = "active-slice";
    if (!author) { author = earliestSlice(r.assignments, false); src = "any-slice"; }
    if (!author) { author = (r.agentId && r.agentId._id) ? r.agentId._id : (r.agentId || null); src = "top-agentId"; }

    if (!author) {
      stat.unresolved++;
      if (samples.length < 40) samples.push("SKIP  #" + String(r.leadId||"?").padStart(5,"0") + " " + (r.name||"") + "  eoiStatus='" + (r.eoiStatus||"") + "'  -> NO AGENT anywhere");
      continue;
    }

    if (src === "active-slice") stat.active++;
    else if (src === "any-slice") stat.anySlice++;
    else stat.topAgent++;

    var split = r.splitAgent2Id || null;
    if (split) stat.withSplit++;

    if (samples.length < 40) {
      samples.push((APPLY ? "WRITE " : "PLAN  ") + "#" + String(r.leadId||"?").padStart(5,"0") + " " + (r.name||"") +
        "  eoiStatus='" + (r.eoiStatus||"") + "'  -> eoiAgentId=" + String(author) + " [" + src + "]" +
        (split ? "  eoiSplit2=" + String(split) : ""));
    }

    if (APPLY) {
      var set = { eoiAgentId: author };
      if (split) set.eoiSplitAgent2Id = split;
      await leads.updateOne({ _id: r._id }, { $set: set });
      applied++;
    }
  }

  console.log("Sample (first " + Math.min(samples.length, 40) + "):");
  samples.forEach(function(s){ console.log("  " + s); });

  console.log("\n--- Resolution breakdown ---");
  console.log("  earliest non-removed slice :", stat.active);
  console.log("  earliest any slice (fallbk):", stat.anySlice);
  console.log("  top-level agentId (fallbk) :", stat.topAgent);
  console.log("  UNRESOLVED (no agent)      :", stat.unresolved);
  console.log("  of resolved, also set split:", stat.withSplit);

  var resolvable = rows.length - stat.unresolved;
  console.log("\n" + (APPLY
    ? ("Applied: " + applied + "  (unresolved skipped: " + stat.unresolved + ")")
    : ("Would apply: " + resolvable + ", skip: " + stat.unresolved + "  (re-run with APPLY=1 to write)")));

  await mongoose.disconnect();
})().catch(async (e) => { console.error("ERR:", e && e.message); try { await mongoose.disconnect(); } catch(_){} process.exit(1); });
