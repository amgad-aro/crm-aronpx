// ============================================================================
// Campaign/Project/UnitType field-semantics migration (v1 -> v2).
//
//   DRY-RUN (default): node migrate-fields-v2.js          (READ-ONLY, no writes)
//   APPLY:             node migrate-fields-v2.js --apply
//   ROLLBACK:          node migrate-fields-v2.js --rollback
//
// Per v1 lead (fieldsV2 !== true):
//   project  <- development (variant-merged + approved alias fold from campaign,
//               or the existing project value when it is already a development)
//   unitType <- canonical unit type from the old project (+ S-Villa -> Standalone,
//               استثمار_وتأجير -> Commercial, unit-in-campaign captured)
//   campaign <- ""   (raw {campaign,project} saved to _fieldsBackup for rollback)
//   fieldsV2 <- true
//   projectWeight is NEVER touched -> commission money is preserved exactly.
// Idempotent: leads already fieldsV2:true are skipped.
// ============================================================================
var mongoose = require("mongoose");
var URI = process.env.MONGODB_URI;
if (!URI) { console.error("no MONGODB_URI"); process.exit(1); }
var APPLY = process.argv.indexOf("--apply") >= 0;
var ROLLBACK = process.argv.indexOf("--rollback") >= 0;

// ---------- unit classifier (substring) — project-side ----------
var UNIT_KEYWORDS = [
  ["chalet","Chalet"],["شاليه","Chalet"],["twin","Twinhouse"],["توين","Twinhouse"],
  ["town","Townhouse"],["تاون","Townhouse"],["duplex","Duplex"],["دوبلكس","Duplex"],["دوبلي","Duplex"],
  ["villa","Standalone"],["standalone","Standalone"],["فيلا","Standalone"],["فيلة","Standalone"],
  ["apart","Apartment"],["شقة","Apartment"],["شقه","Apartment"],["studio","Apartment"],["استوديو","Apartment"],
  ["penthouse","Apartment"],["بنتهاوس","Apartment"],
  ["استثمار","Commercial"],["تأجير","Commercial"],["تجاري","Commercial"],["تجارية","Commercial"],
  ["commercial","Commercial"],["showroom","Commercial"],["retail","Commercial"],["محل","Commercial"],
  ["اداري","Admin"],["إداري","Admin"],["اداريه","Admin"],["إدارية","Admin"],["admin","Admin"],["office","Admin"],
  ["عياد","Clinic"],["طبي","Clinic"],["clinic","Clinic"],
  ["غرف","Apartment"],["غرفة","Apartment"],["غرفتين","Apartment"]
];
function classifyUnit(raw){ var s=String(raw||"").toLowerCase().replace(/_/g," ").trim(); if(!s)return null; for(var i=0;i<UNIT_KEYWORDS.length;i++){ if(s.indexOf(UNIT_KEYWORDS[i][0])>=0) return UNIT_KEYWORDS[i][1]; } return null; }
// S-Villa product family -> Standalone (decision 1).
function isSvilla(raw){ var s=String(raw||"").toLowerCase().replace(/copy \d+ of /,"").replace(/^new /,"").trim(); return /^sv(i+l+l*a|ila)$/.test(s) || s==="sv" || s==="sv sa"; }

// ---------- development normalize + alias fold — campaign-side ----------
var EXACT_UNIT = { "chalet":"Chalet","villa":"Standalone","standalone":"Standalone","twin house":"Twinhouse","twinhouse":"Twinhouse","town house":"Townhouse","townhouse":"Townhouse","duplex":"Duplex","apartment":"Apartment","apt":"Apartment","studio":"Apartment","penthouse":"Apartment","admin":"Admin","clinic":"Clinic","commercial":"Commercial","showroom":"Commercial","شقة":"Apartment","شقه":"Apartment","فيلا":"Standalone","شاليه":"Chalet","دوبلكس":"Duplex","وحدة تجارية":"Commercial","وحده تجاريه":"Commercial","وحدة إدارية":"Admin","وحده اداريه":"Admin","عيادة طبية":"Clinic" };
function exactUnit(raw){ var s=String(raw||"").toLowerCase().replace(/_/g," ").replace(/\s+/g," ").trim(); return EXACT_UNIT[s]||null; }
function normDev(raw){ var s=String(raw==null?"":raw).trim().replace(/\s+/g," "); if(!s)return ""; var p; do{p=s;s=s.replace(/\s*[-–]\s*copy$/i,"").replace(/\s*\(copy\)$/i,"").replace(/\s+copy$/i,"").replace(/\s+\d+$/,"").replace(/\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i,"").trim();}while(s!==p&&s.length>0); return s||String(raw).trim(); }
var DEV_ALIAS = { "cali":"Cali Coast","cali coast":"Cali Coast","naia":"Naia Sahel","naia sahel":"Naia Sahel","naiaa":"Naia Sahel","sherton":"Sheraton Commercial","sheraton commercial":"Sheraton Commercial","sheraton commercial gded":"Sheraton Commercial","isola sheraton":"Isola Sheraton","isol sheraton":"Isola Sheraton","isola sheraton commercial":"Isola Sheraton" };
var JUNK_CAMP = { "call":1,"sahel":1,"baha":1,"other":1,"lead":1,"rtm":1,"rtm tgmo3":1,"":1 };
function canonDev(raw){ var s=String(raw||"").trim(); if(!s)return{dev:"",flag:"empty"}; var lc=s.toLowerCase(); if(JUNK_CAMP[lc])return{dev:"",flag:"junk"}; if(exactUnit(s))return{dev:"",flag:"unit-in-campaign"}; var base=normDev(s),key=base.toLowerCase(); if(DEV_ALIAS[key])return{dev:DEV_ALIAS[key],flag:"alias"}; return{dev:base,flag:"ok"}; }
// Junk project values (decision 2) -> blank unit, project from campaign if any.
var JUNK_PROJECT = { "mnhd gads":1,"mnhd":1,"call":1,"stoda":1,"dayz":1,"morining":1,"glen":1,"vers":1,"ground":1,"مسجل كذا حاجه":1,"zat":1 };

