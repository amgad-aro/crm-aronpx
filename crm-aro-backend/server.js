require("dotenv").config();
var express = require("express");
var mongoose = require("mongoose");
var cors = require("cors");
var compression = require("compression");
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
  role:{type:String,enum:["admin","sales_admin","director","manager","team_leader","sales","viewer"],default:"sales"},
  title:{type:String,default:""}, active:{type:Boolean,default:true},
  monthlyTarget:{type:Number,default:15}, teamId:{type:String,default:""}, teamName:{type:String,default:""}, lastSeen:{type:Date,default:null}, lastActive:{type:Date,default:null}, qTargets:{type:Object,default:{}}, reportsTo:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
  startingDate:{type:Date,default:null}
},{timestamps:true}));

var Lead = mongoose.model("Lead", new mongoose.Schema({
  name:{type:String,required:true}, phone:{type:String,required:true}, phone2:{type:String,default:""},
  email:{type:String,default:""}, status:{type:String,default:"NewLead"},
  source:{type:String,default:"Facebook"}, project:{type:String,default:""}, unitType:{type:String,default:""}, campaign:{type:String,default:""},
  // Inbound webhook fields — populated by POST /api/leads/inbound when leads
  // arrive from facebook/instagram/tiktok/snapchat/whatsapp. externalId is the
  // platform's lead id (used together with source for dedupe).
  externalId:{type:String,default:""}, formId:{type:String,default:""},
  adName:{type:String,default:""}, adsetName:{type:String,default:""},
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
    agentHistory:{type:[mongoose.Schema.Types.Mixed],default:[]},
    // Sibling rule to the Phase P 7-day staleness check. Set true by the
    // admin-triggered POST /api/agents/:id/unassign-all-leads endpoint to
    // produce the same hide-effect immediately. Read-time only — checked
    // alongside isAssignmentStale in the same call sites; bypassed by
    // isEoiOrDoneDeal exactly like the 7-day rule. Sticky: cleared only by
    // a fresh $push of the slice (rotation), never auto-cleared.
    hiddenManually:{type:Boolean,default:false},
    // Author of the slice's CURRENT notes/lastFeedback. Set by the feedback
    // endpoint when a manager writes to this slice; cleared (set to the slice's
    // own agent) when the agent themselves writes via PUT. Empty strings/null
    // when the agent wrote (legacy + sales path) — UI uses this to render a
    // "from <Manager>" tag for the agent.
    notesAuthorId:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
    notesAuthorName:{type:String,default:""},
    notesAuthorRole:{type:String,default:""}
  }],
  // Author-scoped private notes. Each entry visible to its author only —
  // server filters at read time on every endpoint that returns the lead.
  // Append-only; managers cannot delete other managers' entries.
  privateNotes:[{
    authorId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    authorName:{type:String,default:""},
    authorRole:{type:String,default:""},
    text:{type:String,required:true},
    createdAt:{type:Date,default:Date.now}
  }],
  previousAgentIds:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  globalStatus:{type:String,default:"active"},
  expiresAt:{type:Date,default:null},
  // Manual Assignment Window: when settings.manualAssignmentWindowMinutes > 0
  // and a new lead is created without an agent, the lead goes into an
  // "unassigned queue" for admins to manually assign. After this timestamp
  // passes, the background sweeper auto-rotates it to Tier 1.
  manualWindowExpiresAt:{type:Date,default:null,index:true}
},{timestamps:true}));

// Indexes for query performance
Lead.collection.createIndex({ "assignments.agentId": 1 }).catch(function(){});
Lead.collection.createIndex({ agentId: 1 }).catch(function(){});
Lead.collection.createIndex({ createdAt: -1 }).catch(function(){});
Lead.collection.createIndex({ globalStatus: 1 }).catch(function(){});
Lead.collection.createIndex({ archived: 1, agentId: 1 }).catch(function(){});
Lead.collection.createIndex({ "assignments.agentId": 1, createdAt: -1 }).catch(function(){});

// Reports — Phase 1: speed up KPI / Funnel / Source-ROI aggregations.
// status+createdAt covers period-bounded "deals in range" and "leads in range" queries.
// source+status covers source-filtered status counts driving Source ROI.
Lead.collection.createIndex({ status: 1, createdAt: -1 }).catch(function(){});
Lead.collection.createIndex({ source: 1, status: 1 }).catch(function(){});

// Inbound dedupe — sparse so manually-created leads (no externalId) don't share
// the index. Compound (externalId, source) matches the inbound dedupe query and
// allows the same external id across different platforms.
Lead.collection.createIndex(
  { externalId: 1, source: 1 },
  { sparse: true, partialFilterExpression: { externalId: { $type: "string", $gt: "" } }, name: "inbound_externalId_source" }
).catch(function(e){
  console.error("[externalId index] not created:", e && e.message ? e.message : e);
});

// Phase II indexes — User.reportsTo + Lead.splitAgent2Id (Activity + DailyRequest
// indexes registered further down once those models are declared).
User.collection.createIndex({ reportsTo: 1 }).catch(function(){});
Lead.collection.createIndex({ splitAgent2Id: 1 }).catch(function(){});
Lead.collection.createIndex({ splitAgent2Id: 1, createdAt: -1 }).catch(function(){});

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

// SettingsAudit — one row per changed field on a settings save. Powers the
// Settings → Audit Log tab and the rollback endpoint.
var settingsAuditSchema = new mongoose.Schema({
  timestamp:  { type: Date, default: Date.now, index: -1 },
  actorId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actorName:  { type: String, default: "" },
  field:      { type: String, required: true },
  oldValue:   { type: mongoose.Schema.Types.Mixed },
  newValue:   { type: mongoose.Schema.Types.Mixed },
  rolledBack: { type: Boolean, default: false }
}, { timestamps: true });
var SettingsAudit = mongoose.model("SettingsAudit", settingsAuditSchema);

