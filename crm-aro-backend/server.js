require("dotenv").config();
var express = require("express");
var mongoose = require("mongoose");
var cors = require("cors");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var models = require("./models");
var User = models.User;
var Lead = models.Lead;
var Activity = models.Activity;
var Task = models.Task;
var DailyRequest = models.DailyRequest;
var app = express();
app.use(cors());
app.use(express.json());

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
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

// ===== AUTH ROUTES =====
app.post("/api/login", async function(req, res) {
  try {
    var user = await User.findOne({ username: req.body.username, active: true });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    var valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    var token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token: token, user: { id: user._id, name: user.name, username: user.username, role: user.role, title: user.title, email: user.email, phone: user.phone } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
    var users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/users", auth, adminOnly, async function(req, res) {
  try {
    var hashed = await bcrypt.hash(req.body.password || "sales123", 10);
    var user = await User.create({
      name: req.body.name,
      username: req.body.username,
      password: hashed,
      email: req.body.email || "",
      phone: req.body.phone || "",
      role: req.body.role || "sales",
      title: req.body.title || "",
      active: true,
    });
    var obj = user.toObject();
    delete obj.password;
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
    if (req.body.password) update.password = await bcrypt.hash(req.body.password, 10);
    var user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/users/:id", auth, adminOnly, async function(req, res) {
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
    if (req.user.role === "sales") {
      query.agentId = req.user.id;
    }
    var leads = await Lead.find(query).populate("agentId", "name title").sort({ createdAt: -1 });
    res.json(leads);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/leads", auth, async function(req, res) {
  try {
    var lead = await Lead.create({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email || "",
      status: req.body.status || "Potential",
      source: req.body.source || "Facebook",
      project: req.body.project || "",
      agentId: req.body.agentId || req.user.id,
      budget: req.body.budget || "",
      notes: req.body.notes || "",
      callbackTime: req.body.callbackTime || "",
      lastActivityTime: new Date(),
    });
    lead = await Lead.findById(lead._id).populate("agentId", "name title");
    res.json(lead);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/leads/:id", auth, async function(req, res) {
  try {
    var update = Object.assign({}, req.body, { lastActivityTime: new Date() });
    var lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true }).populate("agentId", "name title");
    // Log activity
    await Activity.create({
      userId: req.user.id,
      leadId: req.params.id,
      type: req.body.status ? "status_change" : "note",
      note: req.body.status ? "Status: " + req.body.status : "Updated",
    });
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

// ===== ACTIVITY ROUTES =====
app.get("/api/activities", auth, async function(req, res) {
  try {
    var query = {};
    if (req.user.role === "sales") {
      query.userId = req.user.id;
    }
    var activities = await Activity.find(query).populate("userId", "name").populate("leadId", "name").sort({ createdAt: -1 }).limit(50);
    res.json(activities);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/activities", auth, async function(req, res) {
  try {
    var activity = await Activity.create({
      userId: req.user.id,
      leadId: req.body.leadId,
      type: req.body.type || "call",
      note: req.body.note || "",
    });
    // Update lead lastActivityTime
    if (req.body.leadId) {
      await Lead.findByIdAndUpdate(req.body.leadId, { lastActivityTime: new Date() });
    }
    activity = await Activity.findById(activity._id).populate("userId", "name").populate("leadId", "name");
    res.json(activity);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== TASK ROUTES =====
app.get("/api/tasks", auth, async function(req, res) {
  try {
    var query = {};
    if (req.user.role === "sales") {
      query.userId = req.user.id;
    }
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
      leadQuery.agentId = req.user.id;
      actQuery.userId = req.user.id;
    }
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

    res.json({
      totalLeads: totalLeads, potential: potential, hotCase: hotCase, callBack: callBack,
      meetingDone: meetingDone, notInterested: notInterested, noAnswer: noAnswer,
      doneDeal: doneDeal, totalActivities: totalActivities, totalCalls: totalCalls,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== HEALTH CHECK =====
app.get("/", function(req, res) {
  res.json({ status: "CRM ARO API is running", version: "1.0.0" });
});

// ===== START SERVER =====
var PORT = process.env.PORT || 5000;
// ===== DAILY REQUEST ROUTES =====

app.get("/api/daily-requests", auth, async function(req, res) {
  try {
    var query = {};
    if (req.user.role === "sales") query.agentId = req.user.id;
    var requests = await DailyRequest.find(query)
      .populate("agentId", "name title")
      .sort({ createdAt: -1 });
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
      lastActivityTime: new Date(),
    });
    r = await DailyRequest.findById(r._id).populate("agentId","name title");
    res.json(r);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/daily-requests/:id", auth, async function(req, res) {
  try {
    var update = Object.assign({}, req.body, { lastActivityTime: new Date() });
    var r = await DailyRequest.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("agentId","name title");
    if (req.body.status) {
      await Activity.create({ userId: req.user.id, type: "status_change", note: "DailyReq: " + req.body.status });
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
app.listen(PORT, function() {
  console.log("CRM ARO Server running on port " + PORT);
});
