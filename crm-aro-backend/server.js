require("dotenv").config();
var express = require("express");
var mongoose = require("mongoose");
var cors = require("cors");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var crypto = require("crypto");

// ===== CORS OPTIONS =====
var corsOptions = {
  // Reflect caller origin to avoid blocking Vercel custom domains.
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-API-Key"]
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
  source:{type:String,default:"Facebook"}, project:{type:String,default:""},
  agentId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, budget:{type:String,default:""},
  notes:{type:String,default:""}, callbackTime:{type:String,default:""},
  lastActivityTime:{type:Date,default:Date.now}, archived:{type:Boolean,default:false}, isVIP:{type:Boolean,default:false},
  eoiDeposit:{type:String,default:""}, eoiDate:{type:String,default:""},
  eoiApproved:{type:Boolean,default:false}, eoiImage:{type:String,default:""},
  dealApproved:{type:Boolean,default:false}, dealImage:{type:String,default:""},
  commissionClaimDate:{type:String,default:""}, commissionClaimed:{type:Boolean,default:false},
  splitAgent2Id:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
  splitAgent2Name:{type:String,default:""},
  projectWeight:{type:Number,default:1},
  dealDate:{type:String,default:""},
  lastRotationAt:{type:Date,default:null}, rotationCount:{type:Number,default:0},
  locked:{type:Boolean,default:false}
},{timestamps:true}));

var Activity = mongoose.model("Activity", new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  leadId:{type:mongoose.Schema.Types.ObjectId,ref:"Lead"},
  type:{type:String,default:"call"}, note:{type:String,default:""}
},{timestamps:true}));

var Task = mongoose.model("Task", new mongoose.Schema({
  title:{type:String,required:true}, type:{type:String,default:"call"},
  time:{type:String,default:""}, leadId:{type:mongoose.Schema.Types.ObjectId,ref:"Lead"},
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, done:{type:Boolean,default:false}
},{timestamps:true}));

var DailyRequest = mongoose.model("DailyRequest", new mongoose.Schema({
  name:{type:String,required:true}, phone:{type:String,required:true}, phone2:{type:String,default:""},
  email:{type:String,default:""}, budget:{type:String,default:""}, propertyType:{type:String,default:""},
  area:{type:String,default:""}, notes:{type:String,default:""}, status:{type:String,default:"NewLead"},
  agentId:{type:mongoose.Schema.Types.ObjectId,ref:"User"}, callbackTime:{type:String,default:""},
  lastActivityTime:{type:Date,default:Date.now}, source:{type:String,default:"Daily Request"}
},{timestamps:true}));

var app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== CONNECT TO MONGODB =====
mongoose.connect(process.env.MONGODB_URI).then(function() {
  console.log("Connected to MongoDB");
  seedAdmin();
}).catch(function(err) {
  console.error("MongoDB connection error:", err);
});

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