// AgentVacation — per-agent date ranges where the agent is excluded from
// auto-rotation. Admin / Sales Admin write; rotation picker reads via
// isOnVacation() (30s cached) + a per-sweep bulk prefetch.
var agentVacationSchema = new mongoose.Schema({
  agentId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },
  reason:    { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
agentVacationSchema.index({ agentId: 1, endDate: 1 });
var AgentVacation = mongoose.model("AgentVacation", agentVacationSchema);

// Flatten a plain object into dotted-path leaves. Arrays are treated as leaf
// values (compared as a whole) so an audit entry for "tiers.tier1.agents"
// captures the full before/after list in one row.
function flattenSettings(obj, prefix, out) {
  out = out || {};
  prefix = prefix || "";
  if (obj === null || obj === undefined) { if (prefix) out[prefix] = obj; return out; }
  if (Array.isArray(obj) || typeof obj !== "object" || obj instanceof Date) {
    if (prefix) out[prefix] = obj;
    return out;
  }
  var keys = Object.keys(obj);
  if (keys.length === 0) { if (prefix) out[prefix] = obj; return out; }
  keys.forEach(function(k){
    flattenSettings(obj[k], prefix ? prefix + "." + k : k, out);
  });
  return out;
}

// Rotation pointers are bumped on every lead rotation tick — excluded so they
// don't drown real admin edits in the audit log.
var AUDIT_IGNORE_FIELDS = {
  "lastAssignedIdx": true,
  "tiers.tier1.lastIdx": true,
  "tiers.tier2.lastIdx": true,
  "tiers.tier3.lastIdx": true
};

function diffSettings(prev, next) {
  var a = flattenSettings(prev || {});
  var b = flattenSettings(next || {});
  var paths = {};
  Object.keys(a).forEach(function(k){ paths[k] = true; });
  Object.keys(b).forEach(function(k){ paths[k] = true; });
  var changes = [];
  Object.keys(paths).forEach(function(p){
    if (AUDIT_IGNORE_FIELDS[p]) return;
    var oldV = a[p];
    var newV = b[p];
    if (JSON.stringify(oldV) === JSON.stringify(newV)) return;
    changes.push({ field: p, oldValue: oldV === undefined ? null : oldV, newValue: newV === undefined ? null : newV });
  });
  return changes;
}

var DailyRequest = mongoose.model("DailyRequest", new mongoose.Schema({
  name:{type:String,required:true}, phone:{type:String,required:true}, phone2:{type:String,default:""},
  email:{type:String,default:""}, budget:{type:String,default:""}, propertyType:{type:String,default:""}, unitType:{type:String,default:""},
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

// Phase II indexes — Activity + DailyRequest. Declared here because the models
// above are referenced; matches the additive pattern used for Lead at the top
// of this file.
Activity.collection.createIndex({ userId: 1, createdAt: -1 }).catch(function(){});
Activity.collection.createIndex({ leadId: 1, createdAt: -1 }).catch(function(){});
DailyRequest.collection.createIndex({ agentId: 1, createdAt: -1 }).catch(function(){});
DailyRequest.collection.createIndex({ createdAt: -1 }).catch(function(){});
// Reports — Phase 1: DR pipeline + intake queries by status.
DailyRequest.collection.createIndex({ status: 1, createdAt: -1 }).catch(function(){});

var app = express();
// gzip every response. Mounted first so it wraps all subsequent middleware
// and route handlers. Cuts /api/leads payload (~10 MB JSON) ~8-10x on the wire.
app.use(compression());
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
// Lightweight in-memory cache of users' active flag. The auth middleware
// re-checks active on every protected request so admin-driven inactivation
// takes effect for already-logged-in users without waiting for the 7-day
// JWT to expire. 30-second TTL bounds DB load; PUT /api/users/:id busts the
// entry on demand, so admin toggles propagate within milliseconds.
var userActiveCache = {};
var USER_ACTIVE_CACHE_TTL_MS = 30 * 1000;

async function checkUserActive(userId) {
  var cached = userActiveCache[userId];
  if (cached && (Date.now() - cached.t) < USER_ACTIVE_CACHE_TTL_MS) {
    return cached.active;
  }
  try {
    var u = await User.findById(userId).select("active").lean();
    var isActive = u ? u.active !== false : false;
    userActiveCache[userId] = { active: isActive, t: Date.now() };
    return isActive;
  } catch (e) {
    // Fail open on transient DB errors — locking everyone out on a brief
    // Atlas hiccup is worse than briefly serving a deactivated user.
    return true;
  }
}

async function auth(req, res, next) {
  var apiKey = req.headers["x-api-key"] || req.query.api_key;
  if (apiKey && apiKey === process.env.INTEGRATION_API_KEY) {
    req.user = { id: "integration", role: "admin", name: "Integration" };
    return next();
  }
  var token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });
  token = token.replace("Bearer ", "");
  var decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
  var stillActive = await checkUserActive(decoded.id);
  if (!stillActive) {
    return res.status(401).json({ error: "Account deactivated", code: "deactivated" });
  }
  req.user = decoded;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "sales_admin" && req.user.role !== "manager" && req.user.role !== "team_leader") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

// Vacation admin gate — tighter than adminOnly. Managers/TLs intentionally
// excluded; only full Admin or Sales Admin can create/delete vacations.
function vacationAdmin(req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "sales_admin") {
    return res.status(403).json({ error: "Admin or Sales Admin only" });
  }
  next();
}

// isOnVacation(agentId) — 30s cached lookup used outside the rotation picker.
// Inside the picker we do a single bulk prefetch per sweep instead (see
// auto-rotate / autoAssignQueuedLead). Cache is invalidated on any write to
// /api/vacations via bustVacationCache().
var _vacCache = { at: 0, activeIds: null };
function bustVacationCache() { _vacCache.at = 0; _vacCache.activeIds = null; }
async function isOnVacation(agentId) {
  try {
    var now = Date.now();
    if (!_vacCache.activeIds || (now - _vacCache.at) > 30000) {
      var d = new Date();
      var rows = await AgentVacation.find({
        startDate: { $lte: d }, endDate: { $gte: d }
      }).select("agentId").lean();
      _vacCache.activeIds = new Set(rows.map(function(r){ return String(r.agentId); }));
      _vacCache.at = now;
    }
    return _vacCache.activeIds.has(String(agentId));
  } catch (e) {
    return false; // fail-safe: DB error must not halt rotation
  }
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

// ===== REASSIGNMENT INVARIANTS =====
// Single source of truth for "has this agent ever held this lead?". Used by
// every reassign endpoint — /rotate, /auto-rotate, /bulk-reassign, and the
// PUT /api/leads/:id fallback — so the "no return to previous agent" rule is
// uniformly enforced. Admin override (force flag) bypasses, but the caller is
// responsible for logging that override into the history timeline.
function wasPreviouslyAssigned(lead, agentId) {
  if (!lead || !agentId) return false;
  var id = String(agentId);
  var prevIds = (lead.previousAgentIds || []).map(function(x){ return String(x); });
  var assignedIds = (lead.assignments || []).map(function(a){
    var aid = a && a.agentId && a.agentId._id ? a.agentId._id : (a && a.agentId);
    return String(aid || "");
  });
  return prevIds.indexOf(id) >= 0 || assignedIds.indexOf(id) >= 0;
}

// ===== FEEDBACK TARGET PERMISSION HELPER =====
// Validates whether `caller` (admin/sales_admin/manager/team_leader) is
// allowed to address `targetUser` via "Send to specific sales" on the
// feedback endpoint. Targets must be active sales agents; managers can only
// reach sales in their own org (direct reports OR sales reporting through
// their team leaders); team_leaders can only reach their direct reports.
// Returns { ok, reason }.
async function canSendFeedbackToTarget(callerRole, callerId, targetUser) {
  if (!targetUser || !targetUser.active) return { ok: false, reason: "target_inactive" };
  if (targetUser.role !== "sales") return { ok: false, reason: "target_not_sales" };
  // sales_admin is read-only — gate is also at the endpoint, but exclude here too.
  if (callerRole === "sales_admin") return { ok: false, reason: "sales_admin_read_only" };
  if (callerRole === "admin") return { ok: true };
  var targetReportsTo = targetUser.reportsTo;
  if (!targetReportsTo) return { ok: false, reason: "target_has_no_manager" };
  var trtStr = String(targetReportsTo._id || targetReportsTo);
  var callerStr = String(callerId);
  if (callerRole === "team_leader") {
    return trtStr === callerStr ? { ok: true } : { ok: false, reason: "target_not_in_tl_team" };
  }
  if (callerRole === "manager") {
    if (trtStr === callerStr) return { ok: true };
    // target reports to a TL — check if that TL reports to this manager.
    var tl = await User.findById(trtStr).select("reportsTo role").lean();
    if (tl && String(tl.reportsTo || "") === callerStr) return { ok: true };
    return { ok: false, reason: "target_not_in_manager_org" };
  }
  return { ok: false, reason: "caller_role_not_managerial" };
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
  // Round-robin pointer for the flattened Tier2+Tier3 pool. Count-based picker
  // uses this when rotationCount >= 2, or when rotationCount < 2 but all
  // Tier 1 agents have already handled the lead.
  combined23LastIdx: -1,
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
  rotationStopAfterDays: 45,
  // Minutes the admin has to manually assign a newly-created lead before the
  // background sweeper auto-rotates it to Tier 1. 0 = disabled (legacy behavior
  // — new leads without an agent are unassigned/immediate-rotate as before).
  manualAssignmentWindowMinutes: 15,
  // Phase Q — days of inactivity by the holding agent after which a lead
  // disappears from sales / manager / team_leader views. Admin / sales_admin
  // are exempt. Visibility filter only — does NOT trigger rotation.
  staleLeadDays: 7
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
    combined23LastIdx: (typeof v.combined23LastIdx === "number") ? v.combined23LastIdx : -1,
    tiers: tiers,
    autoRotationEnabled:     v.autoRotationEnabled !== false,
    autoRotationPausedUntil: v.autoRotationPausedUntil || null,
    workingHours:            Object.assign({}, D.workingHours, v.workingHours || {}),
    smartSkipRules:          Object.assign({}, D.smartSkipRules, v.smartSkipRules || {}),
    rotationStopAfterDays:   Number(v.rotationStopAfterDays != null ? v.rotationStopAfterDays : D.rotationStopAfterDays),
    manualAssignmentWindowMinutes: Number(v.manualAssignmentWindowMinutes != null ? v.manualAssignmentWindowMinutes : D.manualAssignmentWindowMinutes),
    staleLeadDays: Number(v.staleLeadDays != null ? v.staleLeadDays : D.staleLeadDays)
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
      // Server-managed pointer; never sent from UI. Preserve across writes.
      combined23LastIdx: (typeof prevValue.combined23LastIdx === "number") ? prevValue.combined23LastIdx : -1,
      tiers: tiers,
      autoRotationEnabled:     b.autoRotationEnabled !== false,
      autoRotationPausedUntil: b.autoRotationPausedUntil ? new Date(b.autoRotationPausedUntil) : null,
      workingHours:            wh,
      smartSkipRules:          sr,
      rotationStopAfterDays:   clamp(b.rotationStopAfterDays, D.rotationStopAfterDays, 1, 3650),
      manualAssignmentWindowMinutes: clamp(b.manualAssignmentWindowMinutes, D.manualAssignmentWindowMinutes, 0, 120),
      // Phase Q — fall back to previously stored value when input is missing
      // or invalid (clamp returns its `def` arg on NaN / out-of-range).
      staleLeadDays: clamp(b.staleLeadDays, (typeof prevValue.staleLeadDays === "number" ? prevValue.staleLeadDays : D.staleLeadDays), 1, 365)
    };
    await AppSetting.findOneAndUpdate({ key: "rotation" }, { $set: { value: value } }, { upsert: true, new: true });
    try {
      var changes = diffSettings(prevValue, value);
      if (changes.length) {
        var actorName = (req.user && req.user.name) ? req.user.name : "Admin";
        var actorId   = (req.user && req.user.id) ? req.user.id : null;
        var rows = changes.map(function(c){
          return { actorId: actorId, actorName: actorName, field: c.field, oldValue: c.oldValue, newValue: c.newValue, timestamp: new Date() };
        });
        await SettingsAudit.insertMany(rows, { ordered: false });
      }
    } catch (auditErr) {
      console.error("[settings audit]", auditErr && auditErr.message ? auditErr.message : auditErr);
    }
    try { broadcast("settings_updated", { key: "rotation", value: value }); } catch(e) {}
    res.json(value);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== SETTINGS AUDIT LOG =====
// Admin + Sales Admin can read. Returns the 200 most recent entries newest first.
app.get("/api/settings/audit", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin" && req.user.role !== "sales_admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    var rows = await SettingsAudit.find({}).sort({ timestamp: -1 }).limit(200).populate("actorId", "name").lean();
    var out = rows.map(function(r){
      var name = r.actorName;
      if (!name && r.actorId && typeof r.actorId === "object" && r.actorId.name) name = r.actorId.name;
      return {
        _id: r._id,
        timestamp: r.timestamp,
        actorId: r.actorId && r.actorId._id ? r.actorId._id : r.actorId,
        actorName: name || "",
        field: r.field,
        oldValue: r.oldValue,
        newValue: r.newValue,
        rolledBack: !!r.rolledBack
      };
    });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rollback a single audit entry: reapply its oldValue at `field` on the
// rotation settings doc, mark the original entry rolledBack, and log a new
// audit entry describing the rollback itself.
app.post("/api/settings/audit/:id/rollback", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    var entry = await SettingsAudit.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Audit entry not found" });
    if (entry.rolledBack) return res.status(400).json({ error: "Already rolled back" });
    // The rollback path below is hardcoded to the rotation AppSetting doc.
    // projectWeights audit rows (field prefix "projectWeights.") cannot be
    // rolled back this way without writing to the wrong doc — guard
    // explicitly. Re-saving via the Commission Projects flow reverts the
    // change cleanly.
    if (entry.field && String(entry.field).indexOf("projectWeights.") === 0) {
      return res.status(400).json({ error: "Rollback not yet supported for project-weight changes — re-save via Commission Projects" });
    }

    var path = "value." + entry.field;
    var setOp = {}; setOp[path] = entry.oldValue;
    await AppSetting.findOneAndUpdate({ key: "rotation" }, { $set: setOp }, { upsert: true });

    entry.rolledBack = true;
    await entry.save();

    try {
      await SettingsAudit.create({
        actorId: (req.user && req.user.id) ? req.user.id : null,
        actorName: (req.user && req.user.name) ? req.user.name : "Admin",
        field: entry.field,
        oldValue: entry.newValue,
        newValue: entry.oldValue,
        timestamp: new Date()
      });
    } catch (auditErr) {
      console.error("[settings audit rollback]", auditErr && auditErr.message ? auditErr.message : auditErr);
    }

    var updated = await getRotationSettings();
    try { broadcast("settings_updated", { key: "rotation", value: updated }); } catch(e) {}
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== PROJECT WEIGHTS (Phase 2 Slice 1) =====
// Authoritative server-side store for the per-project commission/target
// weights that DealsPage / TeamPage / KPIsPage / Dashboard my-stats apply
// to deal revenue. Replaces per-browser localStorage storage that lets
// admins drift apart and was the architectural root cause of the
// projectWeight bug. The denormalised Lead.projectWeight field stays as
// a write-through cache: this PUT cascades the weight onto every matching
// Lead doc so existing read paths (frontend helpers + my-stats endpoint)
// don't need to change.
//
// 30-second in-memory cache mirrors the _vacCache pattern (busted on PUT).
// Diff-aware audit + Lead.updateMany cascade mirrors the rotation-settings
// precedent at server.js:990.
//
// Slice 1 is server-only and additive — no frontend behavior changes
// until Slice 3 swaps the localStorage helpers. Coexists with the existing
// localStorage flow during the transition.
var _projWeightsCache = { at: 0, map: null };
function bustProjectWeightsCache() { _projWeightsCache.at = 0; _projWeightsCache.map = null; }
async function getProjectWeights() {
  var now = Date.now();
  if (!_projWeightsCache.map || (now - _projWeightsCache.at) > 30000) {
    var doc = await AppSetting.findOne({ key: "projectWeights" }).lean();
    var v = (doc && doc.value && typeof doc.value === "object") ? doc.value : {};
    var clean = {};
    Object.keys(v).forEach(function(k){
      var n = Number(v[k]);
      if (k && isFinite(n) && n >= 0 && n <= 1) clean[k] = n;
    });
    _projWeightsCache.map = clean;
    _projWeightsCache.at = now;
  }
  return Object.assign({}, _projWeightsCache.map);
}

// Phase 2 Slice 4 — resolve a project name against the AppSetting weights
// map, returning a number (the weight) or null (no match → caller should
// leave projectWeight at the schema default of 1). Only DR-mirror creation
// uses this today; native lead creation paths intentionally don't (out of
// scope for Slice 4 — Slice 1's cascade catches them post-hoc whenever a
// weight is saved). Trim is applied because the conversion form often
// passes hand-typed project names with stray whitespace; case-insensitive
// matching is intentionally NOT done because two distinct project names
// differing only in case would silently collide. If drift becomes a real
// problem we'll add a normalised lookup map later.
async function resolveDrProjectWeight(projectName) {
  var trimmed = String(projectName || "").trim();
  if (!trimmed) return null;
  try {
    var weights = await getProjectWeights();
    if (weights && (trimmed in weights)) return weights[trimmed];
  } catch (e) { /* fall through to null */ }
  return null;
}

// GET /api/settings/project-weights — any authed role.
// Returns { "Palm Hills": 0.5, ... }. Empty object when the AppSetting
// doc doesn't exist yet (Slice 2 hasn't migrated localStorage to server).
app.get("/api/settings/project-weights", auth, async function(req, res) {
  try {
    res.json(await getProjectWeights());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/settings/project-weights — admin / sales_admin only.
// Body: { "Palm Hills": 0.5, "Mountain View": 0.7 }
// Treated as a FULL-REPLACE state. Any project not in the body is reverted
// to the default weight 1 (entries equal to 1 are also dropped from storage —
// no point persisting the default). Per-key diff against previous state
// writes one SettingsAudit row each with field prefixed "projectWeights.".
// After save, a per-project Lead.updateMany cascades the weight onto
// every matching Lead doc, keeping the denormalised cache in sync.
app.put("/api/settings/project-weights", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin" && req.user.role !== "sales_admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    var body = (req.body && typeof req.body === "object") ? req.body : {};

    // Sanitize: keep entries with weight in [0, 1] and drop default-1 entries.
    var sanitized = {};
    Object.keys(body).forEach(function(k){
      var key = String(k || "").trim();
      var n = Number(body[k]);
      if (!key) return;
      if (!isFinite(n)) return;
      if (n < 0 || n > 1) return;
      if (n === 1) return; // default — don't store
      sanitized[key] = n;
    });

    var existing = await AppSetting.findOne({ key: "projectWeights" }).lean();
    var prev = (existing && existing.value && typeof existing.value === "object") ? existing.value : {};

    // Diff: any key in either set whose value changed. Treat absence as 1.
    var allKeys = {};
    Object.keys(prev).forEach(function(k){ allKeys[k] = true; });
    Object.keys(sanitized).forEach(function(k){ allKeys[k] = true; });
    var changes = [];
    Object.keys(allKeys).forEach(function(k){
      var oldV = (k in prev) ? Number(prev[k]) : 1;
      var newV = (k in sanitized) ? Number(sanitized[k]) : 1;
      if (oldV !== newV) changes.push({ project: k, oldValue: oldV, newValue: newV });
    });

    await AppSetting.findOneAndUpdate(
      { key: "projectWeights" },
      { $set: { value: sanitized }},
      { upsert: true, new: true }
    );
    bustProjectWeightsCache();

    // Cascade per changed project. Hits both native and DR-mirror leads
    // (no source filter) — same scope as the existing frontend bulk-PUT.
    for (var i = 0; i < changes.length; i++) {
      var c = changes[i];
      try {
        await Lead.updateMany({ project: c.project }, { $set: { projectWeight: c.newValue }});
      } catch (cascErr) {
        console.error("[project-weights cascade]", c.project, cascErr && cascErr.message);
      }
    }

    if (changes.length) {
      try {
        var actorName = (req.user && req.user.name) ? req.user.name : "Admin";
        var actorId   = (req.user && req.user.id)   ? req.user.id   : null;
        var rows = changes.map(function(c){
          return {
            actorId: actorId,
            actorName: actorName,
            field: "projectWeights." + c.project,
            oldValue: c.oldValue,
            newValue: c.newValue,
            timestamp: new Date()
          };
        });
        await SettingsAudit.insertMany(rows, { ordered: false });
      } catch (auditErr) {
        console.error("[project-weights audit]", auditErr && auditErr.message);
      }
    }

    try { broadcast("settings_updated", { key: "projectWeights", value: sanitized }); } catch(e) {}
    res.json(sanitized);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== AGENT VACATIONS =====
// Admin + Sales Admin manage date ranges where an agent is excluded from
// auto-rotation. Rotation integration lives in the /auto-rotate endpoint and
// the queued-lead sweeper (both check a bulk-prefetched active-vacation set).

// List upcoming + active vacations. History (past ranges) is intentionally
// not exposed for now — the admin UI only surfaces current/future entries.
app.get("/api/vacations", auth, vacationAdmin, async function(req, res) {
  try {
    var rows = await AgentVacation.find({ endDate: { $gte: new Date() } })
      .populate("agentId", "name role title")
      .populate("createdBy", "name")
      .sort({ startDate: 1 })
      .lean();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/vacations", auth, vacationAdmin, async function(req, res) {
  try {
    var b = req.body || {};
    if (!b.agentId || !mongoose.Types.ObjectId.isValid(String(b.agentId))) {
      return res.status(400).json({ error: "agentId required" });
    }
    var start = b.startDate ? new Date(b.startDate) : null;
    var end   = b.endDate   ? new Date(b.endDate)   : null;
    if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
      return res.status(400).json({ error: "startDate and endDate required" });
    }
    // startDate stays at 00:00 local (as sent). endDate is coerced to end-of-day
    // so a vacation "today → tomorrow" covers both days through 23:59:59.
    end.setHours(23, 59, 59, 999);
    if (end < start) return res.status(400).json({ error: "endDate must be >= startDate" });

    var agent = await User.findById(b.agentId).select("_id role active").lean();
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    var created = await AgentVacation.create({
      agentId:   agent._id,
      startDate: start,
      endDate:   end,
      reason:    (b.reason || "").toString().slice(0, 500),
      createdBy: (req.user && req.user.id) ? req.user.id : null
    });
    bustVacationCache();

    var full = await AgentVacation.findById(created._id)
      .populate("agentId", "name role title")
      .populate("createdBy", "name")
      .lean();
    res.json(full);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/vacations/:id", auth, vacationAdmin, async function(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(400).json({ error: "Invalid id" });
    }
    var result = await AgentVacation.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Vacation not found" });
    bustVacationCache();
    res.json({ ok: true });
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

    // Sales users — CRM-wide by default. For team_leader callers, narrow to
    // self + direct sales so the ranking shows only their team.
    var salesUsers;
    if (req.user && req.user.role === "team_leader") {
      var tlUid = new mongoose.Types.ObjectId(req.user.id);
      var tlSelf = await User.findById(tlUid).select("_id name title role active").lean();
      var tlSales = await User.find({ reportsTo: tlUid, active: { $ne: false } })
        .select("_id name title role")
        .sort({ name: 1 })
        .lean();
      salesUsers = [];
      if (tlSelf && tlSelf.active !== false) salesUsers.push(tlSelf);
      tlSales.forEach(function(u){ salesUsers.push(u); });
    } else {
      salesUsers = await User.find({ role: "sales", active: { $ne: false } })
        .select("_id name title")
        .sort({ name: 1 })
        .lean();
    }
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

    // TL scope: strict team_leader only. Everyone else keeps self-only behaviour.
    // scopeIds = [self, ...direct sales]; agentExpr/userExpr substitute in every match.
    var scopeIds = [uid];
    if (req.user.role === "team_leader") {
      var tlDirectSales = await User.find({ reportsTo: uid }).select("_id").lean();
      tlDirectSales.forEach(function(s){ scopeIds.push(s._id); });
    }
    var agentExpr = scopeIds.length > 1 ? { $in: scopeIds } : uid;
    var userExpr  = scopeIds.length > 1 ? { $in: scopeIds } : uid;

    // CARD 1 — My Leads: assigned to scope AND (createdAt OR any in-scope assignment) falls in range.
    var myLeadsPipeline = [
      { $match: { agentId: agentExpr, archived: { $ne: true }, source: { $ne: "Daily Request" } } }
    ];
    if (rangeMatch) {
      myLeadsPipeline.push({ $match: {
        $or: [
          { createdAt: rangeMatch },
          { assignments: { $elemMatch: { agentId: agentExpr, assignedAt: rangeMatch } } }
        ]
      }});
    }
    myLeadsPipeline.push({ $count: "c" });
    var myLeadsP = Lead.aggregate(myLeadsPipeline);

    // CARD 2 — Daily Requests: DRs owned by scope, created in range.
    var myDrsMatch = { agentId: agentExpr, archived: { $ne: true } };
    if (rangeMatch) myDrsMatch.createdAt = rangeMatch;
    var myDrsP = DailyRequest.countDocuments(myDrsMatch);

    // CARD 3 — Followups: mirror the notification bell (src/App.js:6790). Leads
    // assigned to scope, not archived, status not in {DoneDeal, NotInterested, EOI},
    // lastActivityTime >= 2 days ago. No range filter — same as the bell.
    var twoDaysAgo = new Date(Date.now() - 2*24*60*60*1000);
    var myFollowupsP = Lead.countDocuments({
      agentId: agentExpr,
      archived: { $ne: true },
      status: { $nin: ["DoneDeal", "NotInterested", "EOI"] },
      lastActivityTime: { $lte: twoDaysAgo }
    });

    // CARD 4 — Interested: leads + DRs with status in {HotCase, Potential},
    // agent in scope, created in range (across both collections).
    var intLeadMatch = { agentId: agentExpr, archived: { $ne: true }, status: { $in: ["Potential", "HotCase"] } };
    if (rangeMatch) intLeadMatch.createdAt = rangeMatch;
    var intLeadsP = Lead.countDocuments(intLeadMatch);
    var intDrMatch = { agentId: agentExpr, archived: { $ne: true }, status: { $in: ["Potential", "HotCase"] } };
    if (rangeMatch) intDrMatch.createdAt = rangeMatch;
    var intDrsP = DailyRequest.countDocuments(intDrMatch);

    // CARD 5 — Meetings: Meeting Done OR Meeting Scheduled.
    //   Done:       lead/DR with hadMeeting === true OR status === "MeetingDone"
    //               (dated by meetingDoneAt, falling back to updatedAt, within range).
    //   Scheduled:  Task documents with type "meeting" authored in scope, createdAt in range.
    var meetLeadPipeline = [
      { $match: { agentId: agentExpr, archived: { $ne: true }, $or: [ { hadMeeting: true }, { status: "MeetingDone" } ] } },
      { $addFields: { meetAt: { $ifNull: ["$meetingDoneAt", "$updatedAt"] } } }
    ];
    if (rangeMatch) meetLeadPipeline.push({ $match: { meetAt: rangeMatch } });
    meetLeadPipeline.push({ $count: "c" });
    var meetLeadsP = Lead.aggregate(meetLeadPipeline);
    var meetDrPipeline = [
      { $match: { agentId: agentExpr, archived: { $ne: true }, $or: [ { hadMeeting: true }, { status: "MeetingDone" } ] } },
      { $addFields: { meetAt: { $ifNull: ["$meetingDoneAt", "$updatedAt"] } } }
    ];
    if (rangeMatch) meetDrPipeline.push({ $match: { meetAt: rangeMatch } });
    meetDrPipeline.push({ $count: "c" });
    var meetDrsP = DailyRequest.aggregate(meetDrPipeline);
    var meetTaskMatch = { userId: userExpr, type: "meeting" };
    if (rangeMatch) meetTaskMatch.createdAt = rangeMatch;
    var meetSchedP = Task.countDocuments(meetTaskMatch);

    // Per-status breakdown for the "My Leads — Status" + "Conversion Funnel"
    // cards. Same scope as Card 1.
    var byStatusPipeline = [
      { $match: { agentId: agentExpr, archived: { $ne: true }, source: { $ne: "Daily Request" } } }
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

    // Target: for TL, sum quarterly targets across self + direct sales so the
    // progress bar reflects the whole team's quota. Single-doc fetch for others.
    var usersP = User.find({ _id: { $in: scopeIds } }).select("qTargets").lean();
    var myDealsPipeline = [
      { $match: {
          status: "DoneDeal",
          // Match deals where the scope is the primary agent OR the split agent.
          // The reducer below halves split deals so each side counts only their
          // share — splitAgent2Id-only matches still attribute the agent's 50%
          // toward their target.
          $or: [ { agentId: agentExpr }, { splitAgent2Id: agentExpr } ]
      } },
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
      usersP, myDealsP, byStatusP
    ]);
    var pickCount = function(arr){ return (arr && arr[0] && arr[0].c) || 0; };
    var myLeadsC    = pickCount(parts[0]);
    var myDrsC      = parts[1] || 0;
    var myFupsC     = parts[2] || 0;
    var interestedC = (parts[3]||0) + (parts[4]||0);
    var meetingsC   = pickCount(parts[5]) + pickCount(parts[6]) + (parts[7]||0);
    var scopeUsers  = parts[8] || [];
    var myDeals     = parts[9] || [];
    var byStatus = { NewLead:0, Potential:0, HotCase:0, CallBack:0, MeetingDone:0, NotInterested:0, NoAnswer:0, DoneDeal:0 };
    (parts[10] || []).forEach(function(r){ if (r && r._id) byStatus[r._id] = r.c; });

    var parseBudget = function(b){ return parseFloat(String(b||"0").replace(/,/g,"")) || 0; };
    var achieved = myDeals.reduce(function(s,d){
      var w = (typeof d.projectWeight === "number") ? d.projectWeight : 1;
      var split = d.splitAgent2Id ? 0.5 : 1;
      return s + parseBudget(d.budget) * w * split;
    }, 0);

    var target = scopeUsers.reduce(function(s,u){
      return s + ((u.qTargets && Number(u.qTargets[qKey])) || 0);
    }, 0);
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
      startingDate: req.body.startingDate || null,
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
    if (req.body.startingDate !== undefined) update.startingDate = req.body.startingDate || null;
    var user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, strict: false }).select("-password");
    // Bust the active-flag cache so a just-toggled user is rejected on their
    // very next request, not after the 30s TTL.
    if (req.body.active !== undefined) {
      delete userActiveCache[req.params.id];
    }
    emitUser(user);
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/users/:id", auth, adminOnly, async function(req, res) {
  try {
    // Orphan-safe: detach subordinates so the tree stays intact without the parent.
    await User.updateMany({ reportsTo: req.params.id }, { $set: { reportsTo: null } });
    var deletedUser = await User.findByIdAndDelete(req.params.id);
    emitUserDeleted(deletedUser);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== LEAD ROUTES =====

// Phase P — stale-lead visibility filter. Hides a lead from sales /
// manager / team_leader views once the holding agent's assignment slice
// has had no action for the configured threshold (default 7 days; tunable
// in Settings → Rotation → "Stale Lead Threshold"). Admin and sales_admin
// always see everything. VISIBILITY ONLY — rotation logic is unaffected
// and the lead's agentId / assignments[] in the DB never change because
// of this rule. When/if rotation rules eventually fire (3x NoAnswer
// streaks, callback overdue, etc. — separate code paths) the lead rotates
// normally; until then it stays technically assigned to the same agent,
// just invisible to them.
async function getStaleLeadMs() {
  var s = await getRotationSettings();
  var days = s && s.staleLeadDays ? Number(s.staleLeadDays) : 7;
  if (!days || days < 1) days = 7;
  if (days > 365) days = 365;
  return days * 24 * 60 * 60 * 1000;
}
function getAssignmentLastActionAt(a) {
  if (!a) return 0;
  var ts = 0;
  function bump(v) {
    if (!v) return;
    var t = new Date(v).getTime();
    if (!isNaN(t) && t > ts) ts = t;
  }
  bump(a.lastActionAt);
  bump(a.assignedAt);
  var hist = Array.isArray(a.agentHistory) ? a.agentHistory : [];
  for (var i = 0; i < hist.length; i++) {
    var h = hist[i];
    if (!h) continue;
    bump(h.createdAt || h.at || h.timestamp);
  }
  return ts;
}
function isAssignmentStale(a, nowMs, staleMs) {
  if (!a) return false;
  var last = getAssignmentLastActionAt(a);
  if (!last) return false;
  return (nowMs - last) > staleMs;
}
// EOIs (contract-signing stage), DoneDeals (completed sales), and cancelled
// deals must remain visible to the assigned sales regardless of activity age —
// they bypass the Phase P stale-lead filter and the manual hide flag entirely.
// The set must mirror what the Deals page (App.js DealsPage) treats as a deal,
// so a lead the agent sees on Deals never disappears from there because of
// staleness or Hide. That means: status in {EOI, DoneDeal, Deal Cancelled},
// globalStatus in {eoi, donedeal}, dealStatus === "Deal Cancelled", or any
// non-empty eoiStatus.
function isEoiOrDoneDeal(lead) {
  if (!lead) return false;
  if (lead.globalStatus === "eoi" || lead.globalStatus === "donedeal") return true;
  if (lead.status === "EOI" || lead.status === "DoneDeal" || lead.status === "Deal Cancelled") return true;
  if (lead.eoiStatus && String(lead.eoiStatus).length > 0) return true;
  if (lead.dealStatus === "Deal Cancelled") return true;
  return false;
}
// Single source of truth for "should this slice be hidden at read time?".
// Combines the Phase P staleness rule with the manual hide flag set by
// POST /api/agents/:id/unassign-all-leads. EOI/DoneDeal leads bypass both —
// preserving commission/contract visibility regardless of how the slice
// became hidden.
function isSliceHidden(lead, slice, nowMs, staleMs) {
  if (!slice) return false;
  if (isEoiOrDoneDeal(lead)) return false;
  if (slice.hiddenManually === true) return true;
  if (isAssignmentStale(slice, nowMs, staleMs)) return true;
  return false;
}
function findAssignmentForAgent(lead, agentId) {
  if (!lead || !agentId) return null;
  var aidStr = String(agentId && agentId._id ? agentId._id : agentId);
  var arr = lead.assignments || [];
  for (var i = 0; i < arr.length; i++) {
    var a = arr[i];
    if (!a) continue;
    var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
    if (String(aid) === aidStr) return a;
  }
  return null;
}

app.get("/api/leads", auth, async function(req, res) {
  try {
    var query = {};
    var role = req.user.role;
    var uid = req.user.id;
    var STALE_LEAD_MS = await getStaleLeadMs();

    if (role === "sales") {
      // Match by per-agent assignments[] slice, NOT the top-level agentId.
      // After a rotation the top-level agentId moves to the new owner, so
      // filtering on it would hide the lead from the previous agent. Matching
      // on assignments.agentId keeps the lead visible to every agent who has
      // (or ever had) an entry — each sees only their own slice via the
      // overlay below. Unassigned leads (no entries) are naturally excluded.
      // Also include leads where the caller is the split agent on a Done Deal,
      // even if they were never rotated to the lead — splits store the second
      // agent only on splitAgent2Id, with no assignments[] entry.
      // Plus a legacy-data fallback: leads with top-level agentId === caller
      // AND in a deal/EOI state but with NO assignments[] entry (pre-
      // assignments[] data — typically Done Deals migrated from older schemas).
      // These have to remain visible for commission tracking. Scoped to deal/
      // EOI states only so legacy non-deal leads don't suddenly resurface.
      var saleUid = new mongoose.Types.ObjectId(uid);
      query.$or = [
        { "assignments.agentId": saleUid },
        { splitAgent2Id: saleUid },
        { $and: [
          { agentId: saleUid },
          { $or: [
            { globalStatus: { $in: ["eoi", "donedeal"] } },
            { status: { $in: ["EOI", "DoneDeal", "Deal Cancelled"] } },
            { eoiStatus: { $nin: [null, ""] } },
            { dealStatus: "Deal Cancelled" }
          ]}
        ]}
      ];

    } else if (role === "team_leader") {
      // Team leader sees only their direct sales
      var tlUser = await User.findById(uid).lean();
      if (!tlUser) return res.status(404).json({ error: "User not found" });
      var visibleAgentIds = [tlUser._id];
      var directSales = await User.find({ reportsTo: tlUser._id }).lean();
      directSales.forEach(function(s) { visibleAgentIds.push(s._id); });
      query.$or = [
        { agentId: { $in: visibleAgentIds } },
        { splitAgent2Id: { $in: visibleAgentIds } }
      ];

    } else if (role === "manager") {
      var managerUser = await User.findById(uid).lean();
      if (!managerUser) return res.status(404).json({ error: "User not found" });

      var visibleAgentIds = [managerUser._id];

      // METHOD 1: Use reportsTo hierarchy (new system)
      var hasReportsTo = false;
      var directReports = await User.find({ reportsTo: managerUser._id }).lean();
      if (directReports.length > 0) {
        hasReportsTo = true;
        directReports.forEach(function(u) { visibleAgentIds.push(u._id); });
        // If this manager has team leaders under him, get their sales too
        if (!managerUser.reportsTo) {
          var tlIds = directReports.map(function(u) { return u._id; });
          var salesUnderTLs = await User.find({ reportsTo: { $in: tlIds } }).lean();
          salesUnderTLs.forEach(function(s) { visibleAgentIds.push(s._id); });
        }
      }

      // METHOD 2: Fallback to teamId (old system) if no reportsTo relationships found
      if (!hasReportsTo && managerUser.teamId) {
        var teamMembers = await User.find({ teamId: managerUser.teamId }).lean();
        teamMembers.forEach(function(u) { visibleAgentIds.push(u._id); });
      }

      // Deduplicate
      var uniqueIds = visibleAgentIds.filter(function(id, i, arr) {
        return arr.findIndex(function(x) { return String(x) === String(id); }) === i;
      });

      query.$or = [
        { agentId: { $in: uniqueIds } },
        { splitAgent2Id: { $in: uniqueIds } }
      ];
    }
    // admin: no filter

    // Standalone "Locked Only" filter: when set, only return leads whose
    // rotation-lock flag is true. Role-based visibility above is still
    // enforced (access control is not a user filter), but any other filter
    // query params are ignored per the standalone contract.
    // Restricted to admin / sales_admin; other roles silently have the
    // param ignored so they can't bypass the hidden UI control.
    if (req.query.lockedOnly === "true" && (role === "admin" || role === "sales_admin")) {
      query.locked = true;
    }

    // Pagination
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 1000;
    var skip = (page - 1) * limit;

    var leads = await Lead.find(query).populate("agentId", "name title teamId reportsTo").populate("assignments.agentId", "name title").sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    // Skip the second round-trip when the page already contains the entire
    // result set — the common case for sales/team_leader/manager whose visible
    // slice is well under the default limit (1000). Pagination semantics
    // preserved for callers that exceed the page.
    var total = (page === 1 && leads.length < limit)
      ? leads.length
      : await Lead.countDocuments(query);

    // Phase P — drop leads whose holding slice is stale for the requesting
    // role. Admin / sales_admin (and any other non-listed role) are exempt.
    // sales: gate on the caller's OWN slice. Split-only access (no slice,
    //   only splitAgent2Id) bypasses — the rule has no slice to evaluate.
    // manager / team_leader: gate on the lead's CURRENT holder's slice.
    // total is reduced by the page-level exclusions; for the default
    // limit (1000) this is exact, and pagination is rarely paged beyond.
    if (role === "sales" || role === "manager" || role === "team_leader") {
      var nowMsP = Date.now();
      var preCount = leads.length;
      leads = leads.filter(function(l) {
        if (role === "sales") {
          var splitId = l.splitAgent2Id && l.splitAgent2Id._id ? l.splitAgent2Id._id : l.splitAgent2Id;
          if (splitId && String(splitId) === String(uid)) return true;
          var myAssign = findAssignmentForAgent(l, uid);
          if (!myAssign) {
            // Legacy fallback (mirrors the third $or in the DB query): top-
            // level agentId owner of a deal/EOI with no slice. No slice means
            // no per-slice freshness/hide signal to evaluate, so always
            // visible — matches the principle that deals are never hidden.
            var topAgentId = l.agentId && l.agentId._id ? l.agentId._id : l.agentId;
            if (String(topAgentId || "") === String(uid) && isEoiOrDoneDeal(l)) return true;
            return false;
          }
          return !isSliceHidden(l, myAssign, nowMsP, STALE_LEAD_MS);
        }
        var holderId = l.agentId && l.agentId._id ? l.agentId._id : l.agentId;
        if (!holderId) return true;
        var holderAssign = findAssignmentForAgent(l, holderId);
        if (!holderAssign) return true;
        return !isSliceHidden(l, holderAssign, nowMsP, STALE_LEAD_MS);
      });
      total = Math.max(0, total - (preCount - leads.length));
    }

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
      // Pre-fetch caller's name so lead.history can be filtered to entries
      // authored by them only (Bug 2 — rotation events by admin must not leak).
      var salesSelf = await User.findById(uid).select({ name: 1 }).lean();
      var salesSelfName = salesSelf ? String(salesSelf.name || "") : "";
      data = leads.map(function(l) {
        var obj = Object.assign({}, l);
        var myAssign = (obj.assignments || []).find(function(a) {
          var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
          return String(aid) === String(uid);
        });
        // Legacy ownership: lead has top-level agentId === caller, no
        // assignments[] slice, and is a deal/EOI. Top-level notes/lastFeedback
        // belong to this agent (pre-assignments[] data) — preserve them. For
        // every other case, wipe to avoid leaking another agent's text.
        var topAgentIdL = obj.agentId && obj.agentId._id ? obj.agentId._id : obj.agentId;
        var isLegacyOwner = !myAssign && String(topAgentIdL || "") === String(uid) && isEoiOrDoneDeal(l);
        if (!isLegacyOwner) {
          obj.notes = "";
          obj.lastFeedback = "";
        }
        if (myAssign) {
          // Status overlay is suppressed for EOI/DoneDeal — those are lead-level
          // final states, not per-agent status. The slice's status is only
          // synced for sales/team_leader actions (see PUT /api/leads/:id slice
          // sync block); when an admin promotes a lead to DoneDeal, the slice
          // keeps its prior status. Overlaying it here would drop the lead from
          // the agent's Deals/EOI page filters (which match on l.status) even
          // though isEoiOrDoneDeal() correctly kept the lead visible. Preserve
          // the top-level status for these final states so commission tracking
          // shows up on the agent's Deals page.
          if (!isEoiOrDoneDeal(l)) {
            var assignStatus = myAssign.status === "New Lead" ? "NewLead" : myAssign.status;
            obj.status = assignStatus || obj.status;
          }
          obj.notes = myAssign.notes !== undefined ? myAssign.notes : "";
          obj.budget = myAssign.budget !== undefined ? myAssign.budget : obj.budget;
          obj.callbackTime = myAssign.callbackTime !== undefined ? myAssign.callbackTime : obj.callbackTime;
          obj.lastFeedback = myAssign.lastFeedback !== undefined ? myAssign.lastFeedback : "";
          obj.nextCallAt = myAssign.nextCallAt !== undefined ? myAssign.nextCallAt : obj.nextCallAt;
          if (myAssign.lastActionAt) obj.lastActivityTime = myAssign.lastActionAt;
          if (myAssign.assignedAt) obj.assignedAt = myAssign.assignedAt;
          // Surface the slice's notes author so the agent's UI can render a
          // "from <Manager>" tag when the current note came from above.
          obj.notesAuthorId   = myAssign.notesAuthorId   || null;
          obj.notesAuthorName = myAssign.notesAuthorName || "";
          obj.notesAuthorRole = myAssign.notesAuthorRole || "";
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
        // Sales never see privateNotes (those are author-scoped to managers).
        obj.privateNotes = [];
        // Filter lead.history: drop rotation/assignment events entirely (sales
        // must not see who held the lead before), keep only events authored by
        // the caller themselves. Sales dashboard Recent Activity / sparklines
        // already filter by byUser === myName, so this is compatible.
        obj.history = (obj.history || []).filter(function(h){
          if (!h) return false;
          var ev = String(h.event || "");
          if (ev === "rotated" || ev === "assigned" || ev === "reassigned") return false;
          if (salesSelfName && String(h.byUser || "") !== salesSelfName) return false;
          return true;
        });
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
        if (holderId) {
          var holderAssign = (obj.assignments || []).find(function(a) {
            var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
            return String(aid) === String(holderId);
          });
          if (holderAssign) {
            if (holderAssign.notes) obj.notes = holderAssign.notes;
            if (holderAssign.lastFeedback) obj.lastFeedback = holderAssign.lastFeedback;
            obj.notesAuthorId   = holderAssign.notesAuthorId   || null;
            obj.notesAuthorName = holderAssign.notesAuthorName || "";
            obj.notesAuthorRole = holderAssign.notesAuthorRole || "";
          }
        }
        // Per-author privateNotes filter — each manager only ever sees their own.
        obj.privateNotes = (obj.privateNotes || []).filter(function(n) {
          var aid = n && n.authorId && n.authorId._id ? n.authorId._id : (n && n.authorId);
          return String(aid || "") === String(uid);
        });
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

// ===== BACKFILL LAST FEEDBACK =====
// Must be registered BEFORE /api/leads/:id — otherwise Express matches the
// ":id" pattern first and tries to ObjectId-cast "backfill-feedback".
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

// ===== SINGLE LEAD GET (with per-agent overlay) =====
app.get("/api/leads/:id", auth, async function(req, res) {
  try {
    var lead = await Lead.findById(req.params.id).populate("agentId", "name title teamId reportsTo").populate("assignments.agentId", "name title").lean();
    if (!lead) return res.status(404).json({ error: "Not found" });
    var role = req.user.role;
    var uid = String(req.user.id);
    var STALE_LEAD_MS = await getStaleLeadMs();
    if (role === "sales") {
      // Access is granted by presence of an assignments[] entry for the caller,
      // NOT by top-level agentId (which moves to the new owner on rotation).
      // This keeps the lead reachable for the previous agent while still
      // blocking anyone who has never held it. Split agents (splitAgent2Id)
      // also get access — they may not have an assignments[] entry yet.
      var obj = Object.assign({}, lead);
      var myAssign = (obj.assignments || []).find(function(a) {
        var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
        return String(aid) === uid;
      });
      var splitId2 = lead.splitAgent2Id && lead.splitAgent2Id._id ? lead.splitAgent2Id._id : lead.splitAgent2Id;
      var isSplitAgent = splitId2 && String(splitId2) === uid;
      // Legacy fallback: top-level agentId owner of a deal/EOI with no slice
      // (mirrors the list endpoint's third $or branch). Without this, leads
      // migrated from pre-assignments[] schemas never reach the agent's
      // Deals/EOI detail view.
      var topAgentIdD = lead.agentId && lead.agentId._id ? lead.agentId._id : lead.agentId;
      var isLegacyOwner = !myAssign && !isSplitAgent && String(topAgentIdD || "") === uid && isEoiOrDoneDeal(lead);
      if (!myAssign && !isSplitAgent && !isLegacyOwner) return res.status(404).json({ error: "Not found" });
      // Phase P — caller's own slice is stale or manually hidden: hide.
      // Split-only access and legacy-owner access bypass (no slice to
      // evaluate). EOIs / DoneDeals also bypass via isSliceHidden.
      if (myAssign && !isSplitAgent && isSliceHidden(lead, myAssign, Date.now(), STALE_LEAD_MS)) {
        return res.status(404).json({ error: "Not found" });
      }

      // Wipe top-level per-agent text before the overlay so another agent's
      // notes / feedback can never leak. EXCEPT for legacy ownership — there
      // the top-level fields ARE this agent's own data, preserve them.
      if (!isLegacyOwner) {
        obj.notes = "";
        obj.lastFeedback = "";
      }

      if (myAssign) {
        // Same EOI/DoneDeal status-overlay suppression as the list endpoint —
        // see the long comment there. Required so a deal whose slice wasn't
        // synced to "DoneDeal" still loads on the agent's Deals page.
        if (!isEoiOrDoneDeal(lead)) {
          var assignStatus = myAssign.status === "New Lead" ? "NewLead" : myAssign.status;
          obj.status = assignStatus || obj.status;
        }
        obj.notes = myAssign.notes !== undefined ? myAssign.notes : "";
        obj.budget = myAssign.budget !== undefined ? myAssign.budget : obj.budget;
        obj.callbackTime = myAssign.callbackTime !== undefined ? myAssign.callbackTime : obj.callbackTime;
        obj.lastFeedback = myAssign.lastFeedback !== undefined ? myAssign.lastFeedback : "";
        obj.nextCallAt = myAssign.nextCallAt !== undefined ? myAssign.nextCallAt : obj.nextCallAt;
        if (myAssign.lastActionAt) obj.lastActivityTime = myAssign.lastActionAt;
        if (myAssign.assignedAt) obj.assignedAt = myAssign.assignedAt;
        obj.notesAuthorId   = myAssign.notesAuthorId   || null;
        obj.notesAuthorName = myAssign.notesAuthorName || "";
        obj.notesAuthorRole = myAssign.notesAuthorRole || "";
        // Rewrite agentId so the old agent sees themselves as the owner even
        // after rotation — never exposes the new owner's identity.
        obj.agentId = myAssign.agentId;
      }
      // Split-only access (no slice): keep top-level fields, including agentId
      // pointing at the primary agent so the deal card shows "<primary> +<self>".

      // Strip every other agent's data + rotation metadata.
      obj.agentHistory = (myAssign && myAssign.agentHistory && myAssign.agentHistory.length > 0) ? myAssign.agentHistory : [];
      obj.assignments = myAssign ? [myAssign] : [];
      obj.previousAgentIds = [];
      obj.rotationCount = 0;
      obj.lastRotationAt = null;
      // Sales never see privateNotes.
      obj.privateNotes = [];
      // Filter lead.history (Bug 2): drop rotation/assignment events and any
      // entry not authored by the caller. Mirrors the list-endpoint filter
      // above so single-lead GET can't leak what the list already hid.
      var salesSelfDoc = await User.findById(uid).select({ name: 1 }).lean();
      var salesSelfName2 = salesSelfDoc ? String(salesSelfDoc.name || "") : "";
      obj.history = (obj.history || []).filter(function(h){
        if (!h) return false;
        var ev = String(h.event || "");
        if (ev === "rotated" || ev === "assigned" || ev === "reassigned") return false;
        if (salesSelfName2 && String(h.byUser || "") !== salesSelfName2) return false;
        return true;
      });
      return res.json(obj);
    }
    // Admin / manager / team_leader: overlay top-level notes & lastFeedback
    // from the current owner's assignment slice (top-level is no longer written).
    var adminObj = Object.assign({}, lead);
    var adminHolderId = adminObj.agentId && adminObj.agentId._id ? adminObj.agentId._id : adminObj.agentId;
    var adminHolderAssign = null;
    if (adminHolderId) {
      adminHolderAssign = (adminObj.assignments || []).find(function(a) {
        var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
        return String(aid) === String(adminHolderId);
      });
      if (adminHolderAssign) {
        if (adminHolderAssign.notes) adminObj.notes = adminHolderAssign.notes;
        if (adminHolderAssign.lastFeedback) adminObj.lastFeedback = adminHolderAssign.lastFeedback;
        adminObj.notesAuthorId   = adminHolderAssign.notesAuthorId   || null;
        adminObj.notesAuthorName = adminHolderAssign.notesAuthorName || "";
        adminObj.notesAuthorRole = adminHolderAssign.notesAuthorRole || "";
      }
    }
    // Phase P — manager / team_leader: hide when current holder's slice is
    // stale or manually hidden. Admin / sales_admin / viewer / director
    // continue to see it. EOIs / DoneDeals bypass via isSliceHidden.
    if ((role === "manager" || role === "team_leader") && adminHolderAssign &&
        isSliceHidden(lead, adminHolderAssign, Date.now(), STALE_LEAD_MS)) {
      return res.status(404).json({ error: "Not found" });
    }
    // Per-author privateNotes filter — each manager only ever sees their own.
    adminObj.privateNotes = (adminObj.privateNotes || []).filter(function(n) {
      var aid = n && n.authorId && n.authorId._id ? n.authorId._id : (n && n.authorId);
      return String(aid || "") === String(uid);
    });
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
    // Manual Assignment Window: admin/sales_admin creating a lead without an
    // agent routes it to the queue for manual assignment. Sales/TL/manager
    // still default to themselves (unchanged) so their new lead stays visible
    // in their own list.
    var rotSettings = null;
    try { rotSettings = await getRotationSettings(); } catch(e) {}
    var windowMins = rotSettings ? Number(rotSettings.manualAssignmentWindowMinutes || 0) : 0;
    var queueLead = !agentId && windowMins > 0 && (req.user.role === "admin" || req.user.role === "sales_admin");
    if (!agentId && !queueLead && (req.user.role === "sales" || req.user.role === "team_leader" || req.user.role === "manager") && mongoose.Types.ObjectId.isValid(req.user.id)) {
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
      unitType:         req.body.unitType || "",
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
      manualWindowExpiresAt: queueLead ? new Date(Date.now() + windowMins*60000) : null,
    });
    console.log("SAVED phone2:", lead.phone2);
    // Admin audit timeline — the VERY FIRST entry on every lead captures who
    // created/distributed it from the start. One combined entry (not two)
    // with event "first_assigned" if an agent was attached, or "created" if
    // the lead entered unassigned. Stamped with lead.createdAt so it always
    // sorts first in the timeline.
    var creatorName = (req.user && req.user.name) ? req.user.name : (req.user && req.user.role === "admin" ? "Admin" : "System");
    var firstAgentName = (agentId && targetOnCreate && targetOnCreate.name) ? targetOnCreate.name : "";
    var initEvent = agentId ? "first_assigned" : (queueLead ? "queued" : "created");
    var initDesc = agentId
      ? "Lead added by " + creatorName + " and assigned to " + (firstAgentName || "agent") + (req.body.source ? " (source: " + req.body.source + ")" : "")
      : (queueLead
          ? "Lead added by " + creatorName + " — queued for manual assignment (" + windowMins + "m window)" + (req.body.source ? " (source: " + req.body.source + ")" : "")
          : "Lead added by " + creatorName + " — No Agent" + (req.body.source ? " (source: " + req.body.source + ")" : ""));
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

// ===== INBOUND LEADS (social-media webhooks) =====
// Public webhook for facebook/instagram/tiktok/snapchat/whatsapp/manual ingestions.
// Creates leads with status="NewLead" and no agent — they then enter the existing
// rotation flow naturally via the manual-assignment window + auto-rotate sweeper.
// We deliberately do NOT call any rotation code from here; routing is handled by
// the same machinery that handles unassigned leads created through POST /api/leads.
//
// TODO(security): this endpoint is public for now — add a shared-secret token
// check (header or query param) before any production traffic flips on.
var INBOUND_RATE_TRACKER = {};
app.post("/api/leads/inbound", async function(req, res) {
  var body = req.body || {};
  var sourceRaw = String(body.source == null ? "" : body.source).trim();
  var phoneRaw  = String(body.phone  == null ? "" : body.phone ).trim();
  var source = sourceRaw.toLowerCase();
  try {
    if (!source || !phoneRaw) {
      console.log("[INBOUND] " + (source||"-") + " | " + (phoneRaw||"-") + " | error");
      return res.status(400).json({ error: "source and phone are required" });
    }

    // Burst detector — guards against the duplicate-storm incident (~1000 dupes
    // in seconds). In-process per-source counter, sliding 1-second window.
    var now = Date.now();
    var bucket = INBOUND_RATE_TRACKER[source];
    if (!bucket || (now - bucket.startMs) >= 1000) {
      bucket = { startMs: now, count: 0 };
      INBOUND_RATE_TRACKER[source] = bucket;
    }
    bucket.count++;
    if (bucket.count >= 5) {
      console.warn("[INBOUND RATE WARN] source=" + source + " | " + bucket.count + " leads in " + (now - bucket.startMs) + "ms — possible duplicate storm");
    }

    // Phone normalization: strip leading "+20" / "00", spaces, dashes, then keep
    // digits only and take the last 10 — yields the local-format dedupe key.
    var digitsOnly = phoneRaw.replace(/^\+?20/, "").replace(/^00/, "").replace(/[\s\-]/g, "").replace(/\D/g, "");
    var phoneKey = digitsOnly.slice(-10);

    var externalId = body.externalId == null ? "" : String(body.externalId).trim();

    // Dedupe #1 — same (externalId, source) pair already ingested. Sparse index
    // makes this point-lookup cheap.
    if (externalId) {
      var dupEx = await Lead.findOne({ externalId: externalId, source: source }).lean();
      if (dupEx) {
        console.log("[INBOUND] " + source + " | " + phoneRaw + " | duplicate");
        return res.json({ status: "duplicate", leadId: String(dupEx._id) });
      }
    }

    // Dedupe #2 — phone already in the system (any format). Suffix-match on the
    // last 10 digits collapses "0100…", "+20100…", "0020100…" into one lead.
    // phoneKey is digits-only (regex-safe, no escaping needed).
    if (phoneKey && phoneKey.length >= 7) {
      var dupPhone = await Lead.findOne({
        $or: [
          { phone:  { $regex: phoneKey + "$" } },
          { phone2: { $regex: phoneKey + "$" } }
        ]
      }).lean();
      if (dupPhone) {
        console.log("[INBOUND] " + source + " | " + phoneRaw + " | duplicate");
        return res.json({ status: "duplicate", leadId: String(dupPhone._id) });
      }
    }

    // Manual-assignment window: same logic as POST /api/leads when admin creates
    // an unassigned lead. We are reading rotation settings, NOT changing them.
    var rotSettings = null;
    try { rotSettings = await getRotationSettings(); } catch(_e) {}
    var windowMins = rotSettings ? Number(rotSettings.manualAssignmentWindowMinutes || 0) : 0;

    var lead = await Lead.create({
      name: String(body.name || "").trim() || phoneRaw || "Unknown",
      phone: phoneRaw,
      email: body.email || "",
      status: "NewLead",
      source: source,
      campaign: body.campaign || "",
      formId: body.formId || "",
      externalId: externalId,
      adName: body.adName || "",
      adsetName: body.adsetName || "",
      agentId: null,
      assignments: [],
      lastActivityTime: new Date(),
      archived: false,
      isVIP: false,
      expiresAt: new Date(Date.now() + 30*24*60*60*1000),
      globalStatus: "active",
      manualWindowExpiresAt: windowMins > 0 ? new Date(Date.now() + windowMins*60000) : null
    });

    // Mirror the audit-timeline entry from POST /api/leads so inbound leads show
    // up in admin history with the same shape as manually-created ones.
    try {
      var initEvent = windowMins > 0 ? "queued" : "created";
      var initDesc = "Lead received from " + source
        + (body.campaign ? " (campaign: " + body.campaign + ")" : "")
        + (windowMins > 0 ? " — queued for manual assignment (" + windowMins + "m window)" : " — No Agent");
      var initEntry = historyEntry(initEvent, initDesc, "Inbound:" + source, "No Agent");
      initEntry.timestamp = lead.createdAt || new Date();
      await pushHistory(lead._id, initEntry);
    } catch (he) {
      console.error("[INBOUND] history append failed:", he && he.message ? he.message : he);
    }

    console.log("[INBOUND] " + source + " | " + phoneRaw + " | created");
    return res.json({ status: "created", leadId: String(lead._id) });
  } catch (e) {
    // Mongo duplicate-key (E11000) — race against the unique phone index. Treat
    // as a duplicate so the caller's retry logic doesn't loop on a real conflict.
    if (e && (e.code === 11000 || String(e.message || "").indexOf("E11000") !== -1)) {
      console.log("[INBOUND] " + source + " | " + phoneRaw + " | duplicate");
      try {
        var existing = await Lead.findOne({ phone: phoneRaw }).lean();
        return res.json({ status: "duplicate", leadId: existing ? String(existing._id) : null });
      } catch (_) {
        return res.json({ status: "duplicate", leadId: null });
      }
    }
    console.error("[INBOUND] " + source + " | " + phoneRaw + " | error:", e && e.message ? e.message : e);
    return res.status(500).json({ status: "error", error: e && e.message ? e.message : String(e) });
  }
});

// ===== BULK REASSIGN (must be before /:id) =====
app.put("/api/leads/bulk-reassign", auth, adminOnly, async function(req, res) {
  try {
    var { leadIds, agentId, force } = req.body;
    if(!leadIds||!leadIds.length||!agentId) return res.status(400).json({ error: "leadIds and agentId required" });
    var agentObjId = new mongoose.Types.ObjectId(agentId);
    var isAdminForce = force === true && (req.user.role === "admin" || req.user.role === "sales_admin");
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
    var byName = req.user.name || "Admin";
    var skippedSelf = 0, skippedPrevious = 0, reassigned = 0, notFound = 0;
    // Update top-level fields AND push new assignments entry
    for (var i = 0; i < leadIds.length; i++) {
      var lead = await Lead.findById(leadIds[i]).lean();
      if (!lead) { notFound++; continue; }
      var oldAgentId = lead.agentId;
      // Skip: already the current owner (Bug 1 — no self-reassign).
      // Force does NOT bypass same-agent: pushing a duplicate assignments[]
      // slice for the current owner serves no purpose.
      if (oldAgentId && String(oldAgentId) === String(agentId)) { skippedSelf++; continue; }
      // Skip: previously held this lead (Bug 3 — no return to past agent),
      // unless admin explicitly forced.
      if (!isAdminForce && wasPreviouslyAssigned(lead, agentId)) { skippedPrevious++; continue; }
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
          by: byName,
          date: new Date()
        };
      } else {
        var newAgUser2 = await User.findById(agentId).lean();
        newAgentName = newAgUser2 ? newAgUser2.name : "Unknown";
      }
      await Lead.findByIdAndUpdate(leadIds[i], updateOps);
      // Admin timeline: one entry per lead so bulk ops are audit-able.
      var suffix = isAdminForce ? " (bulk reassign) [admin force override]" : " (bulk reassign)";
      if (oldAgentId) {
        await pushHistory(leadIds[i], historyEntry(
          "rotated",
          "Rotated from " + oldAgentName + " to " + newAgentName + " by " + byName + suffix,
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
      reassigned++;
    }
    await Activity.create({ userId: req.user.id, type: "reassign", note: "Bulk reassign — " + reassigned + "/" + leadIds.length + " leads" });
    res.json({
      ok: true,
      total: leadIds.length,
      reassigned: reassigned,
      skippedSelf: skippedSelf,
      skippedPrevious: skippedPrevious,
      notFound: notFound,
      // Back-compat: older clients key off `count`.
      count: reassigned
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== HIDE ALL LEADS FROM AN AGENT =====
// Admin / Sales Admin only. Manually triggers the same hide-effect as the
// Phase P 7-day staleness rule, but immediately and for every lead the agent
// currently sees. Mechanism: set assignments[].hiddenManually = true on every
// slice belonging to this agent on a non-EOI/DoneDeal lead. Read-time filters
// (GET /api/leads + GET /api/leads/:id) treat hiddenManually as a sibling
// signal to staleness via isSliceHidden(), and isEoiOrDoneDeal exempts
// DoneDeals + active EOIs identically — preserving commission/contract
// visibility exactly as the 7-day rule does. Does NOT touch agentId,
// notes, status, callbackTime, history, or any other field. Does NOT
// trigger rotation. One Activity row is written for audit.
app.post("/api/agents/:id/unassign-all-leads", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin" && req.user.role !== "sales_admin") {
      return res.status(403).json({ error: "Admin or Sales Admin only" });
    }
    var agentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ error: "Invalid agent id" });
    }
    var agent = await User.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    var agentName = agent.name || "Unknown";
    var byName = (req.user && req.user.name) ? req.user.name : "Admin";
    var agentObjId = new mongoose.Types.ObjectId(agentId);

    // Match leads where the agent has at least one slice that (a) isn't
    // already hiddenManually and (b) is NOT a deal/EOI in any state. The
    // exclusion mirrors isEoiOrDoneDeal() exactly so the write-side flagging
    // and the read-side bypass agree on the same definition. Specifically a
    // lead is exempt if any of: status in [EOI, DoneDeal, Deal Cancelled],
    // globalStatus in [eoi, donedeal], non-empty eoiStatus, or
    // dealStatus === "Deal Cancelled" — i.e., anything the Deals page (or
    // the EOI page) would show. This guarantees Hide can never affect a
    // lead that already appears on the agent's Deals page.
    var matchFilter = {
      status: { $nin: ["EOI", "DoneDeal", "Deal Cancelled"] },
      globalStatus: { $nin: ["eoi", "donedeal"] },
      eoiStatus: { $in: [null, ""] },
      dealStatus: { $ne: "Deal Cancelled" },
      assignments: {
        $elemMatch: { agentId: agentObjId, hiddenManually: { $ne: true } }
      }
    };
    var result = await Lead.updateMany(
      matchFilter,
      { $set: { "assignments.$[el].hiddenManually": true } },
      { arrayFilters: [{ "el.agentId": agentObjId, "el.hiddenManually": { $ne: true } }] }
    );
    var hidden = (result && (typeof result.modifiedCount === "number" ? result.modifiedCount : result.nModified)) || 0;

    try {
      await Activity.create({
        userId: req.user.id,
        type: "reassign",
        note: "Hidden " + hidden + " lead" + (hidden===1?"":"s") + " from " + agentName +
              " (manual 7-day-hide trigger) by " + byName
      });
    } catch (e) {
      console.error("[unassign-all-leads activity]", e && e.message ? e.message : e);
    }

    res.json({ hidden: hidden, agentName: agentName });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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

// ===== MANAGERIAL FEEDBACK =====
// Admin / Sales Admin / Manager / Team Leader write feedback in two modes:
// 1) "private"  — store in lead.privateNotes[], visible only to the author.
// 2) "to_sales" — write to the target sales agent's assignments[] slice
//                 (replacing the slice's notes/lastFeedback) so the agent
//                 sees it as feedback on their lead. Author metadata is
//                 recorded so the agent can render a "from <Manager>" tag.
// Sales role does NOT use this endpoint — they save feedback via PUT to
// their own slice (existing path).
app.post("/api/leads/:id/feedback", auth, async function(req, res) {
  try {
    var role = req.user.role;
    if (role === "sales") {
      return res.status(400).json({ error: "sales_uses_put", message: "Sales role: use PUT /api/leads/:id" });
    }
    if (role === "sales_admin") {
      // Sales Admin is read-only on feedback by design — purely administrative
      // role with no operational write on lead notes/feedback.
      return res.status(403).json({ error: "sales_admin_read_only", message: "Sales Admin role does not write feedback" });
    }
    if (role !== "admin" && role !== "manager" && role !== "team_leader") {
      return res.status(403).json({ error: "forbidden", message: "Managerial write roles only (admin/manager/team_leader)" });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "invalid_lead_id" });
    }
    var text = String((req.body && req.body.text) || "").trim();
    if (!text) return res.status(400).json({ error: "text_required" });
    if (text.length > 5000) return res.status(400).json({ error: "text_too_long", message: "Max 5000 chars" });
    var visibility = String((req.body && req.body.visibility) || "");
    if (visibility !== "private" && visibility !== "to_sales") {
      return res.status(400).json({ error: "invalid_visibility", message: "Use 'private' or 'to_sales'" });
    }

    var lead = await Lead.findById(req.params.id).lean();
    if (!lead) return res.status(404).json({ error: "lead_not_found" });

    var callerId = req.user.id;
    var callerName = req.user.name || "";

    if (visibility === "private") {
      await Lead.updateOne(
        { _id: req.params.id },
        { $push: { privateNotes: {
          authorId: new mongoose.Types.ObjectId(callerId),
          authorName: callerName,
          authorRole: role,
          text: text,
          createdAt: new Date()
        }}}
      );
    } else {
      // visibility === "to_sales"
      var targetAgentId = (req.body && req.body.targetAgentId) ? String(req.body.targetAgentId) : "";
      if (!mongoose.Types.ObjectId.isValid(targetAgentId)) {
        return res.status(400).json({ error: "invalid_target_agent" });
      }
      // Target must have a slice on this lead.
      var hasSlice = (lead.assignments || []).some(function(a) {
        var aid = a && a.agentId && a.agentId._id ? a.agentId._id : (a && a.agentId);
        return String(aid || "") === targetAgentId;
      });
      if (!hasSlice) return res.status(400).json({ error: "target_has_no_slice", message: "Target sales agent has no slice on this lead" });
      // Target must be a sales agent + addressable by this caller.
      var targetUser = await User.findById(targetAgentId).select("role active reportsTo name").lean();
      var perm = await canSendFeedbackToTarget(role, callerId, targetUser);
      if (!perm.ok) return res.status(403).json({ error: perm.reason });

      var targetObjId = new mongoose.Types.ObjectId(targetAgentId);
      var callerObjId = new mongoose.Types.ObjectId(callerId);
      var now = new Date();
      await Lead.updateOne(
        { _id: req.params.id },
        {
          $set: {
            "assignments.$[el].notes":           text,
            "assignments.$[el].lastFeedback":    text,
            "assignments.$[el].notesAuthorId":   callerObjId,
            "assignments.$[el].notesAuthorName": callerName,
            "assignments.$[el].notesAuthorRole": role,
            "assignments.$[el].lastActionAt":    now
          },
          $push: {
            "assignments.$[el].agentHistory": {
              type: "feedback",
              note: text,
              createdAt: now,
              authorId: callerObjId,
              authorName: callerName,
              authorRole: role
            }
          }
        },
        { arrayFilters: [{ "el.agentId": targetObjId }] }
      );
    }

    var updated = await Lead.findById(req.params.id)
      .populate("agentId", "name title")
      .populate("assignments.agentId", "name title")
      .lean();
    // Filter privateNotes to caller-only before returning (mirrors GET).
    if (updated && Array.isArray(updated.privateNotes)) {
      updated.privateNotes = updated.privateNotes.filter(function(n) {
        var aid = n && n.authorId && n.authorId._id ? n.authorId._id : (n && n.authorId);
        return String(aid || "") === String(callerId);
      });
    }
    res.json({ ok: true, lead: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== EOI CANCEL (admin) — restores pre-EOI status on the lead, keeps record visible under EOI Deal Cancelled =====
app.post("/api/leads/:id/eoi-cancel", auth, async function(req, res) {
  try {
    if (req.user.role !== "admin" && req.user.role !== "sales_admin") return res.status(403).json({ error: "Only admin can cancel an EOI" });
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
    if (req.user.role !== "admin" && req.user.role !== "sales_admin") return res.status(403).json({ error: "Only admin can cancel an EOI" });
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
    if (req.user.role !== "admin" && req.user.role !== "sales_admin" && req.user.role !== "sales") return res.status(403).json({ error: "Only admin or sales can convert an EOI to a deal" });
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
    if (req.user.role !== "admin" && req.user.role !== "sales_admin") return res.status(403).json({ error: "Only admin can cancel a deal" });
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
    if (req.user.role !== "admin" && req.user.role !== "sales_admin") return res.status(403).json({ error: "Only admin can cancel a deal" });
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
    if (req.body.status === "Deal Cancelled" && req.user.role !== "admin" && req.user.role !== "sales_admin") {
      return res.status(403).json({ error: "Only admin can set Deal Cancelled status" });
    }
    // Managerial roles must use POST /api/leads/:id/feedback for notes/feedback
    // (visibility selector — private vs. send-to-specific-sales). Silently
    // dropping these here used to hide the bug; reject loudly so the frontend
    // can route correctly. Sales/team_leader continue through the slice-sync
    // block below — TL's PUT only saves when they have an own slice; if not,
    // the slice-sync becomes a no-op and the frontend must use the feedback
    // endpoint instead.
    if ((req.user.role === "admin" || req.user.role === "sales_admin" || req.user.role === "manager") &&
        (req.body.notes !== undefined || req.body.lastFeedback !== undefined)) {
      return res.status(400).json({
        error: "use_feedback_endpoint",
        message: "Use POST /api/leads/:id/feedback for managerial feedback (visibility selector)"
      });
    }
    // Normalize ObjectId fields the frontend may have sent as populated
    // objects (happens on edit — p.initial is the lead with populated agentId)
    // or empty strings. Prevents CastError on findByIdAndUpdate and prevents
    // the String(object) !== String(id) false-positive reassignment below.
    req.body.agentId       = normId(req.body.agentId);
    req.body.splitAgent2Id = normId(req.body.splitAgent2Id);
    // The 🔒 lock is restricted to admin / sales_admin / team_leader / manager.
    // Silently drop the field from other roles so a sales client can't bypass
    // the UI gate — the rest of the PUT still applies.
    if (req.body.locked !== undefined &&
        ["admin","sales_admin","team_leader","manager"].indexOf(req.user.role) < 0) {
      delete req.body.locked;
    }
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
    // Control flag — never persist on the lead doc.
    delete update.force;
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
    // Manual Assignment Window: if the lead is currently in the unassigned
    // queue (no agent, manualWindowExpiresAt set) and we're assigning an
    // agent now, clear the expiry so the sweeper leaves it alone, and give
    // the new agent a fresh assignments[] entry (queued leads have none).
    var queuedAssignPush = null;
    if (req.body.agentId && oldLead && !oldLead.agentId && oldLead.manualWindowExpiresAt) {
      update.manualWindowExpiresAt = null;
      if (!Array.isArray(oldLead.assignments) || oldLead.assignments.length === 0) {
        queuedAssignPush = {
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
        };
      }
    }
    // Track agent history when agent changes (fallback — should go through /rotate)
    var pushOnReassign = null;
    if (req.body.agentId && oldLead && oldLead.agentId && String(oldLead.agentId) !== String(req.body.agentId)) {
      // Enforce the same invariants /rotate does — this fallback path must not
      // be a backdoor around them. Admin/sales_admin can bypass via force:true.
      var putIsAdminForce = req.body.force === true && (req.user.role === "admin" || req.user.role === "sales_admin");
      if (!putIsAdminForce && wasPreviouslyAssigned(oldLead, req.body.agentId)) {
        return res.status(400).json({ error: "already_assigned", message: "Target agent already had this lead" });
      }
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
    if (queuedAssignPush) {
      writeOps.$push = Object.assign({}, writeOps.$push || {}, { assignments: queuedAssignPush });
    }
    await Lead.findByIdAndUpdate(req.params.id, writeOps);
    if (queuedAssignPush) {
      try {
        var qAgent = await User.findById(req.body.agentId).select("name").lean();
        var qByName = (req.user && req.user.name) ? req.user.name : "Admin";
        await pushHistory(req.params.id, historyEntry(
          "manual_assigned_from_queue",
          "Manually assigned from queue to " + (qAgent && qAgent.name ? qAgent.name : "agent") + " by " + qByName,
          qByName,
          qAgent && qAgent.name ? qAgent.name : ""
        ));
        broadcast("unassigned_updated", { leadId: String(req.params.id) });
      } catch(hErr) { /* non-fatal */ }
    }
    // Sync agent's own assignments[] entry on any action
    if (req.user.role === "sales" || req.user.role === "team_leader") {
      var assignUpdate = { "assignments.$.lastActionAt": new Date(), "assignments.$.rotationTimer": new Date() };
      if (req.body.status) assignUpdate["assignments.$.status"] = req.body.status;
      if (req.body.notes !== undefined) assignUpdate["assignments.$.notes"] = req.body.notes;
      if (req.body.budget !== undefined) assignUpdate["assignments.$.budget"] = req.body.budget;
      if (req.body.callbackTime !== undefined) assignUpdate["assignments.$.callbackTime"] = req.body.callbackTime;
      if (req.body.lastFeedback !== undefined) assignUpdate["assignments.$.lastFeedback"] = req.body.lastFeedback;
      if (req.body.noRotation !== undefined) assignUpdate["assignments.$.noRotation"] = req.body.noRotation;
      // The agent themselves wrote it — clear any prior managerial author tag
      // so the next read renders without the "from <Manager>" badge.
      if (req.body.notes !== undefined || req.body.lastFeedback !== undefined) {
        assignUpdate["assignments.$.notesAuthorId"]   = null;
        assignUpdate["assignments.$.notesAuthorName"] = "";
        assignUpdate["assignments.$.notesAuthorRole"] = "";
      }
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
    var { targetAgentId, reason, force } = req.body;
    if (!targetAgentId) return res.status(400).json({ error: "targetAgentId required" });
    var lead = await Lead.findById(req.params.id).populate("agentId", "name title");
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    // Admin override: only admin/sales_admin can bypass the same-agent and
    // previously-assigned guards. All other callers are hard-gated below.
    var isAdminForce = force === true && (req.user.role === "admin" || req.user.role === "sales_admin");

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
    // ── HARD STOP 1b: top-level lock (🔒 button) — same admin override policy ──
    if (lead.locked === true && req.user.role !== "admin" && req.user.role !== "sales_admin") {
      return res.status(400).json({ error: "locked", message: "Rotation blocked — lead is locked" });
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
    // ── HARD STOP 5: same agent (Bug 1 — can't rotate a lead to its current owner) ──
    var currentOwnerId = lead.agentId && lead.agentId._id ? String(lead.agentId._id) : String(lead.agentId||"");
    if (!isAdminForce && currentOwnerId && String(targetAgentId) === currentOwnerId) {
      return res.status(400).json({ error: "same_agent", message: "Target agent is already the current owner" });
    }
    // ── HARD STOP 6: previously assigned (Bug 3 — no return to a past agent) ──
    if (!isAdminForce && wasPreviouslyAssigned(lead, targetAgentId)) {
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
    // When isAdminForce is true the same-agent / previously-assigned guards
    // were bypassed; annotate the timeline so the override is auditable.
    var rotMsg = "Rotated from " + oldAgentName + " to " + newAgentName + " by " + (req.user.name || "System") + " (" + rotationReason + ")";
    if (isAdminForce) rotMsg += " [admin force override]";
    await pushHistory(req.params.id, historyEntry(
      "rotated",
      rotMsg,
      req.user.name || "System",
      newAgentName
    ));

    var updated = await Lead.findById(req.params.id).populate("agentId", "name title").populate("assignments.agentId", "name title");
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== AUTO-ROTATE (server picks next agent from the ordered rotation list) =====
// The rotation order lives in AppSetting (key "rotation", field reassignAgents)
// and is an ORDERED array of user ids. The helper walks that list top-to-bottom
// and assigns the lead to the first agent who has never handled it. "Previously
// handled" = any id in lead.assignments[].agentId, lead.previousAgentIds, or the
// current lead.agentId. If every agent in the list has already had the lead,
// rotation stops and the lead is left as-is.
//
// INVARIANT: ONE rotation event = exactly ONE new assignment to ONE agent.
// The scan loop has a `break` on first match, and the mutation is a single
// atomic findOneAndUpdate guarded on the lead's current agentId so two
// concurrent callers can't both append an assignment to the same lead.
//
// `autoRotateLead` is the shared core. It's called from:
//   • POST /api/leads/:id/auto-rotate  (browser-triggered, see endpoint below)
//   • sweepAutoRotation()              (server cron, every 5 min)
// Returns a structured result instead of touching res — the endpoint maps it
// to HTTP. opts.role + opts.reason gate the same admin-bypass paths the
// endpoint used to read off req.user; the sweeper passes neither and so
// behaves as a non-admin caller with reason="auto_timeout".
async function autoRotateLead(leadId, byName, opts) {
  try {
    opts = opts || {};
    var reason = opts.reason || "auto_timeout";
    var role   = opts.role   || "";
    byName = byName || "System";

    var lead = await Lead.findById(leadId).populate("agentId", "name title");
    if (!lead) return { ok: false, status: 404, error: "Lead not found" };

    // Hard stops mirror the manual /rotate endpoint — same invariants apply.
    var currentAid = lead.agentId && lead.agentId._id ? String(lead.agentId._id) : String(lead.agentId||"");
    var currentAssignment = (lead.assignments || []).find(function(a) { return String(a.agentId) === currentAid; });
    if (lead.rotationStopped === true) {
      return { ok: false, status: 409, error: "rotation_stopped", message: "Rotation permanently stopped on this lead (3 consecutive Not Interested)" };
    }
    if (currentAssignment && currentAssignment.noRotation && role !== "admin" && role !== "sales_admin") {
      return { ok: false, status: 400, error: "noRotation", message: "Rotation blocked — noRotation flag set" };
    }
    // Top-level lock — written by the 🔒 button on the lead panel. Same
    // admin/sales_admin override policy as the per-slice noRotation flag.
    if (lead.locked === true && role !== "admin" && role !== "sales_admin") {
      return { ok: false, status: 400, error: "locked", message: "Rotation blocked — lead is locked" };
    }
    if (lead.globalStatus === "eoi")      return { ok: false, status: 400, error: "eoi",      message: "Rotation blocked — lead is EOI" };
    if (lead.globalStatus === "donedeal") return { ok: false, status: 400, error: "donedeal", message: "Rotation blocked — lead is Done Deal" };

    // Load rotation settings once (normalized + migrated). Master switch and
    // pause window gate everything below — nothing rotates while disabled.
    var settings = await getRotationSettings();
    if (settings.autoRotationEnabled === false) {
      return { ok: false, status: 409, error: "rotation_disabled", message: "Auto-rotation is turned off" };
    }
    if (settings.autoRotationPausedUntil && new Date(settings.autoRotationPausedUntil) > new Date()) {
      return { ok: false, status: 409, error: "rotation_paused", message: "Auto-rotation is paused until " + settings.autoRotationPausedUntil };
    }

    // Configurable age cutoff (was hardcoded 30 days, spec Rule 5 says 45).
    var stopDays = Number(settings.rotationStopAfterDays) || 45;
    if (lead.createdAt && (new Date() - new Date(lead.createdAt)) > stopDays*24*60*60*1000) {
      return { ok: false, status: 400, error: "stopped_age", message: "Rotation blocked — lead older than " + stopDays + " days" };
    }

    // Lead-wide last-action timestamp: max of every slice's lastActionAt and
    // every action-type agentHistory entry across all assignments. Prevents
    // an idle current owner from triggering a stale-clock rotation while a
    // split agent (or recent past holder) is actively working the lead.
    function leadWideLastActionMs(lead, curSlice) {
      var max = 0;
      var bump = function(t) {
        var ms = t ? new Date(t).getTime() : 0;
        if (ms > max) max = ms;
      };
      (lead.assignments || []).forEach(function(s){
        if (!s) return;
        bump(s.lastActionAt);
        (s.agentHistory || []).forEach(function(h){
          if (!h) return;
          var t = h.type || "";
          if (t === "status_change" || t === "feedback_added" || t === "feedback"
              || t === "note" || t === "call" || t === "callback_scheduled") {
            bump(h.createdAt || h.at || h.timestamp);
          }
        });
      });
      if (!max) bump(curSlice && curSlice.lastActionAt);
      return max;
    }

    // ── Eligibility + cooldown re-verification (server-side invariant) ──
    // /auto-rotate used to trust its callers. Client browsers with stale
    // top-level `lastActivityTime` (admin view has no per-agent overlay) were
    // firing rotations on freshly-rotated leads, cascading them through tiers.
    // Enforce the same thresholds the client sweeper and bulk-redistribute use.
    //
    // Explicit admin intent — reason="manual" from admin/sales_admin — bypasses
    // both checks, since the same user could hit /rotate to get the same effect.
    // Only first-assignment (no currentAid) skips eligibility — no prior agent
    // to have a clock on.
    var bypassEligibility = (role === "admin" || role === "sales_admin") && reason === "manual";
    if (currentAid && !bypassEligibility) {
      var nowTs = new Date();
      var HOUR_MS = 60*60*1000;
      var DAY_MS  = 24*HOUR_MS;

      // Cooldown: no re-rotation within 1 hour of the last rotation.
      if (lead.lastRotationAt && (nowTs - new Date(lead.lastRotationAt)) < HOUR_MS) {
        return { ok: false, status: 409, error: "cooldown", message: "Rotated less than 1h ago" };
      }

      // Per-slice clock, with top-level fallback for legacy leads that never
      // got an assignments[] entry for their current agent.
      var curSlice = currentAssignment;
      if (!curSlice) {
        curSlice = {
          status:       lead.status,
          lastActionAt: lead.lastActivityTime,
          callbackTime: lead.callbackTime,
          noRotation:   false
        };
      }
      var naCountThreshold = Number(settings.naCount) || 2;
      var naHoursThreshold = Number(settings.naHours) || 1;
      var niDays    = Number(settings.niDays)   || 1;
      var noActDays = Number(settings.noActDays)|| 2;
      var cbDays    = Number(settings.cbDays)   || 1;
      var hotDays   = Number(settings.hotDays)  || 2;

      var lastActMs = leadWideLastActionMs(lead, curSlice);
      var hasClock  = lastActMs > 0;
      var ageMs     = hasClock ? (nowTs.getTime() - lastActMs) : 0;
      // Slice status mirror is not always synced (admin/sales_admin status
      // writes don't reach the slice — see PUT /api/leads/:id ~L2433; new
      // slices created on rotation default to "NewLead" — see L2658, L3072).
      // Fall back to lead.status when the slice is missing or still shows the
      // default NewLead, so CallBack / NoAnswer / HotCase rules driven by
      // admin writes still match the right switch case. Slice non-NewLead
      // values stay authoritative — sales-driven changes win over stale
      // top-level fields.
      var rawSliceStatus = String(curSlice.status || "");
      var sliceStatus = (!rawSliceStatus || rawSliceStatus === "NewLead")
        ? String(lead.status || "NewLead")
        : rawSliceStatus;
      var eligible = false;
      var notEligibleReason = null;
      // The actual rule that fires for this rotation. Overrides the caller's
      // opts.reason in the history note so the journey shows e.g. "callback
      // time passed" instead of the generic "auto_timeout" the client always
      // sends. Stays null when bypassEligibility is in effect (admin force).
      var firedRule = null;

      switch (sliceStatus) {
        case "NoAnswer": {
          // Count from the per-slice agentHistory[] instead of the Activity
          // collection. The collection-scan version only saw status changes
          // that went through the two client paths writing a "[NoAnswer] ..."
          // prefix; agentHistory is populated server-side on every status
          // change (see PUT /api/leads/:id ~L2444), so it's the reliable
          // source of truth for "did this agent log a NoAnswer outcome".
          var sliceHistory = Array.isArray(curSlice.agentHistory) ? curSlice.agentHistory : [];
          var naEntries = sliceHistory.filter(function(h){
            if (!h || h.type !== "status_change") return false;
            return /no\s*answer/i.test(String(h.note || ""));
          });
          if (naEntries.length < naCountThreshold) notEligibleReason = "NoAnswer: count " + naEntries.length + " below threshold " + naCountThreshold;
          else {
            var latestNa = 0;
            naEntries.forEach(function(h){
              var t = new Date(h.createdAt || h.at || h.timestamp || 0).getTime();
              if (t > latestNa) latestNa = t;
            });
            if (!latestNa) {
              // Legacy entries with no timestamp — use the slice's clock so
              // we don't lock the lead out of rotation forever.
              var fb = new Date(curSlice.lastActionAt || curSlice.assignedAt || 0).getTime();
              if (fb) latestNa = fb;
            }
            if (!latestNa)                                                   notEligibleReason = "NoAnswer: no valid timestamp";
            else if ((nowTs.getTime() - latestNa) < naHoursThreshold*HOUR_MS) notEligibleReason = "NoAnswer: latest entry too recent";
            else { eligible = true; firedRule = "no_answer_streak"; }
          }
          break;
        }
        case "NotInterested":
          if (!hasClock)                 notEligibleReason = "NotInterested: no lastActionAt";
          else if (ageMs < niDays*DAY_MS) notEligibleReason = "NotInterested: lastActionAt too recent";
          else { eligible = true; firedRule = "not_interested_return"; }
          break;
        case "NewLead":
          if (!hasClock)                    notEligibleReason = "NewLead: no lastActionAt";
          else if (ageMs < noActDays*DAY_MS) notEligibleReason = "NewLead: lastActionAt too recent";
          else { eligible = true; firedRule = "no_action_timeout"; }
          break;
        case "CallBack": {
          // Slice mirror is only synced on sales/team_leader writes (see PUT
          // /api/leads/:id ~L2433). When admin/sales_admin sets the callback
          // time, lead.callbackTime updates but the slice stays blank — fall
          // back to the lead-level value so those leads still rotate.
          var effectiveCb = curSlice.callbackTime || lead.callbackTime || null;
          if (!effectiveCb) notEligibleReason = "CallBack: callbackTime not set";
          else {
            var cbMs = new Date(effectiveCb).getTime();
            if (!cbMs)                                         notEligibleReason = "CallBack: callbackTime unparseable";
            else if ((nowTs.getTime() - cbMs) < cbDays*DAY_MS) notEligibleReason = "CallBack: not yet overdue";
            else { eligible = true; firedRule = "callback_overdue"; }
          }
          break;
        }
        case "HotCase":
        case "Potential":
        case "MeetingDone":
          if (!hasClock)                  notEligibleReason = sliceStatus + ": no lastActionAt";
          else if (ageMs < hotDays*DAY_MS) notEligibleReason = sliceStatus + ": lastActionAt too recent";
          else { eligible = true; firedRule = "hot_no_action"; }
          break;
        default:
          notEligibleReason = "status not in eligible list: \"" + (sliceStatus || "(empty)") + "\"";
      }

      if (!eligible) {
        return { ok: false, status: 409, error: "not_eligible", reason: notEligibleReason };
      }
      // Replace the caller-supplied reason (always "auto_timeout" from the
      // browser cron, "manual" from admin force) with the rule code that
      // actually matched. The history-note builder reads `reason` directly,
      // so this propagates into lead.history and onto the journey display.
      if (firedRule) reason = firedRule;
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
    if (!allTierIds.length) return { ok: false, status: 409, error: "no_rotation_order", message: "No rotation order configured" };
    var candidateDocs = await User.find({ _id: { $in: allTierIds } }).select("_id name title role active lastSeen").lean();
    var byId = {};
    candidateDocs.forEach(function(u){ byId[String(u._id)] = u; });

    // Active vacations — one bulk query per call. Anyone whose window covers
    // "now" is excluded from the destination picker for the duration of their
    // vacation. Leads do NOT wait for the agent to return — picker advances to
    // the next tier slot, same as inactive/wrong-role candidates.
    var nowVac = new Date();
    var vacRows = await AgentVacation.find({
      agentId: { $in: allTierIds },
      startDate: { $lte: nowVac },
      endDate:   { $gte: nowVac }
    }).select("agentId").lean();
    var onVacationIds = new Set(vacRows.map(function(r){ return String(r.agentId); }));

    // Tier cascade: try Tier 1, then 2, then 3. Each tier has its own
    // round-robin pointer. Skip rules are applied per-candidate; "skipped"
    // agents leave the pointer untouched.
    var sr = settings.smartSkipRules || {};
    // Count-based tier selection:
    //   rotationCount < 2 (first 2 rotations)  → Tier 1 preferred, combined T2+T3 fallback
    //   rotationCount >= 2 (third rotation+)   → combined T2+T3 only, no fallback to Tier 1
    var rotCount = Number(lead.rotationCount || 0);
    var tryPool = function(ids, lastIdx){
      if (!Array.isArray(ids) || !ids.length) return null;
      var n = ids.length;
      var start = ((lastIdx + 1) % n + n) % n;
      for (var step = 0; step < n; step++) {
        var idx = (start + step) % n;
        var uid = String(ids[idx]);
        if (sr.skipIfAlreadyHandled !== false && exclusion.has(uid)) continue;
        var u = byId[uid];
        if (!u || u.active === false) continue;
        if (["sales","team_leader"].indexOf(u.role) < 0) continue; // managers/directors excluded per spec
        if (onVacationIds.has(uid)) continue;                       // active vacation — re-enters automatically once endDate passes
        return { user: u, idx: idx };
      }
      return null;
    };
    // Flatten T2+T3 into a single deduped ring. An agent listed in both tiers
    // should occupy one slot — the Tier 2 position wins (first-seen).
    var combined23 = [];
    var seen23 = {};
    [].concat(settings.tiers.tier2.agents, settings.tiers.tier3.agents).forEach(function(id){
      var s = String(id);
      if (!seen23[s]) { seen23[s] = true; combined23.push(s); }
    });
    var pick = null;
    var poolKey = null;
    if (rotCount < 2) {
      pick = tryPool(settings.tiers.tier1.agents, settings.tiers.tier1.lastIdx);
      if (pick) { poolKey = "tier1"; }
      else {
        pick = tryPool(combined23, settings.combined23LastIdx);
        if (pick) poolKey = "combined23";
      }
    } else {
      pick = tryPool(combined23, settings.combined23LastIdx);
      if (pick) poolKey = "combined23";
    }
    if (!pick) return { ok: false, status: 409, error: "exhausted", message: "No eligible agent — all tier agents have already handled this lead" };
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
        { _id: leadId, agentId: null },
        {
          $set: { agentId: new mongoose.Types.ObjectId(targetAgentId), lastRotationAt: new Date() },
          $push: { assignments: firstAssignment }
        },
        { new: true }
      );
      if (!firstResult) {
        return { ok: false, status: 409, error: "concurrent_rotation", message: "Lead was modified by another request — retry" };
      }
      await pushHistory(firstResult._id, historyEntry(
        "assigned",
        "Assigned to " + targetUser.name + " by " + byName + " (auto-rotate)",
        byName,
        targetUser.name
      ));
      // Advance the pool's round-robin pointer so the next rotation resumes
      // after this agent. Tier 1 picks also mirror to legacy lastAssignedIdx.
      try {
        var pUpd = {};
        if (poolKey === "tier1") {
          pUpd["value.tiers.tier1.lastIdx"] = foundIdx;
          pUpd["value.lastAssignedIdx"] = foundIdx;
        } else {
          pUpd["value.combined23LastIdx"] = foundIdx;
        }
        await AppSetting.updateOne({ key: "rotation" }, { $set: pUpd });
      } catch(pErr){ console.error("[rotation pointer]", pErr && pErr.message ? pErr.message : pErr); }
      var firstPopulated = await Lead.findById(leadId).populate("agentId", "name title").populate("assignments.agentId", "name title");
      return { ok: true, status: 200, body: { success: true, firstAssignment: true, targetAgentId: targetAgentId, lead: firstPopulated } };
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
        { _id: leadId, agentId: oldAgentId, rotationStopped: { $ne: true } },
        { $set: { notInterestedStreak: nextStreak, rotationStopped: true } },
        { new: true }
      );
      if (stopResult) {
        try {
          await pushHistory(leadId, historyEntry(
            "rotation_stopped",
            "Rotation permanently stopped — 3 consecutive Not Interested outcomes",
            byName,
            ""
          ));
        } catch(hErr) { /* non-fatal */ }
      }
      return { ok: false, status: 409, error: "rotation_stopped", message: "Rotation permanently stopped on this lead (3 consecutive Not Interested)" };
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
      by: byName,
      date: new Date()
    };
    var pushOps = { assignments: newAssignment, agentHistory: rotationLog };
    if (oldAgentId && String(oldAgentId) !== "null" && String(oldAgentId) !== "undefined" && String(oldAgentId) !== "") {
      pushOps.previousAgentIds = oldAgentId;
    }
    var guardedResult = await Lead.findOneAndUpdate(
      { _id: leadId, agentId: oldAgentId },
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
      return { ok: false, status: 409, error: "concurrent_rotation", message: "Lead was already rotated by another request" };
    }
    await pushHistory(leadId, historyEntry(
      "rotated",
      "Rotated from " + oldAgentName + " to " + targetUser.name + " by " + byName + " (" + reason + ")",
      byName,
      targetUser.name
    ));
    // Advance the pool's round-robin pointer — next rotation (in this batch
    // or any future one) resumes from (foundIdx + 1) % N so assignments fan out.
    try {
      var pUpd2 = {};
      if (poolKey === "tier1") {
        pUpd2["value.tiers.tier1.lastIdx"] = foundIdx;
        pUpd2["value.lastAssignedIdx"] = foundIdx;
      } else {
        pUpd2["value.combined23LastIdx"] = foundIdx;
      }
      await AppSetting.updateOne({ key: "rotation" }, { $set: pUpd2 });
    } catch(pErr){ console.error("[rotation pointer]", pErr && pErr.message ? pErr.message : pErr); }
    var updated = await Lead.findById(leadId).populate("agentId", "name title").populate("assignments.agentId", "name title");
    return { ok: true, status: 200, body: { success: true, targetAgentId: targetAgentId, lead: updated } };
  } catch (e) {
    return { ok: false, status: 500, error: e && e.message ? e.message : "exception" };
  }
}

// Thin HTTP wrapper around autoRotateLead. Same auth, same response shape,
// same error codes as before — the helper returns a status + body the wrapper
// just unwraps.
app.post("/api/leads/:id/auto-rotate", auth, async function(req, res) {
  var reason = (req.body && req.body.reason) || "auto_timeout";
  var r = await autoRotateLead(req.params.id, req.user.name || "System", { reason: reason, role: req.user.role });
  if (r.ok) return res.status(r.status || 200).json(r.body);
  var payload = { error: r.error };
  if (r.message) payload.message = r.message;
  if (r.reason)  payload.reason  = r.reason;
  return res.status(r.status || 500).json(payload);
});

// ===== ONE-TIME BULK REDISTRIBUTION =====
// Admin-triggered sweep that evenly spreads the rotation-eligible backlog
// across all tier agents (tier1+tier2+tier3 combined). Not gated by the master
// rotation switch or pause window — this is an explicit admin action.
// Scope: agent-to-agent only (leads with agentId set). Unassigned leads
// (agentId:null) are handled by the manual-window sweeper and left alone here.
app.post("/api/leads/bulk-redistribute-backlog", auth, async function(req, res){
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });

    var settings = await getRotationSettings();
    var now = new Date();
    var DAY = 24*60*60*1000;
    var HOUR = 60*60*1000;
    var stopDays = Number(settings.rotationStopAfterDays) || 45;
    var ageCutoff = new Date(now.getTime() - stopDays*DAY);
    var rotatedGuard = new Date(now.getTime() - 1*HOUR);

    // Build the agent pool from all three tiers. Dedupe while preserving order
    // so tier1 agents come first in the ring.
    var tierOrder = [].concat(
      (settings.tiers.tier1.agents || []),
      (settings.tiers.tier2.agents || []),
      (settings.tiers.tier3.agents || [])
    );
    var seen = {};
    var tierIds = [];
    tierOrder.forEach(function(id){ var s = String(id); if (!seen[s]) { seen[s] = true; tierIds.push(s); } });
    if (!tierIds.length) return res.status(409).json({ error: "no_rotation_order", message: "No rotation order configured" });

    var agentDocs = await User.find({ _id: { $in: tierIds } }).select("_id name role active").lean();
    var agentById = {};
    agentDocs.forEach(function(u){ agentById[String(u._id)] = u; });
    var agentPool = tierIds.filter(function(id){
      var u = agentById[id];
      return !!u && u.active !== false && (u.role === "sales" || u.role === "team_leader");
    });
    if (!agentPool.length) return res.status(409).json({ error: "no_agents", message: "No eligible agents in rotation tiers" });

    // DIAGNOSTIC MODE — full funnel visibility.
    // Pull every Lead doc with no pre-filter; count each exclusion stage in JS
    // so the UI can see exactly where leads drop out. Do NOT apply any DB-level
    // filter on archived / agentId / source / globalStatus / rotationStopped /
    // createdAt / lastRotationAt — those are stage counters below.
    var allLeads = await Lead.find({})
      .select("_id name agentId archived source globalStatus rotationStopped locked createdAt lastRotationAt assignments status lastActivityTime callbackTime previousAgentIds")
      .lean();

    var excluded = {
      archived: 0,
      noAgent: 0,
      dailyRequestSource: 0,
      eoiOrDoneDeal: 0,
      rotationStopped: 0,
      locked: 0,
      tooYoung_lessThan45days: 0,
      lastRotationWithin1h: 0,
      noCurrentSliceAndNoFallback: 0,
      noRotationFlag: 0
    };
    var passed = [];
    for (var i = 0; i < allLeads.length; i++) {
      var l = allLeads[i];
      if (l.archived === true)                                       { excluded.archived++; continue; }
      if (!l.agentId)                                                { excluded.noAgent++; continue; }
      if (l.source === "Daily Request")                              { excluded.dailyRequestSource++; continue; }
      if (l.globalStatus === "eoi" || l.globalStatus === "donedeal") { excluded.eoiOrDoneDeal++; continue; }
      if (l.rotationStopped === true)                                { excluded.rotationStopped++; continue; }
      // Top-level lock. The bulk op is a batch action, not a single-lead admin
      // override — locked leads are pinned and skipped unconditionally.
      if (l.locked === true)                                         { excluded.locked++; continue; }
      if (!l.createdAt || new Date(l.createdAt) < ageCutoff)         { excluded.tooYoung_lessThan45days++; continue; }
      if (l.lastRotationAt && new Date(l.lastRotationAt) >= rotatedGuard) { excluded.lastRotationWithin1h++; continue; }

      // Resolve current slice; fall back to top-level fields for legacy leads.
      var curAid = l.agentId && l.agentId._id ? String(l.agentId._id) : String(l.agentId || "");
      var cur = (l.assignments || []).find(function(a){
        var aid = a && a.agentId && a.agentId._id ? a.agentId._id : (a && a.agentId);
        return String(aid || "") === curAid;
      }) || null;
      if (!cur) {
        if (!l.status && !l.lastActivityTime) { excluded.noCurrentSliceAndNoFallback++; continue; }
        cur = {
          status:       l.status,
          lastActionAt: l.lastActivityTime,
          callbackTime: l.callbackTime,
          noRotation:   false,
          __fallback: true
        };
      }
      if (cur.noRotation === true) { excluded.noRotationFlag++; continue; }

      l._cur = cur;
      l._curAid = curAid;
      passed.push(l);
    }

    // Status breakdown of the passing pool (using per-agent slice status,
    // with top-level fallback for legacy leads).
    var byStatus = { NewLead:0, NotInterested:0, CallBack:0, HotCase:0, Potential:0, MeetingDone:0, NoAnswer:0, other:0 };
    passed.forEach(function(l){
      var s = String(l._cur.status || "");
      if (byStatus[s] != null) byStatus[s]++;
      else byStatus.other++;
    });

    // NoAnswer eligibility needs per-lead activity counts. Scope to the
    // passing pool only — one batch query.
    var leadIds = passed.map(function(l){ return l._id; });
    var naByLead = {};
    if (leadIds.length) {
      var naActs = await Activity.find({
        leadId: { $in: leadIds },
        type: "status_change",
        note: { $regex: /^\[NoAnswer\]/ }
      }).select("leadId createdAt").lean();
      naActs.forEach(function(a){
        var k = String(a.leadId);
        var slot = naByLead[k] || (naByLead[k] = { count: 0, latest: null });
        slot.count += 1;
        if (!slot.latest || new Date(a.createdAt) > slot.latest) slot.latest = new Date(a.createdAt);
      });
    }

    var naCountThreshold = Number(settings.naCount) || 2;
    var naHoursThreshold = Number(settings.naHours) || 1;
    var niDays   = Number(settings.niDays)   || 1;
    var noActDays= Number(settings.noActDays)|| 2;
    var cbDays   = Number(settings.cbDays)   || 1;
    var hotDays  = Number(settings.hotDays)  || 2;

    var byRule = { newLead: 0, notInt: 0, callBack: 0, hot: 0, noAns: 0 };
    var notEligibleReasons = {};
    var bumpReason = function(k){ notEligibleReasons[k] = (notEligibleReasons[k] || 0) + 1; };

    var eligibleLeads = [];
    passed.forEach(function(l){
      var cur = l._cur;
      var lastAct = cur.lastActionAt ? new Date(cur.lastActionAt).getTime() : 0;
      var hasClock = lastAct > 0;
      var ageMs = hasClock ? (now.getTime() - lastAct) : 0;
      var status = String(cur.status || "");

      switch (status) {
        case "NoAnswer": {
          var slot = naByLead[String(l._id)];
          if (!slot)                                                                       { bumpReason("NoAnswer: no [NoAnswer] activities logged"); return; }
          if (slot.count < naCountThreshold)                                               { bumpReason("NoAnswer: activity count below naCount"); return; }
          if (!slot.latest)                                                                 { bumpReason("NoAnswer: latest activity timestamp missing"); return; }
          if ((now.getTime() - slot.latest.getTime()) < naHoursThreshold*HOUR)             { bumpReason("NoAnswer: latest activity too recent (< naHours)"); return; }
          byRule.noAns++; eligibleLeads.push(l); break;
        }
        case "NotInterested": {
          if (!hasClock)               { bumpReason("NotInterested: no lastActionAt and no lastActivityTime"); return; }
          if (ageMs < niDays*DAY)      { bumpReason("NotInterested: lastActionAt too recent (< niDays)"); return; }
          byRule.notInt++; eligibleLeads.push(l); break;
        }
        case "NewLead": {
          if (!hasClock)               { bumpReason("NewLead: no lastActionAt and no lastActivityTime"); return; }
          if (ageMs < noActDays*DAY)   { bumpReason("NewLead: lastActionAt too recent (< noActDays)"); return; }
          byRule.newLead++; eligibleLeads.push(l); break;
        }
        case "CallBack": {
          if (!cur.callbackTime)                  { bumpReason("CallBack: callbackTime not set"); return; }
          var cb = new Date(cur.callbackTime).getTime();
          if (!cb)                                { bumpReason("CallBack: callbackTime unparseable"); return; }
          if ((now.getTime() - cb) < cbDays*DAY)  { bumpReason("CallBack: not yet cbDays overdue"); return; }
          byRule.callBack++; eligibleLeads.push(l); break;
        }
        case "HotCase":
        case "Potential":
        case "MeetingDone": {
          if (!hasClock)               { bumpReason(status + ": no lastActionAt and no lastActivityTime"); return; }
          if (ageMs < hotDays*DAY)     { bumpReason(status + ": lastActionAt too recent (< hotDays)"); return; }
          byRule.hot++; eligibleLeads.push(l); break;
        }
        default:
          bumpReason("status not in eligible list: \"" + (status || "(empty)") + "\"");
      }
    });

    var total = eligibleLeads.length;
    var diagnostic = {
      totalLeadsScanned: allLeads.length,
      excluded: excluded,
      passed: passed.length,
      byStatus: byStatus,
      eligible: { byRule: byRule, total: total },
      notEligibleReasons: notEligibleReasons,
      thresholds: {
        naCount: naCountThreshold, naHours: naHoursThreshold,
        niDays: niDays, noActDays: noActDays, cbDays: cbDays, hotDays: hotDays,
        rotationStopAfterDays: stopDays
      }
    };

    // Shuffle once for fairness so ordering in DB doesn't skew who-gets-what.
    for (var i = eligibleLeads.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = eligibleLeads[i]; eligibleLeads[i] = eligibleLeads[j]; eligibleLeads[j] = tmp;
    }

    var perAgent = {};
    agentPool.forEach(function(id){ perAgent[id] = 0; });
    var distributed = 0;
    var skipped = 0;
    var ringPtr = 0;
    var ringLen = agentPool.length;
    var byName = req.user && req.user.name ? req.user.name : "Admin";

    for (var li = 0; li < eligibleLeads.length; li++) {
      var lead = eligibleLeads[li];
      var currentAid = lead.agentId && lead.agentId._id ? String(lead.agentId._id) : String(lead.agentId || "");
      var exclusion = {};
      if (currentAid) exclusion[currentAid] = true;
      (lead.previousAgentIds || []).forEach(function(id){ if (id) exclusion[String(id)] = true; });
      (lead.assignments || []).forEach(function(a){
        var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
        if (aid) exclusion[String(aid)] = true;
      });

      var pickedId = null;
      for (var step = 0; step < ringLen; step++) {
        var candidate = agentPool[(ringPtr + step) % ringLen];
        if (!exclusion[candidate]) { pickedId = candidate; ringPtr = (ringPtr + step + 1) % ringLen; break; }
      }
      if (!pickedId) { skipped++; continue; }

      var targetUser = agentById[pickedId];
      var newAssignment = {
        agentId: new mongoose.Types.ObjectId(pickedId),
        status: "NewLead",
        assignedAt: new Date(), lastActionAt: new Date(), rotationTimer: new Date(),
        noRotation: false,
        notes: "", budget: "", callbackTime: "", lastFeedback: "", nextCallAt: null,
        agentHistory: []
      };
      var rotationLog = {
        action: "Bulk redistribution",
        fromAgent: "",
        toAgent: targetUser.name,
        reason: "bulk_redistribute_backlog",
        by: byName,
        date: new Date()
      };
      var pushOps = { assignments: newAssignment, agentHistory: rotationLog };
      if (currentAid) pushOps.previousAgentIds = new mongoose.Types.ObjectId(currentAid);

      var writeRes = await Lead.findOneAndUpdate(
        { _id: lead._id, agentId: currentAid ? new mongoose.Types.ObjectId(currentAid) : null, rotationStopped: { $ne: true } },
        {
          $set: {
            agentId: new mongoose.Types.ObjectId(pickedId),
            lastRotationAt: new Date()
          },
          $inc: { rotationCount: 1 },
          $push: pushOps
        },
        { new: true }
      );
      if (!writeRes) { skipped++; continue; }

      distributed++;
      perAgent[pickedId] = (perAgent[pickedId] || 0) + 1;
      try {
        await pushHistory(lead._id, historyEntry(
          "rotated",
          "Bulk redistribution — reassigned to " + targetUser.name + " by " + byName,
          byName,
          targetUser.name
        ));
      } catch (hErr) { /* non-fatal */ }
    }

    res.json({ total: total, distributed: distributed, skipped: skipped, perAgent: perAgent, diagnostic: diagnostic });
  } catch (e) {
    res.status(500).json({ error: e && e.message ? e.message : "bulk_redistribute_failed" });
  }
});

// ===== MANUAL ASSIGNMENT WINDOW — BACKGROUND SWEEPER =====
// Picks the next Tier 1 agent for ONE queued lead whose window expired.
// Returns {ok:true, agentId, agentName} on success, {ok:false, error} on skip.
// Shares the same tier-cascade + skip-rules logic as POST /api/leads/:id/auto-rotate,
// restricted to the "first assignment" case (queued leads have no prior agent).
async function autoAssignQueuedLead(leadId) {
  try {
    var lead = await Lead.findById(leadId).lean();
    if (!lead) return { ok: false, error: "not_found" };
    if (lead.agentId) return { ok: false, error: "already_assigned" };
    if (lead.archived) return { ok: false, error: "archived" };
    if (lead.rotationStopped) return { ok: false, error: "rotation_stopped" };
    // Top-level lock. The sweeper runs as System (no user role), so no override
    // — a locked lead never auto-assigns from the queue.
    if (lead.locked === true) return { ok: false, error: "locked" };

    var settings = await getRotationSettings();
    // Manual window sweeper is first-assignment only (agentId=null), independent of master rotation switch and pause — those only gate agent-to-agent rotation.

    var allTierIds = [].concat(settings.tiers.tier1.agents, settings.tiers.tier2.agents, settings.tiers.tier3.agents);
    if (!allTierIds.length) return { ok: false, error: "no_rotation_order" };
    var candidateDocs = await User.find({ _id: { $in: allTierIds } }).select("_id name title role active lastSeen").lean();
    var byId = {};
    candidateDocs.forEach(function(u){ byId[String(u._id)] = u; });

    // Active vacations — one bulk query, same exclusion as agent-to-agent
    // rotation. A queued lead skips a vacationing tier-1 candidate and falls
    // through to the next slot (or combined T2+T3) just like inactive/wrong-role.
    var nowVac = new Date();
    var vacRows = await AgentVacation.find({
      agentId: { $in: allTierIds },
      startDate: { $lte: nowVac },
      endDate:   { $gte: nowVac }
    }).select("agentId").lean();
    var onVacationIds = new Set(vacRows.map(function(r){ return String(r.agentId); }));

    // Queued leads are always first-assignment (rotationCount=0), so the
    // count-based picker always lands in the "rotCount < 2" branch: try Tier 1
    // first, fall through to combined Tier 2+3.
    var tryPool = function(ids, lastIdx){
      if (!Array.isArray(ids) || !ids.length) return null;
      var n = ids.length;
      var start = ((lastIdx + 1) % n + n) % n;
      for (var step = 0; step < n; step++) {
        var idx = (start + step) % n;
        var uid = String(ids[idx]);
        var u = byId[uid];
        if (!u || u.active === false) continue;
        if (["sales","team_leader"].indexOf(u.role) < 0) continue;
        if (onVacationIds.has(uid)) continue;
        return { user: u, idx: idx };
      }
      return null;
    };
    var combined23 = [];
    var seen23 = {};
    [].concat(settings.tiers.tier2.agents, settings.tiers.tier3.agents).forEach(function(id){
      var s = String(id);
      if (!seen23[s]) { seen23[s] = true; combined23.push(s); }
    });
    var pick = tryPool(settings.tiers.tier1.agents, settings.tiers.tier1.lastIdx);
    var poolKey = null;
    if (pick) { poolKey = "tier1"; }
    else {
      pick = tryPool(combined23, settings.combined23LastIdx);
      if (pick) poolKey = "combined23";
    }
    if (!pick) return { ok: false, error: "exhausted" };

    var targetAgentId = String(pick.user._id);
    var firstAssignment = {
      agentId: new mongoose.Types.ObjectId(targetAgentId),
      status: "NewLead",
      notes: "", budget: "", callbackTime: "", lastFeedback: "",
      nextCallAt: null, agentHistory: [],
      assignedAt: new Date(), lastActionAt: new Date(), rotationTimer: new Date(),
      noRotation: false
    };
    // Atomic: require the lead to still be unassigned. Clears the queue expiry
    // in the same write so another sweeper tick can't double-assign.
    var result = await Lead.findOneAndUpdate(
      { _id: leadId, agentId: null },
      {
        $set: {
          agentId: new mongoose.Types.ObjectId(targetAgentId),
          lastRotationAt: new Date(),
          manualWindowExpiresAt: null
        },
        $push: { assignments: firstAssignment }
      },
      { new: true }
    );
    if (!result) return { ok: false, error: "concurrent" };

    try {
      await pushHistory(leadId, historyEntry(
        "assigned",
        "Auto-assigned to " + pick.user.name + " by System (manual window expired)",
        "System",
        pick.user.name
      ));
    } catch(e) { /* non-fatal */ }
    try {
      var pUpd = {};
      if (poolKey === "tier1") {
        pUpd["value.tiers.tier1.lastIdx"] = pick.idx;
        pUpd["value.lastAssignedIdx"] = pick.idx;
      } else {
        pUpd["value.combined23LastIdx"] = pick.idx;
      }
      await AppSetting.updateOne({ key: "rotation" }, { $set: pUpd });
    } catch(e) { /* non-fatal */ }
    return { ok: true, agentId: targetAgentId, agentName: pick.user.name };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : "exception" };
  }
}

// Sweeper tick: finds expired queue leads and auto-assigns each in isolation.
// One lead failing (no agent, paused rotation, etc.) never stops the loop.
async function sweepExpiredQueue() {
  try {
    var expired = await Lead.find({
      agentId: null,
      archived: false,
      manualWindowExpiresAt: { $ne: null, $lt: new Date() }
    }).select("_id").limit(50).lean();
    if (!expired.length) return;
    var assigned = 0;
    for (var i = 0; i < expired.length; i++) {
      var r = await autoAssignQueuedLead(expired[i]._id);
      if (r.ok) assigned++;
    }
    if (assigned > 0) {
      try { broadcast("unassigned_updated", { swept: assigned }); } catch(e) {}
    }
  } catch (e) {
    console.error("[queue sweeper]", e && e.message ? e.message : e);
  }
}
// Runs every 60s, but only after the Mongo connection is live.
var QUEUE_SWEEP_INTERVAL_MS = 60 * 1000;
setInterval(function(){
  if (mongoose.connection && mongoose.connection.readyState === 1) sweepExpiredQueue();
}, QUEUE_SWEEP_INTERVAL_MS);

// ===== AGENT-TO-AGENT AUTO-ROTATION SWEEPER =====
// Without this, rotation only fires when a browser is open and the frontend
// hits /api/leads/:id/auto-rotate. Leads whose rules have triggered while
// nobody has the CRM open just sit forever. This sweep runs every 5 minutes
// regardless of online users and rotates anything that's eligible.
//
// All decision logic is delegated to autoRotateLead() so business rules
// (thresholds, streaks, tiers, cooldowns) stay in exactly one place. The
// helper's atomic findOneAndUpdate guards make this safe to run concurrently
// with browser-triggered rotations — duplicate triggers no-op with
// error:"concurrent_rotation".
async function sweepAutoRotation() {
  try {
    // Bail early if rotation is globally paused or disabled. The helper
    // checks this too (defense in depth) but doing it here saves us from
    // querying + iterating candidates only to skip every single one.
    var settings = await getRotationSettings();
    if (settings.autoRotationEnabled === false) return;
    if (settings.autoRotationPausedUntil && new Date(settings.autoRotationPausedUntil) > new Date()) return;

    // Coarse pre-filter — the helper still re-checks each one. limit:1000
    // bounds per-tick work; leftovers pick up on the next tick (5 min later).
    // Sort by lastRotationAt ascending so least-recently-rotated leads (and
    // never-rotated leads, which sort as null/missing first) are evaluated
    // first — guarantees fairness when the candidate set exceeds the limit.
    var candidates = await Lead.find({
      agentId: { $ne: null },
      archived: false,
      locked: { $ne: true },
      rotationStopped: { $ne: true }
    }).select("_id").sort({ lastRotationAt: 1 }).limit(1000).lean();

    if (!candidates.length) return;

    var rotated = 0;
    var skipped = 0;
    for (var i = 0; i < candidates.length; i++) {
      try {
        var r = await autoRotateLead(candidates[i]._id, "System");
        if (r && r.ok) rotated++;
        else skipped++;
      } catch (innerErr) {
        skipped++;
      }
    }

    if (rotated > 0) {
      try { broadcast("rotation_swept", { rotated: rotated }); } catch(e) {}
      console.log("[rotation sweep] rotated " + rotated + " leads, skipped " + skipped);
    }
  } catch (e) {
    console.error("[rotation sweep]", e && e.message ? e.message : e);
  }
}

var ROTATION_SWEEP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(function(){
  if (mongoose.connection && mongoose.connection.readyState === 1) sweepAutoRotation();
}, ROTATION_SWEEP_INTERVAL_MS);

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
      // Strip rotation noise from every sales-facing activity feed. Matches
      // the filter on /api/leads/:id/full-history so Today's Activities,
      // Recent Activity, and any global activity list stay rotation-free.
      query.type = { $ne: "reassign" };
      query.note = { $not: /^🔄 Auto Rotation/ };
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
    if (isSales) {
      activityQuery.userId = new mongoose.Types.ObjectId(uid);
      // Strip rotation noise: sales must never see reassign/auto-rotation rows
      // even when they authored them (their own client fired the rotation cron,
      // so userId matches — authorship alone can't gate visibility here).
      activityQuery.type = { $ne: "reassign" };
      activityQuery.note = { $not: /^🔄 Auto Rotation/ };
    }

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
        if (isSales) {
          // Drop rotation/assignment events outright — sales must not learn
          // the lead was ever held by anyone else, even when their own name
          // is stamped as byUser (auto-rotate fires as the outgoing agent).
          var ev = String(h.event || "");
          if (ev === "rotated" || ev === "assigned" || ev === "reassigned") return;
          if (!myName || String(h.byUser || "") !== myName) return;
        }
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
    if (req.user.role === "sales") { query.userId = req.user.id; }
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
    }
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
      unitType: req.body.unitType || "",
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
    if (req.body.status === "Deal Cancelled" && req.user.role !== "admin" && req.user.role !== "sales_admin") {
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
        if (req.body.status === "EOI") {
          mirrorExtra.eoiStatus = "Pending"; mirrorExtra.eoiApproved = false;
          // Only stamp eoiDate on the FIRST transition into EOI — preserve the original
          // closure date on every subsequent edit, so the deal-notifications panel doesn't
          // bump old EOIs back to "just now".
          if (!existingLead || !existingLead.eoiDate) {
            mirrorExtra.eoiDate = req.body.eoiDate || new Date().toISOString().slice(0,10);
          }
        }
        if (req.body.status === "DoneDeal") {
          mirrorExtra.globalStatus = "donedeal";
          // Only stamp dealDate on the FIRST transition into DoneDeal — preserve the
          // original closure date on every subsequent edit, so old deals don't re-surface
          // as "just closed" in the notifications panel.
          if (!existingLead || !existingLead.dealDate) {
            mirrorExtra.dealDate = new Date().toISOString().slice(0,10);
          }
        }
        // GET /api/leads filters sales-role users on assignments.agentId, not
        // the top-level agentId, so a mirror Lead with just agentId is
        // invisible to the very sales user who just created it. Seed an
        // assignments[] entry for the DR's current agent so the mirror is
        // visible in sales' leads list (and therefore on the EOI/Deals page).
        var agentForMirror = r.agentId && r.agentId._id ? r.agentId._id : r.agentId;
        // Phase 2 Slice 4 — resolve the AppSetting weight for the project
        // name we're about to stamp onto the mirror. Both branches (existing
        // lead update + new lead create) use the same resolved value; only
        // the project-name fallback chain differs slightly between branches,
        // so we compute lookup keys per-branch but share the helper.
        var existingProjectFallback = existingLead ? existingLead.project : "";
        var resolvedProjectName = req.body.project || r.propertyType || existingProjectFallback || "";
        var resolvedDrWeight = await resolveDrProjectWeight(resolvedProjectName);
        if (existingLead) {
          var existingMirrorPayload = Object.assign({
            status: req.body.status,
            budget: req.body.budget || r.budget || existingLead.budget,
            project: req.body.project || r.propertyType || existingLead.project,
            unitType: req.body.unitType || r.unitType || existingLead.unitType || "",
            agentId: r.agentId,
            lastActivityTime: new Date(),
            notes: req.body.notes || r.notes || existingLead.notes,
            eoiDeposit: req.body.eoiDeposit || existingLead.eoiDeposit || "",
          }, mirrorExtra);
          if (resolvedDrWeight !== null) existingMirrorPayload.projectWeight = resolvedDrWeight;
          await Lead.findByIdAndUpdate(existingLead._id, existingMirrorPayload);
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
          var newMirrorPayload = Object.assign({
            name: r.name, phone: r.phone, phone2: r.phone2 || "",
            email: r.email || "", budget: req.body.budget || r.budget || "",
            project: req.body.project || r.propertyType || "",
            unitType: req.body.unitType || r.unitType || "",
            notes: req.body.notes || r.notes || "",
            status: req.body.status,
            source: "Daily Request",
            agentId: r.agentId,
            callbackTime: r.callbackTime || "",
            lastActivityTime: new Date(),
            eoiDeposit: req.body.eoiDeposit || "",
            assignments: seedAssignments,
          }, mirrorExtra);
          if (resolvedDrWeight !== null) newMirrorPayload.projectWeight = resolvedDrWeight;
          await Lead.create(newMirrorPayload);
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
                    // Manual Assignment Window: if enabled, route FB leads to
                    // the unassigned queue instead of immediate auto-pick.
                    var fbSettings = null;
                    try { fbSettings = await getRotationSettings(); } catch(e) {}
                    var fbWindowMins = fbSettings ? Number(fbSettings.manualAssignmentWindowMinutes || 0) : 0;
                    var agentId = null;
                    if (fbWindowMins <= 0) {
                      // Rotation-eligible roles: sales, team_leader, manager. NEVER sales_admin.
                      var agents = await User.find({ role: { $in: ["sales","team_leader","manager"] }, active: true });
                      if (agents.length > 0) {
                        var counts = await Promise.all(agents.map(function(a) { return Lead.countDocuments({ agentId: a._id }); }));
                        agentId = agents[counts.indexOf(Math.min(...counts))]._id;
                      }
                    }
                    var newLead = await Lead.create({
                      name: leadData.name || "Facebook Lead",
                      phone: fbPhone,
                      email: leadData.email || "",
                      source: "Facebook",
                      status: "Potential",
                      agentId: agentId,
                      lastActivityTime: new Date(),
                      notes: "Facebook Lead Ads",
                      assignments: agentId ? [{ agentId: agentId, status: "NewLead", assignedAt: new Date(), lastActionAt: new Date(), rotationTimer: new Date(), noRotation: false, notes: "", budget: "", callbackTime: "", lastFeedback: "", nextCallAt: null, agentHistory: [] }] : [],
                      manualWindowExpiresAt: (fbWindowMins > 0 && !agentId) ? new Date(Date.now() + fbWindowMins*60000) : null
                    });
                    if (agentId) {
                      await Activity.create({ userId: agentId, leadId: newLead._id, type: "note", note: "Facebook Lead Ads" });
                    }
                    console.log("FB lead saved:", newLead.name, fbWindowMins > 0 && !agentId ? "(queued)" : "");
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
    var uid = req.user.id; var now = new Date(); var DAY=86400000; var MONTH=30*DAY;
    var todayStart = new Date(); todayStart.setHours(0,0,0,0);

    var myLeads = await Lead.find({archived:false,agentId:new mongoose.Types.ObjectId(uid)}).lean();
    var allActs = await Activity.find({userId:uid}).lean();
    var allUsers = await User.find({active:true,role:{$in:["sales","sales_admin"]}}).lean();
    var allLeads = await Lead.find({archived:false}).lean();

    // Get my assignment data for each lead
    var getMyAssign = function(l){return (l.assignments||[]).find(function(a){return String(a.agentId&&a.agentId._id?a.agentId._id:a.agentId)===String(uid);});};

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


// ===== REPORTS — Phase 1 OVERVIEW =====
// Access: admin / sales_admin only. Per the Phase-1 access-policy decision,
// every other role gets 403 here even if a manager/TL somehow reaches the URL.
function reportsAuth(req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "sales_admin") {
    return res.status(403).json({ error: "Reports are restricted to Admin and Sales Admin." });
  }
  next();
}

// Optional team-filter helper. The Reports toolbar lets admin/SA slice the
// view to a single manager / TL's report tree. Returns null when no filter,
// or an ObjectId[] of agents to scope agentId / splitAgent2Id matches against.
async function getReportsTeamScope(teamUserId) {
  if (!teamUserId) return null;
  try {
    var teamUser = await User.findById(teamUserId).lean();
    if (!teamUser) return null;
    var ids = [teamUser._id];
    if (teamUser.role === "team_leader") {
      var directs = await User.find({ active: true, reportsTo: teamUser._id, role: { $in: ["sales", "team_leader"] }}).select("_id").lean();
      directs.forEach(function(u){ ids.push(u._id); });
    } else if (teamUser.role === "manager") {
      var direct = await User.find({ active: true, reportsTo: teamUser._id }).select("_id role").lean();
      direct.forEach(function(u){ ids.push(u._id); });
      var tlIds = direct.filter(function(u){ return u.role === "team_leader"; }).map(function(u){ return u._id; });
      if (tlIds.length) {
        var tlReports = await User.find({ active: true, reportsTo: { $in: tlIds }, role: "sales" }).select("_id").lean();
        tlReports.forEach(function(u){ ids.push(u._id); });
      }
    }
    return ids;
  } catch (e) {
    console.error("[reports] getReportsTeamScope:", e && e.message);
    return null;
  }
}

function reportsParseRange(from, to) {
  var f = from != null ? Number(from) : NaN;
  var t = to   != null ? Number(to)   : NaN;
  if (!isFinite(f) || !isFinite(t) || f >= t) {
    var monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    return { from: monthStart.getTime(), to: Date.now() };
  }
  return { from: f, to: t };
}

// GET /api/reports/overview/kpis
// Returns the 4 top-line KPIs (revenue, pipeline, avg deal size, conv %)
// each with prev-period delta + a sparkline aligned to the bucket grid
// (daily for ranges <= 31d, weekly Saturday-start otherwise to match the
// existing dashboard convention).
//
// COLLECTION ROLES — deals/EOIs/leads count uniformly across Lead and
// DailyRequest without double-counting:
//   - Every DR DoneDeal/EOI auto-creates a Lead mirror via the PUT
//     /api/daily-requests/:id handler (search "DR-EOI/Deal mirror"), with
//     source="Daily Request" + the relevant globalStatus / eoiStatus.
//     The mirror carries the project, projectWeight (denormalised cache,
//     defaults to 1), splitAgent2Id, and agentId — i.e. every field the
//     existing weighted-revenue formula reads. So all "deal facts" live
//     on Lead, and Lead.DoneDeal IS the canonical superset of native +
//     DR-sourced deals.
//   - DR is queried only for INTAKE (denominator of conversion %).
//     DR creations aren't mirrored to Lead, so they're real new leads,
//     not duplicates.
//   - PIPELINE VALUE is Lead-only. Pipeline-state DRs (HotCase, CallBack,
//     MeetingDone, Potential) are NOT mirrored — they exist only in DR
//     and represent casual inquiries that shouldn't inflate the
//     executive "open pipeline" number. Reports KPI matches the
//     Lead-only convention used by DealsPage / TeamPage / KPIsPage.
//
// Source filter case-split:
//   - sourceFilter == null            → Lead matches all sources; DR included.
//                                        Lead intake branch additionally excludes
//                                        source="Daily Request" so DR mirror docs
//                                        don't count as native lead intake (they're
//                                        DR creations, counted via DR's intake).
//   - sourceFilter == "Daily Request" → Lead matches mirrors only; DR included.
//                                        Lead intake conjunction is empty (correct).
//   - sourceFilter == other           → Lead matches that source; DR skipped.
//
// Revenue math:
//   - Raw budget sum across all DoneDeal Leads (NO projectWeight, NO
//     split halving). Matches DealsPage admin gross-volume total — the
//     executive headline number for total deal volume booked. Reports
//     is the executive view; agent-share weighting (used by TeamPage /
//     KPIsPage / my-stats / commission) deliberately does NOT apply here.
//   - DR has no deals branch — DR DoneDeals are counted via their Lead
//     mirrors (status='DoneDeal' on Lead).
//
// Pipeline value also uses raw budget — open pipeline doesn't apply
// closed-deal weighting in any current view.
app.get("/api/reports/overview/kpis", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    var prevDur = range.to - range.from;
    var prevFromDate = new Date(range.from - prevDur);
    var prevToDate = new Date(range.from);

    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    // Lead query always runs — it owns all deal facts (native + DR mirrors).
    // DR query runs unless filtered to a non-DR source.
    var includeDR = !sourceFilter || sourceFilter === "Daily Request";

    var leadMatch = { archived: false };
    if (sourceFilter) leadMatch.source = sourceFilter;
    if (scopeIds) leadMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var drMatch = { archived: { $ne: true }};
    if (scopeIds) drMatch.agentId = { $in: scopeIds };

    var pipelineStatuses = ["Potential", "HotCase", "MeetingDone", "CallBack"];

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};

    var rangeMs = range.to - range.from;
    var bucketUnit = rangeMs <= 31 * 86400000 ? "day" : "week";
    var truncBy = function(field){ return { $dateTrunc: { date: field, unit: bucketUnit, startOfWeek: "saturday" }}; };

    var drEmptyShape = { intakeCurrent: [], intakePrevious: [], intakeSparkline: [] };

    var leadAggP = Lead.aggregate([
      { $match: leadMatch },
      { $addFields: {
          budgetNum: budgetNumExpr,
          dealAt: { $cond: [
            { $and: [{ $ne: ["$dealDate", ""] }, { $ne: ["$dealDate", null] }] },
            { $toDate: "$dealDate" },
            "$updatedAt"
          ]}
      }},
      { $facet: {
          // Deals — Lead.DoneDeal includes DR mirrors, so this is the canonical
          // "all deals" set. Raw budget = DealsPage admin gross-volume total.
          // dealStatus guard mirrors DealsPage's exclusion of cancelled deals.
          dealsCurrent:    [{ $match: { status: "DoneDeal", dealStatus: { $ne: "Deal Cancelled" }, dealAt: { $gte: fromDate,     $lt: toDate     }}}, { $group: { _id: null, revenue: { $sum: "$budgetNum" }, count: { $sum: 1 }}}],
          dealsPrevious:   [{ $match: { status: "DoneDeal", dealStatus: { $ne: "Deal Cancelled" }, dealAt: { $gte: prevFromDate, $lt: prevToDate }}}, { $group: { _id: null, revenue: { $sum: "$budgetNum" }, count: { $sum: 1 }}}],
          dealsSparkline:  [{ $match: { status: "DoneDeal", dealStatus: { $ne: "Deal Cancelled" }, dealAt: { $gte: fromDate,     $lt: toDate     }}}, { $group: { _id: truncBy("$dealAt"), revenue: { $sum: "$budgetNum" }, count: { $sum: 1 }}}, { $sort: { _id: 1 }}],
          // Intake — exclude mirrors (source="Daily Request") so they don't
          // count as native lead creation. Real DR creations counted via DR query.
          intakeCurrent:   [{ $match: { createdAt: { $gte: fromDate,     $lt: toDate     }, source: { $ne: "Daily Request" }}}, { $group: { _id: null, count: { $sum: 1 }}}],
          intakePrevious:  [{ $match: { createdAt: { $gte: prevFromDate, $lt: prevToDate }, source: { $ne: "Daily Request" }}}, { $group: { _id: null, count: { $sum: 1 }}}],
          intakeSparkline: [{ $match: { createdAt: { $gte: fromDate,     $lt: toDate     }, source: { $ne: "Daily Request" }}}, { $group: { _id: truncBy("$createdAt"), count: { $sum: 1 }}}, { $sort: { _id: 1 }}],
          // Pipeline — mirrors don't have pipeline status, so no extra source guard needed.
          pipelineSnapshot:[{ $match: { status: { $in: pipelineStatuses }, globalStatus: { $nin: ["donedeal", "eoi"] }}}, { $group: { _id: null, value: { $sum: "$budgetNum" }, count: { $sum: 1 }}}],
          pipelineSpark:   [{ $match: { status: { $in: pipelineStatuses }, globalStatus: { $nin: ["donedeal", "eoi"] }, createdAt: { $gte: fromDate, $lt: toDate }}}, { $group: { _id: truncBy("$createdAt"), value: { $sum: "$budgetNum" }}}, { $sort: { _id: 1 }}]
      }}
    ]);

    // DR contributes ONLY intake (conversion denominator). Pipeline value
    // is Lead-only — see endpoint header comment for rationale.
    var drAggP = includeDR ? DailyRequest.aggregate([
      { $match: drMatch },
      { $facet: {
          intakeCurrent:   [{ $match: { createdAt: { $gte: fromDate,     $lt: toDate     }}}, { $group: { _id: null, count: { $sum: 1 }}}],
          intakePrevious:  [{ $match: { createdAt: { $gte: prevFromDate, $lt: prevToDate }}}, { $group: { _id: null, count: { $sum: 1 }}}],
          intakeSparkline: [{ $match: { createdAt: { $gte: fromDate,     $lt: toDate     }}}, { $group: { _id: truncBy("$createdAt"), count: { $sum: 1 }}}, { $sort: { _id: 1 }}]
      }}
    ]) : Promise.resolve([drEmptyShape]);

    var parts = await Promise.all([leadAggP, drAggP]);
    var leadR = parts[0][0] || {};
    var drR   = parts[1][0] || {};

    var pull = function(arr, defaults) {
      var x = (arr || [])[0] || {};
      return Object.assign({}, defaults, x);
    };
    var revDef = { revenue: 0, count: 0 };
    var cntDef = { count: 0 };
    var valDef = { value: 0, count: 0 };

    var leadDealsCur   = pull(leadR.dealsCurrent, revDef);
    var leadDealsPrev  = pull(leadR.dealsPrevious, revDef);
    var leadIntakeCur  = pull(leadR.intakeCurrent, cntDef);
    var leadIntakePrev = pull(leadR.intakePrevious, cntDef);
    var leadPipeline   = pull(leadR.pipelineSnapshot, valDef);

    var drIntakeCur    = pull(drR.intakeCurrent, cntDef);
    var drIntakePrev   = pull(drR.intakePrevious, cntDef);

    var totalRevenueCur  = leadDealsCur.revenue;
    var totalRevenuePrev = leadDealsPrev.revenue;
    var totalDealsCur    = leadDealsCur.count;
    var totalDealsPrev   = leadDealsPrev.count;
    var totalIntakeCur   = leadIntakeCur.count + drIntakeCur.count;
    var totalIntakePrev  = leadIntakePrev.count + drIntakePrev.count;
    var totalPipeline    = leadPipeline.value;

    // Build the canonical bucket sequence on the JS side and look up the
    // grouped rows by their UTC-truncated bucket-start ms — must match the
    // way $dateTrunc rounded each row.
    var DAY_MS = 86400000;
    var bucketStart;
    var fd = new Date(fromDate);
    var fdUTC = Date.UTC(fd.getUTCFullYear(), fd.getUTCMonth(), fd.getUTCDate());
    if (bucketUnit === "day") {
      bucketStart = fdUTC;
    } else {
      var dow = new Date(fdUTC).getUTCDay();
      var daysSinceSat = (dow - 6 + 7) % 7;
      bucketStart = fdUTC - daysSinceSat * DAY_MS;
    }
    var stepMs = bucketUnit === "day" ? DAY_MS : 7 * DAY_MS;
    var buckets = [];
    for (var bm = bucketStart; bm < range.to; bm += stepMs) buckets.push(bm);

    var lookupBy = function(arr){
      var m = {};
      (arr || []).forEach(function(b){ m[new Date(b._id).getTime()] = b; });
      return m;
    };
    var leadDealsByB    = lookupBy(leadR.dealsSparkline);
    var leadIntakeByB   = lookupBy(leadR.intakeSparkline);
    var leadPipelineByB = lookupBy(leadR.pipelineSpark);
    var drIntakeByB     = lookupBy(drR.intakeSparkline);

    var combine = function(t, lookups, key){
      var sum = 0;
      for (var i = 0; i < lookups.length; i++) {
        var b = lookups[i][t];
        if (b) sum += (b[key] || 0);
      }
      return sum;
    };

    var revenueSpark   = buckets.map(function(t){ var b = leadDealsByB[t]; return b ? Math.round(b.revenue) : 0; });
    var dealCountSpark = buckets.map(function(t){ var b = leadDealsByB[t]; return b ? b.count : 0; });
    var intakeSpark    = buckets.map(function(t){ return combine(t, [leadIntakeByB, drIntakeByB], "count"); });
    var avgSpark       = buckets.map(function(_, i){ var c = dealCountSpark[i]; var r = revenueSpark[i]; return c > 0 ? Math.round(r / c) : 0; });
    var convSpark      = buckets.map(function(_, i){ var d = dealCountSpark[i]; var l = intakeSpark[i]; return l > 0 ? Math.round((d / l) * 1000) / 10 : 0; });
    var pipelineSpark  = buckets.map(function(t){ var b = leadPipelineByB[t]; return b ? Math.round(b.value) : 0; });

    var deltaPct = function(cur, prev){
      if (!prev || prev === 0) return null;
      return Math.round(((cur - prev) / prev) * 1000) / 10;
    };
    var deltaPp = function(cur, prev){
      if (cur == null || prev == null) return null;
      return Math.round((cur - prev) * 10) / 10;
    };

    var avgCur  = totalDealsCur  > 0 ? totalRevenueCur  / totalDealsCur  : 0;
    var avgPrev = totalDealsPrev > 0 ? totalRevenuePrev / totalDealsPrev : 0;
    var convCur  = totalIntakeCur  > 0 ? (totalDealsCur  / totalIntakeCur)  * 100 : 0;
    var convPrev = totalIntakePrev > 0 ? (totalDealsPrev / totalIntakePrev) * 100 : 0;

    res.json({
      range: { from: fromDate.toISOString(), to: toDate.toISOString(), bucketUnit: bucketUnit, buckets: buckets.length },
      kpis: {
        revenue:       { value: Math.round(totalRevenueCur),   prev: Math.round(totalRevenuePrev),  deltaPct: deltaPct(totalRevenueCur, totalRevenuePrev), sparkline: revenueSpark },
        pipelineValue: { value: Math.round(totalPipeline),     prev: null,                          deltaPct: null,                                        sparkline: pipelineSpark },
        avgDealSize:   { value: Math.round(avgCur),            prev: Math.round(avgPrev),           deltaPct: deltaPct(avgCur, avgPrev),                   sparkline: avgSpark },
        convRatePct:   { value: Math.round(convCur * 10) / 10, prev: Math.round(convPrev * 10) / 10, deltaPp: deltaPp(convCur, convPrev),                  sparkline: convSpark }
      }
    });
  } catch (e) {
    console.error("[reports/overview/kpis]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "kpis_failed" });
  }
});

// GET /api/reports/overview/trends
// Daily (or weekly for ranges > 31d) buckets of three time series:
//   - leads created (Lead native intake + DR intake — same union as the
//     KPI conversion denominator).
//   - deals closed (Lead.DoneDeal with dealStatus != "Deal Cancelled",
//     dealAt = dealDate(parsed) || updatedAt). Lead-only — DR DoneDeals
//     are counted via their Lead mirrors.
//   - calls made (Activity where type === "call").
// Source filter applies to leads/deals (same case-split as KPIs); calls
// are not source-filtered — Activity has no source attribution and a
// per-request $lookup would be expensive. Callers should treat calls as
// a global activity series, not a per-source one.
app.get("/api/reports/overview/trends", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);

    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var includeDR = !sourceFilter || sourceFilter === "Daily Request";

    var leadMatch = { archived: false };
    if (sourceFilter) leadMatch.source = sourceFilter;
    if (scopeIds) leadMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var drMatch = { archived: { $ne: true }, createdAt: { $gte: fromDate, $lt: toDate }};
    if (scopeIds) drMatch.agentId = { $in: scopeIds };

    var activityMatch = { type: "call", createdAt: { $gte: fromDate, $lt: toDate }};
    if (scopeIds) activityMatch.userId = { $in: scopeIds };

    var rangeMs = range.to - range.from;
    var bucketUnit = rangeMs <= 31 * 86400000 ? "day" : "week";
    var truncBy = function(field){ return { $dateTrunc: { date: field, unit: bucketUnit, startOfWeek: "saturday" }}; };

    var leadAggP = Lead.aggregate([
      { $match: leadMatch },
      { $addFields: {
          dealAt: { $cond: [
            { $and: [{ $ne: ["$dealDate", ""] }, { $ne: ["$dealDate", null] }] },
            { $toDate: "$dealDate" },
            "$updatedAt"
          ]}
      }},
      { $facet: {
          dealsPerBucket: [
            { $match: { status: "DoneDeal", dealStatus: { $ne: "Deal Cancelled" }, dealAt: { $gte: fromDate, $lt: toDate }}},
            { $group: { _id: truncBy("$dealAt"), count: { $sum: 1 }}},
            { $sort: { _id: 1 }}
          ],
          intakePerBucket: [
            { $match: { createdAt: { $gte: fromDate, $lt: toDate }, source: { $ne: "Daily Request" }}},
            { $group: { _id: truncBy("$createdAt"), count: { $sum: 1 }}},
            { $sort: { _id: 1 }}
          ]
      }}
    ]);

    var drAggP = includeDR ? DailyRequest.aggregate([
      { $match: drMatch },
      { $group: { _id: truncBy("$createdAt"), count: { $sum: 1 }}},
      { $sort: { _id: 1 }}
    ]) : Promise.resolve([]);

    var actAggP = Activity.aggregate([
      { $match: activityMatch },
      { $group: { _id: truncBy("$createdAt"), count: { $sum: 1 }}},
      { $sort: { _id: 1 }}
    ]);

    var parts = await Promise.all([leadAggP, drAggP, actAggP]);
    var leadR = parts[0][0] || {};
    var drArr = parts[1] || [];
    var actArr = parts[2] || [];

    var lookupBy = function(arr){
      var m = {};
      (arr || []).forEach(function(b){ m[new Date(b._id).getTime()] = b; });
      return m;
    };
    var leadDealsByB  = lookupBy(leadR.dealsPerBucket);
    var leadIntakeByB = lookupBy(leadR.intakePerBucket);
    var drIntakeByB   = lookupBy(drArr);
    var callsByB      = lookupBy(actArr);

    // Build the bucket sequence in UTC so the JS-side keys match $dateTrunc's
    // rounded values. Same logic the KPIs endpoint uses for its sparklines.
    var DAY_MS = 86400000;
    var bucketStart;
    var fd = new Date(fromDate);
    var fdUTC = Date.UTC(fd.getUTCFullYear(), fd.getUTCMonth(), fd.getUTCDate());
    if (bucketUnit === "day") {
      bucketStart = fdUTC;
    } else {
      var dow = new Date(fdUTC).getUTCDay();
      var daysSinceSat = (dow - 6 + 7) % 7;
      bucketStart = fdUTC - daysSinceSat * DAY_MS;
    }
    var stepMs = bucketUnit === "day" ? DAY_MS : 7 * DAY_MS;
    var buckets = [];
    for (var bm = bucketStart; bm < range.to; bm += stepMs) buckets.push(bm);

    var series = buckets.map(function(t){
      var leadsCount = ((leadIntakeByB[t] || {}).count || 0) + ((drIntakeByB[t] || {}).count || 0);
      var dealsCount = (leadDealsByB[t] || {}).count || 0;
      var callsCount = (callsByB[t] || {}).count || 0;
      return { date: new Date(t).toISOString().slice(0,10), leads: leadsCount, deals: dealsCount, calls: callsCount };
    });

    res.json({
      range: { from: fromDate.toISOString(), to: toDate.toISOString(), bucketUnit: bucketUnit, buckets: buckets.length },
      series: series
    });
  } catch (e) {
    console.error("[reports/overview/trends]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "trends_failed" });
  }
});

// GET /api/reports/overview/funnel
// Returns the conversion funnel for leads CREATED in the period:
// Total Leads → Contacted → Meeting → EOI → Deal. Each stage has
// count, conversion %, drop-off %, and (Lead-side only) avg days
// from the previous stage's transition.
//
// PRINCIPLE — each stage's filter is the EXACT same query the
// corresponding page uses, scoped to leads created in the period:
//   - Total Leads: every lead created in period (Lead native + DR;
//     mirrors excluded when source filter is null/non-DR; skip Lead
//     entirely when source filter is "Daily Request" to avoid mirror
//     double-count). Includes leads currently in EOI / DoneDeal /
//     Deal-Cancelled status (Leads-page UI hides those, but the funnel
//     denominator must include them or the math inverts).
//   - Contacted (synthetic): any of {status != "NewLead", any
//     assignments[].lastActionAt set, history has a "status_change" or
//     "status_changed" event (only past-tense form is written today —
//     matching both for safety), notes/lastFeedback/callbackTime set}.
//     OR forward-superset (already in Meeting/EOI/Deal).
//   - Meeting: hadMeeting === true OR status === "MeetingDone" OR
//     forward-superset (already in EOI/Deal).
//   - EOI (matches EOI page Pending+Approved tabs at App.js:5734):
//     status != "Deal Cancelled" AND eoiStatus NOT IN
//     ["EOI Cancelled", "Deal Cancelled"] AND
//     (eoiStatus IN ["Pending", "Approved"] OR status === "EOI"),
//     OR forward-superset (already in Deal).
//   - Deal (matches DealsPage activeDeals at App.js:6246):
//     (status === "DoneDeal" OR globalStatus === "donedeal") AND
//     dealStatus != "Deal Cancelled" AND status != "Deal Cancelled".
//
// Forward-superset is enforced via OR'd boolean flags so each stage
// is mathematically a superset of the next — Contacted ⊇ Meeting ⊇
// EOI ⊇ Deal. A defensive JS-side clamp + warning log catches any
// regression.
//
// Avg-days: Lead-side timestamp markers — earliest of
// assignments[].lastActionAt for "contacted-at", meetingDoneAt for
// "meeting-at", parsed eoiDate / dealDate for "eoi-at" / "deal-at".
// $avg ignores nulls so each stage's avg is computed only over leads
// that reached BOTH stages. DR contributes to counts only.
//
// Bottleneck: stage (after Total) with biggest drop-off; ties broken
// by longest avgDays.
//
// Date semantics: every count is filtered by createdAt-in-period.
// EOI / Deal counts will not equal the EOI/Deals page totals (those
// pages have no date filter); the funnel scopes to in-period intake
// only. Frontend surfaces this caveat via ⓘ tooltips.
app.get("/api/reports/overview/funnel", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);

    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var includeLead = sourceFilter !== "Daily Request";
    var includeDR   = !sourceFilter || sourceFilter === "Daily Request";

    var leadMatch = {
      archived: false,
      createdAt: { $gte: fromDate, $lt: toDate }
    };
    if (sourceFilter && sourceFilter !== "Daily Request") {
      leadMatch.source = sourceFilter;
    } else {
      leadMatch.source = { $ne: "Daily Request" };
    }
    if (scopeIds) leadMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var drMatch = {
      archived: { $ne: true },
      createdAt: { $gte: fromDate, $lt: toDate }
    };
    if (scopeIds) drMatch.agentId = { $in: scopeIds };

    var DAY_MS = 86400000;

    var leadAggP = includeLead ? Lead.aggregate([
      { $match: leadMatch },
      // Real-contact existence check (lead-level, no userId scope) —
      // feeds isContactedRaw below. Pairs with the diff-gated history-
      // event check inside isContactedRaw to form the contacted UNION
      // pattern Lead Aging uses.
      //
      // SYNC INVARIANT: the isContactedRaw definition below MUST match
      // the shape used in all three "is the lead contacted?" surfaces:
      //   - /api/reports/overview/funnel               (this endpoint)
      //   - /api/reports/agents/:id/stage-progression
      //   - /api/reports/overview/aging                (the original fix)
      // Editing one without the others reintroduces the inflation bug
      // where rotation slices (assignments[].lastActionAt = now),
      // legacy non-diff-gated "status_change" events, and state-only
      // checks (notes/lastFeedback/callbackTime non-empty) all fired,
      // pushing Contacted % to ~100% across every agent.
      { $lookup: {
          from: "activities",
          let: { lid: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ["$leadId", "$$lid"] },
                { $in: ["$type", ["call", "meeting", "followup", "email", "note"]] }
            ]}}},
            { $limit: 1 },
            { $project: { _id: 1 } }
          ],
          as: "contactActs"
      }},
      // Derived timestamp helpers used by both stage flags and avg-days math.
      { $addFields: {
          earliestLastActionAt: { $min: "$assignments.lastActionAt" },
          eoiAt: { $cond: [
            { $and: [{ $ne: ["$eoiDate", ""] }, { $ne: ["$eoiDate", null] }] },
            { $toDate: "$eoiDate" },
            null
          ]},
          dealAtFunnel: { $cond: [
            { $and: [{ $ne: ["$dealDate", ""] }, { $ne: ["$dealDate", null] }] },
            { $toDate: "$dealDate" },
            null
          ]}
      }},
      // Raw stage flags — each mirrors the corresponding page's exact filter.
      { $addFields: {
          isDealRaw: { $and: [
            { $or: [
              { $eq: ["$status", "DoneDeal"] },
              { $eq: ["$globalStatus", "donedeal"] }
            ]},
            { $ne: ["$dealStatus", "Deal Cancelled"] },
            { $ne: ["$status", "Deal Cancelled"] }
          ]},
          isEoiRaw: { $and: [
            { $ne: ["$status", "Deal Cancelled"] },
            { $ne: ["$eoiStatus", "EOI Cancelled"] },
            { $ne: ["$eoiStatus", "Deal Cancelled"] },
            { $or: [
              { $eq: ["$eoiStatus", "Pending"] },
              { $eq: ["$eoiStatus", "Approved"] },
              { $eq: ["$status", "EOI"] }
            ]}
          ]},
          isMeetingRaw: { $or: [
            { $eq: ["$hadMeeting", true] },
            { $eq: ["$status", "MeetingDone"] }
          ]},
          // Lead-level real-contact UNION. See sync-invariant comment
          // above the $lookup for context; mirrors Lead Aging's pattern.
          isContactedRaw: { $or: [
            // 1. Diff-gated history events — fire only when the underlying
            //    field actually changed. NOT "status_change" (no 'd'), the
            //    legacy non-diff-gated form rotation handlers used to emit.
            { $anyElementTrue: { $map: {
                input: { $ifNull: ["$history", []] },
                as: "h",
                in: { $in: ["$$h.event", ["status_changed", "feedback_added", "callback_scheduled"]] }
            }}},
            // 2. Any contact-type Activity on this lead — boolean
            //    existence via the $lookup above (limit:1 in sub-pipeline).
            { $gt: [{ $size: "$contactActs" }, 0] }
          ]}
      }},
      // Forward-superset OR. Contacted ⊇ Meeting ⊇ EOI ⊇ Deal.
      { $addFields: {
          isDeal:       "$isDealRaw",
          isEoi:        { $or: ["$isEoiRaw",       "$isDealRaw"] },
          isMeeting:    { $or: ["$isMeetingRaw",   "$isEoiRaw",     "$isDealRaw"] },
          isContacted:  { $or: ["$isContactedRaw", "$isMeetingRaw", "$isEoiRaw", "$isDealRaw"] }
      }},
      { $addFields: {
          dContact: { $cond: [
            { $and: [
              { $ne: ["$earliestLastActionAt", null] },
              { $gte: [{ $subtract: ["$earliestLastActionAt", "$createdAt"] }, 0] }
            ]},
            { $divide: [{ $subtract: ["$earliestLastActionAt", "$createdAt"] }, DAY_MS] },
            null
          ]},
          dMeeting: { $cond: [
            { $and: [
              { $eq: ["$hadMeeting", true] },
              { $ne: ["$meetingDoneAt", null] },
              { $ne: ["$earliestLastActionAt", null] },
              { $gte: [{ $subtract: ["$meetingDoneAt", "$earliestLastActionAt"] }, 0] }
            ]},
            { $divide: [{ $subtract: ["$meetingDoneAt", "$earliestLastActionAt"] }, DAY_MS] },
            null
          ]},
          dEoi: { $cond: [
            { $and: [
              { $ne: ["$eoiAt", null] },
              { $ne: ["$meetingDoneAt", null] },
              { $gte: [{ $subtract: ["$eoiAt", "$meetingDoneAt"] }, 0] }
            ]},
            { $divide: [{ $subtract: ["$eoiAt", "$meetingDoneAt"] }, DAY_MS] },
            null
          ]},
          dDeal: { $cond: [
            { $and: [
              { $ne: ["$dealAtFunnel", null] },
              { $ne: ["$eoiAt", null] },
              { $gte: [{ $subtract: ["$dealAtFunnel", "$eoiAt"] }, 0] }
            ]},
            { $divide: [{ $subtract: ["$dealAtFunnel", "$eoiAt"] }, DAY_MS] },
            null
          ]}
      }},
      { $group: {
          _id: null,
          total: { $sum: 1 },
          contacted: { $sum: { $cond: ["$isContacted", 1, 0] } },
          meeting:   { $sum: { $cond: ["$isMeeting",   1, 0] } },
          eoi:       { $sum: { $cond: ["$isEoi",       1, 0] } },
          deal:      { $sum: { $cond: ["$isDeal",      1, 0] } },
          avgContact: { $avg: "$dContact" },
          avgMeeting: { $avg: "$dMeeting" },
          avgEoi:     { $avg: "$dEoi" },
          avgDeal:    { $avg: "$dDeal" }
      }}
    ]) : Promise.resolve([]);

    // DR-side: same stage shape, adapted to fields DR has (no assignments[],
    // no globalStatus, no history, no splitAgent2Id).
    var drAggP = includeDR ? DailyRequest.aggregate([
      { $match: drMatch },
      { $addFields: {
          isDealRaw: { $and: [
            { $eq: ["$status", "DoneDeal"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] },
            { $ne: ["$status", "Deal Cancelled"] }
          ]},
          isEoiRaw: { $and: [
            { $ne: ["$status", "Deal Cancelled"] },
            { $ne: ["$eoiStatus", "EOI Cancelled"] },
            { $ne: ["$eoiStatus", "Deal Cancelled"] },
            { $or: [
              { $eq: ["$eoiStatus", "Pending"] },
              { $eq: ["$eoiStatus", "Approved"] },
              { $eq: ["$status", "EOI"] }
            ]}
          ]},
          isMeetingRaw: { $or: [
            { $eq: ["$hadMeeting", true] },
            { $eq: ["$status", "MeetingDone"] }
          ]},
          isContactedRaw: { $or: [
            { $ne: ["$status", "NewLead"] },
            { $and: [{ $ne: ["$notes", ""] }, { $ne: ["$notes", null] }] },
            { $and: [{ $ne: ["$lastFeedback", ""] }, { $ne: ["$lastFeedback", null] }] },
            { $and: [{ $ne: ["$callbackTime", ""] }, { $ne: ["$callbackTime", null] }] }
          ]}
      }},
      { $addFields: {
          isDeal:      "$isDealRaw",
          isEoi:       { $or: ["$isEoiRaw",       "$isDealRaw"] },
          isMeeting:   { $or: ["$isMeetingRaw",   "$isEoiRaw",     "$isDealRaw"] },
          isContacted: { $or: ["$isContactedRaw", "$isMeetingRaw", "$isEoiRaw", "$isDealRaw"] }
      }},
      { $group: {
          _id: null,
          total: { $sum: 1 },
          contacted: { $sum: { $cond: ["$isContacted", 1, 0] } },
          meeting:   { $sum: { $cond: ["$isMeeting",   1, 0] } },
          eoi:       { $sum: { $cond: ["$isEoi",       1, 0] } },
          deal:      { $sum: { $cond: ["$isDeal",      1, 0] } }
      }}
    ]) : Promise.resolve([]);

    var parts = await Promise.all([leadAggP, drAggP]);
    var leadR = (parts[0] || [])[0] || {};
    var drR   = (parts[1] || [])[0] || {};

    var pull = function(o, k){ return Number(o && o[k]) || 0; };

    var totalCount     = pull(leadR, "total")     + pull(drR, "total");
    var contactedCount = pull(leadR, "contacted") + pull(drR, "contacted");
    var meetingCount   = pull(leadR, "meeting")   + pull(drR, "meeting");
    var eoiCount       = pull(leadR, "eoi")       + pull(drR, "eoi");
    var dealCount      = pull(leadR, "deal")      + pull(drR, "deal");

    // Defensive monotonic clamp. Forward-superset OR makes this mathematically
    // guaranteed; if a clamp fires, the query has a logic bug — log loudly.
    if (contactedCount > totalCount)     { console.warn("[funnel] clamp contacted", contactedCount, "->", totalCount);     contactedCount = totalCount; }
    if (meetingCount   > contactedCount) { console.warn("[funnel] clamp meeting",   meetingCount,   "->", contactedCount); meetingCount   = contactedCount; }
    if (eoiCount       > meetingCount)   { console.warn("[funnel] clamp eoi",       eoiCount,       "->", meetingCount);   eoiCount       = meetingCount; }
    if (dealCount      > eoiCount)       { console.warn("[funnel] clamp deal",      dealCount,      "->", eoiCount);       dealCount      = eoiCount; }

    var convPct = function(cur, prev){
      if (!prev || prev === 0) return null;
      return Math.round((cur / prev) * 1000) / 10;
    };
    var dropPct = function(cur, prev){
      var c = convPct(cur, prev);
      return c == null ? null : Math.round((100 - c) * 10) / 10;
    };
    var rd = function(v){ return v == null ? null : Math.round(v * 10) / 10; };

    var stages = [
      { key: "leads",     label: "Total Leads", count: totalCount,     conversionPct: null,                                  dropOffPct: null,                                  avgDays: null },
      { key: "contacted", label: "Contacted",   count: contactedCount, conversionPct: convPct(contactedCount, totalCount),   dropOffPct: dropPct(contactedCount, totalCount),   avgDays: rd(leadR.avgContact) },
      { key: "meeting",   label: "Meeting",     count: meetingCount,   conversionPct: convPct(meetingCount,   contactedCount),dropOffPct: dropPct(meetingCount,   contactedCount),avgDays: rd(leadR.avgMeeting) },
      { key: "eoi",       label: "EOI",         count: eoiCount,       conversionPct: convPct(eoiCount,       meetingCount), dropOffPct: dropPct(eoiCount,       meetingCount), avgDays: rd(leadR.avgEoi) },
      { key: "deal",      label: "Deal",        count: dealCount,      conversionPct: convPct(dealCount,      eoiCount),     dropOffPct: dropPct(dealCount,      eoiCount),     avgDays: rd(leadR.avgDeal) }
    ];

    var bottleneckKey = null, worstDrop = -1, worstAvg = -1;
    for (var i = 1; i < stages.length; i++) {
      var s = stages[i];
      if (s.dropOffPct == null) continue;
      var avg = s.avgDays || 0;
      if (s.dropOffPct > worstDrop || (s.dropOffPct === worstDrop && avg > worstAvg)) {
        worstDrop = s.dropOffPct;
        worstAvg = avg;
        bottleneckKey = s.key;
      }
    }

    res.json({
      range: { from: fromDate.toISOString(), to: toDate.toISOString() },
      stages: stages,
      bottleneckKey: bottleneckKey,
      avgDaysSource: "lead-timestamps"
    });
  } catch (e) {
    console.error("[reports/overview/funnel]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "funnel_failed" });
  }
});

// GET /api/reports/overview/source-roi
// Per-source intake/conversion/revenue, scoped to leads CREATED in the period.
//
// Cohort math (matches Funnel convention): each row's deals/revenue come
// from the SAME leads counted in leadCount. Conversion % = deals/leads*100;
// can never exceed 100. Revenue uses raw budget (no projectWeight, no split
// halving) — matches the Step 2 "raw matches DealsPage admin gross" decision.
//
// Two parallel aggregations:
//   - Lead.aggregate, $group by source (excluding "Daily Request" mirrors).
//   - DailyRequest.aggregate, single "Daily Request" group.
// Same source-filter case-split as kpis/trends/funnel. Source list is
// dynamic — only sources present in the period appear.
//
// Deal predicate mirrors DealsPage activeDeals exactly:
// (status="DoneDeal" OR globalStatus="donedeal") AND dealStatus != "Deal
// Cancelled" AND status != "Deal Cancelled". On the DR side, drop the
// globalStatus clause (DR has no globalStatus).
//
// Sorted by revenue desc, then leadCount desc as tiebreaker.
app.get("/api/reports/overview/source-roi", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);

    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var includeLead = sourceFilter !== "Daily Request";
    var includeDR   = !sourceFilter || sourceFilter === "Daily Request";

    var leadMatch = {
      archived: false,
      createdAt: { $gte: fromDate, $lt: toDate }
    };
    if (sourceFilter && sourceFilter !== "Daily Request") {
      leadMatch.source = sourceFilter;
    } else {
      leadMatch.source = { $ne: "Daily Request" };
    }
    if (scopeIds) leadMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var drMatch = {
      archived: { $ne: true },
      createdAt: { $gte: fromDate, $lt: toDate }
    };
    if (scopeIds) drMatch.agentId = { $in: scopeIds };

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};

    var leadAggP = includeLead ? Lead.aggregate([
      { $match: leadMatch },
      { $addFields: {
          budgetNum: budgetNumExpr,
          isDeal: { $and: [
            { $or: [
              { $eq: ["$status", "DoneDeal"] },
              { $eq: ["$globalStatus", "donedeal"] }
            ]},
            { $ne: ["$dealStatus", "Deal Cancelled"] },
            { $ne: ["$status", "Deal Cancelled"] }
          ]}
      }},
      { $group: {
          _id: { $ifNull: ["$source", "Unknown"] },
          leadCount: { $sum: 1 },
          dealCount: { $sum: { $cond: ["$isDeal", 1, 0] }},
          revenue:   { $sum: { $cond: ["$isDeal", "$budgetNum", 0] }}
      }}
    ]) : Promise.resolve([]);

    var drAggP = includeDR ? DailyRequest.aggregate([
      { $match: drMatch },
      { $addFields: {
          budgetNum: budgetNumExpr,
          isDeal: { $and: [
            { $eq: ["$status", "DoneDeal"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] },
            { $ne: ["$status", "Deal Cancelled"] }
          ]}
      }},
      { $group: {
          _id: "Daily Request",
          leadCount: { $sum: 1 },
          dealCount: { $sum: { $cond: ["$isDeal", 1, 0] }},
          revenue:   { $sum: { $cond: ["$isDeal", "$budgetNum", 0] }}
      }}
    ]) : Promise.resolve([]);

    var parts = await Promise.all([leadAggP, drAggP]);
    var leadGroups = parts[0] || [];
    var drGroups = parts[1] || [];

    var rows = leadGroups.concat(drGroups).map(function(g){
      var leads = Number(g.leadCount) || 0;
      var deals = Number(g.dealCount) || 0;
      var rev = Number(g.revenue) || 0;
      var src = g._id;
      if (src == null || src === "") src = "Unknown";
      return {
        source: src,
        leadCount: leads,
        dealCount: deals,
        conversionPct: leads > 0 ? Math.round((deals / leads) * 1000) / 10 : 0,
        revenue: Math.round(rev)
      };
    });

    rows.sort(function(a, b){
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return b.leadCount - a.leadCount;
    });

    res.json({
      range: { from: fromDate.toISOString(), to: toDate.toISOString() },
      sources: rows
    });
  } catch (e) {
    console.error("[reports/overview/source-roi]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "source_roi_failed" });
  }
});

// GET /api/reports/overview/agents
// Top-N agent leaderboard for the period, sorted by revenue desc.
//
// Per-agent metrics — FLOW semantics (events that happened in the period):
//   leads     = Lead/DR docs createdAt-in-period assigned to agent
//                (agentId or splitAgent2Id on Lead, agentId on DR;
//                 Lead-side excludes source="Daily Request" mirrors so DR
//                 creations aren't double-counted as native lead intake)
//   calls     = Activity { userId: agent, type: "call", createdAt-in-period }
//   meetings  = Lead/DR with hadMeeting === true AND meetingDoneAt-in-period
//   eois      = Lead/DR with eoiStatus IN {Pending, Approved} AND parsed
//               eoiDate-in-period (matches EOI page Pending+Approved tabs)
//   deals     = Lead/DR with isDeal flag (mirrors DealsPage activeDeals)
//               AND parsed dealDate (Lead) / updatedAt (DR fallback) in period
//   revenue   = sum of deal budget; split deals halved per agent so the
//               sum across agents reconciles with DealsPage gross. Mirrors
//               existing TeamPage / KPIsPage / dashboard convention.
//
// Source filter case-split (same as kpis/funnel/source-roi):
//   - null            → Lead native (source != DR) + DR
//   - "Daily Request" → DR only for ALL metrics (mirrors deliberately
//                       not double-counted; DR docs hold meeting/EOI/deal
//                       state from the conversion path)
//   - other           → Lead only with that source; DR skipped
// Calls aren't source-filterable (Activity has no source). Always returned;
// frontend hints "Calls shown for all sources" when a source filter is set.
//
// Targets: User.qTargets[currentQuarter]. Quarter = floor(now.month/3)+1.
// targetProgressPct = clamped 0..100 (UI bar caps at 100).
//
// Eligible roles for the leaderboard: sales / team_leader / manager. Admin /
// sales_admin / director / viewer activity is excluded post-aggregation so
// non-revenue-bearing roles never appear. totalAgents reflects the same
// eligibility filter.
app.get("/api/reports/overview/agents", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    // Default returns the full eligible roster (capped at 200 for safety) so
    // the frontend can toggle "Show all N" client-side without re-fetching.
    var limitN = Math.max(1, Math.min(200, parseInt(req.query.limit, 10) || 100));

    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var includeLead = sourceFilter !== "Daily Request";
    var includeDR   = !sourceFilter || sourceFilter === "Daily Request";

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};
    var parseDateExpr = function(field) {
      return { $cond: [
        { $and: [{ $ne: ["$"+field, ""] }, { $ne: ["$"+field, null] }] },
        { $convert: { input: "$"+field, to: "date", onError: null, onNull: null }},
        null
      ]};
    };
    // Per-Lead attribution list — primary + split agent, nulls dropped.
    var agentListProj = { $filter: {
      input: ["$agentId", "$splitAgent2Id"],
      as: "a",
      cond: { $ne: ["$$a", null] }
    }};

    // Lead base match — archived + source filter + scope. The scope $or
    // stays at top level; downstream stages use $expr-based $match so they
    // don't conflict.
    var leadBaseMatch = { archived: false };
    if (sourceFilter && sourceFilter !== "Daily Request") leadBaseMatch.source = sourceFilter;
    else if (!sourceFilter) leadBaseMatch.source = { $ne: "Daily Request" };
    if (scopeIds) leadBaseMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var drBaseMatch = { archived: { $ne: true } };
    if (scopeIds) drBaseMatch.agentId = { $in: scopeIds };

    // === LEADS RECEIVED (createdAt-in-period) ===
    var leadsLeadP = includeLead ? Lead.aggregate([
      { $match: Object.assign({}, leadBaseMatch, { createdAt: { $gte: fromDate, $lt: toDate }})},
      { $project: { agentList: agentListProj }},
      { $unwind: "$agentList" },
      { $group: { _id: "$agentList", c: { $sum: 1 }}}
    ]) : Promise.resolve([]);
    var leadsDrP = includeDR ? DailyRequest.aggregate([
      { $match: Object.assign({}, drBaseMatch, { createdAt: { $gte: fromDate, $lt: toDate }})},
      { $group: { _id: "$agentId", c: { $sum: 1 }}}
    ]) : Promise.resolve([]);

    // === MEETINGS (meetingDoneAt-in-period) ===
    var meetingsLeadP = includeLead ? Lead.aggregate([
      { $match: Object.assign({}, leadBaseMatch, {
          hadMeeting: true,
          meetingDoneAt: { $gte: fromDate, $lt: toDate }
      })},
      { $project: { agentList: agentListProj }},
      { $unwind: "$agentList" },
      { $group: { _id: "$agentList", c: { $sum: 1 }}}
    ]) : Promise.resolve([]);
    var meetingsDrP = includeDR ? DailyRequest.aggregate([
      { $match: Object.assign({}, drBaseMatch, {
          hadMeeting: true,
          meetingDoneAt: { $gte: fromDate, $lt: toDate }
      })},
      { $group: { _id: "$agentId", c: { $sum: 1 }}}
    ]) : Promise.resolve([]);

    // === EOIs (eoiStatus Pending|Approved + parsed eoiDate in period) ===
    var eoisLeadP = includeLead ? Lead.aggregate([
      { $match: Object.assign({}, leadBaseMatch, { eoiStatus: { $in: ["Pending", "Approved"] }})},
      { $addFields: { eoiAt: parseDateExpr("eoiDate") }},
      { $match: { $expr: { $and: [
          { $ne: ["$eoiAt", null] },
          { $gte: ["$eoiAt", fromDate] },
          { $lt:  ["$eoiAt", toDate] }
      ]}}},
      { $project: { agentList: agentListProj }},
      { $unwind: "$agentList" },
      { $group: { _id: "$agentList", c: { $sum: 1 }}}
    ]) : Promise.resolve([]);
    var eoisDrP = includeDR ? DailyRequest.aggregate([
      { $match: Object.assign({}, drBaseMatch, { eoiStatus: { $in: ["Pending", "Approved"] }})},
      { $addFields: { eoiAt: parseDateExpr("eoiDate") }},
      { $match: { $expr: { $and: [
          { $ne: ["$eoiAt", null] },
          { $gte: ["$eoiAt", fromDate] },
          { $lt:  ["$eoiAt", toDate] }
      ]}}},
      { $group: { _id: "$agentId", c: { $sum: 1 }}}
    ]) : Promise.resolve([]);

    // === DEALS + REVENUE (dealDate-in-period for Lead, updatedAt fallback for DR) ===
    // Deal predicate mirrors DealsPage activeDeals exactly. Revenue is raw
    // budget per Step 2; split deals halved per agent to match the existing
    // per-agent achievement convention (TeamPage / KPIsPage / my-stats).
    var dealsLeadP = includeLead ? Lead.aggregate([
      { $match: leadBaseMatch },
      { $addFields: {
          isDeal: { $and: [
            { $or: [{ $eq: ["$status", "DoneDeal"] }, { $eq: ["$globalStatus", "donedeal"] }]},
            { $ne: ["$status", "Deal Cancelled"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] }
          ]},
          dealAt: parseDateExpr("dealDate"),
          budgetNum: budgetNumExpr,
          isSplit: { $cond: [{ $ne: [{ $ifNull: ["$splitAgent2Id", null] }, null] }, true, false] }
      }},
      { $match: { isDeal: true, $expr: { $and: [
          { $ne: ["$dealAt", null] },
          { $gte: ["$dealAt", fromDate] },
          { $lt:  ["$dealAt", toDate] }
      ]}}},
      { $project: {
          agentList: agentListProj,
          revPerAgent: { $cond: ["$isSplit", { $multiply: ["$budgetNum", 0.5] }, "$budgetNum"] }
      }},
      { $unwind: "$agentList" },
      { $group: { _id: "$agentList", deals: { $sum: 1 }, revenue: { $sum: "$revPerAgent" }}}
    ]) : Promise.resolve([]);
    // DR has no dealDate field — use updatedAt as the deal-transition timestamp.
    var dealsDrP = includeDR ? DailyRequest.aggregate([
      { $match: drBaseMatch },
      { $addFields: {
          isDeal: { $and: [
            { $eq: ["$status", "DoneDeal"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] }
          ]},
          dealAt: "$updatedAt",
          budgetNum: budgetNumExpr
      }},
      { $match: { isDeal: true, $expr: { $and: [
          { $gte: ["$dealAt", fromDate] },
          { $lt:  ["$dealAt", toDate] }
      ]}}},
      { $group: { _id: "$agentId", deals: { $sum: 1 }, revenue: { $sum: "$budgetNum" }}}
    ]) : Promise.resolve([]);

    // === CALLS (Activity; userId scoped if team filter set) ===
    var callsMatch = { type: "call", createdAt: { $gte: fromDate, $lt: toDate }};
    if (scopeIds) callsMatch.userId = { $in: scopeIds };
    var callsP = Activity.aggregate([
      { $match: callsMatch },
      { $group: { _id: "$userId", c: { $sum: 1 }}}
    ]);

    var parts = await Promise.all([
      leadsLeadP, leadsDrP, meetingsLeadP, meetingsDrP,
      eoisLeadP, eoisDrP, dealsLeadP, dealsDrP, callsP
    ]);

    var byAgent = {};
    var get = function(id){
      var k = String(id);
      if (!byAgent[k]) byAgent[k] = { agentId: k, leads: 0, calls: 0, meetings: 0, eois: 0, deals: 0, revenue: 0 };
      return byAgent[k];
    };
    var addCount = function(rows, key){
      (rows || []).forEach(function(r){ if (r && r._id) get(r._id)[key] += Number(r.c) || 0; });
    };
    addCount(parts[0], "leads");
    addCount(parts[1], "leads");
    addCount(parts[2], "meetings");
    addCount(parts[3], "meetings");
    addCount(parts[4], "eois");
    addCount(parts[5], "eois");
    (parts[6] || []).forEach(function(r){ if (r && r._id){ var a = get(r._id); a.deals += Number(r.deals)||0; a.revenue += Number(r.revenue)||0; }});
    (parts[7] || []).forEach(function(r){ if (r && r._id){ var a = get(r._id); a.deals += Number(r.deals)||0; a.revenue += Number(r.revenue)||0; }});
    addCount(parts[8], "calls");

    // Resolve user docs (eligible roles only). Drops admins/SAs/directors/
    // viewers and deleted users from the leaderboard automatically.
    var ids = Object.keys(byAgent);
    var users = ids.length
      ? await User.find({ _id: { $in: ids }, role: { $in: ["sales", "team_leader", "manager"] }})
          .select("name role qTargets active").lean()
      : [];
    var userMap = {};
    users.forEach(function(u){ userMap[String(u._id)] = u; });

    var qNum = Math.floor(new Date().getMonth()/3) + 1;
    var qKey = "Q" + qNum;

    var rows = [];
    Object.keys(byAgent).forEach(function(k){
      var u = userMap[k];
      if (!u) return;
      var a = byAgent[k];
      var qTarget = (u.qTargets && Number(u.qTargets[qKey])) || 0;
      var convPct = a.leads > 0 ? Math.round((a.deals / a.leads) * 1000) / 10 : null;
      var progress = qTarget > 0 ? Math.min(100, Math.round((a.revenue / qTarget) * 1000) / 10) : 0;
      rows.push({
        agentId: k,
        name: u.name || "(unknown)",
        role: u.role || "",
        active: u.active !== false,
        leads: a.leads,
        calls: a.calls,
        meetings: a.meetings,
        eois: a.eois,
        deals: a.deals,
        revenue: Math.round(a.revenue),
        conversionPct: convPct,
        qTarget: Math.round(qTarget),
        targetProgressPct: progress
      });
    });

    rows.sort(function(a, b){
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      if (b.deals   !== a.deals)   return b.deals   - a.deals;
      return b.leads - a.leads;
    });

    res.json({
      range: { from: fromDate.toISOString(), to: toDate.toISOString() },
      quarter: qKey,
      agents: rows.slice(0, limitN),
      totalAgents: rows.length
    });
  } catch (e) {
    console.error("[reports/overview/agents]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "agents_failed" });
  }
});

// GET /api/reports/overview/aging
// 4 buckets by days since lastActivityTime — CURRENT STATE, no period filter
// (aging is a snapshot, not a flow metric):
//   over14    age >= 14    (RED — high priority)
//   days7to14 7 <= age <14 (AMBER — needs attention)
//   days3to7  3 <= age < 7 (GREY — monitor)
//   under3    age < 3      (GREEN — active)
//
// Exclusions — leads that are already closed / out of the funnel don't
// count toward aging buckets (mirrors LeadsPage default visibility):
//   - archived
//   - status = DoneDeal OR globalStatus = donedeal     (closed)
//   - status = EOI OR eoiStatus IN [Pending, Approved] (active EOI flow)
//   - status = NotInterested                           (dead lead)
//   - status = Deal Cancelled OR dealStatus = Deal Cancelled
//
// Source filter case-split (same as kpis/funnel/source-roi/agents):
//   - null            -> Lead native (source != "Daily Request" mirror exclusion)
//   - "Daily Request" -> mirrors only
//   - other           -> that source
//
// Team scope applied via agentId / splitAgent2Id $or, same shape as
// the other reports endpoints.
//
// "Last contact" — UNION of two real-contact signals:
//   (1) max lead.history[].timestamp where event IN
//       [status_changed, feedback_added, callback_scheduled]. The PUT
//       /api/leads/:id handler emits these three events DIFF-GATED:
//       only fires when the underlying field actually changed (status,
//       lastFeedback, callbackTime). So agents who edit through the lead
//       form — without ever clicking "Log Activity" — register here.
//   (2) max Activity.createdAt for the current holder against this lead,
//       scoped to explicit contact types (call, meeting, followup, email,
//       note). Covers the "Log Activity" button path which doesn't write
//       to lead.history.
//
// Why we DON'T match history.byUser to the current agent's name: byUser
// is a NAME string, not an ObjectId — fragile under duplicate names and
// renames. The event whitelist is sufficient: a manager writing feedback
// on behalf of a sales agent is still real customer contact and should
// count toward aging.
//
// assignments[].lastActionAt was abandoned earlier because every rotation
// path creates a NEW slice with lastActionAt = now — rotated leads got a
// fresh "action clock" even when no agent contact happened (same root
// cause as the lastActivityTime pollution called out in the frontend
// rotation sweeper). The Activity type filter remains as a belt-and-
// suspenders safeguard against system-emitted activities (status_change,
// reassign Activity rows would already miss the userId match, but the
// type filter is the durable guard).
//
// Fallback chain — UNION max → current holder's slice.assignedAt (so an
// agent who's held a lead 14d without contact still buckets correctly)
// → lead.createdAt (legacy / pre-assignments docs).
//
// Response also includes filters[bucketKey] objects the frontend hands
// straight to setSpecialFilter so the Leads page can re-apply the same
// age window client-side (drill-down).
app.get("/api/reports/overview/aging", auth, reportsAuth, async function(req, res) {
  try {
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var match = {
      archived: false,
      $nor: [
        { status: "DoneDeal" },
        { globalStatus: "donedeal" },
        { status: "EOI" },
        { eoiStatus: "Pending" },
        { eoiStatus: "Approved" },
        { status: "NotInterested" },
        { status: "Deal Cancelled" },
        { dealStatus: "Deal Cancelled" }
      ]
    };
    if (sourceFilter && sourceFilter !== "Daily Request") match.source = sourceFilter;
    else if (sourceFilter === "Daily Request")             match.source = "Daily Request";
    else                                                    match.source = { $ne: "Daily Request" };
    if (scopeIds) match.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var DAY_MS = 86400000;
    var nowDate = new Date();

    var groups = await Lead.aggregate([
      { $match: match },
      // Lookup: most recent contact-type Activity from the lead's current
      // holder against this lead. Sort+limit-1 inside the sub-pipeline so
      // we ship a single row per lead, not the whole activity history.
      { $lookup: {
          from: "activities",
          let: { lid: "$_id", aid: "$agentId" },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ["$leadId", "$$lid"] },
                { $eq: ["$userId", "$$aid"] },
                { $in: ["$type", ["call","meeting","followup","email","note"]] }
            ]}}},
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, t: "$createdAt" } }
          ],
          as: "lastContactAct"
      }},
      { $addFields: {
          // History-side: max timestamp over diff-gated form-edit events.
          // $max ignores nulls, returns null on empty input — exactly what
          // we want so the $ifNull fallback chain below kicks in cleanly.
          historyContactMax: { $max: { $map: {
            input: { $filter: {
              input: { $ifNull: ["$history", []] },
              as: "h",
              cond: { $in: ["$$h.event", ["status_changed", "feedback_added", "callback_scheduled"]] }
            }},
            as: "h",
            in: "$$h.timestamp"
          }}},
          // Activity-side: extract the single-row lookup result above.
          activityContactMax: { $arrayElemAt: ["$lastContactAct.t", 0] }
      }},
      { $addFields: {
          lastContact: { $let: {
            vars: {
              // $max([null, x]) -> x; $max([null, null]) -> null. Perfect
              // for the union: any source that fired wins; both empty
              // falls through to assignedAt / createdAt.
              mergedContact: { $max: ["$historyContactMax", "$activityContactMax"] },
              curSliceAssignedAt: { $let: {
                vars: { cs: { $arrayElemAt: [
                  { $filter: {
                      input: { $ifNull: ["$assignments", []] },
                      as: "a",
                      cond: { $eq: ["$$a.agentId", "$agentId"] }
                  }},
                  -1
                ]}},
                in: "$$cs.assignedAt"
              }}
            },
            in: { $ifNull: [
              "$$mergedContact",
              { $ifNull: ["$$curSliceAssignedAt", "$createdAt"] }
            ]}
          }}
      }},
      { $addFields: { ageDays: { $divide: [{ $subtract: [nowDate, "$lastContact"] }, DAY_MS] }}},
      { $addFields: {
          bucketKey: { $switch: {
            branches: [
              { case: { $gte: ["$ageDays", 14] }, then: "over14" },
              { case: { $gte: ["$ageDays", 7]  }, then: "days7to14" },
              { case: { $gte: ["$ageDays", 3]  }, then: "days3to7" }
            ],
            default: "under3"
          }}
      }},
      { $group: { _id: "$bucketKey", count: { $sum: 1 }}}
    ]);

    var buckets = { over14: 0, days7to14: 0, days3to7: 0, under3: 0 };
    var total = 0;
    groups.forEach(function(g){
      if (g && g._id in buckets) {
        buckets[g._id] = Number(g.count) || 0;
        total += buckets[g._id];
      }
    });

    res.json({
      buckets: buckets,
      filters: {
        over14:    { type: "aging", ageMin: 14 },
        days7to14: { type: "aging", ageMin: 7,  ageMax: 14 },
        days3to7:  { type: "aging", ageMin: 3,  ageMax: 7 },
        under3:    { type: "aging",             ageMax: 3 }
      },
      total: total,
      asOf: nowDate.toISOString()
    });
  } catch (e) {
    console.error("[reports/overview/aging]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "aging_failed" });
  }
});

// GET /api/reports/overview/alerts
// Computes the top-3 most urgent issues for the executive view. Each
// alert has its own time window — none follow the user's date-range
// filter — so the banner stays meaningful regardless of what range is
// selected on the page. Only the team filter is honored.
//
// Alert types:
//   1. stale_leads (HIGH)         — count of aging "over14" bucket
//                                    (active leads, no real contact 14d+).
//                                    Same UNION-based lastContact logic
//                                    as the aging endpoint.
//   2. agents_under_target (MED)  — count of eligible agents whose
//                                    current-quarter revenue / qTarget
//                                    is < 30%. Always uses the current
//                                    quarter, not the page's date range
//                                    (qTargets are quarterly so any
//                                    other window is misleading).
//   3. source_conv_drop (MED)     — emitted PER source whose conversion
//                                    dropped >25% relative week-over-week
//                                    (last 7d vs prev 7d). Sample-size
//                                    guard: prev window must have >=10
//                                    leads to avoid noise.
//   4. stuck_meetings (HIGH)      — count of leads with status=MeetingDone
//                                    and no real contact 14d+. Same union
//                                    logic as stale_leads but scoped to
//                                    MeetingDone.
//
// Sorted: priority high before medium, then by count desc.
// Returns top 3 only. Empty array when nothing fires (frontend hides).
app.get("/api/reports/overview/alerts", auth, reportsAuth, async function(req, res) {
  try {
    var scopeIds = await getReportsTeamScope(req.query.team || null);
    var nowDate = new Date();
    var DAY_MS = 86400000;
    var WEEK_MS = 7 * DAY_MS;

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};
    var parseDateExpr = function(field) {
      return { $cond: [
        { $and: [{ $ne: ["$"+field, ""] }, { $ne: ["$"+field, null] }] },
        { $convert: { input: "$"+field, to: "date", onError: null, onNull: null }},
        null
      ]};
    };

    // Reusable contact-age stages — same union logic as the aging endpoint.
    // Wrapped in a function so stale_leads + stuck_meetings can share it
    // with different $match prefixes.
    var ageingStages = [
      { $lookup: {
          from: "activities",
          let: { lid: "$_id", aid: "$agentId" },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ["$leadId", "$$lid"] },
                { $eq: ["$userId", "$$aid"] },
                { $in: ["$type", ["call","meeting","followup","email","note"]] }
            ]}}},
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, t: "$createdAt" } }
          ],
          as: "lastContactAct"
      }},
      { $addFields: {
          historyContactMax: { $max: { $map: {
            input: { $filter: {
              input: { $ifNull: ["$history", []] },
              as: "h",
              cond: { $in: ["$$h.event", ["status_changed", "feedback_added", "callback_scheduled"]] }
            }},
            as: "h",
            in: "$$h.timestamp"
          }}},
          activityContactMax: { $arrayElemAt: ["$lastContactAct.t", 0] }
      }},
      { $addFields: {
          lastContact: { $let: {
            vars: {
              mergedContact: { $max: ["$historyContactMax", "$activityContactMax"] },
              curSliceAssignedAt: { $let: {
                vars: { cs: { $arrayElemAt: [
                  { $filter: { input: { $ifNull: ["$assignments", []] }, as:"a", cond:{$eq:["$$a.agentId","$agentId"]} }},
                  -1
                ]}},
                in: "$$cs.assignedAt"
              }}
            },
            in: { $ifNull: [
              "$$mergedContact",
              { $ifNull: ["$$curSliceAssignedAt", "$createdAt"] }
            ]}
          }}
      }},
      { $addFields: { ageDays: { $divide: [{ $subtract: [nowDate, "$lastContact"] }, DAY_MS] }}}
    ];

    // === STALE LEADS — same exclusions as aging endpoint ===
    var staleMatch = {
      archived: false,
      $nor: [
        { status: "DoneDeal" },
        { globalStatus: "donedeal" },
        { status: "EOI" },
        { eoiStatus: "Pending" },
        { eoiStatus: "Approved" },
        { status: "NotInterested" },
        { status: "Deal Cancelled" },
        { dealStatus: "Deal Cancelled" }
      ]
    };
    if (scopeIds) staleMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];
    var staleP = Lead.aggregate([{ $match: staleMatch }].concat(ageingStages).concat([
      { $match: { ageDays: { $gte: 14 }}},
      { $count: "n" }
    ]));

    // === STUCK MEETINGS — status=MeetingDone scope ===
    var stuckMatch = { archived: false, status: "MeetingDone" };
    if (scopeIds) stuckMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];
    var stuckP = Lead.aggregate([{ $match: stuckMatch }].concat(ageingStages).concat([
      { $match: { ageDays: { $gte: 14 }}},
      { $count: "n" }
    ]));

    // === AGENTS UNDER TARGET — current quarter only ===
    var qNum = Math.floor(nowDate.getMonth()/3) + 1;
    var qKey = "Q" + qNum;
    var qYear = nowDate.getFullYear();
    var qStart = new Date(qYear, (qNum-1)*3, 1, 0, 0, 0, 0);
    var qEnd   = new Date(qYear,  qNum*3,    1, 0, 0, 0, 0);

    var leadDealsBaseMatch = { archived: false, source: { $ne: "Daily Request" }};
    if (scopeIds) leadDealsBaseMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];
    var leadDealsP = Lead.aggregate([
      { $match: leadDealsBaseMatch },
      { $addFields: {
          isDeal: { $and: [
            { $or: [{ $eq: ["$status", "DoneDeal"] }, { $eq: ["$globalStatus", "donedeal"] }]},
            { $ne: ["$status", "Deal Cancelled"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] }
          ]},
          dealAt: parseDateExpr("dealDate"),
          budgetNum: budgetNumExpr,
          isSplit: { $cond: [{ $ne: [{ $ifNull: ["$splitAgent2Id", null] }, null] }, true, false] }
      }},
      { $match: { isDeal: true, $expr: { $and: [
          { $ne: ["$dealAt", null] },
          { $gte: ["$dealAt", qStart] },
          { $lt:  ["$dealAt", qEnd] }
      ]}}},
      { $project: {
          agentList: { $filter: { input: ["$agentId", "$splitAgent2Id"], as: "a", cond: { $ne: ["$$a", null] }}},
          revPerAgent: { $cond: ["$isSplit", { $multiply: ["$budgetNum", 0.5] }, "$budgetNum"] }
      }},
      { $unwind: "$agentList" },
      { $group: { _id: "$agentList", revenue: { $sum: "$revPerAgent" }}}
    ]);

    var drDealsBaseMatch = { archived: { $ne: true }};
    if (scopeIds) drDealsBaseMatch.agentId = { $in: scopeIds };
    var drDealsP = DailyRequest.aggregate([
      { $match: drDealsBaseMatch },
      { $addFields: {
          isDeal: { $and: [
            { $eq: ["$status", "DoneDeal"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] }
          ]},
          dealAt: "$updatedAt",
          budgetNum: budgetNumExpr
      }},
      { $match: { isDeal: true, $expr: { $and: [
          { $gte: ["$dealAt", qStart] },
          { $lt:  ["$dealAt", qEnd] }
      ]}}},
      { $group: { _id: "$agentId", revenue: { $sum: "$budgetNum" }}}
    ]);

    var userQuery = { role: { $in: ["sales", "team_leader", "manager"] }, active: true };
    if (scopeIds) userQuery._id = { $in: scopeIds };
    var allEligibleUsersP = User.find(userQuery).select("name role qTargets").lean();

    // === SOURCE CONV DROP — last 7d vs prev 7d, per source ===
    var thisWeekStart = new Date(nowDate.getTime() - WEEK_MS);
    var prevWeekStart = new Date(nowDate.getTime() - 2 * WEEK_MS);

    var buildSourceConvAggs = function(fromD, toD) {
      var leadM = { archived: false, source: { $ne: "Daily Request" }, createdAt: { $gte: fromD, $lt: toD }};
      if (scopeIds) leadM.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];
      var drM = { archived: { $ne: true }, createdAt: { $gte: fromD, $lt: toD }};
      if (scopeIds) drM.agentId = { $in: scopeIds };

      var leadAgg = Lead.aggregate([
        { $match: leadM },
        { $addFields: { isDeal: { $and: [
            { $or: [{ $eq: ["$status", "DoneDeal"] }, { $eq: ["$globalStatus", "donedeal"] }]},
            { $ne: ["$status", "Deal Cancelled"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] }
        ]}}},
        { $group: {
            _id: { $ifNull: ["$source", "Unknown"] },
            leadCount: { $sum: 1 },
            dealCount: { $sum: { $cond: ["$isDeal", 1, 0] }}
        }}
      ]);
      var drAgg = DailyRequest.aggregate([
        { $match: drM },
        { $addFields: { isDeal: { $and: [
            { $eq: ["$status", "DoneDeal"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] }
        ]}}},
        { $group: {
            _id: "Daily Request",
            leadCount: { $sum: 1 },
            dealCount: { $sum: { $cond: ["$isDeal", 1, 0] }}
        }}
      ]);
      return Promise.all([leadAgg, drAgg]).then(function(parts){
        var map = {};
        (parts[0] || []).concat(parts[1] || []).forEach(function(g){
          var src = (g && g._id) || "Unknown";
          if (!map[src]) map[src] = { leadCount: 0, dealCount: 0 };
          map[src].leadCount += Number(g.leadCount) || 0;
          map[src].dealCount += Number(g.dealCount) || 0;
        });
        return map;
      });
    };
    var srcCurP  = buildSourceConvAggs(thisWeekStart, nowDate);
    var srcPrevP = buildSourceConvAggs(prevWeekStart, thisWeekStart);

    // === Run all in parallel ===
    var parts = await Promise.all([staleP, stuckP, leadDealsP, drDealsP, allEligibleUsersP, srcCurP, srcPrevP]);
    var staleArr     = parts[0] || [];
    var stuckArr     = parts[1] || [];
    var leadDealsArr = parts[2] || [];
    var drDealsArr   = parts[3] || [];
    var users        = parts[4] || [];
    var srcCur       = parts[5] || {};
    var srcPrev      = parts[6] || {};

    var alerts = [];

    // ALERT 1: stale_leads
    var staleCount = (staleArr[0] && Number(staleArr[0].n)) || 0;
    if (staleCount > 0) {
      alerts.push({
        key: "stale_leads", priority: "high", count: staleCount,
        message: staleCount.toLocaleString() + " lead" + (staleCount === 1 ? "" : "s") + " with no contact in 14+ days",
        action: { type: "drill_aging", ageMin: 14 }
      });
    }

    // ALERT 4: stuck_meetings
    var stuckCount = (stuckArr[0] && Number(stuckArr[0].n)) || 0;
    if (stuckCount > 0) {
      alerts.push({
        key: "stuck_meetings", priority: "high", count: stuckCount,
        message: stuckCount.toLocaleString() + " deal" + (stuckCount === 1 ? "" : "s") + " stuck in Meeting stage 14+ days",
        action: { type: "drill_meeting_aging", status: "MeetingDone", ageMin: 14 }
      });
    }

    // ALERT 2: agents_under_target
    var revByAgent = {};
    leadDealsArr.forEach(function(g){ if (g && g._id) revByAgent[String(g._id)] = (revByAgent[String(g._id)] || 0) + (Number(g.revenue) || 0); });
    drDealsArr.forEach(function(g){   if (g && g._id) revByAgent[String(g._id)] = (revByAgent[String(g._id)] || 0) + (Number(g.revenue) || 0); });
    var underTargetCount = 0;
    users.forEach(function(u){
      var qTarget = (u.qTargets && Number(u.qTargets[qKey])) || 0;
      if (qTarget <= 0) return; // skip agents without a target set
      var rev = revByAgent[String(u._id)] || 0;
      var progress = (rev / qTarget) * 100;
      if (progress < 30) underTargetCount++;
    });
    if (underTargetCount > 0) {
      alerts.push({
        key: "agents_under_target", priority: "medium", count: underTargetCount,
        message: underTargetCount.toLocaleString() + " agent" + (underTargetCount === 1 ? "" : "s") + " under 30% of " + qKey + " target",
        action: { type: "scroll_to", target: "agent_leaderboard" }
      });
    }

    // ALERT 3: source_conv_drop (per source)
    var MIN_LEADS_PREV = 10;
    Object.keys(srcPrev).forEach(function(src){
      var prev = srcPrev[src];
      if (prev.leadCount < MIN_LEADS_PREV) return;       // sample-size guard
      if (prev.dealCount === 0) return;                   // no baseline conv
      var prevConv = prev.dealCount / prev.leadCount;
      var cur = srcCur[src] || { leadCount: 0, dealCount: 0 };
      var curConv = cur.leadCount > 0 ? (cur.dealCount / cur.leadCount) : 0;
      var dropPct = ((prevConv - curConv) / prevConv) * 100;
      if (dropPct > 25) {
        var rounded = Math.round(dropPct);
        alerts.push({
          key: "source_conv_drop", priority: "medium", count: rounded,
          message: src + " conversion dropped " + rounded + "% week-over-week",
          action: { type: "set_source", source: src }
        });
      }
    });

    // Sort: priority high > medium, then count desc within priority.
    var prioRank = { high: 2, medium: 1, low: 0 };
    alerts.sort(function(a, b){
      var pa = prioRank[a.priority] || 0;
      var pb = prioRank[b.priority] || 0;
      if (pa !== pb) return pb - pa;
      return (Number(b.count) || 0) - (Number(a.count) || 0);
    });

    res.json({
      alerts: alerts.slice(0, 3),
      asOf: nowDate.toISOString()
    });
  } catch (e) {
    console.error("[reports/overview/alerts]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "alerts_failed" });
  }
});

