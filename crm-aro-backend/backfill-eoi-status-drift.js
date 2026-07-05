// Backfill — normalize EOI eoiStatus to match the eoiApproved flag.
// DRY_RUN by default; pass --apply to write. Idempotent.
//
// Fixes the "Alaa Youssef" drift: an ACTIVE EOI whose eoiStatus string
// disagrees with its eoiApproved boolean (the row badge reads eoiApproved,
// so the two can visibly conflict). Canonical rule:
//
//   eoiStatus := eoiApproved ? "Approved" : "Pending"
//
// SCOPE (deliberately narrow — only touches live EOIs, never cancelled/deals):
//   - not archived
//   - not a converted deal (status!="DoneDeal", globalStatus!="donedeal")
//   - not cancelled (eoiStatus not in EOI/Deal Cancelled, status!="Deal Cancelled")
//   - is an active EOI: status==="EOI" OR eoiStatus in {"Pending","Approved"}
// Only rows where eoiStatus already differs from the canonical value are written.
// eoiApproved (the badge's source of truth) is treated as authoritative and is
// NOT modified — this only realigns the eoiStatus string to it.
//
// USAGE — from crm-aro-backend/:
//   railway run node backfill-eoi-status-drift.js            # DRY_RUN (no writes)
//   railway run node backfill-eoi-status-drift.js --apply    # write
"use strict";
var mongoose = require("mongoose");
var MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required"); process.exit(1); }
var APPLY = process.argv.indexOf("--apply") !== -1;

var LeadSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Lead = mongoose.model("Lead", LeadSchema);

function isConvertedDeal(l){ return !!(l.status==="DoneDeal" || l.globalStatus==="donedeal"); }
function isCancelled(l){ return l.eoiStatus==="EOI Cancelled" || l.eoiStatus==="Deal Cancelled" || l.status==="Deal Cancelled"; }
function isActiveEoi(l){
  if (l.archived || isConvertedDeal(l) || isCancelled(l)) return false;
  return l.status==="EOI" || l.eoiStatus==="Pending" || l.eoiStatus==="Approved";
}
function lid(l){ return (l.leadId!=null? String(l.leadId).padStart(5,"0") : String(l._id).slice(-6)); }

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. Mode: " + (APPLY ? "APPLY (writing eoiStatus)" : "DRY_RUN (no writes)") + "\n");

  var all = await Lead.find({}).lean();
  var targets = all.filter(isActiveEoi).map(function(l){
    var canon = l.eoiApproved ? "Approved" : "Pending";
    return { l: l, from: l.eoiStatus, to: canon };
  }).filter(function(x){ return x.from !== x.to; });

  if (!targets.length) { console.log("Nothing to normalize — all active EOIs already aligned."); await mongoose.disconnect(); return; }

  console.log(targets.length + " row(s) to normalize:");
  targets.forEach(function(x){
    console.log("  #"+lid(x.l), "| "+(x.l.name||"(no name)"), "| eoiApproved="+!!x.l.eoiApproved, "| eoiStatus "+JSON.stringify(x.from)+" -> "+JSON.stringify(x.to));
  });

  if (!APPLY) { console.log("\nDRY_RUN — no writes. Re-run with --apply to write."); await mongoose.disconnect(); return; }

  var n = 0;
  for (var i=0;i<targets.length;i++){
    await Lead.updateOne({ _id: targets[i].l._id }, { $set: { eoiStatus: targets[i].to } });
    n++;
  }
  console.log("\nAPPLIED — updated eoiStatus on " + n + " row(s).");
  await mongoose.disconnect();
}
main().catch(function(e){ console.error(e); process.exit(1); });
