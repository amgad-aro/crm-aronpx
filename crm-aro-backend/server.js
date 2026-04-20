require("dotenv").config();
var express = require("express");
var mongoose = require("mongoose");
var cors = require("cors");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var http = require("http");
var WebSocketLib = require("ws");

// Coerce anything the frontend sends for an ObjectId-typed field into a
// 24-hex string or null. Handles: empty string, populated {_id, name, ...}
// objects returned from a prior populate(), ObjectId instances, plain 24-hex
// strings. Anything else → null so callers can treat as "unset".
function normId(val) {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "object") {
    if (val._id) val = val._id;
    else if (typeof val.toString === "function") val = val.toString();
    else return null;
  }
  var s = String(val);
  return mongoose.Types.ObjectId.isValid(s) ? s : null;
}

// ===== REAL-TIME BROADCASTER =====
// Actual implementation is set below once the WebSocket server is created.
// Schema hooks (defined a few lines down) call broadcast() — it's a no-op until the server starts.
var broadcast = function(){};
var emitLead = function(doc){ try{ if(doc) broadcast("lead_updated", { leadId: String(doc._id), lead: doc }); }catch(e){} };
var emitLeadDeleted = function(doc){ try{ if(doc) broadcast("lead_deleted", { leadId: String(doc._id) }); }catch(e){} };
var emitDR = function(doc){ try{ if(doc) broadcast("dr_updated", { drId: String(doc._id), dr: doc }); }catch(e){} };
var emitDRDeleted = function(doc){ try{ if(doc) broadcast("dr_deleted", { drId: String(doc._id) }); }catch(e){} };
var emitUser = function(doc){ try{ if(doc) broadcast("user_updated", { userId: String(doc._id), user: doc }); }catch(e){} };
var emitUserDeleted = function(doc){ try{ if(doc) broadcast("user_deleted", { userId: String(doc._id) }); }catch(e){} };
var emitActivity = function(doc){ try{ if(doc) broadcast("activity_created", { activity: doc }); }catch(e){} };
var emitNotification = function(){ try{ broadcast("notification_updated", {}); }catch(e){} };
var emitTask = function(){ try{ broadcast("task_updated", {}); }catch(e){} };

// ===== CORS OPTIONS =====
var corsOptions = {
  // Reflect caller origin to avoid blocking Vercel custom domains.
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"]
};

// ===== MODELS =====
delete mongoose.models["User"];
delete mongoose.models["Lead"];
delete mongoose.models["Activity"];
delete mongoose.models["Task"];
delete mongoose.models["DailyRequest"];

var User = mongoose.model("User", new mongoose.Schema({
  name:{type:String,required:true}, username:{type:String,required:true,unique:true},
  password:{type:String,required:true}, email:{type:String,default:""}, phone:{type:String,default:""},
  role:{type:String,enum:["admin","sales_admin","manager","team_leader","sales","viewer"],default:"sales"},
  title:{type:String,default:""}, active:{type:Boolean,default:true},
  monthlyTarget:{type:Number,default:15}, teamId:{type:String,default:""}, teamName:{type:String,default:""}, lastSeen:{type:Date,default:null}, lastActive:{type:Date,default:null}, qTargets:{type:Object,default:{}}, reportsTo:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null}
},{timestamps:true}));

var Lead = mongoose.model("Lead", new mongoose.Schema({
  name:{type:String,required:true}, phone:{type:String,required:true}, phone2:{type:String,default:""},
  email:{type:String,default:""}, status:{type:String,default:"NewLead"},
  source:{type:String,default:"Facebook"}, project:{type:String,default:""}, campaign:{type:String,default:""},
  agentId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, budget:{type:String,default:""},
  notes:{type:String,default:""}, callbackTime:{type:String,default:""},
  lastActivityTime:{type:Date,default:Date.now}, archived:{type:Boolean,default:false}, isVIP:{type:Boolean,default:false},
  eoiDeposit:{type:String,default:""}, eoiDate:{type:String,default:""},
  eoiApproved:{type:Boolean,default:false}, eoiImage:{type:String,default:""},
  eoiDocuments:[{type:mongoose.Schema.Types.Mixed}],
  preEoiStatus:{type:String,default:""},
  eoiStatus:{type:String,default:""}, // "" | "Pending" | "Approved" | "EOI Cancelled"
  preDealStatus:{type:String,default:""},
  dealStatus:{type:String,default:""}, // "" | "Deal Cancelled"
  stages:{type:mongoose.Schema.Types.Mixed,default:{}},
  dealApproved:{type:Boolean,default:false}, dealImages:[{type:String}],
  commissionClaimDate:{type:String,default:""}, commissionClaimed:{type:Boolean,default:false},
  splitAgent2Id:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
  splitAgent2Name:{type:String,default:""},
  projectWeight:{type:Number,default:1},
  dealDate:{type:String,default:""},
  lastRotationAt:{type:Date,default:null}, rotationCount:{type:Number,default:0},
  // Rotation kill-switch — flipped true after 3 consecutive agents mark the
  // lead "Not Interested" (tracked by notInterestedStreak). Once true, every
  // rotation endpoint bails out; admin can reset it by editing the lead.
  rotationStopped:{type:Boolean,default:false},
  notInterestedStreak:{type:Number,default:0},
  locked:{type:Boolean,default:false},
  lastFeedback:{type:String,default:""},
  // Permanent meeting marker — once set, must never be cleared or overwritten.
  // hadMeeting records that the lead has reached MeetingDone at least once,
  // meetingDoneAt is the first time it happened so period-based reports can
  // still bucket it correctly even after the status moves on.
  hadMeeting:{type:Boolean,default:false},
  meetingDoneAt:{type:Date,default:null},
  // Full audit timeline (admin-only view). Every create / assign / rotate /
  // status change / feedback / callback pushes a single {event, description,
  // byUser, toAgent, timestamp} entry. Append-only — never cleared.
  history:{type:[mongoose.Schema.Types.Mixed],default:[]},
  agentHistory:{type:[mongoose.Schema.Types.Mixed],default:[]},
  assignments:[{
    agentId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    status:{type:String,default:"NewLead"},
    notes:{type:String,default:""},
    budget:{type:String,default:""},
    callbackTime:{type:String,default:""},
    lastFeedback:{type:String,default:""},
    lastActionAt:{type:Date,default:Date.now},
    rotationTimer:{type:Date,default:Date.now},
    noRotation:{type:Boolean,default:false},
    nextCallAt:{type:Date,default:null},
    assignedAt:{type:Date,default:Date.now},
    agentHistory:{type:[mongoose.Schema.Types.Mixed],default:[]}
  }],
  previousAgentIds:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  globalStatus:{type:String,default:"active"},
  expiresAt:{type:Date,default:null}
},{timestamps:true}));

// Indexes for query performance
Lead.collection.createIndex({ "assignments.agentId": 1 }).catch(function(){});
Lead.collection.createIndex({ agentId: 1 }).catch(function(){});
Lead.collection.createIndex({ createdAt: -1 }).catch(function(){});
Lead.collection.createIndex({ globalStatus: 1 }).catch(function(){});
Lead.collection.createIndex({ archived: 1, agentId: 1 }).catch(function(){});
Lead.collection.createIndex({ "assignments.agentId": 1, createdAt: -1 }).catch(function(){});

// Safety-net unique index on phone. Partial filter skips empty strings so the
// constraint only applies to rows with a real phone value. If pre-existing
// duplicates cause creation to fail, log and continue — the app-level guard in
// POST /api/leads / FB webhook still blocks new duplicates.
Lead.collection.createIndex(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: "string", $gt: "" } }, name: "uniq_phone" }
).catch(function(e){
  console.error("[phone unique index] not created:", e && e.message ? e.message : e);
});

var Activity = mongoose.model("Activity", new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  leadId:{type:mongoose.Schema.Types.ObjectId,ref:"Lead"},
  type:{type:String,default:"call"}, note:{type:String,default:""},
  // Client snapshot at the time of the action — captured by POST /api/activities
  // so the dashboard never has to cross-join Lead/DailyRequest at render time.
  // populate("leadId") only resolves Lead docs; DR-backed activities lose the
  // populated name, which is what made the "Note added" rows render "no client".
  clientName:{type:String,default:""}, clientPhone:{type:String,default:""}
},{timestamps:true}));

var Task = mongoose.model("Task", new mongoose.Schema({
  title:{type:String,required:true}, type:{type:String,default:"call"},
  time:{type:String,default:""}, leadId:{type:mongoose.Schema.Types.ObjectId,ref:"Lead"},
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, done:{type:Boolean,default:false}
},{timestamps:true}));

var Notification = mongoose.model("Notification", new mongoose.Schema({
  type:{type:String,required:true}, // "deal" or "rotation"
  leadName:{type:String,default:""},
  leadId:{type:String,default:""},
  agentName:{type:String,default:""},
  fromName:{type:String,default:""},
  toName:{type:String,default:""},
  status:{type:String,default:""},
  budget:{type:String,default:""},
  reason:{type:String,default:""},
  seenBy:[{type:String}]
},{timestamps:true}));

// AppSetting — key/value store for global CRM settings (rotation config etc).
// Single source of truth across all clients and server-side jobs.
var AppSetting = mongoose.model("AppSetting", new mongoose.Schema({
  key:{type:String,required:true,unique:true},
  value:{type:mongoose.Schema.Types.Mixed,default:{}}
},{timestamps:true}));

var DailyRequest = mongoose.model("DailyRequest", new mongoose.Schema({
  name:{type:String,required:true}, phone:{type:String,required:true}, phone2:{type:String,default:""},
  email:{type:String,default:""}, budget:{type:String,default:""}, propertyType:{type:String,default:""},
  area:{type:String,default:""}, notes:{type:String,default:""}, status:{type:String,default:"NewLead"},
  agentId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, callbackTime:{type:String,default:""},
  lastActivityTime:{type:Date,default:Date.now}, source:{type:String,default:"Daily Request"},
  lastFeedback:{type:String,default:""},
  archived:{type:Boolean,default:false},
  // Permanent meeting marker — see comment on the Lead schema above. Must
  // never be cleared or overwritten once set.
  hadMeeting:{type:Boolean,default:false},
  meetingDoneAt:{type:Date,default:null},
  eoiApproved:{type:Boolean,default:false}, eoiDate:{type:String,default:""}, eoiDeposit:{type:String,default:""},
  eoiDocuments:[{type:mongoose.Schema.Types.Mixed}],
  preEoiStatus:{type:String,default:""},
  eoiStatus:{type:String,default:""},
  preDealStatus:{type:String,default:""},
  dealStatus:{type:String,default:""}
},{timestamps:true}));

var app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== REAL-TIME BROADCAST MIDDLEWARE =====
// For every successful mutating request (POST/PUT/DELETE), inspect the path and response body
// and emit the appropriate WebSocket event to all connected clients. One place, covers every route.
app.use(function(req, res, next){
  var method = req.method;
  if (method !== "POST" && method !== "PUT" && method !== "DELETE") return next();
  if (!req.path.indexOf("/api/") === 0 && !req.path.startsWith("/api/")) return next();
  var originalJson = res.json.bind(res);
  res.json = function(body){
    try {
      if (res.statusCode < 400) {
        var path = req.path || "";
        var isArchive = path.indexOf("/archive") !== -1;
        // ----- Users -----
        if (path.indexOf("/api/users") === 0) {
          if (method === "DELETE") broadcast("user_deleted", { userId: String(req.params.id||"") });
          else if (body && body._id) broadcast("user_updated", { userId: String(body._id), user: body });
        }
        // ----- Activities -----
        else if (path.indexOf("/api/activities") === 0 && method === "POST") {
          if (body && body._id) broadcast("activity_created", { activity: body });
        }
        // ----- Notifications -----
        else if (path.indexOf("/api/notifications") === 0) {
          broadcast("notification_updated", {});
        }
        // ----- Tasks -----
        else if (path.indexOf("/api/tasks") === 0) {
          broadcast("task_updated", { taskId: String((body&&body._id)||req.params.id||"") });
        }
        // ----- Daily Requests -----
        else if (path.indexOf("/api/daily-requests") === 0) {
          if (method === "DELETE") broadcast("dr_deleted", { drId: String(req.params.id||"") });
          else if (body && body._id) broadcast("dr_updated", { drId: String(body._id), dr: body });
          else if (body && Array.isArray(body)) broadcast("dr_updated", {}); // bulk
          else broadcast("dr_updated", {});
        }
        // ----- Leads (includes rotate / eoi-cancel / deal-cancel / eoi-to-deal / upload-image / eoi-documents / archive / bulk-*) -----
        else if (path.indexOf("/api/leads") === 0) {
          if (method === "DELETE") broadcast("lead_deleted", { leadId: String(req.params.id||"") });
          else if (body && body.lead && body.lead._id) broadcast("lead_updated", { leadId: String(body.lead._id), lead: body.lead });
          else if (body && body._id) broadcast("lead_updated", { leadId: String(body._id), lead: body });
          else broadcast("lead_updated", {}); // bulk / non-doc response
          // Rotation sub-event so the rotation notifications panel can reload
          if (path.indexOf("/rotate") !== -1) broadcast("rotation_updated", { leadId: String(req.params.id||"") });
          if (isArchive) broadcast("lead_updated", { leadId: String(req.params.id||""), lead: body });
        }
      }
    } catch(e){ console.error("broadcast mw error:", e.message); }
    return originalJson(body);
  };
  next();
});

// ===== CONNECT TO MONGODB =====
mongoose.connect(process.env.MONGODB_URI).then(function() {
  console.log("Connected to MongoDB");
  seedAdmin();
  // Clean up null entries in previousAgentIds from old rotation code
  Lead.updateMany({ previousAgentIds: null }, { $pull: { previousAgentIds: null } }).catch(function(){});
  // One-time backfill for rows that reached MeetingDone before the
  // hadMeeting/meetingDoneAt flag existed. Any lead/DR currently at
  // MeetingDone, or any lead whose assignments[] slice ever recorded a
  // MeetingDone status, gets stamped once. Idempotent — subsequent runs
  // find nothing to update because hadMeeting is set.
  Lead.updateMany(
    { hadMeeting: { $ne: true }, $or: [ { status: "MeetingDone" }, { "assignments.status": "MeetingDone" }, { "assignments.status": "Meeting Done" } ] },
    [{ $set: { hadMeeting: true, meetingDoneAt: { $ifNull: ["$updatedAt", "$createdAt", new Date()] } } }]
  ).catch(function(e){ console.error("[hadMeeting lead backfill]", e && e.message); });
  DailyRequest.updateMany(
    { hadMeeting: { $ne: true }, status: "MeetingDone" },
    [{ $set: { hadMeeting: true, meetingDoneAt: { $ifNull: ["$updatedAt", "$createdAt", new Date()] } } }]
  ).catch(function(e){ console.error("[hadMeeting DR backfill]", e && e.message); });

  // One-time history backfill: every lead must start with a "created" /
  // "first_assigned" entry showing who added it and who it was assigned to.
  // For leads that predate the history array we reconstruct that first entry
  // from the best evidence available — earliest agentHistory rotation's
  // "by" field, earliest activity.userId, or fall back to "System". The
  // initial agent is the first assignments[] entry, or current agentId.
  // Idempotent: leads whose history already starts with one of those events
  // are skipped.
  backfillLeadHistory().catch(function(e){ console.error("[history backfill]", e && e.message); });
}).catch(function(err) {
  console.error("MongoDB connection error:", err);
});

async function backfillLeadHistory() {
  // Leads where the first history entry is NOT already created/first_assigned.
  var needsInit = await Lead.find({
    $or: [
      { history: { $exists: false } },
      { history: { $size: 0 } },
      { "history.0.event": { $nin: ["created", "first_assigned"] } }
    ]
  }).populate("agentId", "name").populate("assignments.agentId", "name").lean();
  if (!needsInit.length) return;
  console.log("[history backfill] stamping initial entry on " + needsInit.length + " leads");
  for (var i = 0; i < needsInit.length; i++) {
    var l = needsInit[i];
    try {
      // Creator: earliest rotation's `by`, earliest activity's userId.name,
      // else "System".
      var creator = "";
      var hist = Array.isArray(l.agentHistory) ? l.agentHistory : [];
      var earliest = null;
      hist.forEach(function(h){
        if (!h || !h.date) return;
        var t = new Date(h.date).getTime();
        if (!earliest || t < new Date(earliest.date).getTime()) earliest = h;
      });
      if (earliest && earliest.by) creator = earliest.by;
      if (!creator) {
        var firstAct = await Activity.findOne({ leadId: l._id }).populate("userId", "name").sort({ createdAt: 1 }).lean();
        if (firstAct && firstAct.userId && firstAct.userId.name) creator = firstAct.userId.name;
      }
      if (!creator) creator = "System";

      // Initial agent: first assignments[] entry → its agent name. If none,
      // current agentId's name. If still none, "No Agent".
      var initialAgent = "";
      var firstAssign = Array.isArray(l.assignments) && l.assignments.length > 0 ? l.assignments[0] : null;
      if (firstAssign && firstAssign.agentId && firstAssign.agentId.name) {
        initialAgent = firstAssign.agentId.name;
      } else if (l.agentId && l.agentId.name) {
        initialAgent = l.agentId.name;
      }
      var hadAgent = !!initialAgent;
      if (!initialAgent) initialAgent = "No Agent";

      var entry = {
        event: hadAgent ? "first_assigned" : "created",
        description: hadAgent
          ? "Lead added by " + creator + " and assigned to " + initialAgent + (l.source ? " (source: " + l.source + ")" : "")
          : "Lead added by " + creator + " — No Agent" + (l.source ? " (source: " + l.source + ")" : ""),
        byUser: creator,
        toAgent: initialAgent,
        timestamp: l.createdAt || new Date()
      };

      // Prepend so it always sorts first in the timeline regardless of
      // later events' timestamps.
      await Lead.updateOne({ _id: l._id }, { $push: { history: { $each: [entry], $position: 0 } } });
    } catch(err) {
      console.error("[history backfill] lead " + l._id + ":", err && err.message ? err.message : err);
    }
  }
  console.log("[history backfill] done");
}

// ===== CREATE DEFAULT ADMIN =====
async function seedAdmin() {
  try {
    var exists = await User.findOne({ username: "amgad" });
    if (!exists) {
      var hashed = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "\u0623\u0645\u062c\u062f",
        username: "amgad",
        password: hashed,
        email: "amgad@aro.com",
        phone: "01000000000",
        role: "admin",
        title: "CEO",
        active: true,
      });
      console.log("Admin user created: amgad / admin123");
    }
  } catch (e) {
    console.error("Seed error:", e);
  }
}

// ===== AUTH MIDDLEWARE =====
function auth(req, res, next) {
  var apiKey = req.headers["x-api-key"] || req.query.api_key;
  if (apiKey && apiKey === process.env.INTEGRATION_API_KEY) {
    req.user = { id: "integration", role: "admin", name: "Integration" };
    return next();
  }
  var token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });
  token = token.replace("Bearer ", "");
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "sales_admin" && req.user.role !== "manager" && req.user.role !== "team_leader") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

function leadUploadImageValidation(req, res, next) {
  try {
    var imageType = req.body && req.body.imageType;
    var rawValue = req.body && req.body.imageData;

    if (imageType && imageType !== "eoi" && imageType !== "deal") {
      return res.status(400).json({ error: "Invalid imageType" });
    }

    var raw = String(rawValue || "").trim();
    if (!raw) {
      return res.status(400).json({ error: "imageData is required" });
    }

    var mime = "";
    var base64Part = raw;
    var dataUrlMatch = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (dataUrlMatch) {
      mime = dataUrlMatch[1].toLowerCase();
      base64Part = dataUrlMatch[2];
    }

    if (!/^[A-Za-z0-9+/=]+$/.test(base64Part)) {
      return res.status(400).json({ error: "Invalid base64 image data" });
    }

    var buffer;
    try {
      buffer = Buffer.from(base64Part, "base64");
    } catch (e) {
      return res.status(400).json({ error: "Invalid base64 image data" });
    }

    if (!buffer || !buffer.length) {
      return res.status(400).json({ error: "Invalid base64 image data" });
    }

    // 5MB decoded payload limit for safer storage and DoS resistance.
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large (max 5MB)" });
    }

    var isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    var isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 && buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A;
    var isWebp = buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";

    if (!isJpeg && !isPng && !isWebp) {
      return res.status(400).json({ error: "Only JPEG, PNG, or WEBP images are allowed" });
    }

    if (mime && ["image/jpeg", "image/jpg", "image/png", "image/webp"].indexOf(mime) === -1) {
      return res.status(400).json({ error: "Unsupported image MIME type" });
    }

    next();
  } catch (e) {
    return res.status(400).json({ error: "Invalid image payload" });
  }
}

// ===== LEAD HISTORY HELPERS =====
// Single write-path for the admin audit timeline. Every caller pushes one
// entry via $push so concurrent updates never overwrite each other.
function historyEntry(event, description, byUser, toAgent) {
  return {
    event: String(event || "event"),
    description: String(description || ""),
    byUser: String(byUser || ""),
    toAgent: String(toAgent || ""),
    timestamp: new Date()
  };
}
async function pushHistory(leadId, entries) {
  if (!leadId || !entries) return;
  var arr = Array.isArray(entries) ? entries : [entries];
  if (arr.length === 0) return;
  try {
    await Lead.updateOne({ _id: leadId }, { $push: { history: { $each: arr } } });
  } catch(e) {
    console.error("[history push]", e && e.message ? e.message : e);
  }
}

// ===== PHONE DUPLICATE CHECK HELPER =====
// Treat both phone and phone2 as reserved identifiers. Normalize by trimming so
// "0100 " and "0100" are the same. Includes archived so soft-deleted leads still
// block re-entry — operators can un-archive instead of creating a duplicate.
async function findLeadByPhone(rawPhone) {
  var p = String(rawPhone || "").trim();
  if (!p) return null;
  return await Lead.findOne({ $or: [{ phone: p }, { phone2: p }] }).populate("agentId", "name title").lean();
}

// ===== AUTH ROUTES =====
app.post("/api/login", async function(req, res) {
  try {
    var user = await User.findOne({ username: req.body.username, active: true });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    var valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    var token = jwt.sign({
      id: user._id,
      role: user.role,
      name: user.name
    }, process.env.JWT_SECRET, { expiresIn: "7d" });

    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });
    res.json({
      token: token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        title: user.title,
        email: user.email,
        phone: user.phone,
        teamId: user.teamId||"",
        teamName: user.teamName||"",
        reportsTo: user.reportsTo||null
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== HEARTBEAT =====
app.post("/api/heartbeat", auth, async function(req, res) {
  try {
    var update = { lastSeen: new Date() };
    // If user sent isActive flag, update lastActive too
    if(req.body && req.body.isActive) {
      update.lastActive = new Date();
    }
    await User.findByIdAndUpdate(req.user.id, update);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
app.get("/api/me", auth, async function(req, res) {
  try {
    var user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== APP SETTINGS — ROTATION CONFIG (single source of truth in MongoDB) =====
// Defaults used when no record exists yet. Must match the UI defaults.
var ROTATION_DEFAULTS = {
  reassignAgents: [],
  naCount: 2, naHours: 1,
  niDays: 1, noActDays: 2, cbDays: 1, hotDays: 2,
  tiers: {
    tier1: { agents: [], lastIdx: -1 },
    tier2: { agents: [], lastIdx: -1 },
    tier3: { agents: [], lastIdx: -1 }
  },
  autoRotationEnabled: true,
  autoRotationPausedUntil: null,
  workingHours: {
    days: ["Sun","Mon","Tue","Wed","Thu"],
    from: "10:00",
    to:   "19:00",
    afterHoursBehavior: "queue"
  },
  smartSkipRules: {
    skipOnVacation:         true,
    skipIfOfflineHours:     4,
    respectWorkingHours:    true,
    skipIfAlreadyHandled:   true,
    haltAfterNotInterested: 3,
    haltWhenAllHandled:     true
  },
  rotationStopAfterDays: 45
};
async function getRotationSettings() {
  var doc = await AppSetting.findOne({ key: "rotation" }).lean();
  var v = (doc && doc.value) || {};
  var D = ROTATION_DEFAULTS;

  // Lazy, idempotent migration: seed tiers from the legacy flat reassignAgents list.
  var tiers = v.tiers;
  if (!tiers || !tiers.tier1) {
    var legacyList = Array.isArray(v.reassignAgents) ? v.reassignAgents.map(String) : [];
    var legacyIdx  = (typeof v.lastAssignedIdx === "number") ? v.lastAssignedIdx : -1;
    tiers = {
      tier1: { agents: legacyList, lastIdx: legacyIdx },
      tier2: { agents: [],         lastIdx: -1 },
      tier3: { agents: [],         lastIdx: -1 }
    };
  } else {
    ["tier1","tier2","tier3"].forEach(function(k){
      if (!tiers[k] || typeof tiers[k] !== "object") tiers[k] = { agents: [], lastIdx: -1 };
      tiers[k].agents  = Array.isArray(tiers[k].agents) ? tiers[k].agents.map(String) : [];
      tiers[k].lastIdx = (typeof tiers[k].lastIdx === "number") ? tiers[k].lastIdx : -1;
    });
  }

  // Flat list derived from tiers — kept for read-compat with older clients.
  var flat = [].concat(tiers.tier1.agents, tiers.tier2.agents, tiers.tier3.agents);

  return {
    reassignAgents: flat,
    naCount:   Number(v.naCount   != null ? v.naCount   : D.naCount),
    naHours:   Number(v.naHours   != null ? v.naHours   : D.naHours),
    niDays:    Number(v.niDays    != null ? v.niDays    : D.niDays),
    noActDays: Number(v.noActDays != null ? v.noActDays : D.noActDays),
    cbDays:    Number(v.cbDays    != null ? v.cbDays    : D.cbDays),
    hotDays:   Number(v.hotDays   != null ? v.hotDays   : D.hotDays),
    lastAssignedIdx: (typeof v.lastAssignedIdx === "number") ? v.lastAssignedIdx : -1,
    tiers: tiers,
    autoRotationEnabled:     v.autoRotationEnabled !== false,
    autoRotationPausedUntil: v.autoRotationPausedUntil || null,
    workingHours:            Object.assign({}, D.workingHours, v.workingHours || {}),
    smartSkipRules:          Object.assign({}, D.smartSkipRules, v.smartSkipRules || {}),
    rotationStopAfterDays:   Number(v.rotationStopAfterDays != null ? v.rotationStopAfterDays : D.rotationStopAfterDays)
  };
}

// Is "now" within the company working-hours window? Days: Sun..Sat (3-letter).
// Empty from/to = always open; overnight windows (22:00→06:00) supported.
function isWithinWorkingHours(wh, d) {
  if (!wh) return true;
  var dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var today = dayNames[d.getDay()];
  if (Array.isArray(wh.days) && wh.days.length && wh.days.indexOf(today) < 0) return false;
  var toMin = function(hhmm){ var p = String(hhmm||"").split(":"); return (Number(p[0])||0)*60 + (Number(p[1])||0); };
  var cur = d.getHours()*60 + d.getMinutes();
  var from = toMin(wh.from), to = toMin(wh.to);
  if (from === 0 && to === 0) return true;
  if (from <= to) return cur >= from && cur <= to;
  return cur >= from || cur <= to;
}

// Any authenticated user can READ rotation settings — the rotation loop runs
// client-side for every signed-in user and must see the same numbers the admin saved.
app.get("/api/settings/rotation", auth, async function(req, res) {
  try {
    res.json(await getRotationSettings());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Only pure "admin" role can WRITE — sales_admin is intentionally excluded per spec.
app.put("/api/settings/rotation", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    var b = req.body || {};
    var D = ROTATION_DEFAULTS;
    var clamp = function(n, def, min, max){
      var x = Number(n); if (!isFinite(x)) x = def;
      if (x < min) x = min; if (x > max) x = max; return x;
    };
    var toIdArr = function(a){ return Array.isArray(a) ? a.map(String) : []; };

    var existing = await AppSetting.findOne({ key: "rotation" }).lean();
    var prevValue = (existing && existing.value) || {};
    var prevTiers = (prevValue.tiers && prevValue.tiers.tier1) ? prevValue.tiers : null;

    // Tiers: accept new {tiers:{tier1,tier2,tier3}} shape; fall back to legacy reassignAgents → tier1.
    var tiers;
    if (b.tiers && b.tiers.tier1) {
      tiers = {
        tier1: { agents: toIdArr(b.tiers.tier1.agents), lastIdx: prevTiers ? prevTiers.tier1.lastIdx : -1 },
        tier2: { agents: toIdArr(b.tiers.tier2 && b.tiers.tier2.agents), lastIdx: prevTiers ? prevTiers.tier2.lastIdx : -1 },
        tier3: { agents: toIdArr(b.tiers.tier3 && b.tiers.tier3.agents), lastIdx: prevTiers ? prevTiers.tier3.lastIdx : -1 }
      };
    } else {
      tiers = {
        tier1: { agents: toIdArr(b.reassignAgents), lastIdx: prevTiers ? prevTiers.tier1.lastIdx : -1 },
        tier2: { agents: prevTiers ? prevTiers.tier2.agents : [], lastIdx: prevTiers ? prevTiers.tier2.lastIdx : -1 },
        tier3: { agents: prevTiers ? prevTiers.tier3.agents : [], lastIdx: prevTiers ? prevTiers.tier3.lastIdx : -1 }
      };
    }
    // Clamp per-tier pointers so a shortened list can't leave a pointer past its end.
    ["tier1","tier2","tier3"].forEach(function(k){
      var t = tiers[k];
      t.lastIdx = t.agents.length > 0 ? Math.max(-1, Math.min(t.lastIdx, t.agents.length - 1)) : -1;
    });

    var wh = Object.assign({}, D.workingHours, prevValue.workingHours || {}, b.workingHours || {});
    var sr = Object.assign({}, D.smartSkipRules, prevValue.smartSkipRules || {}, b.smartSkipRules || {});
    sr.skipIfOfflineHours     = clamp(sr.skipIfOfflineHours,     D.smartSkipRules.skipIfOfflineHours,     0, 168);
    sr.haltAfterNotInterested = clamp(sr.haltAfterNotInterested, D.smartSkipRules.haltAfterNotInterested, 0, 20);

    var value = {
      reassignAgents: [].concat(tiers.tier1.agents, tiers.tier2.agents, tiers.tier3.agents),
      naCount:   clamp(b.naCount,   D.naCount,   1, 100),
      naHours:   clamp(b.naHours,   D.naHours,   1, 720),
      niDays:    clamp(b.niDays,    D.niDays,    1, 365),
      noActDays: clamp(b.noActDays, D.noActDays, 1, 365),
      cbDays:    clamp(b.cbDays,    D.cbDays,    1, 365),
      hotDays:   clamp(b.hotDays,   D.hotDays,   1, 365),
      lastAssignedIdx: tiers.tier1.lastIdx,
      tiers: tiers,
      autoRotationEnabled:     b.autoRotationEnabled !== false,
      autoRotationPausedUntil: b.autoRotationPausedUntil ? new Date(b.autoRotationPausedUntil) : null,
      workingHours:            wh,
      smartSkipRules:          sr,
      rotationStopAfterDays:   clamp(b.rotationStopAfterDays, D.rotationStopAfterDays, 1, 3650)
    };
    await AppSetting.findOneAndUpdate({ key: "rotation" }, { $set: { value: value } }, { upsert: true, new: true });
    try { broadcast("settings_updated", { key: "rotation", value: value }); } catch(e) {}
    res.json(value);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== DASHBOARD — SALES RANKING (all sales agents, CRM-wide) =====
// Any authenticated user can read this. Returns one row per active user with
// role === "sales", scored across the entire CRM (no teamId filter). Score
// is a plain sum of four per-agent counts in the [from, to] window:
//   activities + calls + meetings + dailyRequests
// — deals are intentionally excluded per the dashboard spec.
app.get("/api/dashboard/sales-ranking", auth, async function(req, res) {
  try {
    var parseDate = function(s){ if(!s) return null; var d = new Date(String(s)); return isNaN(d.getTime()) ? null : d; };
    var from = parseDate(req.query.from);
    var to   = parseDate(req.query.to);
    var rangeMatch = (from || to) ? (function(){ var r = {}; if(from) r.$gte = from; if(to) r.$lte = to; return r; })() : null;

    // Sales users CRM-wide — no team / reportsTo restriction.
    var salesUsers = await User.find({ role: "sales", active: { $ne: false } })
      .select("_id name title")
      .sort({ name: 1 })
      .lean();
    if (!salesUsers.length) return res.json([]);
    var salesIds = salesUsers.map(function(u){ return u._id; });

    // Activities (all types) authored by a sales user in range.
    var actBase = { userId: { $in: salesIds } };
    if (rangeMatch) actBase.createdAt = rangeMatch;
    var actRows = await Activity.aggregate([
      { $match: actBase },
      { $group: { _id: "$userId", c: { $sum: 1 } } }
    ]);
    var activitiesByAgent = {};
    actRows.forEach(function(r){ activitiesByAgent[String(r._id)] = r.c; });

    // Calls only (subset of activities, tracked separately for display).
    var callBase = { userId: { $in: salesIds }, type: "call" };
    if (rangeMatch) callBase.createdAt = rangeMatch;
    var callRows = await Activity.aggregate([
      { $match: callBase },
      { $group: { _id: "$userId", c: { $sum: 1 } } }
    ]);
    var callsByAgent = {};
    callRows.forEach(function(r){ callsByAgent[String(r._id)] = r.c; });

    // Meetings: leads with hadMeeting === true, dated in range by meetingDoneAt
    // (falling back to updatedAt when meetingDoneAt is absent).
    var meetPipeline = [
      { $match: { hadMeeting: true, agentId: { $in: salesIds } } },
      { $addFields: { meetAt: { $ifNull: ["$meetingDoneAt", "$updatedAt"] } } }
    ];
    if (rangeMatch) meetPipeline.push({ $match: { meetAt: rangeMatch } });
    meetPipeline.push({ $group: { _id: "$agentId", c: { $sum: 1 } } });
    var meetRows = await Lead.aggregate(meetPipeline);
    var meetsByAgent = {};
    meetRows.forEach(function(r){ meetsByAgent[String(r._id)] = r.c; });

    // Daily requests owned by a sales user, created in range.
    var drBase = { agentId: { $in: salesIds } };
    if (rangeMatch) drBase.createdAt = rangeMatch;
    var drRows = await DailyRequest.aggregate([
      { $match: drBase },
      { $group: { _id: "$agentId", c: { $sum: 1 } } }
    ]);
    var drByAgent = {};
    drRows.forEach(function(r){ drByAgent[String(r._id)] = r.c; });

    var rows = salesUsers.map(function(u){
      var uid = String(u._id);
      var activities     = activitiesByAgent[uid] || 0;
      var calls          = callsByAgent[uid] || 0;
      var meetings       = meetsByAgent[uid] || 0;
      var dailyRequests  = drByAgent[uid] || 0;
      return {
        uid: uid,
        name: u.name,
        title: u.title || "",
        activities: activities,
        calls: calls,
        meetings: meetings,
        dailyRequests: dailyRequests,
        score: activities + calls + meetings + dailyRequests
      };
    }).sort(function(a,b){ return b.score - a.score || b.meetings - a.meetings; });

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== DASHBOARD — MY STATS (per-agent, period-scoped) =====
// Returns counts for the 6 Sales Dashboard KPI cards for the calling user.
// Every card except Followups is scoped to [from, to]. Followups matches the
// notification bell — current-state count of leads idle >= 2 days that still
// need contact (not range-filtered, matches the bell exactly).
app.get("/api/dashboard/my-stats", auth, async function(req, res) {
  try {
    var parseDate = function(s){ if(!s) return null; var d = new Date(String(s)); return isNaN(d.getTime()) ? null : d; };
    var from = parseDate(req.query.from);
    var to   = parseDate(req.query.to);
    var rangeMatch = (from || to) ? (function(){ var r = {}; if(from) r.$gte = from; if(to) r.$lte = to; return r; })() : null;
    if (!req.user || !req.user.id) return res.status(401).json({ error: "No user" });
    var uid = new mongoose.Types.ObjectId(req.user.id);

    // CARD 1 — My Leads: assigned to me AND (createdAt OR any assignment to me) falls in range.
    var myLeadsPipeline = [
      { $match: { agentId: uid, archived: { $ne: true }, source: { $ne: "Daily Request" } } }
    ];
    if (rangeMatch) {
      myLeadsPipeline.push({ $match: {
        $or: [
          { createdAt: rangeMatch },
          { assignments: { $elemMatch: { agentId: uid, assignedAt: rangeMatch } } }
        ]
      }});
    }
    myLeadsPipeline.push({ $count: "c" });
    var myLeadsP = Lead.aggregate(myLeadsPipeline);

    // CARD 2 — Daily Requests: DRs owned by me, created in range.
    var myDrsMatch = { agentId: uid, archived: { $ne: true } };
    if (rangeMatch) myDrsMatch.createdAt = rangeMatch;
    var myDrsP = DailyRequest.countDocuments(myDrsMatch);

    // CARD 3 — Followups: mirror the notification bell (src/App.js:6790). Leads
    // assigned to me, not archived, status not in {DoneDeal, NotInterested, EOI},
    // lastActivityTime >= 2 days ago. No range filter — same as the bell.
    var twoDaysAgo = new Date(Date.now() - 2*24*60*60*1000);
    var myFollowupsP = Lead.countDocuments({
      agentId: uid,
      archived: { $ne: true },
      status: { $nin: ["DoneDeal", "NotInterested", "EOI"] },
      lastActivityTime: { $lte: twoDaysAgo }
    });

    // CARD 4 — Interested: leads + DRs with status in {HotCase, Potential},
    // agent = me, created in range (across both collections).
    var intLeadMatch = { agentId: uid, archived: { $ne: true }, status: { $in: ["Potential", "HotCase"] } };
    if (rangeMatch) intLeadMatch.createdAt = rangeMatch;
    var intLeadsP = Lead.countDocuments(intLeadMatch);
    var intDrMatch = { agentId: uid, archived: { $ne: true }, status: { $in: ["Potential", "HotCase"] } };
    if (rangeMatch) intDrMatch.createdAt = rangeMatch;
    var intDrsP = DailyRequest.countDocuments(intDrMatch);

    // CARD 5 — Meetings: Meeting Done OR Meeting Scheduled.
    //   Done:       lead/DR with hadMeeting === true OR status === "MeetingDone"
    //               (dated by meetingDoneAt, falling back to updatedAt, within range).
    //   Scheduled:  Task documents with type "meeting" authored by me, createdAt in range.
    var meetLeadPipeline = [
      { $match: { agentId: uid, archived: { $ne: true }, $or: [ { hadMeeting: true }, { status: "MeetingDone" } ] } },
      { $addFields: { meetAt: { $ifNull: ["$meetingDoneAt", "$updatedAt"] } } }
    ];
    if (rangeMatch) meetLeadPipeline.push({ $match: { meetAt: rangeMatch } });
    meetLeadPipeline.push({ $count: "c" });
    var meetLeadsP = Lead.aggregate(meetLeadPipeline);
    var meetDrPipeline = [
      { $match: { agentId: uid, archived: { $ne: true }, $or: [ { hadMeeting: true }, { status: "MeetingDone" } ] } },
      { $addFields: { meetAt: { $ifNull: ["$meetingDoneAt", "$updatedAt"] } } }
    ];
    if (rangeMatch) meetDrPipeline.push({ $match: { meetAt: rangeMatch } });
    meetDrPipeline.push({ $count: "c" });
    var meetDrsP = DailyRequest.aggregate(meetDrPipeline);
    var meetTaskMatch = { userId: uid, type: "meeting" };
    if (rangeMatch) meetTaskMatch.createdAt = rangeMatch;
    var meetSchedP = Task.countDocuments(meetTaskMatch);

    // Per-status breakdown for the "My Leads — Status" + "Conversion Funnel"
    // cards. Same scope as Card 1 (agent=me, archived=false, source!=DR,
    // createdAt in range). Returned as a { status: count } map.
    var byStatusPipeline = [
      { $match: { agentId: uid, archived: { $ne: true }, source: { $ne: "Daily Request" } } }
    ];
    if (rangeMatch) byStatusPipeline.push({ $match: { createdAt: rangeMatch } });
    byStatusPipeline.push({ $group: { _id: "$status", c: { $sum: 1 } } });
    var byStatusP = Lead.aggregate(byStatusPipeline);

    // CARD 6 — Target: same calculation as the Admin Team page / KPIs page.
    //   target = user.qTargets[Q], achieved = weighted revenue of my DoneDeal
    //   leads whose deal date falls in [from, to]. Q defaults to the current
    //   quarter; if the client passes ?quarter=Qn (active filter is a quarter)
    //   we honour that so Target lines up with the selected period.
    var qParam = String(req.query.quarter||"").match(/^Q([1-4])$/);
    var curQNum = qParam ? parseInt(qParam[1]) : (Math.floor(new Date().getMonth()/3) + 1);
    var qKey = "Q" + curQNum;

    var userP = User.findById(uid).select("qTargets").lean();
    var myDealsPipeline = [
      { $match: { agentId: uid, status: "DoneDeal" } },
      { $addFields: {
          dealAt: {
            $cond: [
              { $and: [ { $ne: ["$dealDate", ""] }, { $ne: ["$dealDate", null] } ] },
              { $toDate: "$dealDate" },
              "$updatedAt"
            ]
          }
        } }
    ];
    if (rangeMatch) myDealsPipeline.push({ $match: { dealAt: rangeMatch } });
    myDealsPipeline.push({ $project: { budget: 1, projectWeight: 1, splitAgent2Id: 1 } });
    var myDealsP = Lead.aggregate(myDealsPipeline);

    var parts = await Promise.all([
      myLeadsP, myDrsP, myFollowupsP,
      intLeadsP, intDrsP,
      meetLeadsP, meetDrsP, meetSchedP,
      userP, myDealsP, byStatusP
    ]);
    var pickCount = function(arr){ return (arr && arr[0] && arr[0].c) || 0; };
    var myLeadsC    = pickCount(parts[0]);
    var myDrsC      = parts[1] || 0;
    var myFupsC     = parts[2] || 0;
    var interestedC = (parts[3]||0) + (parts[4]||0);
    var meetingsC   = pickCount(parts[5]) + pickCount(parts[6]) + (parts[7]||0);
    var userDoc     = parts[8] || {};
    var myDeals     = parts[9] || [];
    var byStatus = { NewLead:0, Potential:0, HotCase:0, CallBack:0, MeetingDone:0, NotInterested:0, NoAnswer:0, DoneDeal:0 };
    (parts[10] || []).forEach(function(r){ if (r && r._id) byStatus[r._id] = r.c; });

    var parseBudget = function(b){ return parseFloat(String(b||"0").replace(/,/g,"")) || 0; };
    var achieved = myDeals.reduce(function(s,d){
      var w = (typeof d.projectWeight === "number") ? d.projectWeight : 1;
      var split = d.splitAgent2Id ? 0.5 : 1;
      return s + parseBudget(d.budget) * w * split;
    }, 0);

    var target = (userDoc.qTargets && Number(userDoc.qTargets[qKey])) || 0;
    var targetProgress = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;

    res.json({
      myLeads: myLeadsC,
      dailyRequests: myDrsC,
      followups: myFupsC,
      interested: interestedC,
      meetings: meetingsC,
      target: target,
      achieved: achieved,
      targetProgress: targetProgress,
      quarter: qKey,
      byStatus: byStatus
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== USER ROUTES =====
app.get("/api/users", auth, async function(req, res) {
  try {
    var role = req.user.role;
    var uid = req.user.id;
    var users;

    if (role === "admin" || role === "sales_admin") {
      // Admin sees all users
      users = await User.find().select("-password").sort({ createdAt: -1 });
      users = users.map(function(u){ var obj = u.toObject(); if(!obj.qTargets) obj.qTargets = {}; return obj; });

    } else if (role === "manager") {
      var managerUser = await User.findById(uid).lean();
      var visibleIds = [managerUser._id];

      // Always: sees team leaders under him + their sales
      var teamLeaders = await User.find({ reportsTo: managerUser._id, role: { $in: ["manager","team_leader"] } }).lean();
      teamLeaders.forEach(function(tl) { visibleIds.push(tl._id); });
      if (teamLeaders.length > 0) {
        var tlIds = teamLeaders.map(function(tl) { return tl._id; });
        var salesUnder = await User.find({ reportsTo: { $in: tlIds }, role: { $in: ["sales","team_leader"] } }).lean();
        salesUnder.forEach(function(s) { visibleIds.push(s._id); });
      }
      // Also direct sales reporting to manager
      var directSales = await User.find({ reportsTo: managerUser._id, role: "sales" }).lean();
      directSales.forEach(function(s) { if(!visibleIds.some(function(id){ return String(id)===String(s._id); })) visibleIds.push(s._id); });
      users = await User.find({ _id: { $in: visibleIds } }).select("-password").sort({ createdAt: -1 });
      users = users.map(function(u){ var obj = u.toObject(); if(!obj.qTargets) obj.qTargets = {}; return obj; });

    } else if (role === "team_leader") {
      // Team leader: sees themselves + their direct sales
      var tlUser = await User.findById(uid).lean();
      var tlVisibleIds = [tlUser._id];
      var tlDirectSales = await User.find({ reportsTo: tlUser._id, role: "sales" }).lean();
      tlDirectSales.forEach(function(s) { tlVisibleIds.push(s._id); });
      users = await User.find({ _id: { $in: tlVisibleIds } }).select("-password").sort({ createdAt: -1 });
      users = users.map(function(u){ var obj = u.toObject(); if(!obj.qTargets) obj.qTargets = {}; return obj; });

    } else {
      // Sales/viewer: only themselves
      users = await User.find({ _id: uid }).select("-password");
      users = users.map(function(u){ var obj = u.toObject(); if(!obj.qTargets) obj.qTargets = {}; return obj; });
    }

    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/users", auth, adminOnly, async function(req, res) {
  try {
    var hashed = await bcrypt.hash(req.body.password || "sales123", 10);
    var teamId = req.body.teamId || "";
    var teamName = req.body.teamName || "";
    var monthlyTarget = req.body.monthlyTarget ? Number(req.body.monthlyTarget) : 15;
    
    // Auto-set reportsTo: find manager with same teamId
    var reportsTo = req.body.reportsTo || null;
    if(!reportsTo && teamId) {
      var manager = await User.findOne({ role: "manager", teamId: teamId, active: true });
      if(manager) reportsTo = manager._id;
    }

    var user = await User.create({
      name: req.body.name,
      username: req.body.username,
      password: hashed,
      email: req.body.email || "",
      phone: req.body.phone || "",
      role: req.body.role || "sales",
      title: req.body.title || "",
      active: true,
      teamId: teamId,
      teamName: teamName,
      monthlyTarget: monthlyTarget,
      reportsTo: reportsTo,
    });
    var obj = user.toObject();
    delete obj.password;
    emitUser(obj);
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/users/:id", auth, adminOnly, async function(req, res) {
  try {
    var update = {};
    if (req.body.name) update.name = req.body.name;
    if (req.body.email) update.email = req.body.email;
    if (req.body.phone) update.phone = req.body.phone;
    if (req.body.role) update.role = req.body.role;
    if (req.body.title) update.title = req.body.title;
    if (req.body.active !== undefined) update.active = req.body.active;
    if (req.body.monthlyTarget !== undefined) update.monthlyTarget = Number(req.body.monthlyTarget);
    if (req.body.password) update.password = await bcrypt.hash(req.body.password, 10);
    if (req.body.qTargets !== undefined) update["qTargets"] = req.body.qTargets;
    if (req.body.reportsTo !== undefined) update.reportsTo = req.body.reportsTo || null;
    if (req.body.teamId !== undefined) update.teamId = req.body.teamId;
    if (req.body.teamName !== undefined) update.teamName = req.body.teamName;
    var user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, strict: false }).select("-password");
    emitUser(user);
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/users/:id", auth, adminOnly, async function(req, res) {
  try {
    var deletedUser = await User.findByIdAndDelete(req.params.id);
    emitUserDeleted(deletedUser);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Returns [userId, ...all users who report up to them, recursively].
// Used by any endpoint that needs "self + everyone under me" visibility.
// Guards: max 10 BFS iterations + seen-set so any reportsTo cycle
// (self-loop or A->B->A) can't spin forever. If the reportsTo graph is
// empty for this user, fall back to teamId membership so legacy users
// with no hierarchy wiring still get a sensible team scope.
async function visibleAgentIds(userId) {
  var u = await User.findById(userId).lean();
  if (!u) return [userId];
  var ids = [u._id];
  var seen = {}; seen[String(u._id)] = true;
  var frontier = [u._id];
  for (var depth = 0; depth < 10 && frontier.length > 0; depth++) {
    var next = await User.find({ reportsTo: { $in: frontier } }).lean();
    var fresh = [];
    next.forEach(function(n){
      var k = String(n._id);
      if (!seen[k]) { seen[k] = true; ids.push(n._id); fresh.push(n._id); }
    });
    if (fresh.length === 0) break;
    frontier = fresh;
  }
  // Legacy fallback: no one reports to this user AND they have a teamId —
  // pull every active member of that team so their dashboard isn't empty.
  if (ids.length === 1 && u.teamId) {
    var teamMembers = await User.find({ teamId: u.teamId }).lean();
    teamMembers.forEach(function(m){
      var k = String(m._id);
      if (!seen[k]) { seen[k] = true; ids.push(m._id); }
    });
  }
  return ids;
}

// ===== LEAD ROUTES =====
app.get("/api/leads", auth, async function(req, res) {
  try {
    var query = {};
    var role = req.user.role;
    var uid = req.user.id;

    if (role === "sales") {
      // Match by per-agent assignments[] slice, NOT the top-level agentId.
      // After a rotation the top-level agentId moves to the new owner, so
      // filtering on it would hide the lead from the previous agent. Matching
      // on assignments.agentId keeps the lead visible to every agent who has
      // (or ever had) an entry — each sees only their own slice via the
      // overlay below. Unassigned leads (no entries) are naturally excluded.
      query["assignments.agentId"] = new mongoose.Types.ObjectId(uid);

    } else if (role === "team_leader" || role === "manager" || role === "director") {
      var ids = await visibleAgentIds(uid);
      query.agentId = { $in: ids };
    }
    // admin / sales_admin: no filter

    // Pagination
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 1000;
    var skip = (page - 1) * limit;

    var total = await Lead.countDocuments(query);
    var leads = await Lead.find(query).populate("agentId", "name title teamId reportsTo").populate("assignments.agentId", "name title").sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    // For sales agents: overlay their own assignments[] entry, then strip every
    // trace of other agents (history, prior assignments, rotation counters).
    // After a rotation the current owner is someone else — but the old agent
    // must still see the lead "exactly as before". We rewrite obj.agentId to
    // point at their own assignment so they never learn the lead was rotated.
    var data = leads;
    if (role === "sales") {
      // Return ONLY the caller's own assignments[] slice. Feedback, notes,
      // status, callbackTime, budget all come from the caller's per-agent
      // entry — never from top-level lead fields (which may hold another
      // agent's text) and never from another agent's slice.
      //
      // Top-level notes/lastFeedback are wiped unconditionally even when the
      // caller has no assignments[] entry (defence in depth: the list query
      // already guarantees a matching slice, but if a data-inconsistency
      // produces a match without an entry, we must still not leak).
      data = leads.map(function(l) {
        var obj = Object.assign({}, l);
        var myAssign = (obj.assignments || []).find(function(a) {
          var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
          return String(aid) === String(uid);
        });
        // Unconditionally clear top-level per-agent text fields before overlay.
        obj.notes = "";
        obj.lastFeedback = "";
        if (myAssign) {
          var assignStatus = myAssign.status === "New Lead" ? "NewLead" : myAssign.status;
          obj.status = assignStatus || obj.status;
          obj.notes = myAssign.notes !== undefined ? myAssign.notes : "";
          obj.budget = myAssign.budget !== undefined ? myAssign.budget : obj.budget;
          obj.callbackTime = myAssign.callbackTime !== undefined ? myAssign.callbackTime : obj.callbackTime;
          obj.lastFeedback = myAssign.lastFeedback !== undefined ? myAssign.lastFeedback : "";
          obj.nextCallAt = myAssign.nextCallAt !== undefined ? myAssign.nextCallAt : obj.nextCallAt;
          if (myAssign.lastActionAt) obj.lastActivityTime = myAssign.lastActionAt;
          if (myAssign.assignedAt) obj.assignedAt = myAssign.assignedAt;
          // After rotation the top-level agentId points to the NEW owner; the
          // old agent must see themselves as the owner to keep the view clean.
          obj.agentId = myAssign.agentId;
        }
        // Strip every other agent's data + rotation metadata.
        obj.agentHistory = (myAssign && myAssign.agentHistory && myAssign.agentHistory.length > 0) ? myAssign.agentHistory : [];
        obj.assignments = myAssign ? [myAssign] : [];
        obj.previousAgentIds = [];
        obj.rotationCount = 0;
        obj.lastRotationAt = null;
        return obj;
      });
    } else {
      // Admin / manager / team_leader: top-level notes & lastFeedback are no longer
      // written (per-agent only), so overlay them on-read from the CURRENT owner's
      // assignment slice. This keeps list-view columns populated without granting
      // writes to the defunct top-level fields.
      data = leads.map(function(l) {
        var obj = Object.assign({}, l);
        var holderId = obj.agentId && obj.agentId._id ? obj.agentId._id : obj.agentId;
        if (!holderId) return obj;
        var holderAssign = (obj.assignments || []).find(function(a) {
          var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
          return String(aid) === String(holderId);
        });
        if (holderAssign) {
          if (holderAssign.notes) obj.notes = holderAssign.notes;
          if (holderAssign.lastFeedback) obj.lastFeedback = holderAssign.lastFeedback;
        }
        return obj;
      });
    }

    res.json({
      data: data,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== UNTOUCHED LEADS =====
// Admin dashboard "Untouched Leads" card. Must be registered BEFORE
// /api/leads/:id or Express will route "/api/leads/untouched" into the
// :id handler (and Lead.findById("untouched") returns 404).
//
// A lead is "untouched" when:
//   - agentId is set (someone owns it)
//   - last history entry is older than 24h, OR history only carries the
//     initial created/first_assigned entry with no follow-up action
// Archived leads are excluded. Sorted by longest-idle first, capped at 50.
app.get("/api/leads/untouched", auth, adminOnly, async function(req, res) {
  try {
    var DAY = 24 * 60 * 60 * 1000;
    var now = Date.now();
    var leads = await Lead.find({ agentId: { $ne: null }, archived: { $ne: true } })
      .populate("agentId", "name")
      .lean();
    var out = [];
    leads.forEach(function(l) {
      var hist = Array.isArray(l.history) ? l.history : [];
      // Follow-up = anything that isn't the initial "created" / "first_assigned"
      // stamp. Reassignments count as activity too — the status log / feedback
      // log still drives the dashboard, but reassign is a deliberate action.
      var hasFollowUp = hist.some(function(h) {
        if (!h || !h.event) return false;
        var e = String(h.event).toLowerCase();
        return e !== "created" && e !== "first_assigned";
      });
      // Latest timestamp across history + lead.lastActivityTime. Falls back to
      // createdAt so brand-new leads without any history still anchor somewhere.
      var latest = 0;
      hist.forEach(function(h) {
        var t = h && h.timestamp ? new Date(h.timestamp).getTime() : 0;
        if (t > latest) latest = t;
      });
      if (l.lastActivityTime) {
        var la = new Date(l.lastActivityTime).getTime();
        if (la > latest) latest = la;
      }
      if (!latest && l.createdAt) latest = new Date(l.createdAt).getTime();
      if (!latest) return;
      var idleMs = now - latest;
      // Untouched gate: no follow-up action AND idle for more than 24h.
      // (A lead with a follow-up entry within the last 24h is "live".)
      if (hasFollowUp && idleMs <= DAY) return;
      if (idleMs <= DAY) return;
      out.push({
        _id: l._id,
        name: l.name,
        phone: l.phone,
        agentId: l.agentId && l.agentId._id ? l.agentId._id : l.agentId,
        agentName: (l.agentId && l.agentId.name) ? l.agentId.name : "",
        lastActivityAt: new Date(latest),
        hoursSinceActivity: Math.floor(idleMs / (60 * 60 * 1000)),
        assignedOnly: !hasFollowUp
      });
    });
    out.sort(function(a, b) { return new Date(a.lastActivityAt) - new Date(b.lastActivityAt); });
    res.json(out.slice(0, 50));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== SINGLE LEAD GET (with per-agent overlay) =====
app.get("/api/leads/:id", auth, async function(req, res) {
  try {
    var lead = await Lead.findById(req.params.id).populate("agentId", "name title teamId reportsTo").populate("assignments.agentId", "name title").lean();
    if (!lead) return res.status(404).json({ error: "Not found" });
    var role = req.user.role;
    var uid = String(req.user.id);
    if (role === "sales") {
      // Access is granted by presence of an assignments[] entry for the caller,
      // NOT by top-level agentId (which moves to the new owner on rotation).
      // This keeps the lead reachable for the previous agent while still
      // blocking anyone who has never held it.
      var obj = Object.assign({}, lead);
      var myAssign = (obj.assignments || []).find(function(a) {
        var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
        return String(aid) === uid;
      });
      if (!myAssign) return res.status(404).json({ error: "Not found" });

      // Wipe top-level per-agent text unconditionally before the overlay so
      // another agent's notes / feedback can never leak through a stale
      // top-level value.
      obj.notes = "";
      obj.lastFeedback = "";

      var assignStatus = myAssign.status === "New Lead" ? "NewLead" : myAssign.status;
      obj.status = assignStatus || obj.status;
      obj.notes = myAssign.notes !== undefined ? myAssign.notes : "";
      obj.budget = myAssign.budget !== undefined ? myAssign.budget : obj.budget;
      obj.callbackTime = myAssign.callbackTime !== undefined ? myAssign.callbackTime : obj.callbackTime;
      obj.lastFeedback = myAssign.lastFeedback !== undefined ? myAssign.lastFeedback : "";
      obj.nextCallAt = myAssign.nextCallAt !== undefined ? myAssign.nextCallAt : obj.nextCallAt;
      if (myAssign.lastActionAt) obj.lastActivityTime = myAssign.lastActionAt;
      if (myAssign.assignedAt) obj.assignedAt = myAssign.assignedAt;
      // Rewrite agentId so the old agent sees themselves as the owner even
      // after rotation — never exposes the new owner's identity.
      obj.agentId = myAssign.agentId;

      // Strip every other agent's data + rotation metadata.
      obj.agentHistory = (myAssign.agentHistory && myAssign.agentHistory.length > 0) ? myAssign.agentHistory : [];
      obj.assignments = [myAssign];
      obj.previousAgentIds = [];
      obj.rotationCount = 0;
      obj.lastRotationAt = null;
      return res.json(obj);
    }
    // Admin / manager / team_leader: overlay top-level notes & lastFeedback
    // from the current owner's assignment slice (top-level is no longer written).
    var adminObj = Object.assign({}, lead);
    var adminHolderId = adminObj.agentId && adminObj.agentId._id ? adminObj.agentId._id : adminObj.agentId;
    if (adminHolderId) {
      var adminHolderAssign = (adminObj.assignments || []).find(function(a) {
        var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
        return String(aid) === String(adminHolderId);
      });
      if (adminHolderAssign) {
        if (adminHolderAssign.notes) adminObj.notes = adminHolderAssign.notes;
        if (adminHolderAssign.lastFeedback) adminObj.lastFeedback = adminHolderAssign.lastFeedback;
      }
    }
    res.json(adminObj);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== CHECK DUPLICATE PHONE =====
app.get("/api/leads/check-duplicate/:phone", auth, async function(req, res) {
  try {
    var phone = decodeURIComponent(req.params.phone);
    var dupQuery = { $or: [{ phone: phone }, { phone2: phone }], archived: false };
    if (req.user.role === "sales") {
      // Match the visibility rule used by GET /api/leads: sales can only learn
      // about duplicates on leads they hold or have previously held, by looking
      // inside assignments[] rather than the top-level agentId.
      dupQuery["assignments.agentId"] = new mongoose.Types.ObjectId(req.user.id);
    }
    var lead = await Lead.findOne(dupQuery).populate("agentId", "name title");
    if (lead) res.json({ exists: true, lead: lead });
    else res.json({ exists: false });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== ADD LEAD =====
app.post("/api/leads", auth, async function(req, res) {
  try {
    console.log("NEW LEAD body:", JSON.stringify(req.body));
    // Admin / sales_admin / manager / team_leader / integration keys may leave
    // agentId empty — those leads stay unassigned until an admin routes them.
    //
    // Sales, team_leader, manager users creating a lead through the app do NOT
    // get a UI control to pick an agent, so the payload's agentId is always "".
    // Without a default, their new lead would save unassigned and vanish from
    // their own list on the next refresh (the sales visibility filter hides
    // anything whose current agentId is not their own user id). Default to the
    // caller so the lead they just created stays in their list.
    // Normalize agentId — frontend may send empty string (unassigned), a
    // populated {_id, name, ...} object (when editing, though this path is
    // create-only), or a plain id string.
    var normalizedAgent = normId(req.body.agentId);
    var agentId = normalizedAgent ? new mongoose.Types.ObjectId(normalizedAgent) : null;
    if (!agentId && (req.user.role === "sales" || req.user.role === "team_leader" || req.user.role === "manager") && mongoose.Types.ObjectId.isValid(req.user.id)) {
      agentId = new mongoose.Types.ObjectId(req.user.id);
    }
    if (agentId) {
      var targetOnCreate = await User.findById(agentId).lean();
      if (!targetOnCreate) return res.status(400).json({ error: "Target agent not found" });
      if (targetOnCreate.active === false) return res.status(400).json({ error: "Target agent is inactive" });
      if (["sales","team_leader","manager"].indexOf(targetOnCreate.role) < 0) {
        return res.status(400).json({ error: "ineligible_role", message: "Target agent role ("+targetOnCreate.role+") cannot be assigned leads" });
      }
    }
    // Duplicate phone guard — covers manual entry, Google Sheets, and Make.com integrations.
    // All three hit this endpoint, so one check here satisfies every creation path.
    var phoneIn = String(req.body.phone || "").trim();
    if (!phoneIn) return res.status(400).json({ error: "Phone is required", code: "phone_required" });
    var dup = await findLeadByPhone(phoneIn);
    if (dup) {
      var dupAgentName = (dup.agentId && dup.agentId.name) ? dup.agentId.name : "Unassigned";
      return res.status(409).json({
        error: "Phone " + phoneIn + " already exists (owned by " + dupAgentName + ")",
        code: "duplicate_phone",
        existingLeadId: String(dup._id)
      });
    }
    // Also block if phone2 is supplied and clashes with an existing lead.
    var phone2In = String(req.body.phone2 || "").trim();
    if (phone2In) {
      var dup2 = await findLeadByPhone(phone2In);
      if (dup2) {
        return res.status(409).json({
          error: "Phone2 " + phone2In + " already exists in the system",
          code: "duplicate_phone",
          existingLeadId: String(dup2._id)
        });
      }
    }
    var initialStatus = req.body.status || "NewLead";
    var stampsMeeting = initialStatus === "MeetingDone";
    var lead = await Lead.create({
      name:             req.body.name,
      phone:            req.body.phone,
      phone2:           req.body.phone2 || "",
      email:            req.body.email || "",
      status:           initialStatus,
      hadMeeting:       stampsMeeting,
      meetingDoneAt:    stampsMeeting ? new Date() : null,
      source:           req.body.source || "Facebook",
      project:          req.body.project || "",
      campaign:         req.body.campaign || "",
      agentId:          agentId,
      budget:           req.body.budget || "",
      notes:            req.body.notes || "",
      callbackTime:     req.body.callbackTime || "",
      dealDate:         req.body.dealDate || "",
      downPaymentPct:   req.body.downPaymentPct || "",
      installmentYears: req.body.installmentYears || "",
      lastActivityTime: new Date(),
      archived:         false,
      isVIP:            false,
      eoiDeposit:       req.body.eoiDeposit || "",
      eoiDate:          req.body.eoiDate || "",
      assignments:      agentId ? [{ agentId: agentId, status: req.body.status || "New Lead", assignedAt: new Date(), lastActionAt: new Date(), rotationTimer: new Date(), noRotation: false, notes: req.body.notes || "", budget: req.body.budget || "", callbackTime: req.body.callbackTime || "", lastFeedback: "", nextCallAt: null, agentHistory: [] }] : [],
      expiresAt:        new Date(Date.now() + 30*24*60*60*1000),
      globalStatus:     "active",
    });
    console.log("SAVED phone2:", lead.phone2);
    // Admin audit timeline — the VERY FIRST entry on every lead captures who
    // created/distributed it from the start. One combined entry (not two)
    // with event "first_assigned" if an agent was attached, or "created" if
    // the lead entered unassigned. Stamped with lead.createdAt so it always
    // sorts first in the timeline.
    var creatorName = (req.user && req.user.name) ? req.user.name : (req.user && req.user.role === "admin" ? "Admin" : "System");
    var firstAgentName = (agentId && targetOnCreate && targetOnCreate.name) ? targetOnCreate.name : "";
    var initEvent = agentId ? "first_assigned" : "created";
    var initDesc = agentId
      ? "Lead added by " + creatorName + " and assigned to " + (firstAgentName || "agent") + (req.body.source ? " (source: " + req.body.source + ")" : "")
      : "Lead added by " + creatorName + " — No Agent" + (req.body.source ? " (source: " + req.body.source + ")" : "");
    var initEntry = historyEntry(initEvent, initDesc, creatorName, firstAgentName || "No Agent");
    // Pin to the lead's created timestamp so nothing can sort before it.
    initEntry.timestamp = lead.createdAt || new Date();
    await pushHistory(lead._id, initEntry);
    lead = await Lead.findById(lead._id).populate("agentId", "name title").populate("assignments.agentId", "name title");
    res.json(lead);
  } catch (e) {
    console.error("POST /api/leads error:", e.message);
    // Mongo duplicate-key (E11000) — unique phone index caught a race we missed.
    // Translate to the same 409 contract the pre-insert guard uses.
    if (e && (e.code === 11000 || String(e.message || "").indexOf("E11000") !== -1)) {
      return res.status(409).json({
        error: "Phone already exists",
        code: "duplicate_phone"
      });
    }
    res.status(500).json({ error: e.message });
  }
});

// ===== BULK REASSIGN (must be before /:id) =====
app.put("/api/leads/bulk-reassign", auth, adminOnly, async function(req, res) {
  try {
    var { leadIds, agentId } = req.body;
    if(!leadIds||!leadIds.length||!agentId) return res.status(400).json({ error: "leadIds and agentId required" });
    var agentObjId = new mongoose.Types.ObjectId(agentId);
    var newAssignment = {
      agentId: agentObjId,
      status: "NewLead",
      assignedAt: new Date(),
      lastActionAt: new Date(),
      rotationTimer: new Date(),
      noRotation: false,
      notes: "",
      budget: "",
      callbackTime: "",
      lastFeedback: "",
      nextCallAt: null,
      agentHistory: []
    };
    // Update top-level fields AND push new assignments entry
    for (var i = 0; i < leadIds.length; i++) {
      var lead = await Lead.findById(leadIds[i]).lean();
      if (!lead) continue;
      var oldAgentId = lead.agentId;
      var updateOps = {
        // Top-level notes/lastFeedback are no longer authoritative — the new agent's
        // clean slice comes from a fresh assignments[] entry (see newAssignment), and
        // the old agent's slice is preserved so their feedback survives rotation.
        $set: { agentId: agentObjId, lastActivityTime: new Date(), lastRotationAt: new Date(), rotationCount: (lead.rotationCount || 0) + 1 },
        $push: { assignments: newAssignment }
      };
      // Add old agent to previousAgentIds and log rotation event
      var oldAgentName = "";
      var newAgentName = "";
      if (oldAgentId) {
        updateOps.$push.previousAgentIds = oldAgentId;
        var oldAgUser = await User.findById(oldAgentId).lean();
        var newAgUser = await User.findById(agentId).lean();
        oldAgentName = oldAgUser ? oldAgUser.name : "Unknown";
        newAgentName = newAgUser ? newAgUser.name : "Unknown";
        updateOps.$push.agentHistory = {
          action: "Rotation",
          fromAgent: oldAgentName,
          toAgent: newAgentName,
          reason: "manual",
          by: req.user.name || "Admin",
          date: new Date()
        };
      } else {
        var newAgUser2 = await User.findById(agentId).lean();
        newAgentName = newAgUser2 ? newAgUser2.name : "Unknown";
      }
      await Lead.findByIdAndUpdate(leadIds[i], updateOps);
      // Admin timeline: one entry per lead so bulk ops are audit-able.
      var byName = req.user.name || "Admin";
      if (oldAgentId) {
        await pushHistory(leadIds[i], historyEntry(
          "rotated",
          "Rotated from " + oldAgentName + " to " + newAgentName + " by " + byName + " (bulk reassign)",
          byName,
          newAgentName
        ));
      } else {
        await pushHistory(leadIds[i], historyEntry(
          "assigned",
          "Assigned to " + newAgentName + " by " + byName + " (bulk)",
          byName,
          newAgentName
        ));
      }
    }
    await Activity.create({ userId: req.user.id, type: "reassign", note: "Bulk reassign — " + leadIds.length + " leads" });
    res.json({ ok: true, count: leadIds.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== UPDATE LEAD =====
// ===== IMAGE UPLOAD (base64) =====
app.post("/api/leads/:id/upload-image", auth, leadUploadImageValidation, async function(req, res) {
  try {
    var { imageData, imageType } = req.body; // imageType: "eoi" or "deal"
    if (!imageData) return res.status(400).json({ error: "No image data" });
    if (imageType === "deal") {
      var lead = await Lead.findByIdAndUpdate(req.params.id, { $push: { dealImages: imageData } }, { new: true }).populate("agentId", "name title");
      return res.json(lead);
    }
    var field = "eoiImage";
    var update = {}; update[field] = imageData;
    var lead = await Lead.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).populate("agentId", "name title");
    res.json(lead);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== EOI DOCUMENTS (images + PDFs) =====
app.post("/api/leads/:id/eoi-documents", auth, async function(req, res) {
  try {
    var raw = (req.body && req.body.fileData) || "";
    var fileName = (req.body && req.body.fileName) ? String(req.body.fileName).slice(0,200) : "";
    if (!raw || typeof raw !== "string") return res.status(400).json({ error: "fileData is required" });
    var m = raw.match(/^data:(application\/pdf|image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
    if (!m) return res.status(400).json({ error: "Only PDF/JPEG/PNG/WEBP data URLs allowed" });
    var buf;
    try { buf = Buffer.from(m[2], "base64"); } catch(e){ return res.status(400).json({ error: "Invalid base64 data" }); }
    if (!buf || !buf.length) return res.status(400).json({ error: "Invalid file data" });
    if (buf.length > 6 * 1024 * 1024) return res.status(400).json({ error: "File too large (max 6MB)" });
    if (!fileName) {
      // Derive a simple name from the MIME + short hash
      var ext = m[1]==="application/pdf" ? "pdf" : (m[1].split("/")[1]||"bin");
      fileName = "document-"+Date.now()+"."+ext;
    }
    var entry = { url: raw, name: fileName, uploadedAt: new Date() };
    var lead = await Lead.findByIdAndUpdate(req.params.id, { $push: { eoiDocuments: entry } }, { new: true }).populate("agentId", "name title");
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/leads/:id/delete-eoi-document", auth, async function(req, res) {
  try {
    var index = req.body && Number(req.body.index);
    var lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    var docs = lead.eoiDocuments || [];
    if (!(index >= 0 && index < docs.length)) return res.status(400).json({ error: "Invalid index" });
    docs.splice(index, 1);
    lead.eoiDocuments = docs;
    await lead.save();
    var populated = await Lead.findById(req.params.id).populate("agentId", "name title");
    res.json(populated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== DELETE DEAL IMAGE =====
app.post("/api/leads/:id/delete-deal-image", auth, async function(req, res) {
  try {
    var { index } = req.body;
    var lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    var imgs = lead.dealImages || [];
    if (index < 0 || index >= imgs.length) return res.status(400).json({ error: "Invalid index" });
    imgs.splice(index, 1);
    lead.dealImages = imgs;
    await lead.save();
    var populated = await Lead.findById(req.params.id).populate("agentId", "name title");
    res.json(populated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== EOI CANCEL (admin) — restores pre-EOI status on the lead, keeps record visible under EOI Deal Cancelled =====
app.post("/api/leads/:id/eoi-cancel", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Only admin can cancel an EOI" });
    var existing = await Lead.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Lead not found" });
    // Rule: any cancel returns the lead to HotCase — preEoiStatus is ignored.
    var restored = "HotCase";
    var update = { status: restored, eoiStatus: "EOI Cancelled", eoiApproved: false, preEoiStatus: "", globalStatus: "active", lastActivityTime: new Date() };
    await Lead.findByIdAndUpdate(req.params.id, { $set: update });
    // Also sync the current agent's assignment.status so per-agent views reflect the restored state
    await Lead.updateOne(
      { _id: req.params.id, "assignments.agentId": existing.agentId },
      { $set: { "assignments.$.status": restored, "assignments.$.lastActionAt": new Date() } }
    );
    // Mirror back to the originating Daily Request (if any)
    if (existing.source === "Daily Request" && existing.phone) {
      try { await DailyRequest.updateOne({ phone: existing.phone }, { $set: { status: restored, eoiStatus: "EOI Cancelled", eoiApproved: false, preEoiStatus: "", lastActivityTime: new Date() } }); }
      catch(syncErr){ console.error("DR sync (eoi-cancel) error:", syncErr.message); }
    }
    try { await Activity.create({ userId: req.user.id, leadId: req.params.id, type: "status_change", note: "[HotCase] EOI cancelled — returned to Hot Case" }); } catch(e){}
    var lead = await Lead.findById(req.params.id).populate("agentId", "name title").populate("assignments.agentId", "name title");
    res.json(lead);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/daily-requests/:id/eoi-cancel", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Only admin can cancel an EOI" });
    var existing = await DailyRequest.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Daily Request not found" });
    // Rule: any cancel returns the DR to HotCase — preEoiStatus is ignored.
    var restored = "HotCase";
    var update = { status: restored, eoiStatus: "EOI Cancelled", eoiApproved: false, preEoiStatus: "", lastActivityTime: new Date() };
    var r = await DailyRequest.findByIdAndUpdate(req.params.id, update, { new: true }).populate("agentId", "name title");
    // Mirror the paired Lead record too so the EOI page still sees it under EOI Cancelled
    if (existing.phone) {
      try {
        var mirror = await Lead.findOne({ phone: existing.phone, source: "Daily Request" });
        if (mirror) {
          await Lead.findByIdAndUpdate(mirror._id, { status: restored, eoiStatus: "EOI Cancelled", eoiApproved: false, preEoiStatus: "", lastActivityTime: new Date() });
        }
      } catch(syncErr){ console.error("Lead mirror (eoi-cancel) error:", syncErr.message); }
    }
    try { await Activity.create({ userId: req.user.id, leadId: r._id, type: "status_change", note: "[HotCase] DR EOI cancelled — returned to Hot Case", clientName: r.name || "", clientPhone: r.phone || "" }); } catch(e){}
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== EOI -> DONE DEAL (admin) — converts an approved EOI to a Done Deal =====
app.post("/api/leads/:id/eoi-to-deal", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin" && req.user.role !== "sales") return res.status(403).json({ error: "Only admin or sales can convert an EOI to a deal" });
    var existing = await Lead.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Lead not found" });
    if (existing.eoiStatus !== "Approved") return res.status(400).json({ error: "EOI must be Approved before it can be converted to a Done Deal" });
    var todayIso = new Date().toISOString().slice(0,10);
    var update = {
      status: "DoneDeal",
      dealDate: existing.dealDate || todayIso,
      dealStatus: "",
      preDealStatus: existing.status || "EOI",
      // Clear eoiStatus so the record no longer shows in any EOI tab — it belongs to Deals now.
      eoiStatus: "",
      globalStatus: "donedeal",
      lastActivityTime: new Date()
    };
    await Lead.findByIdAndUpdate(req.params.id, { $set: update });
    // Sync current agent's assignment.status so per-agent views reflect the new state
    if (existing.agentId) {
      await Lead.updateOne(
        { _id: req.params.id, "assignments.agentId": existing.agentId },
        { $set: { "assignments.$.status": "DoneDeal", "assignments.$.lastActionAt": new Date() } }
      );
    }
    // Mirror to the paired Daily Request (if any)
    if (existing.source === "Daily Request" && existing.phone) {
      try { await DailyRequest.updateOne({ phone: existing.phone }, { $set: { status: "DoneDeal", lastActivityTime: new Date() } }); }
      catch(syncErr){ console.error("DR sync (eoi-to-deal) error:", syncErr.message); }
    }
    try { await Activity.create({ userId: req.user.id, leadId: req.params.id, type: "status_change", note: "[DoneDeal] EOI converted to Done Deal" }); } catch(e){}
    var lead = await Lead.findById(req.params.id).populate("agentId", "name title").populate("assignments.agentId", "name title");
    res.json(lead);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== DEAL CANCEL (admin) — restores pre-DoneDeal status, keeps lead in Deals page's Deal Cancelled tab =====
app.post("/api/leads/:id/deal-cancel", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Only admin can cancel a deal" });
    var existing = await Lead.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Lead not found" });
    // Rule: any cancel returns the lead to HotCase — preDealStatus is ignored.
    var restored = "HotCase";
    var update = { status: restored, dealStatus: "Deal Cancelled", dealApproved: false, preDealStatus: "", globalStatus: "active", lastActivityTime: new Date() };
    await Lead.findByIdAndUpdate(req.params.id, { $set: update });
    // Sync current agent's assignment.status
    await Lead.updateOne(
      { _id: req.params.id, "assignments.agentId": existing.agentId },
      { $set: { "assignments.$.status": restored, "assignments.$.lastActionAt": new Date() } }
    );
    // Mirror back to the originating Daily Request (if any)
    if (existing.source === "Daily Request" && existing.phone) {
      try { await DailyRequest.updateOne({ phone: existing.phone }, { $set: { status: restored, dealStatus: "Deal Cancelled", preDealStatus: "", lastActivityTime: new Date() } }); }
      catch(syncErr){ console.error("DR sync (deal-cancel) error:", syncErr.message); }
    }
    try { await Activity.create({ userId: req.user.id, leadId: req.params.id, type: "status_change", note: "[HotCase] Deal cancelled — returned to Hot Case" }); } catch(e){}
    var lead = await Lead.findById(req.params.id).populate("agentId", "name title").populate("assignments.agentId", "name title");
    res.json(lead);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/daily-requests/:id/deal-cancel", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Only admin can cancel a deal" });
    var existing = await DailyRequest.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: "Daily Request not found" });
    // Rule: any cancel returns the DR to HotCase — preDealStatus is ignored.
    var restored = "HotCase";
    var update = { status: restored, dealStatus: "Deal Cancelled", preDealStatus: "", lastActivityTime: new Date() };
    var r = await DailyRequest.findByIdAndUpdate(req.params.id, update, { new: true }).populate("agentId", "name title");
    if (existing.phone) {
      try {
        var mirror = await Lead.findOne({ phone: existing.phone, source: "Daily Request" });
        if (mirror) {
          await Lead.findByIdAndUpdate(mirror._id, { status: restored, dealStatus: "Deal Cancelled", dealApproved: false, preDealStatus: "", lastActivityTime: new Date() });
        }
      } catch(syncErr){ console.error("Lead mirror (deal-cancel) error:", syncErr.message); }
    }
    try { await Activity.create({ userId: req.user.id, leadId: r._id, type: "status_change", note: "[HotCase] DR deal cancelled — returned to Hot Case", clientName: r.name || "", clientPhone: r.phone || "" }); } catch(e){}
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/leads/:id", auth, async function(req, res) {
  try {
    // Admin-only gate: "Deal Cancelled" can only be set by admin users.
    if (req.body.status === "Deal Cancelled" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can set Deal Cancelled status" });
    }
    // Normalize ObjectId fields the frontend may have sent as populated
    // objects (happens on edit — p.initial is the lead with populated agentId)
    // or empty strings. Prevents CastError on findByIdAndUpdate and prevents
    // the String(object) !== String(id) false-positive reassignment below.
    req.body.agentId       = normId(req.body.agentId);
    req.body.splitAgent2Id = normId(req.body.splitAgent2Id);
    var update = Object.assign({}, req.body, { lastActivityTime: new Date() });
    // Never overwrite agentId with null/empty unless explicitly reassigning
    if (!update.agentId) delete update.agentId;
    // Protect array fields from being overwritten via $set — these are append-only
    delete update.agentHistory;
    delete update.assignments;
    delete update.previousAgentIds;
    // Per-agent data: notes and lastFeedback live in assignments[] only — never on
    // the top-level lead. This keeps an agent's own feedback intact regardless of
    // what other agents do on the same lead (requirement: feedback always visible
    // to the agent who wrote it).
    delete update.notes;
    delete update.lastFeedback;
    // Load the existing lead if any tracked field could change — needed both
    // for status/rotation logic AND to log accurate admin audit entries.
    var oldLead = null;
    var trackedBody = req.body.agentId || req.body.status || req.body.callbackTime !== undefined || req.body.notes !== undefined || req.body.lastFeedback !== undefined;
    if (trackedBody) {
      oldLead = await Lead.findById(req.params.id).lean();
    }
    // Guard: never downgrade EOI or DoneDeal back to NewLead (prevents stale rotation overwrites)
    if (oldLead && (oldLead.status === "EOI" || oldLead.status === "DoneDeal") && req.body.status === "NewLead") {
      return res.json(oldLead);
    }
    // Capture previous status when transitioning INTO EOI, so EOI cancel can restore it.
    if (req.body.status === "EOI" && oldLead && oldLead.status && oldLead.status !== "EOI") {
      update.preEoiStatus = oldLead.status;
      update.eoiStatus = "Pending";
    }
    // Capture previous status when transitioning INTO DoneDeal, so deal cancel can restore it.
    if (req.body.status === "DoneDeal" && oldLead && oldLead.status && oldLead.status !== "DoneDeal") {
      update.preDealStatus = oldLead.status;
      update.dealStatus = "";
    }
    // Permanent meeting marker. Stamp hadMeeting + meetingDoneAt the first
    // time a lead reaches MeetingDone. Never re-stamp on subsequent visits —
    // the timestamp must preserve the ORIGINAL meeting, and never revert
    // when status later moves elsewhere (e.g. back to HotCase, on to EOI/
    // DoneDeal). Protect against accidental overwrites from the body too.
    delete update.hadMeeting;
    delete update.meetingDoneAt;
    if (req.body.status === "MeetingDone" && oldLead && !oldLead.hadMeeting) {
      update.hadMeeting = true;
      update.meetingDoneAt = new Date();
    }
    // Approve/un-approve toggles from the EOI page — mirror to eoiStatus
    if (req.body.eoiApproved === true) update.eoiStatus = "Approved";
    else if (req.body.eoiApproved === false && oldLead && oldLead.eoiStatus === "Approved") update.eoiStatus = "Pending";
    // Track agent history when agent changes (fallback — should go through /rotate)
    var pushOnReassign = null;
    if (req.body.agentId && oldLead && oldLead.agentId && String(oldLead.agentId) !== String(req.body.agentId)) {
      update.lastRotationAt = new Date();
      update.rotationCount = (oldLead.rotationCount || 0) + 1;
      update.reassignedAt = new Date();
      // Give the NEW agent a fresh assignments[] entry (empty notes / feedback)
      // so they see a clean lead. The OLD agent's entry is left untouched —
      // their feedback and history survive the reassignment verbatim.
      pushOnReassign = {
        assignments: {
          agentId: new mongoose.Types.ObjectId(req.body.agentId),
          status: "NewLead",
          assignedAt: new Date(),
          lastActionAt: new Date(),
          rotationTimer: new Date(),
          noRotation: false,
          notes: "",
          budget: "",
          callbackTime: "",
          lastFeedback: "",
          nextCallAt: null,
          agentHistory: []
        }
      };
      if (oldLead.agentId) pushOnReassign.previousAgentIds = oldLead.agentId;
    }
    var writeOps = { $set: update };
    if (pushOnReassign) writeOps.$push = pushOnReassign;
    await Lead.findByIdAndUpdate(req.params.id, writeOps);
    // Sync agent's own assignments[] entry on any action
    if (req.user.role === "sales" || req.user.role === "team_leader") {
      var assignUpdate = { "assignments.$.lastActionAt": new Date(), "assignments.$.rotationTimer": new Date() };
      if (req.body.status) assignUpdate["assignments.$.status"] = req.body.status;
      if (req.body.notes !== undefined) assignUpdate["assignments.$.notes"] = req.body.notes;
      if (req.body.budget !== undefined) assignUpdate["assignments.$.budget"] = req.body.budget;
      if (req.body.callbackTime !== undefined) assignUpdate["assignments.$.callbackTime"] = req.body.callbackTime;
      if (req.body.lastFeedback !== undefined) assignUpdate["assignments.$.lastFeedback"] = req.body.lastFeedback;
      if (req.body.noRotation !== undefined) assignUpdate["assignments.$.noRotation"] = req.body.noRotation;
      var assignOps = { $set: assignUpdate };
      // Append to per-agent agentHistory on status change or note
      if (req.body.status || req.body.notes || req.body.lastFeedback) {
        var histNote = {};
        if (req.body.status) histNote.type = "status_change";
        else if (req.body.notes) histNote.type = "note";
        else histNote.type = "feedback";
        histNote.note = req.body.status ? "Status: " + req.body.status : (req.body.notes || req.body.lastFeedback || "");
        histNote.createdAt = new Date();
        assignOps.$push = { "assignments.$.agentHistory": histNote };
      }
      await Lead.updateOne({ _id: req.params.id, "assignments.agentId": new mongoose.Types.ObjectId(req.user.id) }, assignOps);
    }
    // Single final read with populate
    var lead = await Lead.findById(req.params.id).populate("agentId", "name title").populate("assignments.agentId", "name title");
    // Admin audit timeline — translate the just-applied diff into one or more
    // history entries so admin can reconstruct exactly what happened.
    try {
      var byName = (req.user && req.user.name) ? req.user.name : (req.user && req.user.role === "admin" ? "Admin" : "System");
      var histBatch = [];
      if (req.body.agentId && oldLead && String(oldLead.agentId||"") !== String(req.body.agentId)) {
        var oldAgentDoc = oldLead.agentId ? await User.findById(oldLead.agentId).lean() : null;
        var newAgentDoc = await User.findById(req.body.agentId).lean();
        var fromName = oldAgentDoc ? oldAgentDoc.name : "Unassigned";
        var toName = newAgentDoc ? newAgentDoc.name : "Unknown";
        if (oldLead.agentId) {
          histBatch.push(historyEntry(
            "rotated",
            "Rotated from " + fromName + " to " + toName + " by " + byName,
            byName,
            toName
          ));
        } else {
          histBatch.push(historyEntry(
            "assigned",
            "Assigned to " + toName + " by " + byName,
            byName,
            toName
          ));
        }
      }
      if (req.body.status && oldLead && req.body.status !== oldLead.status) {
        histBatch.push(historyEntry(
          "status_changed",
          "Status changed " + (oldLead.status || "—") + " → " + req.body.status + " by " + byName,
          byName,
          ""
        ));
      }
      var fb = req.body.lastFeedback;
      if (fb !== undefined && fb !== null && String(fb).trim() !== "" && oldLead && String(oldLead.lastFeedback||"") !== String(fb)) {
        var fbPreview = String(fb).length > 160 ? String(fb).slice(0, 160) + "…" : String(fb);
        histBatch.push(historyEntry(
          "feedback_added",
          "Feedback by " + byName + ": " + fbPreview,
          byName,
          ""
        ));
      }
      if (req.body.callbackTime !== undefined && req.body.callbackTime && oldLead && String(oldLead.callbackTime||"") !== String(req.body.callbackTime)) {
        histBatch.push(historyEntry(
          "callback_scheduled",
          "Callback scheduled for " + String(req.body.callbackTime).replace("T", " ").slice(0, 16) + " by " + byName,
          byName,
          ""
        ));
      }
      if (histBatch.length > 0) await pushHistory(req.params.id, histBatch);
    } catch(histErr) {
      console.error("[history put]", histErr && histErr.message ? histErr.message : histErr);
    }
    try {
      // Only auto-log reassign here. status_change is logged explicitly by the client with agent feedback,
      // and auto-logging it here would produce duplicate activity documents.
      if (req.body.agentId && oldLead && String(oldLead.agentId) !== String(req.body.agentId)) {
        await Activity.create({
          userId: req.user.id,
          leadId: req.params.id,
          type: "reassign",
          note: "\u062a\u0645 \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u064a\u062f\u0648\u064a \u0625\u0644\u0649 \u0645\u0648\u0638\u0641 \u062c\u062f\u064a\u062f",
        });
      }
    } catch(actErr) {
      console.error("Activity log error (non-fatal):", actErr.message);
    }
    // Mirror back to the originating Daily Request when this lead came from there.
    try {
      if (lead && lead.source === "Daily Request" && lead.phone) {
        var drSync = {};
        if (req.body.status !== undefined) drSync.status = req.body.status;
        if (req.body.eoiApproved !== undefined) drSync.eoiApproved = !!req.body.eoiApproved;
        if (req.body.eoiDeposit !== undefined) drSync.eoiDeposit = req.body.eoiDeposit;
        if (req.body.eoiDate !== undefined) drSync.eoiDate = req.body.eoiDate;
        if (Object.keys(drSync).length>0) {
          await DailyRequest.updateOne({ phone: lead.phone }, { $set: Object.assign(drSync, { lastActivityTime: new Date() }) });
        }
      }
    } catch(syncErr) { console.error("DR sync error (non-fatal):", syncErr.message); }
    res.json(lead);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/leads/:id", auth, adminOnly, async function(req, res) {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== REMOVE ASSIGNMENT =====
app.delete("/api/leads/:id/assignment/:agentId", auth, adminOnly, async function(req, res) {
  try {
    var lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (!lead.assignments || lead.assignments.length <= 1) {
      return res.status(400).json({ error: "Cannot remove last assignment" });
    }
    var removeId = req.params.agentId;
    var before = lead.assignments.length;
    lead.assignments = lead.assignments.filter(function(a) { return String(a.agentId) !== String(removeId); });
    if (lead.assignments.length === before) {
      return res.status(404).json({ error: "Assignment not found for this agent" });
    }
    // Remove from previousAgentIds if present
    lead.previousAgentIds = (lead.previousAgentIds || []).filter(function(id) { return String(id) !== String(removeId); });
    // If removed agent was the current agentId, set to most recent remaining
    if (String(lead.agentId) === String(removeId)) {
      var latest = lead.assignments[lead.assignments.length - 1];
      lead.agentId = latest.agentId;
    }
    await lead.save();
    var populated = await Lead.findById(req.params.id).populate("agentId", "name title").populate("assignments.agentId", "name title");
    res.json(populated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== ROTATE LEAD =====
app.post("/api/leads/:id/rotate", auth, async function(req, res) {
  try {
    var { targetAgentId, reason } = req.body;
    if (!targetAgentId) return res.status(400).json({ error: "targetAgentId required" });
    var lead = await Lead.findById(req.params.id).populate("agentId", "name title");
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Business rule: sales_admin is an administrative role and must NEVER receive rotated leads.
    // Only sales / team_leader / manager are eligible; the target must also be active.
    var targetUser = await User.findById(targetAgentId).lean();
    if (!targetUser) return res.status(400).json({ error: "Target agent not found" });
    if (targetUser.active === false) return res.status(400).json({ error: "Target agent is inactive" });
    if (["sales","team_leader","manager"].indexOf(targetUser.role) < 0) {
      return res.status(400).json({ error: "ineligible_role", message: "Target agent role ("+targetUser.role+") cannot receive rotated leads" });
    }

    // ── FIRST ASSIGNMENT (not a rotation) ──
    var isFirstAssignment = !lead.agentId || (!lead.agentId._id && !mongoose.Types.ObjectId.isValid(String(lead.agentId))) || (lead.assignments && lead.assignments.length === 0);
    if (isFirstAssignment) {
      lead.agentId = new mongoose.Types.ObjectId(targetAgentId);
      lead.assignments.push({ agentId: new mongoose.Types.ObjectId(targetAgentId), status: "NewLead", notes: "", budget: "", callbackTime: "", lastFeedback: "", nextCallAt: null, agentHistory: [], assignedAt: new Date(), lastActionAt: new Date(), rotationTimer: new Date(), noRotation: false });
      await lead.save();
      // Admin timeline — first-time assignment.
      var firstByName = (req.user && req.user.name) ? req.user.name : "System";
      var firstToName = (targetUser && targetUser.name) ? targetUser.name : "Unknown";
      await pushHistory(lead._id, historyEntry(
        "assigned",
        "Assigned to " + firstToName + " by " + firstByName,
        firstByName,
        firstToName
      ));
      return res.json({ success: true, firstAssignment: true, lead: lead });
    }

    // ── HARD STOP 0: rotation permanently stopped (3 consecutive Not Interested) ──
    if (lead.rotationStopped === true) {
      return res.status(409).json({ error: "rotation_stopped", message: "Rotation permanently stopped on this lead (3 consecutive Not Interested)" });
    }
    // ── HARD STOP 1: noRotation flag on any assignment ──
    var currentAssignment = (lead.assignments || []).find(function(a) { return String(a.agentId) === String(lead.agentId && lead.agentId._id ? lead.agentId._id : lead.agentId); });
    if (currentAssignment && currentAssignment.noRotation && req.user.role !== "admin" && req.user.role !== "sales_admin") {
      return res.status(400).json({ error: "noRotation", message: "Rotation blocked — noRotation flag set" });
    }
    // ── HARD STOP 2: globalStatus === eoi ──
    if (lead.globalStatus === "eoi") {
      return res.status(400).json({ error: "eoi", message: "Rotation blocked — lead is EOI" });
    }
    // ── HARD STOP 3: globalStatus === donedeal ──
    if (lead.globalStatus === "donedeal") {
      return res.status(400).json({ error: "donedeal", message: "Rotation blocked — lead is Done Deal" });
    }
    // ── HARD STOP 4: older than 30 days ──
    if (lead.createdAt && (new Date() - new Date(lead.createdAt)) > 30*24*60*60*1000) {
      return res.status(400).json({ error: "expired", message: "Rotation blocked — lead older than 30 days" });
    }
    // ── HARD STOP 5: all agents exhausted ──
    var prevIds = (lead.previousAgentIds || []).map(function(id) { return String(id); });
    if (prevIds.includes(String(targetAgentId))) {
      return res.status(400).json({ error: "already_assigned", message: "Target agent already had this lead" });
    }

    // Add new assignment entry for target agent
    var oldAgentId = lead.agentId && lead.agentId._id ? lead.agentId._id : lead.agentId;
    var newAssignment = {
      agentId: new mongoose.Types.ObjectId(targetAgentId),
      status: "NewLead",
      assignedAt: new Date(),
      lastActionAt: new Date(),
      rotationTimer: new Date(),
      noRotation: false,
      notes: "",
      budget: "",
      callbackTime: "",
      lastFeedback: "",
      nextCallAt: null,
      agentHistory: []
    };

    var oldAgentName = lead.agentId && lead.agentId.name ? lead.agentId.name : "Unassigned";
    var newAgentUser = await User.findById(targetAgentId).lean();
    var newAgentName = newAgentUser ? newAgentUser.name : "Unknown";
    var rotationReason = reason || "manual";
    var rotationLog = {
      action: "Rotation",
      fromAgent: oldAgentName,
      toAgent: newAgentName,
      reason: rotationReason,
      by: req.user.name || "System",
      date: new Date()
    };

    var pushOps = { assignments: newAssignment, agentHistory: rotationLog };
    if (oldAgentId && String(oldAgentId) !== "null" && String(oldAgentId) !== "undefined" && String(oldAgentId) !== "") {
      pushOps.previousAgentIds = oldAgentId;
    }

    await Lead.findByIdAndUpdate(req.params.id, {
      $set: {
        agentId: new mongoose.Types.ObjectId(targetAgentId),
        lastRotationAt: new Date(),
        rotationCount: (lead.rotationCount || 0) + 1
        // Top-level notes/lastFeedback intentionally untouched — each agent reads
        // their own slice from assignments[]. The new agent's slice is empty
        // (newAssignment above); the old agent's slice is preserved verbatim.
      },
      $push: pushOps
    });

    // Admin timeline — rotation event (fromAgent → toAgent, by whom, why).
    await pushHistory(req.params.id, historyEntry(
      "rotated",
      "Rotated from " + oldAgentName + " to " + newAgentName + " by " + (req.user.name || "System") + " (" + rotationReason + ")",
      req.user.name || "System",
      newAgentName
    ));

    var updated = await Lead.findById(req.params.id).populate("agentId", "name title").populate("assignments.agentId", "name title");
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== AUTO-ROTATE (server picks next agent from the ordered rotation list) =====
// The rotation order lives in AppSetting (key "rotation", field reassignAgents)
// and is an ORDERED array of user ids. This endpoint walks that list top-to-bottom
// and assigns the lead to the first agent who has never handled it. "Previously
// handled" = any id in lead.assignments[].agentId, lead.previousAgentIds, or the
// current lead.agentId. If every agent in the list has already had the lead,
// rotation stops and the lead is left as-is.
//
// INVARIANT: ONE rotation event = exactly ONE new assignment to ONE agent.
// The scan loop below has a `break` on first match, and the mutation is a
// single atomic findOneAndUpdate guarded on the lead's current agentId so
// two concurrent requests can't both append an assignment to the same lead.
app.post("/api/leads/:id/auto-rotate", auth, async function(req, res) {
  try {
    var reason = (req.body && req.body.reason) || "auto_timeout";
    var lead = await Lead.findById(req.params.id).populate("agentId", "name title");
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Hard stops mirror the manual /rotate endpoint — same invariants apply.
    var currentAid = lead.agentId && lead.agentId._id ? String(lead.agentId._id) : String(lead.agentId||"");
    var currentAssignment = (lead.assignments || []).find(function(a) { return String(a.agentId) === currentAid; });
    if (lead.rotationStopped === true) {
      return res.status(409).json({ error: "rotation_stopped", message: "Rotation permanently stopped on this lead (3 consecutive Not Interested)" });
    }
    if (currentAssignment && currentAssignment.noRotation && req.user.role !== "admin" && req.user.role !== "sales_admin") {
      return res.status(400).json({ error: "noRotation", message: "Rotation blocked — noRotation flag set" });
    }
    if (lead.globalStatus === "eoi")      return res.status(400).json({ error: "eoi",      message: "Rotation blocked — lead is EOI" });
    if (lead.globalStatus === "donedeal") return res.status(400).json({ error: "donedeal", message: "Rotation blocked — lead is Done Deal" });

    // Load rotation settings once (normalized + migrated). Master switch and
    // pause window gate everything below — nothing rotates while disabled.
    var settings = await getRotationSettings();
    if (settings.autoRotationEnabled === false) {
      return res.status(409).json({ error: "rotation_disabled", message: "Auto-rotation is turned off" });
    }
    if (settings.autoRotationPausedUntil && new Date(settings.autoRotationPausedUntil) > new Date()) {
      return res.status(409).json({ error: "rotation_paused", message: "Auto-rotation is paused until " + settings.autoRotationPausedUntil });
    }

    // Configurable age cutoff (was hardcoded 30 days, spec Rule 5 says 45).
    var stopDays = Number(settings.rotationStopAfterDays) || 45;
    if (lead.createdAt && (new Date() - new Date(lead.createdAt)) > stopDays*24*60*60*1000) {
      return res.status(400).json({ error: "stopped_age", message: "Rotation blocked — lead older than " + stopDays + " days" });
    }

    // Build the exclusion set: current agent + every assignment this lead has ever carried + previousAgentIds.
    var exclusion = new Set();
    if (currentAid) exclusion.add(currentAid);
    (lead.assignments || []).forEach(function(a){
      var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
      if (aid) exclusion.add(String(aid));
    });
    (lead.previousAgentIds || []).forEach(function(id){ if (id) exclusion.add(String(id)); });

    // All candidate ids across tiers (one query).
    var allTierIds = [].concat(settings.tiers.tier1.agents, settings.tiers.tier2.agents, settings.tiers.tier3.agents);
    if (!allTierIds.length) return res.status(409).json({ error: "no_rotation_order", message: "No rotation order configured" });
    var candidateDocs = await User.find({ _id: { $in: allTierIds } }).select("_id name title role active lastSeen").lean();
    var byId = {};
    candidateDocs.forEach(function(u){ byId[String(u._id)] = u; });

    // Tier cascade: try Tier 1, then 2, then 3. Each tier has its own
    // round-robin pointer. Skip rules are applied per-candidate; "skipped"
    // agents leave the pointer untouched.
    var sr = settings.smartSkipRules || {};
    var nowTs = new Date();
    var withinHours = isWithinWorkingHours(settings.workingHours, nowTs);
    var tryTier = function(tier){
      var ids = Array.isArray(tier.agents) ? tier.agents : [];
      var n = ids.length;
      if (!n) return null;
      var start = ((tier.lastIdx + 1) % n + n) % n;
      for (var step = 0; step < n; step++) {
        var idx = (start + step) % n;
        var uid = String(ids[idx]);
        if (sr.skipIfAlreadyHandled !== false && exclusion.has(uid)) continue;
        var u = byId[uid];
        if (!u || u.active === false) continue;
        if (["sales","team_leader"].indexOf(u.role) < 0) continue; // managers/directors excluded per spec
        if (Number(sr.skipIfOfflineHours) > 0 && u.lastSeen) {
          var offH = (nowTs.getTime() - new Date(u.lastSeen).getTime()) / 3600000;
          if (offH > Number(sr.skipIfOfflineHours)) continue;
        }
        if (sr.respectWorkingHours && !withinHours) continue;
        // skipOnVacation: no-op until vacation collection exists (Team & Roles tab)
        return { user: u, idx: idx };
      }
      return null;
    };
    var pick = null;
    var tierKey = null;
    ["tier1","tier2","tier3"].some(function(k){
      var got = tryTier(settings.tiers[k]);
      if (got) { pick = got; tierKey = k; return true; }
      return false;
    });
    if (!pick) return res.status(409).json({ error: "exhausted", message: "No eligible agent in any tier" });
    var targetUser = pick.user;
    var foundIdx   = pick.idx;

    var targetAgentId = String(targetUser._id);

    // First assignment — lead has no active agent yet. Atomic so two concurrent
    // requests can't both push an assignment: the filter requires the lead to
    // still have no active agent at update time. Second request → null result → 409.
    var isFirstAssignment = !lead.agentId || (!lead.agentId._id && !mongoose.Types.ObjectId.isValid(String(lead.agentId))) || (lead.assignments && lead.assignments.length === 0);
    if (isFirstAssignment) {
      var firstAssignment = {
        agentId: new mongoose.Types.ObjectId(targetAgentId),
        status: "NewLead",
        notes: "", budget: "", callbackTime: "", lastFeedback: "",
        nextCallAt: null, agentHistory: [],
        assignedAt: new Date(), lastActionAt: new Date(), rotationTimer: new Date(),
        noRotation: false
      };
      var firstResult = await Lead.findOneAndUpdate(
        { _id: req.params.id, agentId: null },
        {
          $set: { agentId: new mongoose.Types.ObjectId(targetAgentId), lastRotationAt: new Date() },
          $push: { assignments: firstAssignment }
        },
        { new: true }
      );
      if (!firstResult) {
        return res.status(409).json({ error: "concurrent_rotation", message: "Lead was modified by another request — retry" });
      }
      var firstByName = (req.user && req.user.name) ? req.user.name : "System";
      await pushHistory(firstResult._id, historyEntry(
        "assigned",
        "Assigned to " + targetUser.name + " by " + firstByName + " (auto-rotate)",
        firstByName,
        targetUser.name
      ));
      // Advance the global pointer so the next rotation picks up after this agent.
      try { var pUpd = {}; pUpd["value.tiers." + tierKey + ".lastIdx"] = foundIdx; if (tierKey === "tier1") pUpd["value.lastAssignedIdx"] = foundIdx; await AppSetting.updateOne({ key: "rotation" }, { $set: pUpd }); } catch(pErr){ console.error("[rotation pointer]", pErr && pErr.message ? pErr.message : pErr); }
      var firstPopulated = await Lead.findById(req.params.id).populate("agentId", "name title").populate("assignments.agentId", "name title");
      return res.json({ success: true, firstAssignment: true, targetAgentId: targetAgentId, lead: firstPopulated });
    }

    // ── Regular rotation path ──
    // ONE assignment, atomically. The filter pins the lead to its CURRENT
    // agentId as read above — if another /auto-rotate (or /rotate) call has
    // already moved the lead since we fetched it, findOneAndUpdate returns
    // null and we bail with 409. That's what guarantees "one trigger = one
    // agent assignment": concurrent triggers can't each append their own
    // assignment to the same lead.
    var oldAgentId = lead.agentId && lead.agentId._id ? lead.agentId._id : lead.agentId;
    var oldAgentName = lead.agentId && lead.agentId.name ? lead.agentId.name : "Unassigned";

    // Consecutive-NotInterested streak. The outgoing agent's final status on
    // their own assignment decides whether the streak advances:
    //   - "NotInterested" on their slice → streak + 1
    //   - anything else                   → streak reset to 0
    // Hitting 3 flips rotationStopped permanently (admin can clear the flag
    // by editing the lead). When we hit 3 we ABORT this rotation — the lead
    // stays where it is, marked stopped.
    var outgoingAssignment = (lead.assignments || []).find(function(a) {
      var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
      return String(aid||"") === String(oldAgentId||"");
    });
    var outgoingStatus = outgoingAssignment ? String(outgoingAssignment.status||"") : String(lead.status||"");
    var prevStreak = Number(lead.notInterestedStreak||0);
    var nextStreak = (outgoingStatus === "NotInterested" || outgoingStatus === "Not Interested") ? (prevStreak + 1) : 0;
    var haltThreshold = Number(settings.smartSkipRules && settings.smartSkipRules.haltAfterNotInterested) || 0;
    if (haltThreshold > 0 && nextStreak >= haltThreshold) {
      // Flip the kill switch; do NOT rotate.
      var stopResult = await Lead.findOneAndUpdate(
        { _id: req.params.id, agentId: oldAgentId, rotationStopped: { $ne: true } },
        { $set: { notInterestedStreak: nextStreak, rotationStopped: true } },
        { new: true }
      );
      if (stopResult) {
        try {
          await pushHistory(req.params.id, historyEntry(
            "rotation_stopped",
            "Rotation permanently stopped — 3 consecutive Not Interested outcomes",
            req.user.name || "System",
            ""
          ));
        } catch(hErr) { /* non-fatal */ }
      }
      return res.status(409).json({ error: "rotation_stopped", message: "Rotation permanently stopped on this lead (3 consecutive Not Interested)" });
    }

    var newAssignment = {
      agentId: new mongoose.Types.ObjectId(targetAgentId),
      status: "NewLead",
      assignedAt: new Date(), lastActionAt: new Date(), rotationTimer: new Date(),
      noRotation: false,
      notes: "", budget: "", callbackTime: "", lastFeedback: "", nextCallAt: null,
      agentHistory: []
    };
    var rotationLog = {
      action: "Rotation",
      fromAgent: oldAgentName,
      toAgent: targetUser.name,
      reason: reason,
      by: req.user.name || "System",
      date: new Date()
    };
    var pushOps = { assignments: newAssignment, agentHistory: rotationLog };
    if (oldAgentId && String(oldAgentId) !== "null" && String(oldAgentId) !== "undefined" && String(oldAgentId) !== "") {
      pushOps.previousAgentIds = oldAgentId;
    }
    var guardedResult = await Lead.findOneAndUpdate(
      { _id: req.params.id, agentId: oldAgentId },
      {
        $set: {
          agentId: new mongoose.Types.ObjectId(targetAgentId),
          lastRotationAt: new Date(),
          notInterestedStreak: nextStreak
        },
        $inc: { rotationCount: 1 },
        $push: pushOps
      },
      { new: true }
    );
    if (!guardedResult) {
      return res.status(409).json({ error: "concurrent_rotation", message: "Lead was already rotated by another request" });
    }
    await pushHistory(req.params.id, historyEntry(
      "rotated",
      "Rotated from " + oldAgentName + " to " + targetUser.name + " by " + (req.user.name || "System") + " (" + reason + ")",
      req.user.name || "System",
      targetUser.name
    ));
    // Advance the global round-robin pointer — next rotation (in this batch or
    // any future one) resumes from (foundIdx + 1) % N so assignments fan out.
    try { var pUpd2 = {}; pUpd2["value.tiers." + tierKey + ".lastIdx"] = foundIdx; if (tierKey === "tier1") pUpd2["value.lastAssignedIdx"] = foundIdx; await AppSetting.updateOne({ key: "rotation" }, { $set: pUpd2 }); } catch(pErr){ console.error("[rotation pointer]", pErr && pErr.message ? pErr.message : pErr); }
    var updated = await Lead.findById(req.params.id).populate("agentId", "name title").populate("assignments.agentId", "name title");
    res.json({ success: true, targetAgentId: targetAgentId, lead: updated });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin cleanup: remove duplicate leads by phone, keep oldest
app.post("/api/admin/cleanup-duplicates", auth, adminOnly, async function(req, res) {
  try {
    var allLeads = await Lead.find({}).lean();
    var phoneMap = {};
    allLeads.forEach(function(l) {
      if (!l.phone) return;
      if (!phoneMap[l.phone]) phoneMap[l.phone] = [];
      phoneMap[l.phone].push(l);
    });
    var toDelete = [];
    Object.keys(phoneMap).forEach(function(ph) {
      var group = phoneMap[ph];
      if (group.length <= 1) return;
      group.sort(function(a, b) { return new Date(a.createdAt || 0) - new Date(b.createdAt || 0); });
      for (var i = 1; i < group.length; i++) {
        toDelete.push(group[i]._id);
      }
    });
    if (toDelete.length > 0) {
      await Lead.deleteMany({ _id: { $in: toDelete } });
    }
    res.json({ deleted: toDelete.length, kept: allLeads.length - toDelete.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk delete archived leads
app.post("/api/leads/bulk-delete", auth, adminOnly, async function(req, res) {
  try {
    var { ids } = req.body;
    if(!ids||!ids.length) return res.json({ ok: true, count: 0 });
    await Lead.deleteMany({ _id: { $in: ids }, archived: true });
    res.json({ ok: true, count: ids.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== ACTIVITY ROUTES =====
app.get("/api/activities", auth, async function(req, res) {
  try {
    var query = {};
    var role = req.user.role;
    var uid = req.user.id;
    if (role === "sales") {
      query.userId = uid;
    } else if (role === "team_leader") {
      // Team leader sees activities of their direct sales only
      var directSales = await User.find({ reportsTo: uid }).lean();
      var teamIds = directSales.map(function(s){ return s._id; });
      teamIds.push(new mongoose.Types.ObjectId(uid));
      query.userId = { $in: teamIds };
    }
    // manager/admin/sales_admin see all (or server already filtered users)

    // Optional createdAt filter (e.g. since today 00:00)
    if (req.query.since) {
      var sinceDate = new Date(req.query.since);
      if (!isNaN(sinceDate.getTime())) query.createdAt = { $gte: sinceDate };
    }

    // Pagination
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 20;
    if (limit > 2000) limit = 2000;
    var skip = (page - 1) * limit;

    var total = await Activity.countDocuments(query);
    // Manual Lead hydration instead of .populate("leadId", "name").
    // Reason: Activity.leadId points at EITHER a Lead or a DailyRequest,
    // and Mongoose's .populate with ref="Lead" silently REPLACES the field
    // with null when the referenced doc is a DR. That wipes the raw id the
    // frontend needs to look up the DR in p.dailyReqs — which is why
    // DR-backed rows used to render as "Unknown client" with a dead click
    // on Today's Activities. Fetching lean + joining Lead.find ourselves
    // keeps the raw ObjectId on DR-backed activities (it becomes a string
    // after JSON serialization, which is exactly what the existing
    // activityLeadIdStr / _drsById resolver expects).
    var activitiesRaw = await Activity.find(query).populate("userId", "name").sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    var leadIdsToLoad = [];
    activitiesRaw.forEach(function(a){ if (a.leadId) leadIdsToLoad.push(a.leadId); });
    var leadDocs = [];
    if (leadIdsToLoad.length) {
      try { leadDocs = await Lead.find({ _id: { $in: leadIdsToLoad } }).select("name").lean(); }
      catch(hydrationErr) { console.error("activities Lead hydration failed (non-fatal):", hydrationErr.message); }
    }
    var leadMap = {};
    leadDocs.forEach(function(l){ leadMap[String(l._id)] = l; });
    activitiesRaw.forEach(function(a){
      if (a.leadId) {
        var key = String(a.leadId);
        if (leadMap[key]) {
          // Lead-backed — keep the same shape .populate used to return.
          a.leadId = { _id: a.leadId, name: leadMap[key].name };
        }
        // DR-backed: leave a.leadId as the raw ObjectId. JSON-serialized as
        // a string; frontend's _drsById lookup takes it from here.
      }
    });
    var activities = activitiesRaw;

    res.json({
      data: activities,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/activities", auth, async function(req, res) {
  try {
    // Snapshot the client identity (name + phone) at write time. Activity.leadId
    // can point at either a Lead or a DailyRequest; populate only resolves the
    // Lead side, so DR-backed rows used to lose the client name on read. We
    // look the id up in BOTH collections and stash whatever we find — the
    // dashboard then renders the snapshot directly with no cross-join.
    var clientName = "";
    var clientPhone = "";
    if (req.body.leadId) {
      try {
        var leadDoc = await Lead.findById(req.body.leadId).select("name phone").lean();
        if (leadDoc) {
          clientName  = leadDoc.name  || "";
          clientPhone = leadDoc.phone || "";
        } else {
          var drDoc = await DailyRequest.findById(req.body.leadId).select("name phone").lean();
          if (drDoc) {
            clientName  = drDoc.name  || "";
            clientPhone = drDoc.phone || "";
          }
        }
      } catch(lookupErr) { /* non-fatal — activity still gets created without snapshot */ }
    }
    var activity = await Activity.create({
      userId: req.user.id,
      leadId: req.body.leadId,
      type: req.body.type || "call",
      note: req.body.note || "",
      clientName: clientName,
      clientPhone: clientPhone
    });
    if (req.body.leadId) {
      await Lead.findByIdAndUpdate(req.body.leadId, { lastActivityTime: new Date() });
    }
    activity = await Activity.findById(activity._id).populate("userId", "name").populate("leadId", "name");
    res.json(activity);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== LEAD FULL HISTORY =====
// Returns the audit trail for a lead: every Activity record plus every
// per-agent feedback / note / history entry from assignments[]. Each row
// carries the agent who authored it.
//
// Sales: must also be able to see their own history — this route was
// previously gated by adminOnly, which silently 403'd sales and made their
// own feedback disappear from the history panel. For sales we enforce two
// rules server-side:
//   1) they must have (or have had) an assignments[] entry on this lead,
//      otherwise 404 — access is granted by the per-agent slice, not by
//      the current top-level agentId, so rotations don't revoke access,
//   2) the returned rows are filtered to their own authorship only (their
//      Activity entries + their own assignments[] slice).
// Admin / sales_admin / manager / team_leader get the unfiltered timeline.
app.get("/api/leads/:id/full-history", auth, async function(req, res) {
  try {
    var oid = new mongoose.Types.ObjectId(req.params.id);
    var uid = String(req.user.id);
    var role = req.user.role;
    var isSales = role === "sales";

    // Sales: confirm the caller has an assignments[] entry for this lead.
    // Using top-level agentId here would hide the history from the previous
    // agent right after a rotation.
    if (isSales) {
      var ownLead = await Lead.findById(oid).select({ "assignments.agentId": 1 }).lean();
      if (!ownLead) return res.status(404).json({ error: "Not found" });
      var hasEntry = (ownLead.assignments || []).some(function(a){
        return a && a.agentId && String(a.agentId) === uid;
      });
      if (!hasEntry) return res.status(404).json({ error: "Not found" });
    }

    var activityQuery = { leadId: oid };
    if (isSales) activityQuery.userId = new mongoose.Types.ObjectId(uid);

    var activities = await Activity.find(activityQuery)
      .populate("userId", "name title")
      .sort({ createdAt: 1 })
      .lean();

    // Synthesize entries from assignments[] so per-agent feedback that was
    // written directly to the assignment slice (never into Activity) also
    // appears in the timeline, labeled with the agent's name.
    var lead = await Lead.findById(oid)
      .populate("agentId", "name title")
      .populate("assignments.agentId", "name title")
      .lean();

    var assignmentEntries = [];
    var currentHolder = null;
    if (lead) {
      currentHolder = lead.agentId && lead.agentId._id ? {
        _id: String(lead.agentId._id),
        name: lead.agentId.name || "",
        title: lead.agentId.title || ""
      } : null;

      (lead.assignments || []).forEach(function(a) {
        var ag = a.agentId || {};
        var agentObjId = ag._id ? String(ag._id) : (a.agentId ? String(a.agentId) : "");
        // Sales: only surface THEIR OWN assignment slice, never other agents'.
        if (isSales && agentObjId !== uid) return;

        var agentObj = ag._id ? { _id: ag._id, name: ag.name || "", title: ag.title || "" } : null;
        var when = a.lastActionAt || a.assignedAt || lead.createdAt || new Date();
        if (a.lastFeedback && String(a.lastFeedback).trim().length > 0) {
          assignmentEntries.push({
            _id: "asg-fb-" + String(a._id || Math.random()),
            leadId: oid,
            userId: agentObj,
            agentName: agentObj ? agentObj.name : "Unknown",
            type: "feedback",
            note: a.lastFeedback,
            createdAt: when,
            source: "assignment"
          });
        }
        if (a.notes && String(a.notes).trim().length > 0) {
          assignmentEntries.push({
            _id: "asg-nt-" + String(a._id || Math.random()),
            leadId: oid,
            userId: agentObj,
            agentName: agentObj ? agentObj.name : "Unknown",
            type: "note",
            note: a.notes,
            createdAt: when,
            source: "assignment"
          });
        }
        // Per-agent agentHistory entries (status changes logged on the
        // assignment slice by sales PUT).
        (a.agentHistory || []).forEach(function(h, idx) {
          if (!h) return;
          assignmentEntries.push({
            _id: "asg-h-" + String(a._id || "x") + "-" + idx,
            leadId: oid,
            userId: agentObj,
            agentName: agentObj ? agentObj.name : "Unknown",
            type: h.type || "note",
            note: h.note || "",
            createdAt: h.createdAt || when,
            source: "assignment"
          });
        });
      });
    }

    // Dedicated audit-history array on the lead — created / assigned /
    // rotated / status_changed / feedback_added / callback_scheduled. Admin
    // sees the full set; sales sees only rows where byUser matches their
    // own name (other agents' history stays hidden, per the rule).
    var historyEntries = [];
    if (lead && Array.isArray(lead.history)) {
      var myName = "";
      if (isSales) {
        var me = await User.findById(uid).select({ name: 1 }).lean();
        myName = me ? (me.name || "") : "";
      }
      lead.history.forEach(function(h, idx) {
        if (!h) return;
        if (isSales && (!myName || String(h.byUser || "") !== myName)) return;
        historyEntries.push({
          _id: "hist-" + idx + "-" + String(h.timestamp || ""),
          leadId: oid,
          // Keep the same shape the timeline renderer already expects —
          // userId.name is what the panel prints as the author. For sales
          // we stamp their own uid so the client-side "own rows only"
          // filter doesn't drop entries they authored.
          userId: isSales
            ? { _id: uid, name: h.byUser || "", title: "" }
            : { name: h.byUser || "", title: "" },
          agentName: h.toAgent || "",
          type: h.event || "event",
          note: h.description || "",
          createdAt: h.timestamp || lead.createdAt || new Date(),
          source: "history"
        });
      });
    }

    var merged = activities.concat(assignmentEntries).concat(historyEntries).sort(function(a, b) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    // Legacy clients (and the existing sales history panel) expect an array.
    // Admins opting into ?format=full also get the currentHolder hint.
    if (req.query.format === "full" && !isSales) {
      return res.json({ entries: merged, currentHolder: currentHolder });
    }
    res.json(merged);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== TASK ROUTES =====
app.get("/api/tasks", auth, async function(req, res) {
  try {
    var query = {};
    if (req.user.role === "sales") {
      query.userId = req.user.id;
    } else if (["team_leader","manager","director"].indexOf(req.user.role) >= 0) {
      var ids = await visibleAgentIds(req.user.id);
      query.userId = { $in: ids };
    }
    // admin / sales_admin: no filter
    var tasks = await Task.find(query).populate("userId", "name").populate("leadId", "name").sort({ createdAt: -1 });
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tasks", auth, async function(req, res) {
  try {
    var task = await Task.create({
      title: req.body.title,
      type: req.body.type || "call",
      time: req.body.time || "",
      leadId: req.body.leadId || null,
      userId: req.body.userId || req.user.id,
      done: false,
    });
    task = await Task.findById(task._id).populate("userId", "name").populate("leadId", "name");
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/tasks/:id", auth, async function(req, res) {
  try {
    var task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("userId", "name").populate("leadId", "name");
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/tasks/:id", auth, async function(req, res) {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== STATS ROUTE =====
app.get("/api/stats", auth, async function(req, res) {
  try {
    var leadQuery = {};
    var actQuery = {};
    if (req.user.role === "sales") {
      // Count against the caller's own assignments[] slice so rotated leads
      // still show up in their stats — same visibility rule as GET /api/leads.
      leadQuery["assignments.agentId"] = new mongoose.Types.ObjectId(req.user.id);
      actQuery.userId = req.user.id;
    } else if (["team_leader","manager","director"].indexOf(req.user.role) >= 0) {
      var ids = await visibleAgentIds(req.user.id);
      leadQuery.agentId = { $in: ids };
      actQuery.userId = { $in: ids };
    }
    // admin / sales_admin: no filter
    var totalLeads = await Lead.countDocuments(leadQuery);
    var potential = await Lead.countDocuments(Object.assign({ status: "Potential" }, leadQuery));
    var hotCase = await Lead.countDocuments(Object.assign({ status: "HotCase" }, leadQuery));
    var callBack = await Lead.countDocuments(Object.assign({ status: "CallBack" }, leadQuery));
    // Permanent meeting count: every lead that has EVER reached MeetingDone,
    // regardless of current status. Falls back to current status for legacy
    // rows that predate the hadMeeting flag.
    var meetingDone = await Lead.countDocuments(Object.assign({
      $or: [{ hadMeeting: true }, { status: "MeetingDone" }]
    }, leadQuery));
    var notInterested = await Lead.countDocuments(Object.assign({ status: "NotInterested" }, leadQuery));
    var noAnswer = await Lead.countDocuments(Object.assign({ status: "NoAnswer" }, leadQuery));
    var doneDeal = await Lead.countDocuments(Object.assign({ status: "DoneDeal" }, leadQuery));
    var totalActivities = await Activity.countDocuments(actQuery);
    var totalCalls = await Activity.countDocuments(Object.assign({ type: "call" }, actQuery));
    res.json({ totalLeads: totalLeads, potential: potential, hotCase: hotCase, callBack: callBack, meetingDone: meetingDone, notInterested: notInterested, noAnswer: noAnswer, doneDeal: doneDeal, totalActivities: totalActivities, totalCalls: totalCalls });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== HEALTH CHECK =====
app.get("/", function(req, res) {
  res.json({ status: "CRM ARO API is running", version: "3.0.0" });
});

// ===== DAILY REQUEST ROUTES =====
app.get("/api/daily-requests", auth, async function(req, res) {
  try {
    var query = {};
    if (req.user.role === "sales") {
      // Strict ownership. Equality match already excludes null/missing, but we
      // spell out $exists + $ne: null explicitly so the intent is visible and
      // accidental regressions to a partial filter can't quietly re-admit
      // unassigned rows.
      query.agentId = new mongoose.Types.ObjectId(req.user.id);
      query.$and = [
        { agentId: { $exists: true } },
        { agentId: { $ne: null } }
      ];
    } else if (req.user.role === "team_leader") {
      // Team leader: only see their direct sales' requests
      var tlUser = await User.findById(req.user.id).lean();
      var tlVisibleIds = [tlUser._id];
      var tlSales = await User.find({ reportsTo: tlUser._id }).lean();
      tlSales.forEach(function(s){ tlVisibleIds.push(s._id); });
      query.agentId = { $in: tlVisibleIds };
    } else if (req.user.role === "manager") {
      // Manager: only assigned requests (no unassigned), filtered by team
      var managerUser = await User.findById(req.user.id).lean();
      var visibleIds = [managerUser._id];
      if (!managerUser.reportsTo) {
        var tls = await User.find({ reportsTo: managerUser._id }).lean();
        tls.forEach(function(tl){ visibleIds.push(tl._id); });
        if (tls.length > 0) {
          var sales = await User.find({ reportsTo: { $in: tls.map(function(t){return t._id;}) } }).lean();
          sales.forEach(function(s){ visibleIds.push(s._id); });
        }
      } else {
        var direct = await User.find({ reportsTo: managerUser._id }).lean();
        direct.forEach(function(s){ visibleIds.push(s._id); });
      }
      query.agentId = { $in: visibleIds }; // only assigned ones
    }
    var requests = await DailyRequest.find(query).populate("agentId", "name title").sort({ createdAt: -1 });
    res.json(requests);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/daily-requests", auth, async function(req, res) {
  try {
    var r = await DailyRequest.create({
      name: req.body.name, phone: req.body.phone,
      phone2: req.body.phone2 || "",
      email: req.body.email || "", budget: req.body.budget || "",
      propertyType: req.body.propertyType || "",
      area: req.body.area || "", notes: req.body.notes || "",
      agentId: req.body.agentId || req.user.id,
      callbackTime: req.body.callbackTime || "",
      status: req.body.status || "NewLead",
      lastActivityTime: new Date(),
      hadMeeting: req.body.status === "MeetingDone",
      meetingDoneAt: req.body.status === "MeetingDone" ? new Date() : null,
    });
    r = await DailyRequest.findById(r._id).populate("agentId", "name title");
    // Log creation as activity
    var createNote = "Added — Status: " + (req.body.status||"NewLead");
    if(req.body.notes) createNote += " | " + req.body.notes;
    await Activity.create({ userId: req.user.id, type: "note", note: createNote, leadId: r._id });
    res.json(r);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/daily-requests/bulk-reassign", auth, adminOnly, async function(req, res) {
  try {
    var { leadIds, agentId } = req.body;
    if(!leadIds||!leadIds.length||!agentId) return res.status(400).json({ error: "leadIds and agentId required" });
    var agentObjId = new mongoose.Types.ObjectId(agentId);
    await DailyRequest.updateMany({ _id: { $in: leadIds } }, { $set: { agentId: agentObjId } });
    res.json({ ok: true, count: leadIds.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/daily-requests/:id", auth, async function(req, res) {
  try {
    // Admin-only gate: "Deal Cancelled" can only be set by admin users.
    if (req.body.status === "Deal Cancelled" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can set Deal Cancelled status" });
    }
    // Normalize agentId — on edit the frontend can send a populated
    // {_id, name, ...} object from a prior populate(), which would CastError.
    req.body.agentId = normId(req.body.agentId);
    var update = Object.assign({}, req.body, { lastActivityTime: new Date() });
    // Never overwrite agentId with null/empty — only update if explicitly provided and valid
    if (!update.agentId) delete update.agentId;
    // Permanent meeting marker — stamp once, never overwrite. Strip any
    // client-supplied value first so only this server logic can set it.
    delete update.hadMeeting;
    delete update.meetingDoneAt;
    // Capture previous status on EOI / DoneDeal transition so cancels can restore it.
    // Also used to decide whether this is the FIRST transition into MeetingDone.
    var prevDr = null;
    if (req.body.status === "EOI" || req.body.status === "DoneDeal" || req.body.status === "MeetingDone") {
      prevDr = await DailyRequest.findById(req.params.id).lean();
    }
    if ((req.body.status === "EOI" || req.body.status === "DoneDeal") && prevDr && prevDr.status && prevDr.status !== req.body.status) {
      if (req.body.status === "EOI") { update.preEoiStatus = prevDr.status; update.eoiStatus = "Pending"; }
      else { update.preDealStatus = prevDr.status; update.dealStatus = ""; }
    }
    if (req.body.status === "MeetingDone" && prevDr && !prevDr.hadMeeting) {
      update.hadMeeting = true;
      update.meetingDoneAt = new Date();
    }
    var r = await DailyRequest.findByIdAndUpdate(req.params.id, update, { new: true }).populate("agentId", "name title");
    if (req.body.status) {
      var actNote = "DailyReq: " + req.body.status;
      if (req.body.notes) actNote += " | " + req.body.notes;
      // Snapshot client identity so dashboard DR-activity rows can resolve
      // the client (populate("leadId") misses DR ids — we'd otherwise lose
      // both the name and the _id needed for click-through).
      await Activity.create({ userId: req.user.id, type: "status_change", note: actNote, leadId: r._id, clientName: r.name || "", clientPhone: r.phone || "" });
      // If status is DoneDeal or EOI — create/update a Lead mirror in the main collection
      if (req.body.status === "DoneDeal" || req.body.status === "EOI") {
        var existingLead = await Lead.findOne({ phone: r.phone, source: "Daily Request" });
        // EOI mirrors need eoiStatus so the EOI page's Pending tab picks
        // them up; DoneDeal mirrors need globalStatus so the Deals page and
        // the admin dashboard both find them.
        var mirrorExtra = {};
        if (req.body.status === "EOI")      { mirrorExtra.eoiStatus = "Pending"; mirrorExtra.eoiApproved = false; }
        if (req.body.status === "DoneDeal") { mirrorExtra.globalStatus = "donedeal"; mirrorExtra.dealDate = new Date().toISOString().slice(0,10); }
        // GET /api/leads filters sales-role users on assignments.agentId, not
        // the top-level agentId, so a mirror Lead with just agentId is
        // invisible to the very sales user who just created it. Seed an
        // assignments[] entry for the DR's current agent so the mirror is
        // visible in sales' leads list (and therefore on the EOI/Deals page).
        var agentForMirror = r.agentId && r.agentId._id ? r.agentId._id : r.agentId;
        if (existingLead) {
          await Lead.findByIdAndUpdate(existingLead._id, Object.assign({
            status: req.body.status,
            budget: req.body.budget || r.budget || existingLead.budget,
            project: req.body.project || r.propertyType || existingLead.project,
            agentId: r.agentId,
            lastActivityTime: new Date(),
            notes: req.body.notes || r.notes || existingLead.notes,
            eoiDeposit: req.body.eoiDeposit || existingLead.eoiDeposit || "",
          }, mirrorExtra));
          // If the existing mirror has no assignment for the current agent,
          // add one so the sales-role leads filter accepts it. Use $addToSet
          // semantics by checking first — $addToSet on sub-docs doesn't dedupe
          // on a single field, so we do the check explicitly.
          if (agentForMirror) {
            var hasAssign = (existingLead.assignments || []).some(function(a) {
              var aid = a && a.agentId && a.agentId._id ? a.agentId._id : (a && a.agentId);
              return String(aid || "") === String(agentForMirror);
            });
            if (!hasAssign) {
              await Lead.findByIdAndUpdate(existingLead._id, {
                $push: { assignments: { agentId: agentForMirror, status: req.body.status, assignedAt: new Date(), lastActionAt: new Date(), rotationTimer: new Date(), noRotation: false, notes: "", budget: "", callbackTime: "", lastFeedback: "", nextCallAt: null, agentHistory: [] } }
              });
            } else {
              // Sync the agent's assignments status so per-agent views reflect the mirror's new state.
              await Lead.updateOne(
                { _id: existingLead._id, "assignments.agentId": agentForMirror },
                { $set: { "assignments.$.status": req.body.status, "assignments.$.lastActionAt": new Date() } }
              );
            }
          }
        } else {
          var seedAssignments = agentForMirror ? [{
            agentId: agentForMirror,
            status: req.body.status,
            assignedAt: new Date(),
            lastActionAt: new Date(),
            rotationTimer: new Date(),
            noRotation: false,
            notes: "",
            budget: "",
            callbackTime: "",
            lastFeedback: "",
            nextCallAt: null,
            agentHistory: []
          }] : [];
          await Lead.create(Object.assign({
            name: r.name, phone: r.phone, phone2: r.phone2 || "",
            email: r.email || "", budget: req.body.budget || r.budget || "",
            project: req.body.project || r.propertyType || "",
            notes: req.body.notes || r.notes || "",
            status: req.body.status,
            source: "Daily Request",
            agentId: r.agentId,
            callbackTime: r.callbackTime || "",
            lastActivityTime: new Date(),
            eoiDeposit: req.body.eoiDeposit || "",
            assignments: seedAssignments,
          }, mirrorExtra));
        }
        // Real-time broadcast for the Lead mirror. The auto-broadcast
        // middleware only emits dr_updated here (the response path is
        // /api/daily-requests), so admins never received the new/updated
        // mirror Lead until a manual refresh. Emitting lead_updated here
        // — with the full populated doc — matches what a direct Lead PUT
        // would emit, so the frontend lead_updated handler slots the row
        // into p.leads and the EOI / Deals page shows it instantly. The
        // DR's own dr_updated event is still emitted by the middleware
        // after res.json(r), so the DR page also stays live.
        try {
          var mirrorLead = await Lead.findOne({ phone: r.phone, source: "Daily Request" }).populate("agentId", "name title").populate("assignments.agentId", "name title").lean();
          if (mirrorLead) emitLead(mirrorLead);
        } catch(emitErr) { console.error("DR→EOI/Deal mirror broadcast failed (non-fatal):", emitErr.message); }
      } else if (req.body.status === "Deal Cancelled") {
        // DR moved out of EOI/DoneDeal — keep the mirror Lead in sync so the EOI page shows it under Deal Cancelled
        var mirror = await Lead.findOne({ phone: r.phone, source: "Daily Request" });
        if (mirror && (mirror.status === "EOI" || mirror.status === "DoneDeal")) {
          await Lead.findByIdAndUpdate(mirror._id, { status: "Deal Cancelled", eoiApproved: false, lastActivityTime: new Date() });
        }
      }
    }
    res.json(r);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/daily-requests/:id", auth, adminOnly, async function(req, res) {
  try {
    await DailyRequest.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== ARCHIVE DAILY REQUEST =====
app.put("/api/daily-requests/:id/archive", auth, adminOnly, async function(req, res) {
  try {
    var r = await DailyRequest.findByIdAndUpdate(req.params.id, { archived: true, lastActivityTime: new Date() }, { new: true }).populate("agentId", "name title");
    if (!r) return res.status(404).json({ error: "Daily Request not found" });
    res.json(r);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/daily-requests/:id/unarchive", auth, adminOnly, async function(req, res) {
  try {
    var r = await DailyRequest.findByIdAndUpdate(req.params.id, { archived: false, lastActivityTime: new Date() }, { new: true }).populate("agentId", "name title");
    if (!r) return res.status(404).json({ error: "Daily Request not found" });
    res.json(r);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== DR HISTORY =====
app.get("/api/daily-requests/:id/history", auth, async function(req, res) {
  try {
    var oid = new mongoose.Types.ObjectId(req.params.id);
    var acts = await Activity.find({ leadId: oid })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json(acts);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== NOTIFICATIONS =====
app.post("/api/notifications", auth, async function(req, res) {
  try {
    var n = await Notification.create(req.body);
    res.json(n);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/notifications", auth, async function(req, res) {
  try {
    var uid = req.user.id;
    var type = req.query.type || null;
    var query = {};
    if (type) query.type = type;
    // Return the full history, newest first. Cap is defensive only.
    var limit = Math.min(parseInt(req.query.limit) || 2000, 5000);
    var notifs = await Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    // For deal/EOI AND rotation notifications, drop entries whose referenced lead no longer exists or is archived.
    var idsToCheck = notifs
      .filter(function(n){ return (n.type === "deal" || n.type === "rotation") && n.leadId; })
      .map(function(n){ return n.leadId; });
    var aliveLeadIds = new Set();
    if (idsToCheck.length > 0) {
      var objectIds = idsToCheck.map(function(id){
        try { return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null; } catch(e){ return null; }
      }).filter(Boolean);
      if (objectIds.length > 0) {
        var alive = await Lead.find({ _id: { $in: objectIds }, archived: { $ne: true } }, { _id: 1 }).lean();
        alive.forEach(function(l){ aliveLeadIds.add(String(l._id)); });
      }
    }
    var result = notifs
      .filter(function(n){
        if (n.type !== "deal" && n.type !== "rotation") return true;
        if (!n.leadId) return true; // legacy entries without a leadId — leave visible
        return aliveLeadIds.has(String(n.leadId));
      })
      .map(function(n) {
        return Object.assign({}, n, { seen: n.seenBy && n.seenBy.indexOf(String(uid)) !== -1 });
      });
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/notifications/mark-seen", auth, async function(req, res) {
  try {
    var uid = String(req.user.id);
    var type = req.body.type || null;
    var query = { seenBy: { $ne: uid } };
    if (type) query.type = type;
    await Notification.updateMany(query, { $addToSet: { seenBy: uid } });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== BULK REASSIGN =====
// ===== FIX MANAGER TEAM IDS =====
// One-time endpoint to auto-assign teamId to managers based on their sales' teamIds
app.post("/api/fix-manager-teams", auth, adminOnly, async function(req, res) {
  try {
    var managers = await User.find({ role: "manager", active: true }).lean();
    var fixed = [];
    for(var i = 0; i < managers.length; i++) {
      var mgr = managers[i];
      if(mgr.teamId) continue; // already has teamId
      // Find a sales user with reportsTo this manager OR that was created under same team
      // Try: find sales whose teamId is set, and this manager has no teamId
      // Strategy: find most common teamId among sales that reportsTo this manager
      var salesUnder = await User.find({ reportsTo: mgr._id }).lean();
      if(salesUnder.length > 0 && salesUnder[0].teamId) {
        var newTeamId = salesUnder[0].teamId;
        await User.findByIdAndUpdate(mgr._id, { teamId: newTeamId, teamName: salesUnder[0].teamName||"" });
        fixed.push({ name: mgr.name, teamId: newTeamId });
      }
    }
    res.json({ ok: true, fixed: fixed });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== BACKFILL LAST FEEDBACK =====
app.get("/api/leads/backfill-feedback", auth, adminOnly, async function(req, res) {
  try {
    var leads = await Lead.find({ $or: [{ lastFeedback: "" }, { lastFeedback: { $exists: false } }] }).lean();
    var updated = 0;
    for (var i = 0; i < leads.length; i++) {
      var act = await Activity.findOne({ leadId: leads[i]._id, type: "status_change", note: { $regex: /^\[.*?\]\s*.+/ } }).sort({ createdAt: -1 }).lean();
      if (act && act.note) {
        var txt = act.note.replace(/^\[.*?\]\s*/, "").trim();
        if (txt) {
          await Lead.findByIdAndUpdate(leads[i]._id, { $set: { lastFeedback: txt } });
          updated++;
        }
      }
    }
    res.json({ ok: true, updated: updated, total: leads.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== ARCHIVE LEAD =====
app.put("/api/leads/:id/archive", auth, adminOnly, async function(req, res) {
  try {
    var lead = await Lead.findByIdAndUpdate(req.params.id, { archived: true }, { new: true });
    res.json(lead);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== PUSH NOTIFICATIONS =====
var pushSubscriptions = [];
app.post("/api/push/subscribe", auth, async function(req, res) {
  var sub = req.body;
  var exists = pushSubscriptions.find(function(s) { return s.endpoint === sub.endpoint; });
  if (!exists) pushSubscriptions.push(Object.assign({ userId: req.user.id }, sub));
  res.json({ ok: true });
});

// ===== FACEBOOK WEBHOOK =====
app.get("/api/fb-webhook", function(req, res) {
  var mode = req.query["hub.mode"];
  var token = req.query["hub.verify_token"];
  var challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: "Forbidden" });
  }
});

app.post("/api/fb-webhook", async function(req, res) {
  try {
    var body = req.body;
    if (body.object === "page") {
      for (var entry of body.entry) {
        for (var change of (entry.changes || [])) {
          if (change.field === "leadgen") {
            var leadgenId = change.value.leadgen_id;
            var fbRes = await fetch("https://graph.facebook.com/v19.0/" + leadgenId + "?fields=field_data&access_token=" + process.env.FB_PAGE_TOKEN);
            var fbData = await fbRes.json();
            if (fbData.field_data) {
              var leadData = {};
              fbData.field_data.forEach(function(field) {
                var val = field.values && field.values[0] ? field.values[0] : "";
                var key = field.name.toLowerCase();
                if (key.includes("name")) leadData.name = val;
                else if (key.includes("phone") || key.includes("mobile")) leadData.phone = val;
                else if (key.includes("email")) leadData.email = val;
              });
              if (leadData.name || leadData.phone) {
                // Skip if phone is missing or if this phone is already in the CRM.
                var fbPhone = String(leadData.phone || "").trim();
                if (!fbPhone) {
                  console.log("FB lead skipped: no phone");
                } else {
                  var existing = await findLeadByPhone(fbPhone);
                  if (existing) {
                    console.log("FB lead skipped — duplicate phone:", fbPhone);
                  } else {
                    // Rotation-eligible roles: sales, team_leader, manager. NEVER sales_admin.
                    var agents = await User.find({ role: { $in: ["sales","team_leader","manager"] }, active: true });
                    var agentId = null;
                    if (agents.length > 0) {
                      var counts = await Promise.all(agents.map(function(a) { return Lead.countDocuments({ agentId: a._id }); }));
                      agentId = agents[counts.indexOf(Math.min(...counts))]._id;
                    }
                    var newLead = await Lead.create({ name: leadData.name || "Facebook Lead", phone: fbPhone, email: leadData.email || "", source: "Facebook", status: "Potential", agentId: agentId, lastActivityTime: new Date(), notes: "Facebook Lead Ads", assignments: agentId ? [{ agentId: agentId, status: "NewLead", assignedAt: new Date(), lastActionAt: new Date(), rotationTimer: new Date(), noRotation: false, notes: "", budget: "", callbackTime: "", lastFeedback: "", nextCallAt: null, agentHistory: [] }] : [] });
                    await Activity.create({ userId: agentId, leadId: newLead._id, type: "note", note: "Facebook Lead Ads" });
                    console.log("FB lead saved:", newLead.name);
                  }
                }
              }
            }
          }
        }
      }
    }
    res.status(200).json({ status: "ok" });
  } catch(e) {
    console.error("FB Webhook error:", e.message);
    res.status(200).json({ status: "ok" });
  }
});

// ===== EMAIL NOTIFICATIONS =====
var nodemailer = require("nodemailer");
var emailTransporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
var sendDealEmail = async function(lead, agentName) {
  if (!process.env.GMAIL_USER || !process.env.ADMIN_EMAIL) return;
  try {
    await emailTransporter.sendMail({ from: process.env.GMAIL_USER, to: process.env.ADMIN_EMAIL, subject: "Deal: " + lead.name, html: "<p>" + lead.name + "</p>" });
  } catch(e) { console.error("Email error:", e.message); }
};

// ===== DASHBOARD ENDPOINTS =====
app.get("/api/dashboard/admin", auth, async function(req, res) {
  try {
    if(req.user.role!=="admin"&&req.user.role!=="sales_admin") return res.status(403).json({error:"Forbidden"});
    var now = new Date(); var DAY=86400000; var MONTH=30*DAY;
    var todayStart = new Date(); todayStart.setHours(0,0,0,0);

    // Compute active filter date range from query param (today|week|month|Q1..Q4 YYYY)
    var filter = (req.query.filter||"today").toString();
    var rangeStart, rangeEnd = now.getTime(), periodEnd;
    var y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    if (filter==="week") {
      var dow = now.getDay(); // 0=Sun..6=Sat
      var daysSinceSat = (dow - 6 + 7) % 7;
      var ws = new Date(y,m,d-daysSinceSat,0,0,0,0);
      rangeStart = ws.getTime();
      rangeEnd = ws.getTime() + 7*DAY - 1;
      periodEnd = rangeEnd;
    } else if (filter==="month") {
      rangeStart = new Date(y,m,1,0,0,0,0).getTime();
      periodEnd = new Date(y,m+1,1,0,0,0,0).getTime()-1;
    } else if (/^Q[1-4]\s+\d{4}$/.test(filter)) {
      var qm = filter.match(/Q(\d)\s+(\d{4})/);
      var qNum = parseInt(qm[1]), qYear = parseInt(qm[2]);
      var qStart = (qNum-1)*3;
      rangeStart = new Date(qYear,qStart,1).getTime();
      rangeEnd = new Date(qYear,qStart+3,1).getTime()-1;
      periodEnd = rangeEnd;
    } else {
      rangeStart = todayStart.getTime();
      periodEnd = todayStart.getTime()+DAY-1;
    }

    var leads = await Lead.find({archived:false}).populate("agentId","name title").populate("assignments.agentId","name title").lean();
    var drs = await DailyRequest.find({}).lean();
    var activities = await Activity.find({}).lean();
    var users = await User.find({active:true,role:{$in:["sales","sales_admin","team_leader","manager"]}}).lean();

    // Helper: parse to ms; returns 0 if invalid
    var toMs = function(v){ if(!v) return 0; var t=new Date(v).getTime(); return isNaN(t)?0:t; };
    var inRange = function(t){ return t>=rangeStart && t<=rangeEnd; };

    // Daily Requests in range — counted from actual DailyRequest collection
    var drCount = drs.filter(function(r){ return inRange(toMs(r.createdAt)); }).length;

    // Deals: leads with globalStatus="donedeal" (dated by dealDate/latest lastActionAt) + DR with DoneDeal status in range
    var dealsFromLeads = leads.filter(function(l){
      if (l.globalStatus!=="donedeal" && l.status!=="DoneDeal") return false;
      var dealT = toMs(l.dealDate);
      if (!dealT) {
        (l.assignments||[]).forEach(function(a){ var t=toMs(a.lastActionAt); if(t>dealT) dealT=t; });
      }
      if (!dealT) dealT = toMs(l.updatedAt);
      return inRange(dealT);
    }).length;
    var dealsFromDR = drs.filter(function(r){
      if (r.status!=="DoneDeal" && r.status!=="Done Deal" && r.status!=="Deal") return false;
      var t = toMs(r.lastActivityTime) || toMs(r.updatedAt) || toMs(r.createdAt);
      return inRange(t);
    }).length;
    var dealsCount = dealsFromLeads + dealsFromDR;

    // Contacted: leads where any assignment.lastActionAt falls inside the active range
    var contactedCount = leads.filter(function(l){
      return (l.assignments||[]).some(function(a){ return inRange(toMs(a.lastActionAt)); });
    }).length;

    // KPIs (legacy fields kept for compatibility)
    var leadsToday = leads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt))< DAY;}).length;
    var drToday = drCount;
    var callbacksToday = leads.filter(function(l){return l.callbackTime&&!l.archived;}).length;
    var meetingsToday = leads.filter(function(l){return l.status==="MeetingDone"&&l.lastActivityTime&&(now-new Date(l.lastActivityTime))<DAY;}).length;
    var interestedToday = leads.filter(function(l){return ["HotCase","Potential","MeetingDone"].includes(l.status)&&l.lastActivityTime&&(now-new Date(l.lastActivityTime))<DAY;}).length;
    var dealsMonth = dealsCount;
    var contacted = contactedCount;
    var convRate = leads.length>0?((dealsMonth/leads.length)*100).toFixed(1):0;

    // Campaign performance — group by campaign+project+source
    var campMap = {};
    leads.forEach(function(l){
      var key = (l.campaign||"—")+"|"+(l.project||"—")+"|"+(l.source||"—");
      if(!campMap[key]) campMap[key]={campaign:l.campaign||"",project:l.project||"",source:l.source||"",leads:0,interested:0,meetings:0,deals:0};
      campMap[key].leads++;
      if(["HotCase","Potential","MeetingDone","DoneDeal"].includes(l.status)) campMap[key].interested++;
      if(l.status==="MeetingDone"||l.status==="DoneDeal") campMap[key].meetings++;
      if(l.status==="DoneDeal") campMap[key].deals++;
    });
    var campaignPerformance = Object.values(campMap).map(function(c){
      var ip=c.leads>0?Math.round(c.interested/c.leads*100):0;
      var mp=c.leads>0?Math.round(c.meetings/c.leads*100):0;
      return Object.assign({},c,{interestedPct:ip,meetingPct:mp,quality:ip>30?"High":ip>15?"Medium":"Low"});
    }).sort(function(a,b){return b.leads-a.leads;});

    // Funnel
    var funnel = {
      assigned:leads.length,
      contacted:leads.filter(function(l){return l.status!=="NewLead";}).length,
      interested:leads.filter(function(l){return ["HotCase","Potential","MeetingDone","DoneDeal"].includes(l.status);}).length,
      hotCase:leads.filter(function(l){return l.status==="HotCase";}).length,
      meeting:leads.filter(function(l){return l.status==="MeetingDone";}).length,
      deal:dealsMonth
    };

    // Hot alerts
    var untouched48h = leads.filter(function(l){return !l.archived&&l.status==="NewLead"&&l.createdAt&&(now-new Date(l.createdAt))>2*DAY;}).length;
    var overdueCallbacks = leads.filter(function(l){return l.callbackTime&&!l.archived&&new Date(l.callbackTime)<now;}).length;
    var noRotationCount = leads.filter(function(l){return l.locked;}).length;

    // Agent performance — count leads by assignments[].assignedAt in active range (not lead.createdAt)
    var agentPerf = users.map(function(u){
      var uid=String(u._id);
      var agentLeads=leads.filter(function(l){
        return (l.assignments||[]).some(function(a){
          var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
          if (String(aid)!==uid) return false;
          var t = toMs(a.assignedAt);
          return inRange(t);
        });
      });
      var agentActs=activities.filter(function(a){
        if (String(a.userId&&a.userId._id?a.userId._id:a.userId)!==uid) return false;
        var t = toMs(a.createdAt);
        return inRange(t);
      });
      var agentDRs=agentActs.filter(function(a){return a.type==="daily_request";});
      var agentCalls=agentActs.filter(function(a){return a.type==="call" || ((a.note||"").toLowerCase().indexOf("call")>=0);}).length;
      var agentFollowups=agentLeads.filter(function(l){return l.callbackTime;}).length;
      var agentOverdue=agentLeads.filter(function(l){return l.callbackTime&&!l.archived&&new Date(l.callbackTime)<now&&!["MeetingDone","DoneDeal","EOI"].includes(l.status);}).length;
      var agentInt=agentLeads.filter(function(l){return (l.assignments||[]).some(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===uid && ["HotCase","Potential","Hot Case","Interested"].includes(a.status);});}).length;
      var agentMeet=agentLeads.filter(function(l){return (l.assignments||[]).some(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===uid && (a.status==="MeetingDone"||a.status==="Meeting Done");});}).length;
      var agentDeals=agentLeads.filter(function(l){return l.status==="DoneDeal"||l.globalStatus==="donedeal";}).length;
      // Rotations: lead-level agentHistory stores {action:"Rotation", fromAgent:<name>, toAgent:<name>}
      var agentName = u.name || "";
      var agentRotOut=leads.filter(function(l){return (l.agentHistory||[]).some(function(h){return h && h.action==="Rotation" && h.fromAgent===agentName;});}).length;
      var agentRotIn=leads.filter(function(l){return (l.agentHistory||[]).some(function(h){return h && h.action==="Rotation" && h.toAgent===agentName;});}).length;
      // No Answer: leads where this agent's assignment.status is NoAnswer
      var agentNoAnswer=agentLeads.filter(function(l){return (l.assignments||[]).some(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===uid && (a.status==="NoAnswer"||a.status==="No Answer");});}).length;
      var agentFb=agentLeads.filter(function(l){
        if (l.notes && String(l.notes).trim().length>0) return true;
        if (l.lastFeedback && String(l.lastFeedback).trim().length>0) return true;
        return (l.assignments||[]).some(function(a){
          var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
          if (String(aid)!==uid) return false;
          return (a.notes && String(a.notes).trim().length>0) || (a.lastFeedback && String(a.lastFeedback).trim().length>0);
        });
      }).length;
      var ip=agentLeads.length>0?Math.round(agentInt/agentLeads.length*100):0;
      var mp=agentLeads.length>0?Math.round(agentMeet/agentLeads.length*100):0;
      // Avg response time: (assignment.lastActionAt - lead.createdAt) for this agent's assignments
      var rtSum=0, rtCount=0;
      agentLeads.forEach(function(l){
        (l.assignments||[]).forEach(function(a){
          var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
          if(String(aid)===uid && a.lastActionAt && l.createdAt){
            var diff=new Date(a.lastActionAt).getTime()-new Date(l.createdAt).getTime();
            if(diff>=0){rtSum+=diff;rtCount++;}
          }
        });
      });
      var respH = rtCount>0 ? (rtSum/rtCount)/3600000 : 0;
      var avgResp = rtCount>0 ? respH.toFixed(1) : null;
      // Callback compliance per agent — current-assignment only (rotated-off assignments carry stale callbackTime).
      var totalCallbacks=0, doneOnTime=0, missed=0;
      var nowMs = now.getTime();
      leads.forEach(function(l){
        var currentAid = l.agentId && l.agentId._id ? String(l.agentId._id) : String(l.agentId||"");
        if (currentAid!==uid) return;
        var active = (l.assignments||[]).find(function(a){
          var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
          return String(aid||"")===currentAid;
        });
        if (!active || !active.callbackTime) return;
        var cb = new Date(active.callbackTime).getTime();
        if (isNaN(cb)) return;
        if (cb<rangeStart || cb>periodEnd) return;
        totalCallbacks++;
        var stillCallBack = active.status==="CallBack" || active.status==="Call Back";
        if (cb<nowMs && stillCallBack) missed++;
      });
      drs.forEach(function(r){
        var aid=r.agentId&&r.agentId._id?r.agentId._id:r.agentId;
        if (String(aid)!==uid) return;
        if (!r.callbackTime) return;
        var cb = new Date(r.callbackTime).getTime();
        if (isNaN(cb)) return;
        if (cb<rangeStart || cb>periodEnd) return;
        totalCallbacks++;
        var drStill = r.status==="CallBack" || r.status==="Call Back";
        if (cb<nowMs && drStill) missed++;
      });
      doneOnTime = totalCallbacks - missed;
      var missedRate = totalCallbacks>0 ? Math.round(missed/totalCallbacks*100) : 0;
      // Callback compliance: callbacks not overdue / total callbacks
      var cbTotal = agentFollowups;
      var cbOnTime = agentFollowups - agentOverdue;
      var cbPct = cbTotal>0 ? (cbOnTime/cbTotal) : (agentFollowups===0?1:0);
      var fbPct = agentLeads.length>0 ? (agentFb/agentLeads.length) : 0;
      // Quality (0-100): activity(25) + feedback(20) + resp time(20) + meeting rate(15) + callback(20)
      var qActivity = agentLeads.length>0 ? Math.min(25,(agentActs.length/agentLeads.length)*25) : 0;
      var qFeedback = fbPct * 20;
      var qResp = respH>0 ? Math.max(0,20-respH*2) : (rtCount>0?20:10);
      var qMeeting = agentLeads.length>0 ? Math.min(15,(agentMeet/agentLeads.length)*100*0.15) : 0;
      var qCallback = cbPct * 20;
      var quality = Math.round(qActivity+qFeedback+qResp+qMeeting+qCallback);
      if (quality>100) quality=100; if (quality<0) quality=0;
      var score = quality;
      return {agentId:uid,name:u.name,leads:agentLeads.length,dr:agentDRs.length,total:agentLeads.length+agentDRs.length,calls:agentCalls,followups:agentFollowups,overdue:agentOverdue,interested:agentInt,interestedPct:ip,meetings:agentMeet,meetingPct:mp,deals:agentDeals,rotOutCount:agentRotOut,rotInCount:agentRotIn,noAnswer:agentNoAnswer,totalCallbacks:totalCallbacks,doneOnTime:doneOnTime,missed:missed,missedRate:missedRate,respTime:avgResp,score:score,quality:quality};
    }).sort(function(a,b){return b.quality-a.quality;});

    // Call outcomes — data source: Activity collection only. Filtered by createdAt in the active range.
    var actInRange = function(a){ if (!a.createdAt) return false; var t=new Date(a.createdAt).getTime(); return t>=rangeStart && t<=rangeEnd; };
    var callsRangeActs = activities.filter(function(a){return a.type==="call" && actInRange(a);});
    var statusRangeActs = activities.filter(function(a){return a.type==="status_change" && actInRange(a);});
    var callsToday = callsRangeActs.length; // kept name for response compatibility
    // Parse the explicit "[StatusCode]" tag written by the client (see status_change logger)
    var outcomeOf = function(note){
      var match = (note||"").match(/^\s*\[([^\]]+)\]/);
      if (!match) return null;
      var tag = match[1].trim();
      if (tag==="Meeting Done") return "MeetingDone";
      if (tag==="No Answer") return "NoAnswer";
      if (tag==="Hot Case") return "HotCase";
      if (tag==="Not Interested") return "NotInterested";
      if (tag==="Call Back") return "CallBack";
      return tag;
    };
    var outcomeCounts = {};
    statusRangeActs.forEach(function(a){ var o = outcomeOf(a.note); if (o) outcomeCounts[o] = (outcomeCounts[o]||0)+1; });
    var callsByOutcome = {
      hotCase: outcomeCounts.HotCase||0,
      potential: outcomeCounts.Potential||0,
      interested: (outcomeCounts.HotCase||0)+(outcomeCounts.Potential||0),
      noAnswer: outcomeCounts.NoAnswer||0,
      callBack: outcomeCounts.CallBack||0,
      notInterested: outcomeCounts.NotInterested||0,
      meetingDone: outcomeCounts.MeetingDone||0
    };
    var totalOutcomes = statusRangeActs.length;
    var answered = Math.max(0, callsToday - callsByOutcome.noAnswer);
    var answerRate = callsToday>0 ? Math.round(answered/callsToday*100) : 0;
    var invalidPct = totalOutcomes>0 ? Math.round(callsByOutcome.notInterested/totalOutcomes*100) : 0;
    var intCalls = callsByOutcome.interested;

    // Leads by status — ONE status per lead, taken from the current agent's assignment.
    // Date filter uses that assignment's assignedAt so rotations during the period shift the lead into the new agent's bucket.
    var statusCounts={};
    var normalizeSt = function(st){
      if (st==="Meeting Done") return "MeetingDone";
      if (st==="No Answer") return "NoAnswer";
      if (st==="Hot Case") return "HotCase";
      if (st==="Not Interested") return "NotInterested";
      if (st==="Call Back") return "CallBack";
      return st;
    };
    leads.forEach(function(l){
      var currentAid = l.agentId && l.agentId._id ? String(l.agentId._id) : String(l.agentId||"");
      var active = currentAid ? (l.assignments||[]).find(function(a){
        var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
        return String(aid||"")===currentAid;
      }) : null;
      var at, st;
      if (active) {
        at = active.assignedAt ? new Date(active.assignedAt).getTime() : (l.createdAt?new Date(l.createdAt).getTime():0);
        st = normalizeSt(active.status || l.status || "NewLead");
      } else {
        at = l.createdAt ? new Date(l.createdAt).getTime() : 0;
        st = normalizeSt(l.status||"NewLead");
      }
      if (at<rangeStart || at>rangeEnd) return;
      statusCounts[st]=(statusCounts[st]||0)+1;
    });
    var leadsByStatus=Object.entries(statusCounts).map(function(e){return{status:e[0],count:e[1]};});

    // Lead aging — 5 buckets
    var leadAging={
      fresh:leads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt))<=DAY;}).length,
      needsFollowup:leads.filter(function(l){var t=l.createdAt?now-new Date(l.createdAt):0;return t>DAY && t<=3*DAY;}).length,
      atRisk:leads.filter(function(l){var t=l.createdAt?now-new Date(l.createdAt):0;return t>3*DAY && t<=7*DAY;}).length,
      aging:leads.filter(function(l){var t=l.createdAt?now-new Date(l.createdAt):0;return t>7*DAY && t<=30*DAY;}).length,
      expired:leads.filter(function(l){var t=l.createdAt?now-new Date(l.createdAt):0;return t>30*DAY;}).length
    };

    // Management alerts — refined per spec
    var untouchedLeadsCount = leads.filter(function(l){
      return (l.assignments||[]).length===0 || (l.assignments||[]).every(function(a){
        if (!a.lastActionAt) return true;
        if (a.assignedAt && new Date(a.lastActionAt).getTime()===new Date(a.assignedAt).getTime()) return true;
        return false;
      });
    }).length;
    var missingFeedback=leads.filter(function(l){return (l.assignments||[]).some(function(a){return !a.notes||String(a.notes).trim()==="";});}).length;
    var stale48h=leads.filter(function(l){
      var latest=0;
      (l.assignments||[]).forEach(function(a){ if(a.lastActionAt){ var t=new Date(a.lastActionAt).getTime(); if(t>latest) latest=t; } });
      if (!latest && l.lastActivityTime) latest = new Date(l.lastActivityTime).getTime();
      return latest>0 && latest<(now.getTime()-2*DAY) && l.status!=="DoneDeal" && l.status!=="NotInterested";
    }).length;
    var lockedNoRotation = leads.filter(function(l){return (l.assignments||[]).some(function(a){return a.noRotation===true;});}).length;
    var monthStartRot = new Date(now.getFullYear(),now.getMonth(),1,0,0,0,0).getTime();
    var rotAuto=0, rotManual=0;
    leads.forEach(function(l){
      (l.agentHistory||[]).forEach(function(h){
        if (!h||h.action!=="Rotation") return;
        var ht = h.date?new Date(h.date).getTime():0;
        if (ht<monthStartRot) return;
        if ((h.reason||"").toString().toLowerCase()==="manual") rotManual++; else rotAuto++;
      });
    });
    var rotationsMonth = rotAuto + rotManual;
    var leadsPerAgent=agentPerf.map(function(a){return a.leads;});
    var avgLeads=leadsPerAgent.length>0?leadsPerAgent.reduce(function(s,x){return s+x;},0)/leadsPerAgent.length:0;
    var overloaded=agentPerf.filter(function(a){return a.leads>avgLeads*1.3;}).length;

    // Top-level callback compliance — current-assignment per lead + all DRs, over the full period range.
    var cbScheduled=0, cbMissed=0;
    leads.forEach(function(l){
      var currentAid = l.agentId && l.agentId._id ? String(l.agentId._id) : String(l.agentId||"");
      if (!currentAid) return;
      var active = (l.assignments||[]).find(function(a){
        var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
        return String(aid||"")===currentAid;
      });
      if (!active || !active.callbackTime) return;
      var cb = new Date(active.callbackTime).getTime();
      if (isNaN(cb)) return;
      if (cb<rangeStart || cb>periodEnd) return;
      cbScheduled++;
      var stillCallBack = active.status==="CallBack" || active.status==="Call Back";
      if (cb<now.getTime() && stillCallBack) cbMissed++;
    });
    drs.forEach(function(r){
      if (!r.callbackTime) return;
      var cb = new Date(r.callbackTime).getTime();
      if (isNaN(cb)) return;
      if (cb<rangeStart || cb>periodEnd) return;
      cbScheduled++;
      var stillCallBack = r.status==="CallBack" || r.status==="Call Back";
      if (cb<now.getTime() && stillCallBack) cbMissed++;
    });
    var cbDoneOnTime = cbScheduled - cbMissed;
    var cbComplianceRate = cbScheduled>0 ? Math.round(cbDoneOnTime/cbScheduled*100) : 0;
    // Leaderboard: include every sales/team_leader/manager agent (even with 0 callbacks), sorted worst-first
    var cbLeaderboard = agentPerf.slice().sort(function(a,b){ if (b.missed!==a.missed) return b.missed-a.missed; return (b.totalCallbacks||0)-(a.totalCallbacks||0); }).map(function(a){return {agentId:a.agentId,name:a.name,totalCallbacks:a.totalCallbacks||0,doneOnTime:a.doneOnTime||0,missed:a.missed||0,missedRate:a.missedRate||0};});

    res.json({
      filter,rangeStart,rangeEnd,
      callbackCompliance:{scheduled:cbScheduled,scheduledToday:cbScheduled,doneOnTime:cbDoneOnTime,missed:cbMissed,complianceRate:cbComplianceRate,leaderboard:cbLeaderboard},
      kpis:{leadsToday,drToday,drCount,dealsCount,contactedCount,callbacksToday,meetingsToday,interestedToday,dealsMonth,convRate,contactedPct:leads.length>0?Math.round(contacted/leads.length*100):0},
      campaignPerformance,funnel,
      hotAlerts:{untouched48h,overdueCallbacks,noRotationCount},
      agentPerformance:agentPerf,
      calls:{today:callsToday,answered,answerRate,invalidPct,totalOutcomes,byOutcome:callsByOutcome,interested:intCalls},
      leadsByStatus,leadAging,
      managementAlerts:{untouched:untouchedLeadsCount,missingFeedback,stale48h,rotationsMonth,rotationsAuto:rotAuto,rotationsManual:rotManual,lockedNoRotation,overloadedAgents:overloaded}
    });
  } catch(e){console.error("dashboard/admin error:",e.message);res.status(500).json({error:e.message});}
});

app.get("/api/dashboard/sales", auth, async function(req, res) {
  try {
    var uid = req.user.id; var role = req.user.role; var now = new Date(); var DAY=86400000; var MONTH=30*DAY;
    var todayStart = new Date(); todayStart.setHours(0,0,0,0);

    // Scope: sales see only themselves; hierarchy roles see self + chain.
    var scopeIds = (["team_leader","manager","director"].indexOf(role) >= 0)
      ? await visibleAgentIds(uid)
      : [new mongoose.Types.ObjectId(uid)];
    var scopeIdStrs = scopeIds.map(function(x){ return String(x); });

    var myLeads = await Lead.find({archived:false, agentId:{$in: scopeIds}}).lean();
    var allActs = await Activity.find({userId:{$in: scopeIds}}).lean();
    var allUsers = await User.find({active:true,role:{$in:["sales","sales_admin"]}}).lean();
    var allLeads = await Lead.find({archived:false}).lean();

    // Returns the assignment slice owned by whichever chain member currently holds the lead.
    var getMyAssign = function(l){return (l.assignments||[]).find(function(a){
      var aid = String(a.agentId&&a.agentId._id?a.agentId._id:a.agentId);
      return scopeIdStrs.indexOf(aid) >= 0;
    });};

    // KPIs
    var myDr = allActs.filter(function(a){return a.type==="daily_request";}).length;
    var followupsDue = myLeads.filter(function(l){var cb=l.callbackTime;return cb&&!l.archived;}).length;
    var overdueFollowups = myLeads.filter(function(l){return l.callbackTime&&!l.archived&&new Date(l.callbackTime)<now;}).length;
    var interested = myLeads.filter(function(l){var a=getMyAssign(l);var st=a?a.status:l.status;return ["HotCase","Potential","MeetingDone","DoneDeal"].includes(st);}).length;
    // Permanent meeting source: count any lead that has EVER reached
    // MeetingDone (hadMeeting flag) plus leads that went directly to
    // DoneDeal. Legacy rows without the flag fall back to current status.
    var meetings = myLeads.filter(function(l){
      if(l.hadMeeting===true) return true;
      var a=getMyAssign(l); var st=a?a.status:l.status;
      return st==="MeetingDone"||st==="DoneDeal";
    }).length;
    var ip = myLeads.length>0?Math.round(interested/myLeads.length*100):0;
    var meetRate = myLeads.length>0?Math.round(meetings/myLeads.length*100):0;

    // Weekly data (last 7 days)
    var weeklyData={leads:[],dr:[],interested:[],meetings:[]};
    for(var i=6;i>=0;i--){
      var dayStart=new Date(now); dayStart.setDate(dayStart.getDate()-i); dayStart.setHours(0,0,0,0);
      var dayEnd=new Date(dayStart); dayEnd.setHours(23,59,59,999);
      weeklyData.leads.push(myLeads.filter(function(l){var t=new Date(l.createdAt);return t>=dayStart&&t<=dayEnd;}).length);
      weeklyData.dr.push(allActs.filter(function(a){var t=new Date(a.createdAt);return a.type==="daily_request"&&t>=dayStart&&t<=dayEnd;}).length);
      weeklyData.interested.push(allActs.filter(function(a){var t=new Date(a.createdAt);return t>=dayStart&&t<=dayEnd;}).length);
      weeklyData.meetings.push(myLeads.filter(function(l){
        // Prefer the permanent meetingDoneAt stamp; fall back to updatedAt +
        // current-status for legacy rows without the hadMeeting flag.
        if(l.hadMeeting===true){
          var tm=new Date(l.meetingDoneAt||l.updatedAt||0);
          return tm>=dayStart&&tm<=dayEnd;
        }
        var t=new Date(l.updatedAt);
        return (l.status==="MeetingDone"||l.status==="DoneDeal")&&t>=dayStart&&t<=dayEnd;
      }).length);
    }

    // Rank vs team
    var getRank=function(arr,myVal,higher){arr.sort(function(a,b){return higher?b-a:a-b;});var pos=arr.indexOf(myVal)+1;return{position:pos,total:arr.length};};
    var allAgentLeads=allUsers.map(function(u){return allLeads.filter(function(l){return l.assignments&&l.assignments.some(function(a){return String(a.agentId)===String(u._id);});}).length;});
    var allAgentActs=allUsers.map(function(u){return 0;});
    var myActCount=allActs.filter(function(a){return a.createdAt&&(now-new Date(a.createdAt))<MONTH;}).length;
    var myFollowups=allActs.filter(function(a){return a.type==="followup"&&a.createdAt&&(now-new Date(a.createdAt))<MONTH;}).length;
    var respTimes=myLeads.map(function(l){var fa=allActs.filter(function(a){return String(a.leadId)===String(l._id);}).sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);})[0];if(!fa)return null;return(new Date(fa.createdAt)-new Date(l.createdAt))/(1000*3600);}).filter(function(x){return x!==null&&x>0;});
    var avgResp=respTimes.length>0?(respTimes.reduce(function(s,x){return s+x;},0)/respTimes.length).toFixed(1):null;

    // Urgent leads
    var urgent=[];
    myLeads.forEach(function(l){
      if(l.callbackTime&&new Date(l.callbackTime)<now&&!l.archived){urgent.push({leadId:String(l._id),name:l.name,type:"overdue",minutesLate:Math.round((now-new Date(l.callbackTime))/60000),status:l.status});}
      else if(l.callbackTime&&(new Date(l.callbackTime)-now)<30*60000&&new Date(l.callbackTime)>now){urgent.push({leadId:String(l._id),name:l.name,type:"soon",minutesLate:Math.round((new Date(l.callbackTime)-now)/60000),status:l.status});}
      else if(l.status==="NewLead"&&l.createdAt&&(now-new Date(l.createdAt))>2*3600000){urgent.push({leadId:String(l._id),name:l.name,type:"new",minutesLate:Math.round((now-new Date(l.createdAt))/3600000),status:l.status});}
    });
    urgent.sort(function(a,b){return a.type==="overdue"?-1:b.type==="overdue"?1:0;});

    // Schedule today
    var schedule=myLeads.filter(function(l){return l.callbackTime&&!l.archived;}).map(function(l){return{time:l.callbackTime,leadId:String(l._id),name:l.name,status:l.status};}).sort(function(a,b){return new Date(a.time)-new Date(b.time);}).slice(0,10);

    // My leads by status
    var statusMap={};
    myLeads.forEach(function(l){var a=getMyAssign(l);var st=a?a.status:l.status;statusMap[st]=(statusMap[st]||0)+1;});
    var myLeadsByStatus=Object.entries(statusMap).map(function(e){return{status:e[0],count:e[1]};});

    // Recent activity
    var recentActivity=allActs.slice(-20).reverse().map(function(a){var lead=myLeads.find(function(l){return String(l._id)===String(a.leadId);});return lead?{leadId:String(a.leadId),name:lead.name,status:lead.status,note:a.note,time:a.createdAt}:null;}).filter(Boolean).slice(0,8);

    // Funnel
    var funnel={assigned:myLeads.length,contacted:myLeads.filter(function(l){var a=getMyAssign(l);var st=a?a.status:l.status;return st!=="NewLead";}).length,interested:interested,hotCase:myLeads.filter(function(l){var a=getMyAssign(l);var st=a?a.status:l.status;return st==="HotCase";}).length,meeting:meetings,deal:myLeads.filter(function(l){return l.status==="DoneDeal";}).length};

    res.json({
      kpis:{myLeads:myLeads.length,myDr,followupsDue,overdueFollowups,interested,interestedPct:ip,meetings,meetingRate:meetRate},
      weeklyData,
      rank:{activity:{position:1,total:allUsers.length},followups:{position:1,total:allUsers.length},meetings:{position:meetings>0?1:2,total:allUsers.length},respTime:{position:1,total:allUsers.length},target:{position:1,total:allUsers.length}},
      urgent:urgent.slice(0,8),schedule,myLeadsByStatus,recentActivity,funnel,
      monthlySummary:{totalActions:myActCount,followupsDone:myFollowups,meetings,avgRespTime:avgResp}
    });
  } catch(e){console.error("dashboard/sales error:",e.message);res.status(500).json({error:e.message});}
});


// ===== START SERVER + WEBSOCKET =====
var PORT = process.env.PORT || 5000;
var httpServer = http.createServer(app);
var wss = new WebSocketLib.Server({ server: httpServer });
wss.on("connection", function(ws){
  ws.isAlive = true;
  ws.userId = null;
  ws.role = null;
  ws.on("pong", function(){ ws.isAlive = true; });
  // Auth handshake: client must send {type:"auth", token} after connect.
  // Until authenticated, the client receives only the hello greeting.
  ws.on("message", function(raw){
    try {
      var msg = JSON.parse(raw.toString());
      if (msg && msg.type === "auth" && msg.token) {
        try {
          var decoded = jwt.verify(msg.token, process.env.JWT_SECRET || "secret");
          ws.userId = String(decoded.id || "");
          ws.role = String(decoded.role || "");
          try { ws.send(JSON.stringify({ type: "auth_ok", ts: Date.now() })); } catch(e){}
        } catch(e) {
          try { ws.send(JSON.stringify({ type: "auth_failed", ts: Date.now() })); } catch(e){}
        }
      }
    } catch(e){}
  });
  ws.send(JSON.stringify({ type: "hello", ts: Date.now() }));
});
// Keepalive ping — drops dead sockets so broadcast() doesn't write to closed connections.
setInterval(function(){
  wss.clients.forEach(function(client){
    if (client.isAlive === false) { try { client.terminate(); } catch(e){} return; }
    client.isAlive = false;
    try { client.ping(); } catch(e){}
  });
}, 30000);

// Per-client filter for events that carry lead/DR documents. Sales must only
// receive events for documents currently assigned to them; everyone else
// (admin / sales_admin / manager / team_leader) gets the unfiltered firehose.
var clientShouldReceive = function(client, type, data){
  if (!client) return false;
  // Apply sales-style restrictions to any unauthenticated socket too — fail closed.
  var restrict = (client.role === "sales") || !client.role;
  if (!restrict) return true;
  // Block rotation activity entirely from sales — they have no UI for it
  // and the payload exposes other agents' identities.
  if (type === "rotation_updated") return false;
  if (type === "lead_updated") {
    var lead = data && data.lead;
    if (!lead) return false; // id-only payload — cannot prove ownership, drop
    var aid = lead.agentId && lead.agentId._id ? lead.agentId._id : lead.agentId;
    return !!aid && !!client.userId && String(aid) === client.userId;
  }
  if (type === "dr_updated") {
    var dr = data && data.dr;
    if (!dr) return false;
    var did = dr.agentId && dr.agentId._id ? dr.agentId._id : dr.agentId;
    return !!did && !!client.userId && String(did) === client.userId;
  }
  // lead_deleted / dr_deleted carry only an id — safe to forward so clients can prune.
  return true;
};

// Replace the placeholder broadcaster with the real one.
broadcast = function(type, data){
  var payload;
  try { payload = JSON.stringify({ type: type, data: data || {}, ts: Date.now() }); } catch(e){ return; }
  wss.clients.forEach(function(client){
    if (client.readyState !== WebSocketLib.OPEN) return;
    if (!clientShouldReceive(client, type, data)) return;
    try { client.send(payload); } catch(e){}
  });
};
httpServer.listen(PORT, function() {
  console.log("CRM ARO Server + WebSocket running on port " + PORT);
});