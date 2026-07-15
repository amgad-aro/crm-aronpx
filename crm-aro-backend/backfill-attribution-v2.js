// Backfill v2 — per-ACTION attribution anchors.
//   Lead.eoiAgentId  = who MADE each EOI   (re-derived for ALL EOI leads; overwrites holder-stamped values)
//   Lead.dealAgentId = who CLOSED each deal (derived for ALL deals)
// Author resolution priority (owner's spec — history actor, else fallback):
//   1. history[] status_changed entry into EOI/DoneDeal — byUserId (new) or "…by <Name>" (name→slice-holder)
//   2. EOI: earliest non-removed assignments[] slice
//      DEAL: frozen commission closer (snapshot.salesAgent.userId) → current agentId
//            (the commission tier avoids baking a post-close-rotation holder over the closer)
// NOTE: Activity docs are deliberately NOT used as an author source. The [Commission]
// "auto-created on deal close" and [DoneDeal] "converted" activities carry the userId
// of whoever triggered the back-office action — frequently an ADMIN / sales_admin
// (e.g. Amgad, Marwa) doing commission bookkeeping — NOT the selling agent. Using
// them mis-derived the closer as the admin. (Confirmed in the first dry-run.)
// Split anchors set from lead.splitAgent2Id when present.
// Does NOT touch existing Commission recipients — instead flags deal-vs-commission
// mismatches (dealAgentId != commission.snapshot.salesAgent.userId) in a review list.
//
//   DRY RUN (default):  MONGODB_URI="..." node backfill-attribution-v2.js
//   APPLY:              MONGODB_URI="..." APPLY=1 node backfill-attribution-v2.js
// Read-only unless APPLY=1. Never prints the connection string.
const m = require("mongoose");
const URI = process.env.MONGODB_URI;
const APPLY = process.env.APPLY === "1";
if (!URI) { console.error("MONGODB_URI required"); process.exit(1); }