// Canonicalize any development name: apply the alias fold, then snap to the
// most-common casing seen across the data (devSet, built by frequency), so
// case/spelling variants (sarai/Sarai, Sodic east/Sodic East) collapse to one.
function canonDevFinal(name, devSet){
  var base=normDev(name); if(!base) return "";
  var key=base.toLowerCase();
  if (DEV_ALIAS[key]) { base=DEV_ALIAS[key]; key=base.toLowerCase(); }
  return (devSet && devSet[key]) ? devSet[key] : base;
}

function planLead(l, devSet){
  var C=String(l.campaign||"").trim(), P=String(l.project||"").trim();
  var d=canonDev(C);
  var hasDev=(d.flag==="ok"||d.flag==="alias");
  var unit = isSvilla(P) ? "Standalone" : classifyUnit(P);
  var isJunkP = JUNK_PROJECT[P.toLowerCase()]===1;
  var newProject, newUnit, rule;
  if (hasDev) {
    newProject=d.dev;
    if (unit){ newUnit=unit; rule=(d.flag==="alias"?"clean+alias":"clean"); }
    else if (isJunkP){ newUnit=""; rule="camp-dev+junk-proj"; }
    else if (P!==""){ newUnit=""; rule="conflict(camp-dev,proj-dev)"; }
    else { newUnit=""; rule="camp-dev,proj-empty"; }
  } else {
    var campUnit = (d.flag==="unit-in-campaign") ? exactUnit(C) : null;
    if (unit){ newProject=""; newUnit=unit; rule="unitOnly"; }
    else if (campUnit){ newProject=""; newUnit=campUnit; rule="unit-from-campaign"; }
    else if (isJunkP){ newProject=""; newUnit=""; rule="junk-blanked"; }
    else if (P!==""){ newProject=P; newUnit=""; rule="keepProjAsDev"; }
    else { newProject=""; newUnit=""; rule="nothing"; }
  }
  // Snap every non-empty development to its canonical casing (one dev = one row).
  if (newProject) newProject = canonDevFinal(newProject, devSet);
  return { C:C, P:P, newProject:newProject, newUnit:newUnit, rule:rule };
}

function pad(s,n){ s=String(s); return s.length>=n?s:s+Array(n-s.length+1).join(" "); }

