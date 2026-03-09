import { useState, useEffect, useCallback } from "react";
import { Search, Bell, ChevronDown, ChevronRight, ChevronLeft, Plus, Phone, Mail, MessageSquare, Calendar, Clock, MapPin, Building, Users, BarChart3, Settings, Home, FileText, Briefcase, Target, TrendingUp, UserPlus, CheckCircle, XCircle, AlertCircle, Edit, Trash2, ArrowUpRight, ArrowDownRight, Activity, Layers, DollarSign, X, Lock, Globe, Star, ExternalLink, LogOut, Eye, EyeOff } from "lucide-react";

/* ========== CRM ARO v4 ========== */

// ===== TRANSLATIONS =====
var TR = {
  ar: {
    dir: "rtl",
    appName: "CRM ARO", appSub: "Real Estate CRM",
    login: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644", loginBtn: "\u062f\u062e\u0648\u0644", loginError: "\u0627\u0633\u0645 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u0644\u0637",
    username: "\u0627\u0633\u0645 \u0627\u0644\u062f\u062e\u0648\u0644", password: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", logout: "\u062a\u0633\u062c\u064a\u0644 \u062e\u0631\u0648\u062c",
    dashboard: "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629", leads: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621", deals: "\u0627\u0644\u0635\u0641\u0642\u0627\u062a", projects: "\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639",
    tasks: "\u0627\u0644\u0645\u0647\u0627\u0645", reports: "\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631", team: "\u0641\u0631\u064a\u0642 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a", users: "\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646",
    units: "\u0627\u0644\u0648\u062d\u062f\u0627\u062a", settings: "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a", channels: "\u0627\u0644\u0642\u0646\u0648\u0627\u062a",
    search: "\u0628\u062d\u062b...", all: "\u0627\u0644\u0643\u0644", totalLeads: "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0645\u0644\u0627\u0621", newLeads: "\u062c\u062f\u062f",
    activeDeals: "\u0635\u0641\u0642\u0627\u062a \u0646\u0634\u0637\u0629", doneDeals: "\u062a\u0645 \u0627\u0644\u0628\u064a\u0639",
    addLead: "\u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u064a\u0644", addUser: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u062a\u062e\u062f\u0645", addTask: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0647\u0645\u0629",
    name: "\u0627\u0644\u0627\u0633\u0645", phone: "\u0627\u0644\u0647\u0627\u062a\u0641", email: "\u0627\u0644\u0625\u064a\u0645\u064a\u0644", budget: "\u0627\u0644\u0645\u064a\u0632\u0627\u0646\u064a\u0629",
    project: "\u0627\u0644\u0645\u0634\u0631\u0648\u0639", source: "\u0627\u0644\u0645\u0635\u062f\u0631", agent: "\u0627\u0644\u0645\u0648\u0638\u0641",
    status: "\u0627\u0644\u062d\u0627\u0644\u0629", cancel: "\u0625\u0644\u063a\u0627\u0621", save: "\u062d\u0641\u0638", add: "\u0625\u0636\u0627\u0641\u0629",
    callbackTime: "\u0645\u0648\u0639\u062f \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629", notes: "\u0645\u0644\u0627\u062d\u0638\u0627\u062a",
    changeStatus: "\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u062d\u0627\u0644\u0629", assignTo: "\u062a\u0639\u064a\u064a\u0646 \u0644\u0640",
    lastActivity: "\u0622\u062e\u0631 \u0646\u0634\u0627\u0637", title: "\u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a", role: "\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629",
    active: "\u0646\u0634\u0637", inactive: "\u063a\u064a\u0631 \u0646\u0634\u0637",
    admin: "\u0645\u062f\u064a\u0631 \u0646\u0638\u0627\u0645", salesManager: "\u0645\u062f\u064a\u0631 \u0645\u0628\u064a\u0639\u0627\u062a", salesAgent: "\u0645\u0648\u0638\u0641 \u0645\u0628\u064a\u0639\u0627\u062a", viewer: "\u0645\u0634\u0627\u0647\u062f",
    potential: "Potential", hotCase: "Hot Case", callBack: "Call Back", notInterested: "Not Interested",
    noAnswer: "No Answer", doneDeal: "Done Deal", meetingDone: "Meeting Done",
    connected: "\u0645\u062a\u0635\u0644", disconnected: "\u063a\u064a\u0631 \u0645\u062a\u0635\u0644",
    conversionRate: "\u0645\u0639\u062f\u0644 \u0627\u0644\u062a\u062d\u0648\u064a\u0644", totalCalls: "\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062a",
    todayActivities: "\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u064a\u0648\u0645", callReminder: "\u062a\u0646\u0628\u064a\u0647\u0627\u062a",
    available: "\u0645\u062a\u0627\u062d", reserved: "\u0645\u062d\u062c\u0648\u0632", sold: "\u0645\u0628\u0627\u0639",
    language: "\u0627\u0644\u0644\u063a\u0629", calls: "\u0645\u0643\u0627\u0644\u0645\u0627\u062a", meetings: "\u0627\u062c\u062a\u0645\u0627\u0639\u0627\u062a", followups: "\u0645\u062a\u0627\u0628\u0639\u0627\u062a",
    taskTitle: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0647\u0645\u0629", taskType: "\u0627\u0644\u0646\u0648\u0639", taskTime: "\u0627\u0644\u0648\u0642\u062a", relatedLead: "\u0627\u0644\u0639\u0645\u064a\u0644",
    sourcePerf: "\u0623\u062f\u0627\u0621 \u0627\u0644\u0645\u0635\u0627\u062f\u0631", leadsByStatus: "\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u062d\u0633\u0628 \u0627\u0644\u062d\u0627\u0644\u0629",
    agentPerf: "\u0623\u062f\u0627\u0621 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646", companyName: "\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629", address: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646",
    welcome: "\u0645\u0631\u062d\u0628\u0627\u064b", myLeads: "\u0639\u0645\u0644\u0627\u0626\u064a", allLeads: "\u0643\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
    pending: "\u0645\u062a\u0628\u0642\u064a\u0629", completed: "\u0645\u0643\u062a\u0645\u0644\u0629",
    ago: "\u0645\u0646\u0630", minutes: "\u062f\u0642\u064a\u0642\u0629", hours: "\u0633\u0627\u0639\u0629", days: "\u064a\u0648\u0645", just: "\u0627\u0644\u0622\u0646",
  },
  en: {
    dir: "ltr",
    appName: "CRM ARO", appSub: "Real Estate CRM",
    login: "Login", loginBtn: "Sign In", loginError: "Invalid username or password",
    username: "Username", password: "Password", logout: "Logout",
    dashboard: "Dashboard", leads: "Leads", deals: "Deals", projects: "Projects",
    tasks: "Tasks", reports: "Reports", team: "Sales Team", users: "Users",
    units: "Units", settings: "Settings", channels: "Channels",
    search: "Search...", all: "All", totalLeads: "Total Leads", newLeads: "New",
    activeDeals: "Active Deals", doneDeals: "Done Deals",
    addLead: "Add Lead", addUser: "Add User", addTask: "Add Task",
    name: "Name", phone: "Phone", email: "Email", budget: "Budget",
    project: "Project", source: "Source", agent: "Agent",
    status: "Status", cancel: "Cancel", save: "Save", add: "Add",
    callbackTime: "Callback Time", notes: "Notes",
    changeStatus: "Change Status", assignTo: "Assign To",
    lastActivity: "Last Activity", title: "Job Title", role: "Role",
    active: "Active", inactive: "Inactive",
    admin: "Admin", salesManager: "Sales Manager", salesAgent: "Sales Agent", viewer: "Viewer",
    potential: "Potential", hotCase: "Hot Case", callBack: "Call Back", notInterested: "Not Interested",
    noAnswer: "No Answer", doneDeal: "Done Deal", meetingDone: "Meeting Done",
    connected: "Connected", disconnected: "Disconnected",
    conversionRate: "Conversion Rate", totalCalls: "Total Calls",
    todayActivities: "Today Activities", callReminder: "Notifications",
    available: "Available", reserved: "Reserved", sold: "Sold",
    language: "Language", calls: "Calls", meetings: "Meetings", followups: "Follow-ups",
    taskTitle: "Title", taskType: "Type", taskTime: "Time", relatedLead: "Lead",
    sourcePerf: "Source Performance", leadsByStatus: "Leads by Status",
    agentPerf: "Agent Performance", companyName: "Company Name", address: "Address",
    welcome: "Welcome", myLeads: "My Leads", allLeads: "All Leads",
    pending: "Pending", completed: "Completed",
    ago: "ago", minutes: "min", hours: "hr", days: "days", just: "Just now",
  }
};

