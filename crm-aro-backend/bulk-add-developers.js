// Bulk-add Developer docs from a cleaned name list (one-shot, idempotent).
//
// Adds the 506 developers below (1 intra-input collision -> 505 distinct) to the
// `developers` collection. Mirrors
// seed-developers.js: self-contained (own dotenv + mongoose), strict:false model,
// normalizedName = lowercase + strip every non-alphanumeric codepoint
// (Unicode-aware), upsert-by-normalizedName so re-running is a no-op.
//
// IDEMPOTENT on two axes:
//  - Against the DB: any name whose normalizedName already exists (e.g. the
//    seeded "El Masria Group" / "MNHD") is detected and skipped.
//  - Within the input: distinct spellings that collapse to the SAME normalizedName
//    (e.g. "Al Marassem" / "Almarassem" -> "almarassem") are reported as
//    collisions; only the FIRST spelling is added. Nothing collapses silently.
//
// USAGE — run MANUALLY from crm-aro-backend/ (or the Railway service shell).
//
//   Collision/count preview only, NO database connection (safe anywhere):
//     ANALYZE=1 node bulk-add-developers.js
//
//   DRY-RUN against the DB (no writes — lists WOULD-add vs already-exists):
//     DRY_RUN=1 node bulk-add-developers.js
//
//   Apply (creates the missing developers):
//     node bulk-add-developers.js
//
//   Override the connection explicitly if needed:
//     MONGODB_URI="mongodb+srv://..." node bulk-add-developers.js
"use strict";
try { require("dotenv").config(); } catch(_) {}
try { require("dns").setServers(["8.8.8.8", "1.1.1.1"]); } catch(_) {}

var mongoose = require("mongoose");