(async () => {
  await m.connect(URI, { dbName: "test" });
  const L = m.connection.db.collection("leads");
  const U = m.connection.db.collection("users");
  const A = m.connection.db.collection("activities");
  const C = m.connection.db.collection("commissions");

  // name → [userId] (lowercased) for history name-parse resolution
  const users = await U.find({}).project({ name:1 }).toArray();
  const byName = {}; const uName = {};
  users.forEach(u => { const k=String(u.name||"").trim().toLowerCase(); (byName[k]=byName[k]||[]).push(String(u._id)); uName[String(u._id)]=u.name; });
  const nm = id => id ? (uName[String(id)] || ("<"+String(id).slice(-6)+">")) : "(none)";

  function sliceIdSet(lead){
    const s=new Set();
    (lead.assignments||[]).forEach(a=>{ if(a&&a.agentId) s.add(String(a.agentId._id||a.agentId)); });
    (lead.previousAgentIds||[]).forEach(p=>s.add(String(p)));
    if(lead.agentId) s.add(String(lead.agentId._id||lead.agentId));
    return s;
  }
  function earliestActiveSlice(lead){
    const s=(lead.assignments||[]).filter(a=>a&&a.agentId&&!a.removedAt);
    if(!s.length) return null;
    s.sort((a,b)=>new Date(a.assignedAt||0)-new Date(b.assignedAt||0));
    const aid=s[0].agentId; return String(aid._id||aid);
  }
  // history author for a transition INTO `target` (e.g. "EOI" / "DoneDeal")
  function authorFromHistory(lead, target){
    const re = new RegExp("→\\s*"+target+"\\b");
    const hits = (lead.history||[]).filter(h=>h&&h.event==="status_changed"&&re.test(String(h.description||"")));
    if(!hits.length) return null;
    const h = hits[hits.length-1]; // latest transition into target
    if(h.byUserId) return { id:String(h.byUserId), src:"history:id" };
    const mch = String(h.description||"").match(/ by (.+)$/);
    if(mch){
      const cand = byName[mch[1].trim().toLowerCase()] || [];
      if(cand.length===1) return { id:cand[0], src:"history:name" };
      if(cand.length>1){ const slc=sliceIdSet(lead); const inSlice=cand.filter(id=>slc.has(id)); if(inSlice.length===1) return { id:inSlice[0], src:"history:name+slice" }; }
    }
    return null;
  }
  // ---------------- EOI ----------------
  const everEoi = { $or: [
    { eoiStatus:{$type:"string",$gt:""} }, { status:"EOI" }, { globalStatus:"eoi" },
    { eoiApproved:true }, { eoiDate:{$type:"string",$gt:""} }, { eoiImage:{$type:"string",$gt:""} },
    { eoiDocuments:{$exists:true,$not:{$size:0}} }
  ]};
  const eoiLeads = await L.find(everEoi).project({leadId:1,name:1,agentId:1,splitAgent2Id:1,eoiAgentId:1,eoiSplitAgent2Id:1,eoiStatus:1,status:1,assignments:1,previousAgentIds:1,history:1}).toArray();

  console.log("MODE:", APPLY?"APPLY (writing)":"DRY RUN (no writes)");
  console.log("\n===== EOI author backfill (re-derive ALL, overwrite holder-stamped) =====");
  console.log("EOI leads in scope:", eoiLeads.length);
  const eoiSrc={}; let eoiChanged=[], eoiUnresolved=0;
  for(const l of eoiLeads){
    let a = authorFromHistory(l,"EOI");
    let src = a?a.src:null, id = a?a.id:null;
    if(!id){ id = earliestActiveSlice(l); if(id) src="slice:earliest"; }
    if(!id){ eoiUnresolved++; continue; }
    eoiSrc[src]=(eoiSrc[src]||0)+1;
    const cur = l.eoiAgentId?String(l.eoiAgentId._id||l.eoiAgentId):null;
    if(cur!==String(id)) eoiChanged.push({leadId:l.leadId,name:l.name,from:cur,to:id,src});
    if(APPLY){ const set={ eoiAgentId:new m.Types.ObjectId(id) }; if(l.splitAgent2Id) set.eoiSplitAgent2Id=l.splitAgent2Id; await L.updateOne({_id:l._id},{$set:set}); }
  }
  console.log("Source breakdown:", JSON.stringify(eoiSrc), "| unresolved:", eoiUnresolved);
  console.log("Would CHANGE eoiAgentId on", eoiChanged.length, "leads"+(APPLY?" (applied)":"")+":");
  eoiChanged.forEach(x=>console.log("   #"+String(x.leadId).padStart(5,"0"),(x.name||"").slice(0,22).padEnd(22),"|", (x.from?nm(x.from):"(unset)"),"→",nm(x.to),"["+x.src+"]"));

  // ---------------- DEALS ----------------
  const anyDeal = { $or:[ {status:"DoneDeal"}, {globalStatus:"donedeal"}, {dealStatus:"Deal Cancelled"}, {status:"Deal Cancelled"} ] };
  const dealLeads = await L.find(anyDeal).project({leadId:1,name:1,agentId:1,splitAgent2Id:1,dealAgentId:1,status:1,dealStatus:1,saleType:1,dealType:1,assignments:1,previousAgentIds:1,history:1}).toArray();

  console.log("\n===== DEAL author backfill (derive ALL deals) =====");
  console.log("Deal leads in scope:", dealLeads.length);
  const dealSrc={}; let dealChanged=[]; const commReview=[];
  for(const l of dealLeads){
    // Frozen commission closer — the credited sales agent, source of truth we must
    // not contradict. Fetched up-front so it can serve BOTH as an author tier and
    // the mismatch cross-check.
    const cm = await C.findOne({ leadId:l._id }, { projection:{ "snapshot.salesAgent":1, partySide:1, status:1 } });
    const commAgent = (cm && cm.snapshot && cm.snapshot.salesAgent && cm.snapshot.salesAgent.userId) ? String(cm.snapshot.salesAgent.userId) : null;
    // Priority: history "→ DoneDeal" actor → frozen commission closer → current agentId.
    // The commission tier prevents baking a post-close-rotation holder (e.g. #01017,
    // where a cancelled deal kept rotating) over the agent who actually closed it.
    let a = authorFromHistory(l,"DoneDeal");
    let src=a?a.src:null, id=a?a.id:null;
    if(!id && commAgent){ id=commAgent; src="commission:closer"; }
    if(!id){ const cur=l.agentId?String(l.agentId._id||l.agentId):null; if(cur){ id=cur; src="current:agentId"; } }
    if(!id){ continue; }
    dealSrc[src]=(dealSrc[src]||0)+1;
    const curAnchor = l.dealAgentId?String(l.dealAgentId._id||l.dealAgentId):null;
    if(curAnchor!==String(id)) dealChanged.push({leadId:l.leadId,name:l.name,from:curAnchor,to:id,src});
    if(APPLY){ const set={ dealAgentId:new m.Types.ObjectId(id) }; if(l.splitAgent2Id) set.dealSplitAgent2Id=l.splitAgent2Id; await L.updateOne({_id:l._id},{$set:set}); }
    // Residual commission mismatch review (NEVER auto-changed). With the commission
    // tier above, this only fires when the author came from HISTORY yet still
    // disagrees with the commission — the genuinely worth-investigating case.
    if(commAgent && commAgent!==String(id)) commReview.push({leadId:l.leadId,name:l.name,derived:id,comm:commAgent,src,commStatus:cm.status});
  }
  console.log("Source breakdown:", JSON.stringify(dealSrc));
  console.log("Would SET/CHANGE dealAgentId on", dealChanged.length, "deals"+(APPLY?" (applied)":"")+":");
  dealChanged.forEach(x=>console.log("   #"+String(x.leadId).padStart(5,"0"),(x.name||"").slice(0,22).padEnd(22),"|",(x.from?nm(x.from):"(unset)"),"→",nm(x.to),"["+x.src+"]"));

  console.log("\n===== ⚠ COMMISSION vs derived-author MISMATCH (review only — NOT changed) =====");
  console.log("count:", commReview.length);
  commReview.forEach(x=>console.log("   #"+String(x.leadId).padStart(5,"0"),(x.name||"").slice(0,22).padEnd(22),"| commission credits:",nm(x.comm),"| derived closer:",nm(x.derived),"["+x.src+"]","| commStatus:",x.commStatus));

  console.log("\n" + (APPLY? "APPLIED." : "DRY RUN complete — re-run with APPLY=1 to write. (Commission recipients are NEVER auto-changed.)"));
  await m.disconnect();
})().catch(e=>{console.error("ERR",e&&e.message);process.exit(1);});