// ===== COLORS =====
var C = { primary: "#1B3A5C", primaryLight: "#2A5A8C", primaryDark: "#0F2440", accent: "#E8A838", accentLight: "#F5C563", success: "#22C55E", danger: "#EF4444", warning: "#F59E0B", info: "#3B82F6", bg: "#F0F2F5", text: "#1E293B", textLight: "#64748B", border: "#E2E8F0" };

// ===== STATUS CONFIG =====
var getStatuses = function(t) {
  return [
    { value: "Potential", label: t.potential, bg: "#DBEAFE", color: "#1D4ED8" },
    { value: "HotCase", label: t.hotCase, bg: "#FEE2E2", color: "#DC2626" },
    { value: "CallBack", label: t.callBack, bg: "#FEF3C7", color: "#B45309" },
    { value: "MeetingDone", label: t.meetingDone, bg: "#F3E8FF", color: "#7C3AED" },
    { value: "NotInterested", label: t.notInterested, bg: "#F1F5F9", color: "#64748B" },
    { value: "NoAnswer", label: t.noAnswer, bg: "#E0E7FF", color: "#4338CA" },
    { value: "DoneDeal", label: t.doneDeal, bg: "#DCFCE7", color: "#15803D" },
  ];
};

// ===== USERS WITH PASSWORDS =====
var mkUsers = function() {
  return [
    { id: 1, name: "\u0623\u0645\u062c\u062f", username: "amgad", password: "admin123", role: "admin", title: "CEO", email: "amgad@aro.com", phone: "01000000000", active: true },
    { id: 2, name: "\u0645\u062d\u0645\u062f \u0633\u0639\u064a\u062f", username: "m.saeed", password: "sales123", role: "sales", title: "Senior Sales", email: "m.saeed@aro.com", phone: "01011111111", active: true },
    { id: 3, name: "\u0623\u062d\u0645\u062f \u0643\u0645\u0627\u0644", username: "a.kamal", password: "sales123", role: "sales", title: "Sales Executive", email: "a.kamal@aro.com", phone: "01022222222", active: true },
    { id: 4, name: "\u064a\u0648\u0633\u0641 \u0623\u0634\u0631\u0641", username: "y.ashraf", password: "sales123", role: "sales", title: "Sales Agent", email: "y.ashraf@aro.com", phone: "01033333333", active: true },
  ];
};

var now = function() { return new Date().toISOString(); };
var timeAgo = function(dateStr, t) {
  if (!dateStr) return "-";
  var diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
  if (diff < 1) return t.just;
  if (diff < 60) return Math.floor(diff) + " " + t.minutes + " " + t.ago;
  if (diff < 1440) return Math.floor(diff / 60) + " " + t.hours + " " + t.ago;
  return Math.floor(diff / 1440) + " " + t.days + " " + t.ago;
};