// MUST stay identical to normalizeDeveloperName() in server.js.
function normalizeDeveloperName(s){ return String(s||"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ""); }

// Final cleaned list provided by the user. (Note: "One\\One" stores a literal
// backslash so the display name is exactly "One\One".)
var NAMES = [
  "33 Development","A Capital","AAyan Dev","ADC","ADVA","AG","Agec","AIG Misr","Ajad","Ajna",
  "Akadia","Akam","Akam Alrajhi","Al Ahly Sabbour","Al Bostani","Al Dawlia","Al Fath","Al Hayah","Al Jazi","Al Karam",
  "Al Marassem","Al Oroba","Al Qamzi","Al Raabat","Al Remas","Al Riyadh Misr","Al Waheed","Alamakan","Alasima","Albrouj Misr (ABM)",
  "Alchemy","ALJAR (Valore)","Almousa","Almarassem","Amazon","Amer","AMG","Amorada","AMA","AMD",
  "Anchor","AOG","Aqar Misr","Arab","Arabco","Arabco Commercial","Arabia","ARAQ","Archplan","Areej",
  "Areva","Arkan Palm","ARCO","Aroma","Arqa","Artal","Ashrafia","Aspect","Aswaq","Atric",
  "Avalon","AVA Mina","AV","Axis West","Azha (Separate)","Azizi (UAE)","Aziz Properties","AZZAR","Badr Eldin","Baron",
  "Barwa","Beta Green","Better Home","B-Gate","Bin Salem","Binaa","Binghatti","BNG","Brixton","Brouq",
  "Bulidex","Business Bay","C Dev","Cairo Heights","Capital","Capital Edge","Capital Hills","Capital Link","Captain","Carizma",
  "Castello","Catalyst","Center Point","Centrada","Century","CGP","City Edge","Cleopatra","CLD","Code",
  "Concrete","Constructa","Contact","Convoy","Coral Hills","Cornado","Cornerstone","Cred","Damac","Dana",
  "Dar Alalmia","Dar Alarkan","Dar El Maghraby","Darak Group","Darna","Dahab","Delta","DiG","Direction White","DMP",
  "Doja","Dolman","Dominar","Dorra","Dream Hills","Dream Town","Dubai","Eagle Group","Ebdaa","Ebny Dev",
  "Eden","Edge","Edge Stone","Efid","Egy Holding","Egyptian","Egygap","Eg Tower","El Amar Group","El Basiony",
  "El Garbry","El Haram","El Khalifa","El Manara","El Mansour","El Masria Group","El Massar","El Morshdy","El Nahal","El Riad Masr",
  "ELEZZ Group","Elgendy","Elite","Elite Dev","Elite Home","Elite House","Elm","Emaar","Emaar Alex","Emarcom",
  "Emperor","Empire Estate","Emtlak","Enmaa","Enwan","Enza","ERG","Euphoria","Everst","Everst View",
  "First Group","Flow","Founders","FSG","FUD","G Dev","Gates","GDG","Gedico","Genoa",
  "Geometric","Golden Pillars","Golden Point","Golden Town","Golden View","Golf City","Gosour","Grit","Grova","GUD",
  "GUP","GV","Haiba","Hamat","Harva","Hassan Allam","HDP","HDP New Capital","HGD","Home Group",
  "Home Town","Horizon","Horizona","House Building","HPD","Hub","HUD","Hyde Park","I Capital","I Home",
  "Ibn Sina","Ibtkar","Icon","IGI","Il Cazar","Illume Societies","IMARAE","INMA","Inertia","Infinity",
  "Innovia","Inter Build","Iunu","Iwan","JD","Jadeer","Jdar","Jiwa","JUST","Kandeel",
  "Karnak","Kastoria","Katameya Gardens","Kayan","Khaled Sabry","Kleek","Kultura","Kunouz","KUD","La Hacienda",
  "La Mirada","La Verde","La Vista","LakeView","Larz","Lasirena","Lazura","Leader","LEGACY","Life Louvers",
  "Line","Living Yard","LMD","LUD","Lunar","M Squared","MA","Mabany Edris","Madaar","Madean",
  "MAG","Magna","Main Mark","Mainland","Majid Al Futtaim","MAK","Make Place","Malaz","Malvern","Manaj",
  "Maqam Misr","Mardev","Margins","Marakez","Marota","Marquee","Marsa Bagoush","Marsillia","Masr El Gadida","Mass",
  "Master Group","Matter Makers","Maven","Maxim","Mazaya","Meamar Makkah","Melee","Memar Alashraf","Menaa Development","Menassat",
  "Mercon","MG","Midicon","Milestone","Mint","Miqaat","Mirage","Misr Italia","MNHD","Mobco",
  "Modad","Modon","Modon UAE","Monte Dev","Monterra","Montreal","More","Mountain View","MRS","Murtaqa",
  "My Home","Naia","Najma","Nakhel","Namaa Al Khaleeg","Nations Of Sky","Nawassy","NCB","New Dream","New Event",
  "New Generation","New Plan","Next Deal","Next Home","NJD","Noble","Nouvaz Stanza","Novara","NTG","One\\One",
  "Ontario","Ora","Orascom (Gouna)","Orascom (Makadi)","Orascom (West)","Orbis","Orbit","OMG","OUD","Owagik",
  "Palm Hills","Palmera","Paragon","People & Places","Pillarz-Tiffany","Plaza Gardens","PLDG","PRE","Prime","Prime Home",
  "Project Gate","PTC","Pyramids","Pyramids Wales","Q Development","Qatari Diar","Qawafil","Qontrac","Qurtuba","Radix",
  "Ramatan","Rayan","Rayat","Rayhana","Rayz","RE","RFCO","Red In","Red Sea","Redcon",
  "REEDY GROUP","Reflect","Regency","Rejan","Rejan Commercial","Rekaz","Remal","Reportage","Retal","Retan",
  "RG","RGD","Rich Point","RIO","Ritzy","Rivan","RMD","ROI","Roaya Group","Rock Elbatal",
  "Rock Elbatal 2","Roq","Roses","Royal","Roya","RSD","RTM","RNA","RUD","Sakan",
  "SAG","Samana","Samco","Sawary","Scope","SD","SDR","SED","SAM","Sense",
  "Sephora","SERAC","Seif Dev","SIAC","Sign","Sia","SIVA","Sky AD","Sky Innovo","Skyway",
  "Sckylers","Sobha Realty","SODIC","Sol","Solimar","Solvia","Somabay","Sorouh","SPD","Spectra",
  "Squares","Starlight","Stau","Stella","STM","SUD","Sumou","Symphony","SV","Taj Dev",
  "Taj Misr","Tabark","Tameer","Tameer West","Tamyoz","Tatweer","TBK","TED","TG","Tharaa",
  "The ARK","The Eye","The Fort","The Gate","The Groove","The MarQ","Times","TLD","TMG","Torec",
  "Town Writers","Townway","Travco","UC","UDG","UE","Upscale","Upwyde","Urban Edge","Urbnalanes",
  "URD","V-Development","VACAY","VAI","Valero","Value","Vie Communities","Villar","Vivinda","Vortex",
  "Vow","Voya","Wadi Digla","Wajha","WaterWay","Wealth","Wealth Holding","Wealth New","West Way","White Eagle",
  "Winvistor","Wise","Wujha","W'S","X Estate","Xland Dev","Yasser Abdalla","Zada","Zaeem","Zaghloul",
  "Zaya","Zayedar","Zayed Greens","Zayton","Zee Properties","Zodiac"
];

// Pre-scan the input: dedupe by normalizedName (keep the FIRST spelling) and
// collect intra-input collisions + invalid (no-key) entries.
function scanInput(){
  var firstByKey = {}, order = [], collisions = [], invalid = [];
  NAMES.forEach(function(raw){
    var name = String(raw||"").trim();
    var key = normalizeDeveloperName(name);
    if (!key) { invalid.push(name); return; }
    if (firstByKey[key] == null) { firstByKey[key] = name; order.push(key); }
    else { collisions.push({ key:key, kept:firstByKey[key], dropped:name }); }
  });
  return { firstByKey:firstByKey, order:order, collisions:collisions, invalid:invalid };
}

function printScan(scan){
  console.log("Input names:                  " + NAMES.length);
  console.log("Distinct normalizedName keys: " + scan.order.length);
  if (scan.invalid.length) console.log("Invalid (no letters/digits):  " + scan.invalid.length + "  -> " + scan.invalid.map(function(x){return '"'+x+'"';}).join(", "));
  if (scan.collisions.length) {
    console.log("\n! " + scan.collisions.length + " intra-input collision(s) — same normalizedName; only the FIRST spelling is kept:");
    scan.collisions.forEach(function(c){ console.log('   "' + c.dropped + '"  collapses into kept  "' + c.kept + '"   [' + c.key + ']'); });
  } else {
    console.log("No intra-input normalizedName collisions.");
  }
}

// ANALYZE mode — print the scan and exit. No DB connection, no creds needed.
if (process.env.ANALYZE === "1") { printScan(scanInput()); process.exit(0); }

var MONGODB_URI = process.env.MONGODB_URI;
var DRY_RUN = process.env.DRY_RUN === "1";
if (!MONGODB_URI) { console.error("ERROR: MONGODB_URI required (set it in .env or inline)"); process.exit(1); }

// Minimal strict:false model — pluralizes "Developer" -> "developers", the SAME
// collection the app uses; timestamps:true so create() stamps createdAt/updatedAt.
var DeveloperSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
var Developer = mongoose.model("Developer", DeveloperSchema);

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected. DRY_RUN=" + (DRY_RUN ? "yes" : "no") + "\n");

  var scan = scanInput();
  printScan(scan);
  console.log("");

  // Existing normalizedName set (so re-runs + the seeded El Masria Group / MNHD
  // are detected as already-present without per-name round-trips).
  var existing = await Developer.find({}).select("normalizedName").lean();
  var existingByKey = {};
  existing.forEach(function(d){ if (d && d.normalizedName) existingByKey[d.normalizedName] = true; });
  console.log("Developers already in DB: " + existing.length + "\n");

  var created = 0, already = 0;
  for (var i = 0; i < scan.order.length; i++) {
    var key = scan.order[i];
    var name = scan.firstByKey[key];
    if (existingByKey[key]) { already++; console.log("exists:    \"" + name + "\"  [" + key + "]"); continue; }
    if (DRY_RUN) { created++; console.log("WOULD add: \"" + name + "\"  [" + key + "]"); continue; }
    try {
      await Developer.create({ name: name, normalizedName: key });
      created++;
      console.log("added:     \"" + name + "\"  [" + key + "]");
    } catch(e) {
      // Unique-index backstop for a concurrent insert — treat as already-present.
      if (e && e.code === 11000) { already++; console.log("exists(rc):\"" + name + "\"  [" + key + "]"); }
      else throw e;
    }
  }

  var finalCount = await Developer.countDocuments({});
  console.log("\n=== Summary ===");
  console.log("Input names:                 " + NAMES.length);
  console.log("Distinct keys (attempted):   " + scan.order.length);
  console.log("Intra-input collisions:      " + scan.collisions.length + " (dropped — first spelling kept)");
  console.log("Invalid (no key):            " + scan.invalid.length);
  console.log("Already in DB (skipped):     " + already);
  console.log((DRY_RUN ? "WOULD create:                " : "Created:                     ") + created);
  console.log("Developers in DB now:        " + finalCount);
  if (DRY_RUN) console.log("\nDRY_RUN — no writes. Re-run WITHOUT DRY_RUN=1 to apply the " + created + " addition(s).");

  await mongoose.disconnect();
}
main().catch(function(e){ console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });
