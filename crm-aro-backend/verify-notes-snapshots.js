/** READ-ONLY e2e sanity for the eoiNotes/dealNotes snapshot fix. No writes. */
const mongoose = require("mongoose");
function norm(s){ return String(s == null ? "" : s).trim(); }
function idOf(a){ return a && a._id ? String(a._id) : String(a || ""); }

// Mirror of server.js snapshotAuthorNotes (the exact capture logic).
function snapshotAuthorNotes(submittedNotes, leadDoc, authorId){
  var s = (submittedNotes != null) ? String(submittedNotes).trim() : "";
  if (s) return s;
  var aid = authorId ? idOf(authorId) : "";
  if (!aid || !leadDoc || !Array.isArray(leadDoc.assignments)) return "";
  var slice = leadDoc.assignments.find(function(a){
    if (!a || a.removedAt) return false;
    var sid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
    return String(sid || "") === aid;
  });
  if (!slice) return "";
  return norm(slice.notes) || norm(slice.lastFeedback);
}

var pass = true;
function check(label, cond){ console.log((cond?"  ✅ ":"  ❌ ")+label); if(!cond) pass=false; }

// ---------- Part 1: logic simulation (fresh creates) ----------
console.log("=== Part 1 — capture logic (fresh EOI/Deal create with notes) ===");
var HUSS = { _id:"huss" }, NAGY = { _id:"nagy" };
var leadForNagyEoi = { assignments:[
  { agentId:HUSS._id, removedAt:new Date(), notes:"رفعت علي ناجي — handoff", lastFeedback:"handoff" }, // removed prior agent
  { agentId:NAGY._id, removedAt:null, notes:"", lastFeedback:"" }                                       // author, no text yet
], notes:"رفعت علي ناجي — handoff (shared top-level, Hussien's)" };

// (a) author submits notes in the create action → snapshot = their words
check("EOI create: submitted note wins → author's words",
  snapshotAuthorNotes("Nagy's EOI note", leadForNagyEoi, NAGY._id) === "Nagy's EOI note");
// (b) no submitted note, author slice empty → snapshot "" (card shows —), NOT the shared top-level
check("EOI create: no author text → '' (never the shared top-level leak)",
  snapshotAuthorNotes(null, leadForNagyEoi, NAGY._id) === "");
// (c) author has slice text, no submitted → snapshot = their slice text
var leadWithAuthorSlice = { assignments:[{ agentId:NAGY._id, removedAt:null, notes:"my slice note" }], notes:"someone else's top-level" };
check("Deal create: author slice text used, not top-level",
  snapshotAuthorNotes(null, leadWithAuthorSlice, NAGY._id) === "my slice note");
// (d) a prior (removed) agent is NEVER used as the author's slice
check("removed prior agent's slice never sourced",
  snapshotAuthorNotes(null, leadForNagyEoi, NAGY._id) !== "رفعت علي ناجي — handoff");

(async function(){
  var uri = process.env.MONGODB_URI;
  if (!uri) { console.log("\n(skipping prod verify — no MONGODB_URI)"); console.log(pass?"\n🎉 LOGIC CHECKS PASSED":"\n🚨 FAILED"); process.exit(pass?0:1); }
  await mongoose.connect(uri);
  var Lead = mongoose.connection.collection("leads");
  console.log("\n=== Part 2 — prod state after backfill (read-only), DB:", mongoose.connection.name, "===");

  var wasEOI = { $or:[ {eoiDate:{$type:"string",$gt:""}},{eoiApproved:true},{eoiImage:{$type:"string",$gt:""}},{eoiDocuments:{$exists:true,$not:{$size:0}}} ]};
  var eoiScope = { $and:[ {archived:{$ne:true}}, { $or:[ {eoiStatus:{$type:"string",$gt:""}},{status:"EOI"},{$and:[{status:"Deal Cancelled"},wasEOI]} ]}]};
  var dealScope = { $and:[ {archived:{$ne:true}}, { $or:[ {status:"DoneDeal"},{globalStatus:"donedeal"},{dealStatus:"Deal Cancelled"} ]}]};

  async function verify(kind, scope, authorField, snapField){
    var rows = await Lead.find(scope, { projection:{ _id:1, notes:1, assignments:1, [authorField]:1, [snapField]:1 } }).toArray();
    var foreignShown = 0, matchesAuthor = 0, emptyShown = 0;
    for (const l of rows){
      var shown = norm(l[snapField]);                       // what the card now displays
      var author = snapshotAuthorNotes(null, l, l[authorField]);
      if (!shown) { emptyShown++; continue; }
      if (author && shown === author) matchesAuthor++;
      else foreignShown++;                                  // snapshot text that isn't the author's → BAD
    }
    console.log("  ["+kind+"] scanned:", rows.length, "| shows author text:", matchesAuthor, "| shows — :", emptyShown, "| shows FOREIGN:", foreignShown);
    check(kind+": ZERO cards display a non-author note", foreignShown === 0);
  }
  try {
    await verify("EOIs",  eoiScope,  "eoiAgentId",  "eoiNotes");
    await verify("Deals", dealScope, "dealAgentId", "dealNotes");
  } finally { await mongoose.disconnect(); }
  console.log("\n"+(pass ? "🎉 ALL SANITY CHECKS PASSED" : "🚨 SOME CHECKS FAILED"));
  process.exit(pass?0:1);
})();