// ===== INITIAL DATA =====
var mkLeads = function() {
  return [
    { id: 1, name: "\u0623\u062d\u0645\u062f \u0645\u062d\u0645\u062f", phone: "01012345678", email: "ahmed@email.com", status: "Potential", source: "Facebook", project: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u064a\u0629", agentId: 2, date: "2026-03-06", budget: "2,500,000", notes: "\u0645\u0647\u062a\u0645 \u0628\u0634\u0642\u0629 3 \u063a\u0631\u0641", callbackTime: "2026-03-07T10:00", lastActivityTime: "2026-03-06T09:30:00" },
    { id: 2, name: "\u0633\u0627\u0631\u0629 \u0623\u062d\u0645\u062f", phone: "01123456789", email: "sara@email.com", status: "HotCase", source: "Instagram", project: "\u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644 \u0633\u064a\u062a\u064a", agentId: 3, date: "2026-03-05", budget: "3,200,000", notes: "\u062a\u0631\u064a\u062f \u0641\u064a\u0644\u0627", callbackTime: "2026-03-07T14:00", lastActivityTime: "2026-03-06T10:15:00" },
    { id: 3, name: "\u0645\u062d\u0645\u0648\u062f \u062d\u0633\u0646", phone: "01234567890", email: "mahmoud@email.com", status: "CallBack", source: "WhatsApp", project: "\u0627\u0644\u062a\u062c\u0645\u0639 \u0627\u0644\u062e\u0627\u0645\u0633", agentId: 2, date: "2026-03-04", budget: "1,800,000", notes: "\u062f\u0648\u0628\u0644\u0643\u0633", callbackTime: "2026-03-08T11:00", lastActivityTime: "2026-03-06T14:00:00" },
    { id: 4, name: "\u0641\u0627\u0637\u0645\u0629 \u0639\u0628\u062f\u0627\u0644\u0644\u0647", phone: "01098765432", email: "fatma@email.com", status: "DoneDeal", source: "Google Ads", project: "\u0627\u0644\u0634\u0631\u0648\u0642", agentId: 4, date: "2026-03-03", budget: "4,100,000", notes: "\u062a\u0645 \u0627\u0644\u0628\u064a\u0639", callbackTime: "", lastActivityTime: "2026-03-05T16:00:00" },
    { id: 5, name: "\u0639\u0645\u0631 \u062e\u0627\u0644\u062f", phone: "01156789012", email: "omar@email.com", status: "MeetingDone", source: "TikTok", project: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u064a\u0629", agentId: 3, date: "2026-03-02", budget: "2,900,000", notes: "\u062a\u0645 \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0629", callbackTime: "2026-03-09T10:00", lastActivityTime: "2026-03-06T11:30:00" },
    { id: 6, name: "\u0646\u0648\u0631 \u062d\u0633\u0627\u0645", phone: "01067890123", email: "nour@email.com", status: "NoAnswer", source: "Facebook", project: "6 \u0623\u0643\u062a\u0648\u0628\u0631", agentId: 2, date: "2026-03-06", budget: "1,500,000", notes: "\u0644\u0645 \u064a\u0631\u062f 3 \u0645\u0631\u0627\u062a", callbackTime: "2026-03-07T16:00", lastActivityTime: "2026-03-06T15:45:00" },
    { id: 7, name: "\u0631\u064a\u0645 \u0633\u0645\u064a\u0631", phone: "01278901234", email: "reem@email.com", status: "Potential", source: "Instagram", project: "\u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644 \u0633\u064a\u062a\u064a", agentId: 4, date: "2026-03-06", budget: "5,000,000", notes: "\u062a\u0627\u0648\u0646 \u0647\u0627\u0648\u0633", callbackTime: "2026-03-07T09:00", lastActivityTime: "2026-03-06T08:00:00" },
    { id: 8, name: "\u0643\u0631\u064a\u0645 \u0648\u0627\u0626\u0644", phone: "01189012345", email: "karim@email.com", status: "HotCase", source: "WhatsApp", project: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u064a\u0629", agentId: 2, date: "2026-03-05", budget: "3,700,000", notes: "\u062f\u0648\u0631 \u0623\u0631\u0636\u064a", callbackTime: "2026-03-07T12:00", lastActivityTime: "2026-03-06T13:20:00" },
    { id: 9, name: "\u0647\u062f\u0649 \u0645\u0635\u0637\u0641\u0649", phone: "01090123456", email: "huda@email.com", status: "DoneDeal", source: "Google Ads", project: "\u0627\u0644\u062a\u062c\u0645\u0639 \u0627\u0644\u062e\u0627\u0645\u0633", agentId: 3, date: "2026-03-01", budget: "2,200,000", notes: "\u062a\u0645 \u0627\u0644\u062a\u0639\u0627\u0642\u062f", callbackTime: "", lastActivityTime: "2026-03-04T10:00:00" },
    { id: 10, name: "\u064a\u0648\u0633\u0641 \u0637\u0627\u0631\u0642", phone: "01201234567", email: "youssef@email.com", status: "NotInterested", source: "TikTok", project: "\u0627\u0644\u0634\u0631\u0648\u0642", agentId: 4, date: "2026-03-04", budget: "1,950,000", notes: "\u0627\u062e\u062a\u0627\u0631 \u0645\u0634\u0631\u0648\u0639 \u0622\u062e\u0631", callbackTime: "", lastActivityTime: "2026-03-05T09:00:00" },
  ];
};

var mkActivities = function() {
  return [
    { id: 1, userId: 2, type: "call", leadId: 1, time: "2026-03-06T09:30:00", note: "\u062a\u0645 \u0627\u0644\u0627\u062a\u0635\u0627\u0644" },
    { id: 2, userId: 3, type: "call", leadId: 2, time: "2026-03-06T10:15:00", note: "\u0625\u0631\u0633\u0627\u0644 \u0639\u0631\u0636" },
    { id: 3, userId: 2, type: "meeting", leadId: 3, time: "2026-03-06T14:00:00", note: "\u0645\u064a\u062a\u0646\u062c" },
    { id: 4, userId: 4, type: "call", leadId: 7, time: "2026-03-06T08:00:00", note: "\u0627\u062a\u0635\u0627\u0644 \u0623\u0648\u0644" },
    { id: 5, userId: 2, type: "followup", leadId: 8, time: "2026-03-06T13:20:00", note: "\u0645\u062a\u0627\u0628\u0639\u0629" },
  ];
};

var mkTasks = function() {
  return [
    { id: 1, title: "\u0627\u062a\u0635\u0627\u0644 \u0628\u0623\u062d\u0645\u062f", type: "call", time: "10:00 AM", leadId: 1, userId: 2, done: false },
    { id: 2, title: "\u0645\u064a\u062a\u0646\u062c \u0645\u062d\u0645\u0648\u062f", type: "meeting", time: "02:00 PM", leadId: 3, userId: 2, done: false },
    { id: 3, title: "\u0639\u0631\u0636 \u0644\u0633\u0627\u0631\u0629", type: "email", time: "11:30 AM", leadId: 2, userId: 3, done: true },
    { id: 4, title: "\u0645\u062a\u0627\u0628\u0639\u0629 \u0643\u0631\u064a\u0645", type: "followup", time: "04:00 PM", leadId: 8, userId: 2, done: false },
    { id: 5, title: "\u0627\u062a\u0635\u0627\u0644 \u0628\u0631\u064a\u0645", type: "call", time: "09:00 AM", leadId: 7, userId: 4, done: false },
  ];
};

var projectsList = [
  { id: 1, name: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u064a\u0629", developer: "\u0634\u0631\u0643\u0629 \u0627\u0644\u0646\u064a\u0644", units: 450, sold: 280, location: "\u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0627\u0644\u0625\u062f\u0627\u0631\u064a\u0629 \u0627\u0644\u062c\u062f\u064a\u062f\u0629" },
  { id: 2, name: "\u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644 \u0633\u064a\u062a\u064a", developer: "\u0634\u0631\u0643\u0629 \u0627\u0644\u0623\u0647\u0644\u064a", units: 320, sold: 190, location: "\u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644 \u0633\u064a\u062a\u064a" },
  { id: 3, name: "\u0627\u0644\u062a\u062c\u0645\u0639 \u0627\u0644\u062e\u0627\u0645\u0633", developer: "\u0628\u0627\u0644\u0645 \u0647\u064a\u0644\u0632", units: 200, sold: 145, location: "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0627\u0644\u062c\u062f\u064a\u062f\u0629" },
  { id: 4, name: "\u0627\u0644\u0634\u0631\u0648\u0642", developer: "\u0627\u0644\u0645\u0642\u0627\u0648\u0644\u0648\u0646 \u0627\u0644\u0639\u0631\u0628", units: 180, sold: 95, location: "\u0645\u062f\u064a\u0646\u0629 \u0627\u0644\u0634\u0631\u0648\u0642" },
  { id: 5, name: "6 \u0623\u0643\u062a\u0648\u0628\u0631", developer: "\u0633\u0648\u062f\u064a\u0643", units: 260, sold: 210, location: "6 \u0623\u0643\u062a\u0648\u0628\u0631" },
];

var channels = [
  { id: "facebook", name: "Facebook", icon: "\ud83d\udcf1", color: "#1877F2" },
  { id: "instagram", name: "Instagram", icon: "\ud83d\udcf7", color: "#E4405F" },
  { id: "tiktok", name: "TikTok", icon: "\ud83c\udfb5", color: "#000000" },
  { id: "whatsapp", name: "WhatsApp", icon: "\ud83d\udcac", color: "#25D366" },
  { id: "google", name: "Google Ads", icon: "\ud83d\udd0d", color: "#34A853" },
];

// ===== UI COMPONENTS =====
var Badge = function(p) { return <span style={{ background: p.bg || "#F1F5F9", color: p.color || C.text, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", cursor: p.onClick ? "pointer" : "default", border: p.dashed ? "1px dashed " + (p.color || C.text) : "none", display: "inline-flex", alignItems: "center", gap: 4 }} onClick={p.onClick}>{p.children}</span>; };
var Card = function(p) { return <div style={Object.assign({ background: "#fff", borderRadius: 14, padding: p.p !== undefined ? p.p : 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #E8ECF1" }, p.style || {})}>{p.children}</div>; };

var StatCard = function(p) {
  var I = p.icon;
  return <div onClick={p.onClick} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", flex: 1, minWidth: 170, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #E8ECF1", display: "flex", alignItems: "center", gap: 14, cursor: p.onClick ? "pointer" : "default", transition: "transform 0.15s" }}
    onMouseEnter={function(e) { if (p.onClick) e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={function(e) { e.currentTarget.style.transform = "none"; }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: p.c + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I size={20} color={p.c} /></div>
    <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: C.textLight, marginBottom: 3 }}>{p.label}</div><div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{p.value}</div></div>
  </div>;
};

var Modal = function(p) {
  if (!p.show) return null;
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }} onClick={p.onClose}>
    <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: p.w || 500, maxHeight: "90vh", overflowY: "auto" }} onClick={function(e) { e.stopPropagation(); }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.text }}>{p.title}</h2>
      {p.children}
    </div>
  </div>;
};

var Inp = function(p) {
  return <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 5 }}>{p.label}</label>
    {p.type === "select" ? <select value={p.value} onChange={p.onChange} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, background: "#fff", boxSizing: "border-box" }}>{p.options.map(function(o) { return <option key={o.value !== undefined ? o.value : o} value={o.value !== undefined ? o.value : o}>{o.label || o}</option>; })}</select>
    : <input type={p.type || "text"} placeholder={p.placeholder || ""} value={p.value} onChange={p.onChange} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />}
  </div>;
};

var Btn = function(p) { return <button onClick={p.onClick} style={Object.assign({ padding: "10px 18px", borderRadius: 10, border: p.outline ? "1px solid #E2E8F0" : "none", background: p.outline ? "#fff" : p.danger ? C.danger : "linear-gradient(135deg, " + C.accent + ", " + C.accentLight + ")", color: p.outline ? C.textLight : "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }, p.style || {})}>{p.children}</button>; };

// ===== LOGIN PAGE =====
var LoginPage = function(p) {
  var t = p.t;
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const [showPass, setShowPass] = useState(false);

  var handleLogin = function() {
    var found = p.users.find(function(u) { return u.username === user && u.password === pass && u.active; });
    if (found) { p.onLogin(found); setErr(false); }
    else { setErr(true); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, " + C.primaryDark + " 0%, " + C.primary + " 50%, " + C.primaryLight + " 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', 'Cairo', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, " + C.accent + ", " + C.accentLight + ")", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24, color: "#fff", boxShadow: "0 8px 24px rgba(232,168,56,0.4)", marginBottom: 16 }}>ARO</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.text }}>CRM ARO</h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: C.textLight }}>{t.login}</p>
        </div>
        {err && <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "10px 16px", borderRadius: 10, fontSize: 13, marginBottom: 16, textAlign: "center" }}>{t.loginError}</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>{t.username}</label>
          <input value={user} onChange={function(e) { setUser(e.target.value); }} placeholder="amgad" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 15, outline: "none", boxSizing: "border-box" }} onKeyDown={function(e) { if (e.key === "Enter") handleLogin(); }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.text }}>{t.password}</label>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} value={pass} onChange={function(e) { setPass(e.target.value); }} placeholder="******" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 15, outline: "none", boxSizing: "border-box" }} onKeyDown={function(e) { if (e.key === "Enter") handleLogin(); }} />
            <button onClick={function() { setShowPass(!showPass); }} style={{ position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textLight }}>{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </div>
        <button onClick={handleLogin} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, " + C.accent + ", " + C.accentLight + ")", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(232,168,56,0.3)" }}>{t.loginBtn}</button>
        <div style={{ marginTop: 24, background: "#F8FAFC", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textLight, marginBottom: 8 }}>Demo Accounts:</div>
          {p.users.map(function(u) { return <div key={u.id} style={{ fontSize: 12, color: C.text, marginBottom: 4 }}><b>{u.username}</b> / {u.password} - {u.title}</div>; })}
        </div>
      </div>
    </div>
  );
};