// GET /api/reports/overview/forecast
// Two related projections, ignored by date range filter:
//   * Forecast for the next 30 days — pipeline_value × historical
//     win_rate. Range = mid ± 20% on revenue, ±30% on deal count.
//   * Quarter target progress — sum of eligible agents' qTargets[Qn]
//     vs raw deal revenue this quarter. Days-remaining computed from
//     today to quarter end.
//
// Win rate (last 90 days):
//   deals_closed_90d / leads_created_90d * 100
//   - deals_closed_90d: Lead status=DoneDeal, dealStatus != "Deal
//     Cancelled", parsed dealDate (fallback updatedAt) in [d90, now]
//   - leads_created_90d: Lead createdAt in [d90, now] EXCLUDING mirrors
//     (source != "Daily Request") + DR createdAt in [d90, now], same
//     case-split as the kpis intake denominator.
//
// Pipeline (Lead-only, snapshot — same shape as kpis pipelineSnapshot):
//   status IN [Potential, HotCase, MeetingDone, CallBack] AND
//   globalStatus NOT IN [donedeal, eoi].
//
// Q-target / Q-achieved:
//   target = sum of qTargets[currentQ] across eligible roles
//            (sales, team_leader, manager, active=true), team-scoped.
//   achieved = raw deal revenue (Lead status=DoneDeal,
//              dealStatus != "Deal Cancelled") with parsed dealDate
//              (fallback updatedAt) in [qStart, qEnd]. Same as DealsPage
//              admin gross-volume convention used since Step 2.
//
// Returns the full structure even when zeroed; the frontend decides
// what to show / hide based on whether pipelineCount and qTarget are
// non-zero.
app.get("/api/reports/overview/forecast", auth, reportsAuth, async function(req, res) {
  try {
    var scopeIds = await getReportsTeamScope(req.query.team || null);
    var nowDate = new Date();
    var DAY_MS = 86400000;
    var d90 = new Date(nowDate.getTime() - 90 * DAY_MS);

    var qNum = Math.floor(nowDate.getMonth()/3) + 1;
    var qKey = "Q" + qNum;
    var qYear = nowDate.getFullYear();
    var qStart = new Date(qYear, (qNum-1)*3, 1, 0, 0, 0, 0);
    var qEnd   = new Date(qYear,  qNum*3,    1, 0, 0, 0, 0);

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};

    var leadBaseMatch = { archived: false };
    if (scopeIds) leadBaseMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var drBaseMatch = { archived: { $ne: true }};
    if (scopeIds) drBaseMatch.agentId = { $in: scopeIds };

    var pipelineStatuses = ["Potential", "HotCase", "MeetingDone", "CallBack"];

    // Lead-side $facet — runs all 4 lead-facing slices on a single
    // pre-matched stream so we hit the collection just once.
    var leadAggP = Lead.aggregate([
      { $match: leadBaseMatch },
      { $addFields: {
          budgetNum: budgetNumExpr,
          dealAt: { $cond: [
            { $and: [{ $ne: ["$dealDate", ""] }, { $ne: ["$dealDate", null] }] },
            { $toDate: "$dealDate" },
            "$updatedAt"
          ]}
      }},
      { $facet: {
          // Pipeline snapshot — Lead-only, status whitelist matches kpis.
          pipelineSnapshot: [
            { $match: { status: { $in: pipelineStatuses }, globalStatus: { $nin: ["donedeal", "eoi"] }}},
            { $group: { _id: null, value: { $sum: "$budgetNum" }, count: { $sum: 1 }}}
          ],
          // Win-rate numerator: deals closed in the last 90 days.
          dealsLast90: [
            { $match: { status: "DoneDeal", dealStatus: { $ne: "Deal Cancelled" }, dealAt: { $gte: d90, $lt: nowDate }}},
            { $group: { _id: null, count: { $sum: 1 }}}
          ],
          // Win-rate denominator (Lead side): native leads created in
          // the last 90 days. Mirrors excluded — DR creations are
          // counted via the DR aggregation below.
          leadsCreatedLast90: [
            { $match: { createdAt: { $gte: d90, $lt: nowDate }, source: { $ne: "Daily Request" }}},
            { $group: { _id: null, count: { $sum: 1 }}}
          ],
          // Q-achieved: raw deal revenue this quarter.
          qDeals: [
            { $match: { status: "DoneDeal", dealStatus: { $ne: "Deal Cancelled" }, dealAt: { $gte: qStart, $lt: qEnd }}},
            { $group: { _id: null, revenue: { $sum: "$budgetNum" }, count: { $sum: 1 }}}
          ]
      }}
    ]);

    var drAggP = DailyRequest.aggregate([
      { $match: drBaseMatch },
      { $facet: {
          leadsCreatedLast90: [
            { $match: { createdAt: { $gte: d90, $lt: nowDate }}},
            { $group: { _id: null, count: { $sum: 1 }}}
          ]
      }}
    ]);

    var userQuery = { role: { $in: ["sales", "team_leader", "manager"] }, active: true };
    if (scopeIds) userQuery._id = { $in: scopeIds };
    var usersP = User.find(userQuery).select("qTargets").lean();

    var parts = await Promise.all([leadAggP, drAggP, usersP]);
    var leadR = (parts[0] || [])[0] || {};
    var drR   = (parts[1] || [])[0] || {};
    var users = parts[2] || [];

    var pull = function(arr){ return (arr || [])[0] || {}; };
    var pipelineSnap = pull(leadR.pipelineSnapshot);
    var dealsLast90  = pull(leadR.dealsLast90);
    var leadCreated90 = pull(leadR.leadsCreatedLast90);
    var qDeals       = pull(leadR.qDeals);
    var drCreated90  = pull(drR.leadsCreatedLast90);

    var pipelineValue = Math.round(Number(pipelineSnap.value) || 0);
    var pipelineCount = Number(pipelineSnap.count) || 0;

    var dealsClosed90 = Number(dealsLast90.count) || 0;
    var totalLeads90  = (Number(leadCreated90.count) || 0) + (Number(drCreated90.count) || 0);
    var winRate = totalLeads90 > 0 ? (dealsClosed90 / totalLeads90) : 0;

    var midRev   = pipelineValue * winRate;
    var midDeals = pipelineCount * winRate;

    var qTarget = users.reduce(function(s, u){ return s + ((u.qTargets && Number(u.qTargets[qKey])) || 0); }, 0);
    var qAchieved = Math.round(Number(qDeals.revenue) || 0);
    var qProgressPct = qTarget > 0 ? Math.min(100, Math.round((qAchieved / qTarget) * 1000) / 10) : 0;
    var daysRemaining = Math.max(0, Math.ceil((qEnd.getTime() - nowDate.getTime()) / DAY_MS));

    res.json({
      forecast: {
        windowDays: 30,
        winRatePct: Math.round(winRate * 1000) / 10, // 1 decimal
        pipelineCount: pipelineCount,
        pipelineValue: pipelineValue,
        sample: {
          dealsLast90: dealsClosed90,
          leadsLast90: totalLeads90
        },
        projectedRevenue: {
          low:  Math.round(midRev * 0.8),
          mid:  Math.round(midRev),
          high: Math.round(midRev * 1.2)
        },
        projectedDeals: {
          low:  Math.floor(midDeals * 0.7),
          mid:  Math.round(midDeals),
          high: Math.ceil(midDeals * 1.3)
        }
      },
      quarter: {
        key: qKey,
        target: Math.round(qTarget),
        achieved: qAchieved,
        progressPct: qProgressPct,
        daysRemaining: daysRemaining
      },
      asOf: nowDate.toISOString()
    });
  } catch (e) {
    console.error("[reports/overview/forecast]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "forecast_failed" });
  }
});