(async function () {
  await mongoose.connect(URI, { dbName:"test" });
  var Lead = mongoose.model("Lead", new mongoose.Schema({}, { strict:false, collection:"leads" }));
  var stamp = new Date().toISOString();

  if (ROLLBACK) {
    var toRestore = await Lead.find({ "_fieldsBackup.at": { $exists:true } }).select("_fieldsBackup").lean();
    console.log("ROLLBACK — leads with backup:", toRestore.length, APPLY?"(will NOT run with --apply; use --rollback alone)":"");
    if (process.argv.indexOf("--rollback") >= 0 && process.argv.indexOf("--confirm") >= 0) {
      var rops = toRestore.map(function(l){ return { updateOne:{ filter:{_id:l._id}, update:{ $set:{ campaign:(l._fieldsBackup.campaign||""), project:(l._fieldsBackup.project||""), unitType:"", fieldsV2:false }, $unset:{ _fieldsBackup:"" } } } }; });
      for (var ri=0; ri<rops.length; ri+=500){ await Lead.bulkWrite(rops.slice(ri,ri+500)); }
      console.log("Rolled back", rops.length, "leads.");
    } else {
      console.log("(dry rollback — re-run with `--rollback --confirm` to actually restore)");
    }
    await mongoose.disconnect(); return;
  }

  var leads = await Lead.find({ archived:{ $ne:true } }).select("campaign project unitType projectWeight fieldsV2").lean();
  var v1 = leads.filter(function(l){ return l.fieldsV2 !== true; });
  console.log("=== MIGRATION " + (APPLY?"APPLY":"DRY-RUN (READ-ONLY)") + " — non-archived:", leads.length, "| v1 to migrate:", v1.length, "| already v2:", (leads.length-v1.length), "===\n");

  // Pass 1 — canonical development casing by frequency. A dev's casing is decided
  // by whichever spelling carries the most leads (campaign devs weighted first,
  // then dev-like project values), so variants snap to one canonical row.
  var devFreq={};
  var bump=function(dev){ if(!dev) return; var k=dev.toLowerCase(); devFreq[k]=devFreq[k]||{}; devFreq[k][dev]=(devFreq[k][dev]||0)+1; };
  v1.forEach(function(l){ var d=canonDev(String(l.campaign||"").trim()); if(d.dev&&(d.flag==="ok"||d.flag==="alias")) bump(d.dev); });
  var devSet={};
  Object.keys(devFreq).forEach(function(k){ var best="",bn=-1; Object.keys(devFreq[k]).forEach(function(c){ if(devFreq[k][c]>bn){bn=devFreq[k][c];best=c;} }); devSet[k]=best; });

  var ruleCount={}, devDist={}, unitDist={}, nProj=0, nUnit=0, nCampCleared=0;
  var samples=[], sampleByRule={}, ops=[];
  v1.forEach(function(l){
    var pl=planLead(l, devSet);
    ruleCount[pl.rule]=(ruleCount[pl.rule]||0)+1;
    if (pl.newProject){ nProj++; devDist[pl.newProject]=(devDist[pl.newProject]||0)+1; }
    if (pl.newUnit){ nUnit++; unitDist[pl.newUnit]=(unitDist[pl.newUnit]||0)+1; }
    if (String(l.campaign||"").trim()!=="") nCampCleared++;
    ops.push({ updateOne:{ filter:{_id:l._id}, update:{ $set:{ project:pl.newProject, unitType:pl.newUnit, campaign:"", fieldsV2:true, _fieldsBackup:{ campaign:pl.C, project:pl.P, at:stamp } } } } });
    sampleByRule[pl.rule]=(sampleByRule[pl.rule]||0)+1;
    if (sampleByRule[pl.rule]<=2) samples.push({l:l, pl:pl});
  });
  samples.sort(function(a,b){ return a.pl.rule<b.pl.rule?-1:1; });

  console.log("--- WRITE COUNTS PER RULE ---");
  Object.keys(ruleCount).sort(function(a,b){return ruleCount[b]-ruleCount[a];}).forEach(function(r){ console.log("  " + pad(r,26) + ruleCount[r]); });
  console.log("\n--- FIELD-LEVEL ---");
  console.log("  leads getting a project (development):", nProj);
  console.log("  leads getting a unitType:", nUnit);
  console.log("  campaign values cleared (backed up):", nCampCleared);
  console.log("  _fieldsBackup written:", ops.length);

  console.log("\n--- PROJECT (development) DISTRIBUTION post-migration (top 15) ---");
  Object.keys(devDist).sort(function(a,b){return devDist[b]-devDist[a];}).slice(0,15).forEach(function(d){ console.log("  " + pad(devDist[d],6) + d); });
  console.log("\n--- UNIT TYPE DISTRIBUTION post-migration ---");
  Object.keys(unitDist).sort(function(a,b){return unitDist[b]-unitDist[a];}).forEach(function(u){ console.log("  " + pad(unitDist[u],6) + u); });

  // Money-path lead(s): any lead with a non-default projectWeight — confirm weight untouched.
  var weighted = v1.filter(function(l){ return typeof l.projectWeight==="number" && l.projectWeight!==1; });
  console.log("\n--- MONEY PATH: leads with non-default projectWeight:", weighted.length, "(projectWeight is NOT modified) ---");
  weighted.forEach(function(l){ var pl=planLead(l); console.log("  weight="+l.projectWeight+"  campaign="+JSON.stringify(pl.C)+" project="+JSON.stringify(pl.P)+"  ->  project="+JSON.stringify(pl.newProject)+" unitType="+JSON.stringify(pl.newUnit)+"  (projectWeight stays "+l.projectWeight+")"); });

  console.log("\n--- SAMPLE before -> after ---");
  samples.forEach(function(s){ console.log("  ["+pad(s.pl.rule,24)+"] campaign="+pad(JSON.stringify(s.pl.C),20)+" project="+pad(JSON.stringify(s.pl.P),22)+"  =>  campaign=\"\"  project="+pad(JSON.stringify(s.pl.newProject),20)+" unitType="+JSON.stringify(s.pl.newUnit)); });

  if (APPLY) {
    console.log("\n>>> APPLYING " + ops.length + " updates...");
    var done=0; for (var i=0;i<ops.length;i+=500){ var r=await Lead.bulkWrite(ops.slice(i,i+500)); done+=(r.modifiedCount||0); }
    console.log(">>> DONE. modified:", done);
  } else {
    console.log("\n(DRY-RUN complete — READ-ONLY, no writes. Re-run with --apply to write.)");
  }
  await mongoose.disconnect();
})().catch(function(e){ console.error("ERR:", e && e.message); process.exit(1); });