// ===== SIDEBAR =====
var Sidebar = function(p) {
  var t = p.t; var isAdmin = p.currentUser.role === "admin" || p.currentUser.role === "manager";
  var items = [
    { id: "dashboard", icon: Home, label: t.dashboard, show: true },
    { id: "leads", icon: Users, label: t.leads, show: true },
    { id: "deals", icon: Briefcase, label: t.deals, show: true },
    { id: "projects", icon: Building, label: t.projects, show: true },
    { id: "tasks", icon: CheckCircle, label: t.tasks, show: true },
    { id: "reports", icon: BarChart3, label: t.reports, show: isAdmin },
    { id: "team", icon: UserPlus, label: t.team, show: isAdmin },
    { id: "users", icon: Lock, label: t.users, show: isAdmin },
    { id: "channels", icon: Globe, label: t.channels, show: isAdmin },
    { id: "units", icon: Layers, label: t.units, show: true },
    { id: "settings", icon: Settings, label: t.settings, show: isAdmin },
  ].filter(function(i) { return i.show; });

  return (
    <div style={{ width: 240, height: "100vh", background: "linear-gradient(180deg, " + C.primaryDark + " 0%, " + C.primary + " 100%)", display: "flex", flexDirection: "column", position: "fixed", right: t.dir === "rtl" ? 0 : "auto", left: t.dir === "ltr" ? 0 : "auto", top: 0, zIndex: 100, boxShadow: "-4px 0 20px rgba(0,0,0,0.15)" }}>
      <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.1)", minHeight: 68 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, " + C.accent + ", " + C.accentLight + ")", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" }}>ARO</div>
        <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>CRM ARO</div><div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>Real Estate CRM</div></div>
      </div>
      <div style={{ flex: 1, padding: "10px 6px", overflowY: "auto" }}>
        {items.map(function(item) {
          var I = item.icon; var act = p.active === item.id;
          return <button key={item.id} onClick={function() { p.setActive(item.id); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: act ? "rgba(232,168,56,0.15)" : "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: act ? C.accent : "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: act ? 600 : 400, marginBottom: 1, textAlign: t.dir === "rtl" ? "right" : "left" }}><I size={18} /><span>{item.label}</span></button>;
        })}
      </div>
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{p.currentUser.name[0]}</div>
          <div><div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{p.currentUser.name}</div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{p.currentUser.title}</div></div>
        </div>
        <button onClick={p.onLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer" }}><LogOut size={14} /> {t.logout}</button>
      </div>
    </div>
  );
};