// GET /api/reports/pipeline/kpis
// Four Pipeline-tab KPIs:
//   1. Open pipeline value (snapshot, ignores range)
//      Σ raw budget of Lead with status IN [NewLead, Potential, HotCase,
//      MeetingDone, CallBack], archived=false, source != "Daily Request"
//      (mirror exclusion — defense-in-depth; pipeline-state DRs aren't
//      mirrored anyway). Lead-only convention shared with forecast.
//   2. Weighted forecast (snapshot)
//      Σ (per-stage open value × stage win probability). Probability
//      method: HISTORICAL when DoneDeal-count in last 90d ≥ 20, else
//      FIXED coefficients. Historical = wins / (wins + losses) among
//      leads that visited the stage in last 90d (status_change activity
//      with [Status] prefix, current Lead status DoneDeal vs Lost).
//      Fixed: NewLead 0.05, Potential 0.15, HotCase 0.35, MeetingDone
//      0.60, CallBack 0.25.
//   3. Win rate % (range-scoped)
//      DoneDeal / (DoneDeal + NotInterested + NoAnswer), counted by
//      resolution date in range: dealDate (parsed) for DoneDeal,
//      updatedAt proxy for the lost statuses.
//   4. Sales velocity (range-scoped, MEDIAN)
//      Median days from createdAt to dealDate for DoneDeals in range.
//      Aggregation pushes the days array; JS picks the median.
//
// All four are Lead-only. Mirrors excluded everywhere.
// Source filter case-split:
//   - sourceFilter null     → outer match unrestricted; defensive
//                             source != "Daily Request" applied per branch.
//   - sourceFilter "Daily Request" → outer match selects mirrors only.
//                             Pipeline-stage branches return 0 because
//                             mirrors are EOI/DoneDeal-stage only. Correct.
//   - sourceFilter other    → outer match selects that source; defensive
//                             $ne is redundant but harmless.
app.get("/api/reports/pipeline/kpis", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var nowDate = new Date();
    var DAY_MS = 86400000;
    var d90 = new Date(nowDate.getTime() - 90 * DAY_MS);

    var pipelineStatuses = ["NewLead", "Potential", "HotCase", "MeetingDone", "CallBack"];
    var lostStatuses = ["NotInterested", "NoAnswer"];

    var leadMatch = { archived: false };
    if (sourceFilter) leadMatch.source = sourceFilter;
    if (scopeIds) leadMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};

    var leadAggP = Lead.aggregate([
      { $match: leadMatch },
      { $addFields: {
          budgetNum: budgetNumExpr,
          dealAt: { $cond: [
            { $and: [{ $ne: ["$dealDate", ""] }, { $ne: ["$dealDate", null] }] },
            { $toDate: "$dealDate" },
            "$updatedAt"
          ]}
      }},
      { $facet: {
          // Snapshot: per-stage open count + value (mirrors excluded).
          pipelineByStage: [
            { $match: { status: { $in: pipelineStatuses }, source: { $ne: "Daily Request" }}},
            { $group: { _id: "$status", count: { $sum: 1 }, value: { $sum: "$budgetNum" }}}
          ],
          // Sample-size check for historical methodology.
          dealsLast90: [
            { $match: { status: "DoneDeal", dealStatus: { $ne: "Deal Cancelled" }, source: { $ne: "Daily Request" }, dealAt: { $gte: d90, $lt: nowDate }}},
            { $count: "n" }
          ],
          // Wins in range — winRate numerator + velocity sample.
          dealsInRange: [
            { $match: { status: "DoneDeal", dealStatus: { $ne: "Deal Cancelled" }, source: { $ne: "Daily Request" }, dealAt: { $gte: fromDate, $lt: toDate }}},
            { $project: { days: { $divide: [{ $subtract: ["$dealAt", "$createdAt"] }, DAY_MS] }}},
            { $match: { days: { $gte: 0 }}},
            { $group: { _id: null, count: { $sum: 1 }, daysArr: { $push: "$days" }}}
          ],
          // Losses in range — winRate denominator (lost half).
          lostInRange: [
            { $match: { status: { $in: lostStatuses }, source: { $ne: "Daily Request" }, updatedAt: { $gte: fromDate, $lt: toDate }}},
            { $group: { _id: null, count: { $sum: 1 }}}
          ]
      }}
    ]);

    // Per-stage historical win probability — only meaningful when
    // dealsLast90 >= 20; computed unconditionally and chosen JS-side.
    var actLeadFilter = { "lead.archived": false };
    if (sourceFilter) actLeadFilter["lead.source"] = sourceFilter;
    else              actLeadFilter["lead.source"] = { $ne: "Daily Request" };
    if (scopeIds) actLeadFilter.$or = [{ "lead.agentId": { $in: scopeIds }}, { "lead.splitAgent2Id": { $in: scopeIds }}];

    var activityAggP = Activity.aggregate([
      { $match: { type: "status_change", createdAt: { $gte: d90, $lt: nowDate }, leadId: { $ne: null }}},
      { $project: { leadId: 1, stageMatch: { $regexFind: { input: { $ifNull: ["$note", ""] }, regex: /^\[(.+?)\]/ }}}},
      { $project: { leadId: 1, stage: { $arrayElemAt: ["$stageMatch.captures", 0] }}},
      { $match: { stage: { $in: pipelineStatuses }}},
      { $group: { _id: { leadId: "$leadId", stage: "$stage" }}},
      { $lookup: { from: "leads", localField: "_id.leadId", foreignField: "_id", as: "lead" }},
      { $unwind: "$lead" },
      { $match: actLeadFilter },
      { $group: { _id: "$_id.stage",
        won:  { $sum: { $cond: [{ $eq: ["$lead.status", "DoneDeal"] }, 1, 0] }},
        lost: { $sum: { $cond: [{ $in: ["$lead.status", lostStatuses] }, 1, 0] }}
      }}
    ]);

    var parts = await Promise.all([leadAggP, activityAggP]);
    var leadR = (parts[0] || [])[0] || {};
    var actR  = parts[1] || [];

    // 1. Pipeline value + per-stage map
    var pipelineByStage = leadR.pipelineByStage || [];
    var byStageMap = {};
    var pipelineValueTotal = 0;
    pipelineByStage.forEach(function(row){
      var v = Number(row.value) || 0;
      byStageMap[row._id] = { count: Number(row.count) || 0, value: v };
      pipelineValueTotal += v;
    });

    // 2. Weighted forecast
    var dealsLast90Count = (((leadR.dealsLast90 || [])[0] || {}).n) || 0;
    var useHistorical = dealsLast90Count >= 20;
    var fixedCoef = { NewLead: 0.05, Potential: 0.15, HotCase: 0.35, MeetingDone: 0.60, CallBack: 0.25 };

    var historicalProb = {};
    actR.forEach(function(row){
      var won  = Number(row.won)  || 0;
      var lost = Number(row.lost) || 0;
      var tot  = won + lost;
      historicalProb[row._id] = tot > 0 ? won / tot : null;
    });

    var weightedTotal = 0;
    pipelineStatuses.forEach(function(s){
      var entry = byStageMap[s];
      if (!entry || !entry.value) return;
      var prob = (useHistorical && historicalProb[s] != null) ? historicalProb[s] : (fixedCoef[s] || 0);
      weightedTotal += entry.value * prob;
    });

    // 3. Win rate
    var dealsInRangeR = (leadR.dealsInRange || [])[0] || {};
    var lostInRangeR  = (leadR.lostInRange  || [])[0] || {};
    var wonCount  = Number(dealsInRangeR.count) || 0;
    var lostCount = Number(lostInRangeR.count)  || 0;
    var resolved  = wonCount + lostCount;
    var winRatePct = resolved > 0 ? (wonCount / resolved) * 100 : 0;

    // 4. Velocity (median)
    var daysArr = (dealsInRangeR.daysArr || []).slice().sort(function(a, b){ return a - b; });
    var medianDays = 0;
    if (daysArr.length === 1) medianDays = daysArr[0];
    else if (daysArr.length > 1) {
      var mid = Math.floor(daysArr.length / 2);
      medianDays = daysArr.length % 2 === 0 ? (daysArr[mid - 1] + daysArr[mid]) / 2 : daysArr[mid];
    }

    res.json({
      range: { from: range.from, to: range.to },
      pipelineValue:    { value: Math.round(pipelineValueTotal) },
      weightedForecast: {
        value: Math.round(weightedTotal),
        methodology: useHistorical ? "historical" : "fixed",
        sample: { dealsLast90: dealsLast90Count, threshold: 20 }
      },
      winRatePct:       { value: Math.round(winRatePct * 10) / 10, sample: { won: wonCount, lost: lostCount }},
      avgVelocityDays:  { value: Math.round(medianDays * 10) / 10, sampleSize: daysArr.length }
    });
  } catch (e) {
    console.error("[reports/pipeline/kpis]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "pipeline_kpis_failed" });
  }
});

