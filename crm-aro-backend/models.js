var mongoose = require("mongoose");

// ===== USER MODEL =====
var userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  role: { type: String, enum: ["admin", "manager", "sales", "viewer"], default: "sales" },
  title: { type: String, default: "" },
  active: { type: Boolean, default: true },
monthlyTarget: { type: Number, default: 15 },
teamId: { type: String, default: "" },
teamName: { type: String, default: "" },
}, { timestamps: true });

// ===== LEAD MODEL =====
var leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: "" },
status: { type: String, enum: ["NewLead","Potential","HotCase","CallBack","MeetingDone","NotInterested","NoAnswer","DoneDeal"], default: "NewLead" },
  source: { type: String, default: "Facebook" },
  project: { type: String, default: "" },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  budget: { type: String, default: "" },
  notes: { type: String, default: "" },
  callbackTime: { type: String, default: "" },
phone2: { type: String, default: "" },
archived: { type: Boolean, default: false },
  lastActivityTime: { type: Date, default: Date.now },
}, { timestamps: true });

// ===== ACTIVITY MODEL =====
var activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
  type: { type: String, enum: ["call", "meeting", "followup", "email", "status_change", "reassign", "note"], default: "call" },
  note: { type: String, default: "" },
}, { timestamps: true });

// ===== TASK MODEL =====
var taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["call", "meeting", "email", "followup"], default: "call" },
  time: { type: String, default: "" },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  done: { type: Boolean, default: false },
}, { timestamps: true });

var User = mongoose.model("User", userSchema);
var Lead = mongoose.model("Lead", leadSchema);
var Activity = mongoose.model("Activity", activitySchema);
var Task = mongoose.model("Task", taskSchema);

var dailyRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  phone2: { type: String, default: "" },
  email: { type: String, default: "" },
  budget: { type: String, default: "" },
  propertyType: { type: String, default: "" },
  area: { type: String, default: "" },
  notes: { type: String, default: "" },
  status: { type: String, enum: ["NewLead","Potential","HotCase","CallBack","MeetingDone","NotInterested","NoAnswer","DoneDeal"], default: "NewLead" },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  callbackTime: { type: String, default: "" },
  lastActivityTime: { type: Date, default: Date.now },
  source: { type: String, default: "Daily Request" },
}, { timestamps: true });

var DailyRequest = mongoose.model("DailyRequest", dailyRequestSchema);
module.exports = { User, Lead, Activity, Task, DailyRequest };