function csrfProtection(req, res, next) {
  // Skip CSRF check for GET requests and login
  if (req.method === 'GET' || req.path === '/api/login') {
    return next();
  }

  var csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  if (!csrfToken) {
    return res.status(403).json({ error: "CSRF token missing" });
  }

  if (!req.user.csrfToken || csrfToken !== req.user.csrfToken) {
    return res.status(403).json({ error: "CSRF token invalid" });
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

// ===== AUTH ROUTES =====
app.post("/api/login", async function(req, res) {
  try {
    var user = await User.findOne({ username: req.body.username, active: true });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    var valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Generate CSRF token
    var csrfToken = crypto.randomBytes(32).toString('hex');

    var token = jwt.sign({
      id: user._id,
      role: user.role,
      name: user.name,
      csrfToken: csrfToken
    }, process.env.JWT_SECRET, { expiresIn: "7d" });

    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });
    res.json({
      token: token,
      csrfToken: csrfToken,
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

app.post("/api/users", auth, adminOnly, csrfProtection, async function(req, res) {
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
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/users/:id", auth, adminOnly, csrfProtection, async function(req, res) {
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
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/users/:id", auth, adminOnly, csrfProtection, async function(req, res) {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== LEAD ROUTES =====
app.get("/api/leads", auth, async function(req, res) {
  try {
    var query = {};
    var role = req.user.role;
    var uid = req.user.id;

    if (role === "sales") {
      query.agentId = new mongoose.Types.ObjectId(uid);

    } else if (role === "team_leader") {
      // Team leader sees only their direct sales
      var tlUser = await User.findById(uid).lean();
      if (!tlUser) return res.status(404).json({ error: "User not found" });
      var visibleAgentIds = [tlUser._id];
      var directSales = await User.find({ reportsTo: tlUser._id }).lean();
      directSales.forEach(function(s) { visibleAgentIds.push(s._id); });
      query.agentId = { $in: visibleAgentIds };

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

      query.agentId = { $in: uniqueIds };
    }
    // admin: no filter

    // Pagination
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 20;
    var skip = (page - 1) * limit;

    var total = await Lead.countDocuments(query);
    var leads = await Lead.find(query).populate("agentId", "name title teamId reportsTo").sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.json({
      data: leads,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== CHECK DUPLICATE PHONE =====
app.get("/api/leads/check-duplicate/:phone", auth, async function(req, res) {
  try {
    var phone = decodeURIComponent(req.params.phone);
    var lead = await Lead.findOne({ phone: phone, archived: false }).populate("agentId", "name title");
    if (lead) res.json({ exists: true, lead: lead });
    else res.json({ exists: false });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ===== ADD LEAD =====
app.post("/api/leads", auth, csrfProtection, async function(req, res) {
  try {
    console.log("NEW LEAD body:", JSON.stringify(req.body));
    var agentId = (req.body.agentId && req.body.agentId !== "")
      ? new mongoose.Types.ObjectId(req.body.agentId)
      : null;
    var lead = await Lead.create({
      name:             req.body.name,
      phone:            req.body.phone,
      phone2:           req.body.phone2 || "",
      email:            req.body.email || "",
      status:           req.body.status || "NewLead",
      source:           req.body.source || "Facebook",
      project:          req.body.project || "",
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
    });
    console.log("SAVED phone2:", lead.phone2);
    lead = await Lead.findById(lead._id).populate("agentId", "name title");
    res.json(lead);
  } catch (e) {
    console.error("POST /api/leads error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ===== BULK REASSIGN (must be before /:id) =====
app.put("/api/leads/bulk-reassign", auth, csrfProtection, adminOnly, async function(req, res) {
  try {
    var { leadIds, agentId } = req.body;
    if(!leadIds||!leadIds.length||!agentId) return res.status(400).json({ error: "leadIds and agentId required" });
    var agentObjId = new mongoose.Types.ObjectId(agentId);
    await Lead.updateMany({ _id: { $in: leadIds } }, { $set: { agentId: agentObjId, lastActivityTime: new Date() } });
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
    var field = imageType === "deal" ? "dealImage" : "eoiImage";
    var update = {}; update[field] = imageData;
    var lead = await Lead.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).populate("agentId", "name title");
    res.json(lead);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/leads/:id", auth, csrfProtection, async function(req, res) {
  try {
    var update = Object.assign({}, req.body, { lastActivityTime: new Date() });
    // Never overwrite agentId with null/empty unless explicitly reassigning
    if (!update.agentId) delete update.agentId;
    // If agentId is being changed (manual reassign) — reset status to NewLead
    var oldLead = null;
    if (req.body.agentId) {
      oldLead = await Lead.findById(req.params.id).lean();
    }
    var lead = await Lead.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).populate("agentId", "name title");
    try {
      var actType = "note";
      var actNote = "Updated";
      if (req.body.status) {
        actType = "status_change";
        actNote = "Status: " + req.body.status;
      } else if (req.body.agentId && oldLead && String(oldLead.agentId) !== String(req.body.agentId)) {
        actType = "reassign";
        actNote = "تم التحويل اليدوي إلى موظف جديد";
        // Also log reassignedAt
        await Lead.findByIdAndUpdate(req.params.id, { $set: { reassignedAt: new Date() } });
      }
      await Activity.create({
        userId: req.user.id,
        leadId: req.params.id,
        type: actType,
        note: actNote,
      });
    } catch(actErr) {
      console.error("Activity log error (non-fatal):", actErr.message);
    }
    res.json(lead);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/leads/:id", auth, csrfProtection, adminOnly, async function(req, res) {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk delete archived leads
app.post("/api/leads/bulk-delete", auth, csrfProtection, adminOnly, async function(req, res) {
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

    // Pagination
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 20;
    var skip = (page - 1) * limit;

    var total = await Activity.countDocuments(query);
    var activities = await Activity.find(query).populate("userId", "name").populate("leadId", "name").sort({ createdAt: -1 }).skip(skip).limit(limit);

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

app.post("/api/activities", auth, csrfProtection, async function(req, res) {
  try {
    var activity = await Activity.create({
      userId: req.user.id,
      leadId: req.body.leadId,
      type: req.body.type || "call",
      note: req.body.note || "",
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

// ===== LEAD FULL HISTORY (Admin only) =====
app.get("/api/leads/:id/full-history", auth, async function(req, res) {
  try {
    var oid = new mongoose.Types.ObjectId(req.params.id);
    var activities = await Activity.find({ leadId: oid })
      .populate("userId", "name title")
      .sort({ createdAt: 1 });
    res.json(activities);
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

app.post("/api/tasks", auth, csrfProtection, async function(req, res) {
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

app.put("/api/tasks/:id", auth, csrfProtection, async function(req, res) {
  try {
    var task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("userId", "name").populate("leadId", "name");
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/tasks/:id", auth, csrfProtection, async function(req, res) {
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
    if (req.user.role === "sales") { leadQuery.agentId = req.user.id; actQuery.userId = req.user.id; }
    var totalLeads = await Lead.countDocuments(leadQuery);
    var potential = await Lead.countDocuments(Object.assign({ status: "Potential" }, leadQuery));
    var hotCase = await Lead.countDocuments(Object.assign({ status: "HotCase" }, leadQuery));
    var callBack = await Lead.countDocuments(Object.assign({ status: "CallBack" }, leadQuery));
    var meetingDone = await Lead.countDocuments(Object.assign({ status: "MeetingDone" }, leadQuery));
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
      query.agentId = req.user.id;
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

app.post("/api/daily-requests", auth, csrfProtection, async function(req, res) {
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
    });
    r = await DailyRequest.findById(r._id).populate("agentId", "name title");
    // Log creation as activity
    var createNote = "Added — Status: " + (req.body.status||"NewLead");
    if(req.body.notes) createNote += " | " + req.body.notes;
    await Activity.create({ userId: req.user.id, type: "note", note: createNote, leadId: r._id });
    res.json(r);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/daily-requests/bulk-reassign", auth, adminOnly, csrfProtection, async function(req, res) {
  try {
    var { leadIds, agentId } = req.body;
    if(!leadIds||!leadIds.length||!agentId) return res.status(400).json({ error: "leadIds and agentId required" });
    var agentObjId = new mongoose.Types.ObjectId(agentId);
    await DailyRequest.updateMany({ _id: { $in: leadIds } }, { $set: { agentId: agentObjId } });
    res.json({ ok: true, count: leadIds.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/daily-requests/:id", auth, csrfProtection, async function(req, res) {
  try {
    var update = Object.assign({}, req.body, { lastActivityTime: new Date() });
    // Never overwrite agentId with null/empty — only update if explicitly provided and valid
    if (!update.agentId) delete update.agentId;
    var r = await DailyRequest.findByIdAndUpdate(req.params.id, update, { new: true }).populate("agentId", "name title");
    if (req.body.status) {
      var actNote = "DailyReq: " + req.body.status;
      if (req.body.notes) actNote += " | " + req.body.notes;
      await Activity.create({ userId: req.user.id, type: "status_change", note: actNote, leadId: r._id });
      // If status is DoneDeal or EOI — create/update a Lead in the main collection
      if (req.body.status === "DoneDeal" || req.body.status === "EOI") {
        var existingLead = await Lead.findOne({ phone: r.phone, source: "Daily Request" });
        if (existingLead) {
          await Lead.findByIdAndUpdate(existingLead._id, {
            status: req.body.status,
            budget: req.body.budget || r.budget || existingLead.budget,
            project: req.body.project || r.propertyType || existingLead.project,
            agentId: r.agentId,
            lastActivityTime: new Date(),
            notes: req.body.notes || r.notes || existingLead.notes,
            eoiDeposit: req.body.eoiDeposit || existingLead.eoiDeposit || "",
          });
        } else {
          await Lead.create({
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
          });
        }
      }
    }
    res.json(r);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/daily-requests/:id", auth, adminOnly, csrfProtection, async function(req, res) {
  try {
    await DailyRequest.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
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

// ===== BULK REASSIGN =====
// ===== FIX MANAGER TEAM IDS =====
// One-time endpoint to auto-assign teamId to managers based on their sales' teamIds
app.post("/api/fix-manager-teams", auth, adminOnly, csrfProtection, async function(req, res) {
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
app.put("/api/leads/:id/archive", auth, csrfProtection, adminOnly, async function(req, res) {
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
                var agents = await User.find({ role: { $in: ["sales","manager"] }, active: true });
                var agentId = null;
                if (agents.length > 0) {
                  var counts = await Promise.all(agents.map(function(a) { return Lead.countDocuments({ agentId: a._id }); }));
                  agentId = agents[counts.indexOf(Math.min(...counts))]._id;
                }
                var newLead = await Lead.create({ name: leadData.name || "Facebook Lead", phone: leadData.phone || "", email: leadData.email || "", source: "Facebook", status: "Potential", agentId: agentId, lastActivityTime: new Date(), notes: "Facebook Lead Ads" });
                await Activity.create({ userId: agentId, leadId: newLead._id, type: "note", note: "Facebook Lead Ads" });
                console.log("FB lead saved:", newLead.name);
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

// ===== START SERVER =====
var PORT = process.env.PORT || 5000;
app.listen(PORT, function() {
  console.log("CRM ARO Server running on port " + PORT);
});