// GET /api/reports/pipeline/by-stage
// Snapshot of open pipeline grouped by status — one row per stage,
// even when count=0. Lead-only, mirrors excluded.
//
// Stage order in response (left-to-right kanban):
//   NewLead → Potential → HotCase → CallBack → MeetingDone
//
// avgDaysInStage = mean over leads in the stage of:
//   (now - stage_entered_at) days
// where stage_entered_at is the createdAt of the most recent
// status_change Activity for the lead whose note prefix equals
// "[<currentStatus>]". When no such activity exists (NewLead leads
// are typical — they enter NewLead at creation, not via a recorded
// status change), fall back to the lead's own createdAt for NewLead
// or updatedAt for any other stage.
//
// Source filter case-split mirrors /pipeline/kpis exactly:
//   - sourceFilter null     → defensive source != "Daily Request"
//   - sourceFilter "Daily Request" → mirror-only outer match; pipeline-
//                                    stage filter rejects them all → 0.
//   - sourceFilter other    → that source; defensive $ne is redundant.
app.get("/api/reports/pipeline/by-stage", auth, reportsAuth, async function(req, res) {
  try {
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var DAY_MS = 86400000;
    var pipelineStatuses = ["NewLead", "Potential", "HotCase", "CallBack", "MeetingDone"];

    var leadMatch = { archived: false, status: { $in: pipelineStatuses }};
    if (sourceFilter) leadMatch.source = sourceFilter;
    else              leadMatch.source = { $ne: "Daily Request" };
    if (scopeIds) leadMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};

    var rows = await Lead.aggregate([
      { $match: leadMatch },
      { $addFields: { budgetNum: budgetNumExpr }},
      // Find the most recent status_change activity that put each lead
      // into its CURRENT status. Match by note-prefix string equality
      // ("[<status>]") — avoids dynamic regex and works on every lead's
      // own status without a separate per-stage query.
      { $lookup: {
          from: "activities",
          let: { lid: "$_id", curStatus: "$status" },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ["$leadId", "$$lid"] },
                { $eq: ["$type", "status_change"] }
            ]}}},
            { $addFields: {
                stageMatch: { $regexFind: { input: { $ifNull: ["$note", ""] }, regex: /^\[([^\]]+)\]/ }}
            }},
            { $addFields: {
                matchedStage: { $arrayElemAt: ["$stageMatch.captures", 0] }
            }},
            { $match: { $expr: { $eq: ["$matchedStage", "$$curStatus"] }}},
            { $sort: { createdAt: -1 }},
            { $limit: 1 },
            { $project: { _id: 0, createdAt: 1 }}
          ],
          as: "lastStageEntry"
      }},
      { $addFields: {
          stageEnteredAt: { $cond: [
            { $gt: [{ $size: "$lastStageEntry" }, 0] },
            { $arrayElemAt: ["$lastStageEntry.createdAt", 0] },
            { $cond: [{ $eq: ["$status", "NewLead"] }, "$createdAt", "$updatedAt"] }
          ]}
      }},
      { $addFields: {
          daysInStage: { $divide: [{ $subtract: ["$$NOW", "$stageEnteredAt"] }, DAY_MS] }
      }},
      { $group: {
          _id: "$status",
          count: { $sum: 1 },
          value: { $sum: "$budgetNum" },
          totalDays: { $sum: "$daysInStage" }
      }}
    ]);

    var stagesMap = {};
    rows.forEach(function(row) {
      var count = Number(row.count) || 0;
      stagesMap[row._id] = {
        count: count,
        value: Math.round(Number(row.value) || 0),
        avgDaysInStage: count > 0 ? (Number(row.totalDays) || 0) / count : 0
      };
    });

    // Always emit all 5 stages in display order, zero-filled.
    var stages = pipelineStatuses.map(function(s) {
      var entry = stagesMap[s] || { count: 0, value: 0, avgDaysInStage: 0 };
      return {
        key: s,
        count: entry.count,
        value: entry.value,
        avgDaysInStage: Math.round(entry.avgDaysInStage * 10) / 10
      };
    });

    res.json({ stages: stages });
  } catch (e) {
    console.error("[reports/pipeline/by-stage]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "pipeline_by_stage_failed" });
  }
});