// ===== HEADER =====
var Header = function(p) {
  var t = p.t;
  var upcoming = p.leads.filter(function(l) { return l.callbackTime && l.status !== "DoneDeal" && l.status !== "NotInterested"; });
  return (
    <div style={{ height: 68, background: "#fff", borderBottom: "1px solid #E8ECF1", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{p.title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F1F5F9", borderRadius: 10, padding: "7px 14px", width: 220 }}>
          <Search size={15} color={C.textLight} /><input placeholder={t.search} style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: C.text, width: "100%" }} />
        </div>
        <button onClick={function() { p.setLang(p.lang === "ar" ? "en" : "ar"); }} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{p.lang === "ar" ? "EN" : "\u0639\u0631"}</button>
        <div style={{ position: "relative" }}>
          <button onClick={function() { p.setShowNotif(!p.showNotif); }} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #E8ECF1", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
            <Bell size={16} color={C.textLight} />
            {upcoming.length > 0 && <span style={{ position: "absolute", top: 3, right: 3, width: 16, height: 16, borderRadius: "50%", background: C.danger, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{upcoming.length}</span>}
          </button>
          {p.showNotif && <div style={{ position: "absolute", top: 45, right: 0, width: 300, background: "#fff", borderRadius: 12, boxShadow: "0 10px 40px rgba(0,0,0,0.15)", border: "1px solid #E8ECF1", zIndex: 100, maxHeight: 350, overflowY: "auto" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #F1F5F9", fontWeight: 700, fontSize: 13 }}>{t.callReminder} ({upcoming.length})</div>
            {upcoming.map(function(l) { return <div key={l.id} style={{ padding: "10px 14px", borderBottom: "1px solid #F8FAFC", display: "flex", alignItems: "center", gap: 8 }}><Phone size={14} color={C.accent} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{l.name}</div><div style={{ fontSize: 11, color: C.textLight }}>{l.callbackTime ? l.callbackTime.replace("T", " ") : ""}</div></div></div>; })}
          </div>}
        </div>
      </div>
    </div>
  );
};

// ===== DASHBOARD =====
var DashboardPage = function(p) {
  var t = p.t; var leads = p.leads; var sc = getStatuses(t);
  var isAdmin = p.currentUser.role === "admin" || p.currentUser.role === "manager";
  var myLeads = isAdmin ? leads : leads.filter(function(l) { return l.agentId === p.currentUser.id; });

  return <div style={{ padding: 24 }}>
    <div style={{ fontSize: 16, color: C.textLight, marginBottom: 20 }}>{t.welcome}, <b style={{ color: C.text }}>{p.currentUser.name}</b></div>
    <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
      <StatCard icon={Users} label={isAdmin ? t.allLeads : t.myLeads} value={myLeads.length + ""} c={C.info} onClick={function() { p.nav("leads"); }} />
      <StatCard icon={Target} label={t.newLeads} value={myLeads.filter(function(l) { return l.status === "Potential"; }).length + ""} c={C.success} onClick={function() { p.nav("leads"); p.setFilter("Potential"); }} />
      <StatCard icon={Briefcase} label={t.activeDeals} value={myLeads.filter(function(l) { return l.status === "HotCase" || l.status === "CallBack" || l.status === "MeetingDone"; }).length + ""} c={C.accent} onClick={function() { p.nav("leads"); p.setFilter("HotCase"); }} />
      <StatCard icon={DollarSign} label={t.doneDeals} value={myLeads.filter(function(l) { return l.status === "DoneDeal"; }).length + ""} c={C.primary} onClick={function() { p.nav("deals"); }} />
    </div>
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <Card style={{ flex: 2, minWidth: 280 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>{t.leadsByStatus}</h3>
        {sc.map(function(s) {
          var cnt = myLeads.filter(function(l) { return l.status === s.value; }).length;
          var pct = myLeads.length > 0 ? Math.round(cnt / myLeads.length * 100) : 0;
          return <div key={s.value} style={{ marginBottom: 12, cursor: "pointer" }} onClick={function() { p.nav("leads"); p.setFilter(s.value); }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 500 }}>{s.label}</span><span style={{ fontSize: 12, color: C.textLight }}>{cnt}</span></div>
            <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3 }}><div style={{ height: "100%", width: pct + "%", background: s.color, borderRadius: 3, transition: "width 0.5s" }} /></div>
          </div>;
        })}
      </Card>
      <Card style={{ flex: 1, minWidth: 260 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>{t.todayActivities}</h3>
        {p.activities.slice(0, 5).map(function(a) {
          var u = p.users.find(function(x) { return x.id === a.userId; });
          var l = leads.find(function(x) { return x.id === a.leadId; });
          return <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #F8FAFC" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: a.type === "call" ? C.success + "15" : C.info + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>{a.type === "call" ? <Phone size={12} color={C.success} /> : <Calendar size={12} color={C.info} />}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 600 }}>{u ? u.name : ""} - {l ? l.name : ""}</div><div style={{ fontSize: 10, color: C.textLight }}>{a.note}</div></div>
          </div>;
        })}
      </Card>
    </div>
  </div>;
};

// ===== LEADS PAGE =====
var LeadsPage = function(p) {
  var t = p.t; var sc = getStatuses(t);
  var isAdmin = p.currentUser.role === "admin" || p.currentUser.role === "manager";
  var salesUsers = p.users.filter(function(u) { return u.role === "sales" && u.active; });
  var visibleLeads = isAdmin ? p.leads : p.leads.filter(function(l) { return l.agentId === p.currentUser.id; });
  var filtered = p.leadFilter === "all" ? visibleLeads : visibleLeads.filter(function(l) { return l.status === p.leadFilter; });

  const [showAdd, setShowAdd] = useState(false);
  const [statusDrop, setStatusDrop] = useState(null);
  const [selected, setSelected] = useState(null);
  const [newL, setNewL] = useState({ name: "", phone: "", email: "", budget: "", project: projectsList[0].name, source: "Facebook", agentId: salesUsers[0] ? salesUsers[0].id : p.currentUser.id, callbackTime: "", notes: "" });

  var getAgent = function(id) { var u = p.users.find(function(x) { return x.id === id; }); return u ? u.name : "-"; };

  var updateStatus = function(id, st) {
    p.setLeads(function(prev) { return prev.map(function(l) { return l.id === id ? Object.assign({}, l, { status: st, lastActivityTime: now() }) : l; }); });
    p.addAct({ type: "status", leadId: id, userId: p.currentUser.id, note: st });
    setStatusDrop(null);
    if (selected && selected.id === id) setSelected(Object.assign({}, selected, { status: st, lastActivityTime: now() }));
  };

  var addLead = function() {
    if (!newL.name || !newL.phone) return;
    p.setLeads(function(prev) { return [Object.assign({ id: Date.now(), status: "Potential", date: new Date().toISOString().split("T")[0], lastActivityTime: now(), agentId: Number(newL.agentId) }, newL)].concat(prev); });
    setShowAdd(false);
    setNewL({ name: "", phone: "", email: "", budget: "", project: projectsList[0].name, source: "Facebook", agentId: salesUsers[0] ? salesUsers[0].id : p.currentUser.id, callbackTime: "", notes: "" });
  };

  return <div style={{ padding: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {[{ v: "all", l: t.all }].concat(sc.map(function(s) { return { v: s.value, l: s.label }; })).map(function(s) {
          var cnt = s.v === "all" ? visibleLeads.length : visibleLeads.filter(function(l) { return l.status === s.v; }).length;
          return <button key={s.v} onClick={function() { p.setFilter(s.v); }} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid", borderColor: p.leadFilter === s.v ? C.accent : "#E8ECF1", background: p.leadFilter === s.v ? C.accent + "12" : "#fff", color: p.leadFilter === s.v ? C.accent : C.textLight, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>{s.l} ({cnt})</button>;
        })}
      </div>
      <Btn onClick={function() { setShowAdd(true); }} style={{ padding: "8px 16px", fontSize: 13 }}><Plus size={14} /> {t.addLead}</Btn>
    </div>

    <div style={{ display: "flex", gap: 16 }}>
      <Card style={{ flex: selected ? 2 : 1, overflow: "auto" }} p={0}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E8ECF1" }}>
            {[t.name, t.phone, t.project, t.status, t.source, isAdmin ? t.agent : null, t.lastActivity, t.callbackTime].filter(Boolean).map(function(h) { return <th key={h} style={{ textAlign: t.dir === "rtl" ? "right" : "left", padding: "10px", fontSize: 11, fontWeight: 600, color: C.textLight }}>{h}</th>; })}
          </tr></thead>
          <tbody>
            {filtered.map(function(lead) {
              var so = sc.find(function(s) { return s.value === lead.status; }) || sc[0];
              return <tr key={lead.id} onClick={function() { setSelected(lead); }} style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", background: selected && selected.id === lead.id ? "#F0F7FF" : "transparent" }}>
                <td style={{ padding: "10px" }}><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{lead.name}</div><div style={{ fontSize: 10, color: C.textLight }}>{lead.email}</div></td>
                <td style={{ padding: "10px", fontSize: 12, direction: "ltr" }}>{lead.phone}</td>
                <td style={{ padding: "10px", fontSize: 12, color: C.textLight }}>{lead.project}</td>
                <td style={{ padding: "10px", position: "relative" }}>
                  <Badge bg={so.bg} color={so.color} dashed onClick={function(e) { e.stopPropagation(); setStatusDrop(statusDrop === lead.id ? null : lead.id); }}>{so.label} {"\u25BC"}</Badge>
                  {statusDrop === lead.id && <div style={{ position: "absolute", top: "100%", zIndex: 100, background: "#fff", borderRadius: 10, padding: 6, minWidth: 150, boxShadow: "0 10px 40px rgba(0,0,0,0.15)", border: "1px solid #E8ECF1" }}>
                    {sc.map(function(s) { return <div key={s.value} onClick={function(e) { e.stopPropagation(); updateStatus(lead.id, s.value); }} style={{ padding: "7px 10px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, background: lead.status === s.value ? s.bg : "transparent", fontSize: 12 }} onMouseEnter={function(e) { if (lead.status !== s.value) e.currentTarget.style.background = "#F8FAFC"; }} onMouseLeave={function(e) { if (lead.status !== s.value) e.currentTarget.style.background = "transparent"; }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />{s.label}</div>; })}
                  </div>}
                </td>
                <td style={{ padding: "10px", fontSize: 12, color: C.textLight }}>{lead.source}</td>
                {isAdmin && <td style={{ padding: "10px", fontSize: 12, color: C.textLight }}>{getAgent(lead.agentId)}</td>}
                <td style={{ padding: "10px", fontSize: 11, color: C.accent }}>{timeAgo(lead.lastActivityTime, t)}</td>
                <td style={{ padding: "10px", fontSize: 11, color: lead.callbackTime ? C.warning : C.textLight }}>{lead.callbackTime ? lead.callbackTime.replace("T", " ") : "-"}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </Card>

      {selected && <Card style={{ flex: 1, minWidth: 300 }} p={0}>
        <div style={{ background: "linear-gradient(135deg, " + C.primary + ", " + C.primaryLight + ")", padding: 18, position: "relative" }}>
          <button onClick={function() { setSelected(null); }} style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><X size={12} /></button>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{selected.name}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 3 }}>{selected.phone} - {selected.project}</div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 14, padding: 10, background: "#F8FAFC", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: C.textLight, marginBottom: 6 }}>{t.changeStatus}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {sc.map(function(s) { return <button key={s.value} onClick={function() { updateStatus(selected.id, s.value); }} style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid", borderColor: selected.status === s.value ? s.color : "#E2E8F0", background: selected.status === s.value ? s.bg : "#fff", color: selected.status === s.value ? s.color : C.textLight, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{s.label}</button>; })}
            </div>
          </div>
          {isAdmin && <div style={{ marginBottom: 14, padding: 10, background: "#F8FAFC", borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: C.textLight, marginBottom: 6 }}>{t.assignTo}</div>
            <select value={selected.agentId} onChange={function(e) { var nid = Number(e.target.value); p.setLeads(function(prev) { return prev.map(function(l) { return l.id === selected.id ? Object.assign({}, l, { agentId: nid, lastActivityTime: now() }) : l; }); }); setSelected(Object.assign({}, selected, { agentId: nid })); }} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1px solid #E2E8F0", fontSize: 12, background: "#fff" }}>
              {salesUsers.map(function(u) { return <option key={u.id} value={u.id}>{u.name} - {u.title}</option>; })}
            </select>
          </div>}
          {[{ l: t.budget, v: selected.budget }, { l: t.source, v: selected.source }, { l: t.agent, v: getAgent(selected.agentId) }, { l: t.callbackTime, v: selected.callbackTime ? selected.callbackTime.replace("T", " ") : "-" }, { l: t.lastActivity, v: timeAgo(selected.lastActivityTime, t) }, { l: t.notes, v: selected.notes }].map(function(f) { return <div key={f.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}><span style={{ fontSize: 12, color: C.textLight }}>{f.l}</span><span style={{ fontSize: 12, fontWeight: 500, maxWidth: "55%" }}>{f.v}</span></div>; })}
        </div>
      </Card>}
    </div>

    <Modal show={showAdd} onClose={function() { setShowAdd(false); }} title={t.addLead}>
      <Inp label={t.name} value={newL.name} onChange={function(e) { setNewL(Object.assign({}, newL, { name: e.target.value })); }} />
      <Inp label={t.phone} value={newL.phone} onChange={function(e) { setNewL(Object.assign({}, newL, { phone: e.target.value })); }} placeholder="01xxxxxxxxx" />
      <Inp label={t.email} value={newL.email} onChange={function(e) { setNewL(Object.assign({}, newL, { email: e.target.value })); }} />
      <Inp label={t.budget} value={newL.budget} onChange={function(e) { setNewL(Object.assign({}, newL, { budget: e.target.value })); }} />
      <Inp label={t.project} type="select" value={newL.project} onChange={function(e) { setNewL(Object.assign({}, newL, { project: e.target.value })); }} options={projectsList.map(function(pr) { return { value: pr.name, label: pr.name }; })} />
      <Inp label={t.source} type="select" value={newL.source} onChange={function(e) { setNewL(Object.assign({}, newL, { source: e.target.value })); }} options={channels.map(function(c) { return { value: c.name, label: c.name }; })} />
      {isAdmin && <Inp label={t.agent} type="select" value={newL.agentId} onChange={function(e) { setNewL(Object.assign({}, newL, { agentId: Number(e.target.value) })); }} options={salesUsers.map(function(u) { return { value: u.id, label: u.name + " - " + u.title }; })} />}
      <Inp label={t.callbackTime} type="datetime-local" value={newL.callbackTime} onChange={function(e) { setNewL(Object.assign({}, newL, { callbackTime: e.target.value })); }} />
      <Inp label={t.notes} value={newL.notes} onChange={function(e) { setNewL(Object.assign({}, newL, { notes: e.target.value })); }} />
      <div style={{ display: "flex", gap: 10 }}><Btn outline onClick={function() { setShowAdd(false); }} style={{ flex: 1 }}>{t.cancel}</Btn><Btn onClick={addLead} style={{ flex: 1 }}>{t.add}</Btn></div>
    </Modal>
  </div>;
};

// ===== DEALS =====
var DealsPage = function(p) {
  var t = p.t; var isAdmin = p.currentUser.role === "admin" || p.currentUser.role === "manager";
  var deals = p.leads.filter(function(l) { return l.status === "DoneDeal"; });
  if (!isAdmin) deals = deals.filter(function(l) { return l.agentId === p.currentUser.id; });
  var getAgent = function(id) { var u = p.users.find(function(x) { return x.id === id; }); return u ? u.name : "-"; };

  return <div style={{ padding: 24 }}>
    <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>{t.deals} ({deals.length})</h2>
    <Card p={0}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E8ECF1" }}>
          {[t.name, t.phone, t.project, t.budget, isAdmin ? t.agent : null, t.source].filter(Boolean).map(function(h) { return <th key={h} style={{ textAlign: t.dir === "rtl" ? "right" : "left", padding: "12px", fontSize: 11, fontWeight: 600, color: C.textLight }}>{h}</th>; })}
        </tr></thead>
        <tbody>
          {deals.map(function(d) { return <tr key={d.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
            <td style={{ padding: "12px", fontSize: 13, fontWeight: 600 }}>{d.name}</td>
            <td style={{ padding: "12px", fontSize: 12, direction: "ltr" }}>{d.phone}</td>
            <td style={{ padding: "12px", fontSize: 12, color: C.textLight }}>{d.project}</td>
            <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: C.success }}>{d.budget}</td>
            {isAdmin && <td style={{ padding: "12px", fontSize: 12 }}>{getAgent(d.agentId)}</td>}
            <td style={{ padding: "12px", fontSize: 12, color: C.textLight }}>{d.source}</td>
          </tr>; })}
        </tbody>
      </table>
      {deals.length === 0 && <div style={{ padding: 30, textAlign: "center", color: C.textLight }}>No deals yet</div>}
    </Card>
  </div>;
};

// ===== TASKS =====
var TasksPage = function(p) {
  var t = p.t;
  const [tasks, setTasks] = useState(mkTasks);
  const [showAdd, setShowAdd] = useState(false);
  const [newT, setNewT] = useState({ title: "", type: "call", time: "", leadId: 0, userId: p.currentUser.id });
  var isAdmin = p.currentUser.role === "admin" || p.currentUser.role === "manager";
  var myTasks = isAdmin ? tasks : tasks.filter(function(tk) { return tk.userId === p.currentUser.id; });

  var addTask = function() {
    if (!newT.title) return;
    setTasks(function(prev) { return [Object.assign({ id: Date.now(), done: false }, newT)].concat(prev); });
    setShowAdd(false); setNewT({ title: "", type: "call", time: "", leadId: 0, userId: p.currentUser.id });
  };

  return <div style={{ padding: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t.tasks} ({myTasks.filter(function(tk) { return !tk.done; }).length} {t.pending})</h2>
      <Btn onClick={function() { setShowAdd(true); }} style={{ padding: "8px 16px", fontSize: 13 }}><Plus size={14} /> {t.addTask}</Btn>
    </div>
    {myTasks.map(function(tk) {
      var lead = p.leads.find(function(l) { return l.id === tk.leadId; });
      var user = p.users.find(function(u) { return u.id === tk.userId; });
      return <div key={tk.id} style={{ background: "#fff", borderRadius: 10, padding: 14, marginBottom: 8, border: "1px solid #E8ECF1", display: "flex", alignItems: "center", gap: 12, opacity: tk.done ? 0.5 : 1 }}>
        <div onClick={function() { setTasks(function(prev) { return prev.map(function(x) { return x.id === tk.id ? Object.assign({}, x, { done: !x.done }) : x; }); }); }} style={{ width: 22, height: 22, borderRadius: 6, border: tk.done ? "none" : "2px solid #CBD5E1", background: tk.done ? C.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>{tk.done && <CheckCircle size={12} color="#fff" />}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, textDecoration: tk.done ? "line-through" : "none" }}>{tk.title}</div><div style={{ fontSize: 11, color: C.textLight, marginTop: 3 }}>{lead ? lead.name : ""} {isAdmin && user ? "(" + user.name + ")" : ""} - {tk.time}</div></div>
        <Badge bg={tk.type === "call" ? "#DCFCE7" : tk.type === "meeting" ? "#DBEAFE" : "#FEF3C7"} color={tk.type === "call" ? "#15803D" : tk.type === "meeting" ? "#1D4ED8" : "#B45309"}>{tk.type}</Badge>
      </div>;
    })}
    <Modal show={showAdd} onClose={function() { setShowAdd(false); }} title={t.addTask}>
      <Inp label={t.taskTitle} value={newT.title} onChange={function(e) { setNewT(Object.assign({}, newT, { title: e.target.value })); }} />
      <Inp label={t.taskType} type="select" value={newT.type} onChange={function(e) { setNewT(Object.assign({}, newT, { type: e.target.value })); }} options={["call", "meeting", "email", "followup"]} />
      <Inp label={t.taskTime} value={newT.time} onChange={function(e) { setNewT(Object.assign({}, newT, { time: e.target.value })); }} placeholder="10:00 AM" />
      <Inp label={t.relatedLead} type="select" value={newT.leadId} onChange={function(e) { setNewT(Object.assign({}, newT, { leadId: Number(e.target.value) })); }} options={[{ value: 0, label: "-" }].concat(p.leads.map(function(l) { return { value: l.id, label: l.name }; }))} />
      <div style={{ display: "flex", gap: 10 }}><Btn outline onClick={function() { setShowAdd(false); }} style={{ flex: 1 }}>{t.cancel}</Btn><Btn onClick={addTask} style={{ flex: 1 }}>{t.add}</Btn></div>
    </Modal>
  </div>;
};

// ===== USERS PAGE (Admin only) =====
var UsersPage = function(p) {
  var t = p.t;
  const [showAdd, setShowAdd] = useState(false);
  const [nU, setNU] = useState({ name: "", username: "", password: "sales123", email: "", phone: "", role: "sales", title: "" });
  var roleLabels = { admin: t.admin, manager: t.salesManager, sales: t.salesAgent, viewer: t.viewer };
  var roleColors = { admin: "#EF4444", manager: "#8B5CF6", sales: "#3B82F6", viewer: "#94A3B8" };

  var addUser = function() {
    if (!nU.name || !nU.username) return;
    p.setUsers(function(prev) { return prev.concat([Object.assign({ id: Date.now(), active: true }, nU)]); });
    setShowAdd(false); setNU({ name: "", username: "", password: "sales123", email: "", phone: "", role: "sales", title: "" });
  };

  return <div style={{ padding: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t.users} ({p.users.length})</h2>
      <Btn onClick={function() { setShowAdd(true); }} style={{ padding: "8px 16px", fontSize: 13 }}><UserPlus size={14} /> {t.addUser}</Btn>
    </div>
    <Card p={0}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E8ECF1" }}>
          {[t.name, t.username, t.title, t.role, t.phone, t.password, t.status, ""].map(function(h) { return <th key={h || "a"} style={{ textAlign: t.dir === "rtl" ? "right" : "left", padding: "12px", fontSize: 11, fontWeight: 600, color: C.textLight }}>{h}</th>; })}
        </tr></thead>
        <tbody>{p.users.map(function(u) {
          return <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
            <td style={{ padding: "12px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: C.primary + "15", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: C.primary }}>{u.name[0]}</div><div><div style={{ fontSize: 12, fontWeight: 600 }}>{u.name}</div><div style={{ fontSize: 10, color: C.textLight }}>{u.email}</div></div></div></td>
            <td style={{ padding: "12px", fontSize: 12, fontFamily: "monospace" }}>{u.username}</td>
            <td style={{ padding: "12px", fontSize: 12 }}>{u.title}</td>
            <td style={{ padding: "12px" }}><Badge bg={roleColors[u.role] + "15"} color={roleColors[u.role]}>{roleLabels[u.role]}</Badge></td>
            <td style={{ padding: "12px", fontSize: 12, direction: "ltr" }}>{u.phone}</td>
            <td style={{ padding: "12px", fontSize: 12, fontFamily: "monospace", color: C.textLight }}>{u.password}</td>
            <td style={{ padding: "12px" }}><Badge bg={u.active ? "#DCFCE7" : "#FEE2E2"} color={u.active ? "#15803D" : "#B91C1C"} onClick={function() { p.setUsers(function(prev) { return prev.map(function(x) { return x.id === u.id ? Object.assign({}, x, { active: !x.active }) : x; }); }); }}>{u.active ? t.active : t.inactive}</Badge></td>
            <td style={{ padding: "12px" }}><button onClick={function() { if (u.role !== "admin") p.setUsers(function(prev) { return prev.filter(function(x) { return x.id !== u.id; }); }); }} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} color={C.danger} /></button></td>
          </tr>;
        })}</tbody>
      </table>
    </Card>
    <Modal show={showAdd} onClose={function() { setShowAdd(false); }} title={t.addUser}>
      <Inp label={t.name} value={nU.name} onChange={function(e) { setNU(Object.assign({}, nU, { name: e.target.value })); }} />
      <Inp label={t.username} value={nU.username} onChange={function(e) { setNU(Object.assign({}, nU, { username: e.target.value })); }} />
      <Inp label={t.password} value={nU.password} onChange={function(e) { setNU(Object.assign({}, nU, { password: e.target.value })); }} />
      <Inp label={t.title} value={nU.title} onChange={function(e) { setNU(Object.assign({}, nU, { title: e.target.value })); }} placeholder="Sales Executive" />
      <Inp label={t.email} value={nU.email} onChange={function(e) { setNU(Object.assign({}, nU, { email: e.target.value })); }} />
      <Inp label={t.phone} value={nU.phone} onChange={function(e) { setNU(Object.assign({}, nU, { phone: e.target.value })); }} />
      <Inp label={t.role} type="select" value={nU.role} onChange={function(e) { setNU(Object.assign({}, nU, { role: e.target.value })); }} options={[{ value: "admin", label: t.admin }, { value: "manager", label: t.salesManager }, { value: "sales", label: t.salesAgent }, { value: "viewer", label: t.viewer }]} />
      <div style={{ display: "flex", gap: 10 }}><Btn outline onClick={function() { setShowAdd(false); }} style={{ flex: 1 }}>{t.cancel}</Btn><Btn onClick={addUser} style={{ flex: 1 }}>{t.add}</Btn></div>
    </Modal>
  </div>;
};

// ===== TEAM PAGE =====
var TeamPage = function(p) {
  var t = p.t;
  var sales = p.users.filter(function(u) { return u.role === "sales"; });
  return <div style={{ padding: 24 }}>
    <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>{t.team}</h2>
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {sales.map(function(a) {
        var al = p.leads.filter(function(l) { return l.agentId === a.id; });
        var deals = al.filter(function(l) { return l.status === "DoneDeal"; }).length;
        var calls = p.activities.filter(function(ac) { return ac.userId === a.id && ac.type === "call"; }).length;
        var meets = p.activities.filter(function(ac) { return ac.userId === a.id && ac.type === "meeting"; }).length;
        var fups = p.activities.filter(function(ac) { return ac.userId === a.id && ac.type === "followup"; }).length;
        return <Card key={a.id} style={{ flex: "1 1 280px", maxWidth: 380, overflow: "hidden" }} p={0}>
          <div style={{ background: "linear-gradient(135deg, " + C.primary + ", " + C.primaryLight + ")", padding: 20, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 10px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, border: "2px solid rgba(255,255,255,0.2)" }}>{a.name[0]}</div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>{a.name}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 3 }}>{a.title}</div>
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 14 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 700 }}>{al.length}</div><div style={{ fontSize: 10, color: C.textLight }}>{t.leads}</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 700, color: C.success }}>{deals}</div><div style={{ fontSize: 10, color: C.textLight }}>{t.deals}</div></div>
            </div>
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{t.todayActivities}</div>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 700, color: C.success }}>{calls}</div><div style={{ fontSize: 10, color: C.textLight }}>{t.calls}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 700, color: C.info }}>{meets}</div><div style={{ fontSize: 10, color: C.textLight }}>{t.meetings}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>{fups}</div><div style={{ fontSize: 10, color: C.textLight }}>{t.followups}</div></div>
              </div>
            </div>
          </div>
        </Card>;
      })}
    </div>
  </div>;
};

// ===== CHANNELS, REPORTS, PROJECTS, UNITS, SETTINGS (compact) =====
var ChannelsPage = function(p) {
  var t = p.t;
  const [cs, setCs] = useState({ facebook: true, instagram: true, tiktok: false, whatsapp: true, google: true });
  return <div style={{ padding: 24 }}>
    <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>{t.channels}</h2>
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {channels.map(function(ch) {
        var on = cs[ch.id]; var cnt = p.leads.filter(function(l) { return l.source === ch.name; }).length;
        return <Card key={ch.id} style={{ flex: "1 1 260px", maxWidth: 350 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: ch.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{ch.icon}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700 }}>{ch.name}</div><div style={{ fontSize: 11, color: C.textLight }}>{cnt} leads</div></div>
            <Badge bg={on ? "#DCFCE7" : "#FEE2E2"} color={on ? "#15803D" : "#B91C1C"}>{on ? t.connected : t.disconnected}</Badge>
          </div>
          <button onClick={function() { setCs(function(prev) { var n = {}; n[ch.id] = !prev[ch.id]; return Object.assign({}, prev, n); }); }} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid " + (on ? C.danger : C.success), background: on ? C.danger + "08" : C.success + "08", color: on ? C.danger : C.success, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{on ? "Disconnect" : "Connect"}</button>
        </Card>;
      })}
    </div>
  </div>;
};

var ReportsPage = function(p) {
  var t = p.t; var sc = getStatuses(t);
  var sales = p.users.filter(function(u) { return u.role === "sales"; });
  return <div style={{ padding: 24 }}>
    <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>{t.reports}</h2>
    <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
      <StatCard icon={TrendingUp} label={t.conversionRate} value={p.leads.length > 0 ? Math.round(p.leads.filter(function(l) { return l.status === "DoneDeal"; }).length / p.leads.length * 100) + "%" : "0%"} c={C.success} />
      <StatCard icon={Activity} label={t.totalCalls} value={p.activities.filter(function(a) { return a.type === "call"; }).length + ""} c={C.info} />
      <StatCard icon={DollarSign} label={t.doneDeals} value={p.leads.filter(function(l) { return l.status === "DoneDeal"; }).length + ""} c={C.accent} />
    </div>
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <Card style={{ flex: 1, minWidth: 320 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>{t.agentPerf}</h3>
        {sales.map(function(a) {
          var al = p.leads.filter(function(l) { return l.agentId === a.id; });
          var d = al.filter(function(l) { return l.status === "DoneDeal"; }).length;
          var cl = p.activities.filter(function(ac) { return ac.userId === a.id && ac.type === "call"; }).length;
          return <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primary + "15", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: C.primary }}>{a.name[0]}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 10, color: C.textLight }}>{a.title}</div></div>
            <div style={{ textAlign: "center", minWidth: 40 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{al.length}</div><div style={{ fontSize: 9, color: C.textLight }}>{t.leads}</div></div>
            <div style={{ textAlign: "center", minWidth: 40 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.success }}>{d}</div><div style={{ fontSize: 9, color: C.textLight }}>{t.deals}</div></div>
            <div style={{ textAlign: "center", minWidth: 40 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.info }}>{cl}</div><div style={{ fontSize: 9, color: C.textLight }}>{t.calls}</div></div>
          </div>;
        })}
      </Card>
      <Card style={{ flex: 1, minWidth: 320 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>{t.sourcePerf}</h3>
        {channels.map(function(ch) {
          var cnt = p.leads.filter(function(l) { return l.source === ch.name; }).length;
          var won = p.leads.filter(function(l) { return l.source === ch.name && l.status === "DoneDeal"; }).length;
          return <div key={ch.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: 18 }}>{ch.icon}</span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{ch.name}</span>
            <div style={{ textAlign: "center", minWidth: 40 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{cnt}</div><div style={{ fontSize: 9, color: C.textLight }}>{t.leads}</div></div>
            <div style={{ textAlign: "center", minWidth: 40 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.success }}>{won}</div><div style={{ fontSize: 9, color: C.textLight }}>{t.deals}</div></div>
          </div>;
        })}
      </Card>
    </div>
  </div>;
};

var ProjectsPage = function(p) {
  var t = p.t;
  return <div style={{ padding: 24 }}>
    <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>{t.projects}</h2>
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {projectsList.map(function(pr) { return <Card key={pr.id} style={{ flex: "1 1 280px", maxWidth: 380 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>{pr.name}</h3>
        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 14 }}>{pr.developer} - {pr.location}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700 }}>{pr.units}</div><div style={{ fontSize: 10, color: C.textLight }}>{t.units}</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, color: C.success }}>{pr.sold}</div><div style={{ fontSize: 10, color: C.textLight }}>{t.sold}</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 700, color: C.warning }}>{pr.units - pr.sold}</div><div style={{ fontSize: 10, color: C.textLight }}>{t.available}</div></div>
        </div>
        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3 }}><div style={{ height: "100%", width: Math.round(pr.sold / pr.units * 100) + "%", background: C.success, borderRadius: 3 }} /></div>
      </Card>; })}
    </div>
  </div>;
};

var UnitsPage = function(p) {
  var t = p.t;
  var units = [
    { id: 1, code: "NAC-101", type: "\u0634\u0642\u0629", area: 150, price: "2.5M", project: projectsList[0].name, status: "available" },
    { id: 2, code: "NAC-202", type: "\u062f\u0648\u0628\u0644\u0643\u0633", area: 220, price: "3.8M", project: projectsList[0].name, status: "reserved" },
    { id: 3, code: "MFC-305", type: "\u062a\u0627\u0648\u0646 \u0647\u0627\u0648\u0633", area: 280, price: "5.2M", project: projectsList[1].name, status: "available" },
    { id: 4, code: "NCC-101", type: "\u0641\u064a\u0644\u0627", area: 350, price: "8.5M", project: projectsList[2].name, status: "sold" },
  ];
  var sc = { available: { bg: "#DCFCE7", color: "#15803D", l: t.available }, reserved: { bg: "#FEF3C7", color: "#B45309", l: t.reserved }, sold: { bg: "#FEE2E2", color: "#B91C1C", l: t.sold } };
  return <div style={{ padding: 24 }}>
    <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>{t.units}</h2>
    <Card p={0}><table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E8ECF1" }}>
        {["Code", t.project, "Type", "Area", "Price", t.status].map(function(h) { return <th key={h} style={{ textAlign: t.dir === "rtl" ? "right" : "left", padding: "12px", fontSize: 11, fontWeight: 600, color: C.textLight }}>{h}</th>; })}
      </tr></thead>
      <tbody>{units.map(function(u) { var s = sc[u.status]; return <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9" }}><td style={{ padding: "12px", fontSize: 12, fontWeight: 600, color: C.primary }}>{u.code}</td><td style={{ padding: "12px", fontSize: 12, color: C.textLight }}>{u.project}</td><td style={{ padding: "12px", fontSize: 12 }}>{u.type}</td><td style={{ padding: "12px", fontSize: 12 }}>{u.area}m\u00B2</td><td style={{ padding: "12px", fontSize: 12, fontWeight: 600 }}>{u.price}</td><td style={{ padding: "12px" }}><Badge bg={s.bg} color={s.color}>{s.l}</Badge></td></tr>; })}</tbody>
    </table></Card>
  </div>;
};

var SettingsPage = function(p) {
  var t = p.t;
  return <div style={{ padding: 24 }}>
    <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700 }}>{t.settings}</h2>
    <Card style={{ maxWidth: 560 }}>
      <Inp label={t.companyName} value={"\u0634\u0631\u0643\u0629 ARO \u0627\u0644\u0639\u0642\u0627\u0631\u064a\u0629"} onChange={function() {}} />
      <Inp label={t.email} value="admin@aro.com" onChange={function() {}} />
      <Inp label={t.phone} value="01012345678" onChange={function() {}} />
      <Inp label={t.language} type="select" value={p.lang} onChange={function(e) { p.setLang(e.target.value); }} options={[{ value: "ar", label: "\u0639\u0631\u0628\u064a" }, { value: "en", label: "English" }]} />
      <Btn>{t.save}</Btn>
    </Card>
  </div>;
};

// ===== MAIN APP =====
export default function CRMApp() {
  const [lang, setLang] = useState("ar");
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [leads, setLeads] = useState(mkLeads);
  const [users, setUsers] = useState(mkUsers);
  const [activities, setActivities] = useState(mkActivities);
  const [leadFilter, setLeadFilter] = useState("all");
  const [showNotif, setShowNotif] = useState(false);

  var t = TR[lang];

  var addAct = function(act) { setActivities(function(prev) { return [Object.assign({ id: Date.now(), time: now() }, act)].concat(prev); }); };
  var nav = function(pg) { setPage(pg); };

  if (!currentUser) return <LoginPage t={t} users={users} onLogin={function(u) { setCurrentUser(u); }} />;

  var titles = { dashboard: t.dashboard, leads: t.leads, deals: t.deals, projects: t.projects, tasks: t.tasks, reports: t.reports, team: t.team, users: t.users, channels: t.channels, units: t.units, settings: t.settings };

  var props = { t: t, leads: leads, setLeads: setLeads, users: users, setUsers: setUsers, activities: activities, addAct: addAct, currentUser: currentUser, nav: nav, setFilter: setLeadFilter, leadFilter: leadFilter, lang: lang, setLang: setLang };

  var renderPage = function() {
    switch (page) {
      case "dashboard": return <DashboardPage {...props} />;
      case "leads": return <LeadsPage {...props} />;
      case "deals": return <DealsPage {...props} />;
      case "projects": return <ProjectsPage {...props} />;
      case "tasks": return <TasksPage {...props} />;
      case "reports": return <ReportsPage {...props} />;
      case "team": return <TeamPage {...props} />;
      case "users": return <UsersPage {...props} />;
      case "channels": return <ChannelsPage {...props} />;
      case "units": return <UnitsPage {...props} />;
      case "settings": return <SettingsPage {...props} />;
      default: return <DashboardPage {...props} />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', 'Cairo', Tahoma, sans-serif", direction: t.dir }}>
      <style>{"* { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; } input::placeholder { color: #94A3B8; } select { cursor: pointer; } table { direction: " + t.dir + "; }"}</style>
      <Sidebar active={page} setActive={setPage} t={t} currentUser={currentUser} onLogout={function() { setCurrentUser(null); }} />
      <div style={{ flex: 1, marginRight: t.dir === "rtl" ? 240 : 0, marginLeft: t.dir === "ltr" ? 240 : 0, minHeight: "100vh" }}>
        <Header title={titles[page]} t={t} leads={leads} lang={lang} setLang={setLang} showNotif={showNotif} setShowNotif={setShowNotif} />
        {renderPage()}
      </div>
    </div>
  );
}