// GET /api/reports/pipeline/at-risk
// Lead-level table of advanced-stage leads stalled 7+ days. Snapshot,
// no date range. The "lastContact" math is lifted verbatim from
// /reports/overview/aging — same UNION (history events + Activity
// types), same fallback chain (curSliceAssignedAt → createdAt). That
// guarantees reconciliation: every Lead in this response is also in
// the Lead Aging "over14" or "days7to14" bucket on the Overview tab.
//
// Filter:
//   - status IN [HotCase, MeetingDone]   (CallBack excluded — those
//     have a scheduled callback time and "stale" doesn't apply.
//     NewLead/Potential excluded — too early to call "at risk".)
//   - archived = false
//   - secondary state-machine guards: globalStatus != donedeal,
//     eoiStatus NOT IN [Pending, Approved], dealStatus != Deal Cancelled
//   - source != "Daily Request" (mirror exclusion, defensive)
//   - daysSinceLastContact >= 7
//
// Source filter case-split mirrors aging exactly.
//
// Response cap: top 50 by staleness desc (frontend renders top 20 by
// default; "View all N" button expands in-page up to the 50 cap). The
// `total` field is the unfiltered at-risk count so the UI can label
// honestly even when total > 50.
app.get("/api/reports/pipeline/at-risk", auth, reportsAuth, async function(req, res) {
  try {
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var DAY_MS = 86400000;
    var nowDate = new Date();
    var STALE_DAYS = 7;
    var atRiskStatuses = ["HotCase", "MeetingDone"];

    var match = {
      archived: false,
      status: { $in: atRiskStatuses },
      $nor: [
        { globalStatus: "donedeal" },
        { eoiStatus: "Pending" },
        { eoiStatus: "Approved" },
        { dealStatus: "Deal Cancelled" }
      ]
    };
    if (sourceFilter) match.source = sourceFilter;
    else              match.source = { $ne: "Daily Request" };
    if (scopeIds) match.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};

    var rows = await Lead.aggregate([
      { $match: match },
      { $addFields: { budgetNum: budgetNumExpr }},
      // ── Last-contact computation — verbatim from /reports/overview/aging.
      { $lookup: {
          from: "activities",
          let: { lid: "$_id", aid: "$agentId" },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ["$leadId", "$$lid"] },
                { $eq: ["$userId", "$$aid"] },
                { $in: ["$type", ["call","meeting","followup","email","note"]] }
            ]}}},
            { $sort: { createdAt: -1 }},
            { $limit: 1 },
            { $project: { _id: 0, t: "$createdAt" }}
          ],
          as: "lastContactAct"
      }},
      { $addFields: {
          historyContactMax: { $max: { $map: {
            input: { $filter: {
              input: { $ifNull: ["$history", []] },
              as: "h",
              cond: { $in: ["$$h.event", ["status_changed", "feedback_added", "callback_scheduled"]] }
            }},
            as: "h",
            in: "$$h.timestamp"
          }}},
          activityContactMax: { $arrayElemAt: ["$lastContactAct.t", 0] }
      }},
      { $addFields: {
          lastContact: { $let: {
            vars: {
              mergedContact: { $max: ["$historyContactMax", "$activityContactMax"] },
              curSliceAssignedAt: { $let: {
                vars: { cs: { $arrayElemAt: [
                  { $filter: {
                      input: { $ifNull: ["$assignments", []] },
                      as: "a",
                      cond: { $eq: ["$$a.agentId", "$agentId"] }
                  }},
                  -1
                ]}},
                in: "$$cs.assignedAt"
              }}
            },
            in: { $ifNull: [
              "$$mergedContact",
              { $ifNull: ["$$curSliceAssignedAt", "$createdAt"] }
            ]}
          }}
      }},
      { $addFields: { ageDays: { $divide: [{ $subtract: [nowDate, "$lastContact"] }, DAY_MS] }}},
      // ── Stale gate.
      { $match: { ageDays: { $gte: STALE_DAYS }}},
      // ── Branch: trim+enrich the deals list and count the unfiltered total.
      { $facet: {
          deals: [
            { $sort: { ageDays: -1, budgetNum: -1 }},
            { $limit: 50 },
            { $lookup: {
                from: "users",
                localField: "agentId",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, name: 1 }}],
                as: "agent"
            }},
            { $project: {
                _id: 0,
                leadId: { $toString: "$_id" },
                name: 1,
                stage: "$status",
                value: { $round: ["$budgetNum", 0] },
                agentName: { $ifNull: [{ $arrayElemAt: ["$agent.name", 0] }, "Unassigned"] },
                agentId:   { $toString: { $arrayElemAt: ["$agent._id", 0] }},
                daysSinceLastContact: { $round: ["$ageDays", 1] }
            }}
          ],
          totalArr: [{ $count: "n" }]
      }}
    ]);

    var first = rows[0] || {};
    res.json({
      deals: first.deals || [],
      total: ((first.totalArr || [])[0] || {}).n || 0
    });
  } catch (e) {
    console.error("[reports/pipeline/at-risk]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "pipeline_at_risk_failed" });
  }
});

// GET /api/reports/pipeline/by-project
// Hybrid table: per-project open snapshot (count + value) merged with
// per-project closed totals over the selected date range. Lead-only,
// mirrors excluded.
//
// Open columns (snapshot, ignores range):
//   status IN [NewLead, Potential, HotCase, CallBack, MeetingDone]
// Closed columns (range-scoped on parsed dealDate):
//   status = DoneDeal AND dealStatus != "Deal Cancelled"
//   AND dealAt IN [from, to)   (dealDate parsed; falls back to
//                               updatedAt — matches Phase 1 convention)
//
// Source filter case-split mirrors /pipeline/kpis. The empty-string
// project bucket is preserved as its own row (frontend renders it as
// "(no project)").
//
// Response cap: top 50 by openValue desc; total reflects the
// unfiltered project count so the UI labels "View all N" honestly.
app.get("/api/reports/pipeline/by-project", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var pipelineStatuses = ["NewLead", "Potential", "HotCase", "CallBack", "MeetingDone"];

    var leadMatch = { archived: false };
    if (sourceFilter) leadMatch.source = sourceFilter;
    else              leadMatch.source = { $ne: "Daily Request" };
    if (scopeIds) leadMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};

    var rows = await Lead.aggregate([
      { $match: leadMatch },
      { $addFields: {
          budgetNum: budgetNumExpr,
          dealAt: { $cond: [
            { $and: [{ $ne: ["$dealDate", ""] }, { $ne: ["$dealDate", null] }] },
            { $toDate: "$dealDate" },
            "$updatedAt"
          ]},
          // Coerce missing/null project to "" so empty-project leads
          // group into a single bucket the frontend can label.
          projectKey: { $ifNull: ["$project", ""] }
      }},
      { $facet: {
          open: [
            { $match: { status: { $in: pipelineStatuses }}},
            { $group: { _id: "$projectKey", count: { $sum: 1 }, value: { $sum: "$budgetNum" }}}
          ],
          closed: [
            { $match: {
                status: "DoneDeal",
                dealStatus: { $ne: "Deal Cancelled" },
                dealAt: { $gte: fromDate, $lt: toDate }
            }},
            { $group: { _id: "$projectKey", count: { $sum: 1 }, revenue: { $sum: "$budgetNum" }}}
          ]
      }}
    ]);

    var first = rows[0] || {};
    var openMap = {};
    (first.open || []).forEach(function(r){
      openMap[r._id || ""] = { count: Number(r.count) || 0, value: Number(r.value) || 0 };
    });
    var closedMap = {};
    (first.closed || []).forEach(function(r){
      closedMap[r._id || ""] = { count: Number(r.count) || 0, revenue: Number(r.revenue) || 0 };
    });

    var allKeys = {};
    Object.keys(openMap).forEach(function(k){ allKeys[k] = true; });
    Object.keys(closedMap).forEach(function(k){ allKeys[k] = true; });

    var projects = Object.keys(allKeys).map(function(k){
      var o = openMap[k]   || { count: 0, value: 0 };
      var c = closedMap[k] || { count: 0, revenue: 0 };
      return {
        project:      k,
        openCount:    o.count,
        openValue:    Math.round(o.value),
        dealsCount:   c.count,
        dealsRevenue: Math.round(c.revenue)
      };
    });

    // Sort by open value desc; ties broken by closed revenue desc, then
    // alphabetical project name for determinism.
    projects.sort(function(a, b){
      if (b.openValue !== a.openValue)       return b.openValue - a.openValue;
      if (b.dealsRevenue !== a.dealsRevenue) return b.dealsRevenue - a.dealsRevenue;
      return (a.project || "").localeCompare(b.project || "");
    });

    var total = projects.length;
    var capped = projects.slice(0, 50);

    res.json({
      range: { from: range.from, to: range.to },
      projects: capped,
      total: total
    });
  } catch (e) {
    console.error("[reports/pipeline/by-project]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "pipeline_by_project_failed" });
  }
});

// GET /api/reports/pipeline/outcomes
// Three resolution buckets over the selected date range — Won (DoneDeal),
// Lost — Not Interested, Lost — No Answer. Lead-only, mirrors excluded.
// Each bucket emits count, total raw budget, and avg days to resolve.
//
// Resolution-date semantics:
//   - Won:  parsed dealDate (fallback to updatedAt) in [from, to)
//           — same dealAt expression as /pipeline/kpis and /by-project,
//           so Won counts here reconcile with Slice 1's winRatePct.won
//           and Slice 4's per-project dealsCount sum.
//   - Lost: updatedAt in [from, to). Approximate — there's no explicit
//           lostAt field, so a lead edited after being lost will show
//           the edit date instead of the loss date. Best available
//           signal until a lossDate field is added.
//
// avgDaysToResolve = avg over bucket of (resolutionDate - createdAt) days.
// Negative values (createdAt > resolutionDate, possible from clock skew
// or import oddities) are filtered out before averaging — same guard
// the velocity calc uses in /pipeline/kpis.
//
// Source filter case-split mirrors Slice 4 exactly. With sourceFilter
// "Daily Request": Won returns DR-converted deals; Lost buckets return
// 0 because mirrors only exist in EOI/DoneDeal stages.
app.get("/api/reports/pipeline/outcomes", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var DAY_MS = 86400000;

    var leadMatch = { archived: false };
    if (sourceFilter) leadMatch.source = sourceFilter;
    else              leadMatch.source = { $ne: "Daily Request" };
    if (scopeIds) leadMatch.$or = [{ agentId: { $in: scopeIds }}, { splitAgent2Id: { $in: scopeIds }}];

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};

    var rows = await Lead.aggregate([
      { $match: leadMatch },
      { $addFields: {
          budgetNum: budgetNumExpr,
          dealAt: { $cond: [
            { $and: [{ $ne: ["$dealDate", ""] }, { $ne: ["$dealDate", null] }] },
            { $toDate: "$dealDate" },
            "$updatedAt"
          ]}
      }},
      { $facet: {
          won: [
            { $match: { status: "DoneDeal", dealStatus: { $ne: "Deal Cancelled" }, dealAt: { $gte: fromDate, $lt: toDate }}},
            { $project: { budgetNum: 1, daysToResolve: { $divide: [{ $subtract: ["$dealAt", "$createdAt"] }, DAY_MS] }}},
            { $match: { daysToResolve: { $gte: 0 }}},
            { $group: { _id: null, count: { $sum: 1 }, value: { $sum: "$budgetNum" }, avgDays: { $avg: "$daysToResolve" }}}
          ],
          lostNotInterested: [
            { $match: { status: "NotInterested", updatedAt: { $gte: fromDate, $lt: toDate }}},
            { $project: { budgetNum: 1, daysToResolve: { $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, DAY_MS] }}},
            { $match: { daysToResolve: { $gte: 0 }}},
            { $group: { _id: null, count: { $sum: 1 }, value: { $sum: "$budgetNum" }, avgDays: { $avg: "$daysToResolve" }}}
          ],
          lostNoAnswer: [
            { $match: { status: "NoAnswer", updatedAt: { $gte: fromDate, $lt: toDate }}},
            { $project: { budgetNum: 1, daysToResolve: { $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, DAY_MS] }}},
            { $match: { daysToResolve: { $gte: 0 }}},
            { $group: { _id: null, count: { $sum: 1 }, value: { $sum: "$budgetNum" }, avgDays: { $avg: "$daysToResolve" }}}
          ]
      }}
    ]);

    var first = rows[0] || {};
    var pull = function(arr) {
      var r = (arr || [])[0] || {};
      return {
        count: Number(r.count) || 0,
        value: Math.round(Number(r.value) || 0),
        avgDaysToResolve: Math.round((Number(r.avgDays) || 0) * 10) / 10
      };
    };

    var won    = pull(first.won);
    var lostNI = pull(first.lostNotInterested);
    var lostNA = pull(first.lostNoAnswer);
    var totalResolved = won.count + lostNI.count + lostNA.count;

    res.json({
      range: { from: range.from, to: range.to },
      won: won,
      lostNotInterested: lostNI,
      lostNoAnswer: lostNA,
      totalResolved: totalResolved
    });
  } catch (e) {
    console.error("[reports/pipeline/outcomes]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "pipeline_outcomes_failed" });
  }
});


// ===== REPORTS — Phase 2 AGENTS tab =====

// GET /api/reports/agents/list
// Picker support endpoint — returns the eligible agent roster (sales +
// team_leader + manager, active) with revenue in the selected range.
// Frontend uses the response to (1) populate the Agents-tab picker
// dropdown sorted by revenue desc and (2) default-select the top earner.
//
// Revenue convention: Lead-only, raw budget, split deals halved per agent.
// Same per-agent half-revenue used by /overview/agents leaderboard,
// TeamPage and KPIsPage. NO weighting (executive view, like the rest of
// /reports). DR DoneDeals are not aggregated separately — Pipeline-tab
// convention is Lead-only here, so when source filter is "Daily Request"
// we count DR mirrors (which already live in Lead) and that's the
// authoritative DR-deal source.
//
// Source filter case-split mirrors the Pipeline tab exactly:
//   - sourceFilter null            -> source != "Daily Request" (mirror exclusion)
//   - sourceFilter "Daily Request" -> mirrors only
//   - sourceFilter other           -> that source
//
// Team scope restricts BOTH the eligible roster and the lead-attribution
// scope (an agent in scope still gets revenue=0 if no in-scope deals).
app.get("/api/reports/agents/list", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var userQuery = { active: true, role: { $in: ["sales", "team_leader", "manager"] }};
    if (scopeIds) userQuery._id = { $in: scopeIds };
    var users = await User.find(userQuery).select("name role title teamName").lean();
    var userIds = users.map(function(u){ return u._id; });

    var leadBaseMatch = { archived: false };
    if (sourceFilter) leadBaseMatch.source = sourceFilter;
    else              leadBaseMatch.source = { $ne: "Daily Request" };
    leadBaseMatch.$or = [{ agentId: { $in: userIds }}, { splitAgent2Id: { $in: userIds }}];

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};
    var parseDateExpr = function(field) {
      return { $cond: [
        { $and: [{ $ne: ["$"+field, ""] }, { $ne: ["$"+field, null] }] },
        { $convert: { input: "$"+field, to: "date", onError: null, onNull: null }},
        null
      ]};
    };

    var revenueAgg = userIds.length ? await Lead.aggregate([
      { $match: leadBaseMatch },
      { $addFields: {
          isDeal: { $and: [
            { $or: [{ $eq: ["$status", "DoneDeal"] }, { $eq: ["$globalStatus", "donedeal"] }]},
            { $ne: ["$status", "Deal Cancelled"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] }
          ]},
          dealAt: parseDateExpr("dealDate"),
          budgetNum: budgetNumExpr,
          isSplit: { $cond: [{ $ne: [{ $ifNull: ["$splitAgent2Id", null] }, null] }, true, false] }
      }},
      { $match: { isDeal: true, $expr: { $and: [
          { $ne: ["$dealAt", null] },
          { $gte: ["$dealAt", fromDate] },
          { $lt:  ["$dealAt", toDate] }
      ]}}},
      { $project: {
          agentList: { $filter: { input: ["$agentId", "$splitAgent2Id"], as: "a", cond: { $ne: ["$$a", null] }}},
          revPerAgent: { $cond: ["$isSplit", { $multiply: ["$budgetNum", 0.5] }, "$budgetNum"] }
      }},
      { $unwind: "$agentList" },
      { $match: { agentList: { $in: userIds }}},
      { $group: { _id: "$agentList", revenue: { $sum: "$revPerAgent" }}}
    ]) : [];

    var byId = {};
    users.forEach(function(u){
      byId[String(u._id)] = {
        id: String(u._id),
        name: u.name || "(unknown)",
        role: u.role || "sales",
        title: u.title || "",
        teamName: u.teamName || "",
        revenue: 0
      };
    });
    revenueAgg.forEach(function(r){
      var k = String(r._id);
      if (byId[k]) byId[k].revenue = Math.round(Number(r.revenue) || 0);
    });

    var agents = Object.keys(byId).map(function(k){ return byId[k]; }).sort(function(a, b){
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return (a.name || "").localeCompare(b.name || "");
    });

    res.json({
      range: { from: range.from, to: range.to },
      agents: agents,
      totalAgents: agents.length
    });
  } catch (e) {
    console.error("[reports/agents/list]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "agents_list_failed" });
  }
});


// GET /api/reports/agents/:id/kpis
// Five Agents-tab KPIs for the selected agent + same-role peer median:
//   1. revenue        — Σ raw budget on agent's DoneDeals in range,
//                       split halved per agent (matches leaderboard).
//   2. deals          — count of agent's DoneDeals in range; full count to
//                       both sides on splits (matches leaderboard).
//   3. conversionPct  — deals / leads-received-in-range × 100. Both sides
//                       of a split lead get +1 lead-received and +1 deal,
//                       so conversion is consistent. Null when leads = 0.
//   4. activities     — count of agent's Activity rows in range, types in
//                       {call, meeting, followup, email, note}. The two
//                       system-event types (status_change, reassign) are
//                       excluded — they're emitted by handlers, not user
//                       contact actions.
//   5. responseHours  — median hours from each assignments[] slice's
//                       assignedAt (sliced in range) to that agent's first
//                       contact activity against that lead at-or-after
//                       assignedAt. Slices with no follow-up contact
//                       contribute nothing; null when no slices in range.
//
// Peer set: active users with the SAME role as the target, EXCLUDING the
// target. Team filter intersects the peer roster. Peer-median per metric:
//   - revenue / deals / activities: 0 is valid data, all peers included.
//   - conversionPct / responseHours: null = no data, peer excluded from
//                                    the median (otherwise we'd bias low).
//
// Per-agent attribution runs once across {target ∪ peers} via $group on
// agentId, so the request is O(2 large aggregations + 1 lookup join)
// regardless of peer-set size.
app.get("/api/reports/agents/:id/kpis", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var contactTypes = ["call", "meeting", "followup", "email", "note"];
    var HOUR_MS = 3600000;

    var target = await User.findById(req.params.id).select("name role title teamName active").lean();
    if (!target) return res.status(404).json({ error: "agent_not_found" });

    var peerQuery = { _id: { $ne: target._id }, active: true, role: target.role };
    if (scopeIds) peerQuery._id = { $ne: target._id, $in: scopeIds };
    var peers = await User.find(peerQuery).select("_id").lean();
    var peerIds = peers.map(function(u){ return u._id; });
    var allIds = [target._id].concat(peerIds);

    var leadBaseMatch = { archived: false };
    if (sourceFilter) leadBaseMatch.source = sourceFilter;
    else              leadBaseMatch.source = { $ne: "Daily Request" };
    leadBaseMatch.$or = [{ agentId: { $in: allIds }}, { splitAgent2Id: { $in: allIds }}];

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};
    var parseDateExpr = function(field) {
      return { $cond: [
        { $and: [{ $ne: ["$"+field, ""] }, { $ne: ["$"+field, null] }] },
        { $convert: { input: "$"+field, to: "date", onError: null, onNull: null }},
        null
      ]};
    };
    var agentListProj = { $filter: {
      input: ["$agentId", "$splitAgent2Id"],
      as: "a", cond: { $ne: ["$$a", null] }
    }};

    // Deals + revenue per agent — same expression as /overview/agents.
    var dealsAggP = Lead.aggregate([
      { $match: leadBaseMatch },
      { $addFields: {
          isDeal: { $and: [
            { $or: [{ $eq: ["$status", "DoneDeal"] }, { $eq: ["$globalStatus", "donedeal"] }]},
            { $ne: ["$status", "Deal Cancelled"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] }
          ]},
          dealAt: parseDateExpr("dealDate"),
          budgetNum: budgetNumExpr,
          isSplit: { $cond: [{ $ne: [{ $ifNull: ["$splitAgent2Id", null] }, null] }, true, false] }
      }},
      { $match: { isDeal: true, $expr: { $and: [
          { $ne: ["$dealAt", null] },
          { $gte: ["$dealAt", fromDate] },
          { $lt:  ["$dealAt", toDate] }
      ]}}},
      { $project: {
          agentList: agentListProj,
          revPerAgent: { $cond: ["$isSplit", { $multiply: ["$budgetNum", 0.5] }, "$budgetNum"] }
      }},
      { $unwind: "$agentList" },
      { $match: { agentList: { $in: allIds }}},
      { $group: { _id: "$agentList", deals: { $sum: 1 }, revenue: { $sum: "$revPerAgent" }}}
    ]);

    // Leads received per agent (denominator of conversion %).
    // createdAt-in-period attribution; both agents on a split get +1.
    var leadsAggP = Lead.aggregate([
      { $match: Object.assign({}, leadBaseMatch, { createdAt: { $gte: fromDate, $lt: toDate }})},
      { $project: { agentList: agentListProj }},
      { $unwind: "$agentList" },
      { $match: { agentList: { $in: allIds }}},
      { $group: { _id: "$agentList", c: { $sum: 1 }}}
    ]);

    // Activities per agent (5 contact types, range-scoped).
    var activitiesAggP = Activity.aggregate([
      { $match: {
          type: { $in: contactTypes },
          createdAt: { $gte: fromDate, $lt: toDate },
          userId: { $in: allIds }
      }},
      { $group: { _id: "$userId", c: { $sum: 1 }}}
    ]);

    // Response hours per agent. For each assignments[] slice with
    // assignedAt in [from, to), join the first contact activity by that
    // agent against that lead at-or-after assignedAt; emit (agentId, hours).
    // No upper bound on the activity timestamp on purpose — answers "how
    // fast did the agent respond after assignment?", regardless of whether
    // the contact landed inside the report window.
    var responseAggP = Lead.aggregate([
      { $match: Object.assign(
          {},
          { archived: false },
          sourceFilter ? { source: sourceFilter } : { source: { $ne: "Daily Request" }},
          { "assignments.agentId": { $in: allIds }}
      )},
      { $project: { assignments: 1 }},
      { $unwind: "$assignments" },
      { $match: {
          "assignments.agentId": { $in: allIds },
          "assignments.assignedAt": { $gte: fromDate, $lt: toDate }
      }},
      { $project: {
          agentId: "$assignments.agentId",
          assignedAt: "$assignments.assignedAt",
          leadId: "$_id"
      }},
      { $lookup: {
          from: "activities",
          let: { agent: "$agentId", lead: "$leadId", assigned: "$assignedAt" },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ["$userId", "$$agent"] },
                { $eq: ["$leadId", "$$lead"] },
                { $gte: ["$createdAt", "$$assigned"] },
                { $in: ["$type", contactTypes] }
            ]}}},
            { $sort: { createdAt: 1 }},
            { $limit: 1 },
            { $project: { createdAt: 1 }}
          ],
          as: "firstContact"
      }},
      { $unwind: "$firstContact" },
      { $project: {
          agentId: 1,
          hours: { $divide: [{ $subtract: ["$firstContact.createdAt", "$assignedAt"] }, HOUR_MS] }
      }},
      { $match: { hours: { $gte: 0 }}},
      { $group: { _id: "$agentId", hoursArr: { $push: "$hours" }}}
    ]);

    var parts = await Promise.all([dealsAggP, leadsAggP, activitiesAggP, responseAggP]);
    var dealsRows = parts[0] || [];
    var leadsRows = parts[1] || [];
    var actsRows  = parts[2] || [];
    var respRows  = parts[3] || [];

    var byAgent = {};
    var get = function(id){
      var k = String(id);
      if (!byAgent[k]) byAgent[k] = { revenue: 0, deals: 0, leads: 0, activities: 0, responseHours: null };
      return byAgent[k];
    };
    var medianOfArr = function(arr){
      if (!arr || !arr.length) return null;
      var s = arr.slice().sort(function(a, b){ return a - b; });
      if (s.length === 1) return s[0];
      var mid = Math.floor(s.length / 2);
      return s.length % 2 === 0 ? (s[mid-1] + s[mid]) / 2 : s[mid];
    };
    dealsRows.forEach(function(r){ if (r && r._id){ var a = get(r._id); a.deals = Number(r.deals)||0; a.revenue = Math.round(Number(r.revenue)||0); }});
    leadsRows.forEach(function(r){ if (r && r._id){ get(r._id).leads = Number(r.c)||0; }});
    actsRows.forEach( function(r){ if (r && r._id){ get(r._id).activities = Number(r.c)||0; }});
    respRows.forEach( function(r){
      if (!r || !r._id) return;
      var med = medianOfArr(r.hoursArr || []);
      get(r._id).responseHours = med != null ? Math.round(med * 10) / 10 : null;
    });

    var rollup = function(id){
      var a = byAgent[String(id)] || { revenue: 0, deals: 0, leads: 0, activities: 0, responseHours: null };
      var conv = a.leads > 0 ? Math.round((a.deals / a.leads) * 1000) / 10 : null;
      return {
        revenue: a.revenue,
        deals: a.deals,
        conversionPct: conv,
        activities: a.activities,
        responseHours: a.responseHours
      };
    };
    var agentRow = rollup(target._id);
    var peerRows = peerIds.map(function(id){ return rollup(id); });

    // Peer median: filter null in medianOfArr (already does); for revenue/
    // deals/activities, 0 is included (every peer has a value). For
    // conversionPct and responseHours, peers with leads=0 / no slices
    // contribute null and are dropped before the median.
    var medRev  = medianOfArr(peerRows.map(function(r){ return r.revenue; }));
    var medDeal = medianOfArr(peerRows.map(function(r){ return r.deals; }));
    var medConv = medianOfArr(peerRows.map(function(r){ return r.conversionPct; }).filter(function(v){ return v != null; }));
    var medAct  = medianOfArr(peerRows.map(function(r){ return r.activities; }));
    var medResp = medianOfArr(peerRows.map(function(r){ return r.responseHours; }).filter(function(v){ return v != null; }));

    var peerMedian = {
      revenue:       medRev  != null ? Math.round(medRev) : null,
      deals:         medDeal != null ? Math.round(medDeal) : null,
      conversionPct: medConv != null ? Math.round(medConv * 10) / 10 : null,
      activities:    medAct  != null ? Math.round(medAct) : null,
      responseHours: medResp != null ? Math.round(medResp * 10) / 10 : null
    };

    res.json({
      range: { from: range.from, to: range.to },
      agentId: String(target._id),
      agentName: target.name || "(unknown)",
      agentRole: target.role || "",
      agent: agentRow,
      peerMedian: peerMedian,
      peerCount: peerIds.length
    });
  } catch (e) {
    console.error("[reports/agents/:id/kpis]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "agent_kpis_failed" });
  }
});


// GET /api/reports/agents/:id/radar
// Per-axis percentile-of-peers for the 5 KPIs Slice 1 already computes.
// Same per-agent rollup as /:id/kpis (revenue, deals, conversionPct,
// activities, responseHours) — different reduction: instead of the
// peer-median, return where the target sits in each peer distribution.
//
// Percentile (midrank style): for value v among n peer values,
//   pct = (#below + 0.5 × #equal) / n × 100
// Ties are split half-and-half — keeps "agent matches median peer" at
// 50% and avoids the weird 0%/100% jumps a strict-below count produces.
//
// responseHours is INVERTED (faster = higher score) by computing the
// percentile normally and returning (100 - pct). A 0.5h responder among
// peers at [1, 2, 3] ranks at the 0th percentile of "response speed-as-
// hours", which inverts to 100% on the radar — i.e. fastest = best.
//
// Low-sample fallback (per spec) — agent percentile clamps to 50 when:
//   (a) effective peer count < 3 (the distribution is too small to
//       distinguish under-/over-indexers from noise), OR
//   (b) all peer values are equal (no spread, percentile undefined).
// `lowSample: true` is returned alongside so the frontend can render a
// muted indicator. agentValue is null-passthrough (e.g. agent with no
// leads has conversionPct = null) — frontend draws those vertices at
// the centre and the tooltip explains.
//
// Effective peer count differs by axis: revenue/deals/activities always
// include all peers (0 is valid); conversionPct/responseHours drop
// null-data peers (peer with no leads / no slices) before the count.
app.get("/api/reports/agents/:id/radar", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var contactTypes = ["call", "meeting", "followup", "email", "note"];
    var HOUR_MS = 3600000;
    var MIN_PEERS = 3;

    var target = await User.findById(req.params.id).select("name role active").lean();
    if (!target) return res.status(404).json({ error: "agent_not_found" });

    var peerQuery = { _id: { $ne: target._id }, active: true, role: target.role };
    if (scopeIds) peerQuery._id = { $ne: target._id, $in: scopeIds };
    var peers = await User.find(peerQuery).select("_id").lean();
    var peerIds = peers.map(function(u){ return u._id; });
    var allIds = [target._id].concat(peerIds);

    var leadBaseMatch = { archived: false };
    if (sourceFilter) leadBaseMatch.source = sourceFilter;
    else              leadBaseMatch.source = { $ne: "Daily Request" };
    leadBaseMatch.$or = [{ agentId: { $in: allIds }}, { splitAgent2Id: { $in: allIds }}];

    var budgetNumExpr = { $convert: {
      input: { $replaceAll: { input: { $toString: { $ifNull: ["$budget", "0"] }}, find: ",", replacement: "" }},
      to: "double", onError: 0, onNull: 0
    }};
    var parseDateExpr = function(field) {
      return { $cond: [
        { $and: [{ $ne: ["$"+field, ""] }, { $ne: ["$"+field, null] }] },
        { $convert: { input: "$"+field, to: "date", onError: null, onNull: null }},
        null
      ]};
    };
    var agentListProj = { $filter: {
      input: ["$agentId", "$splitAgent2Id"],
      as: "a", cond: { $ne: ["$$a", null] }
    }};

    // Same 4 aggregations as /:id/kpis — copied rather than shared so each
    // endpoint stays self-contained (Pipeline tab convention).
    var dealsAggP = Lead.aggregate([
      { $match: leadBaseMatch },
      { $addFields: {
          isDeal: { $and: [
            { $or: [{ $eq: ["$status", "DoneDeal"] }, { $eq: ["$globalStatus", "donedeal"] }]},
            { $ne: ["$status", "Deal Cancelled"] },
            { $ne: ["$dealStatus", "Deal Cancelled"] }
          ]},
          dealAt: parseDateExpr("dealDate"),
          budgetNum: budgetNumExpr,
          isSplit: { $cond: [{ $ne: [{ $ifNull: ["$splitAgent2Id", null] }, null] }, true, false] }
      }},
      { $match: { isDeal: true, $expr: { $and: [
          { $ne: ["$dealAt", null] },
          { $gte: ["$dealAt", fromDate] },
          { $lt:  ["$dealAt", toDate] }
      ]}}},
      { $project: {
          agentList: agentListProj,
          revPerAgent: { $cond: ["$isSplit", { $multiply: ["$budgetNum", 0.5] }, "$budgetNum"] }
      }},
      { $unwind: "$agentList" },
      { $match: { agentList: { $in: allIds }}},
      { $group: { _id: "$agentList", deals: { $sum: 1 }, revenue: { $sum: "$revPerAgent" }}}
    ]);

    var leadsAggP = Lead.aggregate([
      { $match: Object.assign({}, leadBaseMatch, { createdAt: { $gte: fromDate, $lt: toDate }})},
      { $project: { agentList: agentListProj }},
      { $unwind: "$agentList" },
      { $match: { agentList: { $in: allIds }}},
      { $group: { _id: "$agentList", c: { $sum: 1 }}}
    ]);

    var activitiesAggP = Activity.aggregate([
      { $match: {
          type: { $in: contactTypes },
          createdAt: { $gte: fromDate, $lt: toDate },
          userId: { $in: allIds }
      }},
      { $group: { _id: "$userId", c: { $sum: 1 }}}
    ]);

    var responseAggP = Lead.aggregate([
      { $match: Object.assign(
          {},
          { archived: false },
          sourceFilter ? { source: sourceFilter } : { source: { $ne: "Daily Request" }},
          { "assignments.agentId": { $in: allIds }}
      )},
      { $project: { assignments: 1 }},
      { $unwind: "$assignments" },
      { $match: {
          "assignments.agentId": { $in: allIds },
          "assignments.assignedAt": { $gte: fromDate, $lt: toDate }
      }},
      { $project: {
          agentId: "$assignments.agentId",
          assignedAt: "$assignments.assignedAt",
          leadId: "$_id"
      }},
      { $lookup: {
          from: "activities",
          let: { agent: "$agentId", lead: "$leadId", assigned: "$assignedAt" },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ["$userId", "$$agent"] },
                { $eq: ["$leadId", "$$lead"] },
                { $gte: ["$createdAt", "$$assigned"] },
                { $in: ["$type", contactTypes] }
            ]}}},
            { $sort: { createdAt: 1 }},
            { $limit: 1 },
            { $project: { createdAt: 1 }}
          ],
          as: "firstContact"
      }},
      { $unwind: "$firstContact" },
      { $project: {
          agentId: 1,
          hours: { $divide: [{ $subtract: ["$firstContact.createdAt", "$assignedAt"] }, HOUR_MS] }
      }},
      { $match: { hours: { $gte: 0 }}},
      { $group: { _id: "$agentId", hoursArr: { $push: "$hours" }}}
    ]);

    var parts = await Promise.all([dealsAggP, leadsAggP, activitiesAggP, responseAggP]);
    var dealsRows = parts[0] || [];
    var leadsRows = parts[1] || [];
    var actsRows  = parts[2] || [];
    var respRows  = parts[3] || [];

    var byAgent = {};
    var get = function(id){
      var k = String(id);
      if (!byAgent[k]) byAgent[k] = { revenue: 0, deals: 0, leads: 0, activities: 0, responseHours: null };
      return byAgent[k];
    };
    var medianOfArr = function(arr){
      if (!arr || !arr.length) return null;
      var s = arr.slice().sort(function(a, b){ return a - b; });
      if (s.length === 1) return s[0];
      var mid = Math.floor(s.length / 2);
      return s.length % 2 === 0 ? (s[mid-1] + s[mid]) / 2 : s[mid];
    };
    dealsRows.forEach(function(r){ if (r && r._id){ var a = get(r._id); a.deals = Number(r.deals)||0; a.revenue = Math.round(Number(r.revenue)||0); }});
    leadsRows.forEach(function(r){ if (r && r._id){ get(r._id).leads = Number(r.c)||0; }});
    actsRows.forEach( function(r){ if (r && r._id){ get(r._id).activities = Number(r.c)||0; }});
    respRows.forEach( function(r){
      if (!r || !r._id) return;
      var med = medianOfArr(r.hoursArr || []);
      get(r._id).responseHours = med != null ? Math.round(med * 10) / 10 : null;
    });

    var rollup = function(id){
      var a = byAgent[String(id)] || { revenue: 0, deals: 0, leads: 0, activities: 0, responseHours: null };
      var conv = a.leads > 0 ? Math.round((a.deals / a.leads) * 1000) / 10 : null;
      return {
        revenue: a.revenue,
        deals: a.deals,
        conversionPct: conv,
        activities: a.activities,
        responseHours: a.responseHours
      };
    };
    var agentRow = rollup(target._id);
    var peerRows = peerIds.map(function(id){ return rollup(id); });

    // Midrank percentile: ties split 50/50 so agent == median peer → 50%.
    var percentileOf = function(value, distribution) {
      if (value == null) return null;
      var n = distribution.length;
      if (n === 0) return null;
      var below = 0, equal = 0;
      distribution.forEach(function(v){
        if (v < value) below++;
        else if (v === value) equal++;
      });
      return Math.round(((below + 0.5 * equal) / n) * 1000) / 10;
    };

    var buildAxis = function(key, label, agentVal, distribution, lowerIsBetter) {
      var n = distribution.length;
      var allSame = n > 0 && distribution.every(function(v){ return v === distribution[0]; });
      var lowSample = n < MIN_PEERS || allSame;
      var pct;
      if (agentVal == null) {
        pct = null;
      } else if (lowSample) {
        pct = 50;
      } else {
        pct = percentileOf(agentVal, distribution);
        if (lowerIsBetter && pct != null) pct = Math.round((100 - pct) * 10) / 10;
      }
      return {
        key: key,
        label: label,
        agentValue: agentVal,
        agentPercentile: pct,
        lowSample: lowSample
      };
    };

    var revDist  = peerRows.map(function(r){ return r.revenue; });
    var dealDist = peerRows.map(function(r){ return r.deals; });
    var convDist = peerRows.map(function(r){ return r.conversionPct; }).filter(function(v){ return v != null; });
    var actDist  = peerRows.map(function(r){ return r.activities; });
    var respDist = peerRows.map(function(r){ return r.responseHours; }).filter(function(v){ return v != null; });

    // Order matches the spec's clockwise-from-top axis layout.
    var axes = [
      buildAxis("revenue",       "Revenue",       agentRow.revenue,       revDist,  false),
      buildAxis("deals",         "Deals",         agentRow.deals,         dealDist, false),
      buildAxis("conversionPct", "Conversion",    agentRow.conversionPct, convDist, false),
      buildAxis("activities",    "Activities",    agentRow.activities,    actDist,  false),
      buildAxis("responseHours", "Response time", agentRow.responseHours, respDist, true)
    ];

    res.json({
      range: { from: range.from, to: range.to },
      agentId: String(target._id),
      agentName: target.name || "(unknown)",
      agentRole: target.role || "",
      axes: axes,
      peerCount: peerIds.length
    });
  } catch (e) {
    console.error("[reports/agents/:id/radar]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "agent_radar_failed" });
  }
});


// GET /api/reports/agents/:id/heatmap
// 7×24 day-of-week × hour-of-day grid of the selected agent's contact
// activity. Surfaces working patterns and dead zones. Range-scoped.
//
// Activity types counted: call, meeting, followup. Email and note are
// passive enough that including them would inflate the grid and
// obscure the contact-rhythm signal we're after — they stay out per
// spec.
//
// Timezone: Africa/Cairo. MongoDB's `$dayOfWeek` returns 1=Sun..7=Sat;
// we mod by 7 so the response uses 0=Sat..6=Fri (Egyptian business
// week starts Saturday).
//
// Source filter: applied via $lookup → leads when explicitly set. When
// null we DON'T apply the defensive `source != "Daily Request"` filter
// the deal-counting endpoints use — heatmap counts the agent's
// physical contact actions regardless of lead origin, so DR-mirror
// activities are real work and stay counted. Team filter has no effect
// on a single-agent heatmap; accepted for URL-shape consistency only.
//
// Archived leads are NOT excluded — the activity happened, the agent
// did the work, the cell counts it.
//
// Server returns the full 168-cell grid zero-filled, plus pre-computed
// peak (max-count cell) and a quiet-zone heuristic. Quiet zone =
// lowest-percentage candidate among 3 buckets (early mornings, late
// evenings, Fridays). Frontend renders the strings verbatim.
app.get("/api/reports/agents/:id/heatmap", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;

    var contactTypes = ["call", "meeting", "followup"];
    var TZ = "Africa/Cairo";

    var target = await User.findById(req.params.id).select("name role active").lean();
    if (!target) return res.status(404).json({ error: "agent_not_found" });

    var pipeline = [
      { $match: {
          userId: target._id,
          type: { $in: contactTypes },
          createdAt: { $gte: fromDate, $lt: toDate }
      }}
    ];

    // Source filter — narrow to activities on leads with the matching
    // source. Skipped entirely when null (all activity counted).
    if (sourceFilter) {
      pipeline.push(
        { $lookup: { from: "leads", localField: "leadId", foreignField: "_id", as: "lead" }},
        { $unwind: "$lead" },
        { $match: { "lead.source": sourceFilter }}
      );
    }

    pipeline.push(
      { $project: {
          // 1=Sun..7=Sat → 0=Sat..6=Fri via mod 7.
          dow:  { $mod: [{ $dayOfWeek: { date: "$createdAt", timezone: TZ }}, 7] },
          hour: { $hour: { date: "$createdAt", timezone: TZ }}
      }},
      { $group: { _id: { dow: "$dow", hour: "$hour" }, count: { $sum: 1 }}}
    );

    var rows = await Activity.aggregate(pipeline);

    // Zero-fill full 7×24 grid so the frontend never has to handle holes.
    var grid = [];
    for (var d = 0; d < 7; d++) {
      for (var h = 0; h < 24; h++) {
        grid.push({ dow: d, hour: h, count: 0 });
      }
    }
    var idxOf = function(d, h){ return d * 24 + h; };
    rows.forEach(function(r){
      var d = r._id.dow, h = r._id.hour;
      if (d >= 0 && d < 7 && h >= 0 && h < 24) {
        grid[idxOf(d, h)].count = Number(r.count) || 0;
      }
    });

    var totalActivities = grid.reduce(function(s, c){ return s + c.count; }, 0);
    var maxCount = grid.reduce(function(m, c){ return c.count > m ? c.count : m; }, 0);

    var dayNamesFull = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    var peak = null;
    if (maxCount > 0) {
      var peakCell = grid.find(function(c){ return c.count === maxCount; });
      peak = {
        dow: peakCell.dow,
        hour: peakCell.hour,
        count: peakCell.count,
        dayName: dayNamesFull[peakCell.dow],
        timeLabel: peakCell.hour + ":00"
      };
    }

    var quiet = null;
    if (totalActivities > 0) {
      var sumWhere = function(pred){
        return grid.filter(pred).reduce(function(s, c){ return s + c.count; }, 0);
      };
      var candidates = [
        { description: "early mornings (before 8am)", predicate: function(c){ return c.hour < 8; }},
        { description: "evenings (after 8pm)",        predicate: function(c){ return c.hour >= 20; }},
        { description: "Fridays",                     predicate: function(c){ return c.dow === 6; }}
      ];
      candidates.forEach(function(c){
        c.percentage = Math.round((sumWhere(c.predicate) / totalActivities) * 1000) / 10;
      });
      candidates.sort(function(a, b){ return a.percentage - b.percentage; });
      quiet = { description: candidates[0].description, percentage: candidates[0].percentage };
    }

    res.json({
      range: { from: range.from, to: range.to },
      agentId: String(target._id),
      agentName: target.name || "(unknown)",
      timezone: TZ,
      grid: grid,
      maxCount: maxCount,
      totalActivities: totalActivities,
      peak: peak,
      quiet: quiet
    });
  } catch (e) {
    console.error("[reports/agents/:id/heatmap]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "agent_heatmap_failed" });
  }
});


// GET /api/reports/agents/:id/stage-progression
// Per-agent forward-superset funnel — for leads received by the target
// in the date range, what fraction reached each downstream stage,
// compared against the same-role peer median per stage.
//
// Five stages, monotonically nesting (Received ⊇ Contacted ⊇ Meeting
// ⊇ EOI ⊇ Deal). Stage flags reuse the proven Phase 1 funnel logic
// (see /api/reports/overview/funnel) — same isDealRaw / isEoiRaw /
// isMeetingRaw / isContactedRaw expressions, then forward-superset OR
// to guarantee downstream-implies-upstream.
//
// Per-agent attribution uses the agentList unwind pattern shared with
// the rest of /reports/agents/* (primary agent + split partner each
// credited; deal counts halved for revenue but FULL count for funnel
// stage-presence — same as the leaderboard).
//
// Median policy: per stage, take the median across peer percentages,
// dropping peers with received=0 (whose pct is null — including them
// would bias the median low). peerCount in the response is the total
// same-role peer roster, not the per-stage population.
//
// Defensive monotonic clamp matches the Phase 1 funnel — should never
// fire under correct logic; logs loudly if it does.
//
// Biggest leak: stage transition where the agent under-indexes peer
// median by the largest pct-points. Returns null when no transition
// has a gap < -5pp (the spec's "no significant gaps" threshold).
//
// Source filter case-split mirrors the other agent endpoints
// exactly. Team filter accepted for URL-shape consistency; restricts
// peer roster (target's leads always counted regardless).
app.get("/api/reports/agents/:id/stage-progression", auth, reportsAuth, async function(req, res) {
  try {
    var range = reportsParseRange(req.query.from, req.query.to);
    var fromDate = new Date(range.from), toDate = new Date(range.to);
    var sourceFilter = (req.query.source && req.query.source !== "all") ? String(req.query.source) : null;
    var scopeIds = await getReportsTeamScope(req.query.team || null);

    var target = await User.findById(req.params.id).select("name role active").lean();
    if (!target) return res.status(404).json({ error: "agent_not_found" });

    var peerQuery = { _id: { $ne: target._id }, active: true, role: target.role };
    if (scopeIds) peerQuery._id = { $ne: target._id, $in: scopeIds };
    var peers = await User.find(peerQuery).select("_id").lean();
    var peerIds = peers.map(function(u){ return u._id; });
    var allIds = [target._id].concat(peerIds);

    var leadBaseMatch = {
      archived: false,
      createdAt: { $gte: fromDate, $lt: toDate }
    };
    if (sourceFilter) leadBaseMatch.source = sourceFilter;
    else              leadBaseMatch.source = { $ne: "Daily Request" };
    leadBaseMatch.$or = [
      { agentId: { $in: allIds }},
      { splitAgent2Id: { $in: allIds }}
    ];

    var agentListProj = { $filter: {
      input: ["$agentId", "$splitAgent2Id"],
      as: "a", cond: { $ne: ["$$a", null] }
    }};

    var rows = await Lead.aggregate([
      { $match: leadBaseMatch },
      // Real-contact existence check — feeds isContactedRaw below.
      // See the SYNC INVARIANT comment block at the matching $lookup
      // in /api/reports/overview/funnel for the full rationale.
      // Both endpoints + /reports/overview/aging must stay in sync.
      { $lookup: {
          from: "activities",
          let: { lid: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ["$leadId", "$$lid"] },
                { $in: ["$type", ["call", "meeting", "followup", "email", "note"]] }
            ]}}},
            { $limit: 1 },
            { $project: { _id: 1 } }
          ],
          as: "contactActs"
      }},
      // Phase 1 funnel raw stage flags — kept structurally identical to
      // /reports/overview/funnel so the two stay in sync. isContactedRaw
      // uses the lead-level real-contact UNION (see $lookup above and
      // the sync-invariant comment in /overview/funnel).
      { $addFields: {
          isDealRaw: { $and: [
            { $or: [
              { $eq: ["$status", "DoneDeal"] },
              { $eq: ["$globalStatus", "donedeal"] }
            ]},
            { $ne: ["$dealStatus", "Deal Cancelled"] },
            { $ne: ["$status", "Deal Cancelled"] }
          ]},
          isEoiRaw: { $and: [
            { $ne: ["$status", "Deal Cancelled"] },
            { $ne: ["$eoiStatus", "EOI Cancelled"] },
            { $ne: ["$eoiStatus", "Deal Cancelled"] },
            { $or: [
              { $eq: ["$eoiStatus", "Pending"] },
              { $eq: ["$eoiStatus", "Approved"] },
              { $eq: ["$status", "EOI"] }
            ]}
          ]},
          isMeetingRaw: { $or: [
            { $eq: ["$hadMeeting", true] },
            { $eq: ["$status", "MeetingDone"] }
          ]},
          isContactedRaw: { $or: [
            // 1. Diff-gated history events — fire only when the underlying
            //    field actually changed. NOT "status_change" (no 'd'), the
            //    legacy non-diff-gated form rotation handlers used to emit.
            { $anyElementTrue: { $map: {
                input: { $ifNull: ["$history", []] },
                as: "h",
                in: { $in: ["$$h.event", ["status_changed", "feedback_added", "callback_scheduled"]] }
            }}},
            // 2. Any contact-type Activity on this lead.
            { $gt: [{ $size: "$contactActs" }, 0] }
          ]}
      }},
      // Forward-superset OR — Contacted ⊇ Meeting ⊇ EOI ⊇ Deal.
      { $addFields: {
          isDeal:      "$isDealRaw",
          isEoi:       { $or: ["$isEoiRaw",       "$isDealRaw"] },
          isMeeting:   { $or: ["$isMeetingRaw",   "$isEoiRaw",     "$isDealRaw"] },
          isContacted: { $or: ["$isContactedRaw", "$isMeetingRaw", "$isEoiRaw", "$isDealRaw"] }
      }},
      { $project: {
          agentList: agentListProj,
          isContacted: 1, isMeeting: 1, isEoi: 1, isDeal: 1
      }},
      { $unwind: "$agentList" },
      { $match: { agentList: { $in: allIds }}},
      { $group: {
          _id: "$agentList",
          received:  { $sum: 1 },
          contacted: { $sum: { $cond: ["$isContacted", 1, 0] }},
          meeting:   { $sum: { $cond: ["$isMeeting",   1, 0] }},
          eoi:       { $sum: { $cond: ["$isEoi",       1, 0] }},
          deal:      { $sum: { $cond: ["$isDeal",      1, 0] }}
      }}
    ]);

    var byAgent = {};
    rows.forEach(function(r){
      byAgent[String(r._id)] = {
        received:  Number(r.received)  || 0,
        contacted: Number(r.contacted) || 0,
        meeting:   Number(r.meeting)   || 0,
        eoi:       Number(r.eoi)       || 0,
        deal:      Number(r.deal)      || 0
      };
    });

    // Per-agent rollup: clamp + pct-of-received per stage. received pct
    // is 100 when received > 0 (baseline), null otherwise.
    var rollup = function(id) {
      var a = byAgent[String(id)] || { received: 0, contacted: 0, meeting: 0, eoi: 0, deal: 0 };
      // Defensive monotonic clamp — should not fire under the
      // forward-superset OR but logs loudly if it does.
      if (a.contacted > a.received) { console.warn("[stage-progression] clamp contacted", id, a.contacted, "->", a.received); a.contacted = a.received; }
      if (a.meeting   > a.contacted){ console.warn("[stage-progression] clamp meeting",   id, a.meeting,   "->", a.contacted); a.meeting   = a.contacted; }
      if (a.eoi       > a.meeting)  { console.warn("[stage-progression] clamp eoi",       id, a.eoi,       "->", a.meeting);   a.eoi       = a.meeting; }
      if (a.deal      > a.eoi)      { console.warn("[stage-progression] clamp deal",      id, a.deal,      "->", a.eoi);       a.deal      = a.eoi; }
      var pctOf = function(n){ return a.received > 0 ? Math.round((n / a.received) * 1000) / 10 : null; };
      return {
        received:  { count: a.received,  pct: a.received > 0 ? 100 : null },
        contacted: { count: a.contacted, pct: pctOf(a.contacted) },
        meeting:   { count: a.meeting,   pct: pctOf(a.meeting) },
        eoi:       { count: a.eoi,       pct: pctOf(a.eoi) },
        deal:      { count: a.deal,      pct: pctOf(a.deal) }
      };
    };
    var agentRollup = rollup(target._id);
    var peerRollups = peerIds.map(function(id){ return rollup(id); });

    var medianOfArr = function(arr){
      if (!arr || !arr.length) return null;
      var s = arr.slice().sort(function(a, b){ return a - b; });
      if (s.length === 1) return s[0];
      var mid = Math.floor(s.length / 2);
      return s.length % 2 === 0 ? (s[mid-1] + s[mid]) / 2 : s[mid];
    };
    var peerMedianFor = function(stageKey) {
      var pcts = peerRollups.map(function(p){ return p[stageKey].pct; }).filter(function(v){ return v != null; });
      var m = medianOfArr(pcts);
      return m != null ? Math.round(m * 10) / 10 : null;
    };

    var stageDefs = [
      { key: "received",  label: "Received"  },
      { key: "contacted", label: "Contacted" },
      { key: "meeting",   label: "Meeting"   },
      { key: "eoi",       label: "EOI"       },
      { key: "deal",      label: "Deal"      }
    ];

    var agentStages = stageDefs.map(function(s){
      return {
        key: s.key,
        label: s.label,
        count: agentRollup[s.key].count,
        pctOfReceived: agentRollup[s.key].pct
      };
    });
    var teamMedianStages = stageDefs.map(function(s){
      return {
        key: s.key,
        label: s.label,
        pctOfReceived: peerMedianFor(s.key)
      };
    });

    // Biggest leak — stage with most-negative gap below -5pp. Skips the
    // received row (always 100 vs 100) by definition.
    var biggestLeak = null;
    var leakStages = ["contacted", "meeting", "eoi", "deal"];
    for (var i = 0; i < leakStages.length; i++) {
      var k = leakStages[i];
      var ar = agentRollup[k].pct;
      var mr = peerMedianFor(k);
      if (ar == null || mr == null) continue;
      var gap = Math.round((ar - mr) * 10) / 10;
      if (gap < -5 && (biggestLeak == null || gap < biggestLeak.gap)) {
        // fromStage is the stage immediately upstream — what the leak
        // is "leaving from" in funnel-parlance.
        var prevKey = stageDefs[stageDefs.findIndex(function(s){ return s.key === k; }) - 1].key;
        biggestLeak = {
          fromStage: prevKey,
          toStage: k,
          agentPct: ar,
          medianPct: mr,
          gap: gap
        };
      }
    }

    res.json({
      range: { from: range.from, to: range.to },
      agentId: String(target._id),
      agentName: target.name || "(unknown)",
      agentRole: target.role || "",
      agent: { stages: agentStages },
      teamMedian: { stages: teamMedianStages },
      biggestLeak: biggestLeak,
      peerCount: peerIds.length
    });
  } catch (e) {
    console.error("[reports/agents/:id/stage-progression]", e && e.message);
    res.status(500).json({ error: e && e.message ? e.message : "agent_stage_progression_failed" });
  }
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