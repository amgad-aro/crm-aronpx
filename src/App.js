import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import {
  Search, Bell, Plus, Phone, Calendar, Building, Users, BarChart3,
  Settings, Home, Briefcase, Target, TrendingUp, UserPlus, CheckCircle,
  Activity, Layers, DollarSign, X, Lock, Globe, LogOut, Eye, EyeOff,
  Trash2, AlertCircle, Menu, Upload, MessageSquare, ChevronRight,
  ClipboardList, Edit, Archive, Award, Zap, RotateCcw, ExternalLink, KeyRound, FileSpreadsheet
} from "lucide-react";

/* ========== CRM ARO v7 — Complete Edition ========== */

const API = "https://crm-aro-backend-production.up.railway.app";

async function apiFetch(path, method, body, token, csrfToken) {
  var opts = { method: method || "GET", headers: { "Content-Type": "application/json" } };
  if (token) opts.headers["Authorization"] = "Bearer " + token;
  if (csrfToken && (method === "POST" || method === "PUT" || method === "DELETE")) {
    opts.headers["X-CSRF-Token"] = csrfToken;
  }
  if (body) opts.body = JSON.stringify(body);
  var res;
  try { res = await fetch(API + path, opts); } catch(netErr) { throw new Error("Connection error"); }
  var data;
  try { data = await res.json(); } catch(e) { data = {}; }
  if (res.status === 401) {
    try { localStorage.removeItem('crm_aro_session'); } catch(e) {}
    if (data && data.code === "deactivated") {
      try { alert("Your account has been deactivated. Please contact admin."); } catch(e){}
    }
    window.location.reload();
    return;
  }
  if (!res.ok) throw new Error(data.error || "API Error");
  return data;
}

// ===== TRANSLATIONS =====
var TR = {
  ar: {
    dir: "rtl",
    login: "تسجيل الدخول", loginBtn: "دخول", loginError: "Username أو كلمة المرور غلط",
    username: "Username", password: "Password", logout: "تسجيل خروج",
    dashboard: "الرئيسية", leads: "الLeads", deals: "الDeals", projects: "المشاريع",
    tasks: "المهام", reports: "التقارير", team: "فريق المبيعات", users: "Users",
    units: "الوحدات", settings: "الإعدادات", channels: "القنوات", dailyReq: "Daily Request",
    archive: "الArchive",
    search: "Search...",
    all: "الكل", totalLeads: "Total الLeads", newLeads: "جدد",
    activeDeals: "Deals نشطة", doneDeals: "تم البيع",
    addLead: "إضافة leads", addUser: "Add User", addTask: "إضافة مهمة", addRequest: "Add Number",
    name: "Name", phone: "Phone", phone2: "هاتف إضافي", email: "Email", budget: "Budget",
    project: "المشروع", source: "المصدر", agent: "Agent",
    status: "Status", cancel: "إلغاء", save: "حفظ", add: "إضافة", edit: "تعديل",
    callbackTime: "Callback", notes: "Notes",
    changeStatus: "Change Status", assignTo: "Assign To",
    lastActivity: "Last Activity", title: "Job Title", role: "Role",
    active: "نشط", inactive: "غير نشط",
    admin: "مدير نظام", salesManager: "مدير مبيعات", salesAgent: "موظف مبيعات", viewer: "مشاهد",
    potential: "Potential", hotCase: "Hot Case", callBack: "Call Back", notInterested: "Not Interested",
    noAnswer: "No Answer", doneDeal: "Done Deal", meetingDone: "Meeting Done",
    connected: "Online", disconnected: "غير Online",
    conversionRate: "معدل التحويل", totalCalls: "الCalls",
    todayActivities: "أنشطة Today", callReminder: "تنبيهات",
    available: "متاح", reserved: "محجوز", sold: "مباع",
    language: "اللغة", calls: "Calls", meetings: "اجتماعات", followups: "متابعات",
    taskTitle: "عنوان المهمة", taskType: "النوع", taskTime: "الوقت", relatedLead: "الleads",
    sourcePerf: "أداء المصادر", leadsByStatus: "الLeads حسب Status",
    agentPerf: "أداء Agentين", companyName: "اسم الشركة",
    welcome: "مرحباً", myLeads: "عملائي", allLeads: "كل الLeads",
    pending: "متبقية", ago: "منذ", minutes: "دقيقة", hours: "ساعة", days: "يوم", just: "الآن",
    loading: "Loading...", error: "خطأ في الاتصال", retry: "إعادة المحاولة",
    deleteConfirm: "هل أنت متأكد؟", archiveConfirm: "أرشفة الleads؟ يمكن استعادته لاحقاً",
    logActivity: "تسجيل نشاط",
    statusComment: "Reason for status change (required)", statusCommentPH: "Write a note about this change...",
    commentRequired: "⚠️ A note is required قبل Change Status",
    importExcel: "استيراد Excel", importDone: "تم الاستيراد", importErr: "خطأ — تأكد من الأعمدة: name, phone",
    activityLog: "سجل الأنشطة", clientHistory: "تاريخ الleads",
    duplicateFound: "⚠️ الرقم ده موجود بالفعل!", duplicateClient: "leads موجود بنفس الرقم",
    monthlyTarget: "Monthly Target", myDay: "يومي",
    salesDay:"مبيعات Today", salesWeek:"مبيعات This Week", salesMonth:"مبيعات This Month", dealsCount:"deal", newLeadsToday:"Leads جدد Today", bestAgent:"🏆 الأفضل هذا This Month", kpiTitle:"📊 KPIs — المبيعات",
    bulkReassign: "تحويل جماعي", selectAll: "تحديد الكل", reassignTo: "تحويل لـ",
    whatsapp: "واتساب", call: "اتصال",
    propertyType: "Property Type", area: "Location",
    totalRequests: "Total Numbers",
    restore: "استعادة",
    overdue: "متأخرون",
    noActivity: "No Activity +يوم",
    exportExcel: "تصدير Excel",
    vip: "VIP",
    markVip: "تمييز كـ VIP",
    removeVip: "إلغاء VIP",
    quickAdd: "إضافة سريعة",
    bulkWhatsApp: "واتساب جماعي",
    waTemplates: "رسائل جاهزة",
    sendWa: "إرسال واتساب",
    enableNotif: "تفعيل الإشعارات",
    notifEnabled: "✅ الإشعارات مفعلة",
    selectAll: "تحديد الكل",
    selected: "محدد",
    msgCopied: "✅ تم نسخ الرسالة",
    changePassword: "تغيير كلمة المرور",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "Confirm كلمة المرور الجديدة",
    passwordMismatch: "كلمتا المرور مش متطابقتين",
    passwordSuccess: "✅ تم تغيير كلمة المرور بنجاح",
    passwordError: "❌ خطأ في تغيير كلمة المرور",
  },
  en: {
    dir: "ltr",
    login: "Login", loginBtn: "Sign In", loginError: "Invalid username or password",
    username: "Username", password: "Password", logout: "Logout",
    dashboard: "Dashboard", leads: "Leads", deals: "Deals", projects: "Projects",
    tasks: "Tasks", reports: "Reports", team: "Sales Team", users: "Users",
    units: "Units", settings: "Settings", channels: "Channels", dailyReq: "Daily Request",
    archive: "Archive",
    search: "Search...",
    all: "All", totalLeads: "Total Leads", newLeads: "New",
    activeDeals: "Active Deals", doneDeals: "Done Deals",
    addLead: "Add Lead", addUser: "Add User", addTask: "Add Task", addRequest: "Add Number",
    name: "Name", phone: "Phone", phone2: "Alt. Phone", email: "Email", budget: "Budget",
    project: "Project", source: "Source", agent: "Agent",
    status: "Status", cancel: "Cancel", save: "Save", add: "Add", edit: "Edit",
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
    agentPerf: "Agent Performance", companyName: "Company Name",
    welcome: "Welcome", myLeads: "My Leads", allLeads: "All Leads",
    pending: "Pending", ago: "ago", minutes: "min", hours: "hr", days: "days", just: "Just now",
    loading: "Loading...", error: "Connection Error", retry: "Retry",
    deleteConfirm: "Are you sure?", archiveConfirm: "Archive this lead? Can be restored later.",
    logActivity: "Log Activity",
    statusComment: "Reason for status change (required)", statusCommentPH: "Write a note about this change...",
    commentRequired: "⚠️ You must write a note before changing status",
    importExcel: "Import Excel", importDone: "Import Done", importErr: "Error — Check columns: name, phone",
    activityLog: "Activity Log", clientHistory: "Client History",
    duplicateFound: "⚠️ This number already exists!", duplicateClient: "Existing client with same number",
    monthlyTarget: "Monthly Target", myDay: "My Day",
    salesDay:"Today's Deals", salesWeek:"This Week's Deals", salesMonth:"This Month's Deals", dealsCount:"deal(s)", newLeadsToday:"New Leads Today", bestAgent:"🏆 Top Performer", kpiTitle:"📊 KPIs — Deals",
    bulkReassign: "Bulk Reassign", selectAll: "Select All", reassignTo: "Reassign To",
    whatsapp: "WhatsApp", call: "Call",
    propertyType: "Property Type", area: "Location",
    totalRequests: "Total Numbers",
    restore: "Restore",
    overdue: "Overdue",
    noActivity: "No activity +1 day",
    exportExcel: "Export Excel",
    vip: "VIP",
    markVip: "Mark as VIP",
    removeVip: "Remove VIP",
    quickAdd: "Quick Add",
    bulkWhatsApp: "Bulk WhatsApp",
    waTemplates: "Message Templates",
    sendWa: "Send WhatsApp",
    enableNotif: "Enable Notifications",
    notifEnabled: "✅ Notifications Enabled",
    selectAll: "Select All",
    selected: "Selected",
    msgCopied: "✅ Message Copied",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    passwordMismatch: "Passwords do not match",
    passwordSuccess: "✅ Password changed successfully",
    passwordError: "❌ Error changing password",
  }
};

var C = {
  primary: "#1a2942", primaryLight: "#243752", primaryDark: "#0d1f33",
  accent: "#E8A838", accentLight: "#F5C563",
  success: "#22C55E", danger: "#EF4444", warning: "#F59E0B", info: "#3B82F6",
  bg: "#F0F2F5", text: "#1E293B", textLight: "#64748B", border: "#E2E8F0"
};

var STATUSES = function(t) { return [
  { value: "NewLead", label: "New Lead", bg: "#EEF2FF", color: "#6366F1" },
  { value: "Potential", label: "Potential", bg: "#E0F2FE", color: "#0284C7" },
  { value: "HotCase", label: t.hotCase, bg: "#FEE2E2", color: "#DC2626" },
  { value: "CallBack", label: t.callBack, bg: "#FEF3C7", color: "#B45309" },
  { value: "MeetingDone", label: t.meetingDone, bg: "#F3E8FF", color: "#7C3AED" },
  { value: "EOI", label: "EOI", bg: "#FFF7ED", color: "#EA580C" },
  { value: "NotInterested", label: t.notInterested, bg: "#F1F5F9", color: "#64748B" },
  { value: "NoAnswer", label: t.noAnswer, bg: "#E0E7FF", color: "#4338CA" },
  { value: "DoneDeal", label: t.doneDeal, bg: "#DCFCE7", color: "#15803D" },
  { value: "Deal Cancelled", label: "Deal Cancelled", bg: "#FEE2E2", color: "#B91C1C", adminOnly: true },
]; };

var DR_STATUSES = function(t) { return STATUSES(t).filter(function(s){return s.value!=="NewLead";}); };
// Filter out statuses flagged adminOnly (e.g. "Deal Cancelled") for non-admin users.
var visibleStatuses = function(list, role){ return (list||[]).filter(function(s){ return !s.adminOnly || role==="admin"; }); };

var PROJECTS = [
  "العاصمة الإدارية", "المستقبل سيتي", "التجمع الخامس", "الشروق", "6 أكتوبر",
  "بالم هيلز", "ماونتن فيو", "سوديك ايست", "الرحاب", "مدينتي"
];
var SOURCES = ["Facebook", "Instagram", "TikTok", "WhatsApp", "Google Ads", "Referral", "Snap Chat", "Website"];
var PROP_TYPES = ["Apartment","Duplex","Townhouse","Twinhouse","Standalone","Commercial","Admin","Clinic","Service Apartment","Chalet"];


// ===== AVATAR COLORS =====
var AVATAR_COLORS = ["#6366F1","#EC4899","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EF4444","#14B8A6","#F97316","#06B6D4"];
var avatarColor = function(name){ var i=0; if(name)for(var j=0;j<name.length;j++)i+=name.charCodeAt(j); return AVATAR_COLORS[i%AVATAR_COLORS.length]; };
var Avatar = function(p){
  var size=p.size||36;
  // `flat` makes the avatar match the sidebar footer style: rgba(255,255,255,0.1) bg, 10px radius, 11px weight-700 text.
  var flat = !!p.flat;
  var bg = flat ? "rgba(255,255,255,0.1)" : avatarColor(p.name);
  var radius = flat ? 10 : (p.round?"50%":Math.round(size*0.28));
  var fontSize = flat ? 11 : Math.round(size*0.38);
  return <div style={{ width:size, height:size, borderRadius:radius, background:bg, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:fontSize, flexShrink:0, position:"relative" }}>{p.name?(p.name[0]+( p.name.split(" ")[1]?p.name.split(" ")[1][0]:"")).toUpperCase():""}{p.online!==undefined&&<span style={{ position:"absolute", bottom:1, right:1, width:Math.round(size*0.28), height:Math.round(size*0.28), borderRadius:"50%", background:p.online?"#22C55E":"#94A3B8", border:"2px solid "+(flat?"rgba(28,30,40,0.95)":"#fff") }}/>}</div>;
};
var gid = function(o) { if(!o) return null; return String(o._id || o.id || ""); };

// Resolve the sales agents on `lead` that the caller (managerial role) is
// allowed to address via "Send to specific sales". Mirrors the backend
// canSendFeedbackToTarget rule:
//   admin/sales_admin → any sales agent with a slice on this lead
//   manager           → sales whose reportsTo is the manager OR a TL under them
//   team_leader       → sales whose reportsTo is the caller
// Returns [] for every other role / unsupported case.
var getEligibleSalesTargets = function(lead, cu, users) {
  if (!lead || !cu) return [];
  var role = cu.role;
  // sales_admin is read-only on feedback by design — never allowed to address.
  if (role !== "admin" && role !== "manager" && role !== "team_leader") return [];
  var sliceIds = ((lead.assignments || [])
    .map(function(a){ var aid = a && a.agentId && a.agentId._id ? a.agentId._id : (a && a.agentId); return String(aid || ""); })
    .filter(Boolean));
  var sliceSet = {}; sliceIds.forEach(function(id){ sliceSet[id] = true; });
  var sliceUsers = (users || []).filter(function(u){
    if (!u || !u.active || u.role !== "sales") return false;
    return !!sliceSet[String(gid(u))];
  });
  if (role === "admin") return sliceUsers;
  var cuId = String(cu.id || gid(cu));
  if (role === "team_leader") {
    return sliceUsers.filter(function(u){
      var rt = u.reportsTo && u.reportsTo._id ? u.reportsTo._id : u.reportsTo;
      return String(rt || "") === cuId;
    });
  }
  // manager: direct reports + sales under TLs that report to this manager
  var tlIdsUnderMe = (users || []).filter(function(u){
    if (!u || u.role !== "team_leader") return false;
    var rt = u.reportsTo && u.reportsTo._id ? u.reportsTo._id : u.reportsTo;
    return String(rt || "") === cuId;
  }).map(function(u){ return String(gid(u)); });
  var allowedRTs = {}; allowedRTs[cuId] = true;
  tlIdsUnderMe.forEach(function(id){ allowedRTs[id] = true; });
  return sliceUsers.filter(function(u){
    var rt = u.reportsTo && u.reportsTo._id ? u.reportsTo._id : u.reportsTo;
    return !!allowedRTs[String(rt || "")];
  });
};

// Inline feedback composer used by the StatusModal (when a managerial role
// is changing status) and by the standalone "Add Feedback" modal. Renders
// the visibility selector + targetAgentId dropdown above a textarea.
// For sales role: renders ONLY the textarea — same UI as before this feature.
// onChange receives ({ text, visibility, targetAgentId }) on every keystroke.
var FeedbackComposer = function(p) {
  var role = p.cu && p.cu.role;
  // sales_admin is excluded — read-only on feedback. They get the same plain
  // textarea sales sees here, but the parent page never sends a save through
  // this component for them (the "Add Feedback" button is hidden too).
  var isManagerial = role === "admin" || role === "manager" || role === "team_leader";
  // Team Leader on their own personal lead is treated as agent (no selector).
  var leadAgentId = p.lead && p.lead.agentId && p.lead.agentId._id ? p.lead.agentId._id : (p.lead && p.lead.agentId);
  var isOwnLead = role === "team_leader" && String(leadAgentId || "") === String(p.cu.id || gid(p.cu));
  var showSelector = isManagerial && !isOwnLead;
  var eligible = showSelector ? getEligibleSalesTargets(p.lead, p.cu, p.users || []) : [];
  var rows = p.rows || 3;
  var placeholder = p.placeholder || "";
  if (!showSelector) {
    return <textarea rows={rows} placeholder={placeholder} value={p.value && p.value.text || ""}
      onChange={function(e){ p.onChange({ text: e.target.value, visibility: "private", targetAgentId: "" }); }}
      style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}/>;
  }
  var v = p.value || { text:"", visibility:"private", targetAgentId:"" };
  var canSendToSales = eligible.length > 0;
  return <div>
    <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:8, padding:"8px 10px", background:"#F1F5F9", borderRadius:10, border:"1px solid #E2E8F0" }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#475569", textTransform:"uppercase", letterSpacing:"0.04em" }}>Visibility</div>
      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:C.text, cursor:"pointer" }}>
        <input type="radio" name={"vis-"+(p.id||"f")} checked={v.visibility==="private"}
          onChange={function(){ p.onChange({ text:v.text, visibility:"private", targetAgentId:"" }); }}/>
        <span><b>Just me</b> <span style={{ color:C.textLight, fontSize:11 }}>— private note, only you see it</span></span>
      </label>
      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:canSendToSales?C.text:C.textLight, cursor:canSendToSales?"pointer":"not-allowed" }}>
        <input type="radio" name={"vis-"+(p.id||"f")} checked={v.visibility==="to_sales"} disabled={!canSendToSales}
          onChange={function(){ p.onChange({ text:v.text, visibility:"to_sales", targetAgentId: v.targetAgentId || (eligible[0] ? String(gid(eligible[0])) : "") }); }}/>
        <span><b>Send to specific sales</b>{canSendToSales ? "" : <span style={{ color:C.textLight, fontSize:11 }}> — no eligible sales on this lead</span>}</span>
        {v.visibility==="to_sales" && canSendToSales && <select value={v.targetAgentId||""}
          onChange={function(e){ p.onChange({ text:v.text, visibility:"to_sales", targetAgentId:e.target.value }); }}
          style={{ marginLeft:8, padding:"4px 8px", borderRadius:7, border:"1px solid #CBD5E1", fontSize:12, background:"#fff" }}>
          {eligible.map(function(u){ return <option key={gid(u)} value={gid(u)}>{u.name}</option>; })}
        </select>}
      </label>
    </div>
    <textarea rows={rows} placeholder={placeholder} value={v.text}
      onChange={function(e){ p.onChange(Object.assign({}, v, { text: e.target.value })); }}
      style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}/>
  </div>;
};

// Returns the set of user IDs a team_leader is allowed to see data for —
// themselves plus active sales/team_leader users whose reportsTo points at
// them. Returns null for every other role; callers treat null as "no scope
// filter, pass data through". Used at the App root to scope leads, users,
// activities, and daily requests before they're handed to pages, so any
// out-of-team data that leaks past the backend (e.g. a WS broadcast — the
// server's per-client filter is sales-only, so team_leader sockets receive
// the unfiltered firehose) is dropped before pages render.
var getTeamScopeIds = function(currentUser, allUsers) {
  if (!currentUser || currentUser.role !== "team_leader") return null;
  var tlId = String(currentUser.id || currentUser._id || "");
  var ids = new Set([tlId]);
  (allUsers || []).forEach(function(u){
    if (!u || !u.active) return;
    if (u.role !== "sales" && u.role !== "team_leader") return;
    var rt = u.reportsTo && u.reportsTo._id ? String(u.reportsTo._id) : String(u.reportsTo || "");
    if (rt === tlId) ids.add(String(u._id));
  });
  return ids;
};

// WhatsApp chooser — shows popup to pick WhatsApp or WhatsApp Business
var WaChooser = function(p) {
  if(!p.show) return null;
  var phone = waPhone(p.phone);
  // Android intent URLs to open specific app
  var isAndroid = /android/i.test(navigator.userAgent);
  var waUrl = isAndroid
    ? "intent://send?phone=+"+phone+"#Intent;scheme=whatsapp;package=com.whatsapp;end"
    : "https://wa.me/"+phone;
  var waBizUrl = isAndroid
    ? "intent://send?phone=+"+phone+"#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end"
    : "https://wa.me/"+phone;
  return <div onClick={p.onClose} style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
    <div onClick={function(e){e.stopPropagation();}} style={{ background:"#fff", borderRadius:"18px 18px 0 0", padding:"20px 16px 32px", width:"100%", maxWidth:480 }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:16, textAlign:"center" }}>Open with WhatsApp</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <a href={waUrl} target="_blank" rel="noreferrer" onClick={p.onClose} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:12, background:"#DCFCE7", textDecoration:"none" }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#15803D" }}>WhatsApp</div>
            <div style={{ fontSize:11, color:"#6B7280" }}>WhatsApp Personal</div>
          </div>
        </a>
        <a href={waBizUrl} target="_blank" rel="noreferrer" onClick={p.onClose} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:12, background:"#E8F5E9", textDecoration:"none" }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#1B5E20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#1B5E20" }}>WhatsApp Business</div>
            <div style={{ fontSize:11, color:"#6B7280" }}>WhatsApp for Business</div>
          </div>
        </a>
      </div>
      <button onClick={p.onClose} style={{ width:"100%", marginTop:12, padding:"12px", borderRadius:12, border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:14, fontWeight:600, color:C.textLight }}>Cancel</button>
    </div>
  </div>;
};
var waPhone = function(phone) {
  if (!phone) return "";
  var p = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
  if (p.startsWith("+")) return p.slice(1);
  if (p.startsWith("0")) return "20" + p.slice(1);
  return p;
};
var cleanPhone = function(phone) {
  if (!phone) return "";
  var p = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
  if (!p) return "";
  if (p.startsWith("+")) return p;
  if (p.startsWith("20") && p.length > 10) return "+" + p;
  if (p.startsWith("0")) return p;
  if (p.length === 10) return "0" + p;
  return p;
};
var timeAgo = function(d, t) {
  if (!d) return "-";
  var diff = (Date.now() - new Date(d).getTime()) / 60000;
  if (diff < 1) return t.just;
  if (diff < 60) return Math.floor(diff) + " " + t.minutes + " " + t.ago;
  if (diff < 1440) return Math.floor(diff / 60) + " " + t.hours + " " + t.ago;
  return Math.floor(diff / 1440) + " " + t.days + " " + t.ago;
};

// Smart search: name, phone, last 4 digits
var matchSearch = function(lead, q) {
  if (!q) return true;
  q = q.toLowerCase().trim();
  if (lead.name.toLowerCase().includes(q)) return true;
  if (lead.phone.includes(q)) return true;
  if (lead.phone.slice(-4).includes(q)) return true;
  if (lead.phone2 && lead.phone2.includes(q)) return true;
  return false;
};

// Excel/CSV import
var loadXLSX = function() {
  return new Promise(function(resolve) {
    if (window.XLSX) { resolve(window.XLSX); return; }
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = function() { resolve(window.XLSX); };
    document.head.appendChild(s);
  });
};
var rowToLead = function(row) {
  var g = function() { for (var i = 0; i < arguments.length; i++) { var v = row[arguments[i]]; if (v) return String(v).trim(); } return ""; };
  return { name: g("name","Name","اسم الleads"), phone: g("phone","phone number","Phone","موبايل","رقم"), phone2: g("phone2","phone2 ","phone 2","هاتف إضافي","هاتف2","رقم2","موبايل2"), email: g("email","Email"), budget: g("budget","Budget"), project: g("project","campaign","المشروع","الكامبين") || "", source: g("source","المصدر") || "Facebook", notes: g("notes","Notes") };
};

// ===== UI COMPONENTS =====
var Badge = function(p) { return <span style={{ background: p.bg||"#F1F5F9", color: p.color||C.text, padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, whiteSpace:"nowrap", cursor:p.onClick?"pointer":"default", border:p.dashed?"1px dashed "+(p.color||C.text):"none", display:"inline-flex", alignItems:"center", gap:4 }} onClick={p.onClick}>{p.children}</span>; };
var Card = function(p) { return <div ref={p.innerRef} style={Object.assign({ background:"#fff", borderRadius:14, padding:p.p!==undefined?p.p:22, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", border:"1px solid #E8ECF1" }, p.style||{})}>{p.children}</div>; };

// Shared helper for closing any side panel when the user clicks outside it.
// Strategy: Option A — a document-level mousedown listener that closes when
// the target is not inside the panel AND is not inside a higher-stacking
// overlay (Modal at z:600, status dropdowns at z:500, etc). Walks ancestors
// and bails out if any is a fixed/absolute element at zIndex >= 400 other
// than the panel itself — this keeps the Edit Modal, status picker, and
// confirm dialogs from accidentally closing the panel underneath. Esc also
// closes. Pair this with ref={outsideCloseRef} on the panel's outermost node.
function useOutsideClose(open, onClose){
  var ref = useRef(null);
  var cbRef = useRef(onClose);
  cbRef.current = onClose;
  useEffect(function(){
    if (!open) return;
    function isInOverlayAbove(target, panel){
      var n = target;
      while (n && n !== document.body && n !== document.documentElement) {
        if (n === panel) return false;
        try {
          var cs = window.getComputedStyle(n);
          var z = parseInt(cs.zIndex, 10);
          if ((cs.position === "fixed" || cs.position === "absolute") && !isNaN(z) && z >= 400) return true;
        } catch(e) {}
        n = n.parentNode;
      }
      return false;
    }
    function onMouseDown(e){
      var panel = ref.current;
      if (!panel) return;
      if (panel.contains(e.target)) return;
      if (isInOverlayAbove(e.target, panel)) return;
      cbRef.current && cbRef.current();
    }
    function onKey(e){ if (e.key === "Escape") { cbRef.current && cbRef.current(); } }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return function(){
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return ref;
}
var StatCard = function(p) {
  var I = p.icon;
  return <div onClick={p.onClick} style={{ background:"#fff", borderRadius:14, padding:"16px 18px", flex:1, minWidth:150, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", border:"1px solid #E8ECF1", display:"flex", alignItems:"center", gap:13, cursor:p.onClick?"pointer":"default", transition:"transform 0.15s,box-shadow 0.15s" }}
    onMouseEnter={function(e){if(p.onClick){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 18px rgba(0,0,0,0.12)";}}}
    onMouseLeave={function(e){e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.07)";}}>
    <div style={{ width:44, height:44, borderRadius:12, background:p.c+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><I size={20} color={p.c}/></div>
    <div><div style={{ fontSize:11, color:C.textLight, marginBottom:3 }}>{p.label}</div><div style={{ fontSize:22, fontWeight:700, color:C.text }}>{p.value}</div></div>
  </div>;
};
var Modal = function(p) {
  if (!p.show) return null;
  // className hooks so the global mobile stylesheet can make the overlay
  // full-screen on phones without disturbing desktop centering.
  return <div className="crm-modal" style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.52)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:600, padding:16 }} onClick={p.onClose}>
    <div className="crm-modal-inner" style={{ background:"#fff", borderRadius:18, padding:26, width:"100%", maxWidth:p.w||500, maxHeight:"90vh", overflowY:"auto" }} onClick={function(e){e.stopPropagation();}}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:C.text }}>{p.title}</h2>
        <button onClick={p.onClose} style={{ width:28, height:28, borderRadius:7, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={14}/></button>
      </div>
      {p.children}
    </div>
  </div>;
};
var Inp = function(p) {
  return <div style={{ marginBottom:13 }}>
    <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>{p.label}{p.req&&<span style={{ color:C.danger, marginRight:3 }}>*</span>}</label>
    {p.type==="select"
      ? <select value={p.value} onChange={p.onChange} style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, background:"#fff", boxSizing:"border-box" }}>{p.options.map(function(o){return <option key={o.value!==undefined?o.value:o} value={o.value!==undefined?o.value:o}>{o.label||o}</option>;})}</select>
      : p.type==="textarea"
      ? <textarea rows={3} placeholder={p.placeholder||""} value={p.value} onChange={p.onChange} style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, outline:"none", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}/>
      : <input type={p.type||"text"} placeholder={p.placeholder||""} value={p.value} onChange={p.onChange} style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, outline:"none", boxSizing:"border-box" }}/>}
  </div>;
};
var Btn = function(p) { return <button onClick={p.onClick} disabled={p.loading||p.disabled} style={Object.assign({ padding:"9px 18px", borderRadius:10, border:p.outline?"1px solid #E2E8F0":"none", background:p.outline?"#fff":p.danger?C.danger:p.success?C.success:"linear-gradient(135deg,"+C.accent+","+C.accentLight+")", color:p.outline?C.textLight:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:7, justifyContent:"center", opacity:p.loading||p.disabled?0.65:1 }, p.style||{})}>{p.children}</button>; };
var Loader = function() { return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:80 }}><div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #E8ECF1", borderTopColor:C.accent, animation:"spin 0.8s linear infinite" }}/></div>; };

// Upload widget: dashed dropzone + 6MB cap + file list with remove. Value is [{fileData, fileName}].
var DocumentsUpload = function(p) {
  var files = p.files || [];
  var label = p.label || "📎 Upload Documents";
  var onPick = function(e){
    var picked = Array.from(e.target.files||[]);
    if (!picked.length) return;
    var tooBig = picked.find(function(f){return f.size>6*1024*1024;});
    if (tooBig) { if(p.onError) p.onError("Each file must be under 6MB ("+tooBig.name+")"); else alert("Each file must be under 6MB ("+tooBig.name+")"); e.target.value=""; return; }
    Promise.all(picked.map(function(f){
      return new Promise(function(resolve,reject){
        var r=new FileReader();
        r.onload=function(ev){resolve({fileData:ev.target.result, fileName:f.name});};
        r.onerror=function(){reject(new Error("Read failed: "+f.name));};
        r.readAsDataURL(f);
      });
    })).then(function(loaded){
      p.onChange(files.concat(loaded));
      if(p.onError) p.onError("");
    }).catch(function(ex){ if(p.onError) p.onError(ex.message||"Failed to read files"); else alert(ex.message||"Failed to read files"); });
    try{ e.target.value=""; }catch(er){}
  };
  var removeAt = function(idx){ p.onChange(files.filter(function(_,i){return i!==idx;})); };
  return <div style={Object.assign({ marginBottom:11 }, p.wrapperStyle||{})}>
    <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>{label}</label>
    <label style={{ display:"block", padding:"9px 12px", borderRadius:10, border:"1px dashed "+C.accent, background:C.accent+"08", color:C.accent, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"center" }}>
      Select files (images or PDF)
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple style={{ display:"none" }} onChange={onPick}/>
    </label>
    {files.length>0&&<div style={{ marginTop:8, padding:"8px 10px", background:"#F8FAFC", borderRadius:8, border:"1px solid #E2E8F0" }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:6 }}>{files.length} file{files.length===1?"":"s"} selected — uploaded on Save</div>
      {files.map(function(f,idx){
        var isPdf = f.fileData && f.fileData.indexOf("application/pdf")>=0;
        return <div key={idx} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, padding:"4px 0", borderTop:idx>0?"1px solid #F1F5F9":"none" }}>
          <div style={{ fontSize:12, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{isPdf?"📕":"🖼️"} {f.fileName}</div>
          <button onClick={function(){removeAt(idx);}} style={{ background:"none", border:"none", color:C.danger, fontSize:14, cursor:"pointer", padding:"0 4px", lineHeight:1 }} title="Remove">×</button>
        </div>;
      })}
    </div>}
  </div>;
};

// Status change requires mandatory comment
var StatusModal = function(p) {
  var [comment, setComment] = useState("");
  // Managerial visibility for the comment. For sales role / TL on own lead,
  // these are unused (FeedbackComposer renders only the textarea); but tracked
  // here in one shape so the parent's onConfirm always receives the same args.
  var [fbVisibility, setFbVisibility] = useState("private");
  var [fbTargetAgentId, setFbTargetAgentId] = useState("");
  var [cbTime, setCbTime] = useState("");
  var [dealProject, setDealProject] = useState("");
  var [dealUnitType, setDealUnitType] = useState("");
  var [dealBudget, setDealBudget] = useState("");
  var [eoiDeposit, setEoiDeposit] = useState("");
  var [eoiDateInput, setEoiDateInput] = useState("");
  var [eoiDocFiles, setEoiDocFiles] = useState([]); // array of {fileData, fileName}
  var [rejectNote, setRejectNote] = useState("");
  var [potBudget, setPotBudget] = useState("");
  var [potDeposit, setPotDeposit] = useState("");
  var [potInstalment, setPotInstalment] = useState("");
  var [err, setErr] = useState("");
  var [saving, setSaving] = useState(false);
  var sc = STATUSES(p.t);
  var ns = sc.find(function(s){return s.value===p.newStatus;});
  var st = p.newStatus;
  var isNewLead    = st==="NewLead";
  var isDoneDeal   = st==="DoneDeal";
  var isEOI        = st==="EOI";
  var isReject     = st==="NotInterested";
  var needsComment = st==="Potential"||st==="HotCase"||st==="MeetingDone";
  var needsCb      = st==="CallBack"||st==="NoAnswer";
  var needsPotFields = st==="Potential"||st==="HotCase";
  var hasBudget = p.lead&&p.lead.budget&&p.lead.budget.trim&&p.lead.budget.trim()!=="";
  var needsBudgetFields = needsPotFields&&!hasBudget;

  useEffect(function(){
    setComment(""); setCbTime(""); setDealProject(""); setDealUnitType(""); setDealBudget(""); setEoiDeposit(""); setEoiDateInput(""); setEoiDocFiles([]); setRejectNote("");
    setPotBudget(""); setPotDeposit(""); setPotInstalment(""); setErr("");
    setFbVisibility("private"); setFbTargetAgentId("");
  },[p.show]);

  var fmtNum = function(val, set){ return function(e){ var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,""); set(r?Number(r).toLocaleString():""); setErr(""); }; };

  var submit = async function() {
    if (needsComment && !cbTime)         { setErr("Please select a Callback time"); return; }
    if (needsComment && !comment.trim()) { setErr("A note is required"); return; }
    if (needsCb && !cbTime)              { setErr("Please select a time"); return; }
    if (isReject && !comment.trim())     { setErr("Please select a rejection reason"); return; }
    if (isReject && !rejectNote.trim())  { setErr("Feedback is required"); return; }
    if ((isDoneDeal||isEOI) && !dealBudget.trim()){ setErr("Please enter the amount"); return; }
    if (needsBudgetFields && !potBudget.trim()){ setErr("Please enter the Budget"); return; }
    if (needsBudgetFields && !potDeposit.trim()){ setErr("Please enter the Down Payment"); return; }
    if (needsBudgetFields && !potInstalment.trim()){ setErr("Please enter the Installments"); return; }
    setSaving(true);
    var extra = (isDoneDeal||isEOI)
      ? { project: dealProject, unitType: dealUnitType, budget: dealBudget, eoiDeposit: eoiDeposit, eoiDate: eoiDateInput, eoiDocumentFiles: (isEOI||isDoneDeal) ? eoiDocFiles : [] }
      : (needsPotFields && (potBudget||potDeposit||potInstalment))
        ? { budget: potBudget, deposit: potDeposit, instalment: potInstalment }
        : {};
    var finalComment = isReject&&rejectNote.trim() ? comment.trim()+" — "+rejectNote.trim() : comment.trim();
    var fb = { text: finalComment, visibility: fbVisibility, targetAgentId: fbTargetAgentId };
    // Validation: managerial role choosing "Send to specific sales" must pick
    // a target. sales_admin excluded — they're read-only on feedback.
    var role = p.cu && p.cu.role;
    var isMgr = role === "admin" || role === "manager" || role === "team_leader";
    var leadAgentId = p.lead && p.lead.agentId && p.lead.agentId._id ? p.lead.agentId._id : (p.lead && p.lead.agentId);
    var isOwnLead = role === "team_leader" && String(leadAgentId || "") === String((p.cu && p.cu.id) || "");
    if (isMgr && !isOwnLead && finalComment && fb.visibility === "to_sales" && !fb.targetAgentId) {
      setErr("Pick a sales agent to send the feedback to"); setSaving(false); return;
    }
    await p.onConfirm(finalComment, cbTime, extra, fb);
    setSaving(false);
  };

  return <Modal show={p.show} onClose={p.onClose} title={p.t.changeStatus}>
    {ns&&<div style={{ marginBottom:14, padding:"10px 14px", background:ns.bg, borderRadius:10, display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ width:10, height:10, borderRadius:"50%", background:ns.color }}/>
      <span style={{ fontSize:14, fontWeight:600, color:ns.color }}>{ns.label}</span>
    </div>}

    {/* CallBack / NoAnswer: date required */}
    {needsCb&&<div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>📅 Callback <span style={{color:C.danger}}>*</span></label>
      <input type="datetime-local" value={cbTime} onChange={function(e){setCbTime(e.target.value);setErr("");}}
        style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box" }}/>
      {/* Quick-pick row, CallBack only — fills cbTime in the same datetime-local
          format ("YYYY-MM-DDTHH:MM") the manual picker emits, so the existing
          submit / save path is untouched. The manual picker stays visible above
          for any timing the quick options don't cover. */}
      {st==="CallBack"&&(function(){
        var pad2 = function(n){return n<10?"0"+n:""+n;};
        var fmt = function(d){return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate())+"T"+pad2(d.getHours())+":"+pad2(d.getMinutes());};
        var quick = [
          { label:"After 1hr", make:function(){var d=new Date();d.setHours(d.getHours()+1);return d;} },
          { label:"After 2hr", make:function(){var d=new Date();d.setHours(d.getHours()+2);return d;} },
          { label:"8 PM",      make:function(){var d=new Date();d.setHours(20,0,0,0);return d;} }
        ];
        return <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
          {quick.map(function(q){
            var v = fmt(q.make());
            var active = cbTime===v;
            return <button key={q.label} type="button" onClick={function(){setCbTime(v);setErr("");}}
              style={{ flex:"1 1 0", minWidth:88, padding:"7px 10px", borderRadius:9, border:"1px solid "+(active?"#3B82F6":"#E2E8F0"), background:active?"#EFF6FF":"#fff", color:active?"#1D4ED8":"#334155", fontSize:12, fontWeight:600, cursor:"pointer" }}>{q.label}</button>;
          })}
        </div>;
      })()}
    </div>}

    {/* Potential / HotCase / MeetingDone: date + comment required */}
    {needsComment&&<div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>📅 Upcoming Callback <span style={{color:C.danger}}>*</span></label>
      <input type="datetime-local" value={cbTime} onChange={function(e){setCbTime(e.target.value);setErr("");}} style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box" }}/>
    </div>}
    {needsComment&&<div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💬 Feedback <span style={{color:C.danger}}>*</span></label>
      <FeedbackComposer id="needsComment" cu={p.cu} lead={p.lead} users={p.users}
        value={{text:comment, visibility:fbVisibility, targetAgentId:fbTargetAgentId}} rows={3}
        onChange={function(v){ setComment(v.text); setFbVisibility(v.visibility); setFbTargetAgentId(v.targetAgentId); setErr(""); }}/>
    </div>}

    {/* Potential / HotCase: budget + deposit + instalment (only when no budget set yet) */}
    {needsBudgetFields&&<div style={{ background:"#F0F9FF", borderRadius:10, padding:"12px 14px", marginBottom:12, border:"1px solid #BAE6FD" }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#0284C7", marginBottom:10 }}>💰 Budget Details</div>
      <div style={{ marginBottom:9 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text, marginBottom:4 }}>Budget (EGP) <span style={{color:C.danger}}>*</span></label>
          <input type="text" placeholder="e.g. 10,000,000" value={potBudget} onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setPotBudget(r?Number(r).toLocaleString():"");setErr("");}}
            style={{ width:"100%", padding:"8px 12px", borderRadius:9, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box", direction:"ltr" }}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text, marginBottom:4 }}>Down Payment (EGP) <span style={{color:C.danger}}>*</span></label>
          <input type="text" placeholder="e.g. 500,000" value={potDeposit} onChange={fmtNum(potDeposit,setPotDeposit)}
            style={{ width:"100%", padding:"8px 12px", borderRadius:9, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box", direction:"ltr" }}/>
        </div>
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text, marginBottom:4 }}>Installments (EGP) <span style={{color:C.danger}}>*</span></label>
          <input type="text" placeholder="e.g. 60,000" value={potInstalment} onChange={fmtNum(potInstalment,setPotInstalment)}
            style={{ width:"100%", padding:"8px 12px", borderRadius:9, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box", direction:"ltr" }}/>
        </div>
      </div>
    </div>}

    {/* CallBack / NoAnswer: optional comment */}
    {needsCb&&<div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💬 Feedback (optional)</label>
      <FeedbackComposer id="needsCb" cu={p.cu} lead={p.lead} users={p.users}
        value={{text:comment, visibility:fbVisibility, targetAgentId:fbTargetAgentId}} rows={2}
        onChange={function(v){ setComment(v.text); setFbVisibility(v.visibility); setFbTargetAgentId(v.targetAgentId); }}/>
    </div>}

    {/* NotInterested: reason required */}
    {isReject&&<div style={{ marginBottom:12 }}>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:8, color:"#EF4444" }}>Rejection Reason <span style={{color:C.danger}}>*</span></div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {["Price too high","Area not suitable","Bought elsewhere","Not ready yet","Not interested at all","Other reason"].map(function(r){
          return <button key={r} onClick={function(){setComment(r);setErr("");}}
            style={{ padding:"8px 12px", borderRadius:8, border:"1px solid", borderColor:comment===r?"#EF4444":"#E2E8F0",
              background:comment===r?"#FEF2F2":"#fff", color:comment===r?"#EF4444":"#64748B", fontSize:12, cursor:"pointer", textAlign:"right" }}>{r}</button>;
        })}
      </div>
      <div style={{ marginTop:10 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💬 Feedback <span style={{color:C.danger}}>*</span></label>
        <FeedbackComposer id="rejectNote" cu={p.cu} lead={p.lead} users={p.users}
          value={{text:rejectNote, visibility:fbVisibility, targetAgentId:fbTargetAgentId}} rows={2}
          onChange={function(v){ setRejectNote(v.text); setFbVisibility(v.visibility); setFbTargetAgentId(v.targetAgentId); setErr(""); }}/>
      </div>
    </div>}

    {/* DoneDeal / EOI: project + unit type + budget */}
    {(isDoneDeal||isEOI)&&<div>
      <div style={{ marginBottom:11 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>🏠 Project</label>
        <input type="text" placeholder="" value={dealProject} onChange={function(e){setDealProject(e.target.value);}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box" }}/>
      </div>
      <div style={{ marginBottom:11 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>🏷️ Unit Type</label>
        <select value={dealUnitType} onChange={function(e){setDealUnitType(e.target.value);}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, background:"#fff", boxSizing:"border-box" }}>
          {["","Apartment","Duplex","Townhouse","Twinhouse","Standalone","Commercial","Admin","Clinic","Service Apartment","Chalet"].map(function(x){return <option key={x} value={x}>{x||"- Select -"}</option>;})}
        </select>
      </div>
      <div style={{ marginBottom:11 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💰 Amount (EGP) <span style={{color:C.danger}}>*</span></label>
        <input type="text" placeholder="" value={dealBudget}
          onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setDealBudget(r?Number(r).toLocaleString():"");setErr("");}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", direction:"ltr" }}/>
      </div>
      {isEOI&&<div style={{ marginBottom:11 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>📅 EOI Date</label>
        <input type="date" value={eoiDateInput} onChange={function(e){setEoiDateInput(e.target.value);}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box" }}/>
      </div>}
      {isEOI&&<div style={{ marginBottom:11 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💵 Deposit (EGP)</label>
        <input type="text" placeholder="" value={eoiDeposit}
          onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setEoiDeposit(r?Number(r).toLocaleString():"");}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", direction:"ltr" }}/>
      </div>}
      {(isEOI||isDoneDeal)&&<DocumentsUpload
        files={eoiDocFiles}
        onChange={setEoiDocFiles}
        onError={setErr}
        label={isEOI?"📎 Upload EOI Documents":"📎 Upload Deal Documents"}
      />}
    </div>}

    {err&&<div style={{ color:C.danger, fontSize:12, marginBottom:12, padding:"8px 12px", background:"#FEF2F2", borderRadius:8 }}>⚠️ {err}</div>}
    <div style={{ display:"flex", gap:10 }}>
      <Btn outline onClick={p.onClose} style={{ flex:1 }}>{p.t.cancel}</Btn>
      <Btn onClick={submit} loading={saving} style={{ flex:1 }}>{p.t.save}</Btn>
    </div>
  </Modal>;
};

// ===== LOGIN =====
var LoginPage = function(p) {
  var t = p.t;
  var [user, setUser] = useState(""); var [pass, setPass] = useState(""); var [err, setErr] = useState(""); var [showPass, setShowPass] = useState(false); var [loading, setLoading] = useState(false);
  var go = async function() {
    if (!user||!pass) return; setLoading(true); setErr("");
    try { var data = await apiFetch("/api/login","POST",{username:user,password:pass}); p.onLogin(data.user,data.token,data.csrfToken); }
    catch(e) { setErr(t.loginError); } setLoading(false);
  };
  return <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,"+C.primaryDark+" 0%,"+C.primary+" 55%,"+C.primaryLight+" 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cairo','Segoe UI',sans-serif", padding:16 }}>
    <div style={{ background:"#fff", borderRadius:24, padding:"40px 36px", width:"100%", maxWidth:420, boxShadow:"0 24px 64px rgba(0,0,0,0.28)" }}>
      <div style={{ textAlign:"center", marginBottom:34 }}>
        <div style={{ width:68, height:68, borderRadius:18, background:"linear-gradient(135deg,"+C.accent+","+C.accentLight+")", display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", boxShadow:"0 8px 24px rgba(232,168,56,0.45)", marginBottom:16 }}>ARO</div>
        <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:C.text }}>ARO CRM</h1>
        <p style={{ margin:"6px 0 0", fontSize:13, color:C.textLight }}></p>
      </div>
      {err && <div style={{ background:"#FEE2E2", color:"#B91C1C", padding:"10px 16px", borderRadius:10, fontSize:13, marginBottom:18, textAlign:"center" }}>{err}</div>}
      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:6, color:C.text }}>{t.username}</label>
        <input value={user} onChange={function(e){setUser(e.target.value);}} placeholder="" style={{ width:"100%", padding:"12px 16px", borderRadius:12, border:"1px solid #E2E8F0", fontSize:15, outline:"none", boxSizing:"border-box" }} onKeyDown={function(e){if(e.key==="Enter")go();}}/>
      </div>
      <div style={{ marginBottom:26 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:6, color:C.text }}>{t.password}</label>
        <div style={{ position:"relative" }}>
          <input type={showPass?"text":"password"} value={pass} onChange={function(e){setPass(e.target.value);}} placeholder="" style={{ width:"100%", padding:"12px 44px 12px 16px", borderRadius:12, border:"1px solid #E2E8F0", fontSize:15, outline:"none", boxSizing:"border-box" }} onKeyDown={function(e){if(e.key==="Enter")go();}}/>
          <button onClick={function(){setShowPass(!showPass);}} style={{ position:"absolute", top:"50%", right:14, transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex" }}>{showPass?<EyeOff size={18}/>:<Eye size={18}/>}</button>
        </div>
      </div>
      <button onClick={go} disabled={loading} style={{ width:"100%", padding:"14px", borderRadius:12, border:"none", background:"linear-gradient(135deg,"+C.accent+","+C.accentLight+")", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", opacity:loading?0.75:1 }}>{loading?t.loading:t.loginBtn}</button>
    </div>
  </div>;
};

// ===== SIDEBAR =====
var SidebarIcon = function(id, active){
  var col = active ? "#fff" : "rgba(255,255,255,0.4)";
  var sw = 1.5;
  var base = { width:18, height:18, display:"block" };
  switch(id){
    case "dashboard":
      return <svg style={base} viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="2" fill={col}/><rect x="10" y="1" width="7" height="7" rx="2" fill={col} opacity=".4"/><rect x="1" y="10" width="7" height="7" rx="2" fill={col} opacity=".4"/><rect x="10" y="10" width="7" height="7" rx="2" fill={col} opacity=".4"/></svg>;
    case "leads":
    case "users":
      return <svg style={base} viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke={col} strokeWidth={sw}/><path d="M2 16c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={col} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "dailyReq":
      return <svg style={base} viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="3" stroke={col} strokeWidth={sw}/><path d="M5 9h8M5 6h8M5 12h5" stroke={col} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "deals":
      return <svg style={base} viewBox="0 0 18 18" fill="none"><path d="M15 6L9 2.5 3 6v7l6 3.5 6-3.5V6z" stroke={col} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    case "eoi":
      return <svg style={base} viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke={col} strokeWidth={sw}/><path d="M9 6v3.5l2.5 2.5" stroke={col} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "tasks":
    case "myday":
    case "calendar":
    case "kpis":
      if (id==="kpis") return <svg style={base} viewBox="0 0 18 18" fill="none"><path d="M2 14l4-5 3 3 4-7 3 4" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
      if (id==="calendar") return <svg style={base} viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="13" rx="2" stroke={col} strokeWidth={sw}/><path d="M2 7h14M6 1v4M12 1v4" stroke={col} strokeWidth={sw} strokeLinecap="round"/></svg>;
      return <svg style={base} viewBox="0 0 18 18" fill="none"><path d="M3 5h12M3 9h8M3 13h10" stroke={col} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "reports":
      return <svg style={base} viewBox="0 0 18 18" fill="none"><path d="M2 14l4-5 3 3 4-7 3 4" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case "team":
      return <svg style={base} viewBox="0 0 18 18" fill="none"><circle cx="5.5" cy="6" r="2.5" stroke={col} strokeWidth={sw}/><circle cx="12.5" cy="6" r="2.5" stroke={col} strokeWidth={sw}/><path d="M1 15c0-2.5 2-4.5 4.5-4.5M17 15c0-2.5-2-4.5-4.5-4.5M9 15c0-2.5 2-4.5 4.5-4.5" stroke={col} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "archive":
      return <svg style={base} viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="3" stroke={col} strokeWidth={sw}/><path d="M6 9h6" stroke={col} strokeWidth={sw} strokeLinecap="round"/></svg>;
    case "settings":
      return <svg style={base} viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke={col} strokeWidth={sw}/><path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M4.1 4.1l1.1 1.1M12.8 12.8l1.1 1.1M4.1 13.9l1.1-1.1M12.8 5.2l1.1-1.1" stroke={col} strokeWidth={sw} strokeLinecap="round"/></svg>;
    default:
      return <svg style={base} viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3" stroke={col} strokeWidth={sw}/></svg>;
  }
};

var Sidebar = function(p) {
  var t = p.t; var isAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin";
  var isSales = p.cu.role==="sales";
  var isSalesOrTL = p.cu.role==="sales"||p.cu.role==="team_leader";
  var items = [
    {id:"dashboard",label:t.dashboard},
    p.cu.role==="team_leader"&&{id:"myday",label:t.myDay},
    {id:"leads",label:t.leads},
    {id:"dailyReq",label:t.dailyReq},
    {id:"deals",label:t.deals},
    {id:"eoi",label:"EOI"},
    {id:"tasks",label:t.tasks},
    isSalesOrTL&&{id:"kpis",label:"KPIs"},
    isSales&&{id:"calendar",label:"Calendar"},
    isOnlyAdmin&&{id:"reports",label:t.reports,adminSection:true},
    isAdmin&&{id:"team",label:t.team,adminSection:true},
    isOnlyAdmin&&{id:"users",label:t.users,adminSection:true},
    isOnlyAdmin&&{id:"archive",label:t.archive,adminSection:true},
    (p.cu.role==="admin"||p.cu.role==="sales_admin")&&{id:"settings",label:t.settings,adminSection:true},
  ].filter(Boolean);
  var isRTL = t.dir==="rtl";
  var leadsCount = Array.isArray(p.leads) ? p.leads.filter(function(l){return !l.archived;}).length : 0;
  var userName = p.cu.username==="amgad" ? "Amgad Mohamed" : p.cu.name;
  var userInitial = (userName||"?")[0];
  var userRole = p.cu.title || ({admin:"Admin",sales_admin:"Sales Admin",manager:"Manager",team_leader:"Team Leader",sales:"Sales",viewer:"Viewer"}[p.cu.role]||"");
  var st = {
    width:240, height:"100vh",
    background:"rgba(28, 30, 40, 0.95)",
    borderRight:"1px solid rgba(255,255,255,0.07)",
    padding:"24px 14px 16px",
    fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    display:"flex", flexDirection:"column",
    position:"fixed", top:0, zIndex:150,
    transition:"transform 0.28s ease",
    boxSizing:"border-box"
  };
  if (isRTL) { st.right=0; st.borderRight="none"; st.borderLeft="1px solid rgba(255,255,255,0.07)"; } else { st.left=0; }
  if (p.isMobile&&!p.open) st.transform=isRTL?"translateX(100%)":"translateX(-100%)";
  var renderItem = function(item){
    var act = p.active===item.id;
    var onClick = function(){ p.setActive(item.id); try{localStorage.setItem("crm_page",item.id);}catch(e){} if(p.isMobile) p.onClose(); };
    return <button key={item.id} onClick={onClick}
      onMouseEnter={function(e){ if(!act) e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
      onMouseLeave={function(e){ if(!act) e.currentTarget.style.background="transparent"; }}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, border:"none", cursor:"pointer",
        background: act ? "rgba(255,255,255,0.1)" : "transparent",
        color: act ? "#fff" : "rgba(255,255,255,0.4)",
        fontSize:13, fontWeight: act?500:400, marginBottom:2, textAlign:isRTL?"right":"left",
        fontFamily:"inherit"
      }}>
      {SidebarIcon(item.id, act)}
      <span style={{ flex:1, textAlign:isRTL?"right":"left" }}>{item.label}</span>
      {item.id==="leads" && leadsCount>0 && <div style={{ marginLeft:"auto", background:"#EF4444", borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:3 }}>
        <div style={{ width:4, height:4, borderRadius:"50%", background:"#fff" }}/>
        {leadsCount}
      </div>}
    </button>;
  };
  return <>
    {p.isMobile&&p.open&&<div onClick={p.onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.48)", zIndex:140 }}/>}
    <div style={st}>
      {/* Header */}
      <div style={{ paddingBottom:18, borderBottom:"1px solid rgba(255,255,255,0.06)", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:10 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:22, fontWeight:800, letterSpacing:"-1.5px", lineHeight:1 }}>
              ARO<span style={{ color:"rgba(255,255,255,0.25)", fontSize:14, fontWeight:400, letterSpacing:0 }}> CRM</span>
            </div>
            <div style={{ width:32, height:2, background:"rgba(255,255,255,0.15)", borderRadius:2, marginTop:5 }}/>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            {p.isMobile&&<button onClick={p.onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.6)", display:"flex", padding:0 }}><X size={18}/></button>}
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
        {(function(){
          var out = [];
          var dividerInserted = false;
          items.forEach(function(item){
            if (item.adminSection && !dividerInserted) {
              out.push(<div key="divider-admin" style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"6px 4px" }}/>);
              dividerInserted = true;
            }
            out.push(renderItem(item));
          });
          return out;
        })()}
      </div>

      {/* Footer */}
      <div style={{ paddingTop:14, marginTop:8, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 4px", marginBottom:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:600, fontSize:13, flexShrink:0 }}>{userInitial}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:"rgba(255,255,255,0.8)", fontSize:11, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userName}</div>
            <div style={{ color:"rgba(255,255,255,0.25)", fontSize:9, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{userRole}</div>
          </div>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#22C55E", flexShrink:0 }}/>
        </div>
        <button onClick={p.onLogout}
          onMouseEnter={function(e){ e.currentTarget.style.background="rgba(239,68,68,0.08)"; }}
          onMouseLeave={function(e){ e.currentTarget.style.background="transparent"; }}
          style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"transparent", border:"none", borderRadius:12, color:"#EF4444", fontSize:13, fontWeight:500, cursor:"pointer", textAlign:isRTL?"right":"left", fontFamily:"inherit" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{display:"block"}}><path d="M7 3H3a1 1 0 00-1 1v10a1 1 0 001 1h4M12 13l4-4-4-4M16 9H7" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{t.logout}</span>
        </button>
      </div>
    </div>
  </>;
};

// ===== CALLBACK BELL (isolated for performance) =====
var CB_COLORS = {overdue:{bg:"#FEF2F2",border:"#EF4444",icon:"#FEE2E2",text:"#DC2626"},now:{bg:"#FFF7ED",border:"#F97316",icon:"#FFEDD5",text:"#EA580C"},upcoming:{bg:"#F0FDF4",border:"#22C55E",icon:"#DCFCE7",text:"#16A34A"},nocontact:{bg:"#FFFBEB",border:"#EAB308",icon:"#FEF3C7",text:"#B45309"}};
var CB_CSS = "@keyframes cbBellShake{0%,100%{transform:rotate(0)}15%{transform:rotate(12deg)}30%{transform:rotate(-10deg)}45%{transform:rotate(8deg)}60%{transform:rotate(-6deg)}75%{transform:rotate(3deg)}}.cb-bell-shake{animation:cbBellShake 0.6s ease-in-out infinite}.cb-dropdown-enter{animation:cbSlideDown 0.2s ease-out}@keyframes cbSlideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}.cb-card:hover{box-shadow:0 4px 16px rgba(0,0,0,0.08)!important;transform:translateY(-1px)}";
var cbStyleInjected = false;

var CallbackBell = function(p) {
  var [tab, setTab] = useState("all");
  var [limit, setLimit] = useState(30);
  var ref = useRef(null);

  useEffect(function(){ setLimit(30); },[tab]);

  useEffect(function(){
    if(!p.showNotif) return;
    var fn=function(e){if(ref.current&&!ref.current.contains(e.target))p.setShowNotif(false);};
    document.addEventListener("mousedown",fn);
    return function(){document.removeEventListener("mousedown",fn);};
  },[p.showNotif]);

  useEffect(function(){
    if(cbStyleInjected) return;
    var s=document.createElement("style"); s.textContent=CB_CSS; document.head.appendChild(s); cbStyleInjected=true;
  },[]);

  // Simple computation - no useMemo, no useRef tricks
  var now = Date.now();
  var uid = String(p.cu&&p.cu.id||"");
  var teamUids = new Set((p.myTeamUsers||[]).map(function(u){return String(u._id||gid(u)||"");}));
  teamUids.add(uid);

  var allLeads = (p.leads||[]).concat(p.dailyRequests||[]);

  var myItems = allLeads.filter(function(l){
    if(l.archived||l.status==="DoneDeal"||l.status==="NotInterested"||l.status==="EOI") return false;
    var aid = String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");
    if(p.cu.role==="sales") return aid===uid;
    if(p.cu.role==="team_leader") return teamUids.has(aid);
    return true;
  });

  var overdue = [];
  var nowItems = [];
  var upcoming = [];
  var noContact = [];
  var cbIds = new Set();

  myItems.forEach(function(l){
    if(l.callbackTime){
      var cbT = new Date(l.callbackTime).getTime();
      var diff = cbT - now;
      var lastAct = l.lastActivityTime ? new Date(l.lastActivityTime).getTime() : 0;
      if(lastAct > cbT) return;
      if(diff < -3600000){ overdue.push(l); cbIds.add(gid(l)); }
      else if(diff <= 0){ nowItems.push(l); cbIds.add(gid(l)); }
      else if(diff <= 86400000){ upcoming.push(l); cbIds.add(gid(l)); }
    }
  });

  upcoming.sort(function(a,b){return new Date(a.callbackTime)-new Date(b.callbackTime);});

  myItems.forEach(function(l){
    if(!cbIds.has(gid(l)) && (now - new Date(l.lastActivityTime||0).getTime()) > 86400000){
      noContact.push(l);
    }
  });

  var allItems = overdue.concat(nowItems).concat(upcoming).concat(noContact);

  var filtered;
  if(tab==="overdue") filtered = overdue;
  else if(tab==="now") filtered = nowItems;
  else if(tab==="upcoming") filtered = upcoming;
  else if(tab==="nocontact") filtered = noContact;
  else filtered = allItems;

  var visible = filtered.slice(0, limit);
  var totalCount = allItems.length;

  var tabs = [
    {key:"all", label:"All", count:totalCount},
    {key:"overdue", label:"Delay", count:overdue.length},
    {key:"now", label:"Now", count:nowItems.length},
    {key:"upcoming", label:"Upcoming", count:upcoming.length},
    {key:"nocontact", label:"No Contact", count:noContact.length}
  ];

  var getType = function(l){
    if(overdue.indexOf(l)!==-1) return "overdue";
    if(nowItems.indexOf(l)!==-1) return "now";
    if(upcoming.indexOf(l)!==-1) return "upcoming";
    return "nocontact";
  };

  return <div style={{ position:"relative" }} ref={ref}>
    <button onClick={function(){
      var opening=!p.showNotif;
      p.setShowNotif(opening);
      if(opening){p.setShowDealNotif(false);if(p.setShowRotNotif)p.setShowRotNotif(false);setTab("all");}
    }} style={{ width:36, height:36, borderRadius:9, border:"1px solid #E8ECF1", background:totalCount>0?"#FEF2F2":"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", transition:"all 0.2s" }}>
      <Bell size={16} color={totalCount>0?C.danger:C.textLight} className={totalCount>0?"cb-bell-shake":""}/>
      {totalCount>0&&<span style={{ position:"absolute", top:-2, right:-2, minWidth:17, height:17, borderRadius:9, background:C.danger, color:"#fff", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", border:"2px solid #fff" }}>{totalCount>99?"99+":totalCount}</span>}
    </button>
    {p.showNotif&&<div className="cb-dropdown-enter" style={{ position:"absolute", top:46, right:0, width:440,maxWidth:"95vw", background:"#fff", borderRadius:16, boxShadow:"0 8px 32px rgba(0,0,0,0.15)", zIndex:200, maxHeight:520, display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #F1F5F9", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:18 }}>🔔</span>
            <span style={{ fontWeight:700, fontSize:15, color:C.text }}>Callbacks</span>
            {totalCount>0&&<span style={{ background:"#FEF2F2", color:C.danger, padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:700 }}>{totalCount}</span>}
          </div>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <button onClick={function(){p.setShowNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex", padding:4 }}><X size={15}/></button>
          </div>
        </div>
        <div style={{ display:"flex", gap:3, overflow:"hidden" }}>
          {tabs.map(function(t2){var active=tab===t2.key;return <button key={t2.key} onClick={function(){setTab(t2.key);}} style={{ padding:"4px 6px", borderRadius:6, border:"none", background:active?"#111827":"#F8FAFC", color:active?"#fff":"#374151", fontSize:10, fontWeight:active?700:600, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s", display:"flex", alignItems:"center", gap:3, flexShrink:0 }}>
            {t2.label}
            {t2.count>0&&<span style={{ background:active?"rgba(255,255,255,0.25)":"#E5E7EB", color:active?"#fff":"#374151", padding:"0 4px", borderRadius:4, fontSize:8, fontWeight:700, lineHeight:"14px" }}>{t2.count}</span>}
          </button>;})}
        </div>
      </div>
      <div style={{ overflowY:"auto", flex:1, padding:"8px 12px" }}>
        {totalCount===0&&<div style={{ padding:"40px 20px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎉</div>
          <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4 }}>All clear!</div>
          <div style={{ fontSize:12, color:C.textLight }}>No pending callbacks</div>
        </div>}
        {filtered.length===0&&totalCount>0&&<div style={{ padding:"32px 20px", textAlign:"center", color:C.textLight, fontSize:13 }}>No items in this category</div>}
        {visible.map(function(l){
          var agName=l.agentId&&l.agentId.name?l.agentId.name:"";
          var lType=getType(l);
          var cc=CB_COLORS[lType]||CB_COLORS.now;
          var cbTypeLabel=lType==="overdue"?"Overdue":lType==="now"?"Callback Now":lType==="upcoming"?"Upcoming":"No Contact";
          var timeStr=lType==="nocontact"?timeAgo(l.lastActivityTime,p.t):(l.callbackTime?timeAgo(l.callbackTime,p.t):"");
          return <div key={gid(l)} className="cb-card" onClick={function(){p.setShowNotif(false);var isDR=(p.dailyRequests||[]).some(function(r){return gid(r)===gid(l);});setTimeout(function(){if(isDR){p.onDRClick&&p.onDRClick();}else{p.onLeadClick(l);}},50);}} style={{ background:cc.bg, borderLeft:"4px solid "+cc.border, borderRadius:12, padding:"14px 16px", marginBottom:8, cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", transition:"all 0.2s", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:cc.icon, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>{lType==="overdue"?"⏰":lType==="now"?"📞":lType==="upcoming"?"🔔":"😴"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.name}</div>
              <div style={{ fontSize:13, fontWeight:500, color:C.textLight, marginTop:2 }}>{agName||"Unassigned"}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                <span style={{ fontSize:10, fontWeight:600, color:cc.text, background:cc.icon, padding:"1px 6px", borderRadius:4 }}>{cbTypeLabel}</span>
                <span style={{ fontSize:11, color:C.textLight }}>{timeStr}</span>
              </div>
            </div>
            {l.phone&&<a href={"tel:"+cleanPhone(l.phone)} onClick={function(e){e.stopPropagation();}} style={{ width:40, height:40, borderRadius:10, background:cc.icon, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, textDecoration:"none", boxShadow:"0 2px 8px rgba(0,0,0,0.15)" }} title="Call"><Phone size={16} color={cc.text}/></a>}
          </div>;
        })}
        {filtered.length>limit&&<button onClick={function(e){e.stopPropagation();setLimit(function(v){return v+30;});}} style={{ width:"100%", padding:"10px", border:"none", borderRadius:8, background:"#F1F5F9", color:"#374151", fontSize:12, fontWeight:600, cursor:"pointer", marginTop:4 }}>Show More ({filtered.length-limit} remaining)</button>}
      </div>
    </div>}
  </div>;
};

// ===== GLOBAL HEADER SEARCH =====
var HeaderSearch = function(p) {
  var t = p.t;
  var wrapRef = useRef(null);
  var [open, setOpen] = useState(false);
  useEffect(function(){
    var onDown = function(e){ if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return function(){ document.removeEventListener("mousedown", onDown); };
  },[]);
  var q = (p.search||"").trim();
  var leadResults = [];
  var drResults = [];
  if (q.length>=2) {
    var lc = q.toLowerCase();
    leadResults = (p.leads||[]).filter(function(l){
      if (l.archived) return false;
      if (l.name && l.name.toLowerCase().indexOf(lc)>=0) return true;
      if (l.phone && l.phone.indexOf(q)>=0) return true;
      if (l.phone2 && l.phone2.indexOf(q)>=0) return true;
      if (l.email && l.email.toLowerCase().indexOf(lc)>=0) return true;
      return false;
    }).slice(0,10);
    drResults = (p.dailyRequests||[]).filter(function(r){
      if (r.name && r.name.toLowerCase().indexOf(lc)>=0) return true;
      if (r.phone && r.phone.indexOf(q)>=0) return true;
      if (r.phone2 && r.phone2.indexOf(q)>=0) return true;
      if (r.email && r.email.toLowerCase().indexOf(lc)>=0) return true;
      if (r.notes && r.notes.toLowerCase().indexOf(lc)>=0) return true;
      if (r.propertyType && r.propertyType.toLowerCase().indexOf(lc)>=0) return true;
      if (r.area && r.area.toLowerCase().indexOf(lc)>=0) return true;
      return false;
    }).slice(0,10);
  }
  var totalResults = leadResults.length + drResults.length;
  var showDropdown = open && q.length>=2;
  var sc = STATUSES(t);
  var drSc = typeof DR_STATUSES==="function" ? DR_STATUSES(t) : sc;
  var sectionLabel = function(label,count){ return <div style={{ padding:"8px 14px 6px", fontSize:10, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:1, background:"#FAFBFC" }}>{label} ({count})</div>; };
  var renderRow = function(item, onClick, statuses, isDR){
    var so = statuses.find(function(s){return s.value===item.status;})||statuses[0];
    var sub = item.phone || "";
    if (isDR) {
      var drDesc = item.propertyType || item.area || item.notes || "";
      if (drDesc) sub = (item.phone||"") + (item.phone?" \u00b7 ":"") + (drDesc.length>32?drDesc.slice(0,32)+"\u2026":drDesc);
    } else if (item.project) {
      sub = (item.phone||"") + " \u00b7 " + item.project;
    }
    return <div key={(isDR?"dr-":"lead-")+gid(item)} onClick={function(){setOpen(false);onClick&&onClick(item);}} style={{ padding:"10px 14px", borderBottom:"1px solid #F1F5F9", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name||"\u2014"}</div>
        <div style={{ fontSize:11, color:C.textLight, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</div>
      </div>
      {so && <span style={{ background:so.bg, color:so.color, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6, flexShrink:0 }}>{so.label}</span>}
    </div>;
  };
  return <div ref={wrapRef} style={{ position:"relative", width:(p.width||260) }}>
    <div style={{ display:"flex", alignItems:"center", gap:7, background:"#F1F5F9", borderRadius:10, padding:"7px 14px", width:"100%", boxSizing:"border-box" }}>
      <Search size={14} color={C.textLight}/>
      <input placeholder={t.search} value={p.search||""} onFocus={function(){setOpen(true);}} onChange={function(e){p.setSearch(e.target.value);setOpen(true);}} style={{ border:"none", background:"transparent", outline:"none", fontSize:13, color:C.text, width:"100%" }}/>
      {q.length>0&&<button onClick={function(){p.setSearch("");setOpen(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, padding:0, display:"flex" }} title="Clear"><X size={14}/></button>}
    </div>
    {showDropdown && <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#fff", border:"1px solid #E2E8F0", borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", zIndex:500, maxHeight:420, overflowY:"auto" }}>
      {totalResults===0 && <div style={{ padding:"14px 16px", fontSize:12, color:"#94A3B8", textAlign:"center" }}>No matching results</div>}
      {leadResults.length>0 && <>
        {sectionLabel("Leads", leadResults.length)}
        {leadResults.map(function(l){ return renderRow(l, p.onLeadClick, sc, false); })}
      </>}
      {drResults.length>0 && <>
        {sectionLabel("Daily Requests", drResults.length)}
        {drResults.map(function(r){ return renderRow(r, p.onDRClick, drSc, true); })}
      </>}
    </div>}
  </div>;
};

// Live EOI/DoneDeal items, shared by the Deal bell badge (unseen count) and
// the Deal bell panel (rendered list). Keeping both on one source prevents the
// badge from drifting out of sync with the panel contents.
var buildDealItems = function(leads, dailyRequests, cu, myTeamUsers) {
  var agentNameOf = function(entry){
    if (!entry || !entry.agentId) return "";
    if (entry.agentId.name) return entry.agentId.name;
    var u = (myTeamUsers||[]).find(function(x){return gid(x)===String(entry.agentId);});
    return u?u.name:"";
  };
  var seenLeadKeys = {};
  var items = [];
  (leads||[]).filter(function(l){return !l.archived;}).forEach(function(l){
    var isEOI = l.status==="EOI" || l.globalStatus==="eoi" || (l.eoiStatus && l.eoiStatus!=="EOI Cancelled" && l.eoiStatus!=="");
    var isDeal = l.status==="DoneDeal" || l.globalStatus==="donedeal";
    if (!isEOI && !isDeal) return;
    if (l.eoiStatus==="EOI Cancelled" && !isDeal) return;
    var kind = isDeal ? "DoneDeal" : (l.eoiStatus || "Pending");
    // Use the closure date (dealDate / eoiDate) so editing a closed deal
    // doesn't bump it back to the top of the notification panel via updatedAt.
    // createdAt fallback covers legacy rows from before dealDate/eoiDate were
    // captured — they sort lower than recent closures, never resurface.
    var leadTime = isDeal ? (l.dealDate || l.createdAt) : (l.eoiDate || l.createdAt);
    items.push({
      _id: gid(l), leadId: gid(l), leadName: l.name,
      agentName: agentNameOf(l), budget: l.budget || "",
      kind: kind, time: leadTime,
      phone: l.phone || ""
    });
    if (l.phone) seenLeadKeys[l.phone] = true;
  });
  (dailyRequests||[]).forEach(function(r){
    if (r.archived) return;
    if (r.phone && seenLeadKeys[r.phone]) return;
    var isEOI = r.status==="EOI" || (r.eoiStatus && r.eoiStatus!=="EOI Cancelled" && r.eoiStatus!=="");
    var isDeal = r.status==="DoneDeal";
    if (!isEOI && !isDeal) return;
    if (r.eoiStatus==="EOI Cancelled" && !isDeal) return;
    var kind = isDeal ? "DoneDeal" : (r.eoiStatus || "Pending");
    var drTime = isDeal ? (r.dealDate || r.createdAt) : (r.eoiDate || r.createdAt);
    items.push({
      _id: gid(r), leadId: gid(r), leadName: r.name,
      agentName: agentNameOf(r), budget: r.budget || "",
      kind: kind, isDR: true, time: drTime,
      phone: r.phone || ""
    });
  });
  if (cu && cu.role==="team_leader") {
    var teamNames=new Set((myTeamUsers||[]).map(function(u){return u.name;}));
    teamNames.add(cu.name);
    items = items.filter(function(it){ return !it.agentName || teamNames.has(it.agentName); });
  }
  items.sort(function(a,b){ return new Date(b.time||0) - new Date(a.time||0); });
  return items;
};

// ===== HEADER =====
var Header = function(p) {
  var t = p.t; var isOnlyAdmin = p.cu&&(p.cu.role==="admin"||p.cu.role==="sales_admin");

  // Close deal notif + rot notif on outside click
  var dealNotifRef = useRef(null);
  var rotNotifRef = useRef(null);
  useEffect(function(){
    if(!p.showDealNotif&&!p.showRotNotif) return;
    var fn=function(e){
      if(p.showDealNotif&&dealNotifRef.current&&!dealNotifRef.current.contains(e.target)){
        p.setShowDealNotif(false);
      }
      if(p.showRotNotif&&rotNotifRef.current&&!rotNotifRef.current.contains(e.target)){
        if(p.setShowRotNotif)p.setShowRotNotif(false);
      }
    };
    setTimeout(function(){document.addEventListener("mousedown",fn);},0);
    return function(){document.removeEventListener("mousedown",fn);};
  },[p.showDealNotif,p.showRotNotif]);
  return <div style={{ position:"sticky", top:0, zIndex:100, background:"#fff" }}>
  <div style={{ height:64, background:"#fff", borderBottom:"1px solid #E8ECF1", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", gap:10 }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
      {p.isMobile&&<button onClick={p.onMenu} style={{ width:36, height:36, borderRadius:9, border:"1px solid #E8ECF1", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}><Menu size={18} color={C.text}/></button>}
      <h1 style={{ fontSize:p.isMobile?15:19, fontWeight:700, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</h1>
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
      {!p.isMobile&&<HeaderSearch t={t} search={p.search} setSearch={p.setSearch} leads={p.leads} dailyRequests={p.dailyRequests} onLeadClick={p.onLeadClick} onDRClick={p.onDRItemClick||p.onDRClick}/>}
      
      {/* BELL 3 — Deal notifications: admin + sales_admin + team_leader */}
      {(p.isAdmin||p.cu&&(p.cu.role==="sales_admin"||p.cu.role==="team_leader"))&&<div ref={dealNotifRef} style={{ position:"relative" }}>
        <button onClick={function(){var opening=!p.showDealNotif;p.setShowDealNotif(opening);if(opening){p.setShowNotif(false);if(p.setShowRotNotif)p.setShowRotNotif(false);if(p.onDealNotifSeen)p.onDealNotifSeen();}}} style={{ width:36, height:36, borderRadius:9, border:"1px solid #E8ECF1", background:p.unseenDeals>0?"#F0FDF4":"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", transition:"all 0.2s" }}>
          <DollarSign size={16} color={p.unseenDeals>0?"#15803D":C.textLight}/>
          {p.unseenDeals>0&&!p.showDealNotif&&<span style={{ position:"absolute", top:-2, right:-2, minWidth:17, height:17, borderRadius:9, background:"#15803D", color:"#fff", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", border:"2px solid #fff" }}>{p.unseenDeals>9?"9+":p.unseenDeals}</span>}
        </button>
        {p.showDealNotif&&<div style={{ position:"absolute", top:46, right:0, width:340, background:"#fff", borderRadius:16, boxShadow:"0 16px 48px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)", zIndex:200, maxHeight:440, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>💰</span>
              <span style={{ fontWeight:700, fontSize:14, color:C.text }}>Deals & EOI</span>
              {(function(){
                var n = (p.leads||[]).filter(function(l){return !l.archived && (l.status==="EOI"||l.status==="DoneDeal"||l.globalStatus==="eoi"||l.globalStatus==="donedeal") && l.eoiStatus!=="EOI Cancelled";}).length
                      + (p.dailyRequests||[]).filter(function(r){return !r.archived && (r.status==="EOI"||r.status==="DoneDeal") && r.eoiStatus!=="EOI Cancelled";}).length;
                return n>0 ? <span style={{ background:"#F0FDF4", color:"#15803D", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>{n}</span> : null;
              })()}
            </div>
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              {p.unseenDeals>0&&<button onClick={function(){if(p.onDealNotifSeen)p.onDealNotifSeen();}} style={{ background:"#F0FDF4", border:"none", borderRadius:6, cursor:"pointer", fontSize:11, color:"#15803D", fontWeight:600, padding:"4px 10px" }}>Mark Read</button>}
              <button onClick={function(){p.setShowDealNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex", padding:4 }}><X size={15}/></button>
            </div>
          </div>
          <div style={{ overflowY:"auto", flex:1 }}>
            {(function(){
              var items = buildDealItems(p.leads, p.dailyRequests, p.cu, p.myTeamUsers);
              if (items.length===0) return <div style={{ padding:32, textAlign:"center", color:C.textLight, fontSize:13 }}><div style={{ fontSize:28, marginBottom:8 }}>💰</div>No deals yet</div>;
              return items.map(function(n, idx){
                var isDeal = n.kind==="DoneDeal";
                var label = isDeal ? "🎉 Done Deal" : (n.kind==="Approved" ? "✅ Approved EOI" : "⏳ Pending EOI");
                var iconBg = isDeal ? "linear-gradient(135deg,#DCFCE7,#BBF7D0)"
                  : (n.kind==="Approved" ? "linear-gradient(135deg,#D1FAE5,#A7F3D0)" : "linear-gradient(135deg,#FFF7ED,#FED7AA)");
                var iconEmoji = isDeal ? "🎉" : (n.kind==="Approved" ? "✅" : "⏳");
                var openItem = function(){
                  p.setShowDealNotif(false);
                  if (!p.onDealNotifClick) return;
                  var target = (p.leads||[]).find(function(l){return gid(l)===String(n.leadId);}) || { _id: n.leadId, name: n.leadName||"" };
                  var page = isDeal ? "deals" : "eoi";
                  p.onDealNotifClick(page, target);
                };
                return <div key={n._id+"-"+idx} onClick={openItem} style={{ padding:"12px 18px", borderBottom:"1px solid #F8FAFC", display:"flex", alignItems:"center", gap:12, background:"#fff", transition:"background 0.2s", cursor:"pointer" }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>{iconEmoji}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}{n.leadName?" — "+n.leadName:""}</div>
                    <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{n.agentName?"By "+n.agentName:""}{n.budget?" · "+n.budget+" EGP":""}</div>
                    <div style={{ fontSize:10, color:C.textLight, marginTop:1 }}>{timeAgo(n.time,p.t)}</div>
                  </div>
                </div>;
              });
            })()}
          </div>
        </div>}
      </div>}

      {/* BELL 2 — Rotation notifications: admin + sales_admin only */}
      {(p.cu&&(p.cu.role==="admin"||p.cu.role==="sales_admin"))&&<div ref={rotNotifRef} style={{ position:"relative" }}>
        <button onClick={function(){var next=!p.showRotNotif;if(p.setShowRotNotif)p.setShowRotNotif(next);if(next){p.setShowNotif(false);p.setShowDealNotif(false);if(p.onRotNotifSeen)p.onRotNotifSeen();}}} style={{ width:36, height:36, borderRadius:9, border:"1px solid #E8ECF1", background:p.unseenRot>0?"#FFF7ED":"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", transition:"all 0.2s" }}>
          <RotateCcw size={15} color={p.unseenRot>0?"#EA580C":C.textLight}/>
          {p.unseenRot>0&&!p.showRotNotif&&<span style={{ position:"absolute", top:-2, right:-2, minWidth:17, height:17, borderRadius:9, background:"#EA580C", color:"#fff", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", border:"2px solid #fff" }}>{p.unseenRot>9?"9+":p.unseenRot}</span>}
        </button>
        {p.showRotNotif&&<div style={{ position:"absolute", top:46, right:0, width:340, background:"#fff", borderRadius:16, boxShadow:"0 16px 48px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)", zIndex:200, maxHeight:440, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <RotateCcw size={16} color="#EA580C"/>
              <span style={{ fontWeight:700, fontSize:14, color:C.text }}>Rotations</span>
              {p.rotNotifs&&p.rotNotifs.length>0&&<span style={{ background:"#FFF7ED", color:"#EA580C", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>{p.rotNotifs.length}</span>}
            </div>
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              {p.rotNotifs&&p.rotNotifs.length>0&&<button onClick={function(){if(p.onRotClearAll)p.onRotClearAll();}} style={{ background:"#FFF7ED", border:"none", borderRadius:6, cursor:"pointer", fontSize:11, color:"#EA580C", fontWeight:600, padding:"4px 10px" }}>Clear all</button>}
              <button onClick={function(){if(p.setShowRotNotif)p.setShowRotNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex", padding:4 }}><X size={15}/></button>
            </div>
          </div>
          <div style={{ overflowY:"auto", flex:1 }}>
            {(!p.rotNotifs||p.rotNotifs.length===0)&&<div style={{ padding:32, textAlign:"center", color:C.textLight, fontSize:13 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🔄</div>No rotations
            </div>}
            {p.rotNotifs&&p.rotNotifs.map(function(n){
              var canNav = !!n.leadId;
              var openItem = function(){
                if (p.setShowRotNotif) p.setShowRotNotif(false);
                if (!canNav) return;
                // Reuse the same nav + initSelected path Leads page already uses for row clicks.
                var target = (p.leads||[]).find(function(l){return gid(l)===String(n.leadId);}) || { _id: n.leadId, name: n.leadName||"" };
                if (p.onRotNotifClick) p.onRotNotifClick(target);
                else if (p.onLeadClick) p.onLeadClick(target);
              };
              return <div key={n._id||n.id} onClick={canNav?openItem:undefined} style={{ padding:"12px 18px", borderBottom:"1px solid #F8FAFC", display:"flex", alignItems:"center", gap:12, background:n.seen?"#fff":"#FFFBF5", transition:"background 0.2s", cursor:canNav?"pointer":"default" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#FFF7ED,#FFEDD5)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><RotateCcw size={16} color="#EA580C"/></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.leadName}</div>
                  <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{n.fromName} → {n.toName}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                    <span style={{ fontSize:10, color:"#EA580C", fontWeight:600, background:"#FFF7ED", padding:"1px 6px", borderRadius:4 }}>{n.reason}</span>
                    <span style={{ fontSize:10, color:C.textLight }}>{timeAgo(n.createdAt||n.time,p.t)}</span>
                  </div>
                </div>
                {!n.seen&&<div style={{ width:8, height:8, borderRadius:"50%", background:"#EA580C", flexShrink:0 }}/>}
              </div>;
            })}
          </div>
        </div>}
      </div>}

      {/* BELL 1 — Callbacks (isolated component) */}
      <CallbackBell t={p.t} leads={p.leads} dailyRequests={p.dailyRequests} cu={p.cu} myTeamUsers={p.myTeamUsers} showNotif={p.showNotif} setShowNotif={p.setShowNotif} setShowDealNotif={p.setShowDealNotif} setShowRotNotif={p.setShowRotNotif} onLeadClick={p.onLeadClick} onDRClick={p.onDRClick}/>
    </div>
  </div>
  {p.isMobile&&<div style={{ padding:"8px", background:"#fff", borderBottom:"1px solid #E5E7EB" }}>
    <HeaderSearch width="100%" t={t} search={p.search} setSearch={p.setSearch} leads={p.leads} dailyRequests={p.dailyRequests} onLeadClick={p.onLeadClick} onDRClick={p.onDRItemClick||p.onDRClick}/>
  </div>}
  </div>;
};

// ===== LEAD FORM (shared for add/edit) =====
var LeadForm = function(p) {
  var t = p.t; var isAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader";
  var salesUsers = p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
  var [form, setForm] = useState((function(){
    var base = p.initial||{ name:"", phone:"", phone2:"", email:"", budget:"", project:"", source:p.isReq?"Daily Request":"Facebook", agentId:"", callbackTime:"", notes:"", status:"Potential", dealDate:"", eoiDate:"", eoiDeposit:"", downPaymentPct:"", installmentYears:"" };
    // Load saved extra fields from localStorage if editing a deal
    if(p.editId){
      var extra=getDealExtra(String(p.editId));
      if(extra) base=Object.assign({},base,{downPaymentPct:extra.downPaymentPct||"",installmentYears:extra.installmentYears||"",dealDate:extra.dealDate||""});
      // Also read dealDate from lead object if available
      if(p.initial&&p.initial.dealDate&&!base.dealDate) base=Object.assign({},base,{dealDate:p.initial.dealDate});
    }
    return base;
  })());
  var [dupWarning, setDupWarning] = useState(null);
  var [saving, setSaving] = useState(false);
  // Synchronous inflight guard — the button's disabled attribute depends on
  // React state, which isn't committed to the DOM until after the current
  // event loop tick, so a second click that fires before React commits could
  // still slip through. A ref gives us a same-tick check that blocks the
  // second submission before it ever hits the network.
  var inflight = useRef(false);
  var isReq = p.isReq||false;
  // Effective status: forced initialStatus (EOI / Deals pages) wins, else edited lead's status,
  // else the form's own status picker (Add Lead modal). Lets EOI/DoneDeal-gated UI react live.
  var effectiveStatus = p.initialStatus || (p.editId&&p.initial ? p.initial.status : form.status) || "";
  var isEOIForm = effectiveStatus==="EOI";
  var isDoneDealForm = effectiveStatus==="DoneDeal";
  // Only Add Lead (no forced status, not editing) shows a status picker.
  var showStatusPicker = !p.initialStatus && !p.editId;

  var checkDup = async function(phone) {
    if (phone.length < 8) { setDupWarning(null); return; }
    try {
      var res = await apiFetch("/api/leads/check-duplicate/"+encodeURIComponent(phone), "GET", null, p.token);
      if (res.exists && (!p.editId || gid(res.lead) !== p.editId)) setDupWarning(res.lead);
      else setDupWarning(null);
    } catch(e) { setDupWarning(null); }
  };

  var upd = function(k, v) { setForm(function(f){return Object.assign({},f,{[k]:v});}); };

  var submit = async function() {
    // Block any second entry within the same async submission — ref check
    // runs synchronously so it wins races that the React state can't.
    if (inflight.current) return;
    if (!form.name||!form.phone) return;
    if (isEOIForm && !form.budget) { alert("Please enter the Amount (EGP)"); return; }
    if (isEOIForm && !form.project) { alert("Please enter the Project"); return; }
    if (isEOIForm && !form.eoiDeposit) { alert("Please enter the Deposit (EGP)"); return; }
    inflight.current = true;
    setSaving(true);
    try {
      var payload = Object.assign({}, form, { source: isReq?"Daily Request":form.source, agentId: form.agentId||"", status: p.editId ? (form.status||"Potential") : (p.initialStatus||form.status||"NewLead"), phone2: form.phone2||"" });
      // Strip client-only fields the API doesn't need
      delete payload.documentFiles;
      // Managerial roles editing an existing lead: strip notes/lastFeedback
      // — the backend now hard-rejects those fields via PUT for these roles
      // (admin/sales_admin/manager). They use the dedicated feedback flow on
      // the lead detail panel instead. sales_admin is fully read-only on
      // feedback so this strip applies to all three. team_leader is allowed
      // through PUT only when the lead is their own personal book; otherwise
      // they should use the feedback button as well — strip here to avoid
      // hitting the backend 400 on team-lead edits.
      if (p.editId && p.cu) {
        var cuRole = p.cu.role;
        var leadAgentId = (p.initial && p.initial.agentId && p.initial.agentId._id ? p.initial.agentId._id : (p.initial && p.initial.agentId)) || "";
        var tlOnOwn = cuRole === "team_leader" && String(leadAgentId) === String(p.cu.id || "");
        var stripFeedback = (cuRole === "admin" || cuRole === "sales_admin" || cuRole === "manager")
          || (cuRole === "team_leader" && !tlOnOwn);
        if (stripFeedback) {
          delete payload.notes;
          delete payload.lastFeedback;
        }
      }
      // Keep deal metadata in payload so it saves to DB
      var result = p.editId
        ? await apiFetch("/api/leads/"+p.editId, "PUT", payload, p.token, p.csrfToken)
        : await apiFetch("/api/leads", "POST", payload, p.token, p.csrfToken);
      // Also save extra deal fields to localStorage as backup
      if(result && result._id && (form.downPaymentPct||form.installmentYears||form.dealDate)){
        saveDealExtra(String(result._id),{downPaymentPct:form.downPaymentPct||"",installmentYears:form.installmentYears||"",dealDate:form.dealDate||""});
      }
      if (payload.phone2) {
        result.phone2 = payload.phone2;
        // Cache phone2 in localStorage
        try {
          var cache = JSON.parse(localStorage.getItem('phone2_cache')||'{}');
          if (result._id) cache[String(result._id)] = payload.phone2;
          localStorage.setItem('phone2_cache', JSON.stringify(cache));
        } catch(e) {}
      }
      // Upload any documents attached in the form (EOI or DoneDeal)
      if (result && result._id && Array.isArray(form.documentFiles) && form.documentFiles.length>0) {
        for (var di=0; di<form.documentFiles.length; di++) {
          var ff = form.documentFiles[di];
          if (!ff || !ff.fileData) continue;
          try {
            var withDocs = await apiFetch("/api/leads/"+gid(result)+"/eoi-documents","POST",{fileData:ff.fileData, fileName:ff.fileName||""},p.token);
            if (withDocs && withDocs._id) result = withDocs;
          } catch(docErr) { console.error("Document upload failed:", docErr.message); }
        }
      }
      p.onSave(result);
    } catch(e) { alert(e.message); }
    inflight.current = false;
    setSaving(false);
  };

  return <div>
    {dupWarning&&<div style={{ marginBottom:14, padding:"10px 14px", background:"#FEF3C7", borderRadius:10, fontSize:13, fontWeight:500, color:"#B45309", display:"flex", alignItems:"center", gap:8 }}>
      <AlertCircle size={16}/> {t.duplicateFound} — <b>{dupWarning.name}</b>
    </div>}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
      <div style={{ gridColumn:"1/-1" }}><Inp label={t.name} req value={form.name} onChange={function(e){upd("name",e.target.value);}}/></div>
      <Inp label={t.phone} req value={form.phone} onChange={function(e){upd("phone",e.target.value);checkDup(e.target.value);}} placeholder=""/>
      <Inp label={t.phone2} value={form.phone2||""} onChange={function(e){upd("phone2",e.target.value);}} placeholder=""/>
      <Inp label={t.email} value={form.email} onChange={function(e){upd("email",e.target.value);}}/>
      <Inp label={isEOIForm?"💰 Amount (EGP)":t.budget} req={isEOIForm} value={form.budget} onChange={function(e){var raw=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");upd("budget",raw?Number(raw).toLocaleString():"");}}/>
    </div>
    <Inp label="Campaign Name" value={form.campaign||""} onChange={function(e){upd("campaign",e.target.value);}} placeholder="e.g. Campaign A April"/>
    {showStatusPicker&&<Inp label="Status" type="select" value={form.status||"NewLead"} onChange={function(e){upd("status",e.target.value);}} options={[
      {value:"NewLead",label:"New Lead"},
      {value:"Potential",label:"Potential"},
      {value:"HotCase",label:"Hot Case"},
      {value:"EOI",label:"EOI"},
      {value:"DoneDeal",label:"Done Deal"}
    ]}/>}
    <Inp label={t.project} req={isEOIForm} value={form.project||""} onChange={function(e){upd("project",e.target.value);}} placeholder=""/>
    {!isReq&&<Inp label={t.source} type="select" value={form.source} onChange={function(e){upd("source",e.target.value);}} options={SOURCES.map(function(x){return{value:x,label:x};})}/>}
    {isAdmin&&<Inp label={t.agent} type="select" value={form.agentId} onChange={function(e){upd("agentId",e.target.value);}} options={[{value:"",label:"- Select -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name+" - "+u.title};}))}/>}
    {isEOIForm&&<Inp label="📅 EOI Date" type="date" value={form.eoiDate||""} onChange={function(e){upd("eoiDate",e.target.value);}}/>}
    {isEOIForm&&<Inp label="💵 Deposit (EGP)" req value={form.eoiDeposit||""} onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");upd("eoiDeposit",r?Number(r).toLocaleString():"");}} placeholder=""/>}
    {!isEOIForm&&!isDoneDealForm&&<Inp label={t.callbackTime} type="datetime-local" value={form.callbackTime} onChange={function(e){upd("callbackTime",e.target.value);}}/>}
    <Inp label={t.notes} type="textarea" value={form.notes} onChange={function(e){upd("notes",e.target.value);}}/>
    {isDoneDealForm&&<Inp label="Deal Date" type="date" value={form.dealDate||""} onChange={function(e){upd("dealDate",e.target.value);}}/>}
    {isDoneDealForm&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
      <Inp label="Down Payment %" value={form.downPaymentPct||""} onChange={function(e){upd("downPaymentPct",e.target.value.replace(/[^0-9.]/g,""));}} placeholder="e.g. 10"/>
      <Inp label="Installment Years" value={form.installmentYears||""} onChange={function(e){upd("installmentYears",e.target.value.replace(/[^0-9]/g,""));}} placeholder="e.g. 7"/>
    </div>}
    {(isEOIForm||isDoneDealForm)&&<DocumentsUpload
      files={form.documentFiles||[]}
      onChange={function(next){upd("documentFiles",next);}}
      label={isEOIForm?"📎 Upload EOI Documents":"📎 Upload Deal Documents"}
    />}
    <div style={{ display:"flex", gap:10 }}>
      <Btn outline onClick={p.onClose} style={{ flex:1 }}>{t.cancel}</Btn>
      <Btn onClick={submit} loading={saving} style={{ flex:1 }}>{p.editId?t.save:t.add}</Btn>
    </div>
  </div>;
};



// ===== BROWSER NOTIFICATIONS =====
var requestNotifPermission = async function() {
  if (!("Notification" in window)) {
    alert("❌ Notifications are not supported on this browser.\n\nOn iPhone: use Safari and add the app to your Home Screen first (Share → Add to Home Screen), then try again.\n\nOn Android: use Chrome browser.");
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") {
    alert("❌ Notifications are blocked.\n\nPlease go to your browser settings and allow notifications for this site.");
    return false;
  }
  try {
    var perm = await Notification.requestPermission();
    if (perm === "granted") { alert("✅ Notifications enabled successfully!"); return true; }
    else { alert("❌ Notification permission was denied."); return false; }
  } catch(e) {
    alert("❌ Could not request notification permission.\n\nTry opening the site in Chrome.");
    return false;
  }
};
var showBrowserNotif = function(title, body, onClick) {
  if (Notification.permission !== "granted") return;
  var n = new Notification(title, { body: body, icon: "/favicon.ico", badge: "/favicon.ico" });
  if (onClick) n.onclick = onClick;
  setTimeout(function() { n.close(); }, 8000);
};
var playAlertSound = function() {
  try {
    var ctx = new (window.AudioContext||window.webkitAudioContext)();
    var o = ctx.createOscillator(); var g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(660, ctx.currentTime+0.1);
    o.frequency.setValueAtTime(880, ctx.currentTime+0.2);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.4);
    o.start(ctx.currentTime); o.stop(ctx.currentTime+0.4);
  } catch(e) {}
};


// ===== WHATSAPP TEMPLATES =====
var WA_TEMPLATES_AR = [
  { id:1, label:"ترحيب", text:"أهلاً {name} 👋\nأنا {agent} من شركة ARO Investment\nشكراً لاهتمامك بمشروع {project}\nمتى يناسبك نتكلم؟" },
  { id:2, label:"متابعة", text:"أهلاً {name}\nبتواصل معاكم بخصوص عرضنا على {project}\nهل عندك وقت نتكلم؟ 🏠" },
  { id:3, label:"عرض خاص", text:"🎯 عرض خاص لـ {name}\nلدينا وحدات محدودة في {project}\nبسعر مميز - تواصل معنا الآن! 📞" },
  { id:4, label:"Confirm موعد", text:"أهلاً {name} 😊\nبتذكيرك بموعدنا غداً\nنتطلع لنراك! ✅" },
  { id:5, label:"بعد الاجتماع", text:"شكراً {name} على وقتك الكريم 🙏\nيسعدني خدمتك دائماً\nلو عندك أي استفسار أنا دايماً موجود" },
];

var fillTemplate = function(template, lead, agentName) {
  return template
    .replace(/{name}/g, lead.name || "")
    .replace(/{agent}/g, agentName || "")
    .replace(/{project}/g, lead.project || "");
};

// ===== EXPORT EXCEL =====
var exportLeadsToExcel = async function(leads, users, filename) {
  var XLSX = await new Promise(function(resolve) {
    if (window.XLSX) { resolve(window.XLSX); return; }
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = function() { resolve(window.XLSX); };
    document.head.appendChild(s);
  });
  var getAgentName = function(lead) {
    if (!lead.agentId) return "";
    if (lead.agentId.name) return lead.agentId.name;
    var u = users.find(function(x) { return gid(x) === lead.agentId; });
    return u ? u.name : "";
  };
  var rows = leads.map(function(l) { return {
    "Name": l.name,
    "Phone": l.phone,
    "Alt. Phone": l.phone2 || "",
    "Email": l.email || "",
    "Project": l.project || "",
    "Status": l.status || "",
    "Source": l.source || "",
    "Budget": l.budget || "",
    "Agent": getAgentName(l),
    "VIP": l.isVIP ? "Yes" : "",
    "Notes": l.notes || "",
    "Callback": l.callbackTime ? l.callbackTime.slice(0,16).replace("T"," ") : "",
    "Last Activity": l.lastActivityTime ? new Date(l.lastActivityTime).toLocaleDateString("en-GB") : "",
    "Date Added": l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-GB") : "",
  };});
  var ws = XLSX.utils.json_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, (filename || "leads") + "_" + new Date().toISOString().slice(0,10) + ".xlsx");
};


var callbackColor = function(cbTime) {
  if (!cbTime) return null;
  var diff = new Date(cbTime).getTime() - Date.now();
  var mins = diff / 60000;
  if (mins < 0) return { bg:"#FEE2E2", color:"#DC2626", label:"⚠️ Overdue" };
  if (mins < 60) return { bg:"#FEF3C7", color:"#D97706", label:"🔔 Within 1hr" };
  if (mins < 1440) return { bg:"#DCFCE7", color:"#15803D", label:"✅ Today" };
  return null;
};


// ===== QUICK PHONE SEARCH =====
var QuickPhoneSearch = function(p) {
  var [show,setShow]=useState(false);
  var [q,setQ]=useState("");
  var leadResults=q.length>=4?p.leads.filter(function(l){
    return (l.phone&&(l.phone.includes(q)||l.phone.endsWith(q)))||(l.phone2&&(l.phone2.includes(q)||l.phone2.endsWith(q)));
  }):[];
  var drResults=q.length>=4?(p.dailyReqs||[]).filter(function(r){
    return (r.phone&&(r.phone.includes(q)||r.phone.endsWith(q)))||(r.phone2&&(r.phone2.includes(q)||r.phone2.endsWith(q)));
  }):[];
  var sc=STATUSES(p.t);
  var drSc=DR_STATUSES(p.t);
  var totalResults=leadResults.length+drResults.length;
  var renderCard=function(l,onClick,statuses){
    var so=statuses.find(function(s){return s.value===l.status;})||statuses[0];
    return <div key={gid(l)} onClick={function(){onClick(l);setShow(false);setQ("");}} style={{ padding:"12px 14px", borderRadius:12, border:"1px solid #E8ECF1", marginBottom:8, cursor:"pointer", background:"#FAFBFC" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontWeight:700, fontSize:14 }}>{l.name}</div>
        <span style={{ background:so.bg, color:so.color, padding:"2px 8px", borderRadius:12, fontSize:11, fontWeight:600 }}>{so.label}</span>
      </div>
      <div style={{ fontSize:12, color:"#64748B", marginTop:4, direction:"ltr" }}>{l.phone}</div>
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <a href={"tel:"+cleanPhone(l.phone)} onClick={function(e){e.stopPropagation();}} style={{ flex:1, padding:"6px", borderRadius:8, background:"#EFF6FF", color:"#60A5FA", fontSize:12, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>📞 Call</a>
        <a href={"https://wa.me/"+waPhone(l.phone)} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ flex:1, padding:"6px", borderRadius:8, background:"#DCFCE7", color:"#25D366", fontSize:12, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp</a>
      </div>
    </div>;
  };
  if(!show)return <button onClick={function(){setShow(true);}} style={{ position:"fixed", bottom:24, right:24, zIndex:300, width:46, height:46, borderRadius:"50%", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", border:"1.5px solid rgba(255,255,255,0.35)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 16px rgba(0,0,0,0.18)" }} title="Quick Phone Search"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg></button>;
  return <div style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={function(){setShow(false);setQ("");}}>
    <div style={{ background:"#fff", borderRadius:18, padding:20, width:340, maxWidth:"90vw", maxHeight:"80vh", overflow:"auto" }} onClick={function(e){e.stopPropagation();}}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:700 }}>📞 Quick Phone Search</div>
        <button onClick={function(){setShow(false);setQ("");}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#94A3B8" }}>✕</button>
      </div>
      <input autoFocus value={q} onChange={function(e){setQ(e.target.value);}} placeholder="Enter last 4 digits or full number..." style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", direction:"ltr", marginBottom:12 }}/>
      {q.length>0&&q.length<4&&<div style={{ fontSize:12, color:"#94A3B8", textAlign:"center", marginBottom:10 }}>Type at least 4 digits</div>}
      {totalResults===0&&q.length>=4&&<div style={{ fontSize:13, color:"#94A3B8", textAlign:"center", padding:20 }}>No results</div>}
      {leadResults.length>0&&<div>
        <div style={{ fontSize:12, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Leads ({leadResults.length})</div>
        {leadResults.map(function(l){return renderCard(l,p.onSelect,sc);})}
      </div>}
      {drResults.length>0&&<div style={{ marginTop:leadResults.length>0?12:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#8B5CF6", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Daily Requests ({drResults.length})</div>
        {drResults.map(function(r){return renderCard(r,p.onSelectDR,drSc);})}
      </div>}
    </div>
  </div>;
};


// Phone cell with hover reveal
var PhoneCell = function(p) {
  var [show, setShow] = useState(false);
  if (!p.phone) return <span style={{ color:"#CBD5E1" }}>-</span>;
  var masked = (function(){
    var ph = p.phone;
    if(ph.length < 7) return ph.slice(0,2) + "****";
    // show first 3, mask 2, show 2, mask last 4
    return ph.slice(0,3) + "**" + ph.slice(5,7) + "****";
  })();
  return <span
    onMouseEnter={function(){setShow(true);}}
    onMouseLeave={function(){setShow(false);}}
    style={{ cursor:"pointer", direction:"ltr", letterSpacing:1, userSelect:show?"text":"none" }}
    title="Hover to show"
  >{show ? p.phone : masked}</span>;
};

// ===== LEAD JOURNEY =====
// Unified grouped-by-agent-era view of a lead's audit trail. Replaces the old
// rotation-history card, side-panel activity list, and full-history modal body.
var LeadJourney = function(p) {
  var events = p.events || [];
  var lead = p.lead;
  var isAdmin = p.isAdminRole;
  var currentUser = p.currentUser;
  var allUsers = p.allUsers || [];
  var variant = p.variant || "panel";
  var isPanel = variant === "panel";
  var setShowCompare = p.setShowCompare || function(){};

  var bodyFs = isPanel ? 11 : 12;
  var metaFs = isPanel ? 10 : 11;
  var eraPad = isPanel ? "10px 12px" : "14px 16px";
  var maxW = isPanel ? "100%" : 620;

  var statusLabelMap = {
    NewLead:"New Lead", NoAnswer:"No Answer", NotInterested:"Not Interested",
    CallBack:"Call Back", HotCase:"Hot Case", MeetingDone:"Meeting Done", DoneDeal:"Done Deal"
  };
  var statusColorMap = {
    NewLead:"#5F5E5A", Potential:"#185FA5", NoAnswer:"#854F0B", NotInterested:"#A32D2D",
    CallBack:"#BA7517", HotCase:"#D85A30", MeetingDone:"#0F6E56", DoneDeal:"#04342C", EOI:"#04342C",
    "New Lead":"#5F5E5A","No Answer":"#854F0B","Not Interested":"#A32D2D","Call Back":"#BA7517",
    "Hot Case":"#D85A30","Meeting Done":"#0F6E56","Done Deal":"#04342C","Deal Cancelled":"#A32D2D"
  };
  var sLabel = function(s){ return statusLabelMap[s] || s || "New Lead"; };
  var sColor = function(s){ return statusColorMap[s] || statusColorMap[sLabel(s)] || "#5F5E5A"; };
  var extractStatus = function(ev){
    if (!ev) return null;
    if (ev.toStatus) return ev.toStatus;
    if (ev.status) return ev.status;
    var note = ev.note || "";
    var m = note.match(/^\s*\[([^\]]+)\]/);
    if (m) return m[1].trim();
    // History description form: "Status changed X → Y by Z" (X may be "—"
    // when no prior status). Captures the destination status only.
    var m2 = note.match(/Status\s+changed\s+\S+\s+(?:→|->)\s+(\S+?)(?:\s+by\s+|\s*$)/i);
    if (m2) return m2[1].trim();
    return null;
  };
  var extractFromStatus = function(ev){
    if (!ev) return null;
    if (ev.fromStatus) return ev.fromStatus;
    var note = ev.note || "";
    var m = note.match(/Status\s+changed\s+(\S+?)\s+(?:→|->)\s+\S+/i);
    if (m && m[1] !== "—") return m[1].trim();
    return null;
  };
  var parseReason = function(note){
    if (!note) return null;
    var m = note.match(/\(([^)]+)\)\s*$/);
    return m ? m[1].trim() : null;
  };
  var isAutoReason = function(note){ return /by\s+System|\bauto\b/i.test(note||""); };
  // Strip "Feedback by <name>: " / "Note by <name>: " prefixes the backend
  // bakes into history-source descriptions. The era header already shows
  // the agent's name and avatar, so the prefix is redundant noise inside
  // the muted body panel. Display-only — the stored value is unchanged.
  var stripActorPrefix = function(text){
    if (text == null) return text;
    return String(text)
      .replace(/^Feedback\s+by\s+[^:]+:\s*/i, "")
      .replace(/^Note\s+by\s+[^:]+:\s*/i, "");
  };
  var fmtTs = function(d){
    if (!d) return "";
    var dt = new Date(d);
    return dt.toLocaleString("en-US",{month:"short",day:"numeric"}) + " · " +
      dt.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  };
  var fmtShort = function(d){
    if (!d) return "";
    return new Date(d).toLocaleString("en-US",{month:"short",day:"numeric"});
  };
  var fmtRange = function(start, end, isCurrent){
    var s = fmtShort(start);
    var e = isCurrent ? "now" : fmtShort(end);
    if (s && e) return s + " – " + e;
    return s || e || "";
  };

  // Per-era expand/collapse state. Keyed by the era's index in the rendered
  // order. Default empty → all eras start collapsed (showing newest 5).
  var [expandedEras, setExpandedEras] = useState({});

  // Two events share an actor when their userId._ids match (preferred) or,
  // when _ids are missing on either side, when their userId.names match.
  var sameActor = function(a, b){
    if (!a || !b || !a.userId || !b.userId) return false;
    if (a.userId._id && b.userId._id) return String(a.userId._id) === String(b.userId._id);
    if (a.userId.name && b.userId.name) return a.userId.name === b.userId.name;
    return false;
  };

  // Parse a rotation event into { isAuto, actor, reason }. Note formats
  // emitted by the backend look like:
  //   "Rotated from X to Y by System (3x No Answer)"            (auto, explicit)
  //   "Rotated from X to Y by <outgoing agent> (3x_no_answer)"  (auto, cron impersonates outgoing)
  //   "Rotated from X to Y by <admin name>"                     (manual)
  //   "Rotated from X to Y by <admin name> (<reason>)"          (manual)
  //   "Bulk redistribution — reassigned to <name> by <name>"    (manual bulk)
  //   "Auto Rotation | From: X → To: Y | Reason: <reason>"      (auto, alt)
  // The cron runs as the OUTGOING sales agent, so notes can read "by <agent>"
  // even on auto rotations. Cover that with: any auto-reason marker in the
  // note OR the actor's role being sales/team_leader (neither can manually
  // rotate, so a rotation logged with that actor must be the cron).
  var parseRotation = function(ev){
    var note = (ev && ev.note) || "";
    if (!note) return { isAuto: false, actor: null, reason: null };
    var hasAutoRot = /auto\s*rotation/i.test(note);
    // Auto markers — explicit "by System" wording AND every reason code/keyword
    // that translateAutoReason recognizes (timeout, 3x no answer, not
    // interested streak, callback overdue, cooldown), plus rotation-cron
    // wording. Whitespace, hyphen, and underscore variants all match.
    var hasAutoMarker = /by\s+system|auto[\s\-_]?rotat|auto[\s\-_]?timeout|rotation[\s\-_]?cron|3x[\s\-_]?no[\s\-_]?answer|not[\s\-_]?interested[\s\-_]?streak|callback[\s\-_]?overdue|cooldown/i.test(note);
    // Resolve the actor's role. Activity / history rows don't populate
    // userId.role, so fall back to looking up the actor by name in allUsers.
    var actorRole = "";
    if (ev && ev.userId && ev.userId.role) {
      actorRole = String(ev.userId.role);
    } else if (ev && ev.userId && ev.userId.name) {
      var u = (allUsers || []).find(function(x){ return x && x.name === ev.userId.name; });
      if (u && u.role) actorRole = String(u.role);
    }
    var actorIsSales = actorRole === "sales" || actorRole === "team_leader";
    var isAuto = hasAutoMarker || actorIsSales;
    var actor = null;
    if (hasAutoRot) {
      actor = "System";
    } else if (!isAuto) {
      var byMatch = note.match(/by\s+(.+?)(?:\s*\(|$)/i);
      if (byMatch) actor = byMatch[1].trim();
    }
    var reason = null;
    var lastParen = note.match(/\(([^)]+)\)\s*$/);
    if (lastParen) {
      reason = lastParen[1].trim();
    } else {
      var rMatch = note.match(/Reason:\s*(.+?)(?:\s*\||$)/i);
      if (rMatch) reason = rMatch[1].trim();
    }
    return { isAuto: isAuto, actor: actor, reason: reason };
  };

  // Translate raw auto-rotation reason codes (the parenthesized substring of
  // the rotation note) into human-readable English. Substring + case-
  // insensitive so we match whether the backend writes "no_action_timeout",
  // "No Action Timeout", or "auto_timeout (legacy)". Empty input returns
  // the "no reason recorded" fallback used when an auto rotation didn't
  // supply a reason. Manual reasons are NOT translated — they're admin
  // free-text.
  // Order matters: the rule-specific codes are checked before the legacy
  // generic ones because "no_action_timeout" contains "timeout" and would
  // otherwise be swallowed by the legacy fallback.
  var translateAutoReason = function(raw){
    if (!raw || !String(raw).trim()) return "No reason recorded";
    var s = String(raw).toLowerCase();
    // Rule-specific codes — the actual rule that fired (Phase BB).
    if (s.indexOf("no_answer_streak") !== -1)      return "No-Answer threshold reached";
    if (s.indexOf("not_interested_return") !== -1) return "Not Interested cooldown ended";
    if (s.indexOf("no_action_timeout") !== -1)     return "No action taken on the lead";
    if (s.indexOf("callback_overdue") !== -1 || s.indexOf("callback overdue") !== -1) return "Callback time passed";
    if (s.indexOf("hot_no_action") !== -1)         return "No action on Hot/Potential/Meeting lead";
    // Legacy fallbacks — pre-Phase BB history entries used generic codes.
    // Map them to the same human-readable strings so old rotations render
    // consistently with new ones.
    if (s.indexOf("3x no answer") !== -1 || s.indexOf("3x_no_answer") !== -1)               return "No-Answer threshold reached";
    if (s.indexOf("not interested streak") !== -1 || s.indexOf("not_interested_streak") !== -1) return "Not Interested cooldown ended";
    if (s.indexOf("auto_timeout") !== -1 || s.indexOf("timeout") !== -1)                    return "No action taken on the lead";
    if (s.indexOf("cooldown") !== -1) return "Cooldown expired, redistributed";
    return raw;
  };

  // Map a User.role enum value to a display label. Returns null for unknown
  // or missing roles — callers omit the parenthesized role suffix in that
  // case rather than guessing.
  var roleLabel = function(role){
    if (!role) return null;
    var map = { admin:"Admin", sales_admin:"Sales Admin", manager:"Manager", director:"Director", team_leader:"Team Leader", sales:"Sales" };
    return map[role] || null;
  };

  var sorted = events.slice().sort(function(a,b){
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  // Resolve the actual lead-holder for an assignment event. The backend
  // stamps userId.name with the ACTOR (could be an admin pressing "rotate"),
  // and agentName with h.toAgent (the sales person actually receiving the
  // lead). Era ownership must follow agentName, not userId.name.
  var resolveAgentName = function(ev){
    if (ev.agentName && String(ev.agentName).trim()) return String(ev.agentName).trim();
    if (ev.toAgent && String(ev.toAgent).trim()) return String(ev.toAgent).trim();
    if (ev.source !== "history" && ev.userId && ev.userId.name) return ev.userId.name;
    return "Unknown";
  };

  // Resolve the receiving agent's _id for an assignment event. History rows
  // only carry the receiver's NAME (h.toAgent), so we look up the _id via
  // allUsers by name. Activity-source assignment rows often hold the actor
  // (admin) on userId, not the receiver — same name-lookup path is safer.
  var resolveAgentId = function(ev){
    var n = (ev.agentName && String(ev.agentName).trim()) ||
            (ev.toAgent && String(ev.toAgent).trim()) ||
            (ev.source !== "history" && ev.userId && ev.userId.name) || "";
    if (n) {
      var u = (allUsers || []).find(function(x){ return x && x.name === n; });
      if (u && u._id) return String(u._id);
    }
    if (ev.source !== "history" && ev.userId && ev.userId._id) return String(ev.userId._id);
    return "";
  };

  // Resolve the AUTHOR _id of any event. Activity rows populate userId._id;
  // history rows carry only userId.name (= h.byUser) → name lookup; synthesized
  // assignmentEntries already include _id. Returns "" when the author can't be
  // identified (e.g. system-only rows with no actor name).
  var resolveAuthorId = function(ev){
    if (!ev || !ev.userId) return "";
    if (ev.userId._id) return String(ev.userId._id);
    if (typeof ev.userId === "string") return ev.userId;
    if (ev.userId.name) {
      var u = (allUsers || []).find(function(x){ return x && x.name === ev.userId.name; });
      if (u && u._id) return String(u._id);
    }
    return "";
  };

  var eras = [];
  var cur = null;
  sorted.forEach(function(ev){
    var type = ev.type;
    var isAssign = type==="assigned" || type==="first_assigned" || type==="rotated" || type==="reassigned";
    if (isAssign) {
      var note = ev.note || "";
      var rotMeta = parseRotation(ev);
      cur = {
        agentName: resolveAgentName(ev),
        agentId: resolveAgentId(ev),
        fromAgent: ev.fromAgent || null,
        assignType: type,
        isRotation: type==="rotated" || type==="reassigned",
        reason: parseReason(note),
        auto: rotMeta.isAuto ? "auto" : "manual",
        rotationMeta: rotMeta,
        actor: ev.userId ? { name: ev.userId.name || null, role: ev.userId.role || null } : null,
        source: ev.source || ((type==="first_assigned" && lead) ? lead.source : null),
        startedAt: ev.createdAt,
        endedAt: ev.createdAt,
        events: [ev]
      };
      eras.push(cur);
    } else if (cur) {
      // Route the event to the era of the agent who actually authored it,
      // not just the era that happens to be open at this timestamp. The
      // backend sometimes surfaces a previous holder's slice writes (via
      // assignments[] synthesis) at timestamps that fall inside a later
      // holder's era — those rows belong in the prior holder's era, not
      // the current one.
      var evUid = resolveAuthorId(ev);
      var curEraAgentId = cur.agentId ? String(cur.agentId) : "";
      if (!evUid || !curEraAgentId || evUid === curEraAgentId) {
        cur.events.push(ev);
        cur.endedAt = ev.createdAt;
      } else {
        var targetEra = null;
        for (var bi = eras.length - 1; bi >= 0; bi--) {
          var prevEra = eras[bi];
          var prevAgentId = prevEra.agentId ? String(prevEra.agentId) : "";
          if (prevAgentId && prevAgentId === evUid) { targetEra = prevEra; break; }
        }
        if (targetEra) {
          targetEra.events.push(ev);
          // Don't update endedAt of past era — preserve its boundary.
        } else {
          cur.events.push(ev);
          cur.endedAt = ev.createdAt;
        }
      }
    } else {
      cur = {
        agentName: (ev.userId && ev.userId.name) || (lead && lead.agentId && lead.agentId.name) || "Unknown",
        agentId: resolveAuthorId(ev),
        fromAgent: null,
        assignType: null,
        isRotation: false,
        reason: null,
        auto: null,
        source: lead ? lead.source : null,
        startedAt: ev.createdAt,
        endedAt: ev.createdAt,
        events: [ev]
      };
      eras.push(cur);
    }
  });

  // Map an event type to its logical category. The backend writes a single
  // user gesture as several typed rows (status_change in Activity vs.
  // status_changed in history; feedback in Activity vs. feedback_added in
  // history). Bucketing by category lets dedup collapse those duplicates.
  var eventCategory = function(t){
    if (t === "feedback" || t === "feedback_added") return "feedback";
    if (t === "note") return "note";
    if (t === "status_change" || t === "status_changed") return "status_change";
    if (t === "callback_scheduled") return "callback";
    if (t === "call") return "call";
    if (t === "meeting") return "meeting";
    return t || "other";
  };
  // Cross-category whitelist: when the same actor writes the same non-empty
  // content as both a note and a feedback (or status_change), within 10s,
  // it's the same logical gesture surfaced through different sinks. Other
  // category pairings stay segregated.
  var ALLOWED_CROSS_CAT = {
    "note|feedback":1, "feedback|note":1,
    "note|status_change":1, "status_change|note":1,
    "feedback|status_change":1, "status_change|feedback":1
  };

  // Dedupe events within each era. Backend writes some logical actions to
  // BOTH the Activity collection and lead.history; the merged feed surfaces
  // both copies. Match: same logical category (or one of the allowed
  // cross-category pairs above), same actor, same non-empty content,
  // timestamps within 10s. Keep the earliest occurrence.
  // Status-change special case: two status_change rows with the same
  // target status, same actor, within 10s collapse even when their note
  // text differs (Activity row writes "[CallBack] note" while history
  // row writes "Status changed X → Y by Z"). Prefer the row that carries
  // BOTH from and to states — it shows the transition.
  eras.forEach(function(era){
    var keep = [];
    for (var di = 0; di < era.events.length; di++) {
      var dEv = era.events[di];
      var dContent = String(dEv.note || dEv.feedback || "").trim();
      var dT = new Date(dEv.createdAt).getTime();
      var dCat = eventCategory(dEv.type);
      var isDup = false;
      var replaceIdx = -1;
      for (var dj = 0; dj < keep.length; dj++) {
        var pe = keep[dj];
        var cA = eventCategory(pe.type), cB = dCat;
        var peT = new Date(pe.createdAt).getTime();
        // Status-change merger — runs before the content-based path so it
        // catches Activity ↔ history pairs whose note strings don't match.
        if (cA === "status_change" && cB === "status_change") {
          var dStatus = extractStatus(dEv);
          var peStatus = extractStatus(pe);
          if (dStatus && peStatus && dStatus === peStatus &&
              sameActor(pe, dEv) && Math.abs(dT - peT) <= 10000) {
            var dHasFrom = !!extractFromStatus(dEv);
            var peHasFrom = !!extractFromStatus(pe);
            if (dHasFrom && !peHasFrom) { replaceIdx = dj; break; }
            isDup = true; break;
          }
        }
        if (cA !== cB) {
          var pair1 = cA + "|" + cB;
          if (!ALLOWED_CROSS_CAT[pair1]) continue;
        }
        var peContent = String(pe.note || pe.feedback || "").trim();
        if (!dContent || !peContent || dContent !== peContent) continue;
        if (!sameActor(pe, dEv)) continue;
        if (Math.abs(dT - peT) <= 10000) { isDup = true; break; }
      }
      if (replaceIdx >= 0) keep[replaceIdx] = dEv;
      else if (!isDup) keep.push(dEv);
    }
    era.events = keep;
  });

  // Drop "phantom" eras with no actual sales work — these come from admin
  // hops where the receiving agent never acted before the next rotation
  // (or from misattributed history rows where the actor was an admin).
  // Real eras have at least one work-type event. EXCEPTION: never drop the
  // current (last) era — even an empty one is the present holder.
  var workTypes = { status_change:1, feedback:1, feedback_added:1, call:1, meeting:1, callback_scheduled:1, note:1 };
  eras = eras.filter(function(era, i, arr){
    if (i === arr.length - 1) return true;
    return era.events.some(function(ev){ return !!workTypes[ev.type]; });
  });

  // Team_leader scope: drop any era whose agent isn't on this TL's team. The
  // backend already scopes leads/users to the TL's team, but the journey
  // panel renders the lead's full history — including eras held by agents
  // outside the team — and that history must be hidden too.
  // Match the era's agent (era.agentName, the receiving sales person) against
  // allUsers by name to recover an _id, then test it against the scope set.
  // No exception for the current (last) era — the rule is strict.
  var teamScope = getTeamScopeIds(currentUser, allUsers);
  if (teamScope) {
    eras = eras.filter(function(era){
      var agentMatch = (allUsers || []).find(function(u){ return u && u.name === era.agentName; });
      var agentId = agentMatch ? String(agentMatch._id) : "";
      return teamScope.has(agentId);
    });
  }

  // After dropping phantom eras (and any out-of-team eras for team_leader),
  // point each surviving era's fromAgent at the previous SURVIVING era's
  // agent — so the rotation separator reads "Rotated <prevSurvivor> →
  // <nextSurvivor>", skipping the admin hop and any out-of-team eras.
  eras.forEach(function(era, i){
    if (i > 0) era.fromAgent = eras[i-1].agentName;
  });

  // Group consecutive same-actor events written within 60s of each other into
  // a single composite "action". Backend frequently writes one user action as
  // 4-6 history rows (status_change + callback_scheduled + feedback_added +
  // mirror copies in Activity). Grouping collapses them into one row, and
  // shrinks the era's "X actions" count to match logical user activity.
  // Era boundaries (assigned/first_assigned/rotated/reassigned) are NEVER
  // groupable — they always render as their own row.
  var GRP_GAP_MS = 60 * 1000;
  var GROUPABLE_TYPES = { status_change:1, feedback:1, feedback_added:1, callback_scheduled:1, note:1, call:1, meeting:1 };
  var isGroupable = function(t){ return !!GROUPABLE_TYPES[t]; };
  eras.forEach(function(era){
    var groups = [];
    era.events.forEach(function(ev){
      var last = groups[groups.length - 1];
      var canJoin = false;
      if (last) {
        var lastEv = last.subEvents[last.subEvents.length - 1];
        var tDelta = Math.abs(new Date(ev.createdAt) - new Date(lastEv.createdAt));
        canJoin = isGroupable(lastEv.type) && isGroupable(ev.type) && sameActor(lastEv, ev) && tDelta <= GRP_GAP_MS;
      }
      if (canJoin) {
        last.subEvents.push(ev);
      } else {
        groups.push({
          _id: (ev._id ? String(ev._id) + "-grp" : ("grp-" + groups.length)),
          createdAt: ev.createdAt,
          actor: ev.userId || null,
          subEvents: [ev]
        });
      }
    });
    groups.forEach(function(g){ g.isGroup = g.subEvents.length > 1; });
    era.actions = groups;
  });

  eras.forEach(function(era, i){
    era.isCurrent = (i === eras.length - 1);
    var last = null;
    for (var j = era.events.length - 1; j >= 0; j--) {
      if (era.events[j].type === "status_change") { last = extractStatus(era.events[j]); break; }
    }
    era.endedAtStatus = last || "NewLead";
  });

  // Conflict detection: flag a later era when previous era ended in strong engagement
  // but current era reaches a negative outcome.
  var strongStatuses = { HotCase:1, MeetingDone:1, DoneDeal:1, EOI:1, "Hot Case":1, "Meeting Done":1, "Done Deal":1 };
  var negativeStatuses = { NotInterested:1, NoAnswer:1, "Not Interested":1, "No Answer":1 };
  for (var ci = 1; ci < eras.length; ci++) {
    var prevEra = eras[ci-1];
    var thisEra = eras[ci];
    if (!strongStatuses[prevEra.endedAtStatus]) continue;
    var hitsNegative = thisEra.events.some(function(ev){
      if (ev.type !== "status_change") return false;
      var s = extractStatus(ev);
      return !!negativeStatuses[s];
    });
    if (hitsNegative) {
      thisEra.isConflict = true;
      thisEra.conflictPrevStatus = prevEra.endedAtStatus;
    }
  }

  // Sales: keep only the caller's current era.
  if (!isAdmin) {
    eras = eras.filter(function(e){ return e.isCurrent; });
  }

  if (eras.length === 0) {
    return <div style={{ fontSize:bodyFs, color:C.textLight, textAlign:"center", padding:14 }}>No history</div>;
  }

  // Both panel and modal variants render newest era at the top → oldest at
  // the bottom. The separator between adjacent eras is placed AFTER the
  // newer one (`orderedEras[i]`) and BEFORE the older one, and shows the
  // rotation that produced that newer era.
  var orderedEras = eras.slice().reverse();

  // Compute the status the lead held when a feedback row was written. Used
  // by the "while X" badge on feedback rows. Scans status_change events
  // across ALL eras (not just the era of `ev`) — a lead inherited via
  // rotation may have had its status set by a previous agent, and that
  // event lives in the previous agent's era. The badge reflects lead
  // status at time of write, not era-scoped slice status.
  // Type-name compatibility:
  //   - Activity records and per-slice agentHistory entries use "status_change".
  //   - lead.history entries pushed by PUT use "status_changed" (with -ed).
  // Both spellings are matched.
  // Fallback when nothing matches: lead.status (the current top-level value)
  // when available, else "NewLead". Privacy is preserved: this function only
  // reads events the client already received from /full-history (server-side
  // role-filtered) and only outputs a status string — never an author, note,
  // or any other slice/private content.
  var whileStatusFor = function(ev, era){
    var tFb = new Date(ev.createdAt).getTime();
    var best = null; var bestT = -Infinity;
    for (var ei = 0; ei < eras.length; ei++) {
      var e = eras[ei];
      for (var k = 0; k < e.events.length; k++) {
        var ek = e.events[k];
        var ekType = ek && ek.type;
        if (ekType !== "status_change" && ekType !== "status_changed") continue;
        var t = new Date(ek.createdAt).getTime();
        if (!isFinite(t) || t > tFb) continue;
        if (t > bestT) {
          var s = extractStatus(ek);
          if (s) { best = s; bestT = t; }
        }
      }
    }
    if (best) return best;
    if (lead && lead.status) return lead.status;
    return "NewLead";
  };

  // Layout B — labeled multi-line block rendering for one sub-event inside a
  // composite group row. Each sub-event becomes a block with a "Category:"
  // label; feedback / note bodies sit in a muted panel below the label.
  // The `group` arg gives access to sibling sub-events so we can suppress
  // the "while X" badge when a status_change in the same group already
  // shows the matching destination status (badge would be redundant).
  var renderSubLine = function(ev, era, group){
    var type = ev.type;
    var labelStyle = { fontWeight:700, color:C.text };
    var mutedBox = { marginTop:4, padding:"6px 9px", background:"#F8FAFC", borderRadius:8, fontSize:bodyFs, color:C.text, border:"1px solid #EEF1F5" };
    if (type === "status_change") {
      var to = extractStatus(ev) || "NewLead";
      var from = extractFromStatus(ev);
      return <div style={{ fontSize:bodyFs, color:C.text }}>
        <span style={labelStyle}>Status:</span>{" "}
        {from ? <><span style={{ color:sColor(from), fontWeight:700 }}>{sLabel(from)}</span>{" → "}</> : null}
        <span style={{ color:sColor(to), fontWeight:700 }}>{sLabel(to)}</span>
      </div>;
    }
    if (type === "feedback" || type === "feedback_added") {
      var ws = whileStatusFor(ev, era);
      var suppressBadge = !!(group && group.subEvents && group.subEvents.some(function(s){
        return s.type === "status_change" && extractStatus(s) === ws;
      }));
      var fbText = stripActorPrefix(ev.feedback || ev.note || "");
      return <div>
        <div style={{ fontSize:bodyFs, color:C.text, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={labelStyle}>Feedback:</span>
          {!suppressBadge && <span style={{ fontSize:metaFs, padding:"1px 6px", borderRadius:5, background:sColor(ws)+"18", color:sColor(ws), fontWeight:600 }}>while {sLabel(ws)}</span>}
        </div>
        {fbText && <div style={mutedBox}>{fbText}</div>}
      </div>;
    }
    if (type === "callback_scheduled") {
      var cbTime = ev.scheduledFor || ev.time || ev.callbackTime || null;
      var cbLabel = cbTime ? new Date(cbTime).toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : (ev.note || "");
      return <div style={{ fontSize:bodyFs, color:C.text }}>
        <span style={labelStyle}>Callback:</span> {cbLabel}
      </div>;
    }
    if (type === "note") {
      var noteText = stripActorPrefix(ev.note || "");
      return <div>
        <div style={{ fontSize:bodyFs, color:C.text }}><span style={labelStyle}>Note:</span></div>
        {noteText && <div style={mutedBox}>{noteText}</div>}
      </div>;
    }
    if (type === "call") {
      return <div style={{ fontSize:bodyFs, color:C.text }}>
        <span style={labelStyle}>Call:</span> {ev.note || "Call initiated"}
      </div>;
    }
    if (type === "meeting") {
      return <div style={{ fontSize:bodyFs, color:C.text }}>
        <span style={labelStyle}>Meeting:</span> {ev.note || "Meeting"}
      </div>;
    }
    if (type === "assigned" || type === "first_assigned") {
      var src = (type === "first_assigned" && era.source) ? " · source: " + era.source : "";
      return <div style={{ fontSize:bodyFs, color:C.text }}>Assigned fresh as <span style={{ color:sColor("NewLead"), fontWeight:700 }}>New Lead</span>{src}</div>;
    }
    if (type === "rotated" || type === "reassigned") {
      return <div style={{ fontSize:bodyFs, color:C.text }}>Assigned fresh as <span style={{ color:sColor("NewLead"), fontWeight:700 }}>New Lead</span></div>;
    }
    return <div style={{ fontSize:bodyFs, color:C.text }}>{ev.note || type}</div>;
  };

  // Render a single event the original way (label + muted panel for
  // feedback / note text). Used when an action group has only one sub-event.
  var renderEvent = function(ev, era, idx, noTopBorder){
    var type = ev.type;
    var body = null;
    if (type === "assigned" || type === "first_assigned") {
      var src = (type === "first_assigned" && era.source) ? " · source: " + era.source : "";
      body = <div style={{ fontSize:bodyFs, color:C.text }}>Assigned fresh as <span style={{ color:sColor("NewLead"), fontWeight:700 }}>New Lead</span>{src}</div>;
    } else if (type === "rotated" || type === "reassigned") {
      body = <div style={{ fontSize:bodyFs, color:C.text }}>Assigned fresh as <span style={{ color:sColor("NewLead"), fontWeight:700 }}>New Lead</span></div>;
    } else if (type === "status_change") {
      var to = extractStatus(ev) || "NewLead";
      var from = extractFromStatus(ev);
      body = from
        ? <div style={{ fontSize:bodyFs, color:C.text }}>Status <span style={{ color:sColor(from), fontWeight:700 }}>{sLabel(from)}</span>{" → "}<span style={{ color:sColor(to), fontWeight:700 }}>{sLabel(to)}</span></div>
        : <div style={{ fontSize:bodyFs, color:C.text }}>Status set to <span style={{ color:sColor(to), fontWeight:700 }}>{sLabel(to)}</span></div>;
    } else if (type === "feedback_added" || type === "feedback") {
      var whileStatusS = whileStatusFor(ev, era);
      var fbBody = stripActorPrefix(ev.feedback || ev.note || "");
      body = <div>
        <div style={{ fontSize:bodyFs, color:C.text, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontWeight:700 }}>Feedback</span>
          <span style={{ fontSize:metaFs, padding:"1px 6px", borderRadius:5, background:sColor(whileStatusS)+"18", color:sColor(whileStatusS), fontWeight:600 }}>while {sLabel(whileStatusS)}</span>
        </div>
        {fbBody && <div style={{ marginTop:4, padding:"6px 9px", background:"#F8FAFC", borderRadius:8, fontSize:bodyFs, color:C.text, border:"1px solid #EEF1F5" }}>{fbBody}</div>}
      </div>;
    } else if (type === "callback_scheduled") {
      var cbTime = ev.scheduledFor || ev.time || ev.callbackTime || null;
      var cbLabel = cbTime ? new Date(cbTime).toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : (ev.note || "");
      body = <div style={{ fontSize:bodyFs, color:C.text }}>Callback scheduled for <span style={{ fontWeight:700 }}>{cbLabel}</span></div>;
    } else if (type === "note") {
      var noteBody = stripActorPrefix(ev.note || "");
      body = <div>
        <div style={{ fontSize:bodyFs, color:C.text, fontWeight:700 }}>Note</div>
        {noteBody && <div style={{ marginTop:4, padding:"6px 9px", background:"#F8FAFC", borderRadius:8, fontSize:bodyFs, color:C.text, border:"1px solid #EEF1F5" }}>{noteBody}</div>}
      </div>;
    } else if (type === "call" || type === "meeting") {
      body = <div style={{ fontSize:bodyFs, color:C.text }}>{ev.note || (type==="call"?"Call":"Meeting")}</div>;
    } else {
      body = <div style={{ fontSize:bodyFs, color:C.text }}>{ev.note || type}</div>;
    }
    var hideTop = (typeof noTopBorder === "boolean") ? noTopBorder : (idx === 0);
    return <div key={ev._id || (era.agentName+"-"+idx)} style={{ display:"flex", gap:10, padding:"6px 0", borderTop:hideTop?"none":"1px solid rgba(0,0,0,0.04)" }}>
      <div style={{ flexShrink:0, width:isPanel?84:96, fontSize:metaFs, color:C.textLight, paddingTop:2 }}>{fmtTs(ev.createdAt)}</div>
      <div style={{ flex:1, minWidth:0 }}>{body}</div>
    </div>;
  };

  // Render one action (a group of 1+ events). Single-event groups fall
  // through to the existing renderEvent layout. Multi-event groups render as
  // a single row whose right column is a stack of labeled sub-event blocks
  // ordered by category (Status → Feedback → Callback → Note → Call →
  // Meeting), with chronological order preserved within each category.
  var SUB_CATEGORY_ORDER = { status_change:0, feedback:1, feedback_added:1, callback_scheduled:2, note:3, call:4, meeting:5 };
  var renderAction = function(action, era, chronoIdx, noTopBorder){
    if (!action.isGroup) {
      return renderEvent(action.subEvents[0], era, chronoIdx, noTopBorder);
    }
    var hideTop = (typeof noTopBorder === "boolean") ? noTopBorder : (chronoIdx === 0);
    var ordered = action.subEvents.slice().sort(function(a, b){
      var ca = (SUB_CATEGORY_ORDER[a.type] != null) ? SUB_CATEGORY_ORDER[a.type] : 99;
      var cb = (SUB_CATEGORY_ORDER[b.type] != null) ? SUB_CATEGORY_ORDER[b.type] : 99;
      if (ca !== cb) return ca - cb;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    return <div key={action._id} style={{ display:"flex", gap:10, padding:"6px 0", borderTop:hideTop?"none":"1px solid rgba(0,0,0,0.04)" }}>
      <div style={{ flexShrink:0, width:isPanel?84:96, fontSize:metaFs, color:C.textLight, paddingTop:2 }}>{fmtTs(action.createdAt)}</div>
      <div style={{ flex:1, minWidth:0 }}>
        {ordered.map(function(sub, si){
          return <div key={si} style={{ padding:"3px 0", lineHeight:1.5 }}>
            {renderSubLine(sub, era, action)}
          </div>;
        })}
      </div>
    </div>;
  };

  var renderEra = function(era, idx){
    var initials = (era.agentName||"?").split(/\s+/).filter(Boolean).map(function(w){return w[0]||"";}).slice(0,2).join("").toUpperCase() || "?";
    var bgColor = era.isCurrent ? "#E1F5EE" : "#FBFBFA";
    var borderColor = era.isCurrent ? "#1D9E75" : "#888780";
    var conflict = era.isConflict && isAdmin;
    var cardStyle = conflict ? {
      border:"2px solid #A32D2D",
      borderLeft:"4px solid #A32D2D",
      background:"#FCEBEB",
      borderRadius:10,
      padding:eraPad,
      marginBottom:10,
      position:"relative"
    } : {
      borderLeft:"3px solid "+borderColor,
      background:bgColor,
      borderRadius:10,
      padding:eraPad,
      marginBottom:10,
      position:"relative"
    };
    var actions = era.actions || [];
    // Collapse repeated NewLead displays inside one era. The era starts as
    // NewLead by definition (the assignment row reads "Assigned fresh as
    // New Lead"); every subsequent status_change to NewLead is redundant
    // noise. Walk chronologically, keep the first event whose displayed
    // status resolves to NewLead, drop later ones. Other eras keep their
    // own first NewLead entry independently.
    var resolvesToNewLead = function(ev){
      var t = ev && ev.type;
      if (t === "status_change" || t === "status_changed") {
        var s = extractStatus(ev) || "NewLead";
        return s === "NewLead" || s === "New Lead";
      }
      if (t === "assigned" || t === "first_assigned" || t === "rotated" || t === "reassigned") return true;
      return false;
    };
    var seenNewLead = false;
    var filteredActions = [];
    actions.forEach(function(action){
      var keptSubs = [];
      action.subEvents.forEach(function(se){
        if (resolvesToNewLead(se)) {
          if (!seenNewLead) { seenNewLead = true; keptSubs.push(se); }
        } else {
          keptSubs.push(se);
        }
      });
      if (keptSubs.length === 0) return;
      if (keptSubs.length === action.subEvents.length) {
        filteredActions.push(action);
      } else {
        filteredActions.push(Object.assign({}, action, {
          subEvents: keptSubs,
          isGroup: keptSubs.length > 1
        }));
      }
    });
    actions = filteredActions;
    var actionsCount = actions.length;
    // Build rows in chronological order (actions + silence pills computed
    // from chrono gaps), then reverse for display so newest actions sit on
    // top. Silence pills are placed between consecutive groups based on the
    // gap from the previous group's last sub-event to this group's first.
    var chronoItems = [];
    var GAP = 48 * 60 * 60 * 1000;
    actions.forEach(function(action, i){
      if (i > 0) {
        var prevAction = actions[i-1];
        var prevLast = prevAction.subEvents[prevAction.subEvents.length - 1];
        var prevType = prevLast.type;
        var prevIsAssign = prevType==="assigned" || prevType==="first_assigned" || prevType==="rotated" || prevType==="reassigned";
        if (!prevIsAssign) {
          var gapMs = new Date(action.createdAt) - new Date(prevLast.createdAt);
          if (gapMs > GAP) {
            var days = Math.round(gapMs / (24*60*60*1000));
            chronoItems.push({ kind:"silence", node:
              <div key={"silence-"+idx+"-"+i} style={{ display:"flex", justifyContent:"center", margin:"8px 0" }}>
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"6px 12px", borderRadius:14,
                  border:"1px dashed #BA7517", background:"#FAEEDA",
                  color:"#633806", fontStyle:"italic", fontSize:10
                }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#BA7517" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  — {days} day{days===1?"":"s"} of silence —
                </div>
              </div>
            });
          }
        }
      }
      chronoItems.push({ kind:"action", action: action, chronoIdx: i });
    });
    var displayItems = chronoItems.slice().reverse();

    // Collapse to the newest 5 actions when the era has more than 5. Silence
    // pills that sit between two visible actions stay; pills that would land
    // adjacent to a hidden action are dropped (achieved naturally by slicing
    // up to and including the 5th action seen in display order).
    var isExpanded = !!expandedEras[idx];
    var visibleItems;
    if (actionsCount > 5 && !isExpanded) {
      visibleItems = [];
      var actionsSeen = 0;
      for (var vi = 0; vi < displayItems.length; vi++) {
        var di = displayItems[vi];
        if (di.kind === "action") {
          actionsSeen++;
          if (actionsSeen > 5) break;
        }
        visibleItems.push(di);
      }
    } else {
      visibleItems = displayItems;
    }

    var rows = [];
    var firstEventSeen = false;
    visibleItems.forEach(function(item){
      if (item.kind === "silence") { rows.push(item.node); return; }
      var noTopBorder = !firstEventSeen;
      firstEventSeen = true;
      rows.push(renderAction(item.action, era, item.chronoIdx, noTopBorder));
    });

    var toggleBtn = null;
    if (actionsCount > 5) {
      toggleBtn = <button key={"toggle-"+idx} onClick={function(){
        setExpandedEras(function(prev){
          var next = Object.assign({}, prev);
          next[idx] = !prev[idx];
          return next;
        });
      }} onMouseEnter={function(e){ e.currentTarget.style.background = "#F8FAFC"; }}
         onMouseLeave={function(e){ e.currentTarget.style.background = "transparent"; }}
         style={{
        display:"block", width:"100%", marginTop:8,
        padding:8, border:"1px dashed #888780", background:"transparent",
        color:"#5F5E5A", fontSize:11, borderRadius:8, cursor:"pointer",
        fontFamily:"inherit"
      }}>
        {isExpanded ? "Show less ▴" : ("Show all " + actionsCount + " actions ▾")}
      </button>;
    }

    return <div key={"era-"+idx} style={cardStyle}>
      {conflict && <div style={{
        position:"absolute", top:-10, left:8,
        background:"#A32D2D", color:"#fff", fontSize:10,
        padding:"2px 8px", borderRadius:10, fontWeight:700
      }}>⚠ Conflict</div>}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:avatarColor(era.agentName), color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:bodyFs, fontWeight:700, color:C.text }}>{era.agentName}</div>
          <div style={{ fontSize:metaFs, color:C.textLight, marginTop:1 }}>
            {fmtRange(era.startedAt, era.endedAt, era.isCurrent)} · {actionsCount} action{actionsCount===1?"":"s"} · ended at <span style={{ color:sColor(era.endedAtStatus), fontWeight:600 }}>{sLabel(era.endedAtStatus)}</span>
          </div>
        </div>
        <div style={{ flexShrink:0, fontSize:metaFs, fontWeight:700, padding:"2px 8px", borderRadius:10, background:era.isCurrent?"#1D9E75":"#888780", color:"#fff" }}>{era.isCurrent?"Current":"Previous"}</div>
      </div>
      {conflict && <div style={{ fontSize:10, color:"#A32D2D", fontStyle:"italic", marginBottom:8 }}>
        Previous agent had {sLabel(era.conflictPrevStatus)} — investigate
      </div>}
      <div>{rows}</div>
      {toggleBtn}
    </div>;
  };

  var renderSeparator = function(era, key){
    var meta = era.rotationMeta || { isAuto: era.auto === "auto", actor: null, reason: era.reason };
    var from = era.fromAgent || "Unassigned";
    var to = era.agentName || "Unknown";
    var ts = fmtTs(era.startedAt);
    var line2;
    if (meta.isAuto) {
      // Auto rotations have no meaningful actor — the rotation cron runs as
      // the outgoing agent. Skip the "by X" segment entirely.
      line2 = "Auto-rotated · " + translateAutoReason(meta.reason) + " · " + ts;
    } else {
      // Manual rotations: prefer era.actor (captured at era creation, has
      // structured name + role). Fall back to the parsed note actor when the
      // userId wasn't populated. Role label is omitted when unknown rather
      // than guessed.
      var actorName = (era.actor && era.actor.name) || meta.actor || null;
      var actorRoleLabel = era.actor ? roleLabel(era.actor.role) : null;
      var prefix;
      if (actorName) {
        prefix = "Manually rotated by " + actorName + (actorRoleLabel ? (" (" + actorRoleLabel + ")") : "");
      } else {
        prefix = "Manually rotated";
      }
      line2 = prefix + " · " + ts;
    }
    return <div key={key} style={{ margin:"6px 0 12px", padding:"8px 12px", background:"#FAEEDA", color:"#633806", borderRadius:10, fontSize:metaFs, lineHeight:1.45 }}>
      <div style={{ fontWeight:700 }}>↻ Rotated {from} → {to} · status reset to New Lead</div>
      <div style={{ marginTop:3, opacity:0.92 }}>{line2}</div>
    </div>;
  };

  var rankOf = function(s){
    var r = { DoneDeal:8, "Done Deal":8, EOI:7, MeetingDone:6, "Meeting Done":6, HotCase:5, "Hot Case":5, CallBack:4, "Call Back":4, Potential:3, NewLead:2, "New Lead":2, NoAnswer:1, "No Answer":1, NotInterested:0, "Not Interested":0 };
    return (r[s] == null) ? -1 : r[s];
  };
  var buildSummary = function(){
    if (!eras.length) return null;
    var rotations = eras.length - 1;
    var firstTs = new Date(eras[0].startedAt).getTime();
    var lastTs = new Date(eras[eras.length-1].endedAt).getTime();
    var spanDays = Math.max(1, Math.round((lastTs - firstTs) / (24*60*60*1000)));
    var bestEra = eras[0];
    eras.forEach(function(e){ if (rankOf(e.endedAtStatus) > rankOf(bestEra.endedAtStatus)) bestEra = e; });
    var curStatus = (lead && lead.status) || "NewLead";
    if (rotations === 0) {
      return "Never rotated. Held by " + eras[0].agentName + " for " + spanDays + " day" + (spanDays===1?"":"s") + " — currently " + sLabel(curStatus) + ".";
    }
    var bestLabel = bestEra.isCurrent ? bestEra.agentName + " (current)" : bestEra.agentName + " (" + sLabel(bestEra.endedAtStatus) + ")";
    return "Rotated " + rotations + " time" + (rotations===1?"":"s") + " in " + spanDays + " day" + (spanDays===1?"":"s") + ". Best engagement with " + bestLabel + " — currently " + sLabel(curStatus) + ".";
  };
  var summary = isAdmin ? buildSummary() : null;
  var canCompare = isAdmin && eras.length >= 2;

  var out = [];
  if (canCompare) {
    out.push(<div key="cmp-row" style={{ display:"flex", justifyContent:"flex-end", marginBottom:8 }}>
      <button onClick={function(){ setShowCompare(lead, eras); }} style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"4px 10px", border:"1px solid #CBD5E1", borderRadius:8,
        background:"#fff", cursor:"pointer", fontSize:metaFs, color:C.text, fontWeight:600
      }}>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
        </svg>
        Compare agents
      </button>
    </div>);
  }
  if (summary) {
    out.push(<div key="summary" style={{
      background:"linear-gradient(135deg, #E6F1FB 0%, #F0F7FF 100%)",
      borderLeft:"3px solid #185FA5",
      borderRadius:10, padding:"10px 12px", marginBottom:10
    }}>
      <div style={{ fontSize:9, fontWeight:700, color:"#185FA5", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Summary</div>
      <div style={{ fontSize:bodyFs, color:C.text, lineHeight:1.5 }}>{summary}</div>
    </div>);
  }
  orderedEras.forEach(function(era, i){
    out.push(renderEra(era, i));
    if (i < orderedEras.length - 1) {
      var newer = orderedEras[i];
      if (newer && newer.isRotation) {
        out.push(renderSeparator(newer, "sep-"+i));
      }
    }
  });

  return <div style={{ maxWidth:maxW }}>{out}</div>;
};

// ===== LEADS PAGE =====
var LeadsPage = function(p) {
  var t = p.t;
  // Dropdown (Change Status) options — excludes "Deal Cancelled" everywhere on the Leads page.
  var sc = visibleStatuses(STATUSES(t), p.cu&&p.cu.role).filter(function(s){ return s.value!=="Deal Cancelled"; });
  // Top filter-tab options — also hide EOI and DoneDeal (they have their own pages).
  var tabSc = sc.filter(function(s){ return s.value!=="EOI" && s.value!=="DoneDeal"; });
  var isAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin";
  var salesUsers = p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
  var isManager = p.cu.role==="manager"||p.cu.role==="team_leader";
  var myTeamUsers = p.myTeamUsers || salesUsers;
  var isReq = !!p.isRequest;

  // ---- State declarations (must be before filter logic) ----
  var [selected, setSelected] = useState(null);
  // Close the side panel when the user clicks anywhere outside of it.
  var panelRef = useOutsideClose(!!selected, function(){ setSelected(null); });
  var [statusDrop, setStatusDrop] = useState(null);
  var [showAdd, setShowAdd] = useState(false);
  var [editLead, setEditLead] = useState(null);
  // Standalone managerial feedback modal — open from the lead detail panel
  // for admin/SA/manager/TL (TL only when not on their own personal lead) so
  // they can write a private note or send-to-specific-sales without changing
  // status. Sales role uses the existing inline path (StatusModal).
  var [feedbackModal, setFeedbackModal] = useState(null); // {lead}
  var [fbForm, setFbForm] = useState({ text:"", visibility:"private", targetAgentId:"" });
  var [fbSaving, setFbSaving] = useState(false);
  var [fbErr, setFbErr] = useState("");
  var [showStatusPicker, setShowStatusPicker] = useState(false);
  var [showStatusComment, setShowStatusComment] = useState(false);
  var [pendingStatus, setPendingStatus] = useState(null);
  var [waChooser, setWaChooser] = useState(null); // phone number for WA chooser
  var [actNote, setActNote] = useState(""); var [actType, setActType] = useState("call"); var [showActForm, setShowActForm] = useState(false);
  var [saving, setSaving] = useState(false);
  var [importing, setImporting] = useState(false); var [importMsg, setImportMsg] = useState("");
  var [selected2, setSelected2] = useState([]);
  var [showBulk, setShowBulk] = useState(false); var [bulkAgent, setBulkAgent] = useState("");
  var [showWaTemplates, setShowWaTemplates] = useState(false);
  var [waLead, setWaLead] = useState(null);
  var [showBulkWa, setShowBulkWa] = useState(false);
  var [bulkWaTemplate, setBulkWaTemplate] = useState(null);
  var [showQuickAdd, setShowQuickAdd] = useState(false);
  var [showHistory, setShowHistory] = useState(false);
  var [historyLead, setHistoryLead] = useState(null);
  var [fullHistory, setFullHistory] = useState([]);
  var [historyLoading, setHistoryLoading] = useState(false);
  var [showCompare, setShowCompare] = useState(false);
  var [compareLead, setCompareLead] = useState(null);
  var [compareEras, setCompareEras] = useState([]);
  var openCompare = function(leadObj, erasArr){
    setCompareLead(leadObj || null);
    setCompareEras(erasArr || []);
    setShowCompare(true);
  };
  var closeCompare = function(){
    setShowCompare(false);
    setCompareLead(null);
    setCompareEras([]);
  };
  var [quickForm, setQuickForm] = useState({name:"",phone:"",project:PROJECTS[0],source:"Facebook"});
  var [quickSaving, setQuickSaving] = useState(false);
  var [notifGranted, setNotifGranted] = useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  var [vipFilter, setVipFilter] = useState(false);
  var [noAgentFilter, setNoAgentFilter] = useState(false);
  var [agentFilter, setAgentFilter] = useState("");
  var [sortBy, setSortBy] = useState("lastActivity");
  var [lockedOnly, setLockedOnly] = useState(false);
  var [panelHistory, setPanelHistory] = useState([]);
  var [dateRange, setDateRange] = useState("all"); // today | yesterday | week | month | quarter | all
  var fileRef = useRef(null);

  // ---- Helpers: read status / feedback / activity from the CURRENT holder's
  // assignment slice (not stale top-level fields). Defined once here, reused
  // everywhere the table needs to show what the present holder sees.
  var currentHolderSlice = function(lead) {
    if (!lead || !lead.agentId) return null;
    var holderId = String(lead.agentId._id || lead.agentId);
    var arr = lead.assignments || [];
    for (var i = 0; i < arr.length; i++) {
      var a = arr[i];
      if (!a) continue;
      var aid = a.agentId && a.agentId._id ? String(a.agentId._id) : String(a.agentId || "");
      if (aid === holderId) return a;
    }
    return null;
  };
  // Phase OO-3: latest-wins. Walk every assignment slice's agentHistory and
  // pick the most recent status_change / feedback event across all sales who
  // ever held the lead. No slice prioritization, no fallback chains beyond
  // top-level lead.status when nothing has ever been recorded.
  var currentStatus = function(lead) {
    if (!lead) return "NewLead";
    var latestStatus = null;
    var latestStatusTs = 0;
    (lead.assignments || []).forEach(function(a){
      if (!a) return;
      var hist = Array.isArray(a.agentHistory) ? a.agentHistory : [];
      hist.forEach(function(h){
        if (!h || h.type !== "status_change") return;
        var ts = new Date(h.createdAt || h.at || h.timestamp || 0).getTime();
        if (ts <= latestStatusTs) return;
        var s = h.status || h.toStatus;
        if (!s && h.note) {
          var m = String(h.note).match(/Status:\s*(\w+)/i);
          if (m) s = m[1];
        }
        if (s) {
          latestStatus = s;
          latestStatusTs = ts;
        }
      });
      if (a.status && a.lastActionAt) {
        var t = new Date(a.lastActionAt).getTime();
        if (t > latestStatusTs) {
          latestStatus = a.status;
          latestStatusTs = t;
        }
      }
    });
    if (latestStatus) return latestStatus;
    return lead.status || "NewLead";
  };
  var currentFeedback = function(lead) {
    if (!lead) return "";
    var latestFeedback = "";
    var latestFeedbackTs = 0;
    (lead.assignments || []).forEach(function(a){
      if (!a) return;
      var hist = Array.isArray(a.agentHistory) ? a.agentHistory : [];
      hist.forEach(function(h){
        if (!h) return;
        if (h.type !== "feedback" && h.type !== "feedback_added") return;
        var content = String(h.note || h.feedback || "").trim();
        if (!content) return;
        var ts = new Date(h.createdAt || h.at || h.timestamp || 0).getTime();
        if (ts > latestFeedbackTs) {
          latestFeedbackTs = ts;
          latestFeedback = content;
        }
      });
      if (a.lastFeedback && String(a.lastFeedback).trim() && a.lastActionAt) {
        var t = new Date(a.lastActionAt).getTime();
        if (t > latestFeedbackTs) {
          latestFeedbackTs = t;
          latestFeedback = String(a.lastFeedback).trim();
        }
      }
    });
    return latestFeedback;
  };
  // "New Lead" tab is for first-time leads only — current status NewLead AND
  // never rotated AND no action yet taken on the slice. A lead with 2+
  // assignment slices, any non-zero rotationCount, or any feedback / notes /
  // callback / status_change / note / feedback / call entry on the holder's
  // slice is hidden even though it may still read as NewLead.
  var isGenuineNewLead = function(lead) {
    if (!lead) return false;
    if (currentStatus(lead) !== "NewLead") return false;

    // Walk every slice (current and historical). If any slice shows any
    // action, the lead has been worked on and is no longer "new".
    var slices = (lead && lead.assignments) || [];
    for (var i = 0; i < slices.length; i++) {
      var s = slices[i];
      if (!s) continue;
      if (s.lastFeedback && String(s.lastFeedback).trim()) return false;
      if (s.notes && String(s.notes).trim()) return false;
      if (s.callbackTime) return false;
      var hist = Array.isArray(s.agentHistory) ? s.agentHistory : [];
      var hasAction = hist.some(function(h){
        if (!h || !h.type) return false;
        var t = h.type;
        return t === "status_change"
            || t === "feedback_added" || t === "feedback"
            || t === "note"
            || t === "call"
            || t === "callback_scheduled";
      });
      if (hasAction) return false;
    }
    return true;
  };
  // Most recent activity timestamp the date-filter chips should respect.
  var lastActivityAt = function(lead) {
    var s = currentHolderSlice(lead);
    var t1 = s && s.lastActionAt ? new Date(s.lastActionAt).getTime() : 0;
    var t2 = lead && lead.updatedAt ? new Date(lead.updatedAt).getTime() : 0;
    var t3 = lead && lead.createdAt ? new Date(lead.createdAt).getTime() : 0;
    return Math.max(t1, t2, t3);
  };
  // Build the [start, end] window the date-filter chip represents in local time.
  var dateRangeWindow = function(key) {
    if (key === "all") return null;
    var now = new Date();
    var startOfDay = function(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0); };
    var endOfDay = function(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); };
    if (key === "today") return [startOfDay(now).getTime(), endOfDay(now).getTime()];
    if (key === "yesterday") {
      var y = new Date(now); y.setDate(y.getDate()-1);
      return [startOfDay(y).getTime(), endOfDay(y).getTime()];
    }
    if (key === "week") {
      // ISO week: Monday 00:00 → end of today
      var dow = now.getDay(); // 0 Sun .. 6 Sat
      var diffToMon = (dow + 6) % 7;
      var mon = new Date(now); mon.setDate(now.getDate() - diffToMon);
      return [startOfDay(mon).getTime(), endOfDay(now).getTime()];
    }
    if (key === "month") {
      var first = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return [first.getTime(), endOfDay(now).getTime()];
    }
    if (key === "quarter") {
      var qStartMonth = Math.floor(now.getMonth()/3)*3;
      var qFirst = new Date(now.getFullYear(), qStartMonth, 1, 0, 0, 0, 0);
      return [qFirst.getTime(), endOfDay(now).getTime()];
    }
    return null;
  };
  // Detect every qualifying mark (HotCase / Potential / MeetingDone) ever
  // recorded against any assignment slice — current status OR historical
  // status_change in agentHistory[]. Returns array sorted oldest-first.
  var QUALIFYING = { HotCase:1, Potential:1, MeetingDone:1 };
  var qualifyingMarks = function(lead) {
    var marks = [];
    var assignments = (lead && lead.assignments) || [];
    assignments.forEach(function(a){
      if (!a) return;
      var aName = (a.agentId && a.agentId.name) ? a.agentId.name : "";
      var aId = a.agentId && a.agentId._id ? String(a.agentId._id) : String(a.agentId || "");
      // Signal 1: the slice currently carries a qualifying status.
      if (QUALIFYING[a.status]) {
        var ts = a.lastActionAt ? new Date(a.lastActionAt).getTime()
               : a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
        marks.push({ status:a.status, agentName:aName, agentId:aId, date:ts, feedback:a.lastFeedback||"" });
      }
      // Signal 2: historical status_change entries logged in this slice.
      (a.agentHistory || []).forEach(function(h){
        if (!h) return;
        var note = String(h.note || "");
        Object.keys(QUALIFYING).forEach(function(qs){
          var spaced = qs.replace(/([A-Z])/g, " $1").trim(); // "HotCase" → "Hot Case"
          if (note.indexOf(qs) >= 0 || note.indexOf(spaced) >= 0) {
            var ts2 = h.createdAt ? new Date(h.createdAt).getTime() : 0;
            marks.push({ status:qs, agentName:aName, agentId:aId, date:ts2, feedback:a.lastFeedback||"" });
          }
        });
      });
    });
    return marks.sort(function(x,y){ return x.date - y.date; });
  };

  // ---- Filter logic (uses state values above) ----
  var allVisible = p.leads.filter(function(l){
    if(l.archived) return false;
    var matchSource = isReq?l.source==="Daily Request":l.source!=="Daily Request";
    if(!matchSource) return false;
    // Hide EOI and DoneDeal from Leads page — they have their own pages.
    // Also hide Cancelled leads that came from EOI (they live in the EOI Cancelled tab).
    if(!isReq && (l.status==="EOI"||l.status==="DoneDeal")) return false;
    // Leads that were cancelled from EOI keep their restored status and reappear here for the rotated agent.
    // Leads that were status-cancelled via the Deals/status dropdown stay hidden from the Leads page as before.
    if(!isReq && l.status==="Deal Cancelled" && !(l.eoiStatus==="EOI Cancelled")) return false;
    // Manager: hide leads with no agent in daily request
    if(isReq && (p.cu.role==="manager"||p.cu.role==="team_leader") && !l.agentId) return false;
    return true;
  });
  var filtered;
  if (lockedOnly) {
    // Standalone filter: ignore every other user-applied filter and show only
    // leads where the rotation-lock flag is set.
    filtered = allVisible.filter(function(l){return l.locked===true;});
  } else if (p.leadFilter === "important") {
    // Important tab: every lead that EVER had a qualifying mark on any slice.
    filtered = allVisible.filter(function(l){ return qualifyingMarks(l).length > 0; });
  } else {
    // Status tabs filter by the CURRENT holder's slice status, not the stale
    // top-level field. "Meeting Done" tab now strictly means "current holder's
    // slice is MeetingDone" per Phase S spec.
    filtered = p.leadFilter==="all"
      ? allVisible
      : p.leadFilter==="NewLead"
        ? allVisible.filter(isGenuineNewLead)
        : allVisible.filter(function(l){ return currentStatus(l) === p.leadFilter; });
    // Management-alerts special filter (from dashboard)
    if (p.specialFilter && p.specialFilter.type) {
      var spT = p.specialFilter.type;
      var nowMs = Date.now();
      var monthStartMs = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0).getTime();
      filtered = filtered.filter(function(l){
        if (spT==="untouched") {
          var asgn = l.assignments||[];
          if (asgn.length===0) return true;
          return asgn.every(function(a){
            if (!a.lastActionAt) return true;
            if (a.assignedAt && new Date(a.lastActionAt).getTime()===new Date(a.assignedAt).getTime()) return true;
            return false;
          });
        }
        if (spT==="missingFeedback") return (l.assignments||[]).some(function(a){ return !a.notes || String(a.notes).trim()===""; });
        if (spT==="stale48h") return (l.assignments||[]).some(function(a){ return a.lastActionAt && (nowMs - new Date(a.lastActionAt).getTime()) > 48*3600*1000; });
        if (spT==="noRotation") return (l.assignments||[]).some(function(a){ return a.noRotation===true; });
        if (spT==="rotatedThisMonth") return (l.agentHistory||[]).some(function(h){ return h && h.date && new Date(h.date).getTime() >= monthStartMs; });
        if (spT==="interested") return l.status==="HotCase" || l.status==="Potential";
        if (spT==="project") return (l.project || "") === (p.specialFilter.value || "");
        if (spT==="aging") {
          // Reports → Lead Aging drill-down. UNION of two real-contact
          // sources, mirrors the backend pipeline exactly:
          //   (1) lead.history[] entries for status_changed /
          //       feedback_added / callback_scheduled — diff-gated by the
          //       server PUT handler so admin-saves-without-changes don't
          //       falsely refresh the clock.
          //   (2) p.activities entries for call/meeting/followup/email/note
          //       by the current holder against this lead.
          // Take the max across both. Fallback A = current holder's
          // slice.assignedAt, fallback B = lead.createdAt.
          var historyContactEvents = { status_changed:1, feedback_added:1, callback_scheduled:1 };
          var contactTypes = { call:1, meeting:1, followup:1, email:1, note:1 };
          var aid = l.agentId && l.agentId._id ? l.agentId._id : l.agentId;
          var aidStr = aid ? String(aid) : "";
          var lidStr = String(gid(l) || "");
          var maxContact = 0;
          // Source 1: lead.history events
          var hist = l.history || [];
          for (var hi = 0; hi < hist.length; hi++) {
            var h = hist[hi];
            if (!h || !historyContactEvents[h.event]) continue;
            var th = h.timestamp ? new Date(h.timestamp).getTime() : 0;
            if (th > maxContact) maxContact = th;
          }
          // Source 2: Activity entries (already loaded in props)
          if (aidStr && lidStr) {
            var acts = p.activities || [];
            for (var i2 = 0; i2 < acts.length; i2++) {
              var act = acts[i2];
              if (!act || !contactTypes[act.type]) continue;
              var alid = act.leadId && act.leadId._id ? act.leadId._id : act.leadId;
              var auid = act.userId && act.userId._id ? act.userId._id : act.userId;
              if (!alid || !auid) continue;
              if (String(alid) !== lidStr) continue;
              if (String(auid) !== aidStr) continue;
              var ta = act.createdAt ? new Date(act.createdAt).getTime() : 0;
              if (ta > maxContact) maxContact = ta;
            }
          }
          var lastT = maxContact;
          if (!lastT && aidStr) {
            // Fallback A: current holder's slice.assignedAt
            var asg = l.assignments || [];
            for (var j2 = asg.length - 1; j2 >= 0; j2--) {
              var sa = asg[j2] && asg[j2].agentId;
              var sid = sa && sa._id ? sa._id : sa;
              if (sid && String(sid) === aidStr && asg[j2].assignedAt) {
                lastT = new Date(asg[j2].assignedAt).getTime();
                break;
              }
            }
          }
          if (!lastT) lastT = l.createdAt ? new Date(l.createdAt).getTime() : 0;
          var ageDays = (nowMs - lastT) / 86400000;
          var aMin = (typeof p.specialFilter.ageMin === "number") ? p.specialFilter.ageMin : -Infinity;
          var aMax = (typeof p.specialFilter.ageMax === "number") ? p.specialFilter.ageMax : Infinity;
          return ageDays >= aMin && ageDays < aMax;
        }
        return true;
      });
    }
    filtered = filtered.filter(function(l){return matchSearch(l,p.search);});
    if (vipFilter) filtered = filtered.filter(function(l){return l.isVIP;});
    if (noAgentFilter) filtered = filtered.filter(function(l){ var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId; return !aid; });
    if (agentFilter) filtered = filtered.filter(function(l){ var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId; return aid===agentFilter; });
  }
  // Date-range chips. For the Important tab the chip filters by the
  // qualifying-mark date; for every other tab it filters by the lead's most
  // recent activity time.
  (function(){
    var win = dateRangeWindow(dateRange);
    if (!win) return;
    if (p.leadFilter === "important") {
      filtered = filtered.filter(function(l){
        var marks = qualifyingMarks(l);
        if (!marks.length) return false;
        var first = marks[0].date || 0;
        return first >= win[0] && first <= win[1];
      });
    } else {
      filtered = filtered.filter(function(l){
        var t = lastActivityAt(l);
        return t >= win[0] && t <= win[1];
      });
    }
  })();
  filtered = filtered.slice().sort(function(a,b){
    if (p.leadFilter === "important") {
      // Important tab sorts by qualifying date, newest first.
      var aMarks = qualifyingMarks(a); var bMarks = qualifyingMarks(b);
      var aTs = aMarks.length ? aMarks[0].date : 0;
      var bTs = bMarks.length ? bMarks[0].date : 0;
      return bTs - aTs;
    }
    if (sortBy==="lastActivity") return new Date(b.lastActivityTime||0)-new Date(a.lastActivityTime||0);
    if (sortBy==="newest") return new Date(b.createdAt||0)-new Date(a.createdAt||0);
    if (sortBy==="oldest") return new Date(a.createdAt||0)-new Date(b.createdAt||0);
    if (sortBy==="name") return a.name.localeCompare(b.name,"ar");
    return 0;
  });

  useEffect(function(){ if(p.initSelected){setSelected(p.initSelected);} },[p.initSelected]);

  // Consume one-shot agent filter from Admin Dashboard drill-down clicks.
  useEffect(function(){
    if (p.initAgentFilter) {
      setAgentFilter(p.initAgentFilter);
      setNoAgentFilter(false);
      if (p.setInitAgentFilter) p.setInitAgentFilter(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[p.initAgentFilter]);

  // Locked Only is mutually exclusive with search: if the user types anything
  // in the header search while it's active, drop out of Locked Only so the
  // search result is applied against the full list.
  useEffect(function(){
    if (lockedOnly && p.search && String(p.search).trim().length>0) {
      setLockedOnly(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[p.search]);

  // Fetch full history when a lead is selected
  useEffect(function(){
    if(!selected){setPanelHistory([]);return;}
    var lid=gid(selected);
    apiFetch("/api/leads/"+lid+"/full-history","GET",null,p.token).then(function(hist){
      var all=hist||[];
      var isAdminRole=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader";
      if(!isAdminRole){
        var rotTime=selected.lastRotationAt?new Date(selected.lastRotationAt).getTime():0;
        all=all.filter(function(a){
          var auid=String(a.userId&&a.userId._id?a.userId._id:a.userId||"");
          return auid===String(p.cu.id||"");
        });
      }
      setPanelHistory(all.slice().sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}));
    }).catch(function(){setPanelHistory([]);});
  },[selected]);

  var getAgentName = function(l){ if(!l.agentId)return"-"; if(l.agentId.name)return l.agentId.name; var u=p.users.find(function(x){return gid(x)===l.agentId;}); return u?u.name:"-"; };

  var reqStatus = function(lid, st) {
    if (st === "DoneDeal") {
      if (!window.confirm("⚠️ Are you sure this deal is done? This cannot be undone!")) return;
    }
    setPendingStatus({leadId:lid,newStatus:st}); setShowStatusComment(true);
  };

  var confirmStatus = async function(comment, cbTime, extra, fb) {
    if(!pendingStatus) return;
    try {
      // Determine whether feedback should be routed through the managerial
      // feedback endpoint (visibility selector) or saved inline via PUT
      // (existing sales / TL-on-own-lead path).
      // sales_admin is read-only on feedback by design — comment is dropped
      // (the textarea is rendered with no selector for them; the backend
      // would reject both PUT and feedback writes anyway).
      var role = p.cu && p.cu.role;
      var leadDoc = selected;
      var leadAgentId = leadDoc && leadDoc.agentId && leadDoc.agentId._id ? leadDoc.agentId._id : (leadDoc && leadDoc.agentId);
      var isWriteMgrRole = role === "admin" || role === "manager" || role === "team_leader";
      var isOwnLead = role === "team_leader" && String(leadAgentId || "") === String(p.cu.id || "");
      var routeFeedbackViaApi = isWriteMgrRole && !isOwnLead && comment;
      var dropFeedback = role === "sales_admin";
      var upData = { status: pendingStatus.newStatus };
      // For sales / TL-on-own-lead: keep inline notes/lastFeedback in PUT.
      // For admin/manager/TL on a team lead: omit from PUT (backend 400s),
      //                                      route via /feedback below.
      // For sales_admin: drop entirely — read-only on feedback.
      if(comment && !routeFeedbackViaApi && !dropFeedback) upData.lastFeedback = comment;
      if(cbTime) upData.callbackTime = cbTime;
      else upData.callbackTime = "";
      if(extra) {
        if(extra.budget)     upData.budget     = extra.budget;
        if(extra.project)    upData.project    = extra.project;
        if(extra.unitType)   upData.unitType   = extra.unitType;
        if(extra.eoiDeposit) upData.eoiDeposit = extra.eoiDeposit;
        if(extra.deposit && !routeFeedbackViaApi && !dropFeedback) {
          upData.notes = (upData.notes?upData.notes+" | ":"")+"Down Payment: "+extra.deposit+" EGP | Installments: "+extra.instalment+" EGP";
        }
      }
      if(comment && !routeFeedbackViaApi && !dropFeedback) upData.notes = comment;
      if(pendingStatus.newStatus === "EOI") upData.eoiDate = extra&&extra.eoiDate ? new Date(extra.eoiDate).toISOString() : new Date().toISOString();
      // Set dealDate to today when converting to DoneDeal (don't use eoiDate)
      if(pendingStatus.newStatus === "DoneDeal") upData.dealDate = new Date().toISOString().slice(0,10);
      // Notify admin when DoneDeal or EOI
      if(pendingStatus.newStatus==="DoneDeal"||pendingStatus.newStatus==="EOI"){
        var notifEntry={leadName:selected?selected.name:"",leadId:pendingStatus.leadId,agentName:p.cu.name,status:pendingStatus.newStatus,budget:extra&&extra.budget?extra.budget:""};
        if(p.addDealNotif) p.addDealNotif(notifEntry);
      }
      var updated = await apiFetch("/api/leads/"+pendingStatus.leadId,"PUT",upData,p.token);
      // Immediate UI update from PUT response
      if(updated&&updated._id){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===pendingStatus.leadId?updated:l;});});if(selected&&gid(selected)===pendingStatus.leadId)setSelected(updated);}
      // Managerial feedback routing — separate POST to /feedback because
      // PUT silently stripped notes/lastFeedback for these roles before the
      // visibility model existed (and now hard-rejects them with 400).
      if (routeFeedbackViaApi && fb && fb.text) {
        try {
          var feedbackBody = { text: fb.text, visibility: fb.visibility || "private" };
          if (feedbackBody.visibility === "to_sales") feedbackBody.targetAgentId = fb.targetAgentId;
          var fbResp = await apiFetch("/api/leads/"+pendingStatus.leadId+"/feedback","POST",feedbackBody,p.token);
          if (fbResp && fbResp.lead && fbResp.lead._id) {
            updated = fbResp.lead;
            p.setLeads(function(prev){return prev.map(function(l){return gid(l)===pendingStatus.leadId?fbResp.lead:l;});});
            if (selected && gid(selected)===pendingStatus.leadId) setSelected(fbResp.lead);
          }
        } catch(fbErr) { alert("Feedback save failed: "+(fbErr.message||"Unknown error")); }
      }
      // Upload any EOI documents picked in the status modal
      if (extra && Array.isArray(extra.eoiDocumentFiles) && extra.eoiDocumentFiles.length>0) {
        for (var i=0; i<extra.eoiDocumentFiles.length; i++) {
          var f = extra.eoiDocumentFiles[i];
          if (!f || !f.fileData) continue;
          try {
            var withDocs = await apiFetch("/api/leads/"+pendingStatus.leadId+"/eoi-documents","POST",{fileData:f.fileData, fileName:f.fileName||""},p.token);
            if (withDocs && withDocs._id) { updated = withDocs; p.setLeads(function(prev){return prev.map(function(l){return gid(l)===pendingStatus.leadId?withDocs:l;});}); if(selected&&gid(selected)===pendingStatus.leadId) setSelected(withDocs); }
          } catch(docErr) { console.error("EOI document upload failed:", docErr.message); }
        }
      }
      try { await apiFetch("/api/activities","POST",{leadId:pendingStatus.leadId,type:"status_change",note:"["+pendingStatus.newStatus+"] "+comment},p.token); } catch(actE){ console.error("activity log error:",actE.message); }
      // Background re-fetch for correct per-agent overlay
      apiFetch("/api/leads/"+pendingStatus.leadId,"GET",null,p.token).then(function(freshLead){if(freshLead&&freshLead._id){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===pendingStatus.leadId?freshLead:l;});});if(selected&&gid(selected)===pendingStatus.leadId)setSelected(freshLead);}}).catch(function(){});
      p.setActivities(function(prev){return [{_id:Date.now(),userId:{name:p.cu.name},leadId:{_id:pendingStatus.leadId,name:selected?selected.name:""},type:"status_change",note:"["+pendingStatus.newStatus+"] "+comment,createdAt:new Date().toISOString()}].concat(prev);});
      // Track NoAnswer count for rotation
      if(pendingStatus.newStatus==="NoAnswer"){
        var naKey="crm_na_count_"+pendingStatus.leadId;
        var naTimeKey="crm_na_time_"+pendingStatus.leadId;
        var naCount=0; try{naCount=Number(localStorage.getItem(naKey)||0);}catch(e){}
        naCount+=1; try{localStorage.setItem(naKey,String(naCount));localStorage.setItem(naTimeKey,String(Date.now()));}catch(e){}
      } else {
        // Reset NoAnswer count if status changed to something else
        try{localStorage.removeItem("crm_na_count_"+pendingStatus.leadId);localStorage.removeItem("crm_na_time_"+pendingStatus.leadId);}catch(e){}
        // Reset no-activity rotation flags
        try{localStorage.removeItem("crm_noact2_"+pendingStatus.leadId);localStorage.removeItem("crm_hotrot_"+pendingStatus.leadId);localStorage.removeItem("crm_cbrot_"+pendingStatus.leadId);}catch(e){}
      }
      if(pendingStatus.newStatus==="DoneDeal") p.nav("deals");
      else if(pendingStatus.newStatus==="EOI") p.nav("eoi");
    } catch(e){alert(e.message);}
    setShowStatusComment(false); setPendingStatus(null); setShowStatusPicker(false);
  };

  var openHistory = async function(lead) {
    setHistoryLead(lead); setShowHistory(true); setFullHistory([]); setHistoryLoading(true);
    var isAdminRole = p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader";
    try {
      var hist = await apiFetch("/api/leads/"+gid(lead)+"/full-history","GET",null,p.token);
      var all = hist||[];
      if(!isAdminRole) {
        // Sales sees only their own activities
        all = all.filter(function(a){
          var auid = String(a.userId&&a.userId._id?a.userId._id:a.userId||"");
          return auid===String(p.cu.id||"");
        });
      }
      // Sort oldest to newest
      all = all.slice().sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);});
      setFullHistory(all);
    } catch(e){ setFullHistory([]); }
    setHistoryLoading(false);
  };

  var archiveLead = async function(lid) {
    if(!window.confirm(t.archiveConfirm)) return;
    try {
      await apiFetch("/api/leads/"+lid+"/archive","PUT",null,p.token,p.csrfToken);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===lid?Object.assign({},l,{archived:true}):l;});});
      if(selected&&gid(selected)===lid) setSelected(null);
    } catch(e){alert(e.message);}
  };

  var logActivity = async function() {
    if(!actNote.trim()||!selected) return;
    setSaving(true);
    try {
      var act = await apiFetch("/api/activities","POST",{leadId:gid(selected),type:actType,note:actNote},p.token);
      p.setActivities(function(prev){return [act].concat(prev);});
      var updated = await apiFetch("/api/leads/"+gid(selected),"PUT",{lastActivityTime:new Date()},p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selected)?updated:l;});});
      setSelected(updated); setActNote(""); setShowActForm(false);
    } catch(e){alert(e.message);}
    setSaving(false);
  };

  var handleImport = async function(e) {
    var file=e.target.files[0]; if(!file)return;
    setImporting(true); setImportMsg("");
    try {
      var rows=[];
      if(file.name.endsWith(".csv")){var txt=await file.text();var lines=txt.split(/\r?\n/).filter(Boolean);if(lines.length<2){setImportMsg(t.importErr);setImporting(false);return;}var hdrs=lines[0].split(",").map(function(h){return h.trim().replace(/['"]/g,"").toLowerCase();});rows=lines.slice(1).map(function(line){var vals=line.split(",").map(function(v){return v.trim().replace(/['"]/g,"");});var obj={};hdrs.forEach(function(h,i){obj[h]=vals[i]||"";});return obj;});}
      else{var XLSX=await loadXLSX();var wb=XLSX.read(await file.arrayBuffer(),{type:"array"});var ws=wb.Sheets[wb.SheetNames[0]];var raw=XLSX.utils.sheet_to_json(ws,{defval:""});rows=raw.map(function(r){var o={};Object.keys(r).forEach(function(k){o[k.toLowerCase().trim()]=String(r[k]);});return o;});}
      var toImport=rows.map(rowToLead).filter(function(l){return l.name&&l.phone;});
      if(!toImport.length){setImportMsg(t.importErr);setImporting(false);return;}
      var agId="";
      var created=[]; for(var i=0;i<toImport.length;i++){try{var lead=await apiFetch("/api/leads","POST",Object.assign({},toImport[i],{agentId:agId,source:isReq?"Daily Request":toImport[i].source,status:"NewLead",phone2:toImport[i].phone2||""}),p.token);if(toImport[i].phone2){try{var cache=JSON.parse(localStorage.getItem("phone2_cache")||"{}");if(lead._id)cache[String(lead._id)]=toImport[i].phone2;localStorage.setItem("phone2_cache",JSON.stringify(cache));}catch(e){}}created.push(lead);}catch(ex){}}
      p.setLeads(function(prev){return created.concat(prev);});
      setImportMsg("✅ "+t.importDone+": "+created.length);
    } catch(ex){setImportMsg(t.importErr+": "+ex.message);}
    setImporting(false); e.target.value="";
  };

  var doBulkReassign = async function(force) {
    if(!bulkAgent||selected2.length===0) return;
    try {
      var body = {leadIds:selected2, agentId:bulkAgent};
      if (force === true) body.force = true;
      var res = await apiFetch("/api/leads/bulk-reassign","PUT",body,p.token,p.csrfToken);
      // Backend returns { total, reassigned, skippedSelf, skippedPrevious, notFound }.
      // When skippedPrevious > 0 and we haven't already forced, offer the admin
      // an explicit confirm-and-force retry. skippedSelf is silent — same-agent
      // skips are never overridable (no point re-pushing an assignment to the
      // current owner).
      var skippedPrev = res && typeof res.skippedPrevious === "number" ? res.skippedPrevious : 0;
      if (!force && skippedPrev > 0) {
        var ok = window.confirm(skippedPrev + " lead" + (skippedPrev===1?" has":"s have") + " already been handled by the selected agent. Force reassign anyway?");
        if (ok) { await doBulkReassign(true); return; }
      }
      var updAgent=p.users.find(function(u){return gid(u)===bulkAgent;});
      p.setLeads(function(prev){return prev.map(function(l){return selected2.includes(gid(l))?Object.assign({},l,{agentId:updAgent||bulkAgent}):l;});});
      setSelected2([]); setShowBulk(false);
      // Surface the breakdown so the admin can see what actually happened.
      var summary = (res && typeof res.reassigned === "number")
        ? ("Reassigned "+res.reassigned+"/"+res.total+(res.skippedSelf?(" · "+res.skippedSelf+" skipped (same agent)"):"")+(!force&&skippedPrev?(" · "+skippedPrev+" skipped (previously held)"):"")+(res.notFound?(" · "+res.notFound+" not found"):""))
        : null;
      if (summary) alert(summary);
    } catch(e){alert(e.message);}
  };

  var leadActs = selected ? p.activities.filter(function(a){ var lid=gid(selected); return a.leadId&&(gid(a.leadId)===lid||a.leadId===lid); }) : [];

  var specialFilterLabel = (function(){
    if (!p.specialFilter||!p.specialFilter.type) return "";
    if (p.specialFilter.type === "aging") {
      var aMin = p.specialFilter.ageMin, aMax = p.specialFilter.ageMax;
      if (typeof aMin === "number" && typeof aMax === "number") return "Aging: " + aMin + "\u2013" + aMax + " days no contact";
      if (typeof aMin === "number") return "Aging: " + aMin + "+ days no contact";
      if (typeof aMax === "number") return "Aging: under " + aMax + " days no contact";
      return "Aging filter";
    }
    if (p.specialFilter.type === "project") {
      return "Project: " + (p.specialFilter.value || "(no project)");
    }
    var m = {untouched:"Untouched leads (no activity since assignment)",missingFeedback:"Missing feedback (empty notes)",stale48h:"Stale leads \u2014 no activity 48h+",noRotation:"Locked leads (noRotation flag)",rotatedThisMonth:"Rotated this month",interested:"Interested leads (HotCase + Potential)"};
    return m[p.specialFilter.type]||p.specialFilter.type;
  })();
  return <div style={{ padding:"18px 16px 40px" }}>
    {p.specialFilter&&p.specialFilter.type&&<div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"10px 14px", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, marginBottom:12 }}>
      <div style={{ fontSize:13, color:"#1D4ED8", fontWeight:600, minWidth:0, overflow:"hidden", textOverflow:"ellipsis" }}>Showing: {specialFilterLabel} <span style={{ color:"#64748B", fontWeight:500 }}>({filtered.length})</span></div>
      <button onClick={function(){if(p.setSpecialFilter)p.setSpecialFilter(null);}} style={{ background:"#fff", border:"1px solid #BFDBFE", color:"#1D4ED8", fontSize:12, fontWeight:600, padding:"4px 10px", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>Clear filter <X size={13}/></button>
    </div>}
    <WaChooser show={!!waChooser} phone={waChooser} onClose={function(){setWaChooser(null);}}/>
    {showStatusPicker&&selected&&!showStatusComment&&<Modal show={true} onClose={function(){setShowStatusPicker(false);}} title={t.changeStatus}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        {sc.map(function(s){return <button key={s.value} onClick={function(){reqStatus(gid(selected),s.value);}} style={{ padding:"8px 14px", borderRadius:9, border:"1px solid "+s.color, background:selected.status===s.value?s.bg:"#fff", color:s.color, fontSize:13, fontWeight:600, cursor:"pointer" }}>{s.label}</button>;})}
      </div>
      <Btn outline onClick={function(){setShowStatusPicker(false);}} style={{ width:"100%" }}>{t.cancel}</Btn>
    </Modal>}
    <StatusModal show={showStatusComment} t={t} newStatus={pendingStatus?pendingStatus.newStatus:null} lead={selected} cu={p.cu} users={p.users} onClose={function(){setShowStatusComment(false);}} onConfirm={confirmStatus}/>

    {feedbackModal && <Modal show={true} onClose={function(){ if(!fbSaving) setFeedbackModal(null); }} title="📝 Add Feedback">
      <FeedbackComposer id="standalone" cu={p.cu} lead={feedbackModal.lead} users={p.users}
        value={fbForm} rows={4}
        onChange={function(v){ setFbForm(v); setFbErr(""); }}/>
      {(function(){
        // Show this manager's own existing private notes for context.
        var pn = (feedbackModal.lead && Array.isArray(feedbackModal.lead.privateNotes)) ? feedbackModal.lead.privateNotes : [];
        if (!pn.length) return null;
        return <div style={{ marginTop:14, padding:"10px 12px", background:"#F8FAFC", borderRadius:10, border:"1px solid #E2E8F0" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:6 }}>YOUR PRIVATE NOTES ({pn.length})</div>
          {pn.slice().reverse().slice(0,5).map(function(n,i){
            return <div key={i} style={{ fontSize:12, color:C.text, marginBottom:6, paddingLeft:8, borderLeft:"2px solid #CBD5E1" }}>
              {n.text}
              <div style={{ fontSize:10, color:C.textLight, marginTop:2 }}>{new Date(n.createdAt).toLocaleString("en-GB")}</div>
            </div>;
          })}
        </div>;
      })()}
      {fbErr && <div style={{ fontSize:12, color:C.danger, marginTop:8 }}>{fbErr}</div>}
      <div style={{ display:"flex", gap:10, marginTop:14 }}>
        <Btn outline onClick={function(){ setFeedbackModal(null); }} disabled={fbSaving} style={{ flex:1 }}>Cancel</Btn>
        <Btn loading={fbSaving} onClick={async function(){
          var text = (fbForm.text || "").trim();
          if (!text) { setFbErr("Please type the feedback text"); return; }
          if (fbForm.visibility === "to_sales" && !fbForm.targetAgentId) { setFbErr("Pick a sales agent to send the feedback to"); return; }
          setFbSaving(true);
          try {
            var body = { text: text, visibility: fbForm.visibility };
            if (fbForm.visibility === "to_sales") body.targetAgentId = fbForm.targetAgentId;
            var res = await apiFetch("/api/leads/"+gid(feedbackModal.lead)+"/feedback","POST",body,p.token);
            if (res && res.lead && res.lead._id) {
              p.setLeads(function(prev){ return prev.map(function(l){ return gid(l)===gid(res.lead) ? res.lead : l; }); });
              if (selected && gid(selected) === gid(res.lead)) setSelected(res.lead);
            }
            setFeedbackModal(null);
          } catch(e) { setFbErr(e.message || "Failed to save feedback"); }
          finally { setFbSaving(false); }
        }} style={{ flex:1 }}>{fbSaving ? "Saving…" : "Save feedback"}</Btn>
      </div>
    </Modal>}

    {/* Bulk Reassign Modal */}
    <Modal show={showBulk} onClose={function(){setShowBulk(false);}} title={t.bulkReassign}>
      <div style={{ marginBottom:14, padding:"10px 14px", background:"#F0F9FF", borderRadius:10, fontSize:13 }}>{selected2.length} leads selected</div>
      <Inp label={t.reassignTo} type="select" value={bulkAgent} onChange={function(e){setBulkAgent(e.target.value);}} options={[{value:"",label:"- Select Agent -"}].concat((isOnlyAdmin?p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;}):myTeamUsers).map(function(u){return{value:gid(u),label:u.name+" - "+u.title};}))}/>
      <div style={{ display:"flex", gap:10 }}><Btn outline onClick={function(){setShowBulk(false);}} style={{ flex:1 }}>{t.cancel}</Btn><Btn onClick={doBulkReassign} style={{ flex:1 }}>{t.bulkReassign}</Btn></div>
    </Modal>

    {/* Sticky Toolbar */}
    <div style={{ position:"sticky", top:64, zIndex:90, background:"#F8FAFC", margin:"0 -16px 14px", padding:"8px 16px 8px", borderBottom:"1px solid #E8ECF1", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {(function(){
          var base = [{v:"all",l:t.all}].concat(tabSc.map(function(s){return{v:s.value,l:s.label};}));
          if (isAdmin) base.push({v:"important",l:"⭐ Important"});
          return base;
        })().map(function(s){
          var cnt;
          if (s.v==="all") cnt = allVisible.length;
          else if (s.v==="important") cnt = allVisible.filter(function(l){ return qualifyingMarks(l).length > 0; }).length;
          else if (s.v==="NewLead") cnt = allVisible.filter(isGenuineNewLead).length;
          else cnt = allVisible.filter(function(l){ return currentStatus(l)===s.v; }).length;
          return <button key={s.v} onClick={function(){setLockedOnly(false);p.setFilter(s.v);}} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid", borderColor:p.leadFilter===s.v?C.accent:"#E8ECF1", background:p.leadFilter===s.v?C.accent+"12":"#fff", color:p.leadFilter===s.v?C.accent:C.textLight, fontSize:11, fontWeight:500, cursor:"pointer" }}>{s.l} ({cnt})</button>;
        })}
      </div>
      {isAdmin&&<div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {[
          {v:"all",l:"All Time"},
          {v:"today",l:"Today"},
          {v:"yesterday",l:"Yesterday"},
          {v:"week",l:"This Week"},
          {v:"month",l:"This Month"},
          {v:"quarter",l:"This Quarter"}
        ].map(function(d){
          var on = dateRange===d.v;
          return <button key={d.v} onClick={function(){setDateRange(d.v);}} style={{ padding:"4px 9px", borderRadius:14, border:"1px solid", borderColor:on?C.info:"#E8ECF1", background:on?"#EFF6FF":"#fff", color:on?"#1D4ED8":C.textLight, fontSize:11, fontWeight:on?600:500, cursor:"pointer" }}>{d.l}</button>;
        })}
      </div>}
      <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
        {selected2.length>0&&isAdmin&&<Btn outline onClick={function(){setShowBulk(true);}} style={{ padding:"7px 11px", fontSize:12, color:C.info, borderColor:C.info }}><RotateCcw size={13}/> {t.bulkReassign} ({selected2.length})</Btn>}
        {selected2.length>0&&isOnlyAdmin&&<Btn outline onClick={async function(){
          if(!window.confirm("Archive "+selected2.length+" leads?"))return;
          var ids=[...selected2];
          for(var i=0;i<ids.length;i++){
            try{await apiFetch("/api/leads/"+ids[i]+"/archive","PUT",null,p.token);}catch(e){}
          }
          p.setLeads(function(prev){return prev.map(function(l){return ids.includes(gid(l))?Object.assign({},l,{archived:true}):l;});});
          setSelected2([]);
          if(selected&&ids.includes(gid(selected)))setSelected(null);
        }} style={{ padding:"7px 11px", fontSize:12, color:C.warning, borderColor:C.warning }}><Archive size={13}/> Archive ({selected2.length})</Btn>}
        {selected2.length>0&&<Btn outline onClick={function(){setShowBulkWa(true);}} style={{ padding:"7px 11px", fontSize:12, color:"#25D366", borderColor:"#25D366" }}>💬 {t.bulkWhatsApp} ({selected2.length})</Btn>}
        <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleImport} style={{ display:"none" }}/>
        {isOnlyAdmin&&<Btn outline onClick={function(){fileRef.current.click();}} loading={importing} style={{ padding:"7px 11px", fontSize:12 }}><Upload size={13}/> {t.importExcel}</Btn>}
        {isOnlyAdmin&&<Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 11px", fontSize:12 }}><Plus size={14}/> {isReq?t.addRequest:t.addLead}</Btn>}
        {p.cu&&p.cu.role==="admin"&&<Btn outline onClick={function(){exportLeadsToExcel(filtered,p.users,isReq?"daily_requests":"leads");}} style={{ padding:"7px 11px", fontSize:12, color:C.success, borderColor:C.success }}><FileSpreadsheet size={13}/> {t.exportExcel}</Btn>}
        {!notifGranted&&<Btn outline onClick={async function(){var ok=await requestNotifPermission();setNotifGranted(ok);}} style={{ padding:"7px 11px", fontSize:12, color:C.warning, borderColor:C.warning }}><Bell size={13}/> {t.enableNotif}</Btn>}
        {!p.isMobile&&isOnlyAdmin&&<Btn outline onClick={function(){setShowQuickAdd(true);}} style={{ padding:"7px 11px", fontSize:12, color:C.info, borderColor:C.info }}><Zap size={13}/> {t.quickAdd}</Btn>}
      </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <select value={sortBy} onChange={function(e){setLockedOnly(false);setSortBy(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
          <option value="lastActivity">⏱ Last Activity</option>
          <option value="newest">🆕 Newest</option>
          <option value="oldest">📅 Oldest</option>
          <option value="name">🔤 Name</option>
        </select>
        {isAdmin&&<select value={agentFilter} onChange={function(e){setLockedOnly(false);setAgentFilter(e.target.value);setNoAgentFilter(false);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
          <option value="">👤 All Agents</option>
          {salesUsers.map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name}</option>;})}
        </select>}
        {isOnlyAdmin&&<button onClick={function(){setLockedOnly(false);setNoAgentFilter(!noAgentFilter);setAgentFilter("");}} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid", borderColor:noAgentFilter?"#EF4444":"#E8ECF1", background:noAgentFilter?"#FEE2E2":"#fff", color:noAgentFilter?"#B91C1C":C.textLight, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>🚫 No Agent {noAgentFilter?"✓":""}</button>}
        <button onClick={function(){setLockedOnly(false);setVipFilter(!vipFilter);}} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid", borderColor:vipFilter?"#F59E0B":"#E8ECF1", background:vipFilter?"#FEF3C7":"#fff", color:vipFilter?"#B45309":C.textLight, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>⭐ VIP Only {vipFilter?"✓":""}</button>
        {isOnlyAdmin&&<button onClick={function(){
          if (!lockedOnly) {
            // Turning ON — clear every other user-applied filter.
            p.setFilter("all");
            setAgentFilter("");
            setNoAgentFilter(false);
            setVipFilter(false);
            setSortBy("lastActivity");
            if (p.setSearch) p.setSearch("");
          }
          setLockedOnly(!lockedOnly);
        }} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid", borderColor:lockedOnly?"#EC4899":"#E8ECF1", background:lockedOnly?"#FCE7F3":"#fff", color:lockedOnly?"#BE185D":C.textLight, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>🔒 Locked Only{lockedOnly?" ("+filtered.length+")":""}</button>}
      </div>
    </div>
    {importMsg&&<div style={{ marginBottom:10, padding:"9px 14px", background:importMsg.startsWith("✅")?"#DCFCE7":"#FEE2E2", color:importMsg.startsWith("✅")?"#15803D":"#B91C1C", borderRadius:9, fontSize:13 }}>{importMsg}</div>}

    <div style={{ display:"flex", gap:14, paddingRight:!p.isMobile&&selected?330:0, transition:"padding-right 0.25s" }}>
      {/* Status dropdown overlay */}
      {statusDrop&&<div style={{ position:"fixed", inset:0, zIndex:499 }} onClick={function(){setStatusDrop(null);}}/>}
    {/* Table */}
      {p.leadFilter==="important"?<Card style={{ flex:1, padding:0, overflow:"hidden", minWidth:0 }}>
        <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:p.isMobile?720:900 }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>{t.name}</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>{t.phone}</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>First Marked By</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:110 }}>First Mark Date</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:110 }}>First Status</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:160 }}>Feedback</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:110 }}>Current Status</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>Current Agent</th>
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={8} style={{ padding:40, textAlign:"center", color:C.textLight, fontSize:13 }}>No important leads</td></tr>}
              {filtered.map(function(lead){
                var lid=gid(lead);
                var marks=qualifyingMarks(lead);
                var first=marks[0]||{};
                var curSt=currentStatus(lead);
                var curSo=sc.find(function(s){return s.value===curSt;})||sc[0];
                var firstSo=sc.find(function(s){return s.value===first.status;})||{label:first.status||"",bg:"#F1F5F9",color:"#64748B"};
                var firstDate=first.date?new Date(first.date).toLocaleDateString("en-GB"):"—";
                var curAgentName=lead.agentId&&lead.agentId.name?lead.agentId.name:(function(){var u=p.users.find(function(x){return gid(x)===lead.agentId;});return u?u.name:"—";})();
                var isSel=selected&&gid(selected)===lid;
                return <tr key={lid} onClick={function(){setSelected(lead);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSel?"#EFF6FF":"transparent" }}>
                  <td style={{ padding:"10px 12px", fontSize:13, fontWeight:600, color:C.text, textAlign:"left", whiteSpace:"nowrap" }}>{lead.name}</td>
                  <td style={{ padding:"10px 12px", fontSize:13, fontWeight:600, textAlign:"left", whiteSpace:"nowrap", direction:"ltr" }}><PhoneCell phone={lead.phone}/></td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.text, textAlign:"left", whiteSpace:"nowrap" }}>{first.agentName||"—"}</td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.textLight, textAlign:"left", whiteSpace:"nowrap" }}>{firstDate}</td>
                  <td style={{ padding:"10px 12px", textAlign:"left" }}>
                    <span style={{ background:firstSo.bg, color:firstSo.color, padding:"3px 9px", borderRadius:14, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{firstSo.label||first.status||"—"}</span>
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.text, textAlign:"left", maxWidth:240, wordBreak:"break-word", whiteSpace:"normal", lineHeight:1.4 }}>{first.feedback||<span style={{color:"#CBD5E1"}}>—</span>}</td>
                  <td style={{ padding:"10px 12px", textAlign:"left" }}>
                    <span style={{ background:curSo.bg, color:curSo.color, padding:"3px 9px", borderRadius:14, fontSize:11, fontWeight:600, whiteSpace:"nowrap", border:"1px dashed "+curSo.color }}>{curSo.label}</span>
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.text, textAlign:"left", whiteSpace:"nowrap" }}>{curAgentName}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>:p.isMobile&&!selected?<div style={{ display:"flex", flexDirection:"column", gap:12, padding:"4px 16px", maxWidth:480, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
        {filtered.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight }}>No data</div>}
        {filtered.map(function(lead){
          var lid=gid(lead); var curSt=currentStatus(lead); var curFb=currentFeedback(lead); var so=sc.find(function(s){return s.value===curSt;})||sc[0]; var isVIP=lead.isVIP;
          var lastAct=lead.lastActivityTime?timeAgo(lead.lastActivityTime,t):"—";
          var actColor=lead.lastActivityTime&&(Date.now()-new Date(lead.lastActivityTime).getTime())>3*24*60*60*1000?C.danger:C.accent;
          var borderCol=isVIP?"#F59E0B":so.color||"#E8ECF1";
          var isRotated = isOnlyAdmin && lead.previousAgentIds && lead.previousAgentIds.filter(function(x){ return x != null; }).length > 0;
          return <div key={lid} onClick={function(){setSelected(lead);}}
            style={{ background:isRotated?"#FFF7ED":"#fff", borderRadius:16, padding:"16px",
              border:"2px solid "+borderCol,
              cursor:"pointer", boxShadow:"0 3px 12px "+borderCol+"35" }}>
            {/* Header row */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:16, fontWeight:700, color:isVIP?C.accent:C.text, marginBottom:3 }}>{isVIP?"⭐ ":""}{lead.name}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, direction:"ltr" }}><PhoneCell phone={lead.phone}/></div>
                {(function(){var agName=lead.agentId&&lead.agentId.name?lead.agentId.name:"";return agName?<div style={{ fontSize:11, color:C.accent, fontWeight:600, marginTop:2 }}>👤 {agName}</div>:null;})()}
              </div>
              <span style={{ background:so.bg, color:so.color, padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:700, whiteSpace:"nowrap", marginLeft:8 }}>{so.label}</span>
            </div>
            {/* Phone2 */}
            {lead.phone2&&<div style={{ fontSize:12, fontWeight:700, color:C.text, direction:"ltr", marginBottom:4 }}><PhoneCell phone={lead.phone2}/></div>}
            {/* Campaign + Project + Last Activity — order mirrors the table (Campaign → Project → Status). */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:4 }}>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {lead.campaign&&<span style={{ fontSize:11, color:"#0369A1", fontWeight:700, background:"#E0F2FE", padding:"2px 8px", borderRadius:6 }}>📣 {lead.campaign}</span>}
                {lead.project?<span style={{ fontSize:11, color:"#6D28D9", fontWeight:700, background:"#EDE9FE", padding:"2px 8px", borderRadius:6 }}>📍 {lead.project}</span>:<span style={{ color:C.textLight, fontSize:11 }}>—</span>}
              </div>
              <span style={{ fontSize:11, color:actColor, fontWeight:600 }}>🕐 {lastAct}</span>
            </div>
            {/* Last Feedback (current holder's slice) */}
            {curFb&&<div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:8, padding:"6px 10px", background:"#F8FAFC", borderRadius:8, borderLeft:"3px solid "+C.accent }}>💬 {curFb}</div>}
            {/* Callback time */}
            {lead.callbackTime&&(function(){var ci=callbackColor(lead.callbackTime);return <div style={{ fontSize:11, fontWeight:600, color:ci?ci.color:C.textLight, marginBottom:8, padding:"4px 10px", background:ci?ci.bg:"#F8FAFC", borderRadius:8 }}>📞 {lead.callbackTime.slice(0,16).replace("T"," ")}</div>;})()}
            {/* Action buttons */}
            <div style={{ display:"flex", gap:8 }}>
              <a href={"tel:"+cleanPhone(lead.phone)} onClick={async function(e){e.stopPropagation();try{await apiFetch("/api/activities","POST",{leadId:gid(lead),type:"call",note:"📞 Call initiated"},p.token);}catch(ex){}}}
                style={{ flex:1, padding:"11px", borderRadius:10, background:"#EFF6FF", color:"#1D4ED8", fontSize:13, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:6, border:"1px solid #BFDBFE" }}>
                <Phone size={14} color="#1D4ED8"/> Call
              </a>
              <button onClick={function(e){e.stopPropagation();setWaChooser(lead.phone);}}
                style={{ flex:1, padding:"11px", borderRadius:10, background:"#DCFCE7", color:"#15803D", fontSize:13, fontWeight:700, border:"1px solid #22C55E60", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="#15803D"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp
              </button>
            </div>
          </div>;
        })}
      </div>:<Card style={{ flex:1, padding:0, overflow:"hidden", minWidth:0 }}>
        <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:p.isMobile?600:900 }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
              <th style={{ padding:"10px 8px", width:32 }}><input type="checkbox" onChange={function(e){setSelected2(e.target.checked?filtered.map(function(l){return gid(l);}):[])}}/></th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:100 }}>{t.name}</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>{t.phone}</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:110 }}>{t.phone2}</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:110 }}>Campaign</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:100 }}>{t.project}</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:110 }}>{t.status}</th>
              {!p.isMobile&&<th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>Last Feedback</th>}
              {!p.isMobile&&isAdmin&&<th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:90 }}>{t.source}</th>}
              {isAdmin&&<th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:100 }}>{t.agent}</th>}
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:90 }}>{t.lastActivity}</th>
              {!p.isMobile&&<th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>{t.callbackTime}</th>}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={10} style={{ padding:40, textAlign:"center", color:C.textLight, fontSize:13 }}>No data</td></tr>}
              {filtered.map(function(lead){
                var lid=gid(lead); var curSt=currentStatus(lead); var curFb=currentFeedback(lead); var so=sc.find(function(s){return s.value===curSt;})||sc[0];
                var isSel=selected&&gid(selected)===lid; var isChk=selected2.includes(lid); var isVIP=lead.isVIP;
                var isRotated = isOnlyAdmin && lead.previousAgentIds && lead.previousAgentIds.filter(function(x){ return x != null; }).length > 0;
                return <tr key={lid} onClick={function(){setSelected(lead);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSel?"#EFF6FF":isVIP?"#FFFBEB":isChk?"#F0FDF4":isRotated?"#FFF7ED":"transparent", transition:"background 0.12s", borderRight:isVIP?"3px solid #F59E0B":"3px solid transparent" }}>
                  <td style={{ padding:"10px 8px" }} onClick={function(e){e.stopPropagation();setSelected2(function(prev){return prev.includes(lid)?prev.filter(function(x){return x!==lid;}):[...prev,lid];});}}><input type="checkbox" checked={isChk} readOnly/></td>
                  <td style={{ padding:"10px 12px", textAlign:"left" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      {lead.isVIP&&<span style={{ fontSize:14 }} title="VIP">⭐</span>}
                      {lead.locked&&<span style={{ fontSize:12 }} title="Locked — no rotation">🔒</span>}
                      {lead.rotationStopped&&<span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:5, background:"#FEE2E2", color:"#991B1B", whiteSpace:"nowrap" }} title="Rotation permanently stopped — 3 consecutive Not Interested">🛑 Rotation Stopped</span>}
                      <div style={{ fontSize:13, fontWeight:600, color:lead.isVIP?C.accent:C.text, whiteSpace:"nowrap" }}>{lead.name}</div>
                    </div>
                    <div style={{ fontSize:10, color:C.textLight }}>{lead.email}</div>
                  </td>
                  <td style={{ padding:"10px 12px", whiteSpace:"nowrap", textAlign:"left" }}>
                    <div style={{ fontSize:14, fontWeight:600, direction:"ltr", display:"inline-block" }}><PhoneCell phone={lead.phone}/></div>
                    <div style={{ display:"flex", gap:6, marginTop:3, justifyContent:"flex-start" }}>
                      <a href={"tel:"+cleanPhone(lead.phone)} onClick={function(e){e.stopPropagation();}} style={{ fontSize:12, color:"#60A5FA", textDecoration:"none", display:"flex", alignItems:"center", gap:3, padding:"2px 6px", borderRadius:6, background:"#EFF6FF" }}><Phone size={12}/> {t.call}</a>
                      <a href={"https://wa.me/"+waPhone(lead.phone)} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ fontSize:12, color:"#25D366", textDecoration:"none", display:"flex", alignItems:"center", gap:3, padding:"2px 6px", borderRadius:6, background:"#DCFCE720" }}><svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> {t.whatsapp}</a>
                    </div>
                  </td>
                  <td style={{ padding:"10px 12px", whiteSpace:"nowrap", textAlign:"left" }}>
                    {lead.phone2&&lead.phone2!==lead.phone?(function(){
                      return <div>
                        <div style={{ fontSize:14, fontWeight:600, direction:"ltr" }}><PhoneCell phone={lead.phone2}/></div>
                        <div style={{ display:"flex", gap:6, marginTop:3 }}>
                          <a href={"tel:"+cleanPhone(lead.phone2)} onClick={function(e){e.stopPropagation();}} style={{ fontSize:p.isMobile?10:12, color:"#60A5FA", textDecoration:"none", display:"flex", alignItems:"center", gap:3, padding:p.isMobile?"0":"2px 6px", borderRadius:6, background:p.isMobile?"transparent":"#EFF6FF" }}><Phone size={p.isMobile?9:12}/>{!p.isMobile&&" Call"}</a>
                          <a href={"https://wa.me/"+waPhone(lead.phone2)} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ fontSize:p.isMobile?10:12, color:"#25D366", textDecoration:"none", display:"flex", alignItems:"center", gap:3, padding:p.isMobile?"0":"2px 6px", borderRadius:6, background:p.isMobile?"transparent":"#DCFCE720" }}><svg viewBox="0 0 24 24" width={p.isMobile?14:16} height={p.isMobile?14:16} fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>{!p.isMobile&&" WhatsApp"}</a>
                        </div>
                      </div>;
                    })():<span style={{ fontSize:12, direction:"ltr", display:"inline-block" }}>{lead.phone2?<PhoneCell phone={lead.phone2}/>:<span style={{color:"#CBD5E1"}}>-</span>}</span>}
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.textLight, textAlign:"left", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.campaign||<span style={{color:"#CBD5E1"}}>-</span>}</td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.textLight, textAlign:"left", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.project}</td>
                  <td style={{ padding:"10px 12px", position:"relative" }} onClick={function(e){e.stopPropagation();}}>
                    <div style={{ position:"relative", display:"inline-block" }}>
                      <span style={{ background:so.bg, color:so.color, padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:600, whiteSpace:"nowrap", border:"1px dashed "+so.color, display:"inline-flex", alignItems:"center", gap:4, cursor:"pointer" }}
                        onClick={function(e){e.stopPropagation();setStatusDrop(statusDrop===lid?null:lid);}}>
                        {so.label} ▼
                      </span>
                      {statusDrop===lid&&<div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:500, background:"#fff", borderRadius:14, padding:8, minWidth:180, boxShadow:"0 16px 48px rgba(0,0,0,0.22)", border:"1px solid #E8ECF1" }} onClick={function(e){e.stopPropagation();}}>
                        <div style={{ fontSize:12, fontWeight:600, color:C.textLight, padding:"6px 10px 10px", borderBottom:"1px solid #F1F5F9", marginBottom:4 }}>{t.changeStatus}</div>
                        {sc.map(function(s){return <div key={s.value} onClick={function(e){e.stopPropagation();setSelected(lead);reqStatus(lid,s.value);setStatusDrop(null);}} style={{ padding:"9px 12px", borderRadius:9, cursor:"pointer", display:"flex", alignItems:"center", gap:10, background:curSt===s.value?s.bg:"transparent", fontSize:13, fontWeight:curSt===s.value?600:400 }}
                          onMouseEnter={function(e){if(curSt!==s.value)e.currentTarget.style.background="#F8FAFC";}}
                          onMouseLeave={function(e){if(curSt!==s.value)e.currentTarget.style.background=curSt===s.value?s.bg:"transparent";}}>
                          <span style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0 }}/><span style={{ color:s.color }}>{s.label}</span>
                        </div>;})}
                        <div style={{ borderTop:"1px solid #F1F5F9", marginTop:4, paddingTop:4 }}><button onClick={function(e){e.stopPropagation();setStatusDrop(null);}} style={{ width:"100%", padding:"7px", borderRadius:8, border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:12, color:C.textLight }}>{t.cancel}</button></div>
                      </div>}
                    </div>
                    {(function(){if(!isOnlyAdmin||!lead.assignments||lead.assignments.length<=1)return null;var SP=["MeetingDone","HotCase","Potential","CallBack","NoAnswer","NotInterested","NewLead"];var SL={"MeetingDone":"Meeting Done","HotCase":"Hot Case","Potential":"Potential","CallBack":"Call Back","NoAnswer":"No Answer","NotInterested":"Not Interested","NewLead":"New Lead"};var curIdx=SP.indexOf(lead.status);var bestIdx=SP.length;for(var ai=0;ai<lead.assignments.length;ai++){var si=SP.indexOf(lead.assignments[ai].status);if(si>=0&&si<bestIdx)bestIdx=si;}if(bestIdx>=curIdx||bestIdx>=SP.length)return null;return <span style={{background:"#F1F5F9",color:"#64748B",padding:"2px 6px",borderRadius:8,fontSize:10,fontWeight:500,marginLeft:4,whiteSpace:"nowrap"}}>was: {SL[SP[bestIdx]]||SP[bestIdx]}</span>;})()}
                  </td>
                  {!p.isMobile&&<td style={{ padding:"10px 12px", fontSize:13, fontWeight:700, color:C.text, textAlign:"left", maxWidth:220, wordBreak:"break-word", whiteSpace:"normal", lineHeight:1.4 }}>{curFb||<span style={{color:"#CBD5E1", fontWeight:400}}>-</span>}</td>}
                  {!p.isMobile&&isAdmin&&<td style={{ padding:"10px 12px", fontSize:11, color:C.textLight, textAlign:"left", whiteSpace:"nowrap" }}>{lead.source}</td>}
                  {isAdmin&&<td style={{ padding:"10px 12px", fontSize:11, whiteSpace:"nowrap" }} onClick={function(e){e.stopPropagation();}}>
                    <select value={lead.agentId&&lead.agentId._id?lead.agentId._id:(lead.agentId||"")} onChange={async function(e){
                      var newAgent=e.target.value;
                      if(!newAgent)return;
                      var oldAgName=lead.agentId&&lead.agentId.name?lead.agentId.name:"";
                      var newAgUser=p.users.find(function(u){return gid(u)===newAgent;});
                      try{var rotRes=await apiFetch("/api/leads/"+gid(lead)+"/rotate","POST",{targetAgentId:newAgent,reason:"manual"},p.token);try{var freshLead=await apiFetch("/api/leads/"+gid(lead),"GET",null,p.token);if(freshLead&&freshLead._id){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(lead)?freshLead:l;});});if(selected&&gid(selected)===gid(lead))setSelected(freshLead);}}catch(fe){}if(rotRes.firstAssignment)return;if(oldAgName&&p.notifyRotation)p.notifyRotation(lead,oldAgName,newAgUser?newAgUser.name:"","Manual reassign");}catch(ex){}
                    }} style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", color:C.text, cursor:"pointer", maxWidth:110 }}>
                      {isOnlyAdmin&&<option value="">— No Agent —</option>}
                      {(function(){
                        // Include the current owner in options so the <select> can display
                        // their name as the current value. Server-side /rotate returns 400
                        // "same_agent" if an admin tries to rotate to the current owner, so
                        // the guard doesn't need to live in the UI.
                        var pool = isOnlyAdmin ? salesUsers : (p.myTeamUsers||salesUsers).filter(function(u){return u.role==="sales"||u.role==="team_leader";});
                        return pool.map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name}</option>;});
                      })()}
                    </select>
                  </td>}
                  <td style={{ padding:"10px 12px", fontSize:11, color:C.accent, textAlign:"left", whiteSpace:"nowrap" }}>{timeAgo(lead.lastActivityTime,t)}</td>
                  {!p.isMobile&&<td style={{ padding:"10px 12px", fontSize:11, whiteSpace:"nowrap" }}>
                    {lead.callbackTime ? (function(){
                      var ci = callbackColor(lead.callbackTime);
                      return <span style={{ padding:"2px 8px", borderRadius:12, background:ci?ci.bg:"transparent", color:ci?ci.color:C.textLight, fontSize:10, fontWeight:ci?600:400 }}>
                        {lead.callbackTime.slice(0,16).replace("T"," ")}
                      </span>;
                    })() : <span style={{ color:C.textLight }}>-</span>}
                  </td>}
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>}

      {/* Pagination Controls */}
      {p.leadsTotalPages > 1 && <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:10, marginTop:16, padding:"12px 16px", background:"#F8FAFC", borderRadius:12, border:"1px solid #E8ECF1" }}>
        <button onClick={function(){if(p.leadsPage>1){p.setLeadsPage(p.leadsPage-1);}}} disabled={p.leadsPage<=1} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #E2E8F0", background:p.leadsPage<=1?"#F1F5F9":"#fff", color:p.leadsPage<=1?C.textLight:C.text, fontSize:12, cursor:p.leadsPage<=1?"not-allowed":"pointer" }}>⬅️ Previous</button>
        <span style={{ fontSize:12, color:C.textLight }}>Page {p.leadsPage} of {p.leadsTotalPages} ({p.leadsTotal} total)</span>
        <button onClick={function(){if(p.leadsPage<p.leadsTotalPages){p.setLeadsPage(p.leadsPage+1);}}} disabled={p.leadsPage>=p.leadsTotalPages} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #E2E8F0", background:p.leadsPage>=p.leadsTotalPages?"#F1F5F9":"#fff", color:p.leadsPage>=p.leadsTotalPages?C.textLight:C.text, fontSize:12, cursor:p.leadsPage>=p.leadsTotalPages?"not-allowed":"pointer" }}>Next ➡️</button>
      </div>}

      {/* Side Panel */}
      {selected&&<Card innerRef={panelRef} style={p.isMobile?{ position:"fixed", inset:0, zIndex:300, borderRadius:0, overflowY:"auto", padding:0, margin:0 }:{ position:"fixed", top:0, right:0, bottom:0, width:320, zIndex:300, borderRadius:0, overflowY:"auto", padding:0, boxShadow:"-4px 0 24px rgba(0,0,0,0.12)" }}>
        <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:"14px 16px", position:"sticky", top:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <button onClick={function(){setSelected(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><X size={11}/></button>
            <div style={{ display:"flex", gap:5 }}>
              {isOnlyAdmin&&<button onClick={function(){setEditLead(selected);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }} title={t.edit}><Edit size={11}/></button>}
              {isOnlyAdmin&&<button onClick={function(){archiveLead(gid(selected));}} style={{ background:"rgba(255,165,0,0.3)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }} title={t.archive}><Archive size={11}/></button>}
            </div>
          </div>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{selected.name}</div>
          {selected.rotationStopped&&<div style={{ marginTop:4, display:"inline-block", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:5, background:"rgba(255,255,255,0.95)", color:"#991B1B" }} title="Rotation permanently stopped — 3 consecutive Not Interested">🛑 Rotation Stopped</div>}
          <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, marginTop:2 }}>
            {selected.phone}{selected.phone2?" / "+selected.phone2:""}
          </div>
          {/* Quick action buttons */}
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            <a href={"tel:"+cleanPhone(selected.phone)} onClick={async function(){try{await apiFetch("/api/activities","POST",{leadId:gid(selected),type:"call",note:"📞 Call initiated — "+selected.phone},p.token,p.csrfToken);p.setActivities&&p.setActivities(function(prev){return [{_id:Date.now(),type:"call",note:"📞 Call initiated",leadId:selected,userId:p.cu,createdAt:new Date().toISOString()}].concat(prev);});}catch(ex){}}} style={{ flex:1, padding:"6px", borderRadius:8, background:"#EFF6FF", color:"#60A5FA", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><Phone size={12}/> {t.call}</a>
            <a href={"https://wa.me/"+waPhone(selected.phone)} target="_blank" rel="noreferrer" style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(37,211,102,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> {t.whatsapp}</a>
          </div>
        </div>
        <div style={{ padding:"12px 14px" }}>
          {/* Status */}
          <div style={{ marginBottom:12, padding:10, background:"#F8FAFC", borderRadius:10 }}>
            <div style={{ fontSize:11, color:C.textLight, marginBottom:7, fontWeight:600 }}>{t.changeStatus}</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {sc.map(function(s){return <button key={s.value} onClick={function(){reqStatus(gid(selected),s.value);}} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid", borderColor:selected.status===s.value?s.color:"#E2E8F0", background:selected.status===s.value?s.bg:"#fff", color:selected.status===s.value?s.color:C.textLight, fontSize:10, fontWeight:600, cursor:"pointer" }}>{s.label}</button>;})}
            </div>
          </div>
          {/* Assign */}
          {isAdmin&&<div style={{ marginBottom:12, padding:10, background:"#F8FAFC", borderRadius:10 }}>
            <div style={{ fontSize:11, color:C.textLight, marginBottom:6, fontWeight:600 }}>{t.assignTo}</div>
            <select value={selected.agentId&&selected.agentId._id?selected.agentId._id:(selected.agentId||"")} onChange={async function(e){
              var newAgent=e.target.value;
              if(!newAgent)return;
              var isManagerUser=p.cu.role==="manager"||p.cu.role==="team_leader";
              if(isManagerUser&&p.cu.teamId){var tgt=p.users.find(function(u){return gid(u)===newAgent;});if(tgt&&tgt.teamId!==p.cu.teamId)return;}
              var oldAgName=selected.agentId&&selected.agentId.name?selected.agentId.name:"";
              var newAgUser=p.users.find(function(u){return gid(u)===newAgent;});
              try{var rotRes=await apiFetch("/api/leads/"+gid(selected)+"/rotate","POST",{targetAgentId:newAgent,reason:"manual"},p.token);try{var freshLead=await apiFetch("/api/leads/"+gid(selected),"GET",null,p.token);if(freshLead&&freshLead._id){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selected)?freshLead:l;});});setSelected(freshLead);}}catch(fe){}if(rotRes.firstAssignment)return;if(oldAgName&&p.notifyRotation)p.notifyRotation(selected,oldAgName,newAgUser?newAgUser.name:"","Manual reassign");}catch(ex){}
            }} style={{ width:"100%", padding:"6px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
              {isOnlyAdmin&&<option value="">— No Agent —</option>}
              {(function(){
                // Include the current owner in options so the <select> can display
                // their name as the current value. Server-side /rotate returns 400
                // "same_agent" if an admin tries to rotate to the current owner.
                var poolSel = isOnlyAdmin ? (p.myTeamUsers||salesUsers) : (p.myTeamUsers||salesUsers).filter(function(u){return u.role==="sales"||u.role==="team_leader";});
                return poolSel.map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name}</option>;});
              })()}
            </select>
          </div>}
          {/* Assigned Agents — admin remove + full feedback history */}
          {isOnlyAdmin&&selected.assignments&&selected.assignments.length>1&&<div style={{ marginBottom:12, padding:10, background:"#F0F9FF", borderRadius:10, border:"1px solid #BFDBFE" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#1D4ED8", marginBottom:6 }}>👥 Assigned Agents ({selected.assignments.length})</div>
            {selected.assignments.map(function(a,i){
              var aName=a.agentId&&a.agentId.name?a.agentId.name:"Unknown";
              var aId=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
              var isCurrent=String(aId)===String(selected.agentId&&selected.agentId._id?selected.agentId._id:selected.agentId);
              return <div key={i} style={{ padding:"6px 0", borderBottom:i<selected.assignments.length-1?"1px solid #DBEAFE":"none" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:isCurrent?700:400, color:isCurrent?C.accent:C.text }}>{aName}</span>
                  {isCurrent&&<span style={{ fontSize:9, background:"#DCFCE7", color:"#15803D", padding:"1px 5px", borderRadius:6, marginLeft:4, fontWeight:600 }}>current</span>}
                  <span style={{ fontSize:10, color:C.textLight, marginLeft:4 }}>{a.status||""}</span>
                </div>
                <button onClick={async function(){
                  if(!window.confirm("Remove "+aName+" from this lead?"))return;
                  try{var upd=await apiFetch("/api/leads/"+gid(selected)+"/assignment/"+aId,"DELETE",null,p.token);p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selected)?upd:l;});});setSelected(upd);}catch(ex){alert(ex.message||"Failed");}
                }} style={{ background:"none", border:"none", cursor:"pointer", color:"#EF4444", fontSize:14, padding:"2px 6px", borderRadius:6 }} title="Remove agent">🗑</button>
                </div>
                {a.lastFeedback&&<div style={{ fontSize:11, color:C.text, marginTop:3, padding:"3px 7px", background:"#FFFBEB", borderRadius:6, borderLeft:"2px solid "+C.accent }}>💬 {a.lastFeedback}{a.notesAuthorRole && a.notesAuthorRole !== "sales" && a.notesAuthorName && <span style={{ marginLeft:6, fontSize:10, color:"#6D28D9", fontWeight:600 }}>· from {a.notesAuthorName}</span>}</div>}
                {a.notes&&<div style={{ fontSize:10, color:C.textLight, marginTop:2, padding:"2px 7px" }}>📝 {a.notes}</div>}
              </div>;
            })}
          </div>}
          {/* Notes (with optional "from <Manager>" tag when a managerial author
              wrote the current note via the feedback endpoint). Rendered above
              the Details split so both mobile and desktop layouts show it
              identically — the desktop branch's plain key/value list can't
              accommodate the tag. */}
          {selected.notes&&<div style={{ background:"#FFFBEB", borderRadius:12, padding:"12px 14px", border:"1px solid #FDE68A", marginBottom:12 }}>
            <div style={{ fontSize:10, color:"#92400E", fontWeight:600, marginBottom:4, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>📝 Notes</span>
              {selected.notesAuthorRole && selected.notesAuthorRole !== "sales" && selected.notesAuthorName && <span style={{ fontSize:10, color:"#6D28D9", fontWeight:700 }}>· from {selected.notesAuthorName}</span>}
            </div>
            <div style={{ fontSize:13, color:C.text }}>{selected.notes}</div>
          </div>}
          {/* Details - grid on mobile, key/value list on desktop. Notes is
              rendered above this block in both layouts so the tag shows. */}
          {p.isMobile?<div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              {[{l:"Campaign",v:selected.campaign,icon:"📣"},{l:"Project",v:selected.project,icon:"🏗"},{l:t.budget,v:selected.budget,icon:"💰"},{l:t.source,v:isAdmin?selected.source:null,icon:"📢"},{l:t.agent,v:getAgentName(selected),icon:"👤"},{l:t.callbackTime,v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):null,icon:"📞"},{l:"Last Contact",v:selected.lastActivityTime?timeAgo(selected.lastActivityTime,t):null,icon:"🕐"},{l:"Date Added",v:isOnlyAdmin?selected.createdAt?new Date(selected.createdAt).toLocaleDateString("en-GB"):null:null,icon:"📅"}].map(function(f){return f.v?<div key={f.l} style={{ background:"#F8FAFC", borderRadius:12, padding:"10px 12px", border:"1px solid #E8ECF1" }}>
                <div style={{ fontSize:10, color:C.textLight, marginBottom:3, fontWeight:600 }}>{f.icon} {f.l}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, wordBreak:"break-word" }}>{f.v}</div>
              </div>:null;})}
            </div>
          </div>:[{l:"Campaign",v:selected.campaign},{l:t.project,v:selected.project},{l:t.budget,v:selected.budget},{l:t.source,v:isAdmin?selected.source:null},{l:t.agent,v:getAgentName(selected)},{l:t.callbackTime,v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):"-"},{l:"Last Contact",v:selected.lastActivityTime?new Date(selected.lastActivityTime).toLocaleDateString("en-GB")+" — "+timeAgo(selected.lastActivityTime,t):"-"},{l:"Date Added",v:isOnlyAdmin?selected.createdAt?new Date(selected.createdAt).toLocaleDateString("en-GB"):"-":null}].map(function(f){
            return f.v?<div key={f.l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F1F5F9", gap:8 }}><span style={{ fontSize:11, color:C.textLight, flexShrink:0 }}>{f.l}</span><span style={{ fontSize:11, fontWeight:500, textAlign:"right", wordBreak:"break-word" }}>{f.v}</span></div>:null;
          })}
          {/* WhatsApp Templates */}
          <div style={{ marginTop:10, display:"flex", gap:6 }}>
            <button onClick={function(){setWaLead(selected);setShowWaTemplates(true);}} style={{ flex:1, padding:"7px 8px", borderRadius:9, border:"1px solid #25D366", background:"#25D36610", color:"#25D366", fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>💬 {t.waTemplates}</button>
            <button onClick={async function(){
              try{var newVip=!selected.isVIP;var upd=await apiFetch("/api/leads/"+gid(selected),"PUT",{isVIP:newVip},p.token);var merged=Object.assign({},selected,{isVIP:newVip});p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selected)?Object.assign({},l,{isVIP:newVip}):l;});});setSelected(merged);}catch(e){console.error("VIP error",e);}
            }} style={{ padding:"7px 10px", borderRadius:9, border:"1px solid "+(selected.isVIP?"#F59E0B":"#E2E8F0"), background:selected.isVIP?"#FEF3C7":"#fff", fontSize:13, cursor:"pointer" }} title={selected.isVIP?t.removeVip:t.markVip}>⭐</button>
            {(p.cu && ["admin","sales_admin","team_leader","manager"].indexOf(p.cu.role) >= 0) && (function(){
              var lid=gid(selected);
              var isLocked=!!selected.locked;
              return <button onClick={async function(){
                try{
                  var updLock=await apiFetch("/api/leads/"+lid,"PUT",{locked:!isLocked},p.token);
                  p.setLeads(function(prev){return prev.map(function(l){return gid(l)===lid?updLock:l;});});
                  setSelected(updLock);
                }catch(e){console.error("lock error",e);}
              }} style={{ padding:"7px 10px", borderRadius:9, border:"1px solid "+(isLocked?"#EF4444":"#E2E8F0"), background:isLocked?"#FEE2E2":"#fff", fontSize:13, cursor:"pointer" }} title={isLocked?"Unlock — allow rotation":"Lock — prevent rotation"}>
                {isLocked?"🔒":"🔓"}
              </button>;
            })()}
            <button onClick={function(){openHistory(selected);}} style={{ padding:"7px 10px", borderRadius:9, border:"1px solid #E2E8F0", background:"#F3E8FF", fontSize:13, cursor:"pointer" }} title="History">📋</button>
            {(function(){
              // Managerial "Add Feedback" — admin/manager always; TL only
              // when the lead isn't their own personal book (then they use
              // status change like a sales agent). sales_admin is excluded:
              // read-only on feedback by design.
              if (!p.cu) return null;
              var role = p.cu.role;
              if (role !== "admin" && role !== "manager" && role !== "team_leader") return null;
              var leadAgentId = selected.agentId && selected.agentId._id ? selected.agentId._id : selected.agentId;
              if (role === "team_leader" && String(leadAgentId || "") === String(p.cu.id || "")) return null;
              return <button onClick={function(){ setFbForm({ text:"", visibility:"private", targetAgentId:"" }); setFbErr(""); setFeedbackModal({lead:selected}); }}
                style={{ padding:"7px 10px", borderRadius:9, border:"1px solid #E2E8F0", background:"#FEF3C7", fontSize:13, cursor:"pointer" }} title="Add feedback (private or send to a sales)">📝</button>;
            })()}
          </div>

          {/* Lead Journey — grouped by agent era */}
          <div style={{ marginTop:14 }}>
            <LeadJourney events={panelHistory} lead={selected} currentUser={p.cu} allUsers={p.users} isAdminRole={isAdmin} variant="panel" setShowCompare={openCompare} />
          </div>
        </div>
      </Card>}
    </div>

    {/* Full History Modal */}
    {showHistory&&historyLead&&<Modal show={true} onClose={function(){setShowHistory(false);setHistoryLead(null);}} title={"📋 Lead History — "+historyLead.name} w={520}>
      {historyLoading ? <div style={{ textAlign:"center", padding:30, color:C.textLight }}>Loading...</div>
        : <div style={{ maxHeight:500, overflowY:"auto" }}>
          <LeadJourney events={fullHistory} lead={historyLead} currentUser={p.cu} allUsers={p.users} isAdminRole={isAdmin} variant="modal" setShowCompare={openCompare} />
        </div>}
    </Modal>}

    {/* Agent Comparison Modal */}
    {showCompare&&compareLead&&(function(){
      var cmpStatusColor = function(s){
        var m = { NewLead:"#5F5E5A", Potential:"#185FA5", NoAnswer:"#854F0B", NotInterested:"#A32D2D", CallBack:"#BA7517", HotCase:"#D85A30", MeetingDone:"#0F6E56", DoneDeal:"#04342C", EOI:"#04342C", "New Lead":"#5F5E5A","No Answer":"#854F0B","Not Interested":"#A32D2D","Call Back":"#BA7517","Hot Case":"#D85A30","Meeting Done":"#0F6E56","Done Deal":"#04342C" };
        return m[s] || "#5F5E5A";
      };
      var cmpStatusLabel = function(s){
        var m = { NewLead:"New Lead", NoAnswer:"No Answer", NotInterested:"Not Interested", CallBack:"Call Back", HotCase:"Hot Case", MeetingDone:"Meeting Done", DoneDeal:"Done Deal" };
        return m[s] || s || "New Lead";
      };
      return <Modal show={true} onClose={closeCompare} title={"Agent Comparison — "+compareLead.name} w={520}>
        {compareEras.length===0 ? <div style={{ textAlign:"center", padding:30, color:C.textLight }}>No eras to compare</div> : <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
                <th style={{ textAlign:"left", padding:"8px 10px", fontWeight:700, color:C.text, fontSize:11 }}>Agent</th>
                <th style={{ textAlign:"right", padding:"8px 10px", fontWeight:700, color:C.text, fontSize:11 }}>Days held</th>
                <th style={{ textAlign:"right", padding:"8px 10px", fontWeight:700, color:C.text, fontSize:11 }}>Actions</th>
                <th style={{ textAlign:"left", padding:"8px 10px", fontWeight:700, color:C.text, fontSize:11 }}>Ended at</th>
              </tr>
            </thead>
            <tbody>
              {compareEras.map(function(era, i){
                var daysHeld = Math.max(1, Math.ceil((new Date(era.endedAt) - new Date(era.startedAt)) / (24*60*60*1000)));
                // Match the era header: count groups, including era-start
                // assign groups. The number tracks distinct user actions.
                var actions = (era.actions||[]).length;
                var rowBg = era.isCurrent ? "#E1F5EE" : (i%2===0 ? "#fff" : "#FBFBFA");
                var agentColor = era.isCurrent ? "#04342C" : C.text;
                return <tr key={"cmp-"+i} style={{ background:rowBg, borderBottom:"1px solid #F1F5F9" }}>
                  <td style={{ padding:"10px", color:agentColor, fontWeight:era.isCurrent?700:600 }}>
                    {era.agentName}
                    {era.isCurrent && <span style={{ marginLeft:6, fontWeight:700, fontSize:10, color:"#04342C" }}>· current</span>}
                  </td>
                  <td style={{ padding:"10px", textAlign:"right", color:C.text }}>{daysHeld}</td>
                  <td style={{ padding:"10px", textAlign:"right", color:C.text }}>{actions}</td>
                  <td style={{ padding:"10px", color:cmpStatusColor(era.endedAtStatus), fontWeight:600 }}>{cmpStatusLabel(era.endedAtStatus)}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
      </Modal>;
    })()}

    {/* Bulk WhatsApp Templates Modal */}
    {showBulkWa&&<Modal show={true} onClose={function(){setShowBulkWa(false);setBulkWaTemplate(null);}} title={"💬 "+t.bulkWhatsApp+" ("+selected2.length+")"}>
      <div style={{ marginBottom:12, padding:"10px 14px", background:"#F0FDF4", borderRadius:10, fontSize:12, color:"#15803D" }}>
        اختار رسالة وبعدين اضغط "إرسال للكل"
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
        {WA_TEMPLATES_AR.map(function(tmpl){
          var isSelected=bulkWaTemplate&&bulkWaTemplate.id===tmpl.id;
          var previewLead=filtered.find(function(l){return selected2.includes(gid(l));});
          var preview=previewLead?fillTemplate(tmpl.text,previewLead,p.cu.name):tmpl.text;
          return <div key={tmpl.id} onClick={function(){setBulkWaTemplate(tmpl);}} style={{ border:"2px solid", borderColor:isSelected?"#25D366":"#E8ECF1", borderRadius:12, padding:14, cursor:"pointer", background:isSelected?"#F0FDF4":"#fff" }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:6, color:isSelected?"#15803D":C.text }}>{tmpl.label} {isSelected?"✓":""}</div>
            <div style={{ fontSize:11, color:C.textLight, lineHeight:1.6, whiteSpace:"pre-line" }}>{preview}</div>
          </div>;
        })}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setShowBulkWa(false);setBulkWaTemplate(null);}} style={{ flex:1 }}>{t.cancel}</Btn>
        <Btn onClick={function(){
          if(!bulkWaTemplate){alert("اختار رسالة الأول");return;}
          var selectedLeads=filtered.filter(function(l){return selected2.includes(gid(l));});
          selectedLeads.forEach(function(l){
            var msg=fillTemplate(bulkWaTemplate.text,l,p.cu.name);
            window.open("https://wa.me/"+waPhone(l.phone)+"?text="+encodeURIComponent(msg),"_blank");
          });
          setShowBulkWa(false);setBulkWaTemplate(null);
        }} style={{ flex:2, background:"#25D366", borderColor:"#25D366" }}>💬 إرسال للكل ({selected2.length})</Btn>
      </div>
    </Modal>}

    {/* WhatsApp Templates Modal */}
    {showWaTemplates&&waLead&&<Modal show={true} onClose={function(){setShowWaTemplates(false);setWaLead(null);}} title={"💬 WhatsApp Messages — "+waLead.name}>
      <div style={{ marginBottom:14, padding:"10px 14px", background:"#F0FDF4", borderRadius:10, fontSize:12, color:"#15803D", display:"flex", alignItems:"center", gap:8 }}>
        <Phone size={14}/> {waLead.phone}{waLead.phone2?" / "+waLead.phone2:""}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {WA_TEMPLATES_AR.map(function(tmpl){
          var agentName=p.cu.name;
          var msg=fillTemplate(tmpl.text,waLead,agentName);
          var waUrl="https://wa.me/"+waPhone(waLead.phone)+"?text="+encodeURIComponent(msg);
          return <div key={tmpl.id} style={{ border:"1px solid #E8ECF1", borderRadius:12, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:6, color:C.text }}>{tmpl.label}</div>
            <div style={{ fontSize:11, color:C.textLight, marginBottom:10, lineHeight:1.6, whiteSpace:"pre-line" }}>{msg}</div>
            <div style={{ display:"flex", gap:8 }}>
              <a href={waUrl} target="_blank" rel="noreferrer" style={{ flex:1, padding:"8px", borderRadius:8, background:"#25D366", color:"#fff", fontSize:12, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>💬 Send</a>
              <button onClick={function(){navigator.clipboard.writeText(msg);}} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", fontSize:12, cursor:"pointer", color:C.textLight }}>📋 Copy</button>
            </div>
          </div>;
        })}
      </div>
    </Modal>}

    {/* Quick Add Modal */}
    <Modal show={showQuickAdd} onClose={function(){setShowQuickAdd(false);}} title={"⚡ "+t.quickAdd} w={360}>
      <Inp label={t.name} req value={quickForm.name} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{name:e.target.value});});}}/>
      <Inp label={t.phone} req value={quickForm.phone} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{phone:e.target.value});});}} placeholder=""/>
      <Inp label={t.project} value={quickForm.project||""} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{project:e.target.value});});}} placeholder=""/>
      <Inp label={t.source} type="select" value={quickForm.source} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{source:e.target.value});});}} options={SOURCES.map(function(x){return{value:x,label:x};})}/>
      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setShowQuickAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn>
        <Btn loading={quickSaving} onClick={async function(){
          if(!quickForm.name||!quickForm.phone)return;
          setQuickSaving(true);
          try{
            var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
            var lead=await apiFetch("/api/leads","POST",Object.assign({},quickForm,{agentId:quickForm.agentId||""}),p.token);
            p.setLeads(function(prev){return [lead].concat(prev);});
            setShowQuickAdd(false);
            setQuickForm({name:"",phone:"",project:PROJECTS[0],source:"Facebook"});
            showBrowserNotif("✅ Lead Added",lead.name+" — "+lead.phone);
          }catch(e){alert(e.message);}
          setQuickSaving(false);
        }} style={{ flex:2 }}>⚡ {t.quickAdd}</Btn>
      </div>
    </Modal>

    {/* Add Modal */}
    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={isReq?t.addRequest:t.addLead}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={isReq} onClose={function(){setShowAdd(false);}} onSave={function(lead){p.setLeads(function(prev){var nid=String(lead&&lead._id||"");if(!nid)return[lead].concat(prev);if(prev.some(function(l){return gid(l)===nid;}))return prev.map(function(l){return gid(l)===nid?lead:l;});return [lead].concat(prev);});setShowAdd(false);}}/>
    </Modal>
    {/* Edit Modal */}
    {editLead&&<Modal show={true} onClose={function(){setEditLead(null);}} title={t.edit}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={isReq} editId={gid(editLead)} initial={editLead} onClose={function(){setEditLead(null);}} onSave={function(updated){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(updated)?updated:l;});});setSelected(updated);setEditLead(null);}}/>
    </Modal>}
  </div>;
};

// ===== MY DAY PAGE =====
var MyDayPage = function(p) {
  var t = p.t; var sc = visibleStatuses(STATUSES(t), p.cu&&p.cu.role);
  var isManager = p.cu.role==="manager"||p.cu.role==="team_leader";
  var getAgName = function(l){ if(!l.agentId) return ""; var a=l.agentId; if(a.name) return a.name; var u=p.users.find(function(x){return String(gid(x))===String(a);}); return u?u.name:""; };
  var [activeTab, setActiveTab] = useState("callbacks");
  var myLeads = p.leads.filter(function(l){
    if(l.archived) return false;
    var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");
    if(isManager){
      var teamUids=new Set((p.myTeamUsers||[]).map(function(u){return String(gid(u));}));
      teamUids.add(String(p.cu.id));
      return teamUids.has(aid);
    }
    return aid===p.cu.id;
  });
  var myTasks = p.tasks.filter(function(tk){var uid=tk.userId&&tk.userId._id?tk.userId._id:tk.userId;return uid===p.cu.id&&!tk.done;});
  var now = Date.now();
  var callbacks = myLeads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime)<=new Date(now+24*60*60*1000);}).sort(function(a,b){return new Date(a.callbackTime)-new Date(b.callbackTime);});
  var overdue = callbacks.filter(function(l){return new Date(l.callbackTime)<new Date();});
  var upcoming = callbacks.filter(function(l){return new Date(l.callbackTime)>=new Date();});
  var noActivity = myLeads.filter(function(l){return !l.archived&&l.status!=="DoneDeal"&&l.status!=="NotInterested"&&(now-new Date(l.lastActivityTime).getTime())>1*24*60*60*1000;});
  var today = new Date(); today.setHours(0,0,0,0);
  var todayActs = p.activities.filter(function(a){var auid=a.userId&&a.userId._id?a.userId._id:a.userId;return String(auid)===String(p.cu.id)&&a.createdAt&&new Date(a.createdAt)>=today;});

  var tabs = [
    {id:"callbacks", label:"📞 Calls", count:callbacks.length, danger:overdue.length>0},
    {id:"noact", label:"⚠️ No Contact", count:noActivity.length, danger:noActivity.length>0},
    {id:"tasks", label:"✅ Tasks", count:myTasks.length, danger:false},
    {id:"activity", label:"📊 My Activity", count:todayActs.length, danger:false},
  ];

  var tabBtn = function(tab){ var act=activeTab===tab.id; return <button key={tab.id} onClick={function(){setActiveTab(tab.id);}}
    style={{ padding:"8px 14px", borderRadius:10, border:"none", background:act?C.accent:"#F1F5F9",
      color:act?"#fff":tab.danger?"#EF4444":C.textLight, fontSize:12, fontWeight:act?700:500,
      cursor:"pointer", display:"flex", alignItems:"center", gap:5, position:"relative", flexShrink:0 }}>
    {tab.label}
    {tab.count>0&&<span style={{ background:act?"rgba(255,255,255,0.3)":tab.danger?"#EF4444":"#CBD5E1", color:act||tab.danger?"#fff":C.textLight, borderRadius:10, padding:"1px 6px", fontSize:10, fontWeight:700 }}>{tab.count}</span>}
  </button>; };

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:4 }}>My Day 🌟</div>
      <div style={{ fontSize:12, color:C.textLight }}>{new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
    </div>

    {/* Summary cards */}
    <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
      {[
        {label:"My Clients",v:myLeads.length,c:"#3B82F6",bg:"#EFF6FF",icon:"👥"},
        {label:"Today's Calls",v:todayActs.filter(function(a){return a.type==="call";}).length,c:"#10B981",bg:"#F0FDF4",icon:"📞"},
        {label:"Overdue",v:overdue.length,c:overdue.length>0?"#EF4444":"#94A3B8",bg:overdue.length>0?"#FEF2F2":"#F8FAFC",icon:"⚠️"},
        {label:"Tasks",v:myTasks.length,c:"#8B5CF6",bg:"#F5F3FF",icon:"✅"},
      ].map(function(s){return <div key={s.label} style={{ flex:"1 1 80px", background:s.bg, borderRadius:12, padding:"12px 10px", textAlign:"center", border:"1px solid "+s.c+"22" }}>
        <div style={{ fontSize:18 }}>{s.icon}</div>
        <div style={{ fontSize:20, fontWeight:800, color:s.c, marginTop:4 }}>{s.v}</div>
        <div style={{ fontSize:10, color:C.textLight, marginTop:2 }}>{s.label}</div>
      </div>;})}
    </div>

    {/* Tabs */}
    <div style={{ display:"flex", gap:6, marginBottom:16, overflowX:"auto", paddingBottom:4 }}>
      {tabs.map(tabBtn)}
    </div>

    {/* Tab content */}
    {activeTab==="callbacks"&&<div>
      {overdue.length>0&&<div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#EF4444", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}><AlertCircle size={12}/> Overdue ({overdue.length})</div>
        {overdue.map(function(l){var so=sc.find(function(s){return s.value===l.status;})||sc[0];
          return <div key={gid(l)} onClick={function(){p.nav("leads",true);p.setInitSelected(l);}} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FECACA", marginBottom:6, cursor:"pointer" }}>
            <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:C.text }}>{l.name}{isManager&&getAgName(l)?<span style={{ fontSize:10, color:"#8B5CF6", marginRight:6, fontWeight:400 }}>({getAgName(l)})</span>:null}</div><div style={{ fontSize:10, color:"#EF4444", fontWeight:600 }}>{l.callbackTime?l.callbackTime.slice(0,16).replace("T"," "):""}</div></div>
            <div style={{ display:"flex", gap:5 }}>
              <a href={"tel:"+cleanPhone(l.phone)} onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}><Phone size={13} color="#60A5FA"/></a>
              <a href={"https://wa.me/"+waPhone(l.phone)} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:14 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
            </div>
          </div>;})}
      </div>}
      {upcoming.length>0&&<div>
        <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:8 }}>Upcoming ({upcoming.length})</div>
        {upcoming.map(function(l){var so=sc.find(function(s){return s.value===l.status;})||sc[0]; var ci=callbackColor(l.callbackTime);
          return <div key={gid(l)} onClick={function(){p.nav("leads",true);p.setInitSelected(l);}} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E8ECF1", marginBottom:6, cursor:"pointer" }}>
            <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{l.name}{isManager&&getAgName(l)?<span style={{ fontSize:10, color:"#8B5CF6", marginRight:6, fontWeight:400 }}>({getAgName(l)})</span>:null}</div><div style={{ fontSize:10, color:ci?ci.color:C.textLight, fontWeight:600 }}>{l.callbackTime?l.callbackTime.slice(0,16).replace("T"," "):""}</div></div>
            <Badge bg={so.bg} color={so.color}>{so.label}</Badge>
            <div style={{ display:"flex", gap:5 }}>
              <a href={"tel:"+cleanPhone(l.phone)} onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}><Phone size={13} color="#60A5FA"/></a>
              <a href={"https://wa.me/"+waPhone(l.phone)} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:14 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
            </div>
          </div>;})}
      </div>}
      {callbacks.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight, fontSize:13 }}>🎉 No calls right now</div>}
    </div>}

    {activeTab==="noact"&&<div>
      {noActivity.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight, fontSize:13 }}>✅ All clients have recent contact</div>}
      {noActivity.map(function(l){return <div key={gid(l)} onClick={function(){p.nav("leads",true);p.setInitSelected(l);}} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"#FFFBEB", border:"1px solid #FDE68A", marginBottom:6, cursor:"pointer" }}>
        <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{l.name}{isManager&&getAgName(l)?<span style={{ fontSize:10, color:"#8B5CF6", marginRight:6, fontWeight:400 }}>({getAgName(l)})</span>:null}</div><div style={{ fontSize:10, color:"#B45309", fontWeight:600 }}>Last contact: {timeAgo(l.lastActivityTime,t)}</div></div>
        <div style={{ display:"flex", gap:5 }}>
          <a href={"tel:"+cleanPhone(l.phone)} onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:"#EFF6FF", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}><Phone size={13} color="#60A5FA"/></a>
          <a href={"https://wa.me/"+waPhone(l.phone)} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:14 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
        </div>
      </div>;})}
    </div>}

    {activeTab==="tasks"&&<div>
      {myTasks.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight, fontSize:13 }}>✅ No tasks</div>}
      {myTasks.map(function(tk){var lName=tk.leadId&&tk.leadId.name?tk.leadId.name:"";
        return <div key={gid(tk)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E8ECF1", marginBottom:6 }}>
          <div style={{ width:22, height:22, borderRadius:6, border:"2px solid #CBD5E1", flexShrink:0, background:"#fff" }}/>
          <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{tk.title}</div><div style={{ fontSize:10, color:C.textLight }}>{lName}{lName&&tk.time?" · ":""}{tk.time}</div></div>
          <Badge bg={tk.type==="call"?"#DCFCE7":tk.type==="meeting"?"#DBEAFE":"#FEF3C7"} color={tk.type==="call"?"#15803D":tk.type==="meeting"?"#1D4ED8":"#B45309"}>{tk.type}</Badge>
        </div>;})}
    </div>}

    {activeTab==="activity"&&<div>
      {todayActs.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight, fontSize:13 }}>No activity today</div>}
      {todayActs.map(function(a,i){return <div key={a._id||i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px", borderRadius:10, background:"#F8FAFC", border:"1px solid #E8ECF1", marginBottom:6 }}>
        <span style={{ fontSize:18, flexShrink:0 }}>{a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":"📝"}</span>
        <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:500 }}>{a.note}</div><div style={{ fontSize:10, color:C.textLight, marginTop:2 }}>{timeAgo(a.createdAt,t)}</div></div>
      </div>;})}
    </div>}
  </div>;
};

// ===== DASHBOARD =====

// ===== DASHBOARD =====

var DashboardPage = function(p) {
  var isOnlyAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin";
  var [filter, setFilter] = useState("today");
  var [qOpen, setQOpen] = useState(false);
  var quarterDropdownRef = useRef(null);
  var [todayActivities, setTodayActivities] = useState(null);
  var [untouchedData, setUntouchedData] = useState(null);
  var [seeAllOpen, setSeeAllOpen] = useState(false);
  // Mobile layout flag — updates on resize. Desktop styles are untouched; mobile just overrides specific rules.
  var [isMobile, setIsMobile] = useState(typeof window!=="undefined" && window.innerWidth<768);
  useEffect(function(){
    var onResize = function(){ setIsMobile(window.innerWidth<768); };
    window.addEventListener("resize", onResize);
    return function(){ window.removeEventListener("resize", onResize); };
  },[]);
  // eslint-disable-next-line no-unused-vars
  var [tick, setTick] = useState(0);
  useEffect(function(){
    var id = setInterval(function(){ setTick(function(t){return t+1;}); }, 1000);
    return function(){ clearInterval(id); };
  },[]);
  // Close the Quarter dropdown when clicking outside its wrapper
  useEffect(function(){
    var handleClickOutside = function(e){
      if (quarterDropdownRef.current && !quarterDropdownRef.current.contains(e.target)) {
        setQOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return function(){ document.removeEventListener("mousedown", handleClickOutside); };
  },[]);
  // Fetch activities since the active period's start (not just today's 00:00)
  // — so Today's Activities / This Week's Activities / etc all have enough
  // data to render without another round-trip. Refreshes every 30s, and
  // re-fires whenever the filter changes so the card always matches the
  // Key Metrics row above it.
  useEffect(function(){
    if (!p.token) return;
    var cancelled = false;
    var load = function(){
      var nd = new Date();
      var cY = nd.getFullYear(), cM = nd.getMonth(), cD = nd.getDate();
      // Week uses Saturday as the anchor, matching the admin dashboard's
      // rangeStart calc (see the admin-side block further down).
      var todayDay = nd.getDay(); // 0=Sun..6=Sat
      var daysSinceSat = (todayDay - 6 + 7) % 7;
      var ts;
      if (filter==="today") ts = new Date(cY, cM, cD, 0,0,0,0);
      else if (filter==="yesterday") ts = new Date(cY, cM, cD-1, 0,0,0,0);
      else if (filter==="week") ts = new Date(cY, cM, cD-daysSinceSat, 0,0,0,0);
      else if (filter==="month") ts = new Date(cY, cM, 1, 0,0,0,0);
      else if (typeof filter==="string" && /^Q(\d)\s+(\d{4})$/.test(filter)) {
        var mm = filter.match(/^Q(\d)\s+(\d{4})$/);
        ts = new Date(parseInt(mm[2]), (parseInt(mm[1])-1)*3, 1, 0,0,0,0);
      } else {
        ts = new Date(cY, cM, cD, 0,0,0,0);
      }
      apiFetch("/api/activities?since="+encodeURIComponent(ts.toISOString())+"&limit=1000","GET",null,p.token)
        .then(function(d){ if(cancelled) return; var arr = (d&&d.data)||(Array.isArray(d)?d:[]); setTodayActivities(arr); })
        .catch(function(){ if(!cancelled && todayActivities===null) setTodayActivities([]); });
    };
    load();
    var id = setInterval(load, 30000);
    return function(){ cancelled = true; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[p.token, filter]);
  // Untouched leads — server computes across the full Lead collection, so the
  // card is correct even when the local leads[] only holds the current page.
  // Refresh on the same 30s cadence as the activity feed.
  useEffect(function(){
    if (!p.token) return;
    if (!isOnlyAdmin && p.cu.role !== "manager") return;
    var cancelled = false;
    var load = function(){
      apiFetch("/api/leads/untouched","GET",null,p.token)
        .then(function(d){ if(cancelled) return; setUntouchedData(Array.isArray(d)?d:[]); })
        .catch(function(){ if(!cancelled && untouchedData===null) setUntouchedData([]); });
    };
    load();
    var id = setInterval(load, 30000);
    return function(){ cancelled = true; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[p.token]);
  // ── CRM-wide Sales ranking + per-agent KPI counts — both come from the
  //    backend so the dashboard works for any sales user (local p.leads only
  //    contains their own rows). Re-fetch whenever the period filter changes.
  var [salesRanking, setSalesRanking] = useState(null);
  var [myStats, setMyStats] = useState(null);
  useEffect(function(){
    if (!p.token) return;
    // Re-derive the active range here so the effect only depends on `filter`.
    var nd = new Date(); var cY = nd.getFullYear(); var cM = nd.getMonth(); var cD = nd.getDate();
    // Week anchor = Saturday (Egypt convention) — matches the activities-feed
    // useEffect above and the sales render block below.
    var daysSinceSat = (nd.getDay() - 6 + 7) % 7;
    var weekStart  = new Date(cY, cM, cD - daysSinceSat, 0,0,0,0);
    var todayStart = new Date(cY, cM, cD, 0,0,0,0);
    var todayEnd   = new Date(cY, cM, cD, 23,59,59,999);
    var yestStart  = new Date(cY, cM, cD-1, 0,0,0,0);
    var yestEnd    = new Date(cY, cM, cD-1, 23,59,59,999);
    var monthStart = new Date(cY, cM, 1, 0,0,0,0);
    var monthEnd   = new Date(cY, cM+1, 0, 23,59,59,999);
    var rs, re;
    if (filter==="today")          { rs = todayStart.getTime(); re = todayEnd.getTime(); }
    else if (filter==="yesterday") { rs = yestStart.getTime();  re = yestEnd.getTime(); }
    else if (filter==="week")      { rs = weekStart.getTime();  re = Date.now(); }
    else if (filter==="month")     { rs = monthStart.getTime(); re = Math.min(Date.now(), monthEnd.getTime()); }
    else if (typeof filter==="string" && /^Q\d\s+\d{4}$/.test(filter)) {
      var mm = filter.match(/^Q(\d)\s+(\d{4})$/);
      var qn = parseInt(mm[1]); var qy = parseInt(mm[2]);
      rs = new Date(qy, (qn-1)*3, 1, 0,0,0,0).getTime();
      re = Math.min(Date.now(), new Date(qy, qn*3, 0, 23,59,59,999).getTime());
    } else { rs = todayStart.getTime(); re = todayEnd.getTime(); }
    var qs = "from="+encodeURIComponent(new Date(rs).toISOString())+"&to="+encodeURIComponent(new Date(re).toISOString());
    // If the period is a Quarter, tell the backend which quarter so Target
    // lines up with the selected range; otherwise fall through to current Q.
    var qMatch = (typeof filter==="string") ? filter.match(/^Q(\d)\s+\d{4}$/) : null;
    var statsQs = qs + (qMatch ? "&quarter=Q"+qMatch[1] : "");
    var cancelled = false;
    apiFetch("/api/dashboard/sales-ranking?"+qs, "GET", null, p.token)
      .then(function(d){ if(!cancelled) setSalesRanking(Array.isArray(d)?d:[]); })
      .catch(function(){ if(!cancelled) setSalesRanking([]); });
    apiFetch("/api/dashboard/my-stats?"+statsQs, "GET", null, p.token)
      .then(function(d){ if(!cancelled) setMyStats(d||{}); })
      .catch(function(){ if(!cancelled) setMyStats({}); });
    return function(){ cancelled = true; };
  },[p.token, filter]);
  var now = Date.now();
  var DAY=86400000, WEEK=7*DAY, MONTH=30*DAY;
  var rangeMs = (filter==="today"||filter==="yesterday")?DAY:filter==="week"?WEEK:MONTH;

  var leads = useMemo(function(){
    return (p.leads||[]).filter(function(l){return !l.archived&&l.source!=="Daily Request";});
  },[p.leads]);

  var timeStr = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  var hourNow = new Date().getHours();
  var greeting = hourNow<6 ? "Good Night \ud83d\ude34" : hourNow<12 ? "Good Morning \u2600\ufe0f" : hourNow<18 ? "Good Afternoon \ud83c\udf24\ufe0f" : hourNow<24 ? "Good Evening \ud83c\udf19" : "Good Night \ud83d\ude34";

  var total=leads.length;
  var sc={};
  leads.forEach(function(l){sc[l.status]=(sc[l.status]||0)+1;});
  var newInRange=leads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt).getTime())<rangeMs;}).length;
  var contacted=total-(sc["NewLead"]||0);
  var interested=(sc["HotCase"]||0)+(sc["Potential"]||0)+(sc["MeetingDone"]||0)+(sc["DoneDeal"]||0);
  var meetings=(sc["MeetingDone"]||0)+(sc["DoneDeal"]||0);
  var deals=sc["DoneDeal"]||0;
  var overdue=leads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).getTime()<now;}).length;
  var untouched=leads.filter(function(l){return l.status==="NewLead"&&l.createdAt&&(now-new Date(l.createdAt).getTime())>2*DAY;}).length;

  var campMap={};
  leads.forEach(function(l){
    var k=(l.campaign||"\u2014")+"|"+(l.project||"\u2014")+"|"+(l.source||"\u2014");
    if(!campMap[k]) campMap[k]={campaign:l.campaign||"",project:l.project||"",source:l.source||"",leads:0,int:0,meet:0,deals:0};
    campMap[k].leads++;
    if(["HotCase","Potential","MeetingDone","DoneDeal"].includes(l.status)) campMap[k].int++;
    if(["MeetingDone","DoneDeal"].includes(l.status)) campMap[k].meet++;
    if(l.status==="DoneDeal") campMap[k].deals++;
  });
  var camps=Object.values(campMap).sort(function(a,b){return b.leads-a.leads;}).slice(0,8).map(function(c){
    return Object.assign({},c,{ip:c.leads>0?Math.round(c.int/c.leads*100):0,mp:c.leads>0?Math.round(c.meet/c.leads*100):0,quality:c.leads>0&&Math.round(c.int/c.leads*100)>30?"High":Math.round(c.int/c.leads*100)>15?"Medium":"Low"});
  });

  var agentPerf=(p.users||[]).filter(function(u){return u.role==="sales";}).map(function(u){
    var uid=String(u._id||gid(u));
    var al=leads.filter(function(l){return l.assignments&&l.assignments.some(function(a){return String(a.agentId&&a.agentId._id?a.agentId._id:a.agentId)===uid;});});
    var aint=al.filter(function(l){return["HotCase","Potential","MeetingDone","DoneDeal"].includes(l.status);}).length;
    var ameet=al.filter(function(l){return["MeetingDone","DoneDeal"].includes(l.status);}).length;
    var ip=al.length>0?Math.round(aint/al.length*100):0;
    var mp=al.length>0?Math.round(ameet/al.length*100):0;
    return {uid:uid,name:u.name,leads:al.length,interested:aint,ip:ip,meetings:ameet,mp:mp,overdue:al.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).getTime()<now;}).length,deals:al.filter(function(l){return l.status==="DoneDeal";}).length,score:Math.min(99,ip+mp*2+(al.length>10?20:10))};
  }).sort(function(a,b){return b.leads-a.leads;});

  var dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var todayIdx=new Date().getDay();
  var weekDays=Array.from({length:7},function(_,i){return dayNames[(todayIdx-6+i+7)%7];});
  var kpiCard=function(label,value,sub,bg,vc,onClick,barsData){
    // barsData (optional): 7 numeric counts ending today. Admin dashboard
    // passes real weekday lead counts; sales path falls through to the
    // decorative preset. All-zero → flat min-height row so the card never
    // renders a collapsed sparkline.
    var bars;
    if (barsData && barsData.length===7) {
      var _mx = Math.max.apply(null, barsData);
      bars = _mx>0 ? barsData.map(function(n){return Math.max(12, Math.round(n/_mx*100));})
                   : [12,12,12,12,12,12,12];
    } else {
      bars = [30,45,55,40,65,70,85];
    }
    // bg is now a CSS gradient string. vc is kept for the small spark-bar
    // and weekday strip below the number, since both inherit from the card
    // accent. Title/value/sub follow the new white-on-gradient spec.
    return <div onClick={onClick} style={{background:bg,borderRadius:16,padding:isMobile?"14px":"18px",cursor:onClick?"pointer":"default",minWidth:0,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
      <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.9)",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
      <div style={{fontSize:isMobile?28:36,fontWeight:800,color:"#ffffff",letterSpacing:"-0.02em",lineHeight:1,overflow:"hidden",textOverflow:"ellipsis"}}>{value}</div>
      <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",fontWeight:500,marginTop:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sub}</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:2,height:20,marginTop:10}}>
        {bars.map(function(h,i){return <div key={i} style={{flex:1,borderRadius:2,height:h+"%",background:"#ffffff",opacity:i===6?0.85:0.28}}/>;})}</div>
      <div style={{display:"flex",gap:2,marginTop:3}}>
        {weekDays.map(function(d,i){return <div key={i} style={{flex:1,fontSize:"6px",textAlign:"center",color:"#ffffff",opacity:0.55}}>{d}</div>;})}</div>
    </div>;
  };

  var bRow=function(label,count,total2,color,onClick){
    var pct=total2>0?Math.max(2,Math.round(count/total2*100)):0;
    return <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,cursor:onClick?"pointer":"default"}}>
      <div style={{fontSize:12,color:"#64748B",width:82,flexShrink:0}}>{label}</div>
      <div style={{flex:1,height:5,background:"#F1F5F9",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:color,borderRadius:3}}/></div>
      <div style={{fontSize:12,fontWeight:600,color:"#334155",width:28,textAlign:"right"}}>{count}</div>
    </div>;
  };

  var card=function(children,extra){return <div className="crm-dash-card" style={Object.assign({background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:isMobile?"14px 14px":"20px 22px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",minWidth:0},extra||{})}>{children}</div>;};
  var sec=function(label){return <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",letterSpacing:"0.1em",textTransform:"uppercase",margin:"24px 0 12px"}}>{label}</div>;};
  var qBadge=function(q){var m2={High:["#DCFCE7","#166534"],Medium:["#FEF3C7","#92400E"],Low:["#FEE2E2","#991B1B"]};var c2=m2[q]||m2.Low;return <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:c2[0],color:c2[1]}}>{q}</span>;};

  // Shared period labels used by both the Today's Activities card (Change 1
  // — respects the global filter) and the admin Rank Team widget (Change 2).
  var periodLabelForFilter = function(f){
    if (f==="today") return "Today";
    if (f==="yesterday") return "Yesterday";
    if (f==="week") return "This Week";
    if (f==="month") return "This Month";
    if (typeof f==="string" && /^Q\d\s+\d{4}$/.test(f)) return f;
    return "Today";
  };
  var activitiesTitleForFilter = function(f){
    if (f==="today") return "Today's Activities";
    if (f==="yesterday") return "Yesterday's Activities";
    if (f==="week") return "This Week's Activities";
    if (f==="month") return "This Month's Activities";
    if (typeof f==="string" && /^Q\d\s+\d{4}$/.test(f)) return "This Quarter's Activities";
    return "Today's Activities";
  };
  // Reusable Rank widget — used by BOTH sales ("My Rank vs Team") and
  // admin ("Rank Team", replacing the old Call Outcomes card). Takes a
  // mode because admin has no personal rank / score block; otherwise
  // identical data (salesRanking comes from the same /api/dashboard/
  // sales-ranking endpoint for both roles).
  var rankWidget = function(opts){
    var mode = opts && opts.mode;
    var rangeLabel = (opts && opts.rangeLabel) || "";
    var rankRows = Array.isArray(salesRanking) ? salesRanking : [];
    var loading = salesRanking === null;
    var myUid = mode === "sales" ? String(p.cu._id || p.cu.id) : "";
    var myRankIdx = mode === "sales" ? rankRows.findIndex(function(r){return String(r.uid)===myUid;}) : -1;
    var myRank = myRankIdx >= 0 ? myRankIdx+1 : 0;
    var myRankTotal = rankRows.length;
    var myRankRow = myRankIdx >= 0 ? rankRows[myRankIdx] : {deals:0,meetings:0,score:0};
    var title = mode === "admin" ? "Rank Team" : "My Rank vs Team";
    // Admin mode shares a grid row with other cards that stretch to the
    // tallest sibling (Management Alerts / Callback Compliance / Leads by
    // Status). Make the card a flex column so the rank list can flex:1 and
    // fill the full card height with internal scrolling. Sales mode keeps
    // its original fixed-max layout untouched.
    var isAdminMode = mode === "admin";
    var cardStyle = {background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:isMobile?"14px":"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",minWidth:0,boxSizing:"border-box"};
    if (isAdminMode) { cardStyle.display = "flex"; cardStyle.flexDirection = "column"; cardStyle.height = "100%"; }
    var listStyle = isAdminMode
      ? {display:"flex",flexDirection:"column",gap:6,flex:1,minHeight:0,overflowY:"auto"}
      : {display:"flex",flexDirection:"column",gap:6,maxHeight:360,overflowY:"auto"};
    return <div className="crm-dash-card" style={cardStyle}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isMobile?10:14}}>
        <div style={{fontSize:isMobile?14:15,fontWeight:700,color:"#0F172A"}}>{title}</div>
        <div style={{fontSize:10,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{rangeLabel}</div>
      </div>
      {mode === "sales" && <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:12}}>
        <span style={{fontSize:34,fontWeight:800,color:myRank===1?"#15803D":myRank>0&&myRank<=3?"#1D4ED8":"#334155",lineHeight:1}}>{myRank>0?"#"+myRank:"\u2014"}</span>
        <span style={{fontSize:13,color:"#64748B"}}>out of {myRankTotal} sales agents</span>
      </div>}
      <div style={listStyle}>
        {loading && <div style={{fontSize:12,color:"#94A3B8",padding:"6px 0"}}>Loading ranking\u2026</div>}
        {rankRows.map(function(r,i){
          var isMe = mode === "sales" && String(r.uid)===myUid;
          // Sales mode: rows are clickable. Own row opens own leads unfiltered;
          // others route through initAgentFilter (the leads page will show an
          // empty set for a sales user since the backend scopes leads to self,
          // but admin/TL/manager viewing this same widget get the expected drill-in).
          var onRowClick = mode === "sales" ? function(){
            if (isMe) { p.setFilter && p.setFilter("all"); p.nav("leads"); return; }
            if (p.setInitAgentFilter) p.setInitAgentFilter(r.uid);
            p.setFilter && p.setFilter("all");
            p.nav("leads");
          } : null;
          return <div key={r.uid} onClick={onRowClick} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:8,background:isMe?"#EFF6FF":"transparent",border:isMe?"1px solid #BFDBFE":"1px solid transparent",cursor:onRowClick?"pointer":"default"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:i===0?"#FBBF24":i===1?"#E2E8F0":i===2?"#F59E0B":"#F1F5F9",color:i<=2?"#0F172A":"#64748B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</div>
            <div style={{flex:1,minWidth:0,fontSize:12,fontWeight:isMe?700:500,color:isMe?"#1D4ED8":"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isMe?(r.name||p.cu.name)+" (you)":r.name}</div>
            <div title={"Activities "+(r.activities||0)+" \u00b7 Calls "+(r.calls||0)+" \u00b7 Meetings "+(r.meetings||0)+" \u00b7 DRs "+(r.dailyRequests||0)} style={{fontSize:12,fontWeight:800,color:"#1D4ED8",minWidth:28,textAlign:"right"}}>{r.score||0}</div>
          </div>;
        })}
        {!loading && !rankRows.length && <div style={{fontSize:12,color:"#94A3B8",padding:"6px 0"}}>No sales agents found</div>}
      </div>
      {mode === "sales" && <div style={{borderTop:"1px solid #F1F5F9",marginTop:10,paddingTop:10,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:20}}>{myRank===1?"\ud83e\udd47":myRank===2?"\ud83e\udd48":myRank===3?"\ud83e\udd49":"\ud83d\udcca"}</span>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>Your score: {myRankRow.score||0}</div>
          <div style={{fontSize:11,color:"#94A3B8"}}>{(myRankRow.activities||0)} activities \u00b7 {(myRankRow.calls||0)} calls \u00b7 {(myRankRow.meetings||0)} meetings \u00b7 {(myRankRow.dailyRequests||0)} DRs in {rangeLabel}</div>
        </div>
      </div>}
    </div>;
  };

  if(!isOnlyAdmin) {
    // ============ DATE RANGE (calendar-based) ============
    // Today = 00:00→23:59, Week = Monday→today, Month = 1st→today,
    // Quarter = Q start → Q end (capped at now). Every stat below filters through inRangeS().
    var nowDS = new Date();
    var curYS = nowDS.getFullYear();
    var curMS = nowDS.getMonth();
    var curDS = nowDS.getDate();
    var jsDayS = nowDS.getDay();              // 0=Sun..6=Sat
    // Week anchor = Saturday (Egypt convention). Sat=0, Sun=1, ... Fri=6.
    // Must match the two useEffects above so backend range === rendered range.
    var daysSinceSatS = (jsDayS - 6 + 7) % 7;
    var weekStartS = new Date(curYS, curMS, curDS - daysSinceSatS, 0,0,0,0);
    var todayStartS = new Date(curYS, curMS, curDS, 0,0,0,0);
    var todayEndS   = new Date(curYS, curMS, curDS, 23,59,59,999);
    var yestStartS  = new Date(curYS, curMS, curDS-1, 0,0,0,0);
    var yestEndS    = new Date(curYS, curMS, curDS-1, 23,59,59,999);
    var monthStartS = new Date(curYS, curMS, 1, 0,0,0,0);
    var monthEndS   = new Date(curYS, curMS+1, 0, 23,59,59,999);
    var rangeStartS, rangeEndS, rangeLabelS;
    if (filter==="today")          { rangeStartS = todayStartS.getTime();  rangeEndS = todayEndS.getTime();                         rangeLabelS = "Today"; }
    else if (filter==="yesterday") { rangeStartS = yestStartS.getTime();   rangeEndS = yestEndS.getTime();                          rangeLabelS = "Yesterday"; }
    else if (filter==="week")      { rangeStartS = weekStartS.getTime();   rangeEndS = Date.now();                                  rangeLabelS = "This Week"; }
    else if (filter==="month")     { rangeStartS = monthStartS.getTime();  rangeEndS = Math.min(Date.now(), monthEndS.getTime());   rangeLabelS = "This Month"; }
    else if (typeof filter==="string" && /^Q\d\s+\d{4}$/.test(filter)) {
      var mS = filter.match(/^Q(\d)\s+(\d{4})$/);
      var qnS = parseInt(mS[1]); var qyS = parseInt(mS[2]);
      var qStartS = new Date(qyS, (qnS-1)*3, 1, 0,0,0,0);
      var qEndS   = new Date(qyS, qnS*3, 0, 23,59,59,999);
      rangeStartS = qStartS.getTime();
      rangeEndS   = Math.min(Date.now(), qEndS.getTime());
      rangeLabelS = filter;
    } else {
      rangeStartS = todayStartS.getTime(); rangeEndS = todayEndS.getTime(); rangeLabelS = "Today";
    }
    var inRangeS = function(d){ if(!d) return false; var t = new Date(d).getTime(); return !isNaN(t) && t>=rangeStartS && t<=rangeEndS; };

    // Current year + prior year quarters — sales may want to audit historical periods.
    var quarterOptionsS = [
      "Q1 "+curYS, "Q2 "+curYS, "Q3 "+curYS, "Q4 "+curYS,
      "Q1 "+(curYS-1), "Q2 "+(curYS-1), "Q3 "+(curYS-1), "Q4 "+(curYS-1)
    ];

    // ============ MY DATA ============
    var myUidS = String(p.cu._id||p.cu.id);
    // Team leader: server already scoped p.leads to self + direct sales, so
    // the team's leads ARE "my" data for dashboard purposes. Filtering further
    // by an assignments.some(...===myUidS) check would drop every team-sales lead
    // (TL doesn't hold their own assignment slice) and leave the dashboard empty.
    var isTL = p.cu.role === "team_leader";
    var allMyLeads = isTL ? leads.slice() : leads.filter(function(l){
      return l.assignments && l.assignments.some(function(a){
        var aid = a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
        return String(aid)===myUidS;
      });
    });
    // Leads created inside the active range — used for all counts on the dashboard.
    var myLeads2 = allMyLeads.filter(function(l){ return inRangeS(l.createdAt); });
    // Per-status counts come from the backend (myStats.byStatus). Falls back
    // to a local recomputation while the first request is still in flight so
    // the cards never render undefined.
    var localSC = {}; myLeads2.forEach(function(l){ localSC[l.status] = (localSC[l.status]||0)+1; });
    var mySC2 = (myStats && myStats.byStatus) ? myStats.byStatus : localSC;
    // myTotal2: prefer the backend "My Leads" count (matches Card 1);
    // otherwise fall back to the local filtered set.
    var myTotal2 = (myStats && typeof myStats.myLeads === "number") ? myStats.myLeads : myLeads2.length;
    var myInt2  = (mySC2.HotCase||0) + (mySC2.Potential||0) + (mySC2.MeetingDone||0) + (mySC2.DoneDeal||0);
    var myMeet2 = (myStats && typeof myStats.meetings === "number") ? myStats.meetings : ((mySC2.MeetingDone||0) + (mySC2.DoneDeal||0));
    // Overdue uses the NOW state across all my leads (date filter doesn't apply to callback overdue).
    var myOv2   = allMyLeads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).getTime()<now;}).length;
    // These lists are "now state" — independent of the date range filter.
    var urgent2    = allMyLeads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).getTime()<now;}).sort(function(a,b){return new Date(a.callbackTime)-new Date(b.callbackTime);}).slice(0,5);
    var urgentNew2 = allMyLeads.filter(function(l){return l.status==="NewLead"&&l.createdAt&&(now-new Date(l.createdAt).getTime())>2*3600000;}).slice(0,3);
    // Schedule card — callbacks whose scheduled time falls in the active filter
    // range. Title updates alongside (see scheduleTitle2 below).
    var schedule2  = allMyLeads.filter(function(l){return l.callbackTime&&!l.archived&&inRangeS(l.callbackTime);}).sort(function(a,b){return new Date(a.callbackTime)-new Date(b.callbackTime);}).slice(0,7);
    var scheduleTitle2 = (function(){
      if (filter==="today") return "Today's Schedule";
      if (filter==="yesterday") return "Yesterday's Schedule";
      if (filter==="week") return "This Week's Schedule";
      if (filter==="month") return "This Month's Schedule";
      if (typeof filter==="string" && /^Q\d\s+\d{4}$/.test(filter)) return filter+" Schedule";
      return "Schedule";
    })();
    var statusColors2={"NewLead":"#1565C0","Potential":"#00796B","HotCase":"#E65100","CallBack":"#6A1B9A","MeetingDone":"#2E7D32","NotInterested":"#EF4444","NoAnswer":"#94A3B8","DoneDeal":"#065F46"};

    // ============ MY RANK VS TEAM (CRM-wide, from backend) ============
    // salesRanking is populated by the useEffect above that hits /api/dashboard/sales-ranking.
    // Empty array while the first request is in flight (shows the "loading" affordance below).
    var rankRowsS      = Array.isArray(salesRanking) ? salesRanking : [];
    var myRankIdxS     = rankRowsS.findIndex(function(r){return String(r.uid)===myUidS;});
    var myRankS        = myRankIdxS>=0 ? myRankIdxS+1 : 0;
    var myRankTotalS   = rankRowsS.length;
    var myRankRowS     = myRankIdxS>=0 ? rankRowsS[myRankIdxS] : {deals:0,meetings:0,score:0};
    var rankLoadingS   = salesRanking===null;

    // ============ CONVERSION FUNNEL (real, range-scoped, backend-sourced) ============
    // Five pipeline stages, each counting leads currently in that stage (snapshot,
    // not lifetime). Stage 1 denominator drives the right-column %.
    // - Total      = myTotal2 (backend myLeads, range-scoped)
    // - Interested = byStatus.HotCase + byStatus.Potential
    // - Meeting    = byStatus.MeetingDone (snapshot, not backend "meetings" which also counts scheduled Tasks)
    // - EOI        = byStatus.EOI
    // - Deal       = byStatus.DoneDeal
    var funnelRowsS = [
      { l:"Total",        v:myTotal2,                                                    c:"#DBEAFE", tc:"#1E40AF", nav:function(){p.setFilter&&p.setFilter("all");p.nav("leads");} },
      { l:"Interested",   v:((mySC2["HotCase"]||0)+(mySC2["Potential"]||0)),             c:"#FEF3C7", tc:"#92400E", nav:function(){if(p.setSpecialFilter)p.setSpecialFilter({type:"interested"});p.setFilter&&p.setFilter("all");p.nav("leads");} },
      { l:"Meeting Done", v:(mySC2["MeetingDone"]||0),                                   c:"#D1FAE5", tc:"#065F46", nav:function(){p.setFilter&&p.setFilter("MeetingDone");p.nav("leads");} },
      { l:"EOI",          v:(mySC2["EOI"]||0),                                           c:"#FAE8FF", tc:"#6B21A8", nav:function(){p.setFilter&&p.setFilter("EOI");p.nav("leads");} },
      { l:"Deal",         v:(mySC2["DoneDeal"]||0),                                      c:"#FFE4E6", tc:"#9F1239", nav:function(){p.nav("deals");} }
    ];
    var funnelMaxS = Math.max.apply(null, funnelRowsS.map(function(r){return r.v;}).concat([1]));

    // ============ RECENT ACTIVITY (real, from lead.history entries by me) ============
    var myNameS = p.cu.name||"";
    var fmtActTime = function(d){
      var dt = new Date(d);
      var dayStart = new Date(); dayStart.setHours(0,0,0,0);
      var yest = new Date(dayStart); yest.setDate(yest.getDate()-1);
      var tStr = dt.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});
      if (dt>=dayStart) return "Today "+tStr;
      if (dt>=yest) return "Yesterday "+tStr;
      return dt.toLocaleDateString("en-GB") + " " + tStr;
    };
    var eventIconS = function(e){
      var ev = String(e||"").toLowerCase();
      if (ev.indexOf("status")>=0) return "\ud83d\udd04";
      if (ev.indexOf("feedback")>=0||ev.indexOf("note")>=0) return "\ud83d\udcdd";
      if (ev.indexOf("meeting")>=0) return "\ud83e\udd1d";
      if (ev.indexOf("callback")>=0) return "\ud83d\udcde";
      if (ev.indexOf("call")>=0) return "\u260e\ufe0f";
      if (ev.indexOf("assign")>=0||ev.indexOf("rotat")>=0) return "\u21aa\ufe0f";
      if (ev.indexOf("created")>=0||ev.indexOf("create")>=0) return "\u2728";
      return "\ud83d\udd14";
    };
    // For TL: accept history entries authored by any team member (self + direct sales).
    var tlMemberNames = isTL ? new Set((p.myTeamUsers||[]).map(function(u){return String(u.name||"");}).filter(Boolean)) : null;
    var myRecentActsS = [];
    allMyLeads.forEach(function(l){
      (l.history||[]).forEach(function(h){
        if (!h || !h.timestamp) return;
        var by = String(h.byUser||"");
        if (isTL ? !tlMemberNames.has(by) : by!==myNameS) return;
        if (!inRangeS(h.timestamp)) return;
        myRecentActsS.push({
          lead: l,
          leadName: l.name||"Lead",
          event: h.event||"",
          description: h.description||"",
          timestamp: h.timestamp
        });
      });
    });
    myRecentActsS.sort(function(a,b){return new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime();});
    myRecentActsS = myRecentActsS.slice(0,20);

    // ============ 7-DAY SPARKLINES (real counts, ending today) ============
    // Position 6 = today, position 0 = 6 days ago. Each KPI card gets its own
    // array so bars reflect that metric's daily shape, not a shared proxy.
    var _todayStartMsS = new Date(nowDS.getFullYear(), nowDS.getMonth(), nowDS.getDate(), 0,0,0,0).getTime();
    var spark7 = function(items, getTs){
      var out = [0,0,0,0,0,0,0];
      (items||[]).forEach(function(x){
        var raw = getTs(x); if (!raw) return;
        var t = new Date(raw).getTime(); if (isNaN(t)) return;
        var dd = Math.floor((_todayStartMsS - t)/DAY);
        if (dd < 0) dd = 0; if (dd > 6) return;
        out[6 - dd]++;
      });
      return out;
    };
    // Scope DRs to self (TL already scoped server-side). p.dailyReqs is the full
    // visible set; for sales role the backend returns own-only.
    var myDrsScopedS = (p.dailyReqs||[]).filter(function(r){
      if (isTL) return true;
      var aid = r.agentId && r.agentId._id ? r.agentId._id : r.agentId;
      return String(aid) === myUidS;
    });
    var sparkLeadsS    = spark7(allMyLeads, function(l){ return l.createdAt; });
    var sparkDrsS      = spark7(myDrsScopedS, function(r){ return r.createdAt; });
    // Followups has no inherent "per-day" meaning (it's a current-state count),
    // so bars show followup-type history events per day as a proxy for activity.
    var followupEventsS = [];
    allMyLeads.forEach(function(l){
      (l.history||[]).forEach(function(h){
        if (!h || !h.timestamp) return;
        var by = String(h.byUser||"");
        if (isTL ? !tlMemberNames.has(by) : by !== myNameS) return;
        var ev = String(h.event||"").toLowerCase();
        if (ev.indexOf("call")<0 && ev.indexOf("callback")<0 && ev.indexOf("note")<0 && ev.indexOf("feedback")<0 && ev.indexOf("status")<0) return;
        followupEventsS.push(h);
      });
    });
    var sparkFollowupsS = spark7(followupEventsS, function(h){ return h.timestamp; });
    var sparkIntS      = spark7(allMyLeads.filter(function(l){return l.status==="HotCase"||l.status==="Potential";}), function(l){ return l.createdAt; });
    var sparkMeetS     = spark7(allMyLeads.filter(function(l){return l.hadMeeting===true||l.status==="MeetingDone";}), function(l){ return l.meetingDoneAt||l.updatedAt||l.createdAt; });
    var sparkDealsS    = spark7(allMyLeads.filter(function(l){return l.status==="DoneDeal";}), function(l){ return l.dealDate||l.updatedAt||l.createdAt; });

    return <div className="crm-dash crm-dash-sales" style={{padding:isMobile?"12px 10px 32px":"16px 12px 40px",background:"#F1F5F9",width:"100%",maxWidth:"100vw",boxSizing:"border-box",overflowX:"hidden"}}>
      {/* Header — clock now sits to the RIGHT of the date on the same line. */}
      <div className="crm-dash-header" style={{display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",marginBottom:isMobile?14:20,flexWrap:"wrap",gap:isMobile?10:8,flexDirection:isMobile?"column":"row"}}>
        <div style={{minWidth:0,width:isMobile?"100%":"auto"}}>
          <div style={{fontSize:isMobile?16:20,fontWeight:700,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{greeting} {p.cu.name}</div>
          <div style={{fontSize:isMobile?11:12,color:"#94A3B8",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{new Date().toDateString()} {"\u00b7"} {timeStr}</div>
        </div>
        <div className="crm-dash-filters" style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",width:isMobile?"100%":"auto"}}>
          {[["today","Today"],["yesterday","Yesterday"],["week","This Week"],["month","This Month"]].map(function(f){return <button key={f[0]} onClick={function(){setFilter(f[0]);}} style={{fontSize:12,padding:isMobile?"8px 10px":"6px 12px",minHeight:isMobile?36:undefined,border:filter===f[0]?"1px solid #3B82F6":"1px solid #E2E8F0",borderRadius:8,background:filter===f[0]?"#EFF6FF":"#fff",color:filter===f[0]?"#1D4ED8":"#64748B",cursor:"pointer",fontWeight:filter===f[0]?600:500,flex:isMobile?"1 1 auto":"0 0 auto",flexShrink:0}}>{f[1]}</button>;})}
          <div ref={quarterDropdownRef} style={{position:"relative",flex:isMobile?"1 1 auto":"0 0 auto"}}>
            {(function(){
              var qActive = (typeof filter==="string") && filter.indexOf("Q")===0;
              return <button onClick={function(){setQOpen(!qOpen);}} style={{fontSize:12,padding:isMobile?"8px 10px":"6px 12px",minHeight:isMobile?36:undefined,border:qActive?"1px solid #3B82F6":"1px solid #E2E8F0",borderRadius:8,background:qActive?"#EFF6FF":"#fff",color:qActive?"#1D4ED8":"#64748B",cursor:"pointer",width:isMobile?"100%":"auto",fontWeight:qActive?600:500}}>{qActive?filter:"Quarter"} {"\u25be"}</button>;
            })()}
            {qOpen&&<div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,minWidth:140,zIndex:99,boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
              {(function(){
                var curQLabel = "Q"+(Math.floor(new Date().getMonth()/3)+1)+" "+curYS;
                return quarterOptionsS.map(function(q){
                  var isActive = filter===q;
                  var isCurrent = q===curQLabel;
                  return <div key={q} onClick={function(){setFilter(q);setQOpen(false);}} style={{padding:"8px 14px",fontSize:12,color:isActive?"#1D4ED8":"#334155",fontWeight:isActive?600:500,background:isActive?"#EFF6FF":"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                    <span>{q}</span>
                    {isCurrent&&<span title="Current quarter" style={{width:6,height:6,borderRadius:"50%",background:"#22C55E",display:"inline-block"}}/>}
                  </div>;
                });
              })()}
            </div>}
          </div>
        </div>
      </div>

      {/* KPI strip — real backend counts from /api/dashboard/my-stats, re-fetched on filter change. */}
      {(function(){
        var st = myStats || {};
        var myLeadsCnt    = Number(st.myLeads||0);
        var myDrsCnt      = Number(st.dailyRequests||0);
        var myFupsCnt     = Number(st.followups||0);
        var myIntCnt      = Number(st.interested||0);
        var myMeetCnt     = Number(st.meetings||0);
        var myTargetQ     = Number(st.target||0);      // quarterly target from backend
        var myAchieved    = Number(st.achieved||0);    // achieved in active range (backend scopes deals by from/to)
        // Pro-rate target to the active filter. Backend only knows the quarter's
        // target; we scale it here so progress % is meaningful for Today/Week/Month.
        // 22 working days/month, 4 weeks/month — standard Egypt sales planning.
        var monthlyT = myTargetQ/3;
        var scaledTarget, scaledLabel;
        if (filter==="today" || filter==="yesterday") { scaledTarget = monthlyT/22; scaledLabel = "Daily"; }
        else if (filter==="week")                      { scaledTarget = monthlyT/4;  scaledLabel = "Weekly"; }
        else if (filter==="month")                     { scaledTarget = monthlyT;    scaledLabel = "Monthly"; }
        else                                            { scaledTarget = myTargetQ;   scaledLabel = "Quarterly"; }
        var scaledProgress = scaledTarget>0 ? Math.min(999, Math.round((myAchieved/scaledTarget)*100)) : 0;
        var fmtT = function(n){ if (n>=1000000) return (n/1000000).toFixed(1)+"M"; if (n>=1000) return Math.round(n/1000)+"K"; return Math.round(n); };
        var targetSub = scaledTarget>0 ? (scaledLabel+" \u00b7 of "+fmtT(scaledTarget)) : "Not set";
        var pctOf = function(n){ return myLeadsCnt>0 ? Math.round(n/myLeadsCnt*100)+"%" : "0%"; };
        return <div className="crm-dash-kpi" style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2, minmax(0, 1fr))":"repeat(auto-fit,minmax(130px,1fr))",gap:isMobile?8:10,marginBottom:isMobile?14:20}}>
          {kpiCard("My Leads",       myLeadsCnt, rangeLabelS,                         "#1565C0","#ffffff",function(){p.setFilter&&p.setFilter("all");p.nav("leads");}, sparkLeadsS)}
          {kpiCard("Daily Requests", myDrsCnt,   rangeLabelS,                         "#00796B","#ffffff",function(){if(p.setDrInitFilter)p.setDrInitFilter("all");p.nav("dailyReq");}, sparkDrsS)}
          {kpiCard("Followups",      myFupsCnt,  "Stale > 2d",                        "#E65100","#ffffff",function(){p.setFilter&&p.setFilter("CallBack");p.nav("leads");}, sparkFollowupsS)}
          {kpiCard("Interested",     myIntCnt,   pctOf(myIntCnt),                     "#6A1B9A","#ffffff",function(){if(p.setSpecialFilter)p.setSpecialFilter({type:"interested"});p.setFilter&&p.setFilter("all");p.nav("leads");}, sparkIntS)}
          {kpiCard("Meetings",       myMeetCnt,  pctOf(myMeetCnt),                    "#2E7D32","#ffffff",function(){p.setFilter&&p.setFilter("MeetingDone");p.nav("leads");}, sparkMeetS)}
          {kpiCard("Target",         scaledProgress+"%", targetSub,                   "#AD1457","#ffffff",function(){p.nav("kpis");}, sparkDealsS)}
        </div>;
      })()}

      {/* Rank + Urgent + Schedule row */}
      <div className="crm-dash-row" style={{display:"grid",gridTemplateColumns:isMobile?"minmax(0, 1fr)":"repeat(auto-fit,minmax(280px,1fr))",gap:isMobile?10:14,marginBottom:14}}>
        {rankWidget({ mode: "sales", rangeLabel: rangeLabelS })}

        <div className="crm-dash-card" style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:isMobile?"14px":"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",minWidth:0,boxSizing:"border-box"}}>
          <div style={{fontSize:isMobile?14:15,fontWeight:700,color:"#0F172A",marginBottom:isMobile?10:14}}>{"\ud83d\udea8"} Urgent {"\u2014"} Action Needed</div>
          {urgent2.length===0&&urgentNew2.length===0&&<div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>{"\u2705"} No urgent items</div>}
          {urgent2.map(function(l,i){var mins=Math.round((now-new Date(l.callbackTime).getTime())/60000);return <div key={i} onClick={function(){p.nav("leads",l);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #F8FAFC",minWidth:0,cursor:"pointer"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#EF4444",flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div><div style={{fontSize:11,color:"#94A3B8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Overdue {mins>60?Math.round(mins/60)+"h":mins+"min"} {"\u00b7"} {l.status}</div></div>
            <span style={{fontSize:11,fontWeight:700,color:"#DC2626",flexShrink:0}}>LATE</span>
          </div>;})}
          {urgentNew2.map(function(l,i){var hrs=Math.round((now-new Date(l.createdAt).getTime())/3600000);return <div key={"n"+i} onClick={function(){p.nav("leads",l);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #F8FAFC",minWidth:0,cursor:"pointer"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#3B82F6",flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div><div style={{fontSize:11,color:"#94A3B8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>New lead {"\u2014"} no action {hrs}h</div></div>
            <span style={{fontSize:11,fontWeight:700,color:"#1D4ED8",flexShrink:0}}>NEW</span>
          </div>;})}
        </div>
        <div className="crm-dash-card" style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:isMobile?"14px":"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",minWidth:0,boxSizing:"border-box"}}>
          <div style={{fontSize:isMobile?14:15,fontWeight:700,color:"#0F172A",marginBottom:isMobile?10:14}}>{"\ud83d\udcc5"} {scheduleTitle2}</div>
          {schedule2.length===0&&<div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>No callbacks scheduled in this range</div>}
          {schedule2.map(function(l,i){
            var t2=l.callbackTime?new Date(l.callbackTime).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"\u2014";
            var isLate2=l.callbackTime&&new Date(l.callbackTime).getTime()<now;
            return <div key={i} onClick={function(){p.nav("leads",l);}} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #F8FAFC",minWidth:0,cursor:"pointer"}}>
              <div style={{fontSize:11,color:isLate2?"#DC2626":"#64748B",width:38,flexShrink:0,fontWeight:600}}>{t2}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</div><div style={{fontSize:11,color:isLate2?"#DC2626":"#94A3B8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isLate2?"Overdue":"Callback scheduled"}</div></div>
              <div style={{width:8,height:8,borderRadius:"50%",background:isLate2?"#EF4444":"#10B981",flexShrink:0}}/>
            </div>;
          })}
        </div>
      </div>

      {/* Status + Funnel + Recent Activity row */}
      <div className="crm-dash-row" style={{display:"grid",gridTemplateColumns:isMobile?"minmax(0, 1fr)":"repeat(auto-fit,minmax(280px,1fr))",gap:isMobile?10:14,marginBottom:14}}>
        <div className="crm-dash-card" style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:isMobile?"14px":"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",minWidth:0,boxSizing:"border-box"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isMobile?10:14}}>
            <div style={{fontSize:isMobile?14:15,fontWeight:700,color:"#0F172A"}}>My Leads {"\u2014"} Status</div>
            <div style={{fontSize:10,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{rangeLabelS}</div>
          </div>
          {[
            ["New Lead","NewLead","#3B82F6"],
            ["Potential","Potential","#10B981"],
            ["Hot Case","HotCase","#F59E0B"],
            ["Call Back","CallBack","#EF4444"],
            ["Meeting","MeetingDone","#8B5CF6"],
            ["EOI","EOI","#A855F7"],
            ["Done Deal","DoneDeal","#059669"],
            ["No Answer","NoAnswer","#64748B"],
            ["Not Int.","NotInterested","#94A3B8"]
          ].map(function(s){return bRow(s[0],mySC2[s[1]]||0,myTotal2,s[2],function(){p.setFilter&&p.setFilter(s[1]);p.nav("leads");});})}
          <div style={{borderTop:"1px solid #F1F5F9",marginTop:8,paddingTop:8,display:"flex",gap:14,alignItems:"center",fontSize:11,flexWrap:"wrap"}}>
            <span title="Current state — ignores the date filter above" style={{fontSize:9,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.08em",background:"#F1F5F9",padding:"2px 6px",borderRadius:4}}>NOW</span>
            <span onClick={function(){p.setFilter&&p.setFilter("CallBack");p.nav("leads");}} style={{color:"#64748B",cursor:"pointer"}}>Overdue: <span style={{color:"#EF4444",fontWeight:700}}>{myOv2}</span></span>
            <span onClick={function(){p.setFilter&&p.setFilter("NewLead");p.nav("leads");}} style={{color:"#64748B",cursor:"pointer"}}>Untouched: <span style={{color:"#3B82F6",fontWeight:700}}>{allMyLeads.filter(function(l){return l.status==="NewLead"&&l.createdAt&&(now-new Date(l.createdAt).getTime())>2*DAY;}).length}</span></span>
          </div>
        </div>
        <div className="crm-dash-card" style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:isMobile?"14px":"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",minWidth:0,boxSizing:"border-box",overflow:"hidden"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isMobile?10:14}}>
            <div style={{fontSize:isMobile?14:15,fontWeight:700,color:"#0F172A"}}>My Conversion Funnel</div>
            <div style={{fontSize:10,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{rangeLabelS}</div>
          </div>
          {funnelRowsS.map(function(row,i){
            var pct = Math.max(6, Math.round((row.v/funnelMaxS)*100));
            return <div key={i} onClick={row.nav} style={{display:"flex",alignItems:"center",gap:isMobile?6:8,marginBottom:8,minWidth:0,cursor:"pointer"}}>
              <div style={{fontSize:11,color:"#64748B",width:isMobile?70:90,flexShrink:0,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.l}</div>
              <div style={{flex:1,minWidth:0,height:22,borderRadius:4,background:"#F8FAFC",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,height:"100%",borderRadius:4,background:row.c,width:pct+"%",display:"flex",alignItems:"center",padding:"0 8px",minWidth:0,boxSizing:"border-box"}}>
                  <span style={{fontSize:11,fontWeight:700,color:row.tc,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.v}</span>
                </div>
              </div>
              <div style={{fontSize:10,color:"#94A3B8",width:isMobile?36:46,textAlign:"right",flexShrink:0}}>{funnelRowsS[0].v>0?Math.round(row.v/funnelRowsS[0].v*100)+"%":"0%"}</div>
            </div>;
          })}
        </div>
        <div className="crm-dash-card" style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:isMobile?"14px":"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",minWidth:0,boxSizing:"border-box"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isMobile?10:14}}>
            <div style={{fontSize:isMobile?14:15,fontWeight:700,color:"#0F172A"}}>Recent Activity</div>
            <div style={{fontSize:10,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Last 20 · {rangeLabelS}</div>
          </div>
          {/* Fixed-height list — first 4 visible (~57px each), the rest scroll inside the card. */}
          <div style={{maxHeight:228,overflowY:"auto",paddingRight:4}}>
            {myRecentActsS.length===0&&<div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>No activity in this range</div>}
            {myRecentActsS.map(function(h,i){
              var stC = statusColors2[h.lead&&h.lead.status]||"#94A3B8";
              return <div key={i} onClick={function(){ if(h.lead) p.nav("leads",h.lead); }} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 0",borderBottom:"1px solid #F8FAFC",minWidth:0,cursor:h.lead?"pointer":"default"}}>
                <span style={{fontSize:14,lineHeight:"18px",flexShrink:0}}>{eventIconS(h.event)}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.leadName} {"\u2014"} <span style={{color:stC,fontWeight:600}}>{h.lead&&h.lead.status}</span></div>
                  <div style={{fontSize:11,color:"#64748B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.description||h.event}</div>
                  <div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>{fmtActTime(h.timestamp)}</div>
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>;
  }

  var nowD = new Date();
  var dayNamesF=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var monthsF=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var pad=function(n){return n<10?"0"+n:""+n;};
  var dateLabel = dayNamesF[nowD.getDay()]+" "+nowD.getDate()+" "+monthsF[nowD.getMonth()]+" "+nowD.getFullYear()+" \u2014 "+pad(nowD.getHours())+":"+pad(nowD.getMinutes())+":"+pad(nowD.getSeconds());

  // Week starts Saturday (sat=0, fri=6). When today is Saturday, that Sat is start of week.
  var todayDay = nowD.getDay(); // 0=Sun..6=Sat
  var daysSinceSat = (todayDay - 6 + 7) % 7; // Sat=0, Sun=1, ... Fri=6
  var weekStart = new Date(nowD.getFullYear(),nowD.getMonth(),nowD.getDate()-daysSinceSat,0,0,0,0);
  var weekEnd = new Date(weekStart.getTime() + 7*DAY - 1);

  // Compute filter date range [rangeStart, rangeEnd]
  var todayStart = new Date(nowD.getFullYear(),nowD.getMonth(),nowD.getDate(),0,0,0,0);
  var yestStart  = new Date(nowD.getFullYear(),nowD.getMonth(),nowD.getDate()-1,0,0,0,0);
  var monthStart = new Date(nowD.getFullYear(),nowD.getMonth(),1,0,0,0,0);
  var rangeStart, rangeEnd = now, periodEnd;
  if (filter==="today") { rangeStart = todayStart.getTime(); periodEnd = todayStart.getTime()+DAY-1; }
  else if (filter==="yesterday") { rangeStart = yestStart.getTime(); rangeEnd = yestStart.getTime()+DAY-1; periodEnd = rangeEnd; }
  else if (filter==="week") { rangeStart = weekStart.getTime(); rangeEnd = weekEnd.getTime(); periodEnd = weekEnd.getTime(); }
  else if (filter==="month") { rangeStart = monthStart.getTime(); periodEnd = new Date(nowD.getFullYear(),nowD.getMonth()+1,1,0,0,0,0).getTime()-1; }
  else if (typeof filter==="string" && filter.indexOf("Q")===0) {
    var qm = filter.match(/Q(\d)\s+(\d{4})/);
    if (qm) { var qNum=parseInt(qm[1]); var qYear=parseInt(qm[2]); var qStartMonth=(qNum-1)*3; rangeStart = new Date(qYear,qStartMonth,1).getTime(); rangeEnd = new Date(qYear,qStartMonth+3,1).getTime()-1; periodEnd = rangeEnd; }
    else { rangeStart = monthStart.getTime(); periodEnd = rangeEnd; }
  } else { rangeStart = monthStart.getTime(); periodEnd = rangeEnd; }

  // Filter leads by date range
  var fLeads = leads.filter(function(l){var ct=l.createdAt?new Date(l.createdAt).getTime():0;return ct>=rangeStart&&ct<=rangeEnd;});
  var fTotal = fLeads.length||1;
  var fSC={}; fLeads.forEach(function(l){fSC[l.status]=(fSC[l.status]||0)+1;});
  // DR for current filter
  var fDR = (p.dailyReqs||[]).filter(function(r){var rt=r.createdAt?new Date(r.createdAt).getTime():0;return rt>=rangeStart&&rt<=rangeEnd;});

  // Helper: was status "X" set in the date range? Check assignments and agentHistory entries.
  var statusChangedInRange = function(l, targetStatus){
    // Check if any assignment currently has this status AND lastActionAt is in range
    var assignMatch = (l.assignments||[]).some(function(a){
      if (a.status!==targetStatus) return false;
      var t = a.lastActionAt?new Date(a.lastActionAt).getTime():0;
      return t>=rangeStart && t<=rangeEnd;
    });
    if (assignMatch) return true;
    // Check agentHistory for "Status: X" entries in range (per-assignment history)
    return (l.assignments||[]).some(function(a){
      return (a.agentHistory||[]).some(function(h){
        var t = h.createdAt?new Date(h.createdAt).getTime():0;
        if (t<rangeStart||t>rangeEnd) return false;
        var note = (h.note||"").toLowerCase();
        return note.indexOf(targetStatus.toLowerCase())>=0;
      });
    });
  };
  // Interested statuses
  var interestedStatuses = ["Interested","Hot Case","HotCase","Potential"];
  // Leads where ANY assignment has these statuses OR top-level
  var allLeadsUntimed = leads; // all non-archived leads for overall counts
  // Meetings: leads with "Meeting Done" status in assignments + DR with status "Meeting"
  var meetingsFromLeads = allLeadsUntimed.filter(function(l){
    // For "all time" view, keep current MeetingDone status as the signal
    if (!filter || filter === "all" || filter === "alltime") {
      return (l.assignments||[]).some(function(a){
        return a.status==="Meeting Done"||a.status==="MeetingDone";
      }) || l.status==="MeetingDone";
    }

    // For ranged filters, require an actual transition to MeetingDone
    // within the selected window.

    // Check assignment slices' agentHistory for status_change -> MeetingDone
    var foundInAssignments = (l.assignments || []).some(function(a){
      return (a.agentHistory || []).some(function(h){
        if (!h) return false;
        var note = String(h.note || "");
        var isStatusChange = h.type === "status_change"
          || /status\s*changed/i.test(note)
          || /^Status:\s*Meeting/i.test(note);
        if (!isStatusChange) return false;
        var hasMeetingDone = /meeting\s*done|meetingdone/i.test(note);
        if (!hasMeetingDone) return false;
        var t = new Date(h.createdAt || h.at || h.date || 0).getTime();
        return t >= rangeStart && t <= rangeEnd;
      });
    });
    if (foundInAssignments) return true;

    // Check top-level lead.history for status_change to MeetingDone
    var foundInHistory = (l.history || []).some(function(h){
      if (!h) return false;
      var note = String(h.note || h.description || "");
      var isStatusChange = h.event === "status_change"
        || h.type === "status_change"
        || /status\s*changed/i.test(note);
      if (!isStatusChange) return false;
      var hasMeetingDone = /meeting\s*done|meetingdone/i.test(note);
      if (!hasMeetingDone) return false;
      var t = new Date(h.createdAt || h.at || h.date || 0).getTime();
      return t >= rangeStart && t <= rangeEnd;
    });
    if (foundInHistory) return true;

    return false;
  }).length;
  var meetingsFromDR = (p.dailyReqs||[]).filter(function(r){
    var rt=r.createdAt?new Date(r.createdAt).getTime():0;
    return (r.status==="Meeting"||r.status==="MeetingDone") && rt>=rangeStart && rt<=rangeEnd;
  }).length;
  var meetingsFiltered = meetingsFromLeads + meetingsFromDR;
  // Interested: any assignment status in [Interested, Hot Case, Potential]
  var interestedFiltered = fLeads.filter(function(l){return (l.assignments||[]).some(function(a){return interestedStatuses.includes(a.status);})||interestedStatuses.includes(l.status);}).length;
  // Deals: leads where globalStatus==="donedeal" dated by dealDate/latest assignment.lastActionAt + DR with DoneDeal status in range
  var dealsFromLeads = leads.filter(function(l){
    if (l.globalStatus!=="donedeal" && l.status!=="DoneDeal") return false;
    var dealT = l.dealDate ? new Date(l.dealDate).getTime() : 0;
    if (!dealT || isNaN(dealT)) {
      dealT = 0;
      (l.assignments||[]).forEach(function(a){ if(a.lastActionAt){ var t=new Date(a.lastActionAt).getTime(); if(!isNaN(t)&&t>dealT) dealT=t; } });
    }
    if (!dealT && l.updatedAt) dealT = new Date(l.updatedAt).getTime();
    return dealT>=rangeStart && dealT<=rangeEnd;
  }).length;
  var dealsFromDR = (p.dailyReqs||[]).filter(function(r){
    if (r.status!=="DoneDeal" && r.status!=="Done Deal" && r.status!=="Deal") return false;
    var t = r.lastActivityTime ? new Date(r.lastActivityTime).getTime() : (r.updatedAt ? new Date(r.updatedAt).getTime() : (r.createdAt ? new Date(r.createdAt).getTime() : 0));
    return t>=rangeStart && t<=rangeEnd;
  }).length;
  var dealsFiltered = dealsFromLeads + dealsFromDR;
  // Overdue: leads/DRs whose callbackTime is past now AND falls inside the
  // active period [rangeStart, rangeEnd]. Without the range bound the count
  // would ignore the dashboard filter and always show "all overdue ever".
  var overdueLeads = allLeadsUntimed.filter(function(l){
    if (!l.callbackTime) return false;
    if (["MeetingDone","DoneDeal","EOI"].includes(l.status)) return false;
    var cb = new Date(l.callbackTime).getTime();
    if (isNaN(cb)) return false;
    return cb < now && cb >= rangeStart && cb <= rangeEnd;
  }).length;
  var overdueDR = (p.dailyReqs||[]).filter(function(r){
    var d = r.dueDate||r.callbackTime;
    if (!d) return false;
    if (r.status==="Meeting"||r.status==="MeetingDone"||r.status==="DoneDeal") return false;
    var cb = new Date(d).getTime();
    if (isNaN(cb)) return false;
    return cb < now && cb >= rangeStart && cb <= rangeEnd;
  }).length;
  var overdueFiltered = overdueLeads + overdueDR;
  var callbacksFiltered = fLeads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).toDateString()===nowD.toDateString();}).length;
  // Daily Requests in the active date range — counted from the actual dailyRequests collection
  var drFiltered = (p.dailyReqs||[]).filter(function(r){var rt=r.createdAt?new Date(r.createdAt).getTime():0;return rt>=rangeStart&&rt<=rangeEnd;}).length;

  // Campaign performance (filtered)
  var fCampMap={};
  fLeads.forEach(function(l){
    var k=(l.campaign||"\u2014")+"|"+(l.project||"\u2014")+"|"+(l.source||"\u2014");
    if(!fCampMap[k]) fCampMap[k]={campaign:l.campaign||"",project:l.project||"",source:l.source||"",leads:0,int:0,meet:0,deals:0};
    fCampMap[k].leads++;
    if((l.assignments||[]).some(function(a){return interestedStatuses.includes(a.status);})||interestedStatuses.includes(l.status)) fCampMap[k].int++;
    if((l.assignments||[]).some(function(a){return a.status==="Meeting Done"||a.status==="MeetingDone";})||l.status==="MeetingDone"||l.status==="DoneDeal") fCampMap[k].meet++;
    if(l.status==="DoneDeal") fCampMap[k].deals++;
  });
  var fCamps=Object.values(fCampMap).sort(function(a,b){return b.leads-a.leads;}).slice(0,8).map(function(c){
    var ip=c.leads>0?Math.round(c.int/c.leads*100):0;
    var mp=c.leads>0?Math.round(c.meet/c.leads*100):0;
    return Object.assign({},c,{ip:ip,mp:mp,quality:ip>30?"High":ip>15?"Medium":"Low"});
  });

  // Agent performance — count leads by assignments[].assignedAt in active range (not lead.createdAt)
  var fAgentPerf=(p.users||[]).filter(function(u){return u.role==="sales";}).map(function(u){
    var uid=String(u._id||gid(u));
    var al=leads.filter(function(l){
      return (l.assignments||[]).some(function(a){
        var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
        if (String(aid)!==uid) return false;
        var t = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
        return !isNaN(t) && t>=rangeStart && t<=rangeEnd;
      });
    });
    var adr=fDR.filter(function(r){var aid=r.agentId&&r.agentId._id?r.agentId._id:r.agentId;return String(aid)===uid;});
    var aint=al.filter(function(l){return (l.assignments||[]).some(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===uid && interestedStatuses.includes(a.status);});}).length;
    var ameet=al.filter(function(l){return (l.assignments||[]).some(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===uid && (a.status==="Meeting Done"||a.status==="MeetingDone");});}).length;
    // Rotations: lead-level agentHistory stores {action:"Rotation", fromAgent:<name>, toAgent:<name>, ...}
    var uname = u.name || "";
    var arotOut=leads.filter(function(l){return (l.agentHistory||[]).some(function(h){return h && h.action==="Rotation" && h.fromAgent===uname;});}).length;
    var arotIn=leads.filter(function(l){return (l.agentHistory||[]).some(function(h){return h && h.action==="Rotation" && h.toAgent===uname;});}).length;
    // No Answer: leads where this agent's assignment.status === "NoAnswer" (or "No Answer")
    var anoAns=al.filter(function(l){return (l.assignments||[]).some(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===uid && (a.status==="NoAnswer"||a.status==="No Answer");});}).length;
    var afup=al.filter(function(l){return l.callbackTime;}).length;
    var aover=al.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).getTime()<now&&!["MeetingDone","DoneDeal","EOI"].includes(l.status);}).length;
    var adeals=al.filter(function(l){return l.status==="DoneDeal"||l.globalStatus==="donedeal";}).length;
    // Activities for this agent in the active range (from fetched today pool or p.activities fallback)
    var _actPool = (todayActivities && todayActivities.length) ? todayActivities : (p.activities||[]);
    var aActs = _actPool.filter(function(x){
      var xid = x.userId&&x.userId._id?x.userId._id:x.userId;
      if (String(xid)!==uid) return false;
      var t = x.createdAt?new Date(x.createdAt).getTime():0;
      return t>=rangeStart && t<=rangeEnd;
    });
    var acalls = aActs.filter(function(x){ return x.type==="call" || ((x.note||"").toLowerCase().indexOf("call")>=0); }).length;
    // Feedback quality: % of this agent's leads that have notes/feedback populated
    var aFbLeads = al.filter(function(l){
      if (l.notes && String(l.notes).trim().length>0) return true;
      if (l.lastFeedback && String(l.lastFeedback).trim().length>0) return true;
      return (l.assignments||[]).some(function(a){
        var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
        if (String(aid)!==uid) return false;
        return (a.notes && String(a.notes).trim().length>0) || (a.lastFeedback && String(a.lastFeedback).trim().length>0);
      });
    }).length;
    var fbPct = al.length>0 ? (aFbLeads/al.length) : 0;
    // Resp.Time: avg (assignment.lastActionAt - lead.createdAt) for this agent's assignments
    var rtSum=0, rtCount=0;
    al.forEach(function(l){
      (l.assignments||[]).forEach(function(a){
        var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
        if(String(aid)===uid && a.lastActionAt && l.createdAt){
          var diff=new Date(a.lastActionAt).getTime()-new Date(l.createdAt).getTime();
          if(diff>=0){rtSum+=diff;rtCount++;}
        }
      });
    });
    var respH = rtCount>0 ? (rtSum/rtCount)/3600000 : 0;
    var ip=al.length>0?Math.round(aint/al.length*100):0;
    var mp=al.length>0?Math.round(ameet/al.length*100):0;
    // Callback compliance: (callbacks not overdue) / total callbacks
    var cbTotal = afup;
    var cbOnTime = afup - aover;
    var cbPct = cbTotal>0 ? (cbOnTime/cbTotal) : (afup===0?1:0);
    // Quality score (0-100): activity(25) + feedback(20) + resp time(20) + meeting rate(15) + callback compliance(20)
    var qActivity = al.length>0 ? Math.min(25, (aActs.length/al.length)*25) : 0;
    var qFeedback = fbPct * 20;
    var qResp = respH>0 ? Math.max(0, 20 - respH*2) : (rtCount>0?20:10);
    var qMeeting = al.length>0 ? Math.min(15, (ameet/al.length)*100*0.15) : 0;
    var qCallback = cbPct * 20;
    var qualityScore = Math.round(qActivity + qFeedback + qResp + qMeeting + qCallback);
    if (qualityScore>100) qualityScore = 100; if (qualityScore<0) qualityScore = 0;
    // Legacy composite score (kept for internal sort compat)
    var actScore=Math.min(100,(al.length+adr.length)*5);
    var rtScore=respH>0?Math.max(0,100-respH*2):50;
    var score=Math.round(actScore*0.4 + mp*0.3 + ip*0.2 + rtScore*0.1);
    return {uid:uid,name:u.name,leads:al.length,dr:adr.length,total:al.length+adr.length,calls:acalls,followups:afup,overdue:aover,interested:aint,ip:ip,meetings:ameet,mp:mp,deals:adeals,rotOut:arotOut,rotIn:arotIn,noAnswer:anoAns,respTime:respH>0?respH.toFixed(1):"\u2014",score:score,quality:qualityScore};
  }).sort(function(a,b){return b.quality-a.quality;});

  // Untouched leads are served by GET /api/leads/untouched — the local
  // leads[] is paginated, so any client-side filter here was capped to the
  // current page (which is why the card used to read 0). See the
  // untouchedData state + polling effect above.

  // Today's activities feed — Activity collection (covers leads + DRs) merged
  // with lead.history entries (captures status_change / feedback_added /
  // callback_scheduled / rotated / assigned events the Activity collection
  // doesn't track natively).
  var _actsPool = (todayActivities && todayActivities.length) ? todayActivities : (p.activities||[]);
  // Range-scoped (Change 1) — no longer hardcoded to today. Bounds come
  // from the admin rangeStart/rangeEnd that the Key Metrics cards use.
  var _actsToday = _actsPool.filter(function(a){
    if (!a.createdAt) return false;
    var t = new Date(a.createdAt).getTime();
    return t >= rangeStart && t <= rangeEnd;
  });
  _actsToday.sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});
  // Dedupe: first by _id (Map), then collapse near-duplicate legacy entries created by old server auto-log
  // (same user+lead+type within 10 seconds => keep only one)
  var _byId = new Map();
  _actsToday.forEach(function(a){ var k = a._id ? String(a._id) : ("no-id-"+Math.random()); if (!_byId.has(k)) _byId.set(k,a); });
  var _uniqueById = Array.from(_byId.values());
  var _seenContent = {};
  var todayActsAll = [];
  _uniqueById.forEach(function(a){
    var uid = String(a.userId&&a.userId._id?a.userId._id:a.userId||"");
    var lid = String(a.leadId&&a.leadId._id?a.leadId._id:a.leadId||"");
    var bucket = a.createdAt ? Math.floor(new Date(a.createdAt).getTime()/10000) : 0;
    var key = uid+"|"+lid+"|"+(a.type||"")+"|"+bucket;
    if (_seenContent[key]) return;
    _seenContent[key] = true;
    todayActsAll.push(a);
  });

  // Merge lead.history entries dated today (same lead pool already loaded).
  // Spec: "Pull from the lead history array and daily requests activity".
  // history entries carry {event, description, byUser, toAgent, timestamp};
  // we adapt them to the activity shape expected by the renderer below.
  var _nameToUid = {};
  (p.users||[]).forEach(function(u){ if (u && u.name) _nameToUid[u.name] = String(u._id||gid(u)); });
  var mapHistoryEvent = function(evt){
    var e = String(evt||"").toLowerCase();
    if (e.indexOf("status")>=0)   return "status_change";
    if (e.indexOf("feedback")>=0) return "note";
    if (e.indexOf("callback")>=0) return "note";
    if (e.indexOf("rotat")>=0)    return "reassign";
    if (e.indexOf("assign")>=0)   return "reassign";
    if (e.indexOf("meet")>=0)     return "meeting";
    return "note";
  };
  leads.forEach(function(l){
    (l.history||[]).forEach(function(h){
      if (!h || !h.timestamp) return;
      var t = new Date(h.timestamp).getTime();
      if (!t || t < rangeStart || t > rangeEnd) return;
      var mappedType = mapHistoryEvent(h.event);
      var byName = h.byUser || "";
      var byUid = _nameToUid[byName] || null;
      // Dedupe against Activity-collection entries already captured for the same lead+type+10s bucket.
      var lid = String(gid(l)||"");
      var bucket = Math.floor(t/10000);
      var key = (byUid||"")+"|"+lid+"|"+mappedType+"|"+bucket;
      if (_seenContent[key]) return;
      _seenContent[key] = true;
      todayActsAll.push({
        _id: "hist:"+lid+":"+t+":"+(h.event||""),
        type: mappedType,
        note: h.description || h.event || "",
        userId: byUid ? { _id: byUid, name: byName } : (byName ? { name: byName } : null),
        leadId: { _id: gid(l), name: l.name },
        createdAt: h.timestamp,
        _fromHistory: true
      });
    });
  });
  todayActsAll.sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});

  // Mask phone
  var maskPh = function(ph){if(!ph)return "";if(ph.length<5)return ph;return ph.slice(0,3)+"****"+ph.slice(-2);};

  // Click lead navigation
  var openLead = function(l){ if(p.nav)p.nav("leads",l); };
  // Click alert navigation to filtered leads
  var gotoFilter = function(status){ if(p.setFilter)p.setFilter(status||"all"); if(p.nav)p.nav("leads"); };
  // Activity-row click router: Activity.leadId can point at either a Lead or
  // a DailyRequest (same Activity model, different collections). The server
  // only .populate()s the Lead side, so DR-owned activities arrive with an
  // unresolved id — we handle both the click-through and the displayed
  // client name via these local indexes.
  var _leadsById = {}; (p.leads||[]).forEach(function(l){ _leadsById[String(gid(l))] = l; });
  var _drsById   = {}; (p.dailyReqs||[]).forEach(function(r){ _drsById[String(gid(r))] = r; });
  // Phone-indexed lead lookup — DR rows are linked to leads by phone number
  // (same convention the server uses for DR ↔ Lead sync). We normalize to
  // digits only so "+20 010..." and "010..." resolve the same lead.
  var _normPh = function(p){ return String(p||"").replace(/\D+/g,""); };
  var _leadsByPhone = {};
  (p.leads||[]).forEach(function(l){
    var k1 = _normPh(l.phone);   if (k1) _leadsByPhone[k1] = l;
    var k2 = _normPh(l.phone2);  if (k2 && !_leadsByPhone[k2]) _leadsByPhone[k2] = l;
  });
  // Phone-indexed DR lookup — when Activity.populate("leadId") misses (the
  // referenced id is a DailyRequest, not a Lead), a.leadId comes back null
  // and we lose the original id. The Activity's clientPhone snapshot lets
  // us recover the DR by phone, which in turn gives us back the DR's _id
  // for click routing and its name for the row label.
  var _drsByPhone = {};
  (p.dailyReqs||[]).forEach(function(r){
    var k1 = _normPh(r.phone);   if (k1 && !_drsByPhone[k1]) _drsByPhone[k1] = r;
    var k2 = _normPh(r.phone2);  if (k2 && !_drsByPhone[k2]) _drsByPhone[k2] = r;
  });
  var _drFromActivityPhone = function(a){
    var ph = _normPh(a && a.clientPhone);
    return ph ? (_drsByPhone[ph] || null) : null;
  };
  // Source inference from the raw activity doc:
  //   - Lead-backed:  a.leadId is the populated object { _id, name }
  //   - DR-backed:    a.leadId is an unpopulated ObjectId (string after JSON)
  //                   OR null (populate miss — recover via clientPhone)
  var activityIsLead = function(a){ return !!(a && a.leadId && typeof a.leadId === "object" && a.leadId.name); };
  var activityLeadIdStr = function(a){
    if (!a) return "";
    if (a.leadId) {
      if (typeof a.leadId === "object") return a.leadId._id ? String(a.leadId._id) : "";
      return String(a.leadId);
    }
    // Populate miss — DR-backed. Resolve the DR through the phone snapshot
    // and return its _id so the click router can find it in _drsById.
    var dr = _drFromActivityPhone(a);
    return dr ? String(gid(dr)) : "";
  };
  // Router:
  //   - Lead-backed activity → open the lead directly.
  //   - DR-backed activity   → look up a Lead by phone (cached DR's phone
  //     OR the activity's own clientPhone snapshot, so we don't depend on
  //     p.dailyReqs being loaded). Found → open that Lead's detail page.
  //     Not found → open the DR detail (cached doc when available, shell
  //     {_id, name, phone} otherwise — DailyRequestsPage re-hydrates from
  //     its own fetch on mount).
  var openActivity = function(a){
    var id = activityLeadIdStr(a);
    if (!id) return;
    if (activityIsLead(a)) {
      var leadObj = _leadsById[id] || { _id: id, name: (a.leadId && a.leadId.name) || "" };
      if (p.nav) p.nav("leads", leadObj);
      return;
    }
    // DR-backed.
    var drObj = _drsById[id];
    var drPhone = (drObj && (_normPh(drObj.phone) || _normPh(drObj.phone2))) || _normPh(a && a.clientPhone);
    var linkedLead = drPhone ? _leadsByPhone[drPhone] : null;
    if (linkedLead) {
      if (p.nav) p.nav("leads", linkedLead);
      return;
    }
    var drForOpen = drObj || { _id: id, name: resolveClientName(a), phone: (a && a.clientPhone) || "" };
    if (p.nav) p.nav("dailyReq", drForOpen);
  };
  // Is the originating Lead/DR for this activity archived? Archived records
  // stay in the Activities card as a read-only history, so the row must be
  // non-clickable even though we could resolve the source. Lead-backed ⇒
  // check the Lead's archived flag; DR-backed ⇒ check the DR's archived flag
  // (via id or phone snapshot). Linked-Lead-by-phone is NOT consulted here:
  // if the activity was logged on an archived DR, it's history either way.
  var isActivityArchived = function(a){
    if (!a) return false;
    var id = activityLeadIdStr(a);
    if (activityIsLead(a)) {
      var l = id ? _leadsById[id] : null;
      return !!(l && l.archived === true);
    }
    var dr = (id ? _drsById[id] : null) || _drFromActivityPhone(a);
    return !!(dr && dr.archived === true);
  };
  // Can we actually navigate to the source record of this activity? Rows
  // where we genuinely can't (DR deleted, no Lead, no phone to fall back to)
  // must render as visually non-clickable — don't pretend a dead click is
  // a real one. Also: archived records are read-only history — no click.
  var canOpenActivity = function(a){
    if (!a) return false;
    if (isActivityArchived(a)) return false;
    if (activityIsLead(a)) return true;
    var id = activityLeadIdStr(a);
    if (id && (_leadsById[id] || _drsById[id])) return true;
    if (_drFromActivityPhone(a)) return true;
    return false;
  };
  // Kept for backward compatibility with any older call sites (single-arg id).
  var openActivityClient = function(leadId){
    if (!leadId) return;
    var key = String(leadId);
    if (_leadsById[key]) { if(p.nav) p.nav("leads", _leadsById[key]); return; }
    if (_drsById[key])   { if(p.nav) p.nav("dailyReq", _drsById[key]); return; }
    if (p.nav) p.nav("dailyReq", { _id: key });
  };
  // Resolve a display label for the client behind an activity row. Order:
  //   1. a.clientName    — server snapshot (new — covers DR-backed activities
  //                        the populate can't resolve, no matter what's cached)
  //   2. a.leadId.name   — populate result (Lead-backed only)
  //   3. local indexes   — _leadsById / _drsById fallback
  //   4. a.clientPhone   — phone snapshot from server (digits as a last resort)
  //   5. "Unknown client"
  // Never returns the empty string; never lets the row render "(no client)".
  var resolveClientName = function(a){
    if (a && a.clientName) return a.clientName;
    if (a && a.leadId && typeof a.leadId === "object" && a.leadId.name) return a.leadId.name;
    var lid = a && a.leadId ? (a.leadId._id ? String(a.leadId._id) : String(a.leadId)) : "";
    if (lid) {
      if (_leadsById[lid] && _leadsById[lid].name) return _leadsById[lid].name;
      if (_drsById[lid]   && _drsById[lid].name)   return _drsById[lid].name;
      // Last-ditch: phone from local indexes if the doc exists but is unnamed.
      if (_leadsById[lid] && _leadsById[lid].phone) return _leadsById[lid].phone;
      if (_drsById[lid]   && _drsById[lid].phone)   return _drsById[lid].phone;
    }
    // Populate miss — DR-backed activity. Pull the DR via phone snapshot so
    // the row renders the real client name (or phone) instead of "Unknown
    // client". Spec: DR rows must fall back to phone if name is empty and
    // must never render "Unknown client".
    var dr = _drFromActivityPhone(a);
    if (dr) return dr.name || dr.phone || (a && a.clientPhone) || "";
    if (a && a.clientPhone) return a.clientPhone;
    return "Unknown client";
  };
  // Activity source badge: "DR" for DailyRequest-backed rows, nothing for Leads.
  // Lead-backed activities arrive populated (a.leadId is an object with name);
  // everything else is either a DR or an unknown id — either way the row
  // should route to the Daily Requests page when clicked.
  var activitySource = function(a){
    if (!a || !a.leadId) return "";
    if (activityIsLead(a)) return "";
    return "DR";
  };
  // Exact-time formatter for the activity rows — "3:45 PM".
  var exactTime = function(d){
    if (!d) return "";
    try { return new Date(d).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"}); }
    catch(e) { return ""; }
  };

  // Locked leads: any assignment with noRotation === true
  var lockedCount = leads.filter(function(l){return (l.assignments||[]).some(function(a){return a.noRotation===true;});}).length;
  // Missing feedback: any assignment whose notes is empty/null
  var missingFBCount = leads.filter(function(l){return (l.assignments||[]).some(function(a){return !a.notes||String(a.notes).trim()===""})||(!l.lastFeedback&&l.status!=="NewLead"&&l.status!=="DoneDeal");}).length;
  // Stale 48h+: any assignment's lastActionAt older than 48h (fallback lead.lastActivityTime)
  var stale48Count = leads.filter(function(l){
    var latest = 0;
    (l.assignments||[]).forEach(function(a){ if(a.lastActionAt){ var t=new Date(a.lastActionAt).getTime(); if(t>latest) latest=t; } });
    if (!latest && l.lastActivityTime) latest = new Date(l.lastActivityTime).getTime();
    if (!latest && l.createdAt) latest = new Date(l.createdAt).getTime();
    return latest>0 && latest<(now-2*DAY) && l.status!=="DoneDeal" && l.status!=="NotInterested";
  }).length;
  // Rotations this month from agentHistory entries, split auto vs manual
  var monthStartMs = new Date(nowD.getFullYear(),nowD.getMonth(),1,0,0,0,0).getTime();
  var rotMonthAuto=0, rotMonthManual=0;
  leads.forEach(function(l){
    (l.agentHistory||[]).forEach(function(h){
      if (!h||h.action!=="Rotation") return;
      var ht = h.date?new Date(h.date).getTime():0;
      if (ht<monthStartMs) return;
      if ((h.reason||"").toString().toLowerCase()==="manual") rotMonthManual++; else rotMonthAuto++;
    });
  });
  var rotationsMonth = rotMonthAuto + rotMonthManual;
  var rotationsTotal = leads.reduce(function(s,l){return s+(l.rotationCount||0);},0);

  // Action label for activities
  var actLabel = function(a){
    if(a.type==="status_change") return "Status change";
    if(a.type==="note") return "Note added";
    if(a.type==="call") return "Call logged";
    if(a.type==="meeting") return "Meeting booked";
    if(a.type==="reassign") return "Reassign";
    if((a.note||"").toLowerCase().includes("callback")) return "Callback set";
    return "Activity";
  };
  var timeAgoShort = function(d){
    var diff=Math.max(0,(now-new Date(d).getTime())/60000);
    if(diff<1) return "just now";
    if(diff<60) return Math.round(diff)+" min ago";
    if(diff<1440) return Math.round(diff/60)+"h ago";
    return Math.round(diff/1440)+"d ago";
  };
  var agentName = function(uid){
    var u=(p.users||[]).find(function(x){return String(x._id||gid(x))===String(uid);});
    return u?u.name:"Unknown";
  };
  var initialsOf = function(n){return (n||"?").split(" ").slice(0,2).map(function(x){return x[0];}).join("").toUpperCase();};

  return <div className="crm-dash crm-dash-admin" style={{padding:isMobile?"12px 10px 32px":"16px 12px 40px",background:"#F1F5F9",width:"100%",maxWidth:"100vw",boxSizing:"border-box",overflowX:"hidden"}}>
    {/* Mobile safety-net CSS lives once in the app root — see CRMApp. */}
    <div className="crm-dash-header" style={{display:"flex",alignItems:isMobile?"flex-start":"center",justifyContent:"space-between",marginBottom:isMobile?16:24,flexWrap:"wrap",gap:isMobile?10:8,flexDirection:isMobile?"column":"row"}}>
      <div style={{minWidth:0,width:isMobile?"100%":"auto"}}>
        <div style={{fontSize:isMobile?16:22,fontWeight:700,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{greeting+" "+p.cu.name}</div>
        <div style={{fontSize:isMobile?11:12,color:"#94A3B8",marginTop:2,fontVariantNumeric:"tabular-nums",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dateLabel}</div>
      </div>
      <div className="crm-dash-filters" style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",width:isMobile?"100%":"auto",overflowX:isMobile?"auto":"visible",WebkitOverflowScrolling:"touch"}}>
        {[["today","Today"],["yesterday","Yesterday"],["week","This Week"],["month","This Month"]].map(function(f){
          return <button key={f[0]} onClick={function(){setFilter(f[0]);}} style={{fontSize:12,padding:isMobile?"8px 12px":"6px 14px",minHeight:isMobile?36:undefined,border:filter===f[0]?"1px solid #3B82F6":"1px solid #E2E8F0",borderRadius:8,background:filter===f[0]?"#EFF6FF":"#fff",color:filter===f[0]?"#1D4ED8":"#64748B",cursor:"pointer",fontWeight:filter===f[0]?600:500,flexShrink:0}}>{f[1]}</button>;
        })}
        <div ref={quarterDropdownRef} style={{position:"relative"}}>
          <button onClick={function(){setQOpen(!qOpen);}} style={{fontSize:12,padding:isMobile?"8px 12px":"6px 14px",minHeight:isMobile?36:undefined,border:(typeof filter==="string"&&filter.indexOf("Q")===0)?"1px solid #3B82F6":"1px solid #E2E8F0",borderRadius:8,background:(typeof filter==="string"&&filter.indexOf("Q")===0)?"#EFF6FF":"#fff",color:(typeof filter==="string"&&filter.indexOf("Q")===0)?"#1D4ED8":"#64748B",cursor:"pointer",fontWeight:(typeof filter==="string"&&filter.indexOf("Q")===0)?600:500,flexShrink:0}}>{(typeof filter==="string"&&filter.indexOf("Q")===0)?filter:"Quarter"} &#9662;</button>
          {qOpen&&<div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,minWidth:120,zIndex:99,boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
            {(function(){var _y=nowD.getFullYear();return ["Q1 "+_y,"Q2 "+_y,"Q3 "+_y,"Q4 "+_y];})().map(function(q){return <div key={q} onClick={function(){setFilter(q);setQOpen(false);}} style={{padding:"8px 14px",fontSize:12,color:"#334155",cursor:"pointer"}}>{q}</div>;})}
          </div>}
        </div>
      </div>
    </div>

    {sec("Key Metrics")}
    {(function(){
      // Sparkline bars: lead counts per day for the last 7 days, scoped to the
      // current period filter (fLeads). Position 6 = today, position 0 = 6
      // days ago — matches the Sun..Sat weekday strip rendered under each card.
      var _todayStartMs = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate(), 0,0,0,0).getTime();
      var _spark = [0,0,0,0,0,0,0];
      fLeads.forEach(function(l){
        if (!l.createdAt) return;
        var _t = new Date(l.createdAt).getTime();
        if (isNaN(_t)) return;
        var _dd = Math.floor((_todayStartMs - _t)/DAY);
        if (_dd < 0) _dd = 0;
        if (_dd > 6) return;
        _spark[6 - _dd]++;
      });
      return <div className="crm-dash-kpi" style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fit,minmax(160px,1fr))",gap:isMobile?10:14,marginBottom:0}}>
        {kpiCard("Leads",fLeads.length,"in period","linear-gradient(135deg, #43c6db, #3b5cb8)","#ffffff",function(){p.nav("leads");},_spark)}
        {kpiCard("Daily Requests",drFiltered,"in period","linear-gradient(135deg, #56ab2f, #a8e063)","#ffffff",function(){p.nav("dailyReq");},_spark)}
        {kpiCard("Interested",interestedFiltered,Math.round(interestedFiltered/fTotal*100)+"%","linear-gradient(135deg, #f46b45, #eea849)","#ffffff",function(){p.nav("leads");p.setFilter&&p.setFilter("HotCase");},_spark)}
        {kpiCard("Meetings",meetingsFiltered,Math.round(meetingsFiltered/fTotal*100)+"%","linear-gradient(135deg, #a18cd1, #e8a4c8)","#ffffff",function(){p.nav("leads");p.setFilter&&p.setFilter("MeetingDone");},_spark)}
        {kpiCard("Overdue",overdueFiltered,"late callbacks","linear-gradient(135deg, #e52d27, #b31217)","#ffffff",function(){p.nav("leads");p.setFilter&&p.setFilter("CallBack");},_spark)}
        {kpiCard("Deals",dealsFiltered,fTotal>0?((dealsFiltered/fTotal)*100).toFixed(1)+"%":"0%","linear-gradient(135deg, #f953c6, #b91d73)","#ffffff",function(){p.nav("deals");},_spark)}
      </div>;
    })()}

    {sec("Campaigns & Pipeline")}
    <div className="crm-dash-row" style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit, minmax(300px, 1fr))",gap:isMobile?10:14,marginBottom:14}}>
      {card(<>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>Campaign &amp; Source Performance</div>
          <div style={{display:"flex",gap:8}}>
            {[["#1877F2","Facebook"],["#0F9D58","Sheets"],["#EA4335","G.Ads"]].map(function(s){return <span key={s[1]} style={{fontSize:10,color:"#64748B",display:"flex",alignItems:"center",gap:3}}><span style={{width:6,height:6,borderRadius:"50%",background:s[0],display:"inline-block"}}/>{s[1]}</span>;})}
          </div>
        </div>
        {isMobile ? (
          // MOBILE: stacked card-per-campaign layout. The grid table (desktop
          // path below) tried to cram 6 columns into a phone-width container;
          // the name column clipped, headers and values drifted out of
          // alignment, and rows rendered inconsistently once any cell's
          // content shrank. A card per campaign removes the alignment burden
          // entirely — each card is full-width, with the campaign name
          // wrapping freely on top and a 4-stat mini-grid + Quality badge
          // below where every number sits right under its own label.
          <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",minWidth:0}}>
            {fCamps.length===0 && <div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>No campaign data yet</div>}
            {fCamps.map(function(c,i){
              var srcC=c.source==="Facebook"?"#1877F2":c.source==="Google Sheets"?"#0F9D58":"#EA4335";
              return <div key={i} style={{border:"1px solid #F1F5F9",borderRadius:12,padding:"10px 12px",background:"#FBFBFD",minWidth:0,boxSizing:"border-box"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:8,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0,flex:1}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:srcC,display:"inline-block",flexShrink:0}}/>
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#0F172A",lineHeight:1.25,overflowWrap:"anywhere",wordBreak:"break-word"}}>{c.campaign||"\u2014"} &middot; {c.project||"\u2014"}</div>
                      <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{c.source||"\u2014"}</div>
                    </div>
                  </div>
                  <div style={{flexShrink:0}}>{qBadge(c.quality)}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4, minmax(0, 1fr))",gap:6,paddingTop:8,borderTop:"1px solid #F1F5F9"}}>
                  {[
                    {l:"Leads", v:c.leads, sub:null,         vc:"#334155"},
                    {l:"Int.",  v:c.int,   sub:c.ip+"%",     vc:"#15803D"},
                    {l:"Meet.", v:c.meet,  sub:c.mp+"%",     vc:"#6D28D9"},
                    {l:"Deals", v:c.deals, sub:null,         vc:"#065F46"}
                  ].map(function(s,idx){return <div key={idx} style={{textAlign:"center",minWidth:0,padding:"2px 0"}}>
                    <div style={{fontSize:10,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:2,whiteSpace:"nowrap"}}>{s.l}</div>
                    <div style={{fontSize:15,fontWeight:800,color:s.vc,lineHeight:1}}>{s.v}</div>
                    {s.sub?<div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>{s.sub}</div>:null}
                  </div>;})}
                </div>
              </div>;
            })}
          </div>
        ) : (
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {(function(){
          // Desktop: grid-based table. Untouched by the mobile refactor.
          var cols = "minmax(140px, 1fr) 50px 90px 90px 50px 60px";
          var rowMinW = 500;
          return <>
            <div style={{display:"grid",gridTemplateColumns:cols,gap:4,paddingBottom:8,borderBottom:"1px solid #F1F5F9",marginBottom:4,minWidth:rowMinW}}>
              {["Campaign \u00b7 Project","Leads","Interested","Meetings","Deals","Quality"].map(function(h){return <div key={h} style={{fontSize:11,fontWeight:700,color:"#94A3B8",textAlign:h==="Campaign \u00b7 Project"?"left":"center",whiteSpace:"nowrap"}}>{h}</div>;})}
            </div>
            {fCamps.map(function(c,i){
              var srcC=c.source==="Facebook"?"#1877F2":c.source==="Google Sheets"?"#0F9D58":"#EA4335";
              return <div key={i} style={{display:"grid",gridTemplateColumns:cols,gap:4,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F8FAFC",minWidth:rowMinW}}>
                <div style={{minWidth:0,overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:srcC,display:"inline-block",flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:600,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.campaign||"\u2014"} &middot; {c.project||"\u2014"}</span>
                  </div>
                  <div style={{fontSize:11,color:"#94A3B8",paddingLeft:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.source}</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#334155"}}>{c.leads}</div>
                <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:"#15803D"}}>{c.int}</div><div style={{fontSize:10,color:"#94A3B8"}}>{c.ip}%</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:"#6D28D9"}}>{c.meet}</div><div style={{fontSize:10,color:"#94A3B8"}}>{c.mp}%</div></div>
                <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#065F46"}}>{c.deals}</div>
                <div style={{textAlign:"center"}}>{qBadge(c.quality)}</div>
              </div>;
            })}
          </>;
        })()}
        </div>
        )}
      </>)}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {card(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>Untouched Leads</div>
            <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,background:"#FEE2E2",color:"#991B1B"}}>{untouchedData===null?"\u2026":untouchedData.length}</span>
          </div>
          {untouchedData===null ? <div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>Loading\u2026</div>
           : untouchedData.length===0 ? <div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>{"\u2705"} All leads have activity</div>
           : <div style={{maxHeight:360,overflowY:"auto",WebkitOverflowScrolling:"touch",marginRight:-6,paddingRight:6}}>
             {/* Fixed height = ~8 rows (each row ~45px with padding + borders); rest scrolls inside the card. */}
             {untouchedData.map(function(u,i){
            // Server returns the computed view; we resolve the full Lead from
            // the local store for navigation, falling back to a {_id,name}
            // shell so the click still works if the lead isn't in the current
            // paginated window.
            var localLead = (leads||[]).find(function(x){return String(gid(x))===String(u._id);}) || { _id: u._id, name: u.name };
            var hrs = Number(u.hoursSinceActivity||0);
            var since = hrs < 1 ? "just now"
                       : hrs < 24 ? hrs + "h ago"
                       : Math.floor(hrs/24) + "d ago";
            return <div key={String(u._id)} onClick={function(){openLead(localLead);}} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:6,padding:"8px 0",borderBottom:i<untouchedData.length-1?"1px solid #F8FAFC":"none",cursor:"pointer"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{u.name||"\u2014"}</div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{u.agentName||"\u2014"} {"\u00b7"} {since}</div>
              </div>
              <div style={{fontSize:11,fontWeight:600,color:hrs>=48?"#DC2626":"#92400E",alignSelf:"center"}}>{hrs}h</div>
            </div>;
          })}
          </div>}
        </>)}
        {card(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{activitiesTitleForFilter(filter)}</div>
            <span style={{fontSize:11,fontWeight:600,color:"#1D4ED8",cursor:"pointer"}} onClick={function(){setSeeAllOpen(true);}}>View All ({todayActsAll.length})</span>
          </div>
          <div style={{maxHeight:420,overflowY:"auto",WebkitOverflowScrolling:"touch",marginRight:-6,paddingRight:6}}>
          {todayActsAll.length===0 ? <div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>No activity in {periodLabelForFilter(filter)}</div> : todayActsAll.map(function(a,i){
            var aid = a.userId&&a.userId._id?a.userId._id:a.userId;
            var aName = a.userId&&a.userId.name?a.userId.name:agentName(aid);
            var lName = resolveClientName(a);
            var srcTag = activitySource(a);
            var aNote = a.note||a.notes||a.feedback||a.details||"";
            var actionLabel = actLabel(a);
            var feedbackText = aNote;
            if (a.type==="status_change") {
              var bracketM = aNote.match(/^\s*\[([^\]]+)\]\s*([\s\S]*)$/);
              var colonM = aNote.match(/^\s*Status\s*:\s*([^|]+?)(?:\s*\|\s*([\s\S]*))?$/i);
              var statusName = "", fb = "";
              if (bracketM) { statusName = bracketM[1].trim(); fb = (bracketM[2]||"").trim(); }
              else if (colonM) { statusName = colonM[1].trim(); fb = (colonM[2]||"").trim(); }
              else { statusName = "changed"; fb = aNote; }
              actionLabel = "Status: "+(statusName||"changed");
              feedbackText = fb;
            } else if (a.type==="call") {
              actionLabel = "Call initiated";
              feedbackText = aNote.replace(/^\s*[\ud83d\udcde\ud83d\udcde]+\s*/,"").replace(/^Call initiated\s*[-\u2014:]?\s*/i,"").trim();
            } else if (a.type==="note") {
              actionLabel = "Note added";
            } else if (a.type==="reassign") {
              actionLabel = "Reassign";
              feedbackText = "";
            } else if (a.type==="meeting") {
              actionLabel = "Meeting booked";
            } else if (a.type==="daily_request" || (aNote.toLowerCase().indexOf("daily")>=0)) {
              actionLabel = "DailyReq: "+((aNote.split(":")[1]||"").trim().split("|")[0].trim()||"updated");
              feedbackText = "";
            }
            var noteLc = aNote.toLowerCase();
            var ic;
            if (a.type==="call") ic={icon:"\ud83d\udcde",bg:"#DCFCE7",fg:"#166534"};
            else if (a.type==="meeting" || noteLc.indexOf("deal")>=0) ic={icon:"\ud83c\udfc6",bg:"#FEF3C7",fg:"#92400E"};
            else if (a.type==="status_change") ic={icon:"\u2197",bg:"#EDE9FE",fg:"#5B21B6"};
            else if (a.type==="note") ic={icon:"\ud83d\udcdd",bg:"#FFE4E6",fg:"#9F1239"};
            else if (noteLc.indexOf("callback")>=0) ic={icon:"\ud83d\udcc5",bg:"#DBEAFE",fg:"#1D4ED8"};
            else ic={icon:"\u2022",bg:"#F1F5F9",fg:"#64748B"};
            var actLeadId = activityLeadIdStr(a);
            // Gate the click on canOpenActivity — not just on whether we have
            // an id string. Rows for deleted DRs (id exists but no doc in
            // p.dailyReqs and no phone to fall back to) are truly dead and
            // should render as cursor:default with no handler.
            var onActClick = canOpenActivity(a) ? function(){ openActivity(a); } : null;
            // Archived source records stay in the history but must not be
            // clickable — match the existing archived visual style used on
            // the Archive page rows (opacity 0.7, cursor default).
            var isArchivedRow = isActivityArchived(a);
            // Spec: "client name, action type, agent name, exact time" — show client first, agent on the subtitle.
            var clientName = lName || "Unknown client";
            // Daily Request rows show the full feedback text (spec — no truncation).
            // Lead rows stay single-line with the existing 80-char cap so long notes
            // don't blow up the dashboard.
            var isDrRow = srcTag === "DR";
            var feedbackTextDisplay = feedbackText;
            if (!isDrRow && feedbackTextDisplay && feedbackTextDisplay.length>80) {
              feedbackTextDisplay = feedbackTextDisplay.slice(0,80)+"\u2026";
            }
            var subtitleStyle = isDrRow
              ? { fontSize:11, color:"#64748B", marginTop:1, wordBreak:"break-word", whiteSpace:"normal" }
              : { fontSize:11, color:"#64748B", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" };
            return <div key={String(a._id||("k"+i))} onClick={onActClick} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 0",borderBottom:i<todayActsAll.length-1?"1px solid #F1F5F9":"none",cursor:onActClick?"pointer":"default",opacity:isArchivedRow?0.7:1}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:ic.bg,color:ic.fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,marginTop:2}}>{ic.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  <span style={{fontWeight:600,color:ic.fg}}>{actionLabel}</span>
                  {" \u2014 "}{clientName}
                  {srcTag&&<span style={{marginLeft:6,fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:4,background:"#DBEAFE",color:"#1D4ED8",verticalAlign:"middle"}} title="Daily Request">{srcTag}</span>}
                </div>
                <div style={subtitleStyle}>
                  {aName}{feedbackTextDisplay?<span> {"\u00b7"} <span style={{fontWeight:700,color:"#334155"}}>{feedbackTextDisplay}</span></span>:null}
                </div>
              </div>
              <div style={{fontSize:11,color:"#94A3B8",flexShrink:0,fontWeight:600,marginTop:2}}>{exactTime(a.createdAt)}</div>
            </div>;
          })}
          </div>
        </>)}
      </div>
    </div>

    {sec("Team Performance")}
    <div style={{marginBottom:14}}>
    {card(<>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:6}}>
        <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>Agent Performance</div>
        <div style={{fontSize:10,color:"#94A3B8"}} title="Quality = activity + feedback + response time + meetings + callbacks">Quality = activity, feedback, response time, meetings & callbacks</div>
      </div>
      <div className="crm-dash-scroll" style={{overflowX:"auto",overflowY:"auto",maxHeight:360,WebkitOverflowScrolling:"touch",width:"100%"}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"36px 150px repeat(14, 56px)":"36px 160px repeat(14, minmax(0, 1fr))",gap:4,paddingTop:4,paddingBottom:8,borderBottom:"1px solid #F1F5F9",marginBottom:4,width:isMobile?"max-content":"100%",minWidth:isMobile?980:undefined,position:"sticky",top:0,zIndex:10,background:"#fff"}}>
        {["","Agent","Leads","DR","Total","Calls","Follow","Overdue","Int","Meet","Deals","Rot OUT","Rot IN","No Ans","Resp.","Quality"].map(function(h,idx){return <div key={h+idx} style={{fontSize:11,fontWeight:700,color:"#94A3B8",textAlign:h==="Agent"?"left":"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{h}</div>;})}
      </div>
      {fAgentPerf.map(function(a,i){
        var medals=["\ud83e\udd47","\ud83e\udd48","\ud83e\udd49"];
        var avBg=["#DBEAFE","#DCFCE7","#FEF3C7","#EDE9FE","#FFE4E6"][i%5];
        var avC=["#1D4ED8","#166534","#92400E","#5B21B6","#9F1239"][i%5];
        var initials=(a.name||"?").split(" ").slice(0,2).map(function(x){return x[0];}).join("").toUpperCase();
        var qBg = a.quality>=80?"#DCFCE7":a.quality>=60?"#FEF3C7":"#FEE2E2";
        var qFg = a.quality>=80?"#166534":a.quality>=60?"#92400E":"#991B1B";
        return <div key={a.uid} onClick={function(){ if(p.setInitAgentFilter) p.setInitAgentFilter(a.uid); if(p.setFilter) p.setFilter("all"); if(p.nav) p.nav("leads"); }} style={{display:"grid",gridTemplateColumns:isMobile?"36px 150px repeat(14, 56px)":"36px 160px repeat(14, minmax(0, 1fr))",gap:4,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #F8FAFC",width:isMobile?"max-content":"100%",minWidth:isMobile?980:undefined,cursor:"pointer"}}>
          <div style={{fontSize:11,color:"#888",textAlign:"center",fontWeight:500}}>{i+1}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:avBg,color:avC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{initials}</div>
            <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div>
              <div style={{height:3,borderRadius:2,background:"#F1F5F9",width:60,marginTop:3}}><div style={{height:"100%",width:Math.min(100,a.quality)+"%",background:qFg,borderRadius:2}}/></div>
            </div>
          </div>
          <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#334155"}}>{a.leads}</div>
          <div style={{fontSize:13,fontWeight:600,textAlign:"center",color:"#0F172A"}}>{a.dr}</div>
          <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#334155"}}>{a.total}</div>
          <div style={{fontSize:13,fontWeight:600,textAlign:"center",color:a.calls>0?"#166534":"#94A3B8"}}>{a.calls}</div>
          <div style={{fontSize:13,fontWeight:600,textAlign:"center",color:"#334155"}}>{a.followups}</div>
          <div style={{fontSize:13,fontWeight:600,textAlign:"center",color:a.overdue>0?"#DC2626":"#94A3B8"}}>{a.overdue}</div>
          <div style={{fontSize:12,fontWeight:600,textAlign:"center",color:a.interested>0?"#15803D":"#94A3B8"}}>{a.interested}</div>
          <div style={{fontSize:12,fontWeight:600,textAlign:"center",color:a.meetings>0?"#6D28D9":"#94A3B8"}}>{a.meetings}</div>
          <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#065F46"}}>{a.deals}</div>
          <div style={{fontSize:12,fontWeight:600,textAlign:"center",color:a.rotOut>0?"#B45309":"#94A3B8"}} title="Leads rotated away from this agent">{a.rotOut||0}</div>
          <div style={{fontSize:12,fontWeight:600,textAlign:"center",color:a.rotIn>0?"#0F766E":"#94A3B8"}} title="Leads rotated to this agent">{a.rotIn||0}</div>
          <div style={{fontSize:12,fontWeight:600,textAlign:"center",color:a.noAnswer>0?"#64748B":"#94A3B8"}}>{a.noAnswer||0}</div>
          <div style={{fontSize:12,fontWeight:600,textAlign:"center",color:"#334155"}}>{a.respTime!=="\u2014"?a.respTime+"h":"\u2014"}</div>
          <div style={{textAlign:"center"}} title="Based on activity, feedback, response time, meetings & callbacks">
            <span style={{display:"inline-block",fontSize:12,fontWeight:700,padding:"3px 8px",borderRadius:8,background:qBg,color:qFg,minWidth:40}}>{medals[i]||""} {a.quality}</span>
          </div>
        </div>;
      })}
      </div>
    </>)}
    </div>

    <div className="crm-dash-row" style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(260px,1fr))",gap:isMobile?10:14}}>
      {card(<>
        <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:12}}>Management Alerts</div>
        {(function(){
          var gotoSpecial = function(type){
            if (p.setFilter) p.setFilter("all");
            if (p.setSpecialFilter) p.setSpecialFilter({type:type});
            if (p.nav) p.nav("leads");
          };
          // Rotated > 3 times with no deal — heavy-churn leads that never closed.
          var ROT_THRESHOLD = 3;
          var heavyRotNoDeal = leads.filter(function(l){
            if ((l.rotationCount||0) <= ROT_THRESHOLD) return false;
            if (l.status==="DoneDeal") return false;
            if (l.globalStatus==="donedeal" || l.globalStatus==="eoi") return false;
            return true;
          }).length;
          // Agents with zero activity today — active sales staff who haven't logged anything since 00:00.
          var todayStartMs = todayStart.getTime();
          var activeAgents = (p.users||[]).filter(function(u){return u.active!==false && (u.role==="sales"||u.role==="team_leader"||u.role==="manager");});
          var actPool = (todayActivities && todayActivities.length) ? todayActivities : (p.activities||[]);
          var activeAgentIds = {};
          actPool.forEach(function(a){
            var t = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            if (!t || t<todayStartMs) return;
            var aid = a.userId&&a.userId._id?a.userId._id:a.userId;
            if (aid) activeAgentIds[String(aid)] = true;
          });
          var inactiveAgentsToday = activeAgents.filter(function(u){return !activeAgentIds[String(u._id||gid(u))];}).length;
          var rows=[
            {dot:"#F97316",n:overdue,t:"overdue callbacks",s:"past scheduled",onClick:function(){gotoFilter("CallBack");}},
            {dot:"#DC2626",n:stale48Count,t:"untouched 48h+",s:"no activity in 48h",onClick:function(){gotoSpecial("stale48h");}},
            {dot:"#6366F1",n:heavyRotNoDeal,t:"rotated > "+ROT_THRESHOLD+"\u00d7 no deal",s:"churning without closing",onClick:function(){gotoSpecial("rotatedThisMonth");}},
            {dot:"#0EA5E9",n:inactiveAgentsToday,t:"agents no activity today",s:"of "+activeAgents.length+" active sales staff",onClick:function(){if(p.nav) p.nav("team");}},
            {dot:"#EF4444",n:untouched,t:"untouched leads",s:"no action taken",onClick:function(){gotoSpecial("untouched");}},
            {dot:"#F59E0B",n:missingFBCount,t:"missing feedback",s:"no notes",onClick:function(){gotoSpecial("missingFeedback");}},
            {dot:"#6366F1",n:rotationsMonth,t:"rotations this month",s:rotMonthAuto+" auto \u00b7 "+rotMonthManual+" manual",onClick:function(){gotoSpecial("rotatedThisMonth");}},
            {dot:"#7C3AED",n:lockedCount,t:"leads locked",s:"noRotation flag",onClick:function(){gotoSpecial("noRotation");}}
          ];
          return rows.map(function(a,i){
            return <div key={i} onClick={a.onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<rows.length-1?"1px solid #F8FAFC":"none",cursor:"pointer"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:a.dot,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}><span style={{fontSize:18,fontWeight:800,color:a.dot,marginRight:6}}>{a.n}</span>{a.t}</div><div style={{fontSize:11,color:"#94A3B8"}}>{a.s}</div></div>
            </div>;
          });
        })()}
      </>)}
      {card(<>
        <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:12}}>Callback Compliance</div>
        {(function(){
          var nowMs = now;
          var parseCb = function(v){ if(!v) return 0; var t=new Date(v).getTime(); return isNaN(t)?0:t; };
          // Seed every active sales/team_leader/manager so the leaderboard never drops an agent
          var byAgent = {};
          (p.users||[]).filter(function(u){return u.active!==false && (u.role==="sales"||u.role==="sales_admin"||u.role==="team_leader"||u.role==="manager");}).forEach(function(u){
            var uid = String(u._id||gid(u));
            byAgent[uid] = {uid:uid,name:u.name||"Unknown",total:0,doneOnTime:0,missed:0};
          });
          var sumScheduled=0, sumMissed=0;
          // For each lead, only the assignment matching the CURRENT lead.agentId counts as that lead's active callback
          // (rotated-off assignments carry stale callbackTime and must be ignored).
          leads.forEach(function(l){
            var currentAid = l.agentId && l.agentId._id ? String(l.agentId._id) : String(l.agentId||"");
            if (!currentAid) return;
            var active = (l.assignments||[]).find(function(a){
              var aid = a.agentId && a.agentId._id ? a.agentId._id : a.agentId;
              return String(aid||"")===currentAid;
            });
            if (!active) return;
            var cb = parseCb(active.callbackTime);
            if (!cb) return;
            if (cb<rangeStart || cb>periodEnd) return;
            if (!byAgent[currentAid]) {
              var aName = l.agentId && l.agentId.name ? l.agentId.name : (function(){var u=(p.users||[]).find(function(x){return String(x._id||gid(x))===currentAid;});return u?u.name:"Unknown";})();
              byAgent[currentAid] = {uid:currentAid,name:aName,total:0,doneOnTime:0,missed:0};
            }
            byAgent[currentAid].total++;
            var stillCallBack = active.status==="CallBack" || active.status==="Call Back";
            var isMissed = cb<nowMs && stillCallBack;
            if (isMissed) byAgent[currentAid].missed++;
            sumScheduled++;
            if (isMissed) sumMissed++;
          });
          // Daily Requests — DR has a single top-level agentId/callbackTime/status (no assignments array)
          (p.dailyReqs||[]).forEach(function(r){
            var cb = parseCb(r.callbackTime);
            if (!cb) return;
            if (cb<rangeStart || cb>periodEnd) return;
            var aid = r.agentId&&r.agentId._id?r.agentId._id:r.agentId;
            var auid = String(aid||"");
            if (!auid) return;
            if (!byAgent[auid]) {
              var aName = r.agentId&&r.agentId.name ? r.agentId.name : (function(){var u=(p.users||[]).find(function(x){return String(x._id||gid(x))===auid;});return u?u.name:"Unknown";})();
              byAgent[auid] = {uid:auid,name:aName,total:0,doneOnTime:0,missed:0};
            }
            byAgent[auid].total++;
            var drStillCallBack = r.status==="CallBack" || r.status==="Call Back";
            var drMissed = cb<nowMs && drStillCallBack;
            if (drMissed) byAgent[auid].missed++;
            sumScheduled++;
            if (drMissed) sumMissed++;
          });
          // Done on time = scheduled minus missed (covers future callbacks + past callbacks where status has moved on)
          Object.values(byAgent).forEach(function(x){ x.doneOnTime = x.total - x.missed; });
          var sumDoneOnTime = sumScheduled - sumMissed;
          var complianceRate = sumScheduled>0 ? Math.round(sumDoneOnTime/sumScheduled*100) : 0;
          var leaderboard = Object.values(byAgent).sort(function(a,b){ if (b.missed!==a.missed) return b.missed-a.missed; return b.total-a.total; });
          // Per-agent compliance rate = done on time / total scheduled (spec definition).
          leaderboard.forEach(function(x){ x.rate = x.total>0?Math.round(x.doneOnTime/x.total*100):100; });
          var rateColor = function(rate){ return rate>=80?"#10B981":rate>=60?"#F59E0B":"#DC2626"; };
          var initialsOfName = function(n){return (n||"?").split(" ").slice(0,2).map(function(x){return x[0];}).join("").toUpperCase();};
          var filterLabel = filter==="today" ? "Scheduled Today" : filter==="yesterday" ? "Scheduled Yesterday" : filter==="week" ? "Scheduled this Week" : filter==="month" ? "Scheduled this Month" : "Scheduled in Period";
          return <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div style={{background:"#EFF6FF",borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#1D4ED8"}}>{sumScheduled}</div><div style={{fontSize:10,fontWeight:600,color:"#3B82F6"}}>{filterLabel}</div></div>
              <div style={{background:"#F0FDF4",borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#15803D"}}>{complianceRate}%</div><div style={{fontSize:10,fontWeight:600,color:"#22C55E"}}>On Time</div></div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12,fontSize:11}}>
              <div style={{flex:1,padding:"6px 8px",background:"#F0FDF4",borderRadius:8,display:"flex",justifyContent:"space-between"}}><span style={{color:"#15803D"}}>Done on time</span><span style={{fontWeight:700,color:"#15803D"}}>{sumDoneOnTime}</span></div>
              <div style={{flex:1,padding:"6px 8px",background:"#FEF2F2",borderRadius:8,display:"flex",justifyContent:"space-between"}}><span style={{color:"#991B1B"}}>Missed</span><span style={{fontWeight:700,color:"#DC2626"}}>{sumMissed}</span></div>
            </div>
            <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Leaderboard — worst first</div>
            {leaderboard.length===0 ? <div style={{fontSize:12,color:"#94A3B8",padding:"10px 0",textAlign:"center"}}>No agents to show</div> : <div style={{maxHeight:220,overflowY:"auto",WebkitOverflowScrolling:"touch",marginRight:-6,paddingRight:6}}>
              {leaderboard.map(function(x,i){
                var avBg=["#DBEAFE","#DCFCE7","#FEF3C7","#EDE9FE","#FFE4E6"][i%5];
                var avC=["#1D4ED8","#166534","#92400E","#5B21B6","#9F1239"][i%5];
                var rc = rateColor(x.rate);
                var isWorst = i===0 && x.missed>0;
                return <div key={x.uid||i} onClick={function(){ if(p.setInitAgentFilter) p.setInitAgentFilter(x.uid); if(p.setFilter) p.setFilter("CallBack"); if(p.nav) p.nav("leads"); }} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<leaderboard.length-1?"1px solid #F8FAFC":"none",cursor:"pointer"}}>
                  <div style={{fontSize:11,color:"#888",width:16,textAlign:"center",fontWeight:600,flexShrink:0}}>{i+1}</div>
                  <div style={{width:28,height:28,borderRadius:"50%",background:avBg,color:avC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{initialsOfName(x.name)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{x.name}{isWorst?<span style={{marginLeft:6,fontSize:10,fontWeight:700,color:"#DC2626"}}>⚠ Highest risk</span>:null}</div>
                    <div style={{height:3,borderRadius:2,background:"#F1F5F9",marginTop:3}}><div style={{height:"100%",width:Math.min(100,x.rate)+"%",background:rc,borderRadius:2}}/></div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:rc}}>{x.rate}%</div>
                    <div style={{fontSize:10,color:"#94A3B8"}}>{x.doneOnTime}/{x.total} on time{x.missed>0?" · "+x.missed+" missed":""}</div>
                  </div>
                </div>;
              })}
            </div>}
          </>;
        })()}
      </>)}
      {/* Change 2 — Call Outcomes widget replaced with the same Rank Team
          widget the sales view uses. Admin mode hides the personal rank /
          score blocks; data feed (salesRanking) is already re-fetched when
          the global filter changes, so the ranking reflects the selected
          period. */}
      {rankWidget({ mode: "admin", rangeLabel: periodLabelForFilter(filter) })}
      {card(<>
        <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:12}}>Leads by Status</div>
        {(function(){
          // Count ONE status per lead (the current agent's assignment). Historical rotated-off assignments are ignored
          // so a single lead can never be counted under multiple statuses.
          var assignSc={};
          var assignTotal=0;
          var normalize = function(st){
            if (st==="Meeting Done") return "MeetingDone";
            if (st==="No Answer") return "NoAnswer";
            if (st==="Hot Case") return "HotCase";
            if (st==="Not Interested") return "NotInterested";
            if (st==="Call Back") return "CallBack";
            return st;
          };
          leads.forEach(function(l){
            var currentAid = l.agentId && l.agentId._id ? String(l.agentId._id) : String(l.agentId||"");
            var active = currentAid ? (l.assignments||[]).find(function(a){ var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId; return String(aid||"")===currentAid; }) : null;
            var at = 0, st = "";
            if (active) {
              at = active.assignedAt ? new Date(active.assignedAt).getTime() : (l.createdAt?new Date(l.createdAt).getTime():0);
              st = normalize(active.status || l.status || "NewLead");
            } else {
              at = l.createdAt ? new Date(l.createdAt).getTime() : 0;
              st = normalize(l.status||"NewLead");
            }
            if (at<rangeStart || at>rangeEnd) return;
            assignSc[st] = (assignSc[st]||0)+1;
            assignTotal++;
          });
          var denom = Math.max(1,assignTotal);
          var rows=[["New Lead","NewLead","#3B82F6"],["Potential","Potential","#10B981"],["Hot Case","HotCase","#F59E0B"],["Call Back","CallBack","#EF4444"],["Meeting","MeetingDone","#8B5CF6"],["Not Int.","NotInterested","#94A3B8"],["No Answer","NoAnswer","#CBD5E1"],["EOI","EOI","#0EA5E9"],["Done Deal","DoneDeal","#065F46"]];
          return rows.map(function(s){return bRow(s[0],assignSc[s[1]]||0,denom,s[2],function(){ if(p.setFilter) p.setFilter(s[1]); if(p.nav) p.nav("leads"); });});
        })()}
      </>)}
    </div>
    {seeAllOpen && <div onClick={function(){setSeeAllOpen(false);}} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,23,42,0.55)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px",overflowY:"auto"}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:"#fff",borderRadius:16,maxWidth:640,width:"100%",padding:"20px 22px",boxShadow:"0 10px 40px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:17,fontWeight:700,color:"#0F172A"}}>{activitiesTitleForFilter(filter)} ({todayActsAll.length})</div>
          <span style={{fontSize:13,fontWeight:600,color:"#64748B",cursor:"pointer",padding:"4px 10px"}} onClick={function(){setSeeAllOpen(false);}}>{"\u2715"} Close</span>
        </div>
        <div style={{maxHeight:"70vh",overflowY:"auto",paddingRight:4}}>
          {todayActsAll.length===0 ? <div style={{fontSize:13,color:"#94A3B8",padding:"20px 0",textAlign:"center"}}>No activity in {periodLabelForFilter(filter)}</div> : todayActsAll.map(function(a,i){
            var aid = a.userId&&a.userId._id?a.userId._id:a.userId;
            var aName = a.userId&&a.userId.name?a.userId.name:agentName(aid);
            var lName = resolveClientName(a);
            var srcTagM = activitySource(a);
            var aNote = a.note||a.notes||a.feedback||a.details||"";
            var actionLabel = actLabel(a);
            var feedbackText = aNote;
            if (a.type==="status_change") {
              var bracketM = aNote.match(/^\s*\[([^\]]+)\]\s*([\s\S]*)$/);
              var colonM = aNote.match(/^\s*Status\s*:\s*([^|]+?)(?:\s*\|\s*([\s\S]*))?$/i);
              var statusName = "", fb = "";
              if (bracketM) { statusName = bracketM[1].trim(); fb = (bracketM[2]||"").trim(); }
              else if (colonM) { statusName = colonM[1].trim(); fb = (colonM[2]||"").trim(); }
              else { statusName = "changed"; fb = aNote; }
              actionLabel = "Status: "+(statusName||"changed");
              feedbackText = fb;
            } else if (a.type==="call") { actionLabel = "Call initiated"; feedbackText = aNote.replace(/^\s*[\ud83d\udcde\ud83d\udcde]+\s*/,"").replace(/^Call initiated\s*[-\u2014:]?\s*/i,"").trim(); }
            else if (a.type==="note") { actionLabel = "Note added"; }
            else if (a.type==="reassign") { actionLabel = "Reassign"; feedbackText = ""; }
            else if (a.type==="meeting") { actionLabel = "Meeting booked"; }
            // Daily Request rows: show full feedback; Lead rows keep the 80-char cap.
            var isDrRowM = srcTagM === "DR";
            var feedbackTextDisplayM = feedbackText;
            if (!isDrRowM && feedbackTextDisplayM && feedbackTextDisplayM.length>80) feedbackTextDisplayM = feedbackTextDisplayM.slice(0,80)+"\u2026";
            var noteLc = aNote.toLowerCase();
            var ic;
            if (a.type==="call") ic={icon:"\ud83d\udcde",bg:"#DCFCE7",fg:"#166534"};
            else if (a.type==="meeting" || noteLc.indexOf("deal")>=0) ic={icon:"\ud83c\udfc6",bg:"#FEF3C7",fg:"#92400E"};
            else if (a.type==="status_change") ic={icon:"\u2197",bg:"#EDE9FE",fg:"#5B21B6"};
            else if (a.type==="note") ic={icon:"\ud83d\udcdd",bg:"#FFE4E6",fg:"#9F1239"};
            else if (noteLc.indexOf("callback")>=0) ic={icon:"\ud83d\udcc5",bg:"#DBEAFE",fg:"#1D4ED8"};
            else ic={icon:"\u2022",bg:"#F1F5F9",fg:"#64748B"};
            var actLeadIdM = activityLeadIdStr(a);
            // Same orphan-safe gate as the compact card above.
            var onActClickM = canOpenActivity(a) ? function(){ setSeeAllOpen(false); openActivity(a); } : null;
            var isArchivedRowM = isActivityArchived(a);
            var clientNameM = lName || "Unknown client";
            var subtitleStyleM = isDrRowM
              ? { fontSize:12, color:"#64748B", marginTop:2, wordBreak:"break-word", whiteSpace:"normal" }
              : { fontSize:12, color:"#64748B", marginTop:2 };
            return <div key={(a._id||"")+"-"+i} onClick={onActClickM} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:i<todayActsAll.length-1?"1px solid #F1F5F9":"none",cursor:onActClickM?"pointer":"default",opacity:isArchivedRowM?0.7:1}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:ic.bg,color:ic.fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0,marginTop:2}}>{ic.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>
                  <span style={{fontWeight:600,color:ic.fg}}>{actionLabel}</span> {"\u2014 "}{clientNameM}
                  {srcTagM&&<span style={{marginLeft:6,fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:4,background:"#DBEAFE",color:"#1D4ED8",verticalAlign:"middle"}} title="Daily Request">{srcTagM}</span>}
                </div>
                <div style={subtitleStyleM}>{aName}{feedbackTextDisplayM?<span> {"\u00b7"} <span style={{fontWeight:700,color:"#334155"}}>{feedbackTextDisplayM}</span></span>:null}</div>
              </div>
              <div style={{fontSize:11,color:"#94A3B8",flexShrink:0,fontWeight:600,marginTop:2}}>{exactTime(a.createdAt)}</div>
            </div>;
          })}
        </div>
      </div>
    </div>}
  </div>;
};


// ===== EOI PAGE =====
var EOIPage = function(p) {
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin";
  var [eoiTab,setEoiTab]=useState("approved");
  // Scope: anything that has an eoiStatus (Pending / Approved / Deal Cancelled)
  // OR is currently status=EOI (legacy rows without eoiStatus set yet).
  var wasEOI = function(l){return l.eoiDate || l.eoiImage || l.eoiApproved || (l.eoiDocuments||[]).length>0;};
  var eoiScope=p.leads.filter(function(l){return !l.archived && ((l.eoiStatus && l.eoiStatus.length>0) || l.status==="EOI" || (l.status==="Deal Cancelled" && wasEOI(l)));});
  var eoiPending = eoiScope.filter(function(l){ return l.eoiStatus ? l.eoiStatus==="Pending" : (l.status==="EOI" && !l.eoiApproved); });
  var eoiApprovedList = eoiScope.filter(function(l){ return l.eoiStatus ? l.eoiStatus==="Approved" : (l.status==="EOI" && l.eoiApproved); });
  var eoiCancelled = eoiScope.filter(function(l){ return l.eoiStatus==="EOI Cancelled" || l.eoiStatus==="Deal Cancelled" || l.status==="Deal Cancelled"; });
  var eoiLeads = eoiTab==="pending" ? eoiPending : eoiTab==="approved" ? eoiApprovedList : eoiCancelled;
  var getAg=function(l){if(!l.agentId)return"-";if(l.agentId.name)return l.agentId.name;var u=p.users.find(function(x){return gid(x)===l.agentId;});return u?u.name:"-";};
  var parseBudget=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var total=eoiLeads.reduce(function(s,d){return s+parseBudget(d.budget);},0);
  var [editLead,setEditLead]=useState(null);
  var [showAdd,setShowAdd]=useState(false);
  var [selectedEOI,setSelectedEOI]=useState(null);
  // Click-outside closes the EOI side panel (docked drawer).
  var eoiPanelRef = useOutsideClose(!!selectedEOI, function(){ setSelectedEOI(null); });
  var [imgUploading,setImgUploading]=useState(false);
  var [docUploading,setDocUploading]=useState(false);
  var [cancelling,setCancelling]=useState(false);
  var [convertingDeal,setConvertingDeal]=useState(false);
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});

  // Deep-link: open the side panel when a caller (e.g. the Deals & EOI notifications bell) navigated here with a lead.
  useEffect(function(){
    if (!p.initSelected) return;
    var target = (p.leads||[]).find(function(l){return gid(l)===gid(p.initSelected);}) || p.initSelected;
    setSelectedEOI(target);
    // Jump to whichever tab the row lives in
    var t1 = target.eoiStatus || "";
    if (t1==="Pending" || (target.status==="EOI" && !target.eoiApproved)) setEoiTab("pending");
    else if (t1==="EOI Cancelled" || t1==="Deal Cancelled" || target.status==="Deal Cancelled") setEoiTab("cancelled");
    else setEoiTab("approved");
    if (p.setInitSelected) p.setInitSelected(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[p.initSelected]);

  var archiveLead=async function(lid){
    if(!window.confirm(t.archiveConfirm))return;
    try{
      await apiFetch("/api/leads/"+lid+"/archive","PUT",null,p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===lid?Object.assign({},l,{archived:true}):l;});});
      if(selectedEOI&&gid(selectedEOI)===lid)setSelectedEOI(null);
    }catch(e){alert(e.message);}
  };

  var handleImageUpload=async function(e,lead,imageType){
    var file=e.target.files[0]; if(!file)return;
    setImgUploading(true);
    try{
      var resized=await new Promise(function(resolve){
        var reader=new FileReader();
        reader.onload=function(ev){
          var img=new Image();
          img.onload=function(){
            var canvas=document.createElement("canvas");
            var maxW=1200,maxH=1200;
            var w=img.width,h=img.height;
            if(w>maxW){h=h*(maxW/w);w=maxW;}
            if(h>maxH){w=w*(maxH/h);h=maxH;}
            canvas.width=w;canvas.height=h;
            canvas.getContext("2d").drawImage(img,0,0,w,h);
            resolve(canvas.toDataURL("image/jpeg",0.7));
          };
          img.src=ev.target.result;
        };
        reader.readAsDataURL(file);
      });
      var updated=await apiFetch("/api/leads/"+gid(lead)+"/upload-image","POST",{imageData:resized,imageType:imageType},p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(lead)?updated:l;});});
      if(selectedEOI&&gid(selectedEOI)===gid(lead))setSelectedEOI(updated);
    }catch(ex){alert("Upload failed");}
    setImgUploading(false);
  };

  var toggleApproved=async function(lead,field){
    try{
      var update={}; update[field]=!lead[field];
      var updated=await apiFetch("/api/leads/"+gid(lead),"PUT",update,p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(lead)?updated:l;});});
      if(selectedEOI&&gid(selectedEOI)===gid(lead))setSelectedEOI(updated);
    }catch(e){alert(e.message);}
  };

  var cancelEOI=async function(lead){
    if(p.cu.role!=="admin"&&p.cu.role!=="sales_admin") { alert("Only admin can cancel an EOI"); return; }
    if(!window.confirm("Cancel this EOI? The lead will return to Hot Case status and be rotated to another agent.")) return;
    setCancelling(true);
    try{
      // 1) Dedicated EOI-cancel endpoint restores status, sets eoiStatus="Deal Cancelled", syncs the DR mirror.
      var updated = await apiFetch("/api/leads/"+gid(lead)+"/eoi-cancel","POST",{},p.token);
      // 2) Auto-rotate via the ordered rotation list (backend skips previous agents).
      try {
        var rot = await apiFetch("/api/leads/"+gid(lead)+"/auto-rotate","POST",{reason:"manual"},p.token);
        if (rot && rot.lead) updated = rot.lead;
      } catch(rotErr){ /* status + eoiStatus already updated; rotation may be exhausted */ }
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(lead)?updated:l;});});
      if(selectedEOI&&gid(selectedEOI)===gid(lead)) setSelectedEOI(updated);
      // Switch to the Deal Cancelled tab so the admin sees where it went
      setEoiTab("cancelled");
    }catch(e){alert(e.message||"Cancel failed");}
    setCancelling(false);
  };

  var convertToDeal=async function(lead){
    if(p.cu.role!=="admin"&&p.cu.role!=="sales_admin"&&p.cu.role!=="sales") { alert("Only admin or sales can convert an EOI to a deal"); return; }
    if(lead.eoiStatus!=="Approved") { alert("EOI must be Approved before converting to a Done Deal"); return; }
    if(!window.confirm("Convert this EOI to a Done Deal? The lead will move to the Deals page.")) return;
    setConvertingDeal(true);
    var leadId = gid(lead);
    console.log("[convertToDeal] POST /api/leads/"+leadId+"/eoi-to-deal", { role: p.cu.role, eoiStatus: lead.eoiStatus, source: lead.source });
    try{
      var updated = await apiFetch("/api/leads/"+leadId+"/eoi-to-deal","POST",{},p.token);
      if (!updated || !updated._id) {
        console.error("[convertToDeal] empty response", updated);
        alert("Convert failed — empty response from server. Please refresh and try again.");
        setConvertingDeal(false);
        return;
      }
      console.log("[convertToDeal] ok", { status: updated.status, globalStatus: updated.globalStatus, eoiStatus: updated.eoiStatus });
      // Close the EOI side panel BEFORE touching p.leads. If bubbling from
      // the row click had already opened the detail panel, this ensures the
      // next render doesn't keep it open on a row that's about to disappear
      // from eoiScope.
      setSelectedEOI(null);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===leadId?updated:l;});});
      // Belt-and-suspenders refresh — make absolutely sure the Deals page sees
      // the new state even if an outer component holds a stale reference.
      try {
        var refreshed = await apiFetch("/api/leads?page=1&limit=1000","GET",null,p.token);
        if (refreshed && Array.isArray(refreshed.data)) p.setLeads(refreshed.data);
      } catch(refreshErr) { console.error("[convertToDeal] leads refresh failed (non-fatal)", refreshErr); }
      // Navigate to the Deals page so the freshly-converted deal is visible.
      if (p.nav) p.nav("deals");
    }catch(e){
      console.error("[convertToDeal] failed", e);
      alert("Convert failed: "+(e && e.message ? e.message : "Unknown error"));
    }
    setConvertingDeal(false);
  };

  var handleDocUpload=async function(e,lead){
    var file=e.target.files[0]; if(!file) return;
    if (file.size>6*1024*1024) { alert("File too large (max 6MB)"); return; }
    setDocUploading(true);
    try{
      var dataUrl = await new Promise(function(resolve,reject){
        var reader=new FileReader();
        reader.onload=function(ev){resolve(ev.target.result);};
        reader.onerror=function(){reject(new Error("Read failed"));};
        reader.readAsDataURL(file);
      });
      var updated=await apiFetch("/api/leads/"+gid(lead)+"/eoi-documents","POST",{fileData:dataUrl},p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(lead)?updated:l;});});
      if(selectedEOI&&gid(selectedEOI)===gid(lead)) setSelectedEOI(updated);
    }catch(ex){alert("Upload failed: "+(ex.message||ex));}
    setDocUploading(false);
    try{ e.target.value=""; }catch(er){}
  };

  var deleteDoc=async function(lead,index){
    if(!window.confirm("Remove this document?")) return;
    try{
      var updated=await apiFetch("/api/leads/"+gid(lead)+"/delete-eoi-document","POST",{index:index},p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(lead)?updated:l;});});
      if(selectedEOI&&gid(selectedEOI)===gid(lead)) setSelectedEOI(updated);
    }catch(e){alert(e.message||"Delete failed");}
  };

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>🎯 EOI ({eoiLeads.length})</h2>
        {total>0&&<div style={{ fontSize:13, fontWeight:700, color:"#9333EA", background:"#F3E8FF", padding:"5px 14px", borderRadius:20 }}>Total: {total.toLocaleString()} EGP</div>}
      </div>
      {(isAdmin||p.cu.role==="sales")&&<Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 14px", fontSize:12 }}><Plus size={13}/> Add EOI</Btn>}
    </div>
    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
      {[["approved","\u2705 Approved",eoiApprovedList.length,"#15803D","#DCFCE7"],["pending","\u23f3 Pending",eoiPending.length,"#B45309","#FEF3C7"],["cancelled","\u274c EOI Cancelled",eoiCancelled.length,"#B91C1C","#FEE2E2"]].map(function(tab){
        var active = eoiTab===tab[0];
        return <button key={tab[0]} onClick={function(){setSelectedEOI(null);setEoiTab(tab[0]);}} style={{ padding:"7px 14px", borderRadius:9, border:active?"1px solid "+tab[3]:"1px solid #E8ECF1", background:active?tab[4]:"#fff", color:active?tab[3]:C.textLight, fontSize:12, fontWeight:active?700:600, cursor:"pointer" }}>{tab[1]} ({tab[2]})</button>;
      })}
    </div>

    {showAdd&&<Modal show={true} onClose={function(){setShowAdd(false);}} title={"➕ Add EOI"}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={false}
        initialStatus="EOI"
        initial={{status:"EOI", source:"Facebook", name:"", phone:"", phone2:"", budget:"", project:"", notes:"", eoiDeposit:""}}
        onClose={function(){setShowAdd(false);}}
        onSave={function(added){p.setLeads(function(prev){var nid=String(added&&added._id||"");if(!nid)return[added].concat(prev);if(prev.some(function(l){return gid(l)===nid;}))return prev.map(function(l){return gid(l)===nid?added:l;});return [added].concat(prev);});setShowAdd(false);}}/>
    </Modal>}

    {editLead&&<Modal show={true} onClose={function(){setEditLead(null);}} title={t.edit}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={false}
        editId={gid(editLead)} initial={editLead}
        onClose={function(){setEditLead(null);}}
        onSave={function(updated){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(updated)?updated:l;});});setEditLead(null);if(selectedEOI&&gid(selectedEOI)===gid(updated))setSelectedEOI(updated);}}/>
    </Modal>}

    {eoiLeads.length===0&&<div style={{ textAlign:"center", padding:"60px 20px", color:C.textLight }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
      <div style={{ fontSize:16, fontWeight:700 }}>No EOI clients yet</div>
      <div style={{ fontSize:13, marginTop:8 }}>Clients with EOI status will appear here automatically</div>
    </div>}

    <div style={{ display:"flex", gap:16 }}>
    {eoiLeads.length>0&&<Card p={0} style={{ flex:1 }}>
    {p.isMobile?<div style={{ display:"flex", flexDirection:"column", gap:12, padding:12 }}>
      {eoiLeads.map(function(d){
        var bv=parseBudget(d.budget);
        var isSel=selectedEOI&&gid(selectedEOI)===gid(d);
        return <div key={gid(d)} onClick={function(){setSelectedEOI(isSel?null:d);}} style={{ background:isSel?"#F0FDF4":"#fff", borderRadius:14, padding:14, border:"2px solid "+(isSel?"#22C55E":"#E8ECF1"), cursor:"pointer" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <div style={{ fontSize:15, fontWeight:700 }}>{d.name}</div>
            {d.eoiApproved
              ?<span style={{ background:"#DCFCE7", color:"#15803D", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>✅</span>
              :<span style={{ background:"#FEF9C3", color:"#B45309", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>⏳</span>}
          </div>
          <div style={{ fontSize:12, color:C.textLight, marginBottom:4 }}>{d.phone}</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {d.project&&<span style={{ fontSize:11, color:"#6D28D9", background:"#EDE9FE", padding:"2px 8px", borderRadius:6 }}>🏠 {d.project}</span>}
            {bv>0&&<span style={{ fontSize:11, color:C.success, fontWeight:700 }}>💰 {bv.toLocaleString()}</span>}
            {d.eoiDeposit&&<span style={{ fontSize:11, color:C.textLight }}>Deposit: {d.eoiDeposit}</span>}
            {isAdmin&&<span style={{ fontSize:11, color:C.accent }}>👤 {getAg(d)}</span>}
          </div>
          {/* Convert to Deal — per-row action, visible to admin + sales.
              Internally sets status to the existing "DoneDeal" enum via
              convertToDeal (no new status value). The button MUST call both
              stopPropagation and preventDefault so the outer card's onClick
              (which opens the details panel) doesn't fire on the same click. */}
          {(p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="sales")&&<button onClick={function(e){e.stopPropagation();e.preventDefault();convertToDeal(d);}} onMouseDown={function(e){e.stopPropagation();}} onTouchStart={function(e){e.stopPropagation();}} disabled={convertingDeal} style={{ marginTop:10, width:"100%", padding:"8px 12px", borderRadius:9, border:"none", background:"#15803D", color:"#fff", fontSize:12, fontWeight:700, cursor:convertingDeal?"wait":"pointer", opacity:convertingDeal?0.6:1 }}>
            {convertingDeal?"Converting…":"✅ Convert to Deal"}
          </button>}
        </div>;
      })}
    </div>:<div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
      <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
        {[t.name,p.cu.role!=="sales_admin"?t.phone:null,t.project,"Unit Type",t.budget,"Deposit",isAdmin?t.agent:null,"EOI Date","Approved",""].filter(function(h){return h!==null;}).map(function(h,i){return <th key={i} style={{ textAlign:"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
      </tr></thead>
      <tbody>
        {eoiLeads.map(function(d){
          var bv=parseBudget(d.budget);
          var eoiDateStr=d.eoiDate?new Date(d.eoiDate).toLocaleDateString("en-GB"):d.updatedAt?new Date(d.updatedAt).toLocaleDateString("en-GB"):"-";
          var isSel=selectedEOI&&gid(selectedEOI)===gid(d);
          return <tr key={gid(d)} onClick={function(){setSelectedEOI(isSel?null:d);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSel?"#F0FDF4":"transparent" }}>
            <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600, textAlign:"left" }}>{d.name}</td>
            {p.cu.role!=="sales_admin"&&<td style={{ padding:"11px 12px", fontSize:12, direction:"ltr", textAlign:"left" }}>{d.phone}</td>}
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight, textAlign:"left" }}>{d.project||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight, textAlign:"left" }}>{d.unitType||d.notes||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:13, fontWeight:700, color:C.success, textAlign:"left" }}>{bv>0?bv.toLocaleString():d.budget||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight, textAlign:"left" }}>{d.eoiDeposit||"-"}</td>
            {isAdmin&&<td style={{ padding:"11px 12px", fontSize:12, textAlign:"left" }}>{getAg(d)}</td>}
            <td style={{ padding:"11px 12px", fontSize:11, color:C.textLight, textAlign:"left" }}>{eoiDateStr}</td>
            <td style={{ padding:"11px 12px", textAlign:"left" }}>
              {d.eoiApproved
                ?<span style={{ background:"#DCFCE7", color:"#15803D", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>✅ Approved</span>
                :<span style={{ background:"#FEF9C3", color:"#B45309", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>⏳ Pending</span>}
            </td>
            <td style={{ padding:"8px 12px" }} onClick={function(e){e.stopPropagation();}}>
              <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                {/* Convert to Deal — per-row action, visible to admin + sales.
                    Sets status to the existing "DoneDeal" enum via convertToDeal.
                    stopPropagation on the button itself is belt-and-suspenders
                    alongside the td's stopPropagation — keeps the row's
                    detail-panel onClick from firing on the same click. */}
                {(p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="sales")&&<button onClick={function(e){e.stopPropagation();e.preventDefault();convertToDeal(d);}} onMouseDown={function(e){e.stopPropagation();}} disabled={convertingDeal} title="Convert to Deal" style={{ padding:"6px 10px", borderRadius:6, border:"none", background:"#15803D", color:"#fff", fontSize:11, fontWeight:700, cursor:convertingDeal?"wait":"pointer", opacity:convertingDeal?0.6:1, whiteSpace:"nowrap" }}>
                  {convertingDeal?"…":"Convert to Deal"}
                </button>}
                {isAdmin&&<button onClick={function(){setEditLead(d);}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Edit size={13} color={C.info}/></button>}
                {isAdmin&&<button onClick={function(){archiveLead(gid(d));}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Archive size={13} color={C.warning}/></button>}
              </div>
            </td>
          </tr>;
        })}
      </tbody>
    </table></div>}
    </Card>}

    {/* EOI Side Panel */}
    {selectedEOI&&<div ref={eoiPanelRef} style={ p.isMobile?{ position:"fixed", inset:0, zIndex:300, background:"#fff", overflowY:"auto" }:{ flex:"0 0 260px", background:"#fff", borderRadius:14, border:"1px solid #E8ECF1", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden", maxHeight:"80vh", overflowY:"auto" }}>
      <div style={{ background:"linear-gradient(135deg,#9333EA,#7C3AED)", padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <button onClick={function(){setSelectedEOI(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><X size={11}/></button>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
            {(function(){
              var isCancelled = selectedEOI.eoiStatus==="EOI Cancelled" || selectedEOI.eoiStatus==="Deal Cancelled" || selectedEOI.status==="Deal Cancelled";
              if (isCancelled) return <span style={{ background:"rgba(239,68,68,0.3)", borderRadius:8, padding:"4px 10px", color:"#fff", fontSize:11, fontWeight:700 }}>❌ EOI Cancelled</span>;
              var isDoneDeal = selectedEOI.status==="DoneDeal";
              return <>
                {(p.cu.role==="admin"||p.cu.role==="sales_admin")&&<div style={{ display:"flex", gap:6 }}>
                  <button onClick={function(){if(!isDoneDeal) toggleApproved(selectedEOI,"eoiApproved");}} disabled={isDoneDeal} style={{ background:selectedEOI.eoiApproved?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"4px 10px", cursor:isDoneDeal?"default":"pointer", color:"#fff", fontSize:11, fontWeight:700, opacity:isDoneDeal?0.7:1 }}>
                    {selectedEOI.eoiApproved?"✅ Approved":"⏳ Approve"}
                  </button>
                  {!isDoneDeal&&<button disabled={cancelling} onClick={function(){cancelEOI(selectedEOI);}} style={{ background:"rgba(239,68,68,0.25)", border:"none", borderRadius:8, padding:"4px 10px", cursor:cancelling?"wait":"pointer", color:"#fff", fontSize:11, fontWeight:700, opacity:cancelling?0.6:1 }}>
                    {cancelling?"Cancelling…":"❌ Cancel"}
                  </button>}
                </div>}
                <button disabled={convertingDeal} onClick={function(){convertToDeal(selectedEOI);}} style={{ background:"#15803D", border:"none", borderRadius:8, padding:"5px 12px", cursor:convertingDeal?"wait":"pointer", color:"#fff", fontSize:11, fontWeight:700, opacity:convertingDeal?0.6:1, boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}>
                  {convertingDeal?"Converting…":"✅ Done Deal"}
                </button>
              </>;
            })()}
          </div>
        </div>
        <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{selectedEOI.name}</div>
        <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginTop:2 }}>{selectedEOI.phone}</div>
      </div>
      <div style={{ padding:"12px 14px" }}>
        {[
          {l:"Project",v:selectedEOI.project||"-",icon:"🏠"},
          {l:"Budget",v:selectedEOI.budget?selectedEOI.budget+" EGP":"-",icon:"💰"},
          {l:"Deposit",v:selectedEOI.eoiDeposit||"-",icon:"💵"},
          {l:"Agent",v:getAg(selectedEOI),icon:"👤"},
          {l:"Notes",v:selectedEOI.notes||"-",icon:"📝"},
        ].map(function(f){return <div key={f.l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F1F5F9", gap:8 }}>
          <span style={{ fontSize:11, color:C.textLight }}>{f.icon} {f.l}</span>
          <span style={{ fontSize:11, fontWeight:500, textAlign:"right" }}>{f.v}</span>
        </div>;})}
        
        {/* EOI Image */}
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:6 }}>📎 EOI Image</div>
          {selectedEOI.eoiImage
            ?<div>
              <img src={selectedEOI.eoiImage} onClick={function(){var w=window.open();w.document.write("<img src='"+selectedEOI.eoiImage+"' style='max-width:100%;'>");}} style={{ width:"100%", borderRadius:8, marginBottom:6, cursor:"zoom-in" }} alt="EOI" title="Click to view full size"/>
              <label style={{ display:"block", padding:"6px", borderRadius:8, border:"1px dashed "+C.accent, background:C.accent+"08", color:C.accent, fontSize:11, fontWeight:600, cursor:"pointer", textAlign:"center" }}>
                🔄 Replace Image
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={function(e){handleImageUpload(e,selectedEOI,"eoi");}}/>
              </label>
            </div>
            :<label style={{ display:"block", padding:"10px", borderRadius:8, border:"1px dashed "+C.accent, background:C.accent+"08", color:C.accent, fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"center" }}>
              {imgUploading?"Uploading...":"📤 Upload EOI Image"}
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={function(e){handleImageUpload(e,selectedEOI,"eoi");}}/>
            </label>}
        </div>

        {/* EOI Documents (images + PDFs) */}
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:6 }}>📄 EOI Documents ({(selectedEOI.eoiDocuments||[]).length})</div>
          {(selectedEOI.eoiDocuments||[]).length>0&&<div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:6, marginBottom:8 }}>
            {(selectedEOI.eoiDocuments||[]).map(function(doc,idx){
              var url = typeof doc==="string" ? doc : (doc && doc.url) || "";
              var name = typeof doc==="object" && doc && doc.name ? doc.name : ("Document "+(idx+1));
              var isPdf = typeof url==="string" && url.indexOf("application/pdf")>=0;
              return <div key={idx} style={{ position:"relative", border:"1px solid #E2E8F0", borderRadius:8, overflow:"hidden", background:"#F8FAFC", aspectRatio:"1/1" }} title={name}>
                {isPdf
                  ? <a href={url} target="_blank" rel="noreferrer" download={name} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", textDecoration:"none", color:"#DC2626", fontSize:10, fontWeight:700, padding:4, textAlign:"center" }}><span style={{ fontSize:22 }}>📕</span><span style={{ maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</span></a>
                  : <img src={url} alt={name} onClick={function(){var w=window.open();w.document.write("<img src='"+url+"' style='max-width:100%;'>");}} style={{ width:"100%", height:"100%", objectFit:"cover", cursor:"zoom-in" }}/>}
                {isOnlyAdmin&&<button onClick={function(){deleteDoc(selectedEOI,idx);}} title="Remove" style={{ position:"absolute", top:2, right:2, width:18, height:18, borderRadius:"50%", border:"none", background:"rgba(220,38,38,0.9)", color:"#fff", fontSize:10, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>×</button>}
              </div>;
            })}
          </div>}
          <label style={{ display:"block", padding:"8px", borderRadius:8, border:"1px dashed "+C.accent, background:C.accent+"08", color:C.accent, fontSize:11, fontWeight:600, cursor:"pointer", textAlign:"center" }}>
            {docUploading?"Uploading…":"📎 Upload EOI Document (image or PDF)"}
            <input type="file" accept="image/*,application/pdf" style={{ display:"none" }} onChange={function(e){handleDocUpload(e,selectedEOI);}}/>
          </label>
        </div>
      </div>
    </div>}
    </div>
  </div>;
};

// ===== DEALS =====

// ===== COMMISSION SYSTEM =====
// Project weight settings stored in localStorage: crm_proj_weight_{projectName} = 0.5 or 1
var getEffectiveQTarget = function(user, allUsers, forQ) {
  var uid = String(typeof user === "string" ? user : gid(user));
  var userObj = typeof user === "object" ? user : (allUsers||[]).find(function(u){return String(gid(u))===uid;}) || {};
  var curQ = forQ || (function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();

  if((userObj.role === "manager"||userObj.role === "team_leader") && allUsers) {
    // Find team members by reportsTo (primary) or teamId (fallback)
    var teamMembers = allUsers.filter(function(u){
      if(u.role !== "sales") return false;
      // Check reportsTo
      var rt = u.reportsTo && u.reportsTo._id ? String(u.reportsTo._id) :
               u.reportsTo ? String(u.reportsTo) : "";
      if(rt === uid) return true;
      // Check teamId match (if both have same non-empty teamId)
      if(userObj.teamId && u.teamId && userObj.teamId === u.teamId) return true;
      return false;
    });

    if(teamMembers.length > 0) {
      var total = teamMembers.reduce(function(sum, u){
        var qt = (u.qTargets&&Object.keys(u.qTargets).length>0) ? u.qTargets :
          (function(){try{return JSON.parse(localStorage.getItem("crm_qt_"+gid(u))||"{}");}catch(e){return {};}})();
        return sum + (qt[curQ]||0);
      }, 0);
      if(total > 0) return total;
    }
  }

  // Own qTargets
  var qt = (userObj.qTargets&&Object.keys(userObj.qTargets).length>0) ? userObj.qTargets :
    (function(){try{return JSON.parse(localStorage.getItem("crm_qt_"+uid)||"{}");}catch(e){return {};}})();
  return qt[curQ]||0;
};

// Phase 2 Slice 3 — projectWeights are now sourced from the AppSetting doc
// (server-side, single source of truth). Module cache is hydrated on App
// mount via fetchProjectWeights() and refreshed after saveProjectWeight().
// localStorage stays as a fallback for the brief window between mount and
// first fetch resolve — same values post-migration, so no behavioral drift.
var _projWeightsMap = null;
var getProjectWeight = function(project, lead){
  // 1) Lead-level cache (set by server cascade in Slice 1's PUT handler)
  if (lead && lead.projectWeight && lead.projectWeight !== 1) return lead.projectWeight;
  // 2) App-level module cache (hydrated from the AppSetting doc)
  if (_projWeightsMap && project && (project in _projWeightsMap)) return _projWeightsMap[project];
  // 3) Legacy localStorage fallback — only relevant pre-fetch-resolve
  try{ var w=localStorage.getItem("crm_proj_weight_"+(project||"").replace(/\s/g,"_")); return w?parseFloat(w):1; }catch(e){return 1;}
};
// Server PUT is full-replace, so merge the change into the current cache
// before sending. Server cascades projectWeight onto every matching Lead
// doc — the caller is responsible for mirroring that into local p.leads
// and for bumping the App-level rev counter so renders pick it up.
var saveProjectWeight = async function(project, weight, token){
  if (!project) return _projWeightsMap || {};
  var newMap = Object.assign({}, _projWeightsMap || {});
  if (weight === 1) delete newMap[project]; // 1 is the default — server drops it from storage
  else newMap[project] = weight;
  var res = await apiFetch("/api/settings/project-weights", "PUT", newMap, token);
  _projWeightsMap = (res && typeof res === "object") ? res : newMap;
  return _projWeightsMap;
};
// Hydrate the module cache from the AppSetting doc. Called on App mount
// (and again on token change). On error leaves the cache as-is so the
// localStorage fallback in getProjectWeight keeps working.
var fetchProjectWeights = async function(token){
  try {
    var d = await apiFetch("/api/settings/project-weights", "GET", null, token);
    _projWeightsMap = (d && typeof d === "object") ? d : {};
  } catch (e) { /* leave cache as-is */ }
  return _projWeightsMap;
};
// Deal split stored in localStorage: crm_deal_split_{leadId} = {agent2Id, agent2Name}
var getDealSplit = function(lid, leads){
  // Try from leads array first (server data)
  if(leads){
    var l=leads.find(function(x){return String(x._id||x)===String(lid);});
    if(l&&l.splitAgent2Id) return {agent2Id:String(l.splitAgent2Id._id||l.splitAgent2Id),agent2Name:l.splitAgent2Name||"Shared"};
  }
  try{return JSON.parse(localStorage.getItem("crm_deal_split_"+lid)||"null");}catch(e){return null;}
};
// Helper to get split directly from deal object
var getDealSplitFromObj = function(d){
  if(d&&d.splitAgent2Id) return {agent2Id:String(d.splitAgent2Id._id||d.splitAgent2Id),agent2Name:d.splitAgent2Name||"Shared"};
  try{return JSON.parse(localStorage.getItem("crm_deal_split_"+(d._id||d))||"null");}catch(e){return null;}
};
var saveDealSplit = function(lid,split){ try{localStorage.setItem("crm_deal_split_"+lid,JSON.stringify(split));}catch(e){}};
var getDealExtra = function(lid){ try{return JSON.parse(localStorage.getItem("crm_deal_extra_"+lid)||"null");}catch(e){return null;}};
var saveDealExtra = function(lid,extra){ try{localStorage.setItem("crm_deal_extra_"+lid,JSON.stringify(extra));}catch(e){}};
// Get the effective date for a deal — checks custom dealDate first
var getDealDate = function(d){
  try{
    // Read from lead object first (server data)
    if(d&&d.dealDate) return new Date(d.dealDate);
    // Fallback to localStorage
    var extra=getDealExtra(String(d._id||""));
    if(extra&&extra.dealDate) return new Date(extra.dealDate);
  }catch(e){}
  if(d.eoiDate) return new Date(d.eoiDate);
  if(d.updatedAt) return new Date(d.updatedAt);
  return new Date(d.createdAt||0);
};

// Calculate commission for a user based on their deals
var calcCommission = function(user, allDeals, allUsers, forQ) {
  var uid = typeof user === "string" ? user : gid(user);
  var uRole = typeof user === "object" ? user.role : (allUsers.find(function(u){return gid(u)===uid;})||{}).role;
  var parseBudgetC = function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};

  // Get Q targets
  var qtUser = allUsers ? allUsers.find(function(u){return gid(u)===uid;}) : null;
  var qt = (qtUser&&qtUser.qTargets&&Object.keys(qtUser.qTargets).length>0) ? qtUser.qTargets : (function(){try{return JSON.parse(localStorage.getItem("crm_qt_"+uid)||"{}");}catch(e){return {};}})();
  var getQ = function(date){var m=new Date(date).getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";};
  var curQ = forQ || (function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
  // For team leader: use sum of team targets
  var qTarget = (qtUser && (qtUser.role === "manager"||qtUser.role === "team_leader") && qtUser.reportsTo && allUsers)
    ? getEffectiveQTarget(qtUser, allUsers, curQ)
    : (qt[curQ] || 0);

  // Get deals for this agent in current Q
  var agentDeals = allDeals.filter(function(d){
    var aid = d.agentId&&d.agentId._id?d.agentId._id:d.agentId;
    if(aid !== uid) return false;
    var dd = d.updatedAt||d.createdAt;
    return dd && getQ(dd) === curQ;
  });

  // Calculate effective revenue (applying project weight and split)
  var effectiveRevenue = agentDeals.reduce(function(sum, d){
    var raw = parseBudgetC(d.budget);
    var weight = getProjectWeight(d.project, d);
    var split = getDealSplit(gid(d), allDeals);
    var splitFactor = split ? 0.5 : 1;
    return sum + (raw * weight * splitFactor);
  }, 0);

  // Also add deals where this agent is agent2 in a split
  allDeals.forEach(function(d){
    var split = getDealSplit(gid(d), allDeals);
    if(split && split.agent2Id === uid){
      var dd = d.updatedAt||d.createdAt;
      if(dd && getQ(dd) === curQ){
        var raw = parseBudgetC(d.budget);
        var weight = getProjectWeight(d.project);
        effectiveRevenue += raw * weight * 0.5;
      }
    }
  });

  // Determine commission rate based on role and target achievement
  var commRate = 0;
  if(uRole === "manager"){
    commRate = 2000; // 2,000 per million always
  } else {
    // Sales: depends on target multiplier
    if(qTarget > 0){
      var multiplier = effectiveRevenue / qTarget;
      if(multiplier >= 3) commRate = 7000;
      else if(multiplier >= 2) commRate = 6000;
      else commRate = 5000;
    } else {
      commRate = 5000; // default if no target set
    }
  }

  var commission = (effectiveRevenue / 1000000) * commRate;
  return { effectiveRevenue, commission, commRate, qTarget, curQ };
};

var DealsPage = function(p) {
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin";
  var [dealTab,setDealTab]=useState("active"); // "active" | "cancelled"
  var [dealCancelling,setDealCancelling]=useState(false);
  // Include every record that the rest of the CRM already treats as a deal:
  // newly-converted EOIs have status="DoneDeal", but older records may carry
  // only globalStatus="donedeal" (or vice-versa) depending on which path
  // stamped them. Mirroring the admin dashboard's rule here ensures existing
  // EOI records with Done Deal status show up alongside new ones.
  var activeDeals=p.leads.filter(function(l){return (l.status==="DoneDeal"||l.globalStatus==="donedeal")&&!l.archived&&!(l.dealStatus==="Deal Cancelled"||l.status==="Deal Cancelled");}).slice().sort(function(a,b){return new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0);});
  var cancelledDeals=p.leads.filter(function(l){return (l.dealStatus==="Deal Cancelled" || l.status==="Deal Cancelled") && !l.archived && !(l.eoiStatus==="EOI Cancelled");}).slice().sort(function(a,b){return new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0);});
  var deals = dealTab==="cancelled" ? cancelledDeals : activeDeals;
  var getAg=function(l){if(!l.agentId)return"-";if(l.agentId.name)return l.agentId.name;var u=p.users.find(function(x){return gid(x)===l.agentId;});return u?u.name:"-";};
  var parseBudget=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  // Admin / Sales Admin: full top-line budget per deal — no project weight
  // and no split halving. This is the gross deal volume the company booked.
  // All other roles keep the share-based view (their slice of revenue).
  var total=deals.reduce(function(s,d){
    if(isOnlyAdmin) return s+parseBudget(d.budget);
    var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);
    return s+parseBudget(d.budget)*w*(sp?0.5:1);
  },0);
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
  var [showAdd,setShowAdd]=useState(false);
  var [editDeal,setEditDeal]=useState(null);
  var [selectedDeal,setSelectedDeal]=useState(null);
  // Click-outside closes the Deal side panel (docked drawer).
  var dealPanelRef = useOutsideClose(!!selectedDeal, function(){ setSelectedDeal(null); });
  // Deep-link: open the side panel when navigated here with a lead (e.g. from the Deals & EOI notifications bell).
  useEffect(function(){
    if (!p.initSelected) return;
    var target = (p.leads||[]).find(function(l){return gid(l)===gid(p.initSelected);}) || p.initSelected;
    setSelectedDeal(target);
    var isCancelled = target.dealStatus==="Deal Cancelled" || target.status==="Deal Cancelled";
    setDealTab(isCancelled ? "cancelled" : "active");
    if (p.setInitSelected) p.setInitSelected(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[p.initSelected]);
  var [stagesModal,setStagesModal]=useState(null);
  var [splitModal,setSplitModal]=useState(null); // lead for split
  var [splitAgent2,setSplitAgent2]=useState("");
  var [commModal,setCommModal]=useState(false); // show commission summary
  var [commQ,setCommQ]=useState((function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})());
  var [projWeightModal,setProjWeightModal]=useState(false);
  var [projWeights,setProjWeights]=useState(function(){
    var w={};deals.forEach(function(d){if(d.project)w[d.project]=getProjectWeight(d.project);});return w;
  });
  var [dateFrom,setDateFrom]=useState(""); var [dateTo,setDateTo]=useState(""); var [dealSearch,setDealSearch]=useState(""); var [dealAgent,setDealAgent]=useState("");
  var curYear=new Date().getFullYear(); var curQ=(function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
  var dealYears=[curYear,curYear-1,curYear-2,curYear-3];
  var [dealQ,setDealQ]=useState(curQ); var [dealYear,setDealYear]=useState(curYear);
  var filteredDeals=deals.filter(function(d){
    if(dealQ!=="all"){var dd=getDealDate(d);if(!dd)return false;var m=new Date(dd).getMonth();var q=m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";if(q!==dealQ)return false;}
    if(dealQ!=="all"&&new Date(getDealDate(d)||0).getFullYear()!==dealYear) return false;
    if(dateFrom&&new Date(d.updatedAt||d.createdAt)<new Date(dateFrom)) return false;
    if(dateTo&&new Date(d.updatedAt||d.createdAt)>new Date(dateTo+"T23:59:59")) return false;
    if(dealSearch){var q2=dealSearch.toLowerCase();var nm=d.name?d.name.toLowerCase():"";var pr=d.project?d.project.toLowerCase():"";var ph=d.phone||"";if(!nm.includes(q2)&&!pr.includes(q2)&&!ph.includes(q2))return false;}
    if(dealAgent){var aid=d.agentId&&d.agentId._id?d.agentId._id:d.agentId;if(aid!==dealAgent)return false;}
    return true;
  });
  var filteredTotal=filteredDeals.reduce(function(s,d){
    if(isOnlyAdmin) return s+parseBudget(d.budget);
    var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);
    return s+parseBudget(d.budget)*w*(sp?0.5:1);
  },0);

  // Get stages from the lead document (server-side, shared across admins). Falls back to legacy localStorage if the lead doesn't have one yet.
  var getStages=function(lid){
    var lead = (p.leads||[]).find(function(l){return gid(l)===lid;});
    if (lead && lead.stages && typeof lead.stages==="object" && Object.keys(lead.stages).length>0) return lead.stages;
    try{return JSON.parse(localStorage.getItem("crm_stages_"+lid)||"{}");}catch(e){return {};}
  };
  var saveStages=async function(lid,stages){
    try{localStorage.setItem("crm_stages_"+lid,JSON.stringify(stages));}catch(e){}
    try{
      var updated=await apiFetch("/api/leads/"+lid,"PUT",{stages:stages},p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===lid?updated:l;});});
    }catch(e){ /* keep local copy on failure */ }
  };
  var [stagesForm,setStagesForm]=useState({contract:false,contractDate:"",payment1:false,payment1Date:"",payment1Amount:"",payment2:false,payment2Date:"",payment2Amount:""});

  var archiveDeal=async function(lid){
    if(!window.confirm("Archive this deal?"))return;
    try{
      await apiFetch("/api/leads/"+lid+"/archive","PUT",null,p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===lid?Object.assign({},l,{archived:true}):l;});});
    }catch(e){alert(e.message);}
  };

  var openStages=function(d){
    var s=getStages(gid(d));
    setStagesForm({
      contract:s.contract||false, contractDate:s.contractDate||"",
      payment1:s.payment1||false, payment1Date:s.payment1Date||"", payment1Amount:s.payment1Amount||"",
      payment2:s.payment2||false, payment2Date:s.payment2Date||"", payment2Amount:s.payment2Amount||""
    });
    setStagesModal(d);
  };

  var stagesProgress=function(lid){
    var s=getStages(lid);
    var done=[s.contract,s.payment1,s.payment2].filter(Boolean).length;
    return done;
  };

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{t.deals} ({filteredDeals.length})</h2>
        {filteredTotal>0&&<div style={{ fontSize:13, fontWeight:700, color:C.success, background:"#DCFCE7", padding:"5px 14px", borderRadius:20 }}>Total: {filteredTotal.toLocaleString()} EGP</div>}
      </div>
      {(isOnlyAdmin||p.cu.role==="team_leader")&&<Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><Plus size={14}/> Add Deal</Btn>}
    </div>

    {/* Deals tab bar: Active vs Deal Cancelled */}
    <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
      {[["active","\ud83d\udcbc Active",activeDeals.length,C.success,"#DCFCE7"],["cancelled","\u274c Deal Cancelled",cancelledDeals.length,"#B91C1C","#FEE2E2"]].map(function(tab){
        var active=dealTab===tab[0];
        return <button key={tab[0]} onClick={function(){setSelectedDeal(null);setDealTab(tab[0]);}} style={{ padding:"7px 14px", borderRadius:9, border:active?"1px solid "+tab[3]:"1px solid #E8ECF1", background:active?tab[4]:"#fff", color:active?tab[3]:C.textLight, fontSize:12, fontWeight:active?700:600, cursor:"pointer" }}>{tab[1]} ({tab[2]})</button>;
      })}
    </div>

    {/* Deals Search + Filter bar */}
    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10, flexWrap:"wrap" }}>
      <div style={{ display:"flex", gap:5 }}>
        {["all","Q1","Q2","Q3","Q4"].map(function(q){return <button key={q} onClick={function(){setDealQ(q);}}
          style={{ padding:"5px 12px", borderRadius:8, border:"1px solid", borderColor:dealQ===q?C.accent:"#E2E8F0",
            background:dealQ===q?C.accent+"12":"#fff", color:dealQ===q?C.accent:C.textLight,
            fontSize:12, fontWeight:600, cursor:"pointer" }}>{q==="all"?"All":q}{q===curQ&&dealYear===curYear&&q!=="all"?" 🔵":""}</button>;})}
      </div>
      <select value={dealYear} onChange={function(e){setDealYear(Number(e.target.value));}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
        {dealYears.map(function(y){return <option key={y} value={y}>{y}</option>;})}
      </select>
    </div>
    <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
      <input placeholder="🔍 Search by name, project or phone..." value={dealSearch} onChange={function(e){setDealSearch(e.target.value);}} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, minWidth:220 }}/>
      {isAdmin&&<select value={dealAgent} onChange={function(e){setDealAgent(e.target.value);}} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
        <option value="">👤 All Agents</option>
        {salesUsers.map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name}</option>;})}
      </select>}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:12, color:C.textLight, fontWeight:600 }}>📅 From:</span>
        <input type="date" value={dateFrom} onChange={function(e){setDateFrom(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12 }}/>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:12, color:C.textLight, fontWeight:600 }}>To:</span>
        <input type="date" value={dateTo} onChange={function(e){setDateTo(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12 }}/>
      </div>
      {(dateFrom||dateTo||dealSearch||dealAgent)&&<button onClick={function(){setDateFrom("");setDateTo("");setDealSearch("");setDealAgent("");}} style={{ padding:"5px 12px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", fontSize:12, cursor:"pointer", color:C.danger }}>✕ Clear All</button>}
    </div>
    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={t.addLead+" (Done Deal)"}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={false} initialStatus="DoneDeal"
        initial={{name:"",phone:"",phone2:"",email:"",budget:"",project:"",source:"Referral",agentId:"",callbackTime:"",notes:"",status:"DoneDeal"}}
        onClose={function(){setShowAdd(false);}}
        onSave={function(lead){p.setLeads(function(prev){var nid=String(lead&&lead._id||"");if(!nid)return[lead].concat(prev);if(prev.some(function(l){return gid(l)===nid;}))return prev.map(function(l){return gid(l)===nid?lead:l;});return [lead].concat(prev);});setShowAdd(false);}}/>
    </Modal>

    {editDeal&&<Modal show={true} onClose={function(){setEditDeal(null);}} title={t.edit}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={false}
        editId={gid(editDeal)} initial={editDeal}
        onClose={function(){setEditDeal(null);}}
        onSave={function(updated){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(updated)?updated:l;});});setEditDeal(null);}}/>
    </Modal>}

    {/* Stages Modal */}
    {stagesModal&&<Modal show={true} onClose={function(){setStagesModal(null);}} title={"📋 Deal Stages — "+stagesModal.name}>
      <div style={{ marginBottom:14, padding:"10px 14px", background:"#DCFCE7", borderRadius:10, fontSize:12, color:"#15803D", fontWeight:600 }}>
        {stagesProgress(gid(stagesModal))}/3 stages completed
        <div style={{ height:6, background:"#BBF7D0", borderRadius:3, marginTop:6 }}>
          <div style={{ height:"100%", width:(stagesProgress(gid(stagesModal))/3*100)+"%", background:C.success, borderRadius:3, transition:"width 0.4s" }}/>
        </div>
      </div>

      {/* Contract */}
      <div style={{ marginBottom:14, padding:"12px 14px", background:"#F8FAFC", borderRadius:10, border:"1px solid "+(!stagesForm.contract?"#E2E8F0":C.success) }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:stagesForm.contract?8:0 }}>
          <div onClick={function(){setStagesForm(function(f){return Object.assign({},f,{contract:!f.contract});});}}
            style={{ width:22, height:22, borderRadius:6, border:"2px solid", borderColor:stagesForm.contract?C.success:"#CBD5E1", background:stagesForm.contract?C.success:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            {stagesForm.contract&&<span style={{ color:"#fff", fontSize:13, fontWeight:700 }}>✓</span>}
          </div>
          <span style={{ fontSize:13, fontWeight:600 }}>📝 Contract Signed</span>
        </div>
        {stagesForm.contract&&<div style={{ marginTop:8 }}>
          <label style={{ fontSize:11, color:C.textLight, display:"block", marginBottom:4 }}>Signing Date</label>
          <input type="date" value={stagesForm.contractDate} onChange={function(e){setStagesForm(function(f){return Object.assign({},f,{contractDate:e.target.value});});}}
            style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box" }}/>
        </div>}
      </div>

      {/* Payment 1 */}
      <div style={{ marginBottom:14, padding:"12px 14px", background:"#F8FAFC", borderRadius:10, border:"1px solid "+(!stagesForm.payment1?"#E2E8F0":C.success) }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:stagesForm.payment1?8:0 }}>
          <div onClick={function(){setStagesForm(function(f){return Object.assign({},f,{payment1:!f.payment1});});}}
            style={{ width:22, height:22, borderRadius:6, border:"2px solid", borderColor:stagesForm.payment1?C.success:"#CBD5E1", background:stagesForm.payment1?C.success:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            {stagesForm.payment1&&<span style={{ color:"#fff", fontSize:13, fontWeight:700 }}>✓</span>}
          </div>
          <span style={{ fontSize:13, fontWeight:600 }}>💰 1st Payment</span>
        </div>
        {stagesForm.payment1&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 10px", marginTop:8 }}>
          <div>
            <label style={{ fontSize:11, color:C.textLight, display:"block", marginBottom:4 }}>Date</label>
            <input type="date" value={stagesForm.payment1Date} onChange={function(e){setStagesForm(function(f){return Object.assign({},f,{payment1Date:e.target.value});});}}
              style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box" }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.textLight, display:"block", marginBottom:4 }}>Amount (EGP)</label>
            <input type="text" placeholder="" value={stagesForm.payment1Amount}
              onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setStagesForm(function(f){return Object.assign({},f,{payment1Amount:r?Number(r).toLocaleString():""});});}}
              style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box", direction:"ltr" }}/>
          </div>
        </div>}
      </div>

      {/* Payment 2 */}
      <div style={{ marginBottom:16, padding:"12px 14px", background:"#F8FAFC", borderRadius:10, border:"1px solid "+(!stagesForm.payment2?"#E2E8F0":C.success) }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:stagesForm.payment2?8:0 }}>
          <div onClick={function(){setStagesForm(function(f){return Object.assign({},f,{payment2:!f.payment2});});}}
            style={{ width:22, height:22, borderRadius:6, border:"2px solid", borderColor:stagesForm.payment2?C.success:"#CBD5E1", background:stagesForm.payment2?C.success:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            {stagesForm.payment2&&<span style={{ color:"#fff", fontSize:13, fontWeight:700 }}>✓</span>}
          </div>
          <span style={{ fontSize:13, fontWeight:600 }}>💰 2nd Payment</span>
        </div>
        {stagesForm.payment2&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 10px", marginTop:8 }}>
          <div>
            <label style={{ fontSize:11, color:C.textLight, display:"block", marginBottom:4 }}>Date</label>
            <input type="date" value={stagesForm.payment2Date} onChange={function(e){setStagesForm(function(f){return Object.assign({},f,{payment2Date:e.target.value});});}}
              style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box" }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.textLight, display:"block", marginBottom:4 }}>Amount (EGP)</label>
            <input type="text" placeholder="" value={stagesForm.payment2Amount}
              onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setStagesForm(function(f){return Object.assign({},f,{payment2Amount:r?Number(r).toLocaleString():""});});}}
              style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box", direction:"ltr" }}/>
          </div>
        </div>}
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setStagesModal(null);}} style={{ flex:1 }}>Cancel</Btn>
        <Btn onClick={function(){saveStages(gid(stagesModal),stagesForm);setStagesModal(null);}} style={{ flex:1 }}>✅ Save</Btn>
      </div>
    </Modal>}

    {/* Commission Summary Modal */}
    {commModal&&<Modal show={true} onClose={function(){setCommModal(false);}} title={"💰 Commissions — "+commQ}>
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {["Q1","Q2","Q3","Q4"].map(function(q){return <button key={q} onClick={function(){setCommQ(q);}}
          style={{ flex:1, padding:"6px", borderRadius:8, border:"1px solid", borderColor:commQ===q?C.accent:"#E2E8F0", background:commQ===q?C.accent+"12":"#fff", color:commQ===q?C.accent:C.textLight, fontSize:12, fontWeight:600, cursor:"pointer" }}>{q}</button>;})}
      </div>
      {p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;}).map(function(u){
        var res = calcCommission(u, deals, p.users, commQ);
        return <div key={gid(u)} style={{ padding:"12px 0", borderBottom:"1px solid #F1F5F9" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700 }}>{u.name}</div>
              <div style={{ fontSize:11, color:C.textLight }}>{u.role==="manager"?"Manager — 2,000/M fixed":"Sales — "+res.commRate.toLocaleString()+"/M"}</div>
            </div>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:15, fontWeight:800, color:C.success }}>{res.commission.toLocaleString()} EGP</div>
              <div style={{ fontSize:10, color:C.textLight }}>Actual Sales: {(res.effectiveRevenue/1000000).toFixed(2)}M</div>
            </div>
          </div>
          {res.qTarget>0&&<div style={{ marginTop:6 }}>
            <div style={{ height:5, background:"#F1F5F9", borderRadius:3 }}>
              <div style={{ height:"100%", width:Math.min(100,(res.effectiveRevenue/res.qTarget*100))+"%", background:res.effectiveRevenue>=res.qTarget*3?C.success:res.effectiveRevenue>=res.qTarget*2?"#8B5CF6":C.accent, borderRadius:3 }}/>
            </div>
            <div style={{ fontSize:10, color:C.textLight, marginTop:2 }}>
              {res.effectiveRevenue>=res.qTarget*3?"🏆 3x — Commission 7,000/M":res.effectiveRevenue>=res.qTarget*2?"⚡ 2x — Commission 6,000/M":"📈 "+Math.round(res.effectiveRevenue/res.qTarget*100)+"% of Target"}
            </div>
          </div>}
        </div>;
      })}
    </Modal>}

    {/* Project Weight Modal */}
    {isAdmin&&projWeightModal&&<Modal show={true} onClose={function(){setProjWeightModal(false);}} title={"⚙️ Commission Projects"}>
      <div style={{ fontSize:12, color:C.textLight, marginBottom:12, padding:"8px 12px", background:"#F8FAFC", borderRadius:8 }}>
        100% = fully counted in Target & Commission<br/>50% = counted as half in Target & Commission
      </div>
      {(function(){var projects=[];deals.forEach(function(d){if(d.project&&!projects.includes(d.project))projects.push(d.project);});return projects.map(function(proj){
        var w=getProjectWeight(proj);
        // Phase 2 Slice 3 — server is now authoritative. saveProjectWeight
        // PUTs to /api/settings/project-weights (which cascades projectWeight
        // onto every matching Lead doc server-side); we mirror that locally
        // so the deals array reflects new weights without a refetch, then
        // bump pwRev so reads from the module cache pick up the change.
        var saveWeight=async function(newW){
          try {
            await saveProjectWeight(proj, newW, p.token);
            if (p.setLeads) p.setLeads(function(prev){
              return prev.map(function(l){
                return (l.project === proj) ? Object.assign({}, l, { projectWeight: newW }) : l;
              });
            });
            setProjWeights(function(prev){return Object.assign({},prev,{[proj]:newW});});
            if (p.bumpProjectWeightsRev) p.bumpProjectWeightsRev();
          } catch(e) {
            window.alert("Failed to save: " + (e && e.message ? e.message : "unknown error"));
          }
        };
        return <div key={proj} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
          <span style={{ fontSize:13, fontWeight:600 }}>{proj}</span>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={function(){saveWeight(1);}}
              style={{ padding:"5px 12px", borderRadius:7, border:"2px solid", borderColor:w===1?C.success:"#E2E8F0", background:w===1?"#DCFCE7":"#fff", color:w===1?C.success:C.textLight, fontSize:12, fontWeight:w===1?700:400, cursor:"pointer" }}>100%</button>
            <button onClick={function(){saveWeight(0.5);}}
              style={{ padding:"5px 12px", borderRadius:7, border:"2px solid", borderColor:w===0.5?"#F59E0B":"#E2E8F0", background:w===0.5?"#FEF3C7":"#fff", color:w===0.5?"#B45309":C.textLight, fontSize:12, fontWeight:w===0.5?700:400, cursor:"pointer" }}>50%</button>
          </div>
        </div>;
      });})()}
      <Btn onClick={function(){setProjWeightModal(false);}} style={{ marginTop:14, width:"100%" }}>Close</Btn>
    </Modal>}

    {/* Split Modal */}
    {splitModal&&<Modal show={true} onClose={function(){setSplitModal(null);setSplitAgent2("");}} title={"🤝 Split Deal — "+splitModal.name}>
      <div style={{ fontSize:12, color:C.textLight, marginBottom:12 }}>Deal will be split 50/50 between two agents</div>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Agent 1</div>
        <div style={{ padding:"8px 12px", borderRadius:8, background:"#F8FAFC", fontSize:13 }}>{splitModal.agentId&&splitModal.agentId.name?splitModal.agentId.name:"—"}</div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Agent 2</div>
        <select value={splitAgent2} onChange={function(e){setSplitAgent2(e.target.value);}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, background:"#fff", boxSizing:"border-box" }}>
          <option value="">— Select Agent —</option>
          {salesUsers.filter(function(u){var uid=gid(u);var a1=splitModal.agentId&&splitModal.agentId._id?splitModal.agentId._id:splitModal.agentId;return uid!==a1;}).map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name} — {u.title}</option>;})}
        </select>
      </div>
      {getDealSplit(gid(splitModal))&&<div style={{ padding:"8px 12px", background:"#FEF3C7", borderRadius:8, fontSize:12, marginBottom:10 }}>
        Current split: {getDealSplitFromObj(splitModal).agent2Name} — <button onClick={async function(){
          try{await apiFetch("/api/leads/"+gid(splitModal),"PUT",{splitAgent2Id:null,splitAgent2Name:""},p.token);p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(splitModal)?Object.assign({},l,{splitAgent2Id:null,splitAgent2Name:""}):l;});});}catch(e){}
          saveDealSplit(gid(splitModal),null);setSplitModal(null);
        }} style={{ background:"none", border:"none", color:C.danger, cursor:"pointer", fontSize:12 }}>Remove Split</button>
      </div>}
      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setSplitModal(null);setSplitAgent2("");}} style={{ flex:1 }}>Cancel</Btn>
        <Btn onClick={async function(){
          if(!splitAgent2) return;
          var ag2=salesUsers.find(function(u){return gid(u)===splitAgent2;});
          try{
            var updated=await apiFetch("/api/leads/"+gid(splitModal),"PUT",{splitAgent2Id:splitAgent2,splitAgent2Name:ag2?ag2.name:"?"},p.token);
            p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(splitModal)?updated:l;});});
            saveDealSplit(gid(splitModal),{agent2Id:splitAgent2,agent2Name:ag2?ag2.name:"?"});
          }catch(e){}
          setSplitModal(null); setSplitAgent2("");
        }} style={{ flex:1 }}>✅ Save</Btn>
      </div>
    </Modal>}

    {/* Action buttons row */}
    {isOnlyAdmin&&<div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
      <Btn outline onClick={function(){setCommModal(true);}} style={{ padding:"7px 13px", fontSize:12, color:C.success, borderColor:C.success }}>💰 Commissions</Btn>
      <Btn outline onClick={function(){setProjWeightModal(true);}} style={{ padding:"7px 13px", fontSize:12, color:C.accent, borderColor:C.accent }}>⚙️ Commission Projects</Btn>
    </div>}

    <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
    <Card p={0} style={{ flex:1, overflow:"hidden" }}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
      <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
        {[t.name,p.cu.role==="admin"?t.phone:null,p.cu.role==="admin"?t.phone2:null,t.project,t.budget,"Deal Date","Deal Stages",isOnlyAdmin?"Commission":null,isAdmin?t.agent:null,isAdmin?t.source:null,"Approved",""].filter(function(h){return h!==null;}).map(function(h,i){return <th key={i} style={{ textAlign:"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}      </tr></thead>
      <tbody>
        {filteredDeals.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:C.textLight }}>No deals yet</td></tr>}
        {filteredDeals.map(function(d){
          var bv=parseBudget(d.budget);
          var prog=stagesProgress(gid(d));
          var stages=getStages(gid(d));
          var isSel=selectedDeal&&gid(selectedDeal)===gid(d);
          return <tr key={gid(d)} onClick={function(){setSelectedDeal(isSel?null:d);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSel?"#EFF6FF":"transparent", transition:"background 0.1s" }}>
            <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600, textAlign:"left" }}>{d.name}</td>
            {p.cu.role==="admin"&&<td style={{ padding:"11px 12px", fontSize:12, direction:"ltr", textAlign:"left" }}>{d.phone}</td>}
            {p.cu.role==="admin"&&<td style={{ padding:"11px 12px", fontSize:12, direction:"ltr", color:C.textLight, textAlign:"left" }}>
              {d.phone2&&d.phone2!==d.phone?<PhoneCell phone={d.phone2}/>:<span style={{ color:"#CBD5E1" }}>-</span>}
            </td>}
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight, textAlign:"left" }}>{d.project||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:13, fontWeight:700, color:C.success, textAlign:"left" }}>
              {(function(){
                var split=getDealSplitFromObj(d);
                var weight=getProjectWeight(d.project,d);
                var splitFactor=split?0.5:1;
                var effectiveBv=bv*weight*splitFactor;
                var showEffective=effectiveBv!==bv&&bv>0;
                var isSalesRole=p.cu.role==="sales"||p.cu.role==="team_leader";
                // Sales sees effective amount only, admin sees both
                if(isSalesRole&&showEffective){
                  // For a split, show "+OtherAgent" — primary sees the split partner,
                  // split partner sees the primary. Both still get the "Split" indicator.
                  var meId=String(p.cu.id||"");
                  var primaryId=String(d.agentId&&d.agentId._id?d.agentId._id:d.agentId||"");
                  var primaryName=(d.agentId&&d.agentId.name)?d.agentId.name:"";
                  var otherName=split?(primaryId===meId?(split.agent2Name||""):primaryName):"";
                  return <div>
                    <div style={{ color:C.success }}>{effectiveBv.toLocaleString()}</div>
                    <div style={{ fontSize:10, color:C.textLight, marginTop:1 }}>من {bv.toLocaleString()}</div>
                    {split&&otherName&&<div style={{ fontSize:10, color:"#8B5CF6", fontWeight:600, marginTop:1 }}>🤝 +{otherName}</div>}
                  </div>;
                }
                return <div>
                  <div>{bv>0?bv.toLocaleString():d.budget||"-"}</div>
                  {!isSalesRole&&showEffective&&<div style={{ fontSize:10, color:"#8B5CF6", fontWeight:600, marginTop:1 }}>
                    {split?"🤝":"📊"} {effectiveBv.toLocaleString()} {split?"50% — "+(split.agent2Name||"Shared"):weight*100+"% project"}
                  </div>}
                </div>;
              })()}
            </td>
            <td style={{ padding:"11px 12px", fontSize:11, color:C.textLight, whiteSpace:"nowrap", textAlign:"left" }}>{(function(){var dd=getDealDate(d);return dd?new Date(dd).toLocaleDateString("en-GB")+" "+new Date(dd).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):"-";})()}</td>
            <td style={{ padding:"11px 12px", minWidth:130, textAlign:"left" }}>
              <button onClick={function(){openStages(d);}}
                style={{ background:"none", border:"none", cursor:"pointer", width:"100%", textAlign:"right", padding:0 }}>
                <div style={{ display:"flex", gap:4, marginBottom:3 }}>
                  {["contract","payment1","payment2"].map(function(k){return <span key={k} style={{ width:18, height:18, borderRadius:5, background:stages[k]?C.success:"#E2E8F0", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:9, color:stages[k]?"#fff":"#94A3B8" }}>{stages[k]?"✓":"·"}</span>;})}
                  <span style={{ fontSize:10, color:C.textLight, marginRight:4 }}>{prog}/3</span>
                </div>
                <div style={{ height:4, background:"#F1F5F9", borderRadius:2 }}>
                  <div style={{ height:"100%", width:(prog/3*100)+"%", background:prog===3?C.success:C.accent, borderRadius:2 }}/>
                </div>
              </button>
            </td>
            {isOnlyAdmin&&<td style={{ padding:"11px 12px" }}>
              {(function(){
                var raw=parseBudget(d.budget);
                var weight=getProjectWeight(d.project,d);
                var split=getDealSplitFromObj(d);
                var splitFactor=split?0.5:1;
                var effRev=raw*weight*splitFactor;
                var ag=d.agentId&&d.agentId._id?d.agentId._id:d.agentId;
                // For manager: show their own commission (2000/M), not agent's
                if(!isOnlyAdmin){
                  var managerComm=(effRev/1000000)*2000;
                  return <div><div style={{ fontSize:12, fontWeight:700, color:C.success }}>{managerComm>0?Math.round(managerComm).toLocaleString()+" EGP":"—"}</div><div style={{ fontSize:10, color:C.textLight }}>2,000/M</div></div>;
                }
                var agUser=p.users.find(function(u){return gid(u)===ag;});
                var agRole=agUser?agUser.role:"sales";
                var commRate=agRole==="manager"?2000:(function(){
                  if(!agUser) return 5000;
                  var agU=p.users.find(function(u){return gid(u)===ag;});var qt=(agU&&agU.qTargets&&Object.keys(agU.qTargets).length>0)?agU.qTargets:(function(){try{return JSON.parse(localStorage.getItem("crm_qt_"+ag)||"{}");}catch(e){return {};}})();
                  var curQNow=(function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
                  var qTarget=qt[curQNow]||0;
                  if(!qTarget) return 5000;
                  // calc total effective revenue for this agent in current Q
                  var allDealsNow=p.leads.filter(function(l){return l.status==="DoneDeal"&&!l.archived;});
                  var getQNow=function(date){var m=new Date(date).getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";};
                  var agentRev=allDealsNow.reduce(function(s,dd){
                    var aid=dd.agentId&&dd.agentId._id?dd.agentId._id:dd.agentId;
                    if(aid!==ag) return s;
                    var ddate=getDealDate(dd);
                    if(!ddate||getQNow(ddate)!==curQNow) return s;
                    var w=getProjectWeight(dd.project);
                    var sp=getDealSplit(gid(dd));
                    return s+(parseBudget(dd.budget)*w*(sp?0.5:1));
                  },0);
                  var mult=agentRev/qTarget;
                  return mult>=3?7000:mult>=2?6000:5000;
                })();
                var comm=(effRev/1000000)*commRate;
                return <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.success }}>{comm>0?comm.toLocaleString()+" EGP":"—"}</div>
                  {weight<1&&<div style={{ fontSize:9, color:"#B45309" }}>⚠️ 50%</div>}
                  {split&&<div style={{ fontSize:9, color:"#8B5CF6" }}>🤝 Split</div>}
                </div>;
              })()}
            </td>}
            {isAdmin&&<td style={{ padding:"11px 12px", fontSize:12, textAlign:"left" }}>
              <div>{getAg(d)}</div>
              {(function(){var sp=getDealSplitFromObj(d);return sp?<div style={{ fontSize:10, color:"#8B5CF6", marginTop:2 }}>🤝 +{sp.agent2Name}</div>:null;})()}
            </td>}
            {isAdmin&&<td style={{ padding:"11px 12px", fontSize:12, color:C.textLight, textAlign:"left" }}>{d.source}</td>}
            <td style={{ padding:"11px 12px", textAlign:"left" }}>
              {d.dealApproved
                ?<span style={{ background:"#DCFCE7", color:"#15803D", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>✅</span>
                :<span style={{ background:"#FEF9C3", color:"#B45309", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>⏳</span>}
              {isOnlyAdmin&&d.commissionClaimDate&&<div style={{ fontSize:9, color:C.textLight, marginTop:2 }}>📋 {new Date(d.commissionClaimDate).toLocaleDateString("en-GB")}</div>}
              {isOnlyAdmin&&d.commissionClaimed&&<div style={{ fontSize:9, color:C.success, marginTop:1 }}>✅ Claimed</div>}
            </td>
            <td style={{ padding:"8px 12px" }}>
              <div style={{ display:"flex", gap:5 }}>
                {isOnlyAdmin&&<button onClick={function(){setSplitModal(d);var sp=getDealSplitFromObj(d);setSplitAgent2(sp?sp.agent2Id:"");}} title="Split Deal"
                  style={{ width:28, height:28, borderRadius:6, border:"1px solid "+(getDealSplitFromObj(d)?"#8B5CF6":"#E2E8F0"), background:getDealSplitFromObj(d)?"#F5F3FF":"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🤝</button>}
                {isOnlyAdmin&&<button onClick={function(){setEditDeal(d);}} title={t.edit}
                  style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Edit size={13} color={C.info}/>
                </button>}
                {isOnlyAdmin&&<button onClick={function(){archiveDeal(gid(d));}} title={t.archive}
                  style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Archive size={13} color={C.warning}/>
                </button>}
              </div>
            </td>
          </tr>;
        })}
      </tbody>
    </table></div></Card>

    {selectedDeal&&(function(){
      var extra=getDealExtra(String(selectedDeal._id||gid(selectedDeal)))||{};
      var downPct=extra.downPaymentPct||selectedDeal.downPaymentPct||"";
      var instYears=extra.installmentYears||selectedDeal.installmentYears||"";
      return <div ref={dealPanelRef} style={{ flex:"0 0 280px", background:"#fff", borderRadius:14, border:"1px solid #E8ECF1", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden", maxHeight:"80vh", overflowY:"auto" }}>
      <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <button onClick={function(){setSelectedDeal(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><X size={11}/></button>
          {(p.cu.role==="admin"||p.cu.role==="sales_admin")&&<div style={{ display:"flex", gap:6 }}>
            {(function(){
              var isCancelled = selectedDeal.dealStatus==="Deal Cancelled" || selectedDeal.status==="Deal Cancelled";
              if (isCancelled) return <span style={{ background:"rgba(239,68,68,0.3)", borderRadius:8, padding:"4px 10px", color:"#fff", fontSize:11, fontWeight:700 }}>❌ Deal Cancelled</span>;
              return <>
                <button onClick={async function(){
                  try{
                    var upd={dealApproved:!selectedDeal.dealApproved};
                    var updated=await apiFetch("/api/leads/"+gid(selectedDeal),"PUT",upd,p.token);
                    p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selectedDeal)?updated:l;});});
                    setSelectedDeal(updated);
                  }catch(e){}
                }} style={{ background:selectedDeal.dealApproved?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", color:"#fff", fontSize:11, fontWeight:700 }}>
                  {selectedDeal.dealApproved?"✅ Approved":"⏳ Approve"}
                </button>
                <button disabled={dealCancelling} onClick={async function(){
                  if(!window.confirm("Cancel this deal? The lead will return to Hot Case status and be rotated to another agent.")) return;
                  setDealCancelling(true);
                  try{
                    var updated = await apiFetch("/api/leads/"+gid(selectedDeal)+"/deal-cancel","POST",{},p.token);
                    // Auto-rotate via the ordered rotation list (backend skips previous agents).
                    try {
                      var rot = await apiFetch("/api/leads/"+gid(selectedDeal)+"/auto-rotate","POST",{reason:"manual"},p.token);
                      if (rot && rot.lead) updated = rot.lead;
                    } catch(rotErr){ /* deal cancelled; rotation may be exhausted */ }
                    p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selectedDeal)?updated:l;});});
                    setSelectedDeal(updated);
                    setDealTab("cancelled");
                  }catch(e){alert(e.message||"Cancel failed");}
                  setDealCancelling(false);
                }} style={{ background:"rgba(239,68,68,0.25)", border:"none", borderRadius:8, padding:"4px 10px", cursor:dealCancelling?"wait":"pointer", color:"#fff", fontSize:11, fontWeight:700, opacity:dealCancelling?0.6:1 }}>
                  {dealCancelling?"Cancelling…":"❌ Cancel"}
                </button>
              </>;
            })()}
          </div>}
        </div>
        <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{selectedDeal.name}</div>
        <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:2 }}>{selectedDeal.phone}</div>
      </div>
      <div style={{ padding:"14px 16px" }}>
        {[
          {l:"Project", v:selectedDeal.project||"-", icon:"🏠"},
          {l:"Budget", v:(function(){
            var raw=parseBudget(selectedDeal.budget);
            var weight=getProjectWeight(selectedDeal.project,selectedDeal);
            var split=getDealSplitFromObj(selectedDeal);
            var splitFactor=split?0.5:1;
            var eff=raw*weight*splitFactor;
            var isSalesRole=p.cu.role==="sales"||p.cu.role==="team_leader";
            if(isSalesRole&&eff!==raw&&raw>0) return eff.toLocaleString()+" EGP";
            if(!isSalesRole&&eff!==raw&&raw>0) return selectedDeal.budget+" EGP → "+eff.toLocaleString()+" EGP effective";
            return selectedDeal.budget?selectedDeal.budget+" EGP":"-";
          })(), icon:"💰"},
          {l:"Down Payment %", v:downPct?downPct+"%":"-", icon:"📊"},
          {l:"Installment Years", v:instYears?instYears+" yrs":"-", icon:"📅"},
          {l:"Agent", v:getAg(selectedDeal), icon:"👤"},
          {l:"Source", v:selectedDeal.source||"-", icon:"📢"},
          {l:"Deal Date", v:(function(){var dd=getDealDate(selectedDeal);return dd?new Date(dd).toLocaleDateString("en-GB"):"-";})(), icon:"🗓"},
          {l:"Notes", v:selectedDeal.notes||"-", icon:"📝"},
        ].map(function(f){return f.v&&f.v!=="-"?<div key={f.l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #F1F5F9", gap:8 }}>
          <span style={{ fontSize:11, color:C.textLight, flexShrink:0 }}>{f.icon} {f.l}</span>
          <span style={{ fontSize:11, fontWeight:500, textAlign:"right", wordBreak:"break-word" }}>{f.v}</span>
        </div>:null;})}

        {/* Commission Claim Date - sales admin only */}
        {isOnlyAdmin&&<div style={{ marginTop:12, padding:10, background:"#F8FAFC", borderRadius:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:6 }}>📋 Commission Claim</div>
          <input type="date" value={selectedDeal.commissionClaimDate||""} onChange={async function(e){
            try{
              var updated=await apiFetch("/api/leads/"+gid(selectedDeal),"PUT",{commissionClaimDate:e.target.value},p.token);
              p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selectedDeal)?updated:l;});});
              setSelectedDeal(updated);
            }catch(ex){}
          }} style={{ width:"100%", padding:"6px 8px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, marginBottom:6, boxSizing:"border-box" }}/>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:12 }}>
            <input type="checkbox" checked={selectedDeal.commissionClaimed||false} onChange={async function(e){
              try{
                var updated=await apiFetch("/api/leads/"+gid(selectedDeal),"PUT",{commissionClaimed:e.target.checked},p.token);
                p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selectedDeal)?updated:l;});});
                setSelectedDeal(updated);
              }catch(ex){}
            }}/>
            <span style={{ fontWeight:600, color:selectedDeal.commissionClaimed?C.success:C.textLight }}>
              {selectedDeal.commissionClaimed?"✅ Claimed":"☐ Mark as Claimed"}
            </span>
          </label>
        </div>}

        {/* Deal Images */}
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:6 }}>📎 Contract Images</div>
          {(function(){
            var imgs=selectedDeal.dealImages&&selectedDeal.dealImages.length?selectedDeal.dealImages:selectedDeal.dealImage?[selectedDeal.dealImage]:[];
            var uploadHandler=function(e){
              var file=e.target.files[0]; if(!file)return; e.target.value="";
              var reader=new FileReader();
              reader.onload=function(ev){
                var img=new Image();img.onload=function(){
                  var canvas=document.createElement("canvas");var maxW=1200,maxH=1200;var w=img.width,h=img.height;
                  if(w>maxW){h=h*(maxW/w);w=maxW;}if(h>maxH){w=w*(maxH/h);h=maxH;}
                  canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);
                  var resized=canvas.toDataURL("image/jpeg",0.7);
                  apiFetch("/api/leads/"+gid(selectedDeal)+"/upload-image","POST",{imageData:resized,imageType:"deal"},p.token).then(function(updated){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selectedDeal)?updated:l;});});setSelectedDeal(updated);}).catch(function(){alert("Upload failed");});
                };img.src=ev.target.result;
              };reader.readAsDataURL(file);
            };
            var deleteHandler=function(idx){
              if(!window.confirm("Delete this image?"))return;
              apiFetch("/api/leads/"+gid(selectedDeal)+"/delete-deal-image","POST",{index:idx},p.token).then(function(updated){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selectedDeal)?updated:l;});});setSelectedDeal(updated);}).catch(function(){alert("Delete failed");});
            };
            return <div>
              {imgs.length>0&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:6 }}>
                {imgs.map(function(src,i){return <div key={i} style={{ position:"relative" }}>
                  <img src={src} onClick={function(){var w=window.open();w.document.write("<img src='"+src+"' style='max-width:100%;'>");}} style={{ width:"100%", borderRadius:8, cursor:"zoom-in", display:"block" }} alt={"Contract "+(i+1)} title="Click to view full size"/>
                  <button onClick={function(){deleteHandler(i);}} style={{ position:"absolute", top:4, right:4, background:"rgba(239,68,68,0.85)", border:"none", borderRadius:"50%", width:20, height:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, lineHeight:1 }} title="Delete image">×</button>
                </div>;})}
              </div>}
              <label style={{ display:"block", padding:imgs.length>0?"6px":"10px", borderRadius:8, border:"1px dashed "+C.accent, background:C.accent+"08", color:C.accent, fontSize:imgs.length>0?11:12, fontWeight:600, cursor:"pointer", textAlign:"center" }}>
                {imgs.length>0?"➕ Add More":"📤 Upload Contract Image"}
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={uploadHandler}/>
              </label>
            </div>;
          })()}
        </div>
      </div>
    </div>;})()}
    </div>
  </div>;
};

// ===== TASKS =====
var TasksPage = function(p) {
  var t=p.t;
  var [showAdd,setShowAdd]=useState(false);
  var [saving,setSaving]=useState(false);
  var [nT,setNT]=useState({title:"",type:"call",time:"",notes:""});
  var now=Date.now();
  var today=new Date().toDateString();

  var myLeads=p.leads.filter(function(l){
    if(l.archived)return false;
    var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;
    return p.cu.role==="admin"||p.cu.role==="manager"||p.cu.role==="team_leader"||aid===p.cu.id;
  });

  var callbacksToday=myLeads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).toDateString()===today;}).sort(function(a,b){return new Date(a.callbackTime)-new Date(b.callbackTime);});
  var overdue=myLeads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime)<new Date()&&new Date(l.callbackTime).toDateString()!==today;});
  var noActivity=myLeads.filter(function(l){return (!l.lastActivityTime||(now-new Date(l.lastActivityTime).getTime())>1*24*60*60*1000)&&l.status!=="DoneDeal"&&l.status!=="NotInterested";});

  var myTasks=p.tasks.filter(function(tk){
    if(tk.done) return false;
    if(p.cu.role==="admin") return true;
    if(p.cu.role==="manager"||p.cu.role==="team_leader"){
      var taskUid=tk.userId&&tk.userId._id?String(tk.userId._id):String(tk.userId||"");
      return (p.myTeamUsers||[]).some(function(u){return String(u._id)===taskUid;});
    }
    return tk.userId===p.cu.id;
  });
  var overdueTasks=myTasks.filter(function(tk){return tk.time&&new Date(tk.time)<new Date();});
  var todayTasks=myTasks.filter(function(tk){return tk.time&&new Date(tk.time).toDateString()===today&&new Date(tk.time)>=new Date();});
  var upcoming=myTasks.filter(function(tk){return !tk.time||(new Date(tk.time)>new Date()&&new Date(tk.time).toDateString()!==today);});

  var addTask=async function(){if(!nT.title)return;setSaving(true);try{var tk=await apiFetch("/api/tasks","POST",Object.assign({},nT,{userId:p.cu.id}),p.token);p.setTasks(function(prev){return [tk].concat(prev);});setShowAdd(false);setNT({title:"",type:"call",time:"",notes:""});}catch(e){}setSaving(false);};
  var doneTask=async function(tid){try{await apiFetch("/api/tasks/"+tid,"PUT",{done:true},p.token);p.setTasks(function(prev){return prev.map(function(tk){return tk._id===tid?Object.assign({},tk,{done:true}):tk;});});}catch(e){}};

  var Sec=function(sp){return <div style={{ marginBottom:16 }}>
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
      <span style={{ fontSize:18 }}>{sp.icon}</span>
      <span style={{ fontWeight:700, fontSize:14 }}>{sp.title}</span>
      <span style={{ background:sp.color+"18", color:sp.color, padding:"1px 8px", borderRadius:20, fontSize:11, fontWeight:700 }}>{sp.count}</span>
    </div>
    {sp.children}
  </div>;};

  var LRow=function(lp){var l=lp.lead;var ci=callbackColor(l.callbackTime);return <div onClick={function(){p.nav("leads");p.setInitSelected(l);}} style={{ padding:"10px 14px", borderRadius:10, background:"#FAFBFC", border:"1px solid #E8ECF1", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
    <div><div style={{ fontWeight:600, fontSize:13 }}>{l.name}</div><div style={{ fontSize:11, color:"#64748B", direction:"ltr" }}>{l.phone}</div></div>
    <div style={{ textAlign:"left" }}>{l.callbackTime&&<div style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:ci?ci.bg:"#F1F5F9", color:ci?ci.color:"#64748B", fontWeight:600 }}>{l.callbackTime.slice(11,16)}</div>}</div>
  </div>;};

  var TRow=function(tp){var tk=tp.task;return <div style={{ padding:"10px 14px", borderRadius:10, background:tp.bg||"#F8FAFC", border:"1px solid "+tp.border, marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
    <div><div style={{ fontWeight:600, fontSize:13 }}>{tk.title}</div><div style={{ fontSize:11, color:tp.tc||"#64748B" }}>{tk.time?tk.time.slice(0,16).replace("T"," "):"No time set"}</div></div>
    <button onClick={function(){doneTask(tk._id);}} style={{ padding:"4px 12px", borderRadius:7, border:"none", background:C.success, color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>✓ Done</button>
  </div>;};

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
      <div>
        <h2 style={{ margin:"0 0 2px", fontSize:18, fontWeight:800 }}>☀️ My Day & Tasks</h2>
        <div style={{ fontSize:12, color:C.textLight }}>{new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
      </div>
      <Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><Plus size={14}/> New Task</Btn>
    </div>

    <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
      <StatCard icon={Phone} label={"Today's Calls"} value={callbacksToday.length+""} c={C.info} onClick={function(){var el=document.getElementById("t-callbacks");if(el)el.scrollIntoView({behavior:"smooth"});}}/>
      <StatCard icon={AlertCircle} label={"Overdue"} value={(overdue.length+overdueTasks.length)+""} c={C.danger} onClick={function(){var el=document.getElementById("t-overdue");if(el)el.scrollIntoView({behavior:"smooth"});}}/>
      <StatCard icon={Activity} label={"No Activity"} value={noActivity.length+""} c={C.warning} onClick={function(){var el=document.getElementById("t-noact");if(el)el.scrollIntoView({behavior:"smooth"});}}/>
      <StatCard icon={CheckCircle} label={"Today's Tasks"} value={todayTasks.length+""} c={"#8B5CF6"} onClick={function(){var el=document.getElementById("t-today");if(el)el.scrollIntoView({behavior:"smooth"});}}/>
    </div>

    {overdue.length>0&&<div id="t-overdue"><Sec icon="⚠️" title="Overdue Calls" color={C.danger} count={overdue.length}>{overdue.slice(0,5).map(function(l){return <LRow key={gid(l)} lead={l}/>;})}</Sec></div>}
    {overdueTasks.length>0&&<Sec icon="🔴" title="Overdue Tasks" color={C.danger} count={overdueTasks.length}>{overdueTasks.map(function(tk){return <TRow key={tk._id} task={tk} bg="#FEF2F2" border="#FECACA" tc={C.danger}/>;})}</Sec>}
    {callbacksToday.length>0&&<div id="t-callbacks"><Sec icon="📞" title="Today's Calls" color={C.info} count={callbacksToday.length}>{callbacksToday.map(function(l){return <LRow key={gid(l)} lead={l}/>;})}</Sec></div>}
    {todayTasks.length>0&&<div id="t-today"><Sec icon="📋" title="Today's Tasks" color={"#8B5CF6"} count={todayTasks.length}>{todayTasks.map(function(tk){return <TRow key={tk._id} task={tk} bg="#F5F3FF" border="#DDD6FE" tc={"#7C3AED"}/>;})}</Sec></div>}
    {noActivity.length>0&&<div id="t-noact"><Sec icon="😴" title="No Activity +3 Days" color={C.warning} count={noActivity.length}>{noActivity.slice(0,5).map(function(l){return <LRow key={gid(l)} lead={l}/>;})}</Sec></div>}
    {upcoming.length>0&&<Sec icon="📅" title="Upcoming Tasks" color={C.textLight} count={upcoming.length}>{upcoming.slice(0,5).map(function(tk){return <TRow key={tk._id} task={tk} bg="#F8FAFC" border="#E2E8F0"/>;})}</Sec>}

    {callbacksToday.length===0&&overdue.length===0&&noActivity.length===0&&myTasks.length===0&&
      <div style={{ textAlign:"center", padding:"60px 20px" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Clear day!</div>
        <div style={{ fontSize:13, color:C.textLight }}>No pending tasks right now</div>
      </div>}

    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={"➕ New Task"}>
      <Inp label={"Task Title"} req value={nT.title} onChange={function(e){setNT(function(f){return Object.assign({},f,{title:e.target.value});});}}/>
      <Inp label={"Type"} type="select" value={nT.type} onChange={function(e){setNT(function(f){return Object.assign({},f,{type:e.target.value});});}} options={[{value:"call",label:"📞 Call"},{value:"meeting",label:"🤝 Meeting"},{value:"followup",label:"🔔 Follow-up"},{value:"email",label:"📧 Email"}]}/>
      <Inp label={"Time"} type="datetime-local" value={nT.time} onChange={function(e){setNT(function(f){return Object.assign({},f,{time:e.target.value});});}}/>
      <Inp label={"Notes (optional)"} type="textarea" value={nT.notes} onChange={function(e){setNT(function(f){return Object.assign({},f,{notes:e.target.value});});}}/>
      <div style={{ display:"flex", gap:10 }}><Btn outline onClick={function(){setShowAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn><Btn onClick={addTask} loading={saving} style={{ flex:1 }}>Add</Btn></div>
    </Modal>
  </div>;
};


var ArchivePage = function(p) {
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader";
  var isOnlyAdmin=p.cu.role==="admin";
  var archived = p.leads.filter(function(l){ return l.archived; });
  var [archivedDR,setArchivedDR]=useState([]);
  useEffect(function(){
    // Load archived DRs from the server (the API returns all DRs regardless of archived flag).
    apiFetch("/api/daily-requests","GET",null,p.token)
      .then(function(data){
        var all=Array.isArray(data)?data:[];
        var legacyIds=[]; try{legacyIds=JSON.parse(localStorage.getItem("crm_dr_archived")||"[]");}catch(e){}
        setArchivedDR(all.filter(function(r){return r.archived || legacyIds.includes(gid(r));}));
      }).catch(function(){setArchivedDR([]);});
  },[]);
  var restoreDR=async function(rid){
    try{ await apiFetch("/api/daily-requests/"+rid+"/unarchive","PUT",null,p.token); }catch(e){}
    // Also clean the legacy localStorage list so restored items don't re-disappear
    try{
      var ids=JSON.parse(localStorage.getItem("crm_dr_archived")||"[]");
      ids=ids.filter(function(x){return x!==rid;});
      localStorage.setItem("crm_dr_archived",JSON.stringify(ids));
    }catch(e){}
    setArchivedDR(function(prev){return prev.filter(function(r){return gid(r)!==rid;});});
  };
  var restore=async function(lid){
    try{
      await apiFetch("/api/leads/"+lid,"PUT",{archived:false},p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===lid?Object.assign({},l,{archived:false}):l;});});
    }catch(e){alert(e.message);}
  };
  var canDelete = p.cu.role==="admin" || p.cu.role==="sales_admin";
  var deleteLead=async function(lid){
    if(!window.confirm("Delete this record permanently? This cannot be undone.")) return;
    try{
      await apiFetch("/api/leads/"+lid,"DELETE",null,p.token);
      p.setLeads(function(prev){return prev.filter(function(l){return gid(l)!==lid;});});
    }catch(e){alert(e.message);}
  };
  var deleteDR=async function(rid){
    if(!window.confirm("Delete this record permanently? This cannot be undone.")) return;
    try{
      await apiFetch("/api/daily-requests/"+rid,"DELETE",null,p.token);
      try{
        var ids=JSON.parse(localStorage.getItem("crm_dr_archived")||"[]");
        ids=ids.filter(function(x){return x!==rid;});
        localStorage.setItem("crm_dr_archived",JSON.stringify(ids));
      }catch(e){}
      setArchivedDR(function(prev){return prev.filter(function(r){return gid(r)!==rid;});});
    }catch(e){alert(e.message);}
  };
  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{t.archive} ({archived.length})</h2>
      {isOnlyAdmin&&(archived.length>0||archivedDR.length>0)&&<Btn outline onClick={async function(){
        if(!window.confirm("Clear all archived items? This cannot be undone.")) return;
        // Bulk delete archived leads
        try{
          var leadIds=archived.map(function(l){return gid(l);});
          if(leadIds.length>0) await apiFetch("/api/leads/bulk-delete","POST",{ids:leadIds},p.token);
          p.setLeads(function(prev){return prev.filter(function(l){return !l.archived;});});
        }catch(e){}
        // Bulk delete DR
        try{
          await Promise.all(archivedDR.map(function(r){return apiFetch("/api/daily-requests/"+gid(r),"DELETE",null,p.token).catch(function(){});}));
        }catch(e){}
        try{localStorage.removeItem("crm_dr_archived");}catch(e){}
        setArchivedDR([]);
      }} style={{ padding:"7px 13px", fontSize:12, color:C.danger, borderColor:C.danger }}>🗑 Clear All</Btn>}
    </div>
    {archived.length===0&&<div style={{ textAlign:"center", padding:30, color:C.textLight }}>No archived leads</div>}
    {archived.length>0&&<Card p={0} style={{ marginBottom:24 }}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
      <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
        {[t.name,t.phone,t.project,t.status,isAdmin&&t.agent,""].filter(Boolean).map(function(h){return <th key={h||"x"} style={{ textAlign:"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight }}>{h}</th>;})}
      </tr></thead>
      <tbody>{archived.map(function(l){var lid=gid(l);var so=STATUSES(t).find(function(s){return s.value===l.status;})||STATUSES(t)[0];var ag=l.agentId&&l.agentId.name?l.agentId.name:"";
        return <tr key={lid} style={{ borderBottom:"1px solid #F1F5F9", opacity:0.7 }}>
          <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600 }}>{l.name}</td>
          <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr" }}><PhoneCell phone={l.phone}/></td>
          <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{l.project}</td>
          <td style={{ padding:"11px 12px" }}><Badge bg={so.bg} color={so.color}>{so.label}</Badge></td>
          {isAdmin&&<td style={{ padding:"11px 12px", fontSize:12 }}>{ag}</td>}
          <td style={{ padding:"11px 12px" }}><div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <Btn onClick={function(){restore(lid);}} style={{ padding:"5px 12px", fontSize:11 }}><RotateCcw size={12}/> {t.restore}</Btn>
            {canDelete&&<button onClick={function(){deleteLead(lid);}} title="Delete permanently" style={{ width:28, height:28, borderRadius:6, border:"1px solid "+C.danger, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Trash2 size={13} color={C.danger}/></button>}
          </div></td>
        </tr>;
      })}</tbody>
    </table></div></Card>}

    {archivedDR.length>0&&<div>
      <h3 style={{ margin:"0 0 12px", fontSize:15, fontWeight:700, color:C.textLight }}>📋 Archived Daily Requests ({archivedDR.length})</h3>
      <Card p={0}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:400 }}>
        <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
          {["Name","Phone","Location","Budget","Status",""].map(function(h){return <th key={h||"x"} style={{ textAlign:"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight }}>{h}</th>;})}
        </tr></thead>
        <tbody>{archivedDR.map(function(r){var rid=gid(r);var so=STATUSES(t).find(function(s){return s.value===r.status;})||STATUSES(t)[0];
          return <tr key={rid} style={{ borderBottom:"1px solid #F1F5F9", opacity:0.7 }}>
            <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600 }}>{r.name}</td>
            <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr" }}><PhoneCell phone={r.phone}/></td>
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{r.area||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:12, color:C.success, fontWeight:600 }}>{r.budget||"-"}</td>
            <td style={{ padding:"11px 12px" }}><Badge bg={so.bg} color={so.color}>{so.label}</Badge></td>
            <td style={{ padding:"11px 12px" }}><div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <Btn onClick={function(){restoreDR(rid);}} style={{ padding:"5px 12px", fontSize:11 }}><RotateCcw size={12}/> Restore</Btn>
              {canDelete&&<button onClick={function(){deleteDR(rid);}} title="Delete permanently" style={{ width:28, height:28, borderRadius:6, border:"1px solid "+C.danger, background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Trash2 size={13} color={C.danger}/></button>}
            </div></td>
          </tr>;
        })}</tbody>
      </table></div></Card>
    </div>}
  </div>;
};

// ===== DAILY REQUESTS =====
var DailyRequestsPage = function(p) {
  var t=p.t;
  // Dropdown and tabs both drop "Deal Cancelled" from DRs entirely.
  var sc=visibleStatuses(DR_STATUSES(t), p.cu&&p.cu.role).filter(function(s){ return s.value!=="Deal Cancelled"; });
  var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin";
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
  var [requests,setRequests]=useState([]);
  var [loading,setLoading]=useState(true);
  var [showAdd,setShowAdd]=useState(false);
  var [saving,setSaving]=useState(false);
  var [selected,setSelected]=useState(null);
  // Close the DR side panel when the user clicks anywhere outside of it.
  // The same ref is attached to both the mobile and desktop panel renders;
  // only one is mounted at a time so a single ref is enough.
  var drPanelRef = useOutsideClose(!!selected, function(){ setSelected(null); });
  var [statusDrop,setStatusDrop]=useState(null);
  var [showStatusComment,setShowStatusComment]=useState(false);
  var [pendingStatus,setPendingStatus]=useState(null);
  var [actNote,setActNote]=useState(""); var [actType,setActType]=useState("call"); var [showActForm,setShowActForm]=useState(false);
  var [actSaving,setActSaving]=useState(false);
  var [showDrHistory,setShowDrHistory]=useState(false);
  var [drHistoryReq,setDrHistoryReq]=useState(null);
  var [drHistoryList,setDrHistoryList]=useState([]);
  var [drHistoryLoading,setDrHistoryLoading]=useState(false);
  // Honour a one-shot initial filter from the Sales Dashboard (e.g. CallBack).
  var [filterStatus,setFilterStatus]=useState(p.drInitFilter||"all");
  var [sortBy,setSortBy]=useState("lastActivity");
  var [agentFilter,setAgentFilter]=useState("");
  useEffect(function(){
    if(p.drInitFilter){ setFilterStatus(p.drInitFilter); if(p.setDrInitFilter) p.setDrInitFilter(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  var [form,setForm]=useState({name:"",phone:"",phone2:"",propertyType:"",area:"",budget:"",notes:"",agentId:"",callbackTime:"",status:"NewLead",dealProject:"",dealUnitType:"",dealBudget:"",eoiDeposit:"",eoiDateInput:"",eoiDocFiles:[]});
  var [selected2,setSelected2]=useState([]);
  var [showBulk,setShowBulk]=useState(false);
  var [bulkAgent,setBulkAgent]=useState("");

  useEffect(function(){
    apiFetch("/api/daily-requests","GET",null,p.token)
      .then(function(data){
        // Legacy localStorage archive list kept as a safety net for browsers that still have it set.
        var archivedIds=[];
        try{archivedIds=JSON.parse(localStorage.getItem("crm_dr_archived")||"[]");}catch(e){}
        var filtered2=Array.isArray(data)?data.filter(function(r){return !r.archived && !archivedIds.includes(gid(r));}):[];
        setRequests(filtered2);setLoading(false);
      })
      .catch(function(){setRequests([]);setLoading(false);});
  },[]);

  useEffect(function(){ if(p.initSelected){setSelected(p.initSelected);p.setInitSelected(null);} },[p.initSelected]);
  // Re-hydrate `selected` from the fetched `requests` list when we arrived with
  // only a shell ({_id, name, phone}) — e.g. from the Admin dashboard activity
  // click. createdAt is on every persisted DR but never on the shells we hand
  // in via initSelected, so it's a reliable "is this a real doc" probe.
  useEffect(function(){
    if (!selected || !requests || !requests.length) return;
    var sid = gid(selected);
    var full = requests.find(function(r){ return String(gid(r)) === String(sid); });
    if (full && !selected.createdAt) setSelected(full);
  }, [requests]);

  var filtered=requests.filter(function(r){
    if(filterStatus!=="all"){
      // Permanent meeting filter: strictly hadMeeting === true (stamped on
      // first transition, never cleared). Legacy rows are backfilled on
      // server start.
      if(filterStatus==="MeetingDone"){
        if(r.hadMeeting!==true) return false;
      } else if(filterStatus==="__noAgent"){
        // "No Agent" pseudo-filter: only DRs with empty/null agentId.
        var naAid = r.agentId && r.agentId._id ? r.agentId._id : r.agentId;
        if (naAid) return false;
      } else if(r.status!==filterStatus) return false;
    }
    if(agentFilter){var aid=r.agentId&&r.agentId._id?r.agentId._id:r.agentId;if(aid!==agentFilter)return false;}
    return matchSearch(r,p.search);
  }).sort(function(a,b){
    if(sortBy==="lastActivity")return new Date(b.lastActivityTime||0)-new Date(a.lastActivityTime||0);
    if(sortBy==="newest")return new Date(b.createdAt||0)-new Date(a.createdAt||0);
    return 0;
  });

  var reqStatus=function(rid,st){
    setPendingStatus({leadId:rid,newStatus:st});setShowStatusComment(true);
  };
  var confirmStatus=async function(comment,cbTime,extra){
    if(!pendingStatus)return;
    if(!pendingStatus.leadId){alert("Error: request ID not found. Please refresh.");return;}
    try{
      var updateData={status:pendingStatus.newStatus};
      var fbParts=[];
      if(comment) fbParts.push(comment);
      if(cbTime) updateData.callbackTime=cbTime;
      if(comment) updateData.notes=comment;
      // Pass deal fields from StatusModal
      if(extra){
        if(extra.budget)    updateData.budget=extra.budget;
        if(extra.project)   updateData.project=extra.project;
        if(extra.unitType)  updateData.unitType=extra.unitType;
        if(extra.eoiDeposit) updateData.eoiDeposit=extra.eoiDeposit;
        if(extra.deposit){
          var paymentInfo="Down Payment: "+extra.deposit+" EGP | Installments: "+extra.instalment+" EGP";
          updateData.notes=(updateData.notes?updateData.notes+" | ":"")+paymentInfo;
          fbParts.push(paymentInfo);
        }
      }
      if(fbParts.length) updateData.lastFeedback=fbParts.join(" | ");
      var upd=await apiFetch("/api/daily-requests/"+pendingStatus.leadId,"PUT",updateData,p.token);
      // Also log separate activity with comment if exists
      if(comment||cbTime){
        var actNote2="Status: "+pendingStatus.newStatus;
        if(comment) actNote2+=" | "+comment;
        await apiFetch("/api/activities","POST",{leadId:pendingStatus.leadId,type:"status_change",note:actNote2},p.token);
      }
      setRequests(function(prev){return prev.map(function(r){return gid(r)===pendingStatus.leadId?upd:r;});});
      if(selected&&gid(selected)===pendingStatus.leadId)setSelected(upd);
      // Notify admin on DoneDeal or EOI
      if((pendingStatus.newStatus==="DoneDeal"||pendingStatus.newStatus==="EOI")&&p.addDealNotif){
        var req=requests.find(function(r){return gid(r)===pendingStatus.leadId;})||{};
        p.addDealNotif({
          leadId:pendingStatus.leadId,
          leadName:req.name||upd.name||"",
          agentName:req.agentId&&req.agentId.name?req.agentId.name:p.cu.name,
          status:pendingStatus.newStatus,
          budget:updateData.budget||req.budget||"",
          time:new Date().toISOString()
        });
        showBrowserNotif(
          pendingStatus.newStatus==="DoneDeal"?"🏆 New Deal!":"📋 New EOI!",
          (req.name||"leads")+" — "+(updateData.budget||req.budget||"")
        );
      }
      // The backend creates/updates a Lead mirror for DR→EOI/DoneDeal, but the
      // mirror isn't in p.leads yet. Refetch so the EOI/Deals page sees it.
      if(pendingStatus.newStatus==="DoneDeal"||pendingStatus.newStatus==="EOI"){
        try{var freshLeads=await apiFetch("/api/leads?page=1&limit=1000","GET",null,p.token);if(freshLeads&&freshLeads.data)p.setLeads(freshLeads.data);}catch(e){}
      }
      if(pendingStatus.newStatus==="DoneDeal") p.nav("deals");
      else if(pendingStatus.newStatus==="EOI") p.nav("eoi");
    }catch(e){alert(e.message);}
    setShowStatusComment(false);setPendingStatus(null);setStatusDrop(null);
  };

  var [drHistory,setDrHistory]=useState({});

  var openDrHistory=async function(r){
    setDrHistoryReq(r); setShowDrHistory(true); setDrHistoryList([]); setDrHistoryLoading(true);
    try{
      var acts=await apiFetch("/api/daily-requests/"+gid(r)+"/history","GET",null,p.token);
      setDrHistoryList(acts||[]);
      var rid=gid(r);
      setDrHistory(function(prev){var upd={};upd[rid]=acts||[];return Object.assign({},prev,upd);});
    }catch(e){setDrHistoryList([]);}
    setDrHistoryLoading(false);
  };

  var loadDrHistory=async function(rid){
    try{
      var acts=await apiFetch("/api/daily-requests/"+rid+"/history","GET",null,p.token);
      setDrHistory(function(prev){var upd={};upd[rid]=acts||[];return Object.assign({},prev,upd);});
    }catch(e){}
  };

  var logActivity=async function(){
    if(!actNote.trim()||!selected)return;
    setActSaving(true);
    try{
      var act=await apiFetch("/api/activities","POST",{leadId:gid(selected),type:actType,note:actNote},p.token);
      await apiFetch("/api/daily-requests/"+gid(selected),"PUT",{lastActivityTime:new Date()},p.token);
      setRequests(function(prev){return prev.map(function(r){return gid(r)===gid(selected)?Object.assign({},r,{lastActivityTime:new Date().toISOString()}):r;});});
      var rid=gid(selected);
      setDrHistory(function(prev){var upd={};upd[rid]=[act].concat(prev[rid]||[]);return Object.assign({},prev,upd);});
      setActNote(""); setShowActForm(false);
    }catch(e){}
    setActSaving(false);
  };

  var addReq=async function(){
    if(!form.name||!form.phone)return;
    if(!form.area.trim()){alert("Area is required");return;}
    var isEOI      = form.status==="EOI";
    var isDoneDeal = form.status==="DoneDeal";
    var dealLike   = isEOI||isDoneDeal;
    if(!dealLike){
      if(!form.callbackTime){alert("Callback is required");return;}
      if(!form.notes.trim()){alert("Feedback is required");return;}
      if(!form.budget.trim()){alert("Budget is required");return;}
    } else {
      if(!(form.dealBudget||"").trim()){alert("Amount is required");return;}
    }
    setSaving(true);
    try{
      var drAgentId=form.agentId||"";
      // For EOI / DoneDeal, the server's POST handler doesn't build the Lead
      // mirror — only the PUT status-transition path does. Create the DR as
      // NewLead first, then PUT the target status so the existing mirror
      // logic fires and the row shows up on the EOI / Deals pages.
      var initialStatus = dealLike ? "NewLead" : (form.status||"NewLead");
      var initialBudget = dealLike ? (form.dealBudget||"") : (form.budget||"");
      var submitData={
        name:form.name||"",
        phone:form.phone||"",
        phone2:form.phone2||"",
        propertyType: dealLike ? "" : (form.propertyType||""),
        area:form.area||"",
        budget:initialBudget,
        notes:form.notes||"",
        callbackTime:form.callbackTime||"",
        agentId:drAgentId,
        source:"Daily Request",
        status:initialStatus
      };
      var r=await apiFetch("/api/daily-requests","POST",submitData,p.token);
      if(dealLike){
        var upData={
          status: form.status,
          budget: form.dealBudget||"",
          project: form.dealProject||""
        };
        if(form.dealUnitType) upData.unitType=form.dealUnitType;
        if(isEOI){
          if(form.eoiDeposit) upData.eoiDeposit=form.eoiDeposit;
          // Only stamp eoiDate on first transition. If the DR already carries one
          // (re-save on an existing record), preserve it so notifications don't reset.
          if(!r.eoiDate) upData.eoiDate = form.eoiDateInput ? new Date(form.eoiDateInput).toISOString() : new Date().toISOString();
        }
        if(isDoneDeal && !r.dealDate) upData.dealDate = new Date().toISOString().slice(0,10);
        r = await apiFetch("/api/daily-requests/"+gid(r),"PUT",upData,p.token);
        // Upload any attached documents (EOI or DoneDeal) against the Lead mirror the PUT just built.
        if((isEOI||isDoneDeal) && Array.isArray(form.eoiDocFiles) && form.eoiDocFiles.length>0){
          try {
            var leadsResp = await apiFetch("/api/leads?page=1&limit=1000","GET",null,p.token);
            var mirrorLead = (leadsResp&&leadsResp.data||[]).find(function(l){return l.phone===r.phone && l.source==="Daily Request";});
            if(mirrorLead){
              for(var di=0;di<form.eoiDocFiles.length;di++){
                var ff = form.eoiDocFiles[di];
                if(!ff||!ff.fileData) continue;
                try { await apiFetch("/api/leads/"+gid(mirrorLead)+"/eoi-documents","POST",{fileData:ff.fileData,fileName:ff.fileName||""},p.token); }
                catch(docErr){ console.error("Document upload failed:", docErr.message); }
              }
            }
          } catch(lookupErr){ console.error("Mirror lookup failed:", lookupErr.message); }
        }
        // Refresh the leads list so the EOI / Deals page picks up the mirror.
        try { var fresh=await apiFetch("/api/leads?page=1&limit=1000","GET",null,p.token); if(fresh&&fresh.data) p.setLeads(fresh.data); } catch(freshErr){}
        if(p.addDealNotif){
          p.addDealNotif({
            leadId:gid(r),
            leadName:r.name||"",
            agentName:(r.agentId&&r.agentId.name)?r.agentId.name:p.cu.name,
            status:form.status,
            budget:form.dealBudget||"",
            time:new Date().toISOString()
          });
          showBrowserNotif(
            isDoneDeal?"🏆 New Deal!":"📋 New EOI!",
            (r.name||"lead")+" — "+(form.dealBudget||"")
          );
        }
      }
      // Dedupe by _id — the backend also broadcasts a dr_updated WS event for
      // the same insert, and if it races this prepend we'd end up with two
      // rows in local state until the next refresh.
      setRequests(function(prev){
        var nid=String(r&&r._id||"");
        if(!nid) return [r].concat(prev);
        if(prev.some(function(x){return gid(x)===nid;})) return prev.map(function(x){return gid(x)===nid?r:x;});
        return [r].concat(prev);
      });
      setShowAdd(false);
      setForm({name:"",phone:"",phone2:"",propertyType:"",area:"",budget:"",notes:"",agentId:"",callbackTime:"",status:"NewLead",dealProject:"",dealUnitType:"",dealBudget:"",eoiDeposit:"",eoiDateInput:"",eoiDocFiles:[]});
      if(isDoneDeal) p.nav("deals");
      else if(isEOI) p.nav("eoi");
    }catch(e){alert(e.message);}setSaving(false);
  };

  var getAgentName=function(r){if(!r.agentId)return"-";if(r.agentId.name)return r.agentId.name;var u=p.users.find(function(x){return gid(x)===r.agentId;});return u?u.name:"-";};

  return <div style={{ padding:"18px 16px 40px" }}>
    <StatusModal show={showStatusComment} t={t} newStatus={pendingStatus?pendingStatus.newStatus:null} lead={selected} cu={p.cu} users={p.users} onClose={function(){setShowStatusComment(false);}} onConfirm={confirmStatus}/>
    {statusDrop&&<div style={{ position:"fixed", inset:0, zIndex:499 }} onClick={function(){setStatusDrop(null);}}/>}

    {/* Stats */}
    <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
      <StatCard icon={ClipboardList} label={"Total Numbers"} value={requests.length+""} c={C.info}/>
      <StatCard icon={Target} label={"Potential"} value={requests.filter(function(r){return r.status==="Potential";}).length+""} c={"#1D4ED8"}/>
      <StatCard icon={DollarSign} label={t.doneDeals} value={requests.filter(function(r){return r.status==="DoneDeal";}).length+""} c={C.success}/>
    </div>
    {/* Toolbar */}
    <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
      <Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:12 }}><Plus size={13}/> Add Number</Btn>
      {p.cu.role==="admin"&&<Btn outline onClick={function(){setShowBulk(true);}} style={{ padding:"7px 11px", fontSize:12, color:C.info, borderColor:C.info }}><RotateCcw size={13}/> Bulk Reassign {selected2.length>0?"("+selected2.length+")":""}</Btn>}
      {p.cu.role==="admin"&&selected2.length>0&&<Btn outline onClick={async function(){
        if(!window.confirm("Archive "+selected2.length+" requests?")) return;
        var ids=[...selected2];
        // Archive each selected DR via the dedicated endpoint.
        for(var i=0;i<ids.length;i++){
          try{ await apiFetch("/api/daily-requests/"+ids[i]+"/archive","PUT",null,p.token); }
          catch(e){ /* swallow — continue archiving the rest */ }
        }
        // Drop archived DRs from the list immediately
        setRequests(function(prev){return prev.filter(function(r){return !ids.includes(gid(r));});});
        setSelected2([]);
        if(selected&&ids.includes(gid(selected)))setSelected(null);
      }} style={{ padding:"7px 11px", fontSize:12, color:C.warning, borderColor:C.warning }}><Archive size={13}/> Archive ({selected2.length})</Btn>}
      {p.cu.role==="admin"&&<Btn outline onClick={async function(){var XLSX=await new Promise(function(res){if(window.XLSX){res(window.XLSX);return;}var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";s.onload=function(){res(window.XLSX);};document.head.appendChild(s);});var rows=filtered.map(function(r){return{"Name":r.name,"Phone":r.phone,"Phone2":r.phone2||"","Property Type":r.propertyType||"","Location":r.area||"","Budget":r.budget||"","Status":r.status||"","Agent":r.agentId&&r.agentId.name?r.agentId.name:"","Callback":r.callbackTime||"","Last Activity":r.lastActivityTime?new Date(r.lastActivityTime).toLocaleDateString("en-GB"):"","Notes":r.notes||""};});var ws=XLSX.utils.json_to_sheet(rows);var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Daily Requests");XLSX.writeFile(wb,"daily_requests_"+new Date().toISOString().slice(0,10)+".xlsx");}} style={{ padding:"7px 11px", fontSize:12, color:C.success, borderColor:C.success }}><FileSpreadsheet size={13}/> Export Excel</Btn>}
    </div>

    {/* Filters */}
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
      {[{v:"all",l:t.all}].concat(sc.map(function(s){return{v:s.value,l:s.label};})).map(function(s){
        var cnt=s.v==="all"
          ? requests.length
          : s.v==="MeetingDone"
            ? requests.filter(function(r){return r.hadMeeting===true;}).length
            : requests.filter(function(r){return r.status===s.v;}).length;
        return <button key={s.v} onClick={function(){setFilterStatus(s.v);}} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid", borderColor:filterStatus===s.v?C.accent:"#E8ECF1", background:filterStatus===s.v?C.accent+"12":"#fff", color:filterStatus===s.v?C.accent:C.textLight, fontSize:11, fontWeight:500, cursor:"pointer" }}>{s.l} ({cnt})</button>;
      })}
      {/* No Agent — pseudo-filter; toggles off when re-clicked or when any other filter is chosen. */}
      {(function(){
        var noAgentCount = requests.filter(function(r){var a=r.agentId&&r.agentId._id?r.agentId._id:r.agentId; return !a;}).length;
        var on = filterStatus==="__noAgent";
        return <button key="__noAgent" onClick={function(){setFilterStatus(on?"all":"__noAgent");}} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid", borderColor:on?"#DC2626":"#E8ECF1", background:on?"#FEE2E2":"#fff", color:on?"#991B1B":C.textLight, fontSize:11, fontWeight:600, cursor:"pointer" }} title="Show only requests with no agent assigned">👤 No Agent ({noAgentCount})</button>;
      })()}
    </div>
    <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
      {isAdmin&&<select value={agentFilter} onChange={function(e){setAgentFilter(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
        <option value="">👤 All Agents</option>
        {salesUsers.map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name}</option>;})}
      </select>}
      <select value={sortBy} onChange={function(e){setSortBy(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
        <option value="lastActivity">⏱ Last Activity</option>
        <option value="newest">🆕 Newest</option>
      </select>
    </div>

    <div style={{ display:"flex", gap:14, paddingRight:!p.isMobile&&selected?330:0, transition:"padding-right 0.25s" }}>
      <Card style={{ flex:1, padding:0, overflow:"hidden", minWidth:0 }}>
        {loading?<Loader/>:p.isMobile?<div style={{ display:"flex", flexDirection:"column", gap:12, padding:"12px", maxWidth:500, margin:"0 auto" }}>
          {filtered.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight }}>No requests</div>}
          {selected&&<div ref={drPanelRef} style={{ position:"fixed", inset:0, zIndex:300, background:"#fff", overflowY:"auto" }}>
            {/* Mobile detail panel - same as leads */}
            <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:"16px 16px 20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <button onClick={function(){setSelected(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", color:"#fff", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
                <div style={{ textAlign:"center", flex:1 }}>
                  <div style={{ color:"#fff", fontSize:16, fontWeight:700 }}>{selected.name}</div>
                  <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, direction:"ltr" }}>{selected.phone}</div>
                </div>
                <div style={{ width:32 }}/>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:14 }}>
                <a href={"tel:"+cleanPhone(selected.phone)} style={{ flex:1, padding:"10px", borderRadius:10, background:"#EFF6FF", color:"#1D4ED8", fontSize:13, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Phone size={14} color="#1D4ED8"/> Call</a>
                <a href={"https://wa.me/"+waPhone(selected.phone)} target="_blank" rel="noreferrer" style={{ flex:1, padding:"10px", borderRadius:10, background:"#DCFCE7", color:"#15803D", fontSize:13, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><svg viewBox="0 0 24 24" width="13" height="13" fill="#15803D"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp</a>
              </div>
            </div>
            <div style={{ padding:"16px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[{l:"Property Type",v:selected.propertyType,icon:"🏠"},{l:"Location",v:selected.area,icon:"📍"},{l:"Budget",v:selected.budget,icon:"💰"},{l:"Agent",v:getAgentName(selected),icon:"👤"},{l:"Callback",v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):null,icon:"📞"},{l:"Last Activity",v:timeAgo(selected.lastActivityTime,t),icon:"🕐"}].map(function(f){return f.v?<div key={f.l} style={{ background:"#F8FAFC", borderRadius:12, padding:"12px 14px", border:"1px solid #E8ECF1" }}>
                  <div style={{ fontSize:10, color:C.textLight, marginBottom:4, fontWeight:600 }}>{f.icon} {f.l}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{f.v}</div>
                </div>:null;})}
              </div>
              {selected.notes&&<div style={{ background:"#FFFBEB", borderRadius:12, padding:"12px 14px", border:"1px solid #FDE68A", marginBottom:16 }}>
                <div style={{ fontSize:10, color:"#92400E", fontWeight:600, marginBottom:4 }}>📝 Notes</div>
                <div style={{ fontSize:13, color:C.text }}>{selected.notes}</div>
              </div>}
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.textLight, marginBottom:8 }}>Change Status</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {sc.map(function(s){return <button key={s.value} onClick={function(){reqStatus(gid(selected),s.value);}} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid", borderColor:selected.status===s.value?s.color:"#E2E8F0", background:selected.status===s.value?s.bg:"#fff", color:selected.status===s.value?s.color:C.textLight, fontSize:11, fontWeight:600, cursor:"pointer" }}>{s.label}</button>;})}
                </div>
              </div>
            </div>
          </div>}
          {filtered.map(function(r){
            var rid=gid(r); var so=sc.find(function(s){return s.value===r.status;})||sc[0];
            var lastAct=r.lastActivityTime?timeAgo(r.lastActivityTime,t):"—";
            var actColor=(Date.now()-new Date(r.lastActivityTime||0).getTime())>3*24*60*60*1000?C.danger:C.accent;
            var borderCol=so.color||"#E8ECF1";
            return <div key={rid} onClick={function(){setSelected(r);loadDrHistory(rid);window.scrollTo({top:0,behavior:"smooth"});}}
              style={{ background:"#fff", borderRadius:16, padding:"16px", border:"2px solid "+borderCol, cursor:"pointer", boxShadow:"0 3px 12px "+borderCol+"35" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:2 }}>{r.name}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text, direction:"ltr" }}><PhoneCell phone={r.phone}/></div>
                  {r.phone2&&<div style={{ fontSize:11, fontWeight:700, color:C.textLight, direction:"ltr" }}><PhoneCell phone={r.phone2}/></div>}
                  {(function(){var agName=r.agentId&&r.agentId.name?r.agentId.name:"";return agName?<div style={{ fontSize:11, color:C.accent, fontWeight:600, marginTop:2 }}>👤 {agName}</div>:null;})()}
                </div>
                <span style={{ background:so.bg, color:so.color, padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:700, whiteSpace:"nowrap", marginLeft:8 }}>{so.label}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {r.area&&<span style={{ fontSize:11, color:"#6D28D9", fontWeight:700, background:"#EDE9FE", padding:"2px 8px", borderRadius:6 }}>📍 {r.area}</span>}
                  {r.budget&&<span style={{ fontSize:11, color:C.success, fontWeight:700 }}>💰 {r.budget}</span>}
                </div>
                <span style={{ fontSize:11, color:actColor, fontWeight:600 }}>🕐 {lastAct}</span>
              </div>
              {/* Last Feedback */}
              {(r.lastFeedback||r.notes)&&<div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:8, padding:"6px 10px", background:"#F8FAFC", borderRadius:8, borderLeft:"3px solid "+C.accent }}>💬 {r.lastFeedback||r.notes}</div>}
              {/* Callback time */}
              {r.callbackTime&&(function(){var ci=callbackColor(r.callbackTime);return <div style={{ fontSize:11, fontWeight:600, color:ci?ci.color:C.textLight, marginBottom:8, padding:"4px 10px", background:ci?ci.bg:"#F8FAFC", borderRadius:8 }}>📞 {r.callbackTime.slice(0,16).replace("T"," ")}</div>;})()}
              <div style={{ display:"flex", gap:8 }}>
                <a href={"tel:"+cleanPhone(r.phone)} onClick={function(e){e.stopPropagation();}} style={{ flex:1, padding:"10px", borderRadius:10, background:"#EFF6FF", color:"#1D4ED8", fontSize:13, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:5, border:"1px solid #BFDBFE" }}><Phone size={13} color="#1D4ED8"/> Call</a>
                <a href={"https://wa.me/"+waPhone(r.phone)} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ flex:1, padding:"10px", borderRadius:10, background:"#DCFCE7", color:"#15803D", fontSize:13, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:5, border:"1px solid #22C55E60" }}><svg viewBox="0 0 24 24" width="13" height="13" fill="#15803D"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp</a>
                <button onClick={function(e){e.stopPropagation();openDrHistory(r);}} style={{ padding:"10px 14px", borderRadius:10, background:"#F3E8FF", color:"#7C3AED", fontSize:13, fontWeight:700, border:"1px solid #DDD6FE", cursor:"pointer" }}>📋</button>
              </div>
              {/* Mobile History */}
              {selected&&gid(selected)===rid&&<div onClick={function(e){e.stopPropagation();}} style={{ marginTop:10 }}>
                {(function(){
                  var history=drHistory[rid]||[];
                  if(!history.length) return null;
                  return <div style={{ marginTop:10 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:6 }}>📋 History ({history.length})</div>
                    {history.map(function(a){
                      var who=a.userId&&a.userId.name?a.userId.name:"";
                      var icon=a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":"📝";
                      return <div key={String(a._id||Math.random())} style={{ padding:"8px 10px", background:"#F8FAFC", borderRadius:9, marginBottom:6, borderLeft:"3px solid "+C.accent }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                          <span style={{ fontSize:10, fontWeight:700 }}>{icon} {who}</span>
                          <span style={{ fontSize:9, color:C.textLight }}>{timeAgo(a.createdAt,t)}</span>
                        </div>
                        {a.note&&<div style={{ fontSize:11, color:C.textLight }}>{a.note}</div>}
                      </div>;
                    })}
                  </div>;
                })()}
              </div>}
            </div>;
          })}
        </div>:<div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
              {p.cu.role==="admin"&&<th style={{ padding:"10px 8px", width:32 }}><input type="checkbox" onChange={function(e){setSelected2(e.target.checked?filtered.map(function(r){return gid(r);}):[]);}}/></th>}
              {["Name","Phone","Property Type","Location","Budget","Status","Last Feedback",isAdmin&&"Agent","Last Activity","Callback"].filter(Boolean).map(function(h){return <th key={h} style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:700, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={10} style={{ padding:40, textAlign:"center", color:C.textLight }}>No requests</td></tr>}
              {filtered.map(function(r){
                var rid=gid(r); var so=sc.find(function(s){return s.value===r.status;})||sc[0]; var isSel=selected&&gid(selected)===rid;
                var ci=callbackColor(r.callbackTime); var isChk=selected2.includes(rid);
                return <tr key={rid} onClick={function(){setSelected(r);loadDrHistory(rid);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isChk?"#EFF6FF":isSel?"#EFF6FF":"transparent", borderRight:"3px solid "+(isSel?C.accent:"transparent") }}>
                  {p.cu.role==="admin"&&<td style={{ padding:"10px 8px" }} onClick={function(e){e.stopPropagation();}}><input type="checkbox" checked={isChk} onChange={function(e){setSelected2(function(prev){return e.target.checked?prev.concat(rid):prev.filter(function(x){return x!==rid;});});}}/></td>}
                  <td style={{ padding:"10px 12px" }}><div style={{ fontSize:13, fontWeight:600 }}>{r.name}</div><div style={{ fontSize:10, color:C.textLight }}>{r.email}</div></td>
                  <td style={{ padding:"10px 12px", fontSize:12, direction:"ltr" }}>
                    <PhoneCell phone={r.phone}/>{r.phone2&&<div style={{ fontSize:10, color:C.textLight }}><PhoneCell phone={r.phone2}/></div>}
                    <div style={{ display:"flex", gap:6, marginTop:3 }}>
                      <a href={"tel:"+cleanPhone(r.phone)} onClick={function(e){e.stopPropagation();}} style={{ fontSize:p.isMobile?10:12, color:"#60A5FA", textDecoration:"none", display:"flex", alignItems:"center", gap:3, padding:p.isMobile?"0":"2px 6px", borderRadius:6, background:p.isMobile?"transparent":"#EFF6FF" }}><Phone size={p.isMobile?9:12}/>{!p.isMobile&&" Call"}</a>
                      <a href={"https://wa.me/"+waPhone(r.phone)} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ fontSize:p.isMobile?10:12, color:"#25D366", textDecoration:"none", display:"flex", alignItems:"center", gap:3, padding:p.isMobile?"0":"2px 6px", borderRadius:6, background:p.isMobile?"transparent":"#DCFCE720" }}><svg viewBox="0 0 24 24" width={p.isMobile?14:16} height={p.isMobile?14:16} fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>{!p.isMobile&&" WhatsApp"}</a>
                    </div>
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.textLight }}>{r.propertyType||"-"}</td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.textLight }}>{r.area||"-"}</td>
                  <td style={{ padding:"10px 12px", fontSize:12, fontWeight:600, color:C.success }}>{r.budget||"-"}</td>
                  <td style={{ padding:"10px 12px", position:"relative" }} onClick={function(e){e.stopPropagation();}}>
                    <span style={{ background:so.bg, color:so.color, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600, border:"1px dashed "+so.color, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4 }}
                      onClick={function(e){e.stopPropagation();setStatusDrop(statusDrop===rid?null:rid);}}>
                      {so.label} ▼
                    </span>
                    {statusDrop===rid&&<div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:500, background:"#fff", borderRadius:14, padding:8, minWidth:180, boxShadow:"0 16px 48px rgba(0,0,0,0.22)", border:"1px solid #E8ECF1" }} onClick={function(e){e.stopPropagation();}}>
                      <div style={{ fontSize:12, fontWeight:600, color:C.textLight, padding:"6px 10px 10px", borderBottom:"1px solid #F1F5F9", marginBottom:4 }}>{t.changeStatus}</div>
                      {sc.map(function(s){return <div key={s.value} onClick={function(e){e.stopPropagation();setSelected(r);reqStatus(rid,s.value);setStatusDrop(null);}} style={{ padding:"9px 12px", borderRadius:9, cursor:"pointer", display:"flex", alignItems:"center", gap:10, background:r.status===s.value?s.bg:"transparent", fontSize:13 }}
                        onMouseEnter={function(e){if(r.status!==s.value)e.currentTarget.style.background="#F8FAFC";}}
                        onMouseLeave={function(e){if(r.status!==s.value)e.currentTarget.style.background=r.status===s.value?s.bg:"transparent";}}>
                        <span style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0 }}/><span style={{ color:s.color, fontWeight:600 }}>{s.label}</span>
                      </div>;})}
                      <div style={{ borderTop:"1px solid #F1F5F9", marginTop:4, paddingTop:4 }}><button onClick={function(){setStatusDrop(null);}} style={{ width:"100%", padding:"7px", borderRadius:8, border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:12 }}>{t.cancel}</button></div>
                    </div>}
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:13, fontWeight:700, color:C.text, maxWidth:220, wordBreak:"break-word", whiteSpace:"normal", lineHeight:1.4 }}>{r.lastFeedback||r.notes||<span style={{color:"#CBD5E1", fontWeight:400}}>-</span>}</td>
                  {isAdmin&&<td style={{ padding:"10px 12px", fontSize:11, color:C.textLight }} onClick={function(e){e.stopPropagation();}}>
                    <select value={r.agentId&&r.agentId._id?r.agentId._id:(r.agentId||"")} onChange={async function(e){
                      var newAgent=e.target.value;
                      try{var upd=await apiFetch("/api/daily-requests/"+rid,"PUT",{agentId:newAgent},p.token);setRequests(function(prev){return prev.map(function(x){return gid(x)===rid?upd:x;});});if(selected&&gid(selected)===rid)setSelected(upd);}catch(ex){}
                    }} style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", maxWidth:110 }}>
                      {isOnlyAdmin&&<option value="">— No Agent —</option>}
                      {(isOnlyAdmin?salesUsers:(p.myTeamUsers||salesUsers).filter(function(u){return u.role==="sales"||u.role==="team_leader";})).map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name}</option>;})}
                    </select>
                  </td>}
                  <td style={{ padding:"10px 12px", fontSize:11, color:C.accent }}>{timeAgo(r.lastActivityTime,t)}</td>
                  <td style={{ padding:"10px 12px", fontSize:11 }}>
                    {r.callbackTime?<span style={{ padding:"2px 8px", borderRadius:12, background:ci?ci.bg:"transparent", color:ci?ci.color:C.textLight, fontSize:10, fontWeight:ci?600:400 }}>{r.callbackTime.slice(0,16).replace("T"," ")}</span>:<span style={{ color:C.textLight }}>-</span>}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
      </Card>

      {/* Side Panel */}
      {selected&&<Card innerRef={drPanelRef} style={p.isMobile?{ position:"fixed", inset:0, zIndex:300, borderRadius:0, overflowY:"auto", padding:0, margin:0 }:{ position:"fixed", top:0, right:0, bottom:0, width:320, zIndex:300, borderRadius:0, overflowY:"auto", padding:0, boxShadow:"-4px 0 24px rgba(0,0,0,0.12)" }}>
        <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <button onClick={function(){setSelected(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><X size={11}/></button>
            <button onClick={function(){openDrHistory(selected);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }} title="History">📋</button>
          </div>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{selected.name}</div>
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:2 }}>{selected.phone}{selected.phone2?" / "+selected.phone2:""}</div>
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            <a href={"tel:"+cleanPhone(selected.phone)} style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(34,197,94,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><Phone size={12}/> Call</a>
            <a href={"https://wa.me/"+waPhone(selected.phone)} target="_blank" rel="noreferrer" style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(37,211,102,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp</a>
          </div>
        </div>
        <div style={{ padding:"12px 14px" }}>
          <div style={{ marginBottom:12, padding:10, background:"#F8FAFC", borderRadius:10 }}>
            <div style={{ fontSize:11, color:C.textLight, marginBottom:7, fontWeight:600 }}>{t.changeStatus}</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {sc.map(function(s){return <button key={s.value} onClick={function(){reqStatus(gid(selected),s.value);}} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid", borderColor:selected.status===s.value?s.color:"#E2E8F0", background:selected.status===s.value?s.bg:"#fff", color:selected.status===s.value?s.color:C.textLight, fontSize:10, fontWeight:600, cursor:"pointer" }}>{s.label}</button>;})}
            </div>
          </div>
          {[{l:"Property Type",v:selected.propertyType},{l:"Location",v:selected.area},{l:"Budget",v:selected.budget},{l:t.agent,v:getAgentName(selected)},{l:t.callbackTime,v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):"-"},{l:t.lastActivity,v:timeAgo(selected.lastActivityTime,t)},{l:"Date Added",v:isOnlyAdmin?selected.createdAt?new Date(selected.createdAt).toLocaleDateString("en-GB"):"-":null},{l:t.notes,v:selected.notes}].map(function(f){
            return f.v?<div key={f.l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F1F5F9", gap:8 }}><span style={{ fontSize:11, color:C.textLight, flexShrink:0 }}>{f.l}</span><span style={{ fontSize:11, fontWeight:500, textAlign:"right" }}>{f.v}</span></div>:null;
          })}


          {/* Feedback History */}
          {(function(){
            var sid = gid(selected);
            var history = drHistory[sid]||[];
            if(!history.length) return <div style={{ marginTop:14, fontSize:11, color:C.textLight, textAlign:"center" }}>No history yet</div>;
            return <div style={{ marginTop:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>📋 History ({history.length})</div>
              {history.map(function(a){
                var who=a.userId&&a.userId.name?a.userId.name:"";
                var icon=a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":"📝";
                return <div key={String(a._id||a.id||Math.random())} style={{ padding:"8px 10px", background:"#F8FAFC", borderRadius:9, marginBottom:6, borderLeft:"3px solid "+C.accent }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:C.text }}>{icon} {who}</span>
                    <span style={{ fontSize:9, color:C.textLight }}>{timeAgo(a.createdAt,t)}</span>
                  </div>
                  {a.note&&<div style={{ fontSize:11, color:C.textLight }}>{a.note}</div>}
                </div>;
              })}
            </div>;
          })()}
        </div>
      </Card>}
    </div>

    {/* DR History Modal */}
    {showDrHistory&&drHistoryReq&&<Modal show={true} onClose={function(){setShowDrHistory(false);setDrHistoryReq(null);}} title={"📋 History — "+drHistoryReq.name} w={520}>
      {drHistoryLoading&&<div style={{ textAlign:"center", padding:30, color:C.textLight }}>Loading...</div>}
      {!drHistoryLoading&&drHistoryList.length===0&&<div style={{ textAlign:"center", padding:30, color:C.textLight }}>No history yet</div>}
      {!drHistoryLoading&&drHistoryList.length>0&&<div style={{ maxHeight:400, overflowY:"auto" }}>
        {drHistoryList.map(function(a,i){
          var uname=a.userId&&a.userId.name?a.userId.name:"";
          return <div key={a._id||i} style={{ padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":a.type==="note"?"📝":"🔔"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:C.text }}>{a.note}</div>
                <div style={{ fontSize:10, color:C.textLight, marginTop:3, display:"flex", gap:8 }}>
                  {uname&&<span style={{ fontWeight:600, color:C.accent }}>{uname}</span>}
                  <span>{a.createdAt?new Date(a.createdAt).toLocaleDateString("en-GB")+" — "+new Date(a.createdAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):""}</span>
                </div>
              </div>
            </div>
          </div>;
        })}
      </div>}
    </Modal>}

    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={"➕ Add New Number"}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
        <div style={{ gridColumn:"1/-1" }}><Inp label={"Name"} req value={form.name} onChange={function(e){setForm(function(f){return Object.assign({},f,{name:e.target.value});})}}/></div>
        <Inp label={"Phone"} req value={form.phone} onChange={function(e){setForm(function(f){return Object.assign({},f,{phone:e.target.value});})}} placeholder=""/>
        <Inp label={"Alt. Phone"} value={form.phone2} onChange={function(e){setForm(function(f){return Object.assign({},f,{phone2:e.target.value});})}} placeholder=""/>
        {form.status!=="EOI"&&form.status!=="DoneDeal"&&<Inp label={"Property Type"} type="select" value={form.propertyType} onChange={function(e){setForm(function(f){return Object.assign({},f,{propertyType:e.target.value});})}} options={[""].concat(PROP_TYPES).map(function(x){return{value:x,label:x||"- Select -"};})}/>}
        <Inp label={"Location"} req value={form.area} onChange={function(e){setForm(function(f){return Object.assign({},f,{area:e.target.value});})}} placeholder=""/>
        {form.status!=="EOI"&&form.status!=="DoneDeal"&&<div style={{ gridColumn:"1/-1" }}><Inp label={"Budget"} req value={form.budget} onChange={function(e){setForm(function(f){return Object.assign({},f,{budget:(function(){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");return r?Number(r).toLocaleString():"";})()});})}}/></div>}
      </div>
      {isAdmin&&<Inp label={t.agent} type="select" value={form.agentId} onChange={function(e){setForm(function(f){return Object.assign({},f,{agentId:e.target.value});})}} options={[{value:"",label:"- Select -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name};}))}/>}
      <Inp label={t.status+" *"} req type="select" value={form.status||"NewLead"} onChange={function(e){setForm(function(f){return Object.assign({},f,{status:e.target.value});})}} options={sc.map(function(s){return{value:s.value,label:s.label};})}/>
      {(form.status==="EOI"||form.status==="DoneDeal")&&<div>
        <Inp label={"🏠 Project"} value={form.dealProject} onChange={function(e){setForm(function(f){return Object.assign({},f,{dealProject:e.target.value});})}}/>
        <Inp label={"🏷️ Unit Type"} type="select" value={form.dealUnitType} onChange={function(e){setForm(function(f){return Object.assign({},f,{dealUnitType:e.target.value});})}} options={["","Apartment","Duplex","Townhouse","Twinhouse","Standalone","Commercial","Admin","Clinic","Service Apartment","Chalet"].map(function(x){return{value:x,label:x||"- Select -"};})}/>
        <Inp label={"💰 Amount (EGP) *"} req value={form.dealBudget} onChange={function(e){setForm(function(f){return Object.assign({},f,{dealBudget:(function(){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");return r?Number(r).toLocaleString():"";})()});})}}/>
        {form.status==="EOI"&&<Inp label={"📅 EOI Date"} type="date" value={form.eoiDateInput} onChange={function(e){setForm(function(f){return Object.assign({},f,{eoiDateInput:e.target.value});})}}/>}
        {form.status==="EOI"&&<Inp label={"💵 Deposit (EGP)"} value={form.eoiDeposit} onChange={function(e){setForm(function(f){return Object.assign({},f,{eoiDeposit:(function(){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");return r?Number(r).toLocaleString():"";})()});})}}/>}
        <DocumentsUpload
          files={form.eoiDocFiles||[]}
          onChange={function(next){setForm(function(f){return Object.assign({},f,{eoiDocFiles:next});});}}
          label={form.status==="EOI"?"📎 Upload EOI Documents":"📎 Upload Deal Documents"}
          wrapperStyle={{ marginBottom:13 }}
        />
      </div>}
      {form.status!=="EOI"&&form.status!=="DoneDeal"&&<Inp label={t.callbackTime} req type="datetime-local" value={form.callbackTime} onChange={function(e){setForm(function(f){return Object.assign({},f,{callbackTime:e.target.value});})}}/>}
      {form.status==="EOI"||form.status==="DoneDeal"
        ? <Inp label={"Feedback"} type="textarea" value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});})}}/>
        : <Inp label={"Feedback *"} req type="textarea" value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});})}}/>}
      <div style={{ display:"flex", gap:10 }}><Btn outline onClick={function(){setShowAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn><Btn onClick={addReq} loading={saving} style={{ flex:1 }}>Add Number</Btn></div>
    </Modal>
    <Modal show={showBulk} onClose={function(){setShowBulk(false);}} title={"Bulk Reassign"}>
      {selected2.length===0
        ?<div style={{ padding:"16px", textAlign:"center", color:C.danger, fontSize:13 }}>⚠️ Please select leads first using the checkboxes</div>
        :<div>
          <div style={{ marginBottom:10, fontSize:13, color:C.textLight }}>{selected2.length} leads selected</div>
          <Inp label={"Reassign To"} type="select" value={bulkAgent} onChange={function(e){setBulkAgent(e.target.value);}} options={[{value:"",label:"- Select Agent -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name};}))}/>
          <div style={{ display:"flex", gap:10, marginTop:10 }}>
            <Btn onClick={async function(){
              if(!bulkAgent)return;
              try{
                await apiFetch("/api/daily-requests/bulk-reassign","PUT",{leadIds:selected2,agentId:bulkAgent},p.token,p.csrfToken);
                var agentUser=p.users.find(function(u){return gid(u)===bulkAgent;});
                setRequests(function(prev){return prev.map(function(r){return selected2.includes(gid(r))?Object.assign({},r,{agentId:{_id:bulkAgent,name:agentUser?agentUser.name:""}}):r;});});
                setSelected2([]);setShowBulk(false);setBulkAgent("");
              }catch(e){alert(e.message);}
            }} style={{ flex:1 }}>Bulk Reassign</Btn>
            <Btn outline onClick={function(){setShowBulk(false);}} style={{ flex:1 }}>{t.cancel}</Btn>
          </div>
        </div>
      }
    </Modal>
  </div>;
};

// ===== USERS =====
var JOB_TITLES = [
  { label:"Property Advisor",        role:"sales" },
  { label:"Property Consultant",     role:"sales" },
  { label:"Senior Sales",            role:"sales" },
  { label:"Supervisor",              role:"sales" },
  { label:"Team Leader",             role:"team_leader" },
  { label:"Sr. Team Leader",         role:"team_leader" },
  { label:"Associate Sales Manager", role:"manager" },
  { label:"Sales Manager",           role:"manager" },
  { label:"Sr. Sales Manager",       role:"manager" },
  { label:"Sales Director",          role:"director" }
];
var ROLE_FOR_TITLE = JOB_TITLES.reduce(function(a,j){ a[j.label]=j.role; return a; }, {});

var UsersPage = function(p) {
  var t=p.t; var isOnlyAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"; var [showAdd,setShowAdd]=useState(false); var [saving,setSaving]=useState(false);
  var [nU,setNU]=useState({name:"",username:"",password:"sales123",email:"",phone:"",role:"sales",title:"",monthlyTarget:15,teamId:"",teamName:"",startingDate:""});
  var [pwModal,setPwModal]=useState(null); // {userId, userName}
  var [pwForm,setPwForm]=useState({newPass:"",confirmPass:""});
  var [pwMsg,setPwMsg]=useState(""); var [pwSaving,setPwSaving]=useState(false);
  var [teamModal,setTeamModal]=useState(null); // {userId, userName, teamId, teamName, reportsTo}
  var [teamSaving,setTeamSaving]=useState(false);
  var [editModal,setEditModal]=useState(null); // {userId, userName, title, role}
  var [editSaving,setEditSaving]=useState(false);
  var saveUserEdit=async function(){
    if(!editModal)return; setEditSaving(true);
    try{
      var sd=editModal.startingDate||null;
      var upd=await apiFetch("/api/users/"+editModal.userId,"PUT",{title:editModal.title,role:editModal.role,startingDate:sd},p.token);
      p.setUsers(function(prev){return prev.map(function(x){return gid(x)===editModal.userId?Object.assign({},x,{title:editModal.title,role:editModal.role,startingDate:sd}):x;});});
      setEditModal(null);
    }catch(e){alert(e.message);} setEditSaving(false);
  };
  var saveTeam=async function(){
    if(!teamModal)return; setTeamSaving(true);
    try{
      var upd=await apiFetch("/api/users/"+teamModal.userId,"PUT",{teamId:teamModal.teamId,teamName:teamModal.teamName,reportsTo:teamModal.reportsTo||null},p.token);
      p.setUsers(function(prev){return prev.map(function(x){return gid(x)===teamModal.userId?Object.assign({},x,{teamId:teamModal.teamId,teamName:teamModal.teamName,reportsTo:teamModal.reportsTo||null}):x;});});
      setTeamModal(null);
    }catch(e){alert(e.message);} setTeamSaving(false);
  };
  var rc={admin:"#EF4444",sales_admin:"#E8A838",director:"#DC2626",manager:"#8B5CF6",team_leader:"#0EA5E9",sales:"#3B82F6",viewer:"#94A3B8"};
  var getManagerName=function(uid){var u=p.users.find(function(x){return gid(x)===String(uid||"");});return u?u.name:"";};
  var getRoleLabel=function(u){if(u.role==="manager"&&u.reportsTo)return "Team Leader";if(u.role==="manager")return "Manager";return u.role==="admin"?"Admin":"Sales";};
  var rl={admin:t.admin,sales_admin:"Sales Admin",director:"Sales Director",manager:t.salesManager,team_leader:"Team Leader",sales:t.salesAgent,viewer:t.viewer};
  var changePassword=async function(){if(!pwForm.newPass||!pwForm.confirmPass)return;if(pwForm.newPass!==pwForm.confirmPass){setPwMsg(t.passwordMismatch);return;}setPwSaving(true);try{await apiFetch("/api/users/"+pwModal.userId,"PUT",{password:pwForm.newPass},p.token);setPwMsg(t.passwordSuccess);setTimeout(function(){setPwModal(null);setPwMsg("");setPwForm({newPass:"",confirmPass:""});},1500);}catch(e){setPwMsg(t.passwordError);}setPwSaving(false);};
  var add=async function(){if(!nU.name||!nU.username)return;setSaving(true);try{var user=await apiFetch("/api/users","POST",nU,p.token);p.setUsers(function(prev){return prev.concat([user]);});setShowAdd(false);setNU({name:"",username:"",password:"sales123",email:"",phone:"",role:"sales",title:"",monthlyTarget:15});}catch(e){alert(e.message);}setSaving(false);};
  var toggleActive=async function(u){var uid=gid(u);try{var upd=await apiFetch("/api/users/"+uid,"PUT",{active:!u.active},p.token);p.setUsers(function(prev){return prev.map(function(x){return gid(x)===uid?upd:x;});});}catch(e){}};
  var del=async function(uid){if(!window.confirm(t.deleteConfirm))return;try{await apiFetch("/api/users/"+uid,"DELETE",null,p.token);p.setUsers(function(prev){return prev.filter(function(x){return gid(x)!==uid;});});}catch(e){alert(e.message);}};
  var updateTarget=async function(u,val){var uid=gid(u);try{await apiFetch("/api/users/"+uid,"PUT",{monthlyTarget:Number(val)},p.token);p.setUsers(function(prev){return prev.map(function(x){return gid(x)===uid?Object.assign({},x,{monthlyTarget:Number(val)}):x;});});}catch(e){}};
  var getQTargets=function(uid){
    var u=p.users.find(function(x){return gid(x)===uid;});
    if(u&&u.qTargets&&Object.keys(u.qTargets).length>0) return u.qTargets;
    try{return JSON.parse(localStorage.getItem("crm_qt_"+uid)||"{}");} catch(e){return {};}
  };
  var saveQTargets=async function(uid,qt){
    try{localStorage.setItem("crm_qt_"+uid,JSON.stringify(qt));}catch(e){}
    try{await apiFetch("/api/users/"+uid,"PUT",{qTargets:qt},p.token);}catch(e){console.error("saveQTargets error",e);}
    p.setUsers(function(prev){return prev.map(function(u){return gid(u)===uid?Object.assign({},u,{qTargets:qt}):u;});});
  };
  var [qtModal,setQtModal]=useState(null);

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{t.users} ({p.users.length})</h2>
      <Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><UserPlus size={14}/> {t.addUser}</Btn>
    </div>
    <Card p={0}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:580 }}>
      <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
        {[t.name,t.username,t.title,t.role,t.phone,"Quarterly Target","Last Seen","Starting Date",t.status,""].map(function(h){return <th key={h||"x"} style={{ textAlign:t.dir==="rtl"?"right":"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
      </tr></thead>
      <tbody>{p.users.map(function(u){var uid=gid(u);var displayName=u.username==="amgad"?"Amgad Mohamed":u.name;return <tr key={uid} style={{ borderBottom:"1px solid #F1F5F9" }}>
        <td style={{ padding:"11px 12px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:32, height:32, borderRadius:8, background:C.primary+"15", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:C.primary, flexShrink:0 }}>{displayName[0]}</div><div><div style={{ fontSize:12, fontWeight:600 }}>{displayName}</div><div style={{ fontSize:10, color:C.textLight }}>{u.email}</div></div></div></td>
        <td style={{ padding:"11px 12px", fontSize:12, fontFamily:"monospace" }}>{u.username}</td>
        <td style={{ padding:"11px 12px", fontSize:12 }}>{u.title}</td>
        <td style={{ padding:"11px 12px" }}><Badge bg={(rc[u.role]||"#94A3B8")+"15"} color={rc[u.role]||"#94A3B8"}>{rl[u.role]||u.role}</Badge></td>
        <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr" }}>{u.phone}</td>
        <td style={{ padding:"8px 12px" }}>
          {p.cu.role==="admin"
            ?<button onClick={function(){var qt=getQTargets(uid);setQtModal({user:u,targets:{Q1:qt.Q1||0,Q2:qt.Q2||0,Q3:qt.Q3||0,Q4:qt.Q4||0}});}}
                title="Quarterly Targets"
                style={{ padding:"3px 10px", borderRadius:6, border:"1px solid "+C.accent, background:C.accent+"10", color:C.accent, fontSize:11, fontWeight:700, cursor:"pointer" }}>Q</button>
            :<div style={{ display:"flex", gap:3 }}>
              {["Q1","Q2","Q3","Q4"].map(function(q){var qt=getQTargets(uid);var v=qt[q]||0;return <span key={q} style={{ fontSize:9, padding:"1px 4px", borderRadius:3, background:"#F1F5F9", color:C.textLight }}>{q}:{v>0?(v/1000000).toFixed(1)+"M":"—"}</span>;})}
            </div>}
        </td>
        <td style={{ padding:"11px 12px" }}>
          {(function(){
            var isOn=u.lastSeen&&(Date.now()-new Date(u.lastSeen).getTime())<3*60*1000;
            var ls=u.lastSeen?timeAgo(u.lastSeen,p.t):"—";
            return <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:isOn?"#22C55E":"#CBD5E1", flexShrink:0 }}/>
              <span style={{ fontSize:11, color:isOn?C.success:C.textLight, fontWeight:isOn?700:400 }}>{isOn?"Online":ls}</span>
            </div>;
          })()}
        </td>
        <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight, whiteSpace:"nowrap" }}>
          {(function(){
            if(!u.startingDate) return "—";
            var d=new Date(u.startingDate);
            if(isNaN(d.getTime())) return "—";
            return d.toLocaleDateString("en-GB");
          })()}
        </td>
        <td style={{ padding:"11px 12px" }}><Badge bg={u.active?"#DCFCE7":"#FEE2E2"} color={u.active?"#15803D":"#B91C1C"} onClick={function(){if(u.role!=="admin")toggleActive(u);}}>{u.active?t.active:t.inactive}</Badge></td>
        <td style={{ padding:"11px 12px" }}><div style={{display:"flex",gap:6,alignItems:"center"}}><button onClick={function(){setPwModal({userId:uid,userName:displayName});setPwForm({newPass:"",confirmPass:""});setPwMsg("");}} disabled={p.cu.role==="sales_admin"&&u.role==="admin"} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:p.cu.role==="sales_admin"&&u.role==="admin"?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:p.cu.role==="sales_admin"&&u.role==="admin"?0.3:1 }} title={t.changePassword}><KeyRound size={12} color={C.info}/></button>
              {isOnlyAdmin&&<button onClick={function(){setEditModal({userId:uid,userName:displayName,title:u.title||"",role:u.role||"sales",startingDate:u.startingDate?String(u.startingDate).slice(0,10):""});}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} title={t.edit||"Edit"}><Edit size={12} color={C.accent}/></button>}
              <button onClick={function(){setTeamModal({userId:uid,userName:u.name,userRole:u.role,teamId:u.teamId||"",teamName:u.teamName||"",reportsTo:u.reportsTo||""});}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} title="Edit Team"><Users size={12} color="#8B5CF6"/></button><button onClick={function(){if(u.username!=="amgad")del(uid);}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:u.username!=="amgad"?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", opacity:u.username==="amgad"?0.3:1 }}><Trash2 size={12} color={C.danger}/></button></div></td>
      </tr>;})}
      </tbody>
    </table></div></Card>
    {qtModal&&<Modal show={true} onClose={function(){setQtModal(null);}} title={"🎯 Quarterly Targets — "+qtModal.user.name}>
      <div style={{ fontSize:12, color:C.textLight, marginBottom:14, padding:"8px 12px", background:"#F8FAFC", borderRadius:8 }}>
        تارجت كل Quarter بالمليون — بيتحسب من Deals Done Deal
      </div>
      {["Q1","Q2","Q3","Q4"].map(function(q,i){
        var labels=["Jan — Mar","Apr — Jun","Jul — Sep","Oct — Dec"];
        return <div key={q} style={{ marginBottom:11 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>{q} <span style={{ fontSize:11, color:C.textLight, fontWeight:400 }}>({labels[i]})</span></label>
          <input type="text" placeholder="e.g. 5,000,000"
            value={qtModal.targets[q]?Number(qtModal.targets[q]).toLocaleString():""}
            onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setQtModal(function(prev){return Object.assign({},prev,{targets:Object.assign({},prev.targets,{[q]:r?Number(r):0})});});}}
            style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", direction:"ltr" }}/>
        </div>;
      })}
      <div style={{ display:"flex", gap:10, marginTop:4 }}>
        <Btn outline onClick={function(){setQtModal(null);}} style={{ flex:1 }}>Cancel</Btn>
        <Btn onClick={function(){saveQTargets(gid(qtModal.user),qtModal.targets).then(function(){setQtModal(null);});}} style={{ flex:1 }}>✅ Save</Btn>
      </div>
    </Modal>}
    {editModal&&<Modal show={true} onClose={function(){setEditModal(null);}} title={"✏️ Edit User — "+editModal.userName}>
      <Inp label={t.title} type="select" value={editModal.title}
        onChange={function(e){
          var newTitle=e.target.value;
          var mapped=ROLE_FOR_TITLE[newTitle];
          setEditModal(function(prev){return Object.assign({},prev,{title:newTitle},mapped?{role:mapped}:{});});
        }}
        options={[{value:"",label:"- Select Job Title -"}].concat(JOB_TITLES.map(function(j){return {value:j.label,label:j.label};}))}/>
      <Inp label={t.role} type="select" value={editModal.role}
        onChange={function(e){setEditModal(function(prev){return Object.assign({},prev,{role:e.target.value});});}}
        options={[{value:"admin",label:t.admin},{value:"sales_admin",label:"Sales Admin"},{value:"director",label:"Sales Director"},{value:"manager",label:t.salesManager},{value:"team_leader",label:"Team Leader"},{value:"sales",label:t.salesAgent},{value:"viewer",label:t.viewer}]}/>
      <div style={{fontSize:11,color:C.textLight,marginTop:-6,marginBottom:12}}>Selecting a Job Title auto-sets the Role. You can override the Role for edge cases.</div>
      <div style={{ marginBottom:12 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:5 }}>Starting Date</label>
        <input type="date" value={editModal.startingDate||""} onChange={function(e){setEditModal(function(prev){return Object.assign({},prev,{startingDate:e.target.value});});}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box" }}/>
      </div>
      <div style={{display:"flex",gap:10}}><Btn outline onClick={function(){setEditModal(null);}} style={{flex:1}}>{t.cancel}</Btn><Btn onClick={saveUserEdit} loading={editSaving} style={{flex:1}}>{t.save}</Btn></div>
    </Modal>}
    {teamModal&&<Modal show={true} onClose={function(){setTeamModal(null);}} title={"👥 Edit Team — "+teamModal.userName}>
      {/* reportsTo — hidden for top-level (admin/sales_admin/director) and non-hierarchy (viewer) roles */}
      {teamModal.userRole!=="admin"&&teamModal.userRole!=="sales_admin"&&teamModal.userRole!=="director"&&teamModal.userRole!=="viewer"&&<div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,marginBottom:5}}>Reports To (Direct Manager)</label>
        <select value={teamModal.reportsTo||""} onChange={function(e){setTeamModal(function(prev){return Object.assign({},prev,{reportsTo:e.target.value||null});});}}
          style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #E2E8F0",fontSize:13,background:"#fff",boxSizing:"border-box"}}>
          <option value="">— No (Top Manager) —</option>
          {p.users.filter(function(u){
            if(gid(u)===teamModal.userId) return false;
            if(teamModal.userRole==="manager") return u.role==="director";
            if(teamModal.userRole==="team_leader") return u.role==="manager";
            if(teamModal.userRole==="sales") return u.role==="manager"||u.role==="team_leader";
            return false;
          }).map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name} ({u.title||u.role})</option>;})}
        </select>
        <div style={{fontSize:10,color:"#8B5CF6",marginTop:4}}>Empty = Top Manager. Set = Team Leader sees only direct team.</div>
      </div>}
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,marginBottom:5}}>Team Code (optional)</label>
        <input type="text" placeholder="e.g. team-a" value={teamModal.teamId} onChange={function(e){setTeamModal(function(prev){return Object.assign({},prev,{teamId:e.target.value});});}}
          style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #E2E8F0",fontSize:14,boxSizing:"border-box"}}/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,marginBottom:5}}>Team Name (optional)</label>
        <input type="text" placeholder="e.g. Team A" value={teamModal.teamName} onChange={function(e){setTeamModal(function(prev){return Object.assign({},prev,{teamName:e.target.value});});}}
          style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #E2E8F0",fontSize:14,boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",gap:10}}><Btn outline onClick={function(){setTeamModal(null);}} style={{flex:1}}>{t.cancel}</Btn><Btn onClick={saveTeam} loading={teamSaving} style={{flex:1}}>{t.save}</Btn></div>
    </Modal>}

    {pwModal&&<Modal show={true} onClose={function(){setPwModal(null);setPwMsg("");}} title={t.changePassword+" — "+pwModal.userName}>
      <Inp label={t.newPassword} type="password" value={pwForm.newPass} onChange={function(e){setPwForm(Object.assign({},pwForm,{newPass:e.target.value}));setPwMsg("");}}/>
      <Inp label={t.confirmPassword} type="password" value={pwForm.confirmPass} onChange={function(e){setPwForm(Object.assign({},pwForm,{confirmPass:e.target.value}));setPwMsg("");}}/>
      {pwMsg&&<div style={{padding:"9px 14px",borderRadius:9,fontSize:13,marginBottom:12,background:pwMsg.startsWith("✅")?"#DCFCE7":"#FEE2E2",color:pwMsg.startsWith("✅")?"#15803D":"#B91C1C"}}>{pwMsg}</div>}
      <div style={{display:"flex",gap:10}}><Btn outline onClick={function(){setPwModal(null);setPwMsg("");}} style={{flex:1}}>{t.cancel}</Btn><Btn onClick={changePassword} loading={pwSaving} style={{flex:1}}>{t.save}</Btn></div>
    </Modal>}
    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={t.addUser}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
        <div style={{ gridColumn:"1/-1" }}><Inp label={t.name} req value={nU.name} onChange={function(e){setNU(Object.assign({},nU,{name:e.target.value}));}}/></div>
        <Inp label={t.username} req value={nU.username} onChange={function(e){setNU(Object.assign({},nU,{username:e.target.value}));}}/>
        <Inp label={t.password} value={nU.password} onChange={function(e){setNU(Object.assign({},nU,{password:e.target.value}));}}/>
        <Inp label={t.title} type="select" value={nU.title}
          onChange={function(e){
            var newTitle=e.target.value;
            var mapped=ROLE_FOR_TITLE[newTitle];
            setNU(Object.assign({},nU,{title:newTitle},mapped?{role:mapped}:{}));
          }}
          options={[{value:"",label:"- Select Job Title -"}].concat(JOB_TITLES.map(function(j){return {value:j.label,label:j.label};}))}/>
        <Inp label={t.email} value={nU.email} onChange={function(e){setNU(Object.assign({},nU,{email:e.target.value}));}}/>
        <div style={{ gridColumn:"1/-1" }}><Inp label={t.phone} value={nU.phone} onChange={function(e){setNU(Object.assign({},nU,{phone:e.target.value}));}}/></div>
        <Inp label={t.monthlyTarget} type="number" value={nU.monthlyTarget} onChange={function(e){setNU(Object.assign({},nU,{monthlyTarget:Number(e.target.value)}));}}/>
        <div style={{ marginBottom:12 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, marginBottom:5 }}>Starting Date</label>
          <input type="date" value={nU.startingDate||""} onChange={function(e){setNU(Object.assign({},nU,{startingDate:e.target.value}));}}
            style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box" }}/>
        </div>
      {(nU.role==="sales"||nU.role==="manager"||nU.role==="team_leader")&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
        <Inp label={"Team Name"} value={nU.teamName||""} onChange={function(e){setNU(Object.assign({},nU,{teamName:e.target.value}));}} placeholder="e.g. Team A"/>
        <Inp label={"Team Code"} value={nU.teamId||""} onChange={function(e){setNU(Object.assign({},nU,{teamId:e.target.value}));}} placeholder="team-a"/>
      </div>}
        <div style={{ gridColumn:"1/-1" }}><Inp label={t.role} type="select" value={nU.role} onChange={function(e){setNU(Object.assign({},nU,{role:e.target.value}));}} options={[{value:"admin",label:t.admin},{value:"sales_admin",label:"Sales Admin"},{value:"director",label:"Sales Director"},{value:"manager",label:t.salesManager},{value:"team_leader",label:"Team Leader"},{value:"sales",label:t.salesAgent},{value:"viewer",label:t.viewer}]}/></div>
      </div>
      <div style={{ display:"flex", gap:10 }}><Btn outline onClick={function(){setShowAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn><Btn onClick={add} loading={saving} style={{ flex:1 }}>{t.add}</Btn></div>
    </Modal>
  </div>;
};

// ===== TEAM =====
var TeamPage = function(p) {
  var t=p.t;
  var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="director"||p.cu.role==="manager"||p.cu.role==="team_leader";
  var allDeals=p.leads.filter(function(l){return l.status==="DoneDeal"&&!l.archived;});
  var getQ=function(date){var m=new Date(date).getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";};
  var curQ=(function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
  var parseBudget=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var getQTargets=function(uid){
    var u=p.users.find(function(x){return gid(x)===uid;});
    if(u&&u.qTargets&&Object.keys(u.qTargets).length>0) return u.qTargets;
    try{return JSON.parse(localStorage.getItem("crm_qt_"+uid)||"{}");} catch(e){return {};}
  };
  var saveQTargets=async function(uid,qt){
    try{localStorage.setItem("crm_qt_"+uid,JSON.stringify(qt));}catch(e){}
    try{await apiFetch("/api/users/"+uid,"PUT",{qTargets:qt},p.token);}catch(e){console.error("saveQTargets error",e);}
    p.setUsers(function(prev){return prev.map(function(u){return gid(u)===uid?Object.assign({},u,{qTargets:qt}):u;});});
  };
  var [viewQ,setViewQ]=useState(curQ);
  var curYear=new Date().getFullYear();
  var years=[curYear,curYear-1,curYear-2,curYear-3];
  var [viewYear,setViewYear]=useState(curYear);
  var [editQModal,setEditQModal]=useState(null);
  var [expandedManager,setExpandedManager]=useState(null); // uid of expanded manager
  // Hide-all confirm flow — admin / sales_admin only. Triggers the same
  // visibility-hide effect as the Phase P 7-day staleness rule, immediately,
  // for every lead the agent sees. Backend sets assignments[].hiddenManually
  // on each non-EOI/DoneDeal slice; admin's view here is unaffected.
  var [unassignModal,setUnassignModal]=useState(null);
  var [unassigning,setUnassigning]=useState(false);
  var canUnassignAll = p.cu.role==="admin" || p.cu.role==="sales_admin";
  var doUnassignAll = async function(){
    if (!unassignModal || unassigning) return;
    setUnassigning(true);
    try {
      var u = unassignModal.user;
      var uid = String(gid(u));
      var res = await apiFetch("/api/agents/"+uid+"/unassign-all-leads","POST",null,p.token,p.csrfToken);
      var n = (res && typeof res.hidden==="number") ? res.hidden : 0;
      setUnassignModal(null);
      alert("Hidden "+n+" lead"+(n===1?"":"s")+" from "+(u.name||"")+".");
    } catch(e) {
      alert(e.message||"Failed to hide leads");
    } finally {
      setUnassigning(false);
    }
  };

  // Build hierarchy: managers + team leaders + their teams
  var managers = p.users.filter(function(u){return (u.role==="manager"||u.role==="team_leader")&&u.active;});
  var getSalesUnder = function(muid){
    return p.users.filter(function(u){
      var rt=u.reportsTo&&u.reportsTo._id?String(u.reportsTo._id):String(u.reportsTo||"");
      return u.active && (u.role==="sales"||u.role==="team_leader") && rt===muid;
    });
  };

  // For team_leader: show only themselves (their card shows their team)
  // For manager: show themselves + their team_leaders
  var visibleManagers = isAdmin ? managers : managers.filter(function(m){return gid(m)===String(p.cu.id||"");});
  // Also show sales not under any manager (top-level sales)
  var topLevelSales = isAdmin ? p.users.filter(function(u){return u.role==="sales"&&u.active&&!u.reportsTo;}) : [];

  // Stable gradient assignment — same user always gets the same tile color
  // regardless of where they appear in the list. 8 gradients per the spec.
  var gradientForUid = function(uid){
    var h = 0; var s = String(uid||"");
    for (var i=0;i<s.length;i++) { h = (h*31 + s.charCodeAt(i)) & 0x7fffffff; }
    return "tp-grad-" + ((h % 8) + 1);
  };

  // Card for one member — gradient top + white bottom per the new design.
  var MemberCard = function(mp){
    var a=mp.user; var uid=String(gid(a));
    var isManagerCard = a.role==="manager"||a.role==="team_leader";
    // For manager card: get all team member IDs. Filter mirrors getSalesUnder
    // (line 7194) — active sales/team_leader only — so MemberCard counts
    // match the manager-group header (mRev) and don't inflate when an
    // inactive or wrong-role user happens to point reportsTo at this manager.
    var teamUids = isManagerCard ? new Set(p.users.filter(function(u){
      var rt=u.reportsTo&&u.reportsTo._id?String(u.reportsTo._id):String(u.reportsTo||"");
      return u.active && (u.role==="sales"||u.role==="team_leader") && rt===uid;
    }).map(function(u){return String(u._id);})) : null;
    var matchesAgent = function(d){
      var aid=String(d.agentId&&d.agentId._id?d.agentId._id:d.agentId||"");
      var splitId=String(d.splitAgent2Id&&d.splitAgent2Id._id?d.splitAgent2Id._id:d.splitAgent2Id||"");
      if(isManagerCard && teamUids){
        // teamUids is a snapshot of p.users built once at the top of this
        // MemberCard call. Belt-and-suspenders: re-verify at match time that
        // the candidate's CURRENT reportsTo still resolves to this team
        // leader's uid. The rule is universal — a team leader must only see
        // deals from agents who currently report to them — and this guard
        // makes a misattribution impossible even if teamUids ever drifts.
        var stillUnder=function(id){
          var u=p.users.find(function(x){return String(x._id)===id;});
          if(!u||!u.active) return false;
          if(u.role!=="sales"&&u.role!=="team_leader") return false;
          var rt=u.reportsTo&&u.reportsTo._id?String(u.reportsTo._id):String(u.reportsTo||"");
          return rt===uid;
        };
        return aid===uid
          ||(teamUids.has(aid)&&stillUnder(aid))
          ||(!!splitId&&(splitId===uid||(teamUids.has(splitId)&&stillUnder(splitId))));
      }
      return aid===uid||splitId===uid;
    };
    // For manager cards, revenue is the per-member share sum (matches the
    // header): a within-team split contributes both halves because each
    // member's iteration adds their 50%. Distinct DEALS counts (qDeals.length /
    // allAgentDeals.length) keep the team-wide matchesAgent set so a single
    // split deal between two team members is still counted as 1 deal.
    var perMemberShare = isManagerCard ? function(filterFn){
      var memberIds=[uid].concat(Array.from(teamUids||[]));
      return memberIds.reduce(function(total,mid){
        return total+allDeals.reduce(function(s,d){
          var aid=String(d.agentId&&d.agentId._id?d.agentId._id:d.agentId||"");
          var splitId=String(d.splitAgent2Id&&d.splitAgent2Id._id?d.splitAgent2Id._id:d.splitAgent2Id||"");
          if(aid!==mid&&splitId!==mid) return s;
          if(!filterFn(d)) return s;
          var w=getProjectWeight(d.project,d);
          var sp=getDealSplitFromObj(d);
          return s+parseBudget(d.budget)*w*(sp?0.5:1);
        },0);
      },0);
    } : null;
    var al=p.leads.filter(function(l){var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return String(aid)===uid&&!l.archived;});
    var calls=p.activities.filter(function(ac){var auid=ac.userId&&ac.userId._id?ac.userId._id:ac.userId;return String(auid)===uid&&ac.type==="call";}).length;
    var qTarget=getEffectiveQTarget(a,p.users,viewQ);
    var qDeals=allDeals.filter(function(d){if(!matchesAgent(d))return false;var dd=getDealDate(d);return dd&&getQ(dd)===viewQ&&new Date(dd).getFullYear()===viewYear;});
    var qRevenue=isManagerCard
      ? perMemberShare(function(d){var dd=getDealDate(d);return dd&&getQ(dd)===viewQ&&new Date(dd).getFullYear()===viewYear;})
      : qDeals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);return s+parseBudget(d.budget)*w*(sp?0.5:1);},0);
    var qProg=qTarget>0?Math.min(100,Math.round((qRevenue/qTarget)*100)):0;
    var allAgentDeals=allDeals.filter(function(d){return matchesAgent(d);});
    var totalRevenue=isManagerCard
      ? perMemberShare(function(){return true;})
      : allAgentDeals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);return s+parseBudget(d.budget)*w*(sp?0.5:1);},0);
    var isOnlineNow=a.lastSeen&&(Date.now()-new Date(a.lastSeen).getTime())<2*60*1000;
    var lastSeenStr=a.lastSeen?("Last seen: "+new Date(a.lastSeen).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" — "+timeAgo(a.lastSeen,p.t)):"Never logged in";
    var initials = (a.name||"?").split(" ").slice(0,2).map(function(x){return x[0];}).join("").toUpperCase();
    var grad = gradientForUid(uid);
    var roleLabel = a.title || ({admin:"Admin",sales_admin:"Sales Admin",manager:"Manager",team_leader:"Team Leader",sales:"Sales",viewer:"Viewer"}[a.role]||"");
    var totalRevenueM = (totalRevenue/1000000).toFixed(1)+"M";
    var stats = [
      { v: al.length,            l: "Leads", isDeals:false },
      { v: allAgentDeals.length, l: "Deals", isDeals:true },
      { v: totalRevenueM,        l: "Total", isDeals:false },
      { v: calls,                l: "Calls", isDeals:false }
    ];
    return <div key={uid} style={{ borderRadius:16, overflow:"hidden", background:"#fff", boxShadow:"0 2px 10px rgba(0,0,0,0.08)" }}>
      {/* Top — gradient hero */}
      <div className={grad} style={{ padding:"18px 14px 16px", position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
        {isOnlineNow && <span title="Online" style={{ position:"absolute", top:10, right:12, width:9, height:9, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 0 2px rgba(255,255,255,0.45)" }}/>}
        <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.22)", color:"#fff", border:"2px solid rgba(255,255,255,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800 }}>{initials}</div>
        <div style={{ fontSize:13, fontWeight:700, color:"#fff", textAlign:"center", maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.85)", textTransform:"uppercase", letterSpacing:"0.04em", textAlign:"center" }}>{roleLabel}</div>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.55)", textAlign:"center", maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{isOnlineNow?"Online now":lastSeenStr}</div>
      </div>
      {/* Bottom — white panel */}
      <div style={{ background:"#fff", padding:"14px 14px 16px" }}>
        {isAdmin && <button onClick={function(){var qt=getQTargets(uid);setEditQModal({user:a,targets:{Q1:qt.Q1||0,Q2:qt.Q2||0,Q3:qt.Q3||0,Q4:qt.Q4||0}});}}
          style={{ width:"100%", padding:"8px 0", borderRadius:8, border:"none", background:"#f1f5f9", color:"#1e3a5f", fontSize:10, fontWeight:700, cursor:"pointer", marginBottom:8 }}>🎯 Edit Targets</button>}
        {/* Hide-all — admin / sales_admin only, sales agent cards only.
            Backend computes the actual count after applying the EOI/DoneDeal
            exclusion, so we always allow the click and report the result. */}
        {canUnassignAll && !isManagerCard && <button onClick={function(){setUnassignModal({user:a});}}
          style={{ width:"100%", padding:"8px 0", borderRadius:8, border:"1px solid #FECACA", background:"#FEF2F2", color:"#B91C1C", fontSize:10, fontWeight:700, cursor:"pointer", marginBottom:12 }}>↩ Hide all leads</button>}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
          <span style={{ fontSize:10, fontWeight:600, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>{viewQ} Target</span>
          <span style={{ fontSize:10, fontWeight:700, color:"#334155" }}>{qTarget>0?qTarget.toLocaleString()+" EGP":"Not set"}</span>
        </div>
        <div style={{ height:4, background:"#e2e8f0", borderRadius:2, marginBottom:10, overflow:"hidden" }}>
          <div className={grad} style={{ height:"100%", width:qProg+"%", borderRadius:2, transition:"width 0.6s" }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:12 }}>
          <span style={{ fontSize:18, fontWeight:800, color:qRevenue>0?"#0f172a":"#94a3b8" }}>{(qRevenue/1000000).toFixed(2)}M</span>
          <span style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>{qProg}%</span>
        </div>
        <div style={{ height:1, background:"#e2e8f0", marginBottom:10, transform:"scaleY(0.5)" }}/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:6 }}>
          {stats.map(function(s,i){
            // Zero handling: dim numbers when they're 0; deals get green when > 0.
            var isZero = (s.v === 0) || (s.v === "0.0M") || (s.v === "0M") || (s.v === "0");
            var color;
            if (s.isDeals) color = (s.v > 0 ? "#15803d" : "#cbd5e1");
            else color = isZero ? "#cbd5e1" : "#0f172a";
            return <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:16, fontWeight:800, color:color, lineHeight:1.1 }}>{s.v}</div>
              <div style={{ fontSize:8, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:4 }}>{s.l}</div>
            </div>;
          })}
        </div>
      </div>
    </div>;
  };

  // Activity feed - last 20 activities across all team
  var teamActivityFeed = p.activities.map(function(a){
    var uname=a.userId&&a.userId.name?a.userId.name:"";
    var lname=a.leadId&&a.leadId.name?a.leadId.name:"";
    var icon=a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":a.type==="reassign"?"↩️":a.type==="note"?"📝":"🔔";
    return {icon,uname,lname,note:a.note,time:a.createdAt};
  });

  return <div className="team-page-v2" style={{ padding:"20px", background:"#f1f5f9", minHeight:"100%", fontFamily:"'Inter','Segoe UI',sans-serif" }}>
    {/* Inter font + the 8 gradient classes used by MemberCard. Scoped under
        .team-page-v2 so they don't leak to other pages. */}
    <style>{""
      + "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');"
      + ".team-page-v2 .tp-grad-1 { background: linear-gradient(135deg, #43c6db, #3b5cb8); }"
      + ".team-page-v2 .tp-grad-2 { background: linear-gradient(135deg, #f953c6, #b91d73); }"
      + ".team-page-v2 .tp-grad-3 { background: linear-gradient(135deg, #56ab2f, #a8e063); }"
      + ".team-page-v2 .tp-grad-4 { background: linear-gradient(135deg, #f7797d, #c6426e); }"
      + ".team-page-v2 .tp-grad-5 { background: linear-gradient(135deg, #e52d27, #b31217); }"
      + ".team-page-v2 .tp-grad-6 { background: linear-gradient(135deg, #f46b45, #eea849); }"
      + ".team-page-v2 .tp-grad-7 { background: linear-gradient(135deg, #b8d435, #56ab2f); }"
      + ".team-page-v2 .tp-grad-8 { background: linear-gradient(135deg, #a18cd1, #e8a4c8); }"
    }</style>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:"#0f172a" }}>{t.team}</h2>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        {["Q1","Q2","Q3","Q4"].map(function(q){return <button key={q} onClick={function(){setViewQ(q);}}
          style={{ padding:"6px 14px", borderRadius:8, border:"1px solid", borderColor:viewQ===q?C.accent:"#E2E8F0",
            background:viewQ===q?C.accent+"12":"#fff", color:viewQ===q?C.accent:C.textLight,
            fontSize:12, fontWeight:600, cursor:"pointer" }}>{q}{q===curQ&&viewYear===curYear?" 🔵":""}</button>;})}
        <select value={viewYear} onChange={function(e){setViewYear(Number(e.target.value));}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
          {years.map(function(y){return <option key={y} value={y}>{y}</option>;})}
        </select>
      </div>
    </div>

    {/* Manager groups */}
    {visibleManagers.map(function(mgr){
      var muid=gid(mgr); var team=getSalesUnder(muid); var isExpanded=expandedManager===muid;
      // Header total = sum across each direct member's share-based total
      // (manager + their direct reports). Both halves of a within-team split
      // count — each member's iteration adds their own 50%, so the deal
      // contributes its full value when both sides are inside the team. A
      // split with an outsider only contributes the inside member's 50%.
      // Equivalent to summing every member-card's TOTAL value.
      var memberIds=[muid].concat(team.map(function(u){return gid(u);}));
      var mRev=memberIds.reduce(function(total,mid){
        return total+allDeals.reduce(function(s,d){
          var aid=d.agentId&&d.agentId._id?String(d.agentId._id):String(d.agentId||"");
          var splitId=String(d.splitAgent2Id&&d.splitAgent2Id._id?d.splitAgent2Id._id:d.splitAgent2Id||"");
          if(aid!==mid&&splitId!==mid) return s;
          var dd=getDealDate(d);
          if(!dd||getQ(dd)!==viewQ||new Date(dd).getFullYear()!==viewYear) return s;
          var w=getProjectWeight(d.project,d);
          var sp=getDealSplitFromObj(d);
          return s+parseBudget(d.budget)*w*(sp?0.5:1);
        },0);
      },0);
      var mTarget=getEffectiveQTarget(mgr,p.users,viewQ);
      var mProg=mTarget>0?Math.min(100,Math.round(mRev/mTarget*100)):0;
      var isOnline=mgr.lastSeen&&(Date.now()-new Date(mgr.lastSeen).getTime())<3*60*1000;
      var mgrInitials=(mgr.name||"?").split(" ").slice(0,2).map(function(x){return x[0];}).join("").toUpperCase();
      var mgrTotalLabel = (mRev/1000000).toFixed(1)+"M / "+(mTarget>0?(mTarget/1000000).toFixed(1)+"M":"—");
      return <div key={muid} style={{ marginBottom:16 }}>
        {/* Manager group header — navy, redesigned */}
        <div onClick={function(){setExpandedManager(isExpanded?null:muid);}}
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"16px 24px", background:"#1e3a5f", borderRadius:12, cursor:"pointer", marginBottom:isExpanded?12:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, minWidth:0, flex:1 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{ width:44, height:44, borderRadius:11, background:"#162d4a", color:"#93c5fd", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700 }}>{mgrInitials}</div>
              {isOnline && <span title="Online" style={{ position:"absolute", bottom:-1, right:-1, width:10, height:10, borderRadius:"50%", background:"#22c55e", border:"2px solid #1e3a5f" }}/>}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#e0f0ff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{mgr.name}</div>
              <div style={{ fontSize:11, color:"#4a7aa0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{mgr.title||""} — {team.length} member{team.length===1?"":"s"}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#93c5fd" }}>{mgrTotalLabel}</div>
              <div style={{ height:5, background:"#162d4a", width:200, maxWidth:"40vw", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:mProg+"%", background:"#60a5fa", borderRadius:3 }}/>
              </div>
              <div style={{ fontSize:11, color:"#4a7aa0" }}>{mProg}%</div>
            </div>
            <span style={{ color:"#93c5fd", fontSize:14 }}>{isExpanded?"▲":"▼"}</span>
          </div>
        </div>
        {/* Team members expanded — responsive grid */}
        {isExpanded&&<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16 }}>
          <MemberCard user={mgr}/>
          {team.map(function(u){return <MemberCard key={gid(u)} user={u}/>;})}</div>}
      </div>;
    })}

    {/* Top-level sales (no manager) */}
    {topLevelSales.length>0&&<div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.04em" }}>Agents without a manager</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16 }}>
        {topLevelSales.map(function(a){return <MemberCard key={gid(a)} user={a}/>;})}
      </div>
    </div>}

    {/* Old fallback if no managers defined */}
    {visibleManagers.length===0&&<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16 }}>
      {p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;}).map(function(a){
        return <MemberCard key={gid(a)} user={a}/>;
      })}
    </div>}

    {/* Activity Feed */}
    {isAdmin&&<div style={{ marginTop:20 }}>
      <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>⚡ Live Activity Feed</h3>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #E8ECF1", overflow:"hidden" }}>
        {teamActivityFeed.length===0&&<div style={{ padding:24, textAlign:"center", color:C.textLight, fontSize:13 }}>No recent activity</div>}
        {teamActivityFeed.map(function(a,i){return <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom:"1px solid #F8FAFC" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>{a.icon}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <span style={{ fontSize:12, fontWeight:600, color:C.accent }}>{a.uname}</span>
            {a.lname&&<span style={{ fontSize:12, color:C.textLight }}> — {a.lname}</span>}
            {a.note&&<div style={{ fontSize:11, color:C.textLight, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.note}</div>}
          </div>
          <span style={{ fontSize:10, color:C.textLight, flexShrink:0 }}>{timeAgo(a.time,{ago:"ago",minutes:"min",hours:"hr",days:"days",just:"now"})}</span>
        </div>;})}
      </div>
    </div>}

    {editQModal&&<Modal show={true} onClose={function(){setEditQModal(null);}} title={"🎯 Quarterly Targets — "+editQModal.user.name}>
      <div style={{ fontSize:12, color:C.textLight, marginBottom:14, padding:"8px 12px", background:"#F8FAFC", borderRadius:8 }}>Quarterly target in EGP</div>
      {["Q1","Q2","Q3","Q4"].map(function(q,i){
        var labels=["Jan — Mar","Apr — Jun","Jul — Sep","Oct — Dec"];
        return <div key={q} style={{ marginBottom:11 }}>
          <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>{q} <span style={{ fontSize:11, color:C.textLight }}>({labels[i]})</span></label>
          <input type="text" placeholder="e.g. 5,000,000"
            value={editQModal.targets[q]?Number(editQModal.targets[q]).toLocaleString():""}
            onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setEditQModal(function(prev){return Object.assign({},prev,{targets:Object.assign({},prev.targets,{[q]:r?Number(r):0})});});}}
            style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", direction:"ltr" }}/>
        </div>;
      })}
      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setEditQModal(null);}} style={{ flex:1 }}>Cancel</Btn>
        <Btn onClick={function(){saveQTargets(gid(editQModal.user),editQModal.targets);setEditQModal(null);}} style={{ flex:1 }}>✅ Save</Btn>
      </div>
    </Modal>}

    {unassignModal&&<Modal show={true} onClose={function(){if(!unassigning)setUnassignModal(null);}} title={"↩ Hide all leads"}>
      <div style={{ fontSize:13, color:C.text, lineHeight:1.55, marginBottom:18 }}>
        Hide all leads from <b>{unassignModal.user.name}</b>? This applies the same effect as 7 days of inactivity to all leads currently visible to this agent. Notes, Done Deals, and active EOIs are preserved.
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setUnassignModal(null);}} disabled={unassigning} style={{ flex:1 }}>Cancel</Btn>
        <Btn danger onClick={doUnassignAll} loading={unassigning} style={{ flex:1 }}>{unassigning?"Hiding…":"Hide all"}</Btn>
      </div>
    </Modal>}
  </div>;
};

// ===== REPORTS HELPERS =====
var fmtEGP = function(n) {
  n = Number(n) || 0;
  var sign = n < 0 ? "-" : "";
  var abs = Math.abs(n);
  if (abs >= 1000000) {
    var m = abs / 1000000;
    return sign + (m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")) + "M EGP";
  }
  if (abs >= 1000) return sign + Math.round(abs / 1000) + "K EGP";
  return sign + Math.round(abs) + " EGP";
};

var Sparkline = function(p) {
  var values = p.values || [];
  var w = p.width || 80, h = p.height || 26;
  if (values.length < 2) {
    return <svg width={w} height={h} style={{ display:"block" }}>
      <line x1={0} y1={h/2} x2={w} y2={h/2} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="2 2"/>
    </svg>;
  }
  var minV = Math.min.apply(null, values);
  var maxV = Math.max.apply(null, values);
  var range = maxV - minV; if (range === 0) range = 1;
  var stepX = (values.length - 1) > 0 ? w / (values.length - 1) : 0;
  var pts = values.map(function(v, i){
    var x = i * stepX;
    var y = h - 2 - ((v - minV) / range) * (h - 4);
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
  return <svg width={w} height={h} style={{ display:"block" }}>
    <polyline fill="none" stroke={p.color || "#1F2937"} strokeWidth={1.5} points={pts} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
};

var KpiCard = function(p) {
  var c = p.card;
  var d = c.delta;
  var positive = d != null && d > 0;
  var negative = d != null && d < 0;
  var deltaColor = d == null ? C.textLight : (positive ? "#16A34A" : negative ? "#DC2626" : C.textLight);
  var arrow = positive ? "▲" : negative ? "▼" : "—";
  return <Card style={{ padding:"14px 16px", minHeight:118 }}>
    <div style={{ fontSize:11, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{c.label}</div>
    {p.skeleton
      ? <div style={{ height:24, marginTop:10, borderRadius:4, background:"#F1F5F9", width:"60%" }}/>
      : <div style={{ fontSize:20, fontWeight:800, color:c.color, marginTop:6 }} title={c.tooltip||""}>{c.value}</div>}
    {!p.skeleton && c.hint && <div style={{ fontSize:9, color:C.textLight, marginTop:2 }} title={c.tooltip||""}>{c.hint}</div>}
    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
      {!c.snapshot && !p.skeleton && <span style={{ fontSize:11, fontWeight:700, color:deltaColor }}>
        {d == null ? "—" : arrow + " " + Math.abs(d).toFixed(1) + (c.deltaUnit || "%")}
      </span>}
      {c.snapshot && !p.skeleton && <span style={{ fontSize:10, color:C.textLight, fontWeight:600, letterSpacing:"0.04em" }}>SNAPSHOT</span>}
      {p.compare && c.prev != null && !p.skeleton && <span style={{ fontSize:10, color:C.textLight }}>
        prev {c.prevFmt(c.prev)}
      </span>}
      <div style={{ flex:1 }}/>
      <Sparkline values={p.skeleton ? [] : (c.spark || [])} color={c.color} width={70} height={24}/>
    </div>
  </Card>;
};

var KpiCardsRow = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var f = p.filters;
  useEffect(function(){
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var qs = "?from=" + f.from + "&to=" + f.to;
    if (f.team) qs += "&team=" + encodeURIComponent(f.team);
    if (f.source && f.source !== "all") qs += "&source=" + encodeURIComponent(f.source);
    apiFetch("/api/reports/overview/kpis" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.from, f.to, f.team, f.source]);

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load KPIs: {state.error}</div>
    </Card>;
  }

  var skel = state.loading || !state.data;
  var k = state.data && state.data.kpis;
  var fmtPct = function(v){ return (Number(v) || 0).toFixed(1) + "%"; };

  var cards = [
    { id:"revenue",  label:"Revenue",        value: skel ? "" : fmtEGP(k.revenue.value),       prev: skel ? null : k.revenue.prev,       prevFmt: fmtEGP, delta: skel ? null : k.revenue.deltaPct,    deltaUnit:"%",  spark: skel ? [] : k.revenue.sparkline,       color: C.success },
    { id:"pipeline", label:"Pipeline value", value: skel ? "" : fmtEGP(k.pipelineValue.value), prev: null,                                prevFmt: fmtEGP, delta: null,                                 deltaUnit:null, spark: skel ? [] : k.pipelineValue.sparkline, color: C.info, snapshot: true },
    { id:"avg",      label:"Avg deal size",  value: skel ? "" : fmtEGP(k.avgDealSize.value),   prev: skel ? null : k.avgDealSize.prev,    prevFmt: fmtEGP, delta: skel ? null : k.avgDealSize.deltaPct, deltaUnit:"%",  spark: skel ? [] : k.avgDealSize.sparkline,   color: C.accent },
    { id:"conv",     label:"Lead → deal %",  value: skel ? "" : fmtPct(k.convRatePct.value),   prev: skel ? null : k.convRatePct.prev,    prevFmt: fmtPct, delta: skel ? null : k.convRatePct.deltaPp,  deltaUnit:"pp", spark: skel ? [] : k.convRatePct.sparkline,   color: "#8B5CF6" }
  ];

  return <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))", gap:10, marginBottom:14 }}>
    {cards.map(function(c){ return <KpiCard key={c.id} card={c} compare={f.compare} skeleton={skel}/>; })}
  </div>;
};

var TrendsChart = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var [hoverIdx, setHoverIdx] = useState(null);
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var qs = "?from=" + f.from + "&to=" + f.to;
    if (f.team) qs += "&team=" + encodeURIComponent(f.team);
    if (f.source && f.source !== "all") qs += "&source=" + encodeURIComponent(f.source);
    apiFetch("/api/reports/overview/trends" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.from, f.to, f.team, f.source]);

  // SVG geometry — viewBox-based so the chart scales fluidly with container width.
  var W = 800, H = 220;
  var padL = 44, padR = 16, padT = 12, padB = 28;
  var plotW = W - padL - padR;
  var plotH = H - padT - padB;

  // Calls aren't source-filtered server-side (Activity has no source attribution).
  // Surface this in the legend whenever a specific source filter is active so users
  // don't expect the calls line to drop alongside leads/deals.
  var sourceFiltered = f.source && f.source !== "all";
  var headerRow = <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, flexWrap:"wrap", gap:8 }}>
    <div style={{ fontSize:13, fontWeight:700 }}>📈 Trends</div>
    <div style={{ display:"flex", gap:14, fontSize:11, color:C.textLight }}>
      <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:14, height:2, background:"#3B82F6", borderRadius:1 }}/>Leads</span>
      <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:14, height:2, background:"#16A34A", borderRadius:1 }}/>Deals</span>
      <span title={sourceFiltered ? "Calls aren't filtered by source — Activity logs don't carry source attribution" : ""} style={{ display:"flex", alignItems:"center", gap:5, cursor: sourceFiltered ? "help" : "default" }}><span style={{ width:14, height:2, background:"#F59E0B", borderRadius:1 }}/>Calls{sourceFiltered ? " (all sources)" : ""}</span>
    </div>
  </div>;

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load: {state.error}</div>
    </Card>;
  }
  if (state.loading || !state.data) {
    return <Card style={{ marginBottom:14, padding:"14px 16px", minHeight:240 }}>
      {headerRow}
      <div style={{ height:200, background:"#F1F5F9", borderRadius:6 }}/>
    </Card>;
  }

  var series = (state.data && state.data.series) || [];
  var n = series.length;

  if (n === 0) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      <div style={{ position:"relative" }}>
        <svg viewBox={"0 0 " + W + " " + H} style={{ width:"100%", height:H, display:"block" }}>
          {[0, 0.5, 1].map(function(t){
            var y = padT + plotH - t * plotH;
            return <line key={t} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#E2E8F0" strokeWidth={0.5}/>;
          })}
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:C.textLight, fontSize:13, pointerEvents:"none" }}>No activity in this period</div>
      </div>
    </Card>;
  }

  var maxLeads = Math.max.apply(null, series.map(function(s){ return s.leads; }));
  var maxDeals = Math.max.apply(null, series.map(function(s){ return s.deals; }));
  var maxCalls = Math.max.apply(null, series.map(function(s){ return s.calls; }));
  var maxAll = Math.max(1, maxLeads, maxDeals, maxCalls);

  var stepX = n > 1 ? plotW / (n - 1) : plotW;

  var pts = function(key) {
    return series.map(function(s, i){
      var x = padL + i * stepX;
      var y = padT + plotH - (s[key] / maxAll) * plotH;
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
  };

  var nLabels = Math.min(7, n);
  var labelStride = n > 1 ? Math.max(1, Math.floor((n - 1) / Math.max(1, nLabels - 1))) : 1;
  var fmtAxisDate = function(iso) { return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" }); };

  var setIdxFromX = function(clientX, rect) {
    var svgX = ((clientX - rect.left) / rect.width) * W;
    if (svgX < padL || svgX > padL + plotW) { setHoverIdx(null); return; }
    var idx = Math.round((svgX - padL) / stepX);
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
  };
  var onMouseMove = function(e) { setIdxFromX(e.clientX, e.currentTarget.getBoundingClientRect()); };
  var onTouchMove = function(e) {
    if (!e.touches || !e.touches[0]) return;
    setIdxFromX(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
  };

  return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
    {headerRow}
    <div style={{ position:"relative" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width:"100%", height:H, display:"block" }}
        onMouseMove={onMouseMove} onMouseLeave={function(){ setHoverIdx(null); }}
        onTouchStart={onTouchMove} onTouchMove={onTouchMove}>
        {[0, 0.5, 1].map(function(t){
          var y = padT + plotH - t * plotH;
          return <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#E2E8F0" strokeWidth={0.5}/>
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={10} fill="#94A3B8">{Math.round(maxAll * t)}</text>
          </g>;
        })}
        {(function(){
          var labels = [];
          var seen = {};
          for (var i = 0; i < n; i += labelStride) {
            seen[i] = true;
            var x = padL + i * stepX;
            labels.push(<text key={i} x={x} y={H - 8} textAnchor="middle" fontSize={10} fill="#94A3B8">{fmtAxisDate(series[i].date)}</text>);
          }
          if (!seen[n - 1] && n > 0) {
            var lx = padL + (n - 1) * stepX;
            labels.push(<text key={"last-"+(n-1)} x={lx} y={H - 8} textAnchor="middle" fontSize={10} fill="#94A3B8">{fmtAxisDate(series[n - 1].date)}</text>);
          }
          return labels;
        })()}
        {hoverIdx != null && <line x1={padL + hoverIdx * stepX} y1={padT} x2={padL + hoverIdx * stepX} y2={padT + plotH} stroke="#94A3B8" strokeWidth={0.5} strokeDasharray="3 3"/>}
        <polyline fill="none" stroke="#3B82F6" strokeWidth={1.8} points={pts("leads")} strokeLinecap="round" strokeLinejoin="round"/>
        <polyline fill="none" stroke="#16A34A" strokeWidth={1.8} points={pts("deals")} strokeLinecap="round" strokeLinejoin="round"/>
        <polyline fill="none" stroke="#F59E0B" strokeWidth={1.8} points={pts("calls")} strokeLinecap="round" strokeLinejoin="round"/>
        {hoverIdx != null && (function(){
          var s = series[hoverIdx];
          var x = padL + hoverIdx * stepX;
          var y = function(key){ return padT + plotH - (s[key] / maxAll) * plotH; };
          return <g>
            <circle cx={x} cy={y("leads")} r={3.5} fill="#fff" stroke="#3B82F6" strokeWidth={2}/>
            <circle cx={x} cy={y("deals")} r={3.5} fill="#fff" stroke="#16A34A" strokeWidth={2}/>
            <circle cx={x} cy={y("calls")} r={3.5} fill="#fff" stroke="#F59E0B" strokeWidth={2}/>
          </g>;
        })()}
      </svg>
      {hoverIdx != null && (function(){
        var s = series[hoverIdx];
        return <div style={{ position:"absolute", top:8, right:8, background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, padding:"8px 10px", fontSize:11, boxShadow:"0 4px 12px rgba(0,0,0,0.08)", minWidth:140, pointerEvents:"none" }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:6 }}>{new Date(s.date).toLocaleDateString("en-GB", { weekday:"short", month:"short", day:"numeric" })}</div>
          <div style={{ display:"flex", justifyContent:"space-between", color:C.textLight, gap:12 }}><span><span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"#3B82F6", marginRight:6 }}/>Leads</span><b style={{ color:"#3B82F6" }}>{s.leads}</b></div>
          <div style={{ display:"flex", justifyContent:"space-between", color:C.textLight, gap:12 }}><span><span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"#16A34A", marginRight:6 }}/>Deals</span><b style={{ color:"#16A34A" }}>{s.deals}</b></div>
          <div style={{ display:"flex", justifyContent:"space-between", color:C.textLight, gap:12 }}><span><span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:"#F59E0B", marginRight:6 }}/>Calls</span><b style={{ color:"#F59E0B" }}>{s.calls}</b></div>
        </div>;
      })()}
    </div>
  </Card>;
};

var SalesFunnel = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var qs = "?from=" + f.from + "&to=" + f.to;
    if (f.team) qs += "&team=" + encodeURIComponent(f.team);
    if (f.source && f.source !== "all") qs += "&source=" + encodeURIComponent(f.source);
    apiFetch("/api/reports/overview/funnel" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.from, f.to, f.team, f.source]);

  var headerRow = <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
    <div style={{ fontSize:13, fontWeight:700 }}>🌪 Sales Funnel</div>
    <div style={{ fontSize:10, color:C.textLight, fontStyle:"italic", textAlign:"right" }}>Conversion of leads created in this period (deals from older leads appear in Revenue KPI)</div>
  </div>;

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load: {state.error}</div>
    </Card>;
  }
  if (state.loading || !state.data) {
    return <Card style={{ marginBottom:14, padding:"14px 16px", minHeight:300 }}>
      {headerRow}
      {[0,1,2,3,4].map(function(i){
        return <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div style={{ width:90, height:14, background:"#F1F5F9", borderRadius:4 }}/>
          <div style={{ flex:1, height:24, background:"#F1F5F9", borderRadius:4, width:(100 - i*18) + "%" }}/>
          <div style={{ width:60, height:14, background:"#F1F5F9", borderRadius:4 }}/>
        </div>;
      })}
    </Card>;
  }

  var stages = (state.data && state.data.stages) || [];
  var bottleneckKey = state.data && state.data.bottleneckKey;
  var total = stages[0] ? stages[0].count : 0;

  if (total === 0) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      <div style={{ height:160, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:C.textLight, fontSize:13, padding:"0 24px", textAlign:"center", gap:6 }}>
        <div style={{ fontWeight:600, color:C.text }}>No new leads created in this period.</div>
        <div style={{ fontSize:12 }}>Pick a different range, or check Revenue KPI for deals from older leads.</div>
      </div>
    </Card>;
  }

  // Purple → green gradient across the 5 stages.
  var stageColors = ["#8B5CF6", "#6366F1", "#3B82F6", "#10B981", "#16A34A"];

  var fmtDays = function(d){
    if (d == null) return null;
    if (d < 0.1) return "<0.1d";
    return d.toFixed(1) + "d";
  };

  // EOI/Deal counts are scoped to leads created in the period — they won't
  // equal the EOI/Deals page totals (those pages have no date filter).
  // Surface this caveat as a hover hint on the count for those two stages.
  var stageHint = {
    eoi: "Counts EOIs from leads created in this period only. EOI page shows all active EOIs regardless of creation date.",
    deal: "Counts deals from leads created in this period only. Deals page shows all active deals regardless of creation date."
  };

  return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
    {headerRow}
    <div>
      {stages.map(function(s, i){
        var prop = total > 0 ? s.count / total : 0;
        var isBottle = s.key === bottleneckKey;
        var color = stageColors[i] || C.accent;
        var dayLabel = fmtDays(s.avgDays);
        return <div key={s.key} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:90, fontSize:12, fontWeight:600, color:C.text }}>{s.label}</div>
            <div style={{ flex:1, position:"relative", height:24 }}>
              <svg viewBox="0 0 100 24" preserveAspectRatio="none" style={{ width:"100%", height:"100%", display:"block" }}>
                <rect x={0} y={4} width={Math.max(0.5, prop * 100)} height={16} fill={color} rx={3}/>
              </svg>
            </div>
            <div style={{ width:80, textAlign:"right", fontSize:13, fontWeight:700, color:C.text }}>
              {s.count.toLocaleString()}
              {stageHint[s.key] && <span title={stageHint[s.key]} style={{ marginLeft:3, color:C.textLight, cursor:"help", fontSize:10, fontWeight:400 }}>ⓘ</span>}
            </div>
          </div>
          {i > 0 && <div style={{ fontSize:11, color:C.textLight, paddingLeft:102, marginTop:3, display:"flex", flexWrap:"wrap", gap:14, alignItems:"center" }}>
            <span><b style={{ color:C.text }}>{s.conversionPct == null ? "—" : s.conversionPct.toFixed(1) + "%"}</b> conversion</span>
            <span style={{ color: isBottle ? "#DC2626" : C.textLight, fontWeight: isBottle ? 700 : 500 }}>
              {s.dropOffPct == null ? "—" : "−" + s.dropOffPct.toFixed(1) + "% drop-off"}{isBottle ? " ⚠" : ""}
            </span>
            {dayLabel && <span style={{ color:C.textLight }}>~{dayLabel} avg</span>}
          </div>}
        </div>;
      })}
    </div>
    {bottleneckKey && (function(){
      var bIdx = -1;
      for (var i = 0; i < stages.length; i++) { if (stages[i].key === bottleneckKey) { bIdx = i; break; } }
      if (bIdx < 1) return null;
      var b = stages[bIdx], prev = stages[bIdx - 1];
      return <div style={{ marginTop:14, padding:"10px 12px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, fontSize:12, color:"#991B1B" }}>
        <b>⚠ Bottleneck: {prev.label} → {b.label}</b>
        {b.dropOffPct != null && <span> · {b.dropOffPct.toFixed(1)}% drop off here</span>}
        {b.avgDays != null && <span> · avg {b.avgDays.toFixed(1)} days in stage</span>}
      </div>;
    })()}
  </Card>;
};

var SourceRoiList = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var qs = "?from=" + f.from + "&to=" + f.to;
    if (f.team) qs += "&team=" + encodeURIComponent(f.team);
    if (f.source && f.source !== "all") qs += "&source=" + encodeURIComponent(f.source);
    apiFetch("/api/reports/overview/source-roi" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.from, f.to, f.team, f.source]);

  var headerRow = <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>📊 Source ROI</div>;

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load: {state.error}</div>
    </Card>;
  }
  if (state.loading || !state.data) {
    return <Card style={{ marginBottom:14, padding:"14px 16px", minHeight:220 }}>
      {headerRow}
      {[0,1,2,3,4].map(function(i){
        return <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div style={{ width:120, height:14, background:"#F1F5F9", borderRadius:4 }}/>
          <div style={{ flex:1, height:14, background:"#F1F5F9", borderRadius:4 }}/>
          <div style={{ width:60, height:14, background:"#F1F5F9", borderRadius:4 }}/>
          <div style={{ width:90, height:14, background:"#F1F5F9", borderRadius:4 }}/>
        </div>;
      })}
    </Card>;
  }

  var sources = (state.data && state.data.sources) || [];

  if (sources.length === 0) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center", color:C.textLight, fontSize:13 }}>No leads from any source in this period</div>
    </Card>;
  }

  // Heat-map color thresholds per spec: ≥10% green, 3-10% amber, <3% red.
  var convColor = function(pct){
    if (pct >= 10) return "#16A34A";
    if (pct >= 3)  return "#F59E0B";
    return "#DC2626";
  };

  return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
    {headerRow}
    {sources.map(function(s, i){
      var color = convColor(s.conversionPct);
      // Bar width = absolute conversion % capped at 100. A 10% conv reads as
      // a 10%-wide bar — same scale across all sources for direct comparison.
      var barWidth = Math.max(0.5, Math.min(100, s.conversionPct));
      return <div key={s.source} style={{ marginBottom: i < sources.length - 1 ? 12 : 0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:120, fontSize:12, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={s.source}>{s.source}</div>
          <div style={{ flex:1, position:"relative", height:18 }}>
            <svg viewBox="0 0 100 18" preserveAspectRatio="none" style={{ width:"100%", height:"100%", display:"block" }}>
              <rect x={0} y={4} width={barWidth} height={10} fill={color} rx={2}/>
            </svg>
          </div>
          <div style={{ width:54, textAlign:"right", fontSize:12, fontWeight:700, color:color }}>{s.conversionPct.toFixed(1)}%</div>
          <div style={{ width:90, textAlign:"right", fontSize:12, fontWeight:700, color:C.success }}>{fmtEGP(s.revenue)}</div>
        </div>
        <div style={{ fontSize:11, color:C.textLight, paddingLeft:132, marginTop:3 }}>
          {s.leadCount.toLocaleString()} lead{s.leadCount === 1 ? "" : "s"} · {s.dealCount.toLocaleString()} deal{s.dealCount === 1 ? "" : "s"}
        </div>
      </div>;
    })}
  </Card>;
};

var AgentLeaderboard = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  // expand/collapse state for the "View all N agents" toggle. Fetched list
  // contains all eligible agents (backend default = 100 cap); we slice
  // client-side so the toggle is instant with no extra round-trip.
  var [expanded, setExpanded] = useState(false);
  var [hover, setHover] = useState(false);
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var qs = "?from=" + f.from + "&to=" + f.to;
    if (f.team) qs += "&team=" + encodeURIComponent(f.team);
    if (f.source && f.source !== "all") qs += "&source=" + encodeURIComponent(f.source);
    apiFetch("/api/reports/overview/agents" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.from, f.to, f.team, f.source]);

  var headerRow = <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>🏆 Agent Leaderboard</div>;

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load: {state.error}</div>
    </Card>;
  }
  if (state.loading || !state.data) {
    return <Card style={{ marginBottom:14, padding:"14px 16px", minHeight:340 }}>
      {headerRow}
      <div style={{ fontSize:11, color:C.textLight, marginBottom:10 }}>Loading…</div>
      {[0,1,2,3,4,5,6,7,8,9].map(function(i){
        return <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <div style={{ width:24, height:14, background:"#F1F5F9", borderRadius:4 }}/>
          <div style={{ flex:1, height:14, background:"#F1F5F9", borderRadius:4 }}/>
        </div>;
      })}
    </Card>;
  }

  var agents = (state.data && state.data.agents) || [];
  var totalAgents = (state.data && state.data.totalAgents) || 0;
  var quarter = (state.data && state.data.quarter) || "";

  var subtitle = (function(){
    var bits = [];
    bits.push(totalAgents.toLocaleString() + " agent" + (totalAgents === 1 ? "" : "s") + " active");
    if (quarter) bits.push("Target vs " + quarter);
    if (f.source && f.source !== "all") bits.push("Calls shown for all sources");
    bits.push("Split deals halved per agent for revenue");
    return <div style={{ fontSize:11, color:C.textLight, marginBottom:10 }}>{bits.join(" · ")}</div>;
  })();

  if (agents.length === 0) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      {subtitle}
      <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:C.textLight, fontSize:13 }}>No agent activity in this period</div>
    </Card>;
  }

  var medal = function(rank){
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };
  var targetColor = function(pct){
    if (pct >= 70) return "#16A34A";
    if (pct >= 30) return "#F59E0B";
    return "#DC2626";
  };

  // Column flex spec — proportional widths so the table fills the card on
  // desktop. minWidth:0 on every flex cell so long agent names ellipsize
  // instead of pushing the row wider than the parent.
  var rankFlex = "0 0 32px";
  var H = function(label, flex, align){
    return <div style={{ flex: flex, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:0.4, color:C.textLight, textAlign: align || "left", minWidth: 0 }}>{label}</div>;
  };
  var V = function(content, flex, align, color, weight){
    return <div style={{ flex: flex, fontSize:12, color: color || C.text, textAlign: align || "left", fontWeight: weight || 600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth: 0 }}>{content}</div>;
  };

  // Slice client-side for instant toggle. canToggle gates the link visibility
  // so it never appears when the response already fits on one screen.
  var displayAgents = expanded ? agents : agents.slice(0, 10);
  var canToggle = agents.length > 10;

  // Outer Card has overflowX:auto for narrow viewports. Inner wrapper has
  // minWidth:720 so on screens narrower than that, the table keeps its
  // legible size and the Card scrolls horizontally; on wider screens the
  // wrapper grows to 100% and flex distributes the extra space.
  return <Card style={{ marginBottom:14, padding:"14px 16px", overflowX:"auto" }}>
    {headerRow}
    {subtitle}
    <div style={{ minWidth: 720 }}>
      <div style={{ display:"flex", gap:8, alignItems:"center", padding:"6px 0", borderBottom:"1px solid #E2E8F0" }}>
        {H("#", rankFlex)}
        {H("Agent", 1.5)}
        {H("Leads", 0.7, "right")}
        {H("Calls", 0.7, "right")}
        {H("Mtgs", 0.7, "right")}
        {H("EOIs", 0.7, "right")}
        {H("Deals", 0.7, "right")}
        {H("Revenue", 1, "right")}
        {H("Conv %", 0.7, "right")}
        {H("Target", 1.4, "left")}
      </div>
      {displayAgents.map(function(a, i){
        var rank = i + 1;
        var mEmoji = medal(rank);
        var tColor = targetColor(a.targetProgressPct || 0);
        var barW = Math.max(0, Math.min(100, a.targetProgressPct || 0));
        var convStr = (a.conversionPct == null) ? "—" : (a.conversionPct.toFixed(1) + "%");
        return <div key={a.agentId} style={{ display:"flex", gap:8, alignItems:"center", padding:"8px 0", borderBottom: i < displayAgents.length - 1 ? "1px dashed #F1F5F9" : "none" }}>
          <div style={{ flex: rankFlex, fontSize: mEmoji ? 16 : 13, fontWeight:700, color: mEmoji ? C.text : C.textLight, textAlign: "left" }}>{mEmoji || rank}</div>
          {V(a.name || "(unknown)", 1.5)}
          {V((a.leads || 0).toLocaleString(), 0.7, "right")}
          {V((a.calls || 0).toLocaleString(), 0.7, "right")}
          {V((a.meetings || 0).toLocaleString(), 0.7, "right")}
          {V((a.eois || 0).toLocaleString(), 0.7, "right")}
          {V((a.deals || 0).toLocaleString(), 0.7, "right")}
          {V(fmtEGP(a.revenue || 0), 1, "right", C.success, 700)}
          {V(convStr, 0.7, "right")}
          <div style={{ flex: 1.4, minWidth: 0 }}>
            {a.qTarget > 0 ? (
              <div>
                <div style={{ height:6, background:"#F1F5F9", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width: barW + "%", height:"100%", background: tColor, borderRadius:3 }}/>
                </div>
                <div style={{ fontSize:10, color:tColor, fontWeight:700, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {(a.targetProgressPct || 0).toFixed(0)}% of {fmtEGP(a.qTarget)}
                </div>
              </div>
            ) : (
              <div style={{ fontSize:10, color:C.textLight }}>No {quarter || "Q"} target</div>
            )}
          </div>
        </div>;
      })}
    </div>
    {canToggle && <div
      onClick={function(){ setExpanded(!expanded); }}
      onMouseEnter={function(){ setHover(true); }}
      onMouseLeave={function(){ setHover(false); }}
      style={{
        marginTop:10, textAlign:"right", fontSize:11, fontWeight:600,
        color: C.accent, cursor:"pointer", userSelect:"none",
        textDecoration: hover ? "underline" : "none"
      }}>
      {expanded ? "Show top 10 ←" : "View all " + agents.length + " agents →"}
    </div>}
  </Card>;
};

var LeadAgingBuckets = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var [hoverKey, setHoverKey] = useState(null);
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var bits = [];
    // Aging is a snapshot — no from/to. Team + source still apply.
    if (f.team) bits.push("team=" + encodeURIComponent(f.team));
    if (f.source && f.source !== "all") bits.push("source=" + encodeURIComponent(f.source));
    var qs = bits.length ? "?" + bits.join("&") : "";
    apiFetch("/api/reports/overview/aging" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.team, f.source]);

  var headerRow = <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
    <div style={{ fontSize:13, fontWeight:700 }}>⏱️ Lead Aging</div>
    <div title="Last contact = the agent's most recent meaningful action — a status change, feedback note, callback scheduled, or logged activity (call/meeting/etc). If none of those have happened since the agent took the lead, we show how long they've held it untouched."
         style={{ fontSize:11, color:C.textLight, cursor:"help" }}>ⓘ</div>
  </div>;

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load: {state.error}</div>
    </Card>;
  }
  if (state.loading || !state.data) {
    return <Card style={{ marginBottom:14, padding:"14px 16px", minHeight:140 }}>
      {headerRow}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10, marginTop:10 }}>
        {[0,1,2,3].map(function(i){
          return <div key={i} style={{ height:88, background:"#F1F5F9", borderRadius:10 }}/>;
        })}
      </div>
    </Card>;
  }

  var b = (state.data && state.data.buckets) || {};
  var filtersSpec = (state.data && state.data.filters) || {};
  var total = (state.data && state.data.total) || 0;

  if (total === 0) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      {headerRow}
      <div style={{ fontSize:11, color:C.textLight, marginBottom:10 }}>Active leads grouped by days since last contact</div>
      <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", color:C.textLight, fontSize:13 }}>No active leads</div>
    </Card>;
  }

  // Tile spec: high-priority on the left so the eye lands on red first.
  var tiles = [
    { key:"over14",    label:"14+ days",     sub:"High priority",   count: b.over14    || 0, bg:"#FEF2F2", border:"#FECACA", color:"#B91C1C" },
    { key:"days7to14", label:"7–14 days", sub:"Needs attention", count: b.days7to14 || 0, bg:"#FFFBEB", border:"#FDE68A", color:"#B45309" },
    { key:"days3to7",  label:"3–7 days",  sub:"Monitor",         count: b.days3to7  || 0, bg:"#F8FAFC", border:"#E2E8F0", color:"#475569" },
    { key:"under3",    label:"Under 3 days", sub:"Active",          count: b.under3    || 0, bg:"#ECFDF5", border:"#A7F3D0", color:"#047857" }
  ];

  var goToFilter = function(key){
    var spec = filtersSpec[key];
    if (!spec || !p.nav) return;
    if (p.setSpecialFilter) p.setSpecialFilter(spec);
    if (p.setFilter) p.setFilter("all");
    p.nav("leads");
  };

  return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
    {headerRow}
    <div style={{ fontSize:11, color:C.textLight, marginBottom:10 }}>
      Active leads grouped by days since last contact · {total.toLocaleString()} total
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0, 1fr))", gap:10 }}>
      {tiles.map(function(tile){
        var hovered = hoverKey === tile.key;
        return <div key={tile.key}
          onClick={function(){ goToFilter(tile.key); }}
          onMouseEnter={function(){ setHoverKey(tile.key); }}
          onMouseLeave={function(){ setHoverKey(null); }}
          style={{
            background: tile.bg,
            border: "1px solid " + tile.border,
            borderRadius: 10,
            padding: "12px 14px",
            cursor: "pointer",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            minHeight: 88,
            transform: hovered ? "translateY(-1px)" : "translateY(0)",
            boxShadow: hovered ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            transition: "transform 0.12s ease, box-shadow 0.12s ease"
          }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color: tile.color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{tile.label}</div>
              <div style={{ fontSize:10, color: tile.color, opacity:0.75, marginTop:2 }}>{tile.sub}</div>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color: tile.color, lineHeight:1 }}>{tile.count.toLocaleString()}</div>
          </div>
          <div style={{ fontSize:11, color: tile.color, fontWeight:700, textAlign:"right", opacity: hovered ? 1 : 0.7 }}>→</div>
        </div>;
      })}
    </div>
  </Card>;
};

var AlertsBanner = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var [hoverIdx, setHoverIdx] = useState(-1);
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    // Alerts ignore date range / source — each alert defines its own window.
    // Only the team filter is honored so admins can scope to a manager / TL.
    var qs = f.team ? "?team=" + encodeURIComponent(f.team) : "";
    apiFetch("/api/reports/overview/alerts" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.team]);

  // Hide silently while loading and on error — don't break the page
  // and don't flash an empty banner before data arrives.
  if (state.loading || state.error || !state.data) return null;
  var alerts = (state.data && state.data.alerts) || [];
  if (alerts.length === 0) return null;

  var dotColor = function(prio){ return prio === "high" ? "#DC2626" : "#F59E0B"; };

  var handleClick = function(a){
    var act = a && a.action;
    if (!act) return;
    if (act.type === "drill_aging") {
      if (p.setSpecialFilter) p.setSpecialFilter({ type: "aging", ageMin: act.ageMin });
      if (p.setFilter) p.setFilter("all");
      if (p.nav) p.nav("leads");
    } else if (act.type === "drill_meeting_aging") {
      if (p.setSpecialFilter) p.setSpecialFilter({ type: "aging", ageMin: act.ageMin });
      if (p.setFilter) p.setFilter(act.status || "MeetingDone");
      if (p.nav) p.nav("leads");
    } else if (act.type === "scroll_to" && act.target === "agent_leaderboard") {
      var el = (typeof document !== "undefined") ? document.getElementById("reports-agent-leaderboard") : null;
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (act.type === "set_source") {
      if (p.setReportsSource) p.setReportsSource(act.source);
    }
  };

  return <Card style={{ marginBottom:14, padding:"12px 14px", background:"#FFFBEB", border:"1px solid #FDE68A" }}>
    <div style={{ fontSize:12, fontWeight:700, color:"#B45309", marginBottom:6 }}>⚠️ Alerts</div>
    {alerts.map(function(a, i){
      var hovered = hoverIdx === i;
      return <div key={a.key + "_" + i}
        onClick={function(){ handleClick(a); }}
        onMouseEnter={function(){ setHoverIdx(i); }}
        onMouseLeave={function(){ setHoverIdx(-1); }}
        style={{
          display:"flex", alignItems:"center", gap:10, padding:"7px 0",
          borderTop: i > 0 ? "1px dashed #FCD34D" : "none",
          cursor:"pointer", userSelect:"none"
        }}>
        <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, background: dotColor(a.priority) }}/>
        <div style={{ flex:1, minWidth:0, fontSize:12, color:"#92400E", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.message}</div>
        <div style={{ fontSize:11, color:"#B45309", fontWeight:700, flexShrink:0, textDecoration: hovered ? "underline" : "none" }}>→ view</div>
      </div>;
    })}
  </Card>;
};

var ForecastCard = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    // Forecast uses its own windows (90d for win rate, current quarter for
    // target). Date range / source ignored. Team filter honored.
    var qs = f.team ? "?team=" + encodeURIComponent(f.team) : "";
    apiFetch("/api/reports/overview/forecast" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.team]);

  if (state.error) return null; // hide silently on error
  if (state.loading || !state.data) {
    return <Card style={{ marginBottom:14, padding:"14px 16px", minHeight:160 }}>
      <div style={{ height:14, width:140, background:"#F1F5F9", borderRadius:4, marginBottom:10 }}/>
      <div style={{ height:32, width:120, background:"#F1F5F9", borderRadius:6, marginBottom:8 }}/>
      <div style={{ height:10, width:200, background:"#F1F5F9", borderRadius:4, marginBottom:18 }}/>
      <div style={{ height:6, background:"#F1F5F9", borderRadius:3, marginBottom:6 }}/>
      <div style={{ height:10, width:240, background:"#F1F5F9", borderRadius:4 }}/>
    </Card>;
  }

  var fc = state.data.forecast || {};
  var q  = state.data.quarter  || {};
  var hasForecast = (fc.pipelineCount || 0) > 0;
  var hasQTarget  = (q.target || 0) > 0;
  // Hide entirely when there's nothing useful to show.
  if (!hasForecast && !hasQTarget) return null;

  var winRate = Number(fc.winRatePct) || 0;
  var pr = fc.projectedRevenue || { low:0, mid:0, high:0 };
  var pd = fc.projectedDeals   || { low:0, mid:0, high:0 };
  var sample = fc.sample || { dealsLast90:0, leadsLast90:0 };

  var qProgress = Number(q.progressPct) || 0;
  var barWidth  = Math.max(0, Math.min(100, qProgress));
  // Purple progress bar — distinct from the leaderboard's red/amber/green
  // semantic palette so it reads as "neutral progress" rather than a grade.
  var qBarColor = "#8B5CF6";

  var forecastTooltip = "Pipeline value × historical win rate (last 90 days). Range reflects ±20% uncertainty on revenue, ±30% on deal count.";
  var winRateNote = sample.leadsLast90 > 0
    ? winRate.toFixed(1) + "% win rate · " + sample.dealsLast90 + " deals from " + sample.leadsLast90 + " leads (90d)"
    : "";

  return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
    {hasForecast && <div style={{ marginBottom: hasQTarget ? 16 : 0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
        <div style={{ fontSize:13, fontWeight:700 }}>🔮 Forecast — next 30 days</div>
        <div title={forecastTooltip} style={{ fontSize:11, color:C.textLight, cursor:"help" }}>ⓘ</div>
      </div>
      {winRate > 0 ? <div>
        <div style={{ fontSize:30, fontWeight:800, color:C.success, lineHeight:1.1 }}>{fmtEGP(pr.mid)}</div>
        <div style={{ fontSize:12, color:C.textLight, marginTop:4 }}>
          range {fmtEGP(pr.low)} – {fmtEGP(pr.high)} · {pd.low.toLocaleString()}–{pd.high.toLocaleString()} deal{pd.high === 1 ? "" : "s"}
        </div>
        {winRateNote && <div style={{ fontSize:10, color:"#94A3B8", marginTop:3 }}>{winRateNote}</div>}
      </div> : <div>
        <div style={{ fontSize:13, fontWeight:600, color:C.textLight, padding:"6px 0" }}>Building forecast baseline…</div>
        <div style={{ fontSize:11, color:"#94A3B8" }}>{sample.dealsLast90} deals from {sample.leadsLast90.toLocaleString()} leads in the last 90 days — need at least one deal to project.</div>
      </div>}
    </div>}

    {hasForecast && hasQTarget && <div style={{ height:1, background:"#E2E8F0", margin:"0 0 14px" }}/>}

    {hasQTarget && <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <div style={{ fontSize:13, fontWeight:700 }}>🎯 {q.key} target progress</div>
        <div style={{ fontSize:13, fontWeight:700, color:qBarColor }}>{qProgress.toFixed(qProgress < 10 ? 1 : 0)}%</div>
      </div>
      <div style={{ height:8, background:"#F1F5F9", borderRadius:4, overflow:"hidden", marginBottom:6 }}>
        <div style={{ width: barWidth + "%", height:"100%", background: qBarColor, borderRadius:4, transition:"width 0.3s ease" }}/>
      </div>
      <div style={{ fontSize:11, color:C.textLight }}>
        {fmtEGP(q.achieved || 0)} of {fmtEGP(q.target || 0)} · {(q.daysRemaining || 0).toLocaleString()} day{q.daysRemaining === 1 ? "" : "s"} remaining in quarter
      </div>
    </div>}
  </Card>;
};

// ===== REPORTS =====
var ReportsPage = function(p) {
  var t = p.t;
  var cu = p.cu;

  var [tab, setTab] = useState("overview");
  var [filters, setFilters] = useState(function(){
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { from: monthStart.getTime(), to: now.getTime(), preset: "thisMonth", team: "", source: "all", compare: false };
  });

  if (cu.role !== "admin" && cu.role !== "sales_admin") {
    return <div style={{ padding:"40px 16px", textAlign:"center", color:C.textLight, fontSize:13 }}>
      Reports are not available for your role.
    </div>;
  }

  var presetRange = function(preset) {
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    var todayStart = new Date(y, m, d, 0, 0, 0, 0).getTime();
    if (preset === "today") return { from: todayStart, to: now.getTime() };
    if (preset === "yesterday") {
      return { from: new Date(y, m, d-1, 0, 0, 0, 0).getTime(), to: todayStart };
    }
    if (preset === "thisWeek") {
      var dow = now.getDay();
      var daysSinceSat = (dow - 6 + 7) % 7;
      return { from: new Date(y, m, d - daysSinceSat, 0, 0, 0, 0).getTime(), to: now.getTime() };
    }
    if (preset === "thisMonth") return { from: new Date(y, m, 1, 0, 0, 0, 0).getTime(), to: now.getTime() };
    if (preset === "thisQuarter") {
      var qStart = m < 3 ? 0 : m < 6 ? 3 : m < 9 ? 6 : 9;
      return { from: new Date(y, qStart, 1, 0, 0, 0, 0).getTime(), to: now.getTime() };
    }
    if (preset === "lastQuarter") {
      var curQStart = m < 3 ? 0 : m < 6 ? 3 : m < 9 ? 6 : 9;
      var lastQStart = curQStart - 3;
      var lastQYear = y;
      if (lastQStart < 0) { lastQStart = 9; lastQYear = y - 1; }
      return {
        from: new Date(lastQYear, lastQStart, 1, 0, 0, 0, 0).getTime(),
        to: new Date(lastQYear, lastQStart + 3, 1, 0, 0, 0, 0).getTime()
      };
    }
    if (preset === "thisYear") return { from: new Date(y, 0, 1, 0, 0, 0, 0).getTime(), to: now.getTime() };
    return null;
  };

  var setPreset = function(preset) {
    var range = presetRange(preset);
    if (!range) { setFilters(function(f){ return Object.assign({}, f, { preset: "custom" }); }); return; }
    setFilters(function(f){ return Object.assign({}, f, { preset: preset, from: range.from, to: range.to }); });
  };
  var setCustomFrom = function(ms) { setFilters(function(f){ return Object.assign({}, f, { preset: "custom", from: ms }); }); };
  var setCustomTo = function(ms) { setFilters(function(f){ return Object.assign({}, f, { preset: "custom", to: ms }); }); };

  var teamOptions = (p.users || []).filter(function(u){
    return u && u.active && (u.role === "manager" || u.role === "team_leader");
  });

  var sourceOptions = (function(){
    var set = {};
    SOURCES.forEach(function(s){ set[s] = true; });
    (p.leads || []).forEach(function(l){ if (l && l.source) set[l.source] = true; });
    return Object.keys(set).sort();
  })();

  var fmtDate = function(ms){ var d = new Date(ms); return d.toISOString().slice(0,10); };
  var fmtRange = function(){
    var fd = new Date(filters.from), td = new Date(filters.to);
    if (fd.toDateString() === td.toDateString()) return fd.toLocaleDateString();
    return fd.toLocaleDateString() + " — " + td.toLocaleDateString();
  };

  var tabs = [
    { id: "overview",  label: "Overview",  enabled: true },
    { id: "campaigns", label: "Campaigns", enabled: false },
    { id: "agents",    label: "Agents",    enabled: false },
    { id: "pipeline",  label: "Pipeline",  enabled: true }
  ];

  var presets = [
    { id: "today",       label: "Today" },
    { id: "yesterday",   label: "Yesterday" },
    { id: "thisWeek",    label: "This Week" },
    { id: "thisMonth",   label: "This Month" },
    { id: "thisQuarter", label: "This Quarter" },
    { id: "lastQuarter", label: "Last Quarter" },
    { id: "thisYear",    label: "This Year" }
  ];

  var handleExportPdf   = function(){ window.print(); };
  var handleExportExcel = function(){ window.alert("Excel export will be available once all report sections are built."); };

  var btnOutline = { padding:"6px 12px", fontSize:12, borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", color:C.text, cursor:"pointer", fontWeight:600 };

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>📊 {t.reports}</h2>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <button onClick={handleExportPdf} style={btnOutline}>Export PDF</button>
        <button onClick={handleExportExcel} style={Object.assign({}, btnOutline, { color: C.textLight })}>Export Excel</button>
      </div>
    </div>

    <div style={{ display:"flex", gap:4, marginBottom:14, borderBottom:"1px solid #E2E8F0" }}>
      {tabs.map(function(tb){
        var active = tab === tb.id;
        var disabled = !tb.enabled;
        return <button key={tb.id}
          onClick={function(){ if(!disabled) setTab(tb.id); }}
          title={disabled ? "Coming soon" : ""}
          style={{
            padding:"9px 16px", border:"none",
            borderBottom: active ? "2px solid "+C.accent : "2px solid transparent",
            background:"transparent",
            color: disabled ? "#CBD5E1" : (active ? C.accent : C.textLight),
            fontSize:13, fontWeight:600,
            cursor: disabled ? "not-allowed" : "pointer"
          }}>
          {tb.label}
          {disabled && <span style={{ marginInlineStart:6, fontSize:9, color:"#94A3B8", fontWeight:500 }}>Soon</span>}
        </button>;
      })}
    </div>

    {(tab === "overview" || tab === "pipeline") && <Card style={{ marginBottom:16, padding:"12px 14px" }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {presets.map(function(pr){
            var active = filters.preset === pr.id;
            return <button key={pr.id} onClick={function(){ setPreset(pr.id); }} style={{
              padding:"5px 10px", borderRadius:7,
              border:"1px solid", borderColor: active ? C.accent : "#E2E8F0",
              background: active ? C.accent + "12" : "#fff",
              color: active ? C.accent : C.textLight,
              fontSize:11, fontWeight:600, cursor:"pointer"
            }}>{pr.label}</button>;
          })}
        </div>

        <div style={{ width:1, height:22, background:"#E2E8F0" }}/>

        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <input type="date" value={fmtDate(filters.from)}
            onChange={function(e){ if(e.target.value) setCustomFrom(new Date(e.target.value).getTime()); }}
            style={{ padding:"4px 8px", borderRadius:7, border:"1px solid #E2E8F0", fontSize:11, background:"#fff" }}/>
          <span style={{ fontSize:11, color:C.textLight }}>→</span>
          <input type="date" value={fmtDate(filters.to)}
            onChange={function(e){ if(e.target.value) setCustomTo(new Date(e.target.value).getTime()); }}
            style={{ padding:"4px 8px", borderRadius:7, border:"1px solid #E2E8F0", fontSize:11, background:"#fff" }}/>
        </div>

        <div style={{ width:1, height:22, background:"#E2E8F0" }}/>

        <select value={filters.team}
          onChange={function(e){ setFilters(function(f){ return Object.assign({},f,{team:e.target.value}); }); }}
          style={{ padding:"5px 8px", borderRadius:7, border:"1px solid #E2E8F0", fontSize:11, background:"#fff" }}>
          <option value="">All teams</option>
          {teamOptions.map(function(u){ return <option key={gid(u)} value={gid(u)}>{u.name} ({u.role==="manager"?"Manager":"Team Leader"})</option>; })}
        </select>

        <select value={filters.source}
          onChange={function(e){ setFilters(function(f){ return Object.assign({},f,{source:e.target.value}); }); }}
          style={{ padding:"5px 8px", borderRadius:7, border:"1px solid #E2E8F0", fontSize:11, background:"#fff" }}>
          <option value="all">All sources</option>
          {sourceOptions.map(function(s){ return <option key={s} value={s}>{s}</option>; })}
        </select>

        <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:C.textLight, cursor:"pointer" }}>
          <input type="checkbox" checked={filters.compare}
            onChange={function(e){ setFilters(function(f){ return Object.assign({},f,{compare:e.target.checked}); }); }}/>
          Compare to previous period
        </label>

        <div style={{ flex:1, minWidth:8 }}/>
        <span style={{ fontSize:11, color:C.textLight }}>{fmtRange()}</span>
      </div>
    </Card>}

    {tab === "overview" && <ReportsOverviewBody filters={filters} cu={cu} t={t} token={p.token}
      nav={p.nav} setFilter={p.setFilter} setSpecialFilter={p.setSpecialFilter}
      setReportsSource={function(src){ setFilters(function(prev){ return Object.assign({}, prev, { source: src }); }); }}/>}

    {tab === "pipeline" && <ReportsPipelineBody filters={filters} cu={cu} t={t} token={p.token}
      nav={p.nav} setFilter={p.setFilter} setSpecialFilter={p.setSpecialFilter}/>}
  </div>;
};

var ReportsOverviewBody = function(p) {
  var sections = [
    { key:"alerts",   title:"Alerts",            height:60 },
    { key:"kpis",     title:"KPI Cards",         height:120 },
    { key:"trends",   title:"Trends",            height:240 },
    { key:"funnel",   title:"Sales Funnel",      height:300 },
    { key:"sources",  title:"Source ROI",        height:220 },
    { key:"agents",   title:"Agent Leaderboard", height:340 },
    { key:"aging",    title:"Lead Aging",        height:120 },
    { key:"forecast", title:"Forecast",          height:160 }
  ];
  return <div>
    {sections.map(function(s){
      if (s.key === "kpis") return <KpiCardsRow key="kpis" filters={p.filters} token={p.token}/>;
      if (s.key === "trends") return <TrendsChart key="trends" filters={p.filters} token={p.token}/>;
      if (s.key === "funnel") return <SalesFunnel key="funnel" filters={p.filters} token={p.token}/>;
      if (s.key === "sources") return <SourceRoiList key="sources" filters={p.filters} token={p.token}/>;
      if (s.key === "agents") return <div key="agents" id="reports-agent-leaderboard">
        <AgentLeaderboard filters={p.filters} token={p.token}/>
      </div>;
      if (s.key === "aging") return <LeadAgingBuckets key="aging" filters={p.filters} token={p.token}
        nav={p.nav} setFilter={p.setFilter} setSpecialFilter={p.setSpecialFilter}/>;
      if (s.key === "alerts") return <AlertsBanner key="alerts" filters={p.filters} token={p.token}
        nav={p.nav} setFilter={p.setFilter} setSpecialFilter={p.setSpecialFilter}
        setReportsSource={p.setReportsSource}/>;
      if (s.key === "forecast") return <ForecastCard key="forecast" filters={p.filters} token={p.token}/>;
      return <Card key={s.key} style={{ marginBottom:14, padding:"14px 16px", minHeight:s.height, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", background:"#FAFBFC", border:"1px dashed #E2E8F0" }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.textLight }}>{s.title}</div>
        <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>Section in development</div>
      </Card>;
    })}
  </div>;
};

var PipelineKpiCard = function(p) {
  var c = p.card;
  return <Card style={{ padding:"14px 16px", minHeight:96 }}>
    <div style={{ fontSize:11, color:C.textLight, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", display:"flex", alignItems:"center", gap:6 }}>
      <span>{c.label}</span>
      {c.tooltip && <span title={c.tooltip} style={{ cursor:"help", color:"#94A3B8", fontSize:10, fontWeight:700 }}>ⓘ</span>}
    </div>
    {p.skeleton
      ? <div style={{ height:24, marginTop:10, borderRadius:4, background:"#F1F5F9", width:"60%" }}/>
      : <div style={{ fontSize:22, fontWeight:800, color:c.color, marginTop:6 }}>{c.value}</div>}
    {!p.skeleton && c.hint && <div style={{ fontSize:10, color:C.textLight, marginTop:4 }}>{c.hint}</div>}
  </Card>;
};

var PipelineKpiRow = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var f = p.filters;

  useEffect(function(){
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var qs = "?from=" + f.from + "&to=" + f.to;
    if (f.team) qs += "&team=" + encodeURIComponent(f.team);
    if (f.source && f.source !== "all") qs += "&source=" + encodeURIComponent(f.source);
    apiFetch("/api/reports/pipeline/kpis" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.from, f.to, f.team, f.source]);

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load Pipeline KPIs: {state.error}</div>
    </Card>;
  }

  var skel = state.loading || !state.data;
  var k = state.data || {};
  var pv = k.pipelineValue || {};
  var wf = k.weightedForecast || {};
  var wr = k.winRatePct || {};
  var vel = k.avgVelocityDays || {};
  var wrSample = wr.sample || {};

  var fmtPct = function(v){ return (Number(v) || 0).toFixed(1) + "%"; };
  var fmtDays = function(v){ var n = Number(v) || 0; return n < 1 ? n.toFixed(1) + " d" : Math.round(n) + " d"; };

  var methodology = wf.methodology || "fixed";
  var wfTooltip = methodology === "historical"
    ? "Σ (stage value × historical win rate). Per-stage probability comes from leads that touched the stage in the last 90 days. Sample threshold (≥ 20 closed deals) met."
    : "Σ (stage value × fixed coefficient). Sample below the 20-deal threshold needed for historical rates. Coefficients: NewLead 5%, Potential 15%, HotCase 35%, MeetingDone 60%, CallBack 25%.";

  var cards = [
    { id:"pipeline", label:"Open pipeline value", color: C.info,
      value: skel ? "" : fmtEGP(pv.value),
      hint:  skel ? "" : "snapshot · all open stages",
      tooltip: "Σ raw budget of leads in NewLead/Potential/HotCase/MeetingDone/CallBack. Lead-only, mirrors excluded. Ignores date range." },
    { id:"forecast", label:"Weighted forecast", color: C.accent,
      value: skel ? "" : fmtEGP(wf.value),
      hint:  skel ? "" : (methodology === "historical" ? "historical · last 90 days" : "fixed coefficients · low sample"),
      tooltip: wfTooltip },
    { id:"winrate", label:"Win rate", color: C.success,
      value: skel ? "" : fmtPct(wr.value),
      hint:  skel ? "" : ((wrSample.won || 0) + " won · " + (wrSample.lost || 0) + " lost"),
      tooltip: "DoneDeal / (DoneDeal + NotInterested + NoAnswer) for leads resolved in the selected range. Lead-only, mirrors excluded." },
    { id:"velocity", label:"Sales velocity (median)", color:"#8B5CF6",
      value: skel ? "" : (vel.sampleSize ? fmtDays(vel.value) : "—"),
      hint:  skel ? "" : (vel.sampleSize ? ("median of " + vel.sampleSize + " deals") : "no deals closed in range"),
      tooltip: "Median days from lead created to deal closed, for DoneDeals in range. Lead-only, mirrors excluded." }
  ];

  return <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))", gap:10, marginBottom:14 }}>
    {cards.map(function(c){ return <PipelineKpiCard key={c.id} card={c} skeleton={skel}/>; })}
  </div>;
};

var PipelineByStageRow = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var qs = "";
    if (f.team) qs += (qs ? "&" : "?") + "team=" + encodeURIComponent(f.team);
    if (f.source && f.source !== "all") qs += (qs ? "&" : "?") + "source=" + encodeURIComponent(f.source);
    apiFetch("/api/reports/pipeline/by-stage" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.team, f.source]);

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load pipeline by stage: {state.error}</div>
    </Card>;
  }

  var stageDef = {
    NewLead:     { label: "New Lead",     color: "#8B5CF6", tint: "rgba(139, 92, 246, 0.08)" },
    Potential:   { label: "Potential",    color: "#3B82F6", tint: "rgba(59, 130, 246, 0.08)" },
    HotCase:     { label: "Hot Case",     color: "#F59E0B", tint: "rgba(245, 158, 11, 0.08)" },
    CallBack:    { label: "Callback",     color: "#06B6D4", tint: "rgba(6, 182, 212, 0.08)" },
    MeetingDone: { label: "Meeting Done", color: "#10B981", tint: "rgba(16, 185, 129, 0.08)" }
  };
  var stageOrder = ["NewLead", "Potential", "HotCase", "CallBack", "MeetingDone"];

  var skel = state.loading || !state.data;
  var stages = (state.data && state.data.stages) || [];
  var byKey = {};
  stages.forEach(function(s){ byKey[s.key] = s; });

  var goToStage = function(stageKey) {
    if (p.setFilter) p.setFilter(stageKey);
    if (p.nav) p.nav("leads");
  };

  return <Card style={{ marginBottom:14, padding:"12px 14px" }}>
    <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:8 }}>Pipeline by stage</div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:8 }}>
      {stageOrder.map(function(key){
        var def = stageDef[key];
        var s = byKey[key] || { count: 0, value: 0, avgDaysInStage: 0 };
        var hasLeads = !skel && (s.count || 0) > 0;
        return <div key={key}
          onClick={hasLeads ? function(){ goToStage(key); } : null}
          title={hasLeads ? "View leads in " + def.label : ""}
          style={{
            background: def.tint, border: "1px solid " + def.color + "33", borderRadius: 10,
            padding: "10px 12px", cursor: hasLeads ? "pointer" : "default", minHeight: 110,
            display:"flex", flexDirection:"column", gap:4
          }}>
          <div style={{ fontSize:11, fontWeight:700, color:def.color, textTransform:"uppercase", letterSpacing:"0.04em" }}>{def.label}</div>
          {skel
            ? <div style={{ height:24, marginTop:4, borderRadius:4, background:"#E2E8F0", width:"50%" }}/>
            : <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{s.count}</div>}
          {!skel && <div style={{ fontSize:12, fontWeight:600, color:C.textLight }}>{s.value > 0 ? fmtEGP(s.value) : "—"}</div>}
          {!skel && <div style={{ fontSize:10, color:"#94A3B8", marginTop:"auto" }}>
            {s.count > 0 ? ("avg " + s.avgDaysInStage + " d in stage") : "no leads in stage"}
          </div>}
        </div>;
      })}
    </div>
  </Card>;
};

var DealsAtRiskTable = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var [expanded, setExpanded] = useState(false);
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var qs = "";
    if (f.team) qs += (qs ? "&" : "?") + "team=" + encodeURIComponent(f.team);
    if (f.source && f.source !== "all") qs += (qs ? "&" : "?") + "source=" + encodeURIComponent(f.source);
    apiFetch("/api/reports/pipeline/at-risk" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.team, f.source]);

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load deals at risk: {state.error}</div>
    </Card>;
  }

  var skel = state.loading || !state.data;
  var deals = (state.data && state.data.deals) || [];
  var total = (state.data && state.data.total) || 0;
  var visible = expanded ? deals.slice(0, 50) : deals.slice(0, 20);

  var stageBadge = function(stage) {
    var color = stage === "HotCase" ? "#F59E0B" : "#10B981";
    var label = stage === "HotCase" ? "Hot Case" : "Meeting Done";
    var bg    = stage === "HotCase" ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)";
    return <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:6, background:bg, color:color, fontSize:10, fontWeight:700 }}>{label}</span>;
  };

  var ageCell = function(days) {
    var color = days >= 14 ? "#DC2626" : "#F59E0B";
    var fmt = days >= 1 ? Math.round(days) : days.toFixed(1);
    return <span style={{ color:color, fontWeight:700 }}>{fmt} d</span>;
  };

  var openLead = function(deal) {
    if (p.nav) p.nav("leads", { _id: deal.leadId, name: deal.name, status: deal.stage });
  };

  var thStyle = { textAlign:"left", padding:"6px 8px", fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"0.04em", fontSize:10 };
  var thRight = Object.assign({}, thStyle, { textAlign:"right" });

  return <Card style={{ marginBottom:14, padding:"12px 14px" }}>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, flexWrap:"wrap", gap:8 }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>Deals at risk</div>
      {!skel && <div style={{ fontSize:11, color:C.textLight }}>{total} {total === 1 ? "lead" : "leads"} stalled 7+ days</div>}
    </div>

    {skel && [0,1,2,3].map(function(i){ return <div key={i} style={{ height:32, marginBottom:6, background:"#F1F5F9", borderRadius:6 }}/>; })}

    {!skel && deals.length === 0 && <div style={{ fontSize:12, color:C.textLight, padding:"24px 8px", textAlign:"center" }}>
      ✓ No at-risk deals — all advanced-stage leads contacted within 7 days.
    </div>}

    {!skel && deals.length > 0 && <div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E2E8F0" }}>
              <th style={thStyle}>Lead</th>
              <th style={thStyle}>Stage</th>
              <th style={thRight}>Value</th>
              <th style={thStyle}>Agent</th>
              <th style={thRight}>Stale</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(function(d, i){
              return <tr key={d.leadId + "-" + i}
                onClick={function(){ openLead(d); }}
                onMouseEnter={function(e){ e.currentTarget.style.background = "#F8FAFC"; }}
                onMouseLeave={function(e){ e.currentTarget.style.background = "transparent"; }}
                style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer" }}>
                <td style={{ padding:"8px", color:C.text, fontWeight:600 }}>{d.name || "—"}</td>
                <td style={{ padding:"8px" }}>{stageBadge(d.stage)}</td>
                <td style={{ padding:"8px", textAlign:"right", color:C.text }}>{d.value > 0 ? fmtEGP(d.value) : "—"}</td>
                <td style={{ padding:"8px", color:C.textLight }}>{d.agentName}</td>
                <td style={{ padding:"8px", textAlign:"right" }}>{ageCell(d.daysSinceLastContact)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {!expanded && total > 20 && <div style={{ marginTop:8, textAlign:"center" }}>
        <button onClick={function(){ setExpanded(true); }} style={{
          background:"none", border:"none", color:C.accent, fontSize:11, fontWeight:600, cursor:"pointer", padding:"6px 12px"
        }}>View all {total > 50 ? "(top 50 of " + total + ")" : total} at-risk →</button>
      </div>}
    </div>}
  </Card>;
};

var PipelineByProjectTable = function(p) {
  var [state, setState] = useState({ loading: true, data: null, error: null });
  var [expanded, setExpanded] = useState(false);
  var f = p.filters;

  useEffect(function() {
    var aborted = false;
    setState(function(s){ return Object.assign({}, s, { loading: true, error: null }); });
    var qs = "?from=" + f.from + "&to=" + f.to;
    if (f.team) qs += "&team=" + encodeURIComponent(f.team);
    if (f.source && f.source !== "all") qs += "&source=" + encodeURIComponent(f.source);
    apiFetch("/api/reports/pipeline/by-project" + qs, "GET", null, p.token)
      .then(function(d){ if (!aborted) setState({ loading: false, data: d, error: null }); })
      .catch(function(e){ if (!aborted) setState({ loading: false, data: null, error: (e && e.message) || "Failed to load" }); });
    return function(){ aborted = true; };
  }, [f.from, f.to, f.team, f.source]);

  if (state.error) {
    return <Card style={{ marginBottom:14, padding:"14px 16px" }}>
      <div style={{ fontSize:12, color:"#DC2626", fontWeight:600 }}>Couldn't load pipeline by project: {state.error}</div>
    </Card>;
  }

  var skel = state.loading || !state.data;
  var projects = (state.data && state.data.projects) || [];
  var total = (state.data && state.data.total) || 0;
  var visible = expanded ? projects.slice(0, 50) : projects.slice(0, 12);

  var openProject = function(projectName) {
    if (p.setSpecialFilter) p.setSpecialFilter({ type: "project", value: projectName || "" });
    if (p.setFilter) p.setFilter("all");
    if (p.nav) p.nav("leads");
  };

  var thStyle = { textAlign:"left", padding:"6px 8px", fontWeight:600, color:C.textLight, textTransform:"uppercase", letterSpacing:"0.04em", fontSize:10 };
  var thRight = Object.assign({}, thStyle, { textAlign:"right" });

  return <Card style={{ marginBottom:14, padding:"12px 14px" }}>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, flexWrap:"wrap", gap:8 }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>Pipeline by project</div>
      {!skel && <div style={{ fontSize:11, color:C.textLight }}>{total} {total === 1 ? "project" : "projects"}</div>}
    </div>
    <div style={{ fontSize:10, color:"#94A3B8", marginBottom:8 }}>
      Open columns reflect current snapshot · Closed columns reflect selected date range
    </div>

    {skel && [0,1,2,3,4].map(function(i){ return <div key={i} style={{ height:32, marginBottom:6, background:"#F1F5F9", borderRadius:6 }}/>; })}

    {!skel && projects.length === 0 && <div style={{ fontSize:12, color:C.textLight, padding:"24px 8px", textAlign:"center" }}>
      No projects with pipeline activity.
    </div>}

    {!skel && projects.length > 0 && <div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid #E2E8F0" }}>
              <th style={thStyle}>Project</th>
              <th style={thRight}>Open</th>
              <th style={thRight}>Open value</th>
              <th style={thRight}>Closed</th>
              <th style={thRight}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(function(pr, i){
              var displayName = pr.project || "(no project)";
              var isEmpty = !pr.project;
              return <tr key={(pr.project || "_") + "-" + i}
                onClick={function(){ openProject(pr.project); }}
                onMouseEnter={function(e){ e.currentTarget.style.background = "#F8FAFC"; }}
                onMouseLeave={function(e){ e.currentTarget.style.background = "transparent"; }}
                style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer" }}>
                <td style={{ padding:"8px", color: isEmpty ? C.textLight : C.text, fontWeight:600, fontStyle: isEmpty ? "italic" : "normal" }}>{displayName}</td>
                <td style={{ padding:"8px", textAlign:"right", color:C.text }}>{pr.openCount}</td>
                <td style={{ padding:"8px", textAlign:"right", color:C.text }}>{pr.openValue > 0 ? fmtEGP(pr.openValue) : "—"}</td>
                <td style={{ padding:"8px", textAlign:"right", color:C.textLight }}>{pr.dealsCount}</td>
                <td style={{ padding:"8px", textAlign:"right", color:C.textLight }}>{pr.dealsRevenue > 0 ? fmtEGP(pr.dealsRevenue) : "—"}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {!expanded && total > 12 && <div style={{ marginTop:8, textAlign:"center" }}>
        <button onClick={function(){ setExpanded(true); }} style={{
          background:"none", border:"none", color:C.accent, fontSize:11, fontWeight:600, cursor:"pointer", padding:"6px 12px"
        }}>View all {total > 50 ? "(top 50 of " + total + ")" : total} projects →</button>
      </div>}
    </div>}
  </Card>;
};

var ReportsPipelineBody = function(p) {
  var sections = [
    { key:"kpis",      title:"Pipeline KPIs",       height:120 },
    { key:"byStage",   title:"Pipeline by Stage",   height:200 },
    { key:"atRisk",    title:"Deals at Risk",       height:280 },
    { key:"byProject", title:"Pipeline by Project", height:280 },
    { key:"outcomes",  title:"Outcome Breakdown",   height:180 }
  ];
  return <div>
    {sections.map(function(s){
      if (s.key === "kpis") return <PipelineKpiRow key="kpis" filters={p.filters} token={p.token}/>;
      if (s.key === "byStage") return <PipelineByStageRow key="byStage" filters={p.filters} token={p.token} nav={p.nav} setFilter={p.setFilter}/>;
      if (s.key === "atRisk") return <DealsAtRiskTable key="atRisk" filters={p.filters} token={p.token} nav={p.nav}/>;
      if (s.key === "byProject") return <PipelineByProjectTable key="byProject" filters={p.filters} token={p.token} nav={p.nav} setFilter={p.setFilter} setSpecialFilter={p.setSpecialFilter}/>;
      return <Card key={s.key} style={{ marginBottom:14, padding:"14px 16px", minHeight:s.height, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", background:"#FAFBFC", border:"1px dashed #E2E8F0" }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.textLight }}>{s.title}</div>
        <div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>Section in development</div>
      </Card>;
    })}
  </div>;
};

// ===== PROJECTS =====
var ProjectsPage = function(p) {
  var t=p.t;
  var pj=[{id:1,name:"العاصمة الإدارية",developer:"شركة النيل",units:450,sold:280,loc:"العاصمة الإدارية الجديدة"},{id:2,name:"المستقبل سيتي",developer:"شركة الأهلي",units:320,sold:190,loc:"المستقبل سيتي"},{id:3,name:"التجمع الخامس",developer:"بالم هيلز",units:200,sold:145,loc:"القاهرة الجديدة"},{id:4,name:"الشروق",developer:"المقاولون العرب",units:180,sold:95,loc:"مدينة الشروق"},{id:5,name:"6 أكتوبر",developer:"سوديك",units:260,sold:210,loc:"مدينة 6 أكتوبر"}];
  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>{t.projects}</h2>
    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
      {pj.map(function(pr){return <Card key={pr.id} style={{ flex:"1 1 260px", maxWidth:340 }}>
        <h3 style={{ margin:"0 0 4px", fontSize:15, fontWeight:700 }}>{pr.name}</h3>
        <div style={{ fontSize:12, color:C.textLight, marginBottom:14 }}>{pr.developer} · {pr.loc}</div>
        <div style={{ display:"flex", justifyContent:"space-around", marginBottom:12 }}>
          {[{v:pr.units,l:t.units,c:C.text},{v:pr.sold,l:t.sold,c:C.success},{v:pr.units-pr.sold,l:t.available,c:C.warning}].map(function(s){return <div key={s.l} style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:700, color:s.c }}>{s.v}</div><div style={{ fontSize:10, color:C.textLight }}>{s.l}</div></div>;})}
        </div>
        <div style={{ height:6, background:"#F1F5F9", borderRadius:3 }}><div style={{ height:"100%", width:Math.round(pr.sold/pr.units*100)+"%", background:"linear-gradient(90deg,"+C.success+","+C.accentLight+")", borderRadius:3 }}/></div>
      </Card>;})}
    </div>
  </div>;
};

var SettingsPage = function(p) {
  var t=p.t;
  var getSaved = function(k,def){ try{ return localStorage.getItem('crm_set_'+k)||def; }catch(e){return def;} };
  // Rotation eligibility (spec v3): only sales + team_leader receive leads.
  var salesAgentsForSetting = p.users ? p.users.filter(function(u){return (u.role==="sales"||u.role==="team_leader")&&u.active;}) : [];
  var [company,setCompany]=useState(function(){return getSaved('company','ARO Investment');});
  var [em,setEm]=useState(function(){return getSaved('email','admin@aro.com');});
  var [ph,setPh]=useState(function(){return getSaved('phone','01012345678');});
  var [timezone,setTimezone]=useState(function(){return getSaved('timezone','Cairo (GMT+2)');});
  var [currency,setCurrency]=useState(function(){return getSaved('currency','EGP · Egyptian Pound');});
  // Rotation settings live in MongoDB — single source of truth for every user.
  // Start with empty/defaults; useEffect below hydrates from /api/settings/rotation.
  var [tier1,setTier1]=useState([]);
  var [tier2,setTier2]=useState([]);
  var [tier3,setTier3]=useState([]);
  var [tier1LastIdx,setTier1LastIdx]=useState(-1);
  var [rotNoAnswerCount,setRotNoAnswerCount]=useState(2);
  var [rotNoAnswerHours,setRotNoAnswerHours]=useState(1);
  var [rotNotIntDays,setRotNotIntDays]=useState(1);
  var [rotNoActDays,setRotNoActDays]=useState(2);
  var [rotCbDays,setRotCbDays]=useState(1);
  var [rotHotDays,setRotHotDays]=useState(2);
  var [rotStopDays,setRotStopDays]=useState(45);
  // Master switch + pause
  var [autoRotEnabled,setAutoRotEnabled]=useState(true);
  var [pausedUntil,setPausedUntil]=useState(null);
  // Working hours (company default)
  var [whDays,setWhDays]=useState(["Sun","Mon","Tue","Wed","Thu"]);
  var [whFrom,setWhFrom]=useState("10:00");
  var [whTo,setWhTo]=useState("19:00");
  var [whAfter,setWhAfter]=useState("queue");
  // Smart skip rules
  var [srVac,setSrVac]=useState(true);
  var [srOffH,setSrOffH]=useState(4);
  var [srHours,setSrHours]=useState(true);
  var [srHandled,setSrHandled]=useState(true);
  var [srHaltNI,setSrHaltNI]=useState(3);
  var [srHaltAll,setSrHaltAll]=useState(true);
  var [manualWindowMin,setManualWindowMin]=useState(15);
  // Phase Q — days of inactivity by holding sales after which a lead disappears
  // from sales / manager / team_leader views. Admin / sales_admin always see all.
  var [staleLeadDays,setStaleLeadDays]=useState(7);
  var [simulateOpen,setSimulateOpen]=useState(false);
  var [redistBusy,setRedistBusy]=useState(false);
  var [redistResult,setRedistResult]=useState(null); // {total,distributed,skipped,perAgent}
  // Audit Log tab
  var [auditEntries,setAuditEntries]=useState([]);   // populated from /api/settings/audit when endpoint ships
  var [auditLoaded,setAuditLoaded]=useState(false);
  var [auditDate,setAuditDate]=useState("all");     // "today" | "week" | "month" | "all"
  var [auditAdmin,setAuditAdmin]=useState("all");
  var [auditField,setAuditField]=useState("all");
  useEffect(function(){
    var cancelled=false;
    apiFetch("/api/settings/audit","GET",null,p.token)
      .then(function(data){ if(!cancelled && Array.isArray(data)) setAuditEntries(data); })
      .catch(function(){}) // endpoint may not exist yet — silently leave empty
      .finally(function(){ if(!cancelled) setAuditLoaded(true); });
    return function(){ cancelled=true; };
  },[p.token]);
  // Business Rules tab — UI-only toggles (backend enforces the locked ones regardless)
  var [bizRules,setBizRules]=useState({
    excludeArchived:   true,  // rotation exclusions
    cancelReturnsHot:  true,  // cancel behavior
    cancelForcedRot:   true,
    maxRotationsPerLead:0,    // limits (0 = no cap)
    salesEoiToPending: true,  // workflow
    doneRemovesEoi:    true
  });
  var [saved,setSaved]=useState(false);
  var [saveError,setSaveError]=useState("");
  var [loading,setLoading]=useState(true);
  var [activeTab,setActiveTab]=useState("general");

  useEffect(function(){
    var cancelled=false;
    apiFetch("/api/settings/rotation","GET",null,p.token).then(function(s){
      if(cancelled||!s) return;
      var t=(s&&s.tiers)||{};
      var g=function(k){return (t[k]&&Array.isArray(t[k].agents))?t[k].agents.map(String):[];};
      setTier1(g("tier1"));
      setTier2(g("tier2"));
      setTier3(g("tier3"));
      setTier1LastIdx((t.tier1&&typeof t.tier1.lastIdx==="number")?t.tier1.lastIdx:-1);
      setRotNoAnswerCount(Number(s.naCount)||2);
      setRotNoAnswerHours(Number(s.naHours)||1);
      setRotNotIntDays(Number(s.niDays)||1);
      setRotNoActDays(Number(s.noActDays)||2);
      setRotCbDays(Number(s.cbDays)||1);
      setRotHotDays(Number(s.hotDays)||2);
      setRotStopDays(Number(s.rotationStopAfterDays)||45);
      if(s.manualAssignmentWindowMinutes!=null) setManualWindowMin(Number(s.manualAssignmentWindowMinutes)||0);
      if(s.staleLeadDays!=null) setStaleLeadDays(Number(s.staleLeadDays)||7);
      setAutoRotEnabled(s.autoRotationEnabled!==false);
      setPausedUntil(s.autoRotationPausedUntil||null);
      var w=s.workingHours||{};
      if(Array.isArray(w.days)) setWhDays(w.days);
      if(w.from) setWhFrom(w.from);
      if(w.to) setWhTo(w.to);
      if(w.afterHoursBehavior) setWhAfter(w.afterHoursBehavior);
      var sr=s.smartSkipRules||{};
      if(typeof sr.skipOnVacation==="boolean") setSrVac(sr.skipOnVacation);
      if(sr.skipIfOfflineHours!=null) setSrOffH(Number(sr.skipIfOfflineHours)||0);
      if(typeof sr.respectWorkingHours==="boolean") setSrHours(sr.respectWorkingHours);
      if(typeof sr.skipIfAlreadyHandled==="boolean") setSrHandled(sr.skipIfAlreadyHandled);
      if(sr.haltAfterNotInterested!=null) setSrHaltNI(Number(sr.haltAfterNotInterested)||0);
      if(typeof sr.haltWhenAllHandled==="boolean") setSrHaltAll(sr.haltWhenAllHandled);
    }).catch(function(){}).finally(function(){ if(!cancelled) setLoading(false); });
    return function(){ cancelled=true; };
  },[p.token]);

  // Vacation state — admin/sales_admin only. Loaded on mount; refreshed after
  // every create/cancel. Active set is derived on render for the agent badge.
  var [vacations,setVacations]=useState([]);
  var [vacModalAgent,setVacModalAgent]=useState(null); // user object when modal open
  var [vacStart,setVacStart]=useState("");
  var [vacEnd,setVacEnd]=useState("");
  var [vacReason,setVacReason]=useState("");
  var [vacSaving,setVacSaving]=useState(false);
  var [vacError,setVacError]=useState("");
  var canManageVacations = p.cu && (p.cu.role==="admin" || p.cu.role==="sales_admin");
  var loadVacations = function(){
    if(!canManageVacations || !p.token) return;
    apiFetch("/api/vacations","GET",null,p.token)
      .then(function(rows){ setVacations(Array.isArray(rows)?rows:[]); })
      .catch(function(){});
  };
  useEffect(function(){ loadVacations(); /* eslint-disable-next-line */ },[p.token, p.cu && p.cu.role]);
  var activeVacSet = (function(){
    var now = new Date();
    var s = new Set();
    (vacations||[]).forEach(function(v){
      if(!v || !v.agentId) return;
      var start = new Date(v.startDate), end = new Date(v.endDate);
      if(start <= now && now <= end){
        var aid = v.agentId && v.agentId._id ? v.agentId._id : v.agentId;
        s.add(String(aid));
      }
    });
    return s;
  })();
  var openVacModal = function(uid){
    var u = (p.users||[]).find(function(x){return String(gid(x))===String(uid);});
    if(!u) return;
    setVacError("");
    var today = new Date().toISOString().slice(0,10);
    setVacStart(today); setVacEnd(today); setVacReason("");
    setVacModalAgent(u);
  };
  var closeVacModal = function(){ setVacModalAgent(null); setVacError(""); };
  var saveVacation = async function(){
    if(!vacModalAgent) return;
    if(!vacStart || !vacEnd){ setVacError("Start and end date required"); return; }
    if(new Date(vacEnd) < new Date(vacStart)){ setVacError("End must be ≥ start"); return; }
    setVacSaving(true); setVacError("");
    try {
      await apiFetch("/api/vacations","POST",{
        agentId: gid(vacModalAgent),
        startDate: vacStart,
        endDate: vacEnd,
        reason: vacReason
      }, p.token);
      closeVacModal();
      loadVacations();
    } catch(e) {
      setVacError((e && e.message) || "Failed to save");
    } finally {
      setVacSaving(false);
    }
  };
  var cancelVacation = async function(id){
    if(!id) return;
    if(!window.confirm("Cancel this vacation?")) return;
    try {
      await apiFetch("/api/vacations/"+id,"DELETE",null,p.token);
      loadVacations();
    } catch(e) { alert((e&&e.message)||"Failed"); }
  };

  // Tier-aware drag state: source and destination each tracked with {tier,idx}.
  var [dragFrom,setDragFrom]=useState(null);
  var [dropOn,setDropOn]=useState(null);
  var tierArrays=function(){return {tier1:tier1.slice(),tier2:tier2.slice(),tier3:tier3.slice()};};
  var writeTiers=function(a){setTier1(a.tier1);setTier2(a.tier2);setTier3(a.tier3);};
  // Atomic move across tiers: splice from source, insert at destination index.
  var moveAgent=function(from,to){
    if(!from||!to) return;
    if(from.tier===to.tier&&from.idx===to.idx) return;
    var arrs=tierArrays();
    var src=arrs[from.tier], dst=arrs[to.tier];
    var moved=src.splice(from.idx,1)[0];
    if(!moved) return;
    var effIdx=(from.tier===to.tier&&from.idx<to.idx)?to.idx-1:to.idx;
    dst.splice(Math.max(0,Math.min(effIdx,dst.length)),0,moved);
    writeTiers(arrs);
  };
  var appendToTier=function(uid,tierKey){
    var arrs=tierArrays();
    ["tier1","tier2","tier3"].forEach(function(k){arrs[k]=arrs[k].filter(function(x){return x!==uid;});});
    arrs[tierKey].push(uid);
    writeTiers(arrs);
  };
  var removeFromAllTiers=function(uid){
    var arrs=tierArrays();
    ["tier1","tier2","tier3"].forEach(function(k){arrs[k]=arrs[k].filter(function(x){return x!==uid;});});
    writeTiers(arrs);
  };
  var doSave=async function(){
    setSaveError("");
    try{
      localStorage.setItem('crm_set_company',company);
      localStorage.setItem('crm_set_email',em);
      localStorage.setItem('crm_set_phone',ph);
      localStorage.setItem('crm_set_timezone',timezone);
      localStorage.setItem('crm_set_currency',currency);
    }catch(e){}
    try{
      await apiFetch("/api/settings/rotation","PUT",{
        tiers: {
          tier1: { agents: tier1 },
          tier2: { agents: tier2 },
          tier3: { agents: tier3 }
        },
        naCount: Number(rotNoAnswerCount),
        naHours: Number(rotNoAnswerHours),
        niDays:  Number(rotNotIntDays),
        noActDays: Number(rotNoActDays),
        cbDays:  Number(rotCbDays),
        hotDays: Number(rotHotDays),
        rotationStopAfterDays: Number(rotStopDays),
        manualAssignmentWindowMinutes: Number(manualWindowMin)||0,
        staleLeadDays: Number(staleLeadDays)||7,
        autoRotationEnabled: autoRotEnabled,
        autoRotationPausedUntil: pausedUntil,
        workingHours: { days: whDays, from: whFrom, to: whTo, afterHoursBehavior: whAfter },
        smartSkipRules: {
          skipOnVacation:         srVac,
          skipIfOfflineHours:     Number(srOffH),
          respectWorkingHours:    srHours,
          skipIfAlreadyHandled:   srHandled,
          haltAfterNotInterested: Number(srHaltNI),
          haltWhenAllHandled:     srHaltAll
        }
      },p.token,p.csrfToken);
      setSaved(true); setTimeout(function(){setSaved(false);},2500);
    }catch(e){
      setSaveError(e&&e.message?e.message:"Save failed");
    }
  };
  var rotInpStyle={width:60,padding:"4px 8px",borderRadius:7,border:"1px solid #E2E8F0",fontSize:13,textAlign:"center"};

  var tabs=[
    {id:"general",     label:"General"},
    {id:"rotation",    label:"Rotation"},
    {id:"team",        label:"Team & Roles"},
    p.cu&&p.cu.role!=="sales_admin"&&{id:"integrations",label:"Integrations"},
    {id:"rules",       label:"Business Rules"},
    {id:"audit",       label:"Audit Log"}
  ].filter(Boolean);
  // Tab chip: white-on-gray, active = white bg with 0.5px border. Matches mockup .tab.
  var tabBtn=function(tab){
    var act=activeTab===tab.id;
    return <div key={tab.id} onClick={function(){setActiveTab(tab.id);}}
      style={{padding:"8px 14px",fontSize:13,cursor:"pointer",borderRadius:8,whiteSpace:"nowrap",userSelect:"none",flexShrink:0,
        color:act?"#1a1a1a":"#666",fontWeight:act?500:400,
        background:act?"#fff":"transparent",
        border:"0.5px solid "+(act?"rgba(0,0,0,0.1)":"transparent")}}>
      {tab.label}
    </div>;
  };
  var placeholder=function(icon,title,msg){return <div style={{padding:"40px 20px",textAlign:"center",color:C.textLight}}>
    <div style={{fontSize:40,marginBottom:10}}>{icon}</div>
    <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>{title}</div>
    <div style={{fontSize:12}}>{msg}</div>
  </div>;};
  return <div style={{padding:"24px 16px 40px",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <div style={{background:"#fff",borderRadius:12,border:"0.5px solid rgba(0,0,0,0.1)",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"18px 22px",borderBottom:"0.5px solid rgba(0,0,0,0.1)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:17,fontWeight:500,color:"#1a1a1a"}}>{t.settings}</div>
            <div style={{fontSize:13,color:"#666",marginTop:2}}>{company||"ARO"} · Admin</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {saved&&<span style={{fontSize:12,color:"#0F6E56",background:"#EAF6F0",padding:"4px 10px",borderRadius:8,fontWeight:500}}>✓ Saved</span>}
            {saveError&&<span title={saveError} style={{fontSize:12,color:"#A32D2D",background:"#FCEBEB",padding:"4px 10px",borderRadius:8,fontWeight:500}}>Save failed</span>}
            <button type="button" onClick={doSave} disabled={loading} style={{fontSize:12,padding:"6px 14px",border:"0.5px solid rgba(24,95,165,0.3)",background:"#E6F1FB",color:"#185FA5",borderRadius:8,cursor:loading?"not-allowed":"pointer",fontWeight:500,fontFamily:"inherit"}}>Publish</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,padding:"10px 14px",borderBottom:"0.5px solid rgba(0,0,0,0.1)",background:"#F7F7F5",overflowX:"auto"}}>
          {tabs.map(tabBtn)}
        </div>

        {/* Panel */}
        <div style={{padding:22,background:"#fff"}}>
      {activeTab==="general"&&(function(){
        var fieldLabel = {fontSize:12,color:"#666",display:"block",marginBottom:6};
        var inputStyle = {padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:13,background:"#fff",fontFamily:"inherit",width:"100%",boxSizing:"border-box"};
        return <div>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Company</div>
          <div style={{fontSize:12,color:"#666",marginBottom:14}}>Basic info and regional preferences.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:700}}>
            <div>
              <label style={fieldLabel}>Company name</label>
              <input type="text" value={company} onChange={function(e){setCompany(e.target.value);}} style={inputStyle}/>
            </div>
            <div>
              <label style={fieldLabel}>Email</label>
              <input type="text" value={em} onChange={function(e){setEm(e.target.value);}} style={inputStyle}/>
            </div>
            <div>
              <label style={fieldLabel}>Phone</label>
              <input type="text" value={ph} onChange={function(e){setPh(e.target.value);}} style={inputStyle}/>
            </div>
            <div>
              <label style={fieldLabel}>Timezone</label>
              <select value={timezone} onChange={function(e){setTimezone(e.target.value);}} style={inputStyle}>
                <option>Cairo (GMT+2)</option>
                <option>Dubai (GMT+4)</option>
                <option>Riyadh (GMT+3)</option>
                <option>London (GMT+0)</option>
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Currency</label>
              <select value={currency} onChange={function(e){setCurrency(e.target.value);}} style={inputStyle}>
                <option>EGP · Egyptian Pound</option>
                <option>USD · US Dollar</option>
                <option>EUR · Euro</option>
                <option>SAR · Saudi Riyal</option>
                <option>AED · UAE Dirham</option>
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Language</label>
              <select value={p.lang} onChange={function(e){p.setLang(e.target.value);}} style={inputStyle}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
        </div>;
      })()}

      {activeTab==="rotation"&&(function(){
        // ───── Derived values ─────
        var pausedActive = pausedUntil && new Date(pausedUntil) > new Date();
        var masterOn = autoRotEnabled && !pausedActive;
        var allLeads = p.leads || [];
        var nowMs = Date.now();
        var WEEK_MS = 7*24*60*60*1000;

        var rotationsThisWeek = 0, autoAssignedWeek = 0, manualWeek = 0;
        allLeads.forEach(function(l){
          (l.agentHistory||[]).forEach(function(h){
            if(!h || h.action!=="Rotation" || !h.date) return;
            if((nowMs - new Date(h.date).getTime()) >= WEEK_MS) return;
            rotationsThisWeek++;
            var r = String(h.reason||"").toLowerCase();
            if(r==="manual" || r.indexOf("manual")===0) manualWeek++; else autoAssignedWeek++;
          });
        });
        var haltedLeads = allLeads.filter(function(l){return l.rotationStopped===true;}).length;
        var exhaustedLeads = allLeads.filter(function(l){return l.rotationExhausted===true;}).length;
        var stoppedByAge = allLeads.filter(function(l){
          if(!l.createdAt||l.archived) return false;
          if(l.status==="DoneDeal"||l.globalStatus==="donedeal"||l.globalStatus==="eoi") return false;
          return (nowMs - new Date(l.createdAt).getTime()) > rotStopDays*24*60*60*1000;
        }).length;

        var nextInLineIdx = tier1.length>0 ? (((tier1LastIdx+1)%tier1.length+tier1.length)%tier1.length) : -1;
        var lastAssignedUser = (tier1LastIdx>=0 && tier1LastIdx<tier1.length)
          ? (p.users||[]).find(function(u){return String(gid(u))===String(tier1[tier1LastIdx]);})
          : null;

        var roleBadgeOf = function(role){
          if(role==="team_leader") return {label:"TEAM LEADER", bg:"#EEEDFE", fg:"#3C3489"};
          if(role==="sales")       return {label:"SALES",       bg:"#E6F1FB", fg:"#185FA5"};
          if(role==="manager")     return {label:"MANAGER",     bg:"#FAEEDA", fg:"#854F0B"};
          return {label:String(role||"").toUpperCase(), bg:"#EEEEEA", fg:"#666"};
        };
        var initialsOf = function(n){return String(n||"?").split(" ").slice(0,2).map(function(s){return (s[0]||"").toUpperCase();}).join("");};
        var activeFor  = function(uid){return allLeads.filter(function(l){var a=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return String(a)===String(uid)&&!l.archived;}).length;};
        var isOnlineNow = function(u){return u && u.lastSeen && (nowMs-new Date(u.lastSeen).getTime()) < 3*60*1000;};

        var tierMeta = {
          tier1:{label:"Top — first priority",  sub:"First 2 rotations go here",                      bg:"#EAF6F0", border:"rgba(15,110,86,0.3)", num:"#0F6E56", text:"#0F6E56"},
          tier2:{label:"Regular",                sub:"Joins Tier 3 after Tier 1 is exhausted",         bg:"#E6F1FB", border:"rgba(24,95,165,0.3)", num:"#185FA5", text:"#185FA5"},
          tier3:{label:"New / Training",         sub:"Joins Tier 2 after Tier 1 is exhausted",         bg:"#F7F7F5", border:"rgba(0,0,0,0.1)",     num:"#666",    text:"#1a1a1a"}
        };
        var tierArrs = {tier1:tier1, tier2:tier2, tier3:tier3};

        var simulatedList = (function(){
          if(!simulateOpen || tier1.length===0) return [];
          var out=[], idx=tier1LastIdx;
          for(var i=0;i<10;i++){
            idx = (idx+1) % tier1.length;
            var uid = tier1[idx];
            var u = (p.users||[]).find(function(x){return String(gid(x))===String(uid);});
            if(u) out.push(u);
          }
          return out;
        })();

        var feedItems = (p.rotNotifs||[]).slice(0,6);

        // ───── agent row ─────
        var renderAgentRow = function(tierKey, uid, idx){
          var u=(p.users||[]).find(function(x){return String(gid(x))===String(uid);});
          if(!u) return null;
          var rb = roleBadgeOf(u.role);
          var active = activeFor(uid);
          var online = isOnlineNow(u);
          var team = u.teamName || "";
          var dragging = dragFrom && dragFrom.tier===tierKey && dragFrom.idx===idx;
          var hover    = dropOn   && dropOn.tier===tierKey && dropOn.idx===idx && !dragging;
          var meta = tierMeta[tierKey];
          var infoParts = [];
          if(team) infoParts.push(team);
          infoParts.push(active+" active");
          return <div key={uid}
            draggable={true}
            onDragStart={function(e){ setDragFrom({tier:tierKey,idx:idx}); try{e.dataTransfer.effectAllowed="move";}catch(_){} }}
            onDragOver={function(e){ e.preventDefault(); if(!dropOn||dropOn.tier!==tierKey||dropOn.idx!==idx) setDropOn({tier:tierKey,idx:idx}); try{e.dataTransfer.dropEffect="move";}catch(_){} }}
            onDragLeave={function(){ if(dropOn&&dropOn.tier===tierKey&&dropOn.idx===idx) setDropOn(null); }}
            onDrop={function(e){ e.preventDefault(); e.stopPropagation(); moveAgent(dragFrom,{tier:tierKey,idx:idx}); setDragFrom(null); setDropOn(null); }}
            onDragEnd={function(){ setDragFrom(null); setDropOn(null); }}
            style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#fff",borderRadius:8,marginBottom:4,cursor:"grab",userSelect:"none",
              border: hover ? "1.5px solid "+meta.num : "0.5px solid rgba(0,0,0,0.05)",
              opacity: dragging?0.5:1}}>
            <span style={{color:"#999",cursor:"grab",fontSize:13,flexShrink:0}}>⋮⋮</span>
            <div style={{width:30,height:30,borderRadius:"50%",background:meta.num,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,flexShrink:0}}>{initialsOf(u.name)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:0,flexWrap:"wrap"}}>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</span>
                <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,fontWeight:500,letterSpacing:"0.3px",background:rb.bg,color:rb.fg,marginLeft:6}}>{rb.label}</span>
                {activeVacSet.has(String(uid)) && <span title="Currently on vacation — skipped by auto-rotation"
                  style={{fontSize:9,padding:"2px 6px",borderRadius:10,fontWeight:500,letterSpacing:"0.3px",background:"#FAEEDA",color:"#854F0B",marginLeft:6}}>On Vacation</span>}
              </div>
              <div style={{fontSize:11,color:"#666",fontWeight:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {infoParts.join(" · ")}
              </div>
            </div>
            {canManageVacations
              ? <button type="button"
                  title="Schedule vacation"
                  style={{fontSize:11,padding:"3px 8px",borderRadius:8,background:"transparent",border:"0.5px solid rgba(133,79,11,0.3)",color:"#854F0B",cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}
                  onClick={function(e){e.stopPropagation(); openVacModal(uid);}}>Vacation</button>
              : null}
            <button type="button"
              title="Remove from rotation"
              style={{fontSize:11,padding:"3px 8px",borderRadius:8,background:"transparent",border:"0.5px solid rgba(163,45,45,0.3)",color:"#A32D2D",cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}
              onClick={function(e){e.stopPropagation(); removeFromAllTiers(uid);}}>Remove</button>
            <div title={online?"Online":"Offline"} style={{width:8,height:8,borderRadius:"50%",background:online?"#0F6E56":"#999",flexShrink:0}}/>
          </div>;
        };

        // ───── tier box ─────
        var renderTier = function(k){
          var m = tierMeta[k]; var agents = tierArrs[k];
          var isEmptyHover = dropOn && dropOn.tier===k && agents.length===0;
          return <div key={k}
            onDragOver={function(e){ if(agents.length===0){ e.preventDefault(); setDropOn({tier:k,idx:0}); } }}
            onDrop={function(e){ if(agents.length===0){ e.preventDefault(); moveAgent(dragFrom,{tier:k,idx:0}); setDragFrom(null); setDropOn(null); } }}
            style={{background:m.bg,border:"0.5px solid "+m.border,borderRadius:12,marginBottom:10,overflow:"hidden"}}>
            <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:m.num,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500}}>{k.slice(-1)}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:m.text}}>{m.label}</div>
                  <div style={{fontSize:11,color:m.text,opacity:0.8}}>{m.sub}</div>
                </div>
              </div>
              <div style={{fontSize:11,color:m.text,fontWeight:500}}>{agents.length} agent{agents.length===1?"":"s"}</div>
            </div>
            <div style={{padding:"0 8px 8px 8px"}}>
              {agents.length===0
                ? <div style={{fontSize:11,color:m.text,opacity:0.7,padding:"10px 6px",textAlign:"center",fontStyle:"italic",border:"1px dashed "+m.border,borderRadius:8,background:isEmptyHover?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.4)"}}>Drop agents here{isEmptyHover?" ⤵":""}</div>
                : agents.map(function(uid,idx){return renderAgentRow(k,uid,idx);})
              }
            </div>
          </div>;
        };

        return <div style={{fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
          {/* ══ Master Auto-Rotation card ══ */}
          <div style={{
            background:masterOn?"#EAF6F0":"#FCEBEB",
            border:"0.5px solid "+(masterOn?"rgba(15,110,86,0.3)":"rgba(163,45,45,0.3)"),
            borderRadius:12,padding:"14px 16px",marginBottom:14,
            display:"flex",justifyContent:"space-between",alignItems:"center",gap:12
          }}>
            <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
              <div onClick={function(){setAutoRotEnabled(!autoRotEnabled); if(!autoRotEnabled) setPausedUntil(null);}}
                title="Toggle auto-rotation"
                style={{width:40,height:22,borderRadius:11,cursor:"pointer",position:"relative",flexShrink:0,
                  background:autoRotEnabled?"#0F6E56":"#94A3B8",transition:"background 0.15s"}}>
                <span style={{display:"block",width:16,height:16,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left:autoRotEnabled?21:3,transition:"left 0.15s"}}/>
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:14,fontWeight:500,color:masterOn?"#0F6E56":"#A32D2D"}}>
                  {!autoRotEnabled ? "Auto-Rotation is OFF" : (pausedActive ? "Auto-Rotation paused" : "Auto-Rotation is active")}
                </div>
                <div style={{fontSize:12,color:masterOn?"#0F6E56":"#A32D2D",opacity:0.85,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {!autoRotEnabled
                    ? "Leads will not auto-rotate until turned back on."
                    : pausedActive
                      ? ("Paused until "+new Date(pausedUntil).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"short"}))
                      : (lastAssignedUser && tier1.length>0
                          ? ("Round-robin pointer at "+String(lastAssignedUser.name||"").split(" ")[0]+" ("+(tier1LastIdx+1)+"/"+tier1.length+") · "+rotationsThisWeek+" rotations this week")
                          : (rotationsThisWeek+" rotations this week · "+(tier1.length+tier2.length+tier3.length)+" agents across 3 tiers"))}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button type="button" onClick={function(){setAutoRotEnabled(true); setPausedUntil(new Date(Date.now()+2*60*60*1000).toISOString());}}
                style={{fontSize:12,padding:"6px 12px",border:"0.5px solid rgba(0,0,0,0.1)",background:"transparent",borderRadius:8,cursor:"pointer",color:"#1a1a1a",fontFamily:"inherit"}}>Pause 2h</button>
              <button type="button" onClick={function(){setAutoRotEnabled(false); setPausedUntil(null);}}
                style={{fontSize:12,padding:"6px 12px",border:"0.5px solid rgba(163,45,45,0.3)",background:"#FCEBEB",borderRadius:8,cursor:"pointer",color:"#A32D2D",fontFamily:"inherit"}}>Stop</button>
              {p.cu && p.cu.role==="admin" && (
                <button type="button" disabled={redistBusy}
                  onClick={async function(){
                    if(redistBusy) return;
                    if(!window.confirm("This will evenly distribute all pending rotation-eligible leads across all agents. Continue?")) return;
                    setRedistBusy(true);
                    try {
                      var r = await apiFetch("/api/leads/bulk-redistribute-backlog","POST",{},p.token);
                      setRedistResult(r || { total:0, distributed:0, skipped:0, perAgent:{} });
                    } catch(e) {
                      window.alert("Redistribution failed: "+(e && e.message ? e.message : "unknown error"));
                    } finally {
                      setRedistBusy(false);
                    }
                  }}
                  style={{fontSize:12,padding:"6px 12px",border:"0.5px solid rgba(15,110,86,0.35)",background:redistBusy?"#D6E8E0":"#EAF6F0",borderRadius:8,cursor:redistBusy?"wait":"pointer",color:"#0F6E56",fontFamily:"inherit",fontWeight:500}}>
                  {redistBusy ? "Redistributing…" : "Redistribute Backlog"}
                </button>
              )}
            </div>
          </div>

          {/* ══ Redistribute result modal ══ */}
          {redistResult && (function(){
            var rows = Object.keys(redistResult.perAgent||{}).map(function(uid){
              var u = (p.users||[]).find(function(x){return gid(x)===uid;});
              return { uid: uid, name: u ? u.name : uid, count: Number(redistResult.perAgent[uid])||0 };
            }).sort(function(a,b){ return b.count - a.count; });
            var diag = redistResult.diagnostic || null;
            var sectionTitle = {fontSize:12,fontWeight:600,color:"#444",marginTop:14,marginBottom:6,letterSpacing:"0.3px",textTransform:"uppercase"};
            var kvBox = {border:"0.5px solid rgba(0,0,0,0.08)",borderRadius:8,overflow:"hidden"};
            var kvRow = function(k, v, i, highlight){
              return <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 12px",borderTop:i===0?"none":"0.5px solid rgba(0,0,0,0.06)",fontSize:12,background:highlight?"#FFF7E6":"transparent"}}>
                <span style={{color:"#555"}}>{k}</span>
                <span style={{fontWeight:500,color:Number(v)>0?"#1a1a1a":"#999"}}>{v}</span>
              </div>;
            };
            return <div onClick={function(){setRedistResult(null);}}
              style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
              <div onClick={function(e){e.stopPropagation();}}
                style={{background:"#fff",borderRadius:12,padding:20,width:"min(560px, 94vw)",maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 48px rgba(0,0,0,0.25)",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
                <div style={{fontSize:16,fontWeight:600,marginBottom:10,color:"#0F6E56"}}>Backlog redistribution — diagnostic</div>
                <div style={{fontSize:13,color:"#1a1a1a",marginBottom:6,lineHeight:1.6}}>
                  Distributed <b>{redistResult.distributed}</b> of <b>{redistResult.total}</b> eligible leads. Skipped <b>{redistResult.skipped}</b>.
                </div>

                {diag && (<>
                  <div style={sectionTitle}>Funnel</div>
                  <div style={kvBox}>
                    {kvRow("Total leads scanned", diag.totalLeadsScanned, 0)}
                    {kvRow("  − archived", diag.excluded.archived, 1)}
                    {kvRow("  − noAgent (no agentId)", diag.excluded.noAgent, 1)}
                    {kvRow("  − source = Daily Request", diag.excluded.dailyRequestSource, 1)}
                    {kvRow("  − globalStatus eoi/donedeal", diag.excluded.eoiOrDoneDeal, 1)}
                    {kvRow("  − rotationStopped = true", diag.excluded.rotationStopped, 1)}
                    {kvRow("  − locked = true (🔒 on lead)", diag.excluded.locked || 0, 1)}
                    {kvRow("  − older than " + (diag.thresholds?diag.thresholds.rotationStopAfterDays:"45") + " days", diag.excluded.tooYoung_lessThan45days, 1)}
                    {kvRow("  − lastRotationAt within 1h", diag.excluded.lastRotationWithin1h, 1)}
                    {kvRow("  − no current slice & no fallback", diag.excluded.noCurrentSliceAndNoFallback, 1)}
                    {kvRow("  − noRotation flag on slice", diag.excluded.noRotationFlag, 1)}
                    {kvRow("Passed all DB filters", diag.passed, 1, true)}
                  </div>

                  <div style={sectionTitle}>Status of passing pool</div>
                  <div style={kvBox}>
                    {Object.keys(diag.byStatus).map(function(k, i){ return kvRow(k, diag.byStatus[k], i); })}
                  </div>

                  <div style={sectionTitle}>Eligible by rule</div>
                  <div style={kvBox}>
                    {kvRow("NewLead (noActDays)", diag.eligible.byRule.newLead, 0)}
                    {kvRow("NotInterested (niDays)", diag.eligible.byRule.notInt, 1)}
                    {kvRow("CallBack (cbDays)", diag.eligible.byRule.callBack, 1)}
                    {kvRow("Hot/Potential/MeetingDone (hotDays)", diag.eligible.byRule.hot, 1)}
                    {kvRow("NoAnswer (naCount/naHours)", diag.eligible.byRule.noAns, 1)}
                    {kvRow("TOTAL eligible", diag.eligible.total, 1, true)}
                  </div>

                  <div style={sectionTitle}>Not-eligible reasons</div>
                  <div style={kvBox}>
                    {Object.keys(diag.notEligibleReasons).length===0
                      ? <div style={{padding:"8px 12px",fontSize:12,color:"#999"}}>None (every passing lead matched a rule).</div>
                      : Object.keys(diag.notEligibleReasons)
                          .sort(function(a,b){ return diag.notEligibleReasons[b] - diag.notEligibleReasons[a]; })
                          .map(function(k, i){ return kvRow(k, diag.notEligibleReasons[k], i); })}
                  </div>

                  <div style={sectionTitle}>Thresholds in use</div>
                  <div style={kvBox}>
                    {Object.keys(diag.thresholds||{}).map(function(k, i){ return kvRow(k, diag.thresholds[k], i); })}
                  </div>
                </>)}

                <div style={sectionTitle}>Per agent (distributed)</div>
                <div style={kvBox}>
                  {rows.length===0 ? <div style={{padding:"8px 12px",fontSize:12,color:"#999"}}>No agents received leads.</div>
                    : rows.map(function(r, i){
                        return <div key={r.uid} style={{display:"flex",justifyContent:"space-between",padding:"6px 12px",borderTop:i===0?"none":"0.5px solid rgba(0,0,0,0.06)",fontSize:12}}>
                          <span style={{color:"#555"}}>{r.name}</span>
                          <span style={{fontWeight:500,color:r.count>0?"#0F6E56":"#999"}}>{r.count}</span>
                        </div>;
                      })}
                </div>

                <div style={{display:"flex",justifyContent:"flex-end",marginTop:14,gap:8}}>
                  <button type="button"
                    onClick={function(){
                      try { navigator.clipboard.writeText(JSON.stringify(redistResult, null, 2)); } catch(e) {}
                    }}
                    style={{fontSize:12,padding:"8px 14px",border:"0.5px solid rgba(0,0,0,0.15)",background:"#fff",color:"#1a1a1a",borderRadius:8,cursor:"pointer",fontFamily:"inherit"}}>Copy JSON</button>
                  <button type="button" onClick={function(){setRedistResult(null);}}
                    style={{fontSize:13,padding:"8px 16px",border:"0.5px solid rgba(0,0,0,0.1)",background:"#1a1a1a",color:"#fff",borderRadius:8,cursor:"pointer",fontFamily:"inherit"}}>Close</button>
                </div>
              </div>
            </div>;
          })()}

          {/* ══ Manual assignment window (blue) ══ */}
          <div style={{background:"#E6F1FB",border:"0.5px solid rgba(24,95,165,0.3)",borderRadius:12,padding:"14px 16px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:13,fontWeight:500,color:"#185FA5"}}>Manual assignment window</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,color:"#185FA5"}}>Auto-assign after</span>
                <input type="number" min={0} max={1440} value={manualWindowMin}
                  onChange={function(e){setManualWindowMin(Number(e.target.value)||0);}}
                  style={{width:60,padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:13,background:"#fff",fontFamily:"inherit"}}/>
                <span style={{fontSize:12,color:"#185FA5"}}>minutes</span>
              </div>
            </div>
            <div style={{fontSize:11,color:"#185FA5",opacity:0.85,lineHeight:1.5}}>Applies to all sources. Admin and Sales Admin assign manually within this window. After timeout, system auto-assigns to Tier 1 round-robin.</div>
          </div>

          {/* ══ Two-column: priority tiers (2fr) + live feed/metrics (1fr) ══ */}
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:20,marginBottom:24}}>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:500}}>Priority tiers</div>
                <div style={{fontSize:11,color:"#666"}}>Only Team Leaders &amp; Sales · Directors/Managers excluded</div>
              </div>
              {renderTier("tier1")}
              {renderTier("tier2")}
              {renderTier("tier3")}
              {(function(){
                var inAny = new Set([].concat(tier1,tier2,tier3).map(String));
                var remaining = salesAgentsForSetting.filter(function(u){return !inAny.has(String(gid(u)));});
                if(!remaining.length) return null;
                // Per-tier "add" button — styled with the tier's accent so it's visually obvious
                // which tier the agent is going to land in.
                var tierAddBtn = function(uid, key, label, bg, brd, fg){
                  return <button type="button" key={key}
                    onClick={function(e){e.stopPropagation(); appendToTier(uid,key);}}
                    title={"Add to "+label}
                    style={{fontSize:11,padding:"4px 8px",border:"0.5px solid "+brd,background:bg,color:fg,borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontWeight:500,flexShrink:0}}>
                    → {label}
                  </button>;
                };
                return <div style={{marginTop:8,border:"1px dashed rgba(0,0,0,0.1)",borderRadius:8,background:"#F7F7F5",maxHeight:200,overflowY:"auto"}}>
                  <div style={{padding:"8px 10px",fontSize:11,fontWeight:500,color:"#666",borderBottom:"0.5px solid rgba(0,0,0,0.05)"}}>Add agent to rotation ({remaining.length} available — pick a target tier)</div>
                  {remaining.map(function(u){
                    var uid=String(gid(u)); var rb=roleBadgeOf(u.role);
                    return <div key={uid}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderBottom:"0.5px solid rgba(0,0,0,0.05)"}}>
                      <div style={{flex:1,minWidth:0,fontSize:12,display:"flex",alignItems:"center",gap:6}}>
                        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</span>
                        <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,fontWeight:500,background:rb.bg,color:rb.fg,flexShrink:0}}>{rb.label}</span>
                      </div>
                      <div style={{display:"flex",gap:4,flexShrink:0}}>
                        {tierAddBtn(uid,"tier1","Tier 1","#EAF6F0","rgba(15,110,86,0.3)","#0F6E56")}
                        {tierAddBtn(uid,"tier2","Tier 2","#E6F1FB","rgba(24,95,165,0.3)","#185FA5")}
                        {tierAddBtn(uid,"tier3","Tier 3","#F7F7F5","rgba(0,0,0,0.15)",       "#666")}
                      </div>
                    </div>;
                  })}
                </div>;
              })()}
            </div>

            <div>
              {/* Live feed */}
              <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Live feed</div>
              <div style={{background:"#F7F7F5",borderRadius:8,padding:10,lineHeight:1.7,minHeight:60}}>
                {feedItems.length===0
                  ? <div style={{fontSize:11,color:"#999",fontStyle:"italic",padding:"6px 0"}}>No recent rotations.</div>
                  : feedItems.map(function(n,i){
                      var ts = n.createdAt||n.timestamp||n.date;
                      var time = ts ? new Date(ts).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}) : "";
                      var reason = String(n.reason||"").toLowerCase();
                      var dotColor = "#185FA5"; var tagTxt = "T1"; var tagBg="#EAF6F0"; var tagFg="#0F6E56";
                      var shortId = n.leadId ? String(n.leadId).slice(-4) : "—";
                      var txt = "#"+shortId+" → "+(n.toName||"—");
                      if(reason.indexOf("cancel")>=0){ dotColor="#854F0B"; txt=(n.leadName||"Lead")+" Cancel → re-rotate"; tagTxt=""; }
                      else if(reason.indexOf("exhausted")>=0){ dotColor="#A32D2D"; txt=(n.leadName||"Lead")+" rotation EXHAUSTED"; tagTxt=""; }
                      else if(reason==="manual" || reason.indexOf("manual")===0){ dotColor="#0F6E56"; tagTxt=""; }
                      return <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",color:"#666",fontSize:11}}>
                        <span style={{width:5,height:5,borderRadius:"50%",background:dotColor,flexShrink:0}}/>
                        <span style={{color:"#1a1a1a",fontWeight:500,minWidth:32}}>{time}</span>
                        <span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{txt}</span>
                        {tagTxt && <span style={{background:tagBg,color:tagFg,padding:"1px 5px",borderRadius:3,fontSize:10,fontWeight:500,flexShrink:0}}>{tagTxt}</span>}
                      </div>;
                    })}
              </div>

              {/* This week metrics */}
              <div style={{fontSize:14,fontWeight:500,marginTop:14,marginBottom:8}}>This week</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {[
                  {l:"Auto-assigned", v:autoAssignedWeek},
                  {l:"Manual",        v:manualWeek},
                  {l:"Skipped",       v:"—"},
                  {l:"Halted",        v:haltedLeads},
                  {l:"Exhausted",     v:exhaustedLeads},
                  {l:"45d stopped",   v:stoppedByAge}
                ].map(function(m,i){return <div key={i} style={{background:"#F7F7F5",padding:"8px 10px",borderRadius:8}}>
                  <div style={{fontSize:10,color:"#666"}}>{m.l}</div>
                  <div style={{fontSize:18,fontWeight:500,marginTop:2}}>{m.v}</div>
                </div>;})}
              </div>

              <button type="button" onClick={function(){setSimulateOpen(!simulateOpen);}}
                style={{marginTop:10,width:"100%",fontSize:12,padding:"8px 12px",border:"0.5px solid rgba(0,0,0,0.1)",background:"transparent",borderRadius:8,cursor:"pointer",color:"#1a1a1a",fontFamily:"inherit"}}>
                {simulateOpen?"Hide simulation":"Simulate next 10"}
              </button>
              {simulateOpen && <div style={{marginTop:8,background:"#F7F7F5",borderRadius:8,padding:10}}>
                {simulatedList.length===0
                  ? <div style={{fontSize:11,color:"#999"}}>Add agents to Tier 1 to simulate.</div>
                  : simulatedList.map(function(u,i){return <div key={i} style={{fontSize:11,color:"#1a1a1a",padding:"3px 0",display:"flex",gap:6}}>
                      <span style={{color:"#666",minWidth:24}}>{(i+1)+"."}</span>
                      <span>{u.name}</span>
                    </div>;})
                }
              </div>}
            </div>
          </div>

          {/* ══ Agent vacations ══ admin/sales_admin only */}
          {canManageVacations && <div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Agent vacations</div>
            <div style={{fontSize:12,color:"#666",marginBottom:10}}>
              Schedule time off for an agent. When "Skip if agent is on vacation" is enabled, active vacations are skipped by auto-rotation. Click "Vacation" on any agent row above to add one.
            </div>
            <div style={{background:"#F7F7F5",borderRadius:8,padding:vacations.length?6:14}}>
              {vacations.length===0
                ? <div style={{fontSize:12,color:"#999",fontStyle:"italic",textAlign:"center"}}>No upcoming or active vacations.</div>
                : vacations.map(function(v){
                    var ag = v.agentId || {};
                    var aid = ag && ag._id ? String(ag._id) : String(ag);
                    var start = new Date(v.startDate), end = new Date(v.endDate);
                    var now = new Date();
                    var isActive = start <= now && now <= end;
                    var fmt = function(d){ return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); };
                    return <div key={String(v._id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#fff",borderRadius:8,marginBottom:4,border:"0.5px solid rgba(0,0,0,0.05)"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <span>{ag.name || "(unknown)"}</span>
                          {isActive && <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,fontWeight:500,letterSpacing:"0.3px",background:"#FAEEDA",color:"#854F0B"}}>On Vacation</span>}
                        </div>
                        <div style={{fontSize:11,color:"#666",marginTop:2}}>
                          {fmt(start)} → {fmt(end)}{v.reason?(" · "+v.reason):""}
                        </div>
                      </div>
                      <button type="button"
                        style={{fontSize:11,padding:"3px 8px",borderRadius:8,background:"transparent",border:"0.5px solid rgba(163,45,45,0.3)",color:"#A32D2D",cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}
                        onClick={function(){cancelVacation(String(v._id));}}>Cancel</button>
                    </div>;
                  })
              }
            </div>
          </div>}

          {/* ══ Rotation durations ══ */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Rotation durations</div>
            <div style={{fontSize:12,color:"#666",marginBottom:10}}>Applies to Hot Case, Potential, Meeting, CallBack, No Answer, No Contact, and Not Interested</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {label:"No Answer — times before rotation",val:rotNoAnswerCount,set:setRotNoAnswerCount,max:100},
                {label:"No Answer — wait after last (hrs)",val:rotNoAnswerHours,set:setRotNoAnswerHours,max:720},
                {label:"Not Interested — return after (days)",val:rotNotIntDays,set:setRotNotIntDays,max:365},
                {label:"No Contact — rotate after (days)",val:rotNoActDays,set:setRotNoActDays,max:365},
                {label:"CallBack overdue — rotate after (days)",val:rotCbDays,set:setRotCbDays,max:365},
                {label:"Hot / Potential / Meeting no action (days)",val:rotHotDays,set:setRotHotDays,max:365,bold:true}
              ].map(function(row){return <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#F7F7F5",padding:"8px 10px",borderRadius:8,color:"#666",gap:8,fontSize:12}}>
                <span style={{fontWeight:row.bold?500:400,color:row.bold?"#1a1a1a":"#666"}}>{row.label}</span>
                <input type="number" min={1} max={row.max} value={row.val} onChange={function(e){row.set(Number(e.target.value));}}
                  style={{width:56,padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:13,background:"#fff",textAlign:"center",fontFamily:"inherit"}}/>
              </div>;})}
              {/* 45-day row spans 2 cols, highlighted yellow */}
              <div style={{gridColumn:"span 2",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FAEEDA",padding:"8px 10px",borderRadius:8,color:"#854F0B",gap:8,fontSize:12}}>
                <span style={{fontWeight:500}}>Stop rotation after (days in CRM) — lead stays with current agent</span>
                <input type="number" min={1} max={3650} value={rotStopDays} onChange={function(e){setRotStopDays(Number(e.target.value));}}
                  style={{width:56,padding:"6px 10px",border:"0.5px solid rgba(133,79,11,0.3)",borderRadius:8,fontSize:13,background:"#fff",textAlign:"center",fontFamily:"inherit"}}/>
              </div>
            </div>
          </div>

          {/* ══ Stale lead visibility (Phase Q) ══ */}
          <div style={{background:"#F1ECF7",border:"0.5px solid rgba(95,55,160,0.3)",borderRadius:12,padding:"14px 16px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:13,fontWeight:500,color:"#5F37A0"}}>Stale Lead Threshold (days)</div>
              <input type="number" min={1} max={365} step={1} value={staleLeadDays}
                onChange={function(e){var v=Math.floor(Number(e.target.value)); if(!isFinite(v)||v<1)v=1; if(v>365)v=365; setStaleLeadDays(v);}}
                style={{width:60,padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:13,background:"#fff",textAlign:"center",fontFamily:"inherit"}}/>
            </div>
            <div style={{fontSize:11,color:"#5F37A0",opacity:0.85,lineHeight:1.5}}>Leads with no action by the holding sales for more than this many days are hidden from sales, manager, and team leader views. Admin and sales_admin always see all leads. The rotation system is not affected.</div>
          </div>

          {/* ══ Smart skip rules ══ */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Smart skip rules</div>
            <div style={{fontSize:12,color:"#666",marginBottom:10}}>Applied to each candidate before assignment. Unchecked rules are ignored by the backend.</div>
            <div style={{background:"#F7F7F5",borderRadius:8,padding:14,display:"grid",gap:12,fontSize:13}}>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <input type="checkbox" checked={srVac} onChange={function(e){setSrVac(e.target.checked);}}/>
                <span>Skip if agent is on vacation</span>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:10}}>
                <input type="checkbox" checked={srOffH>0} onChange={function(e){setSrOffH(e.target.checked?4:0);}}/>
                <span>Skip if agent offline more than</span>
                <input type="number" min={0} max={168} value={srOffH} onChange={function(e){setSrOffH(Number(e.target.value)||0);}}
                  style={{width:50,padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:13,background:"#fff",textAlign:"center",fontFamily:"inherit"}}/>
                <span>hours</span>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <input type="checkbox" checked={srHours} onChange={function(e){setSrHours(e.target.checked);}}/>
                <span>Respect working hours</span>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <input type="checkbox" checked={srHandled} onChange={function(e){setSrHandled(e.target.checked);}}/>
                <span>Skip agents who already handled this lead</span>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:10}}>
                <input type="checkbox" checked={srHaltNI>0} onChange={function(e){setSrHaltNI(e.target.checked?3:0);}}/>
                <span>Halt rotation after</span>
                <input type="number" min={0} max={20} value={srHaltNI} onChange={function(e){setSrHaltNI(Number(e.target.value)||0);}}
                  style={{width:50,padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:13,background:"#fff",textAlign:"center",fontFamily:"inherit"}}/>
                <span>× Not Interested</span>
              </label>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <input type="checkbox" checked={srHaltAll} onChange={function(e){setSrHaltAll(e.target.checked);}}/>
                <span>Halt rotation when all agents have handled the lead</span>
              </label>
            </div>
          </div>

          {/* ══ Working hours ══ */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Working hours</div>
            <div style={{fontSize:12,color:"#666",marginBottom:10}}>Company default. Per-agent overrides live in Team &amp; Roles (coming soon).</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(function(d){
                var on = whDays.indexOf(d)>=0;
                return <div key={d}
                  onClick={function(){setWhDays(function(prev){return prev.indexOf(d)>=0 ? prev.filter(function(x){return x!==d;}) : prev.concat([d]);});}}
                  style={{padding:"6px 12px",background:on?"#E6F1FB":"#fff",border:"0.5px solid "+(on?"rgba(24,95,165,0.3)":"rgba(0,0,0,0.1)"),borderRadius:8,fontSize:12,cursor:"pointer",color:on?"#185FA5":"#666",fontWeight:on?500:400,userSelect:"none"}}>{d}</div>;
              })}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,color:"#666"}}>From</span>
                <input type="time" value={whFrom} onChange={function(e){setWhFrom(e.target.value);}}
                  style={{padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:13,background:"#fff",fontFamily:"inherit"}}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,color:"#666"}}>to</span>
                <input type="time" value={whTo} onChange={function(e){setWhTo(e.target.value);}}
                  style={{padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:13,background:"#fff",fontFamily:"inherit"}}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,color:"#666"}}>After-hours</span>
                <select value={whAfter} onChange={function(e){setWhAfter(e.target.value);}}
                  style={{padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:13,background:"#fff",fontFamily:"inherit"}}>
                  <option value="queue">Queue until next shift</option>
                  <option value="oncall">Route to on-call agent</option>
                </select>
              </div>
            </div>
          </div>

          {/* ══ Vacation modal — opened from any agent row ══ */}
          {vacModalAgent && <div onClick={closeVacModal}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
            <div onClick={function(e){e.stopPropagation();}}
              style={{background:"#fff",borderRadius:12,padding:20,width:400,maxWidth:"92vw",boxShadow:"0 10px 40px rgba(0,0,0,0.2)"}}>
              <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>Schedule vacation</div>
              <div style={{fontSize:12,color:"#666",marginBottom:14}}>
                Agent: <span style={{color:"#1a1a1a",fontWeight:500}}>{vacModalAgent.name}</span>
              </div>
              <div style={{display:"grid",gap:10,marginBottom:14}}>
                <label style={{fontSize:12,color:"#666",display:"flex",flexDirection:"column",gap:4}}>
                  Start date
                  <input type="date" value={vacStart} onChange={function(e){setVacStart(e.target.value);}}
                    style={{padding:"7px 10px",border:"0.5px solid rgba(0,0,0,0.15)",borderRadius:8,fontSize:13,fontFamily:"inherit"}}/>
                </label>
                <label style={{fontSize:12,color:"#666",display:"flex",flexDirection:"column",gap:4}}>
                  End date <span style={{fontSize:11,color:"#999"}}>(inclusive — covers through 23:59)</span>
                  <input type="date" value={vacEnd} onChange={function(e){setVacEnd(e.target.value);}}
                    style={{padding:"7px 10px",border:"0.5px solid rgba(0,0,0,0.15)",borderRadius:8,fontSize:13,fontFamily:"inherit"}}/>
                </label>
                <label style={{fontSize:12,color:"#666",display:"flex",flexDirection:"column",gap:4}}>
                  Reason <span style={{fontSize:11,color:"#999"}}>(optional)</span>
                  <textarea value={vacReason} onChange={function(e){setVacReason(e.target.value);}} rows={2} maxLength={500}
                    style={{padding:"7px 10px",border:"0.5px solid rgba(0,0,0,0.15)",borderRadius:8,fontSize:13,fontFamily:"inherit",resize:"vertical"}}/>
                </label>
              </div>
              {vacError && <div style={{fontSize:12,color:"#A32D2D",marginBottom:10}}>{vacError}</div>}
              <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
                <button type="button" onClick={closeVacModal} disabled={vacSaving}
                  style={{fontSize:13,padding:"7px 14px",borderRadius:8,background:"transparent",border:"0.5px solid rgba(0,0,0,0.15)",color:"#1a1a1a",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                <button type="button" onClick={saveVacation} disabled={vacSaving}
                  style={{fontSize:13,padding:"7px 14px",borderRadius:8,background:"#0F6E56",border:"0.5px solid #0F6E56",color:"#fff",cursor:vacSaving?"wait":"pointer",fontFamily:"inherit",fontWeight:500}}>
                  {vacSaving?"Saving…":"Save"}
                </button>
              </div>
            </div>
          </div>}
        </div>;
      })()}

      {activeTab==="team"&&(function(){
        // ───── Hierarchy data (pulled from User.role + User.reportsTo) ─────
        var users = (p.users||[]).filter(function(u){return u.active;});
        var byRole = {admin:[],sales_admin:[],director:[],manager:[],team_leader:[],sales:[]};
        users.forEach(function(u){ if(byRole[u.role]) byRole[u.role].push(u); });
        var rtId = function(u){ if(!u.reportsTo) return ""; return u.reportsTo._id ? String(u.reportsTo._id) : String(u.reportsTo); };
        var childrenOf = function(parentId, role){ return users.filter(function(u){return u.role===role && rtId(u)===String(parentId);}); };

        // Deletion preview: pick first manager as an example
        var previewMgr  = byRole.manager[0] || null;
        var previewTLs  = previewMgr ? childrenOf(gid(previewMgr),"team_leader") : [];
        var previewSales = previewTLs.reduce(function(acc,tl){return acc.concat(childrenOf(gid(tl),"sales"));},[]);

        // ───── Node renderer ─────
        var nodeStyle = function(kind){
          var map={
            admin:    {bg:"#FCEBEB",fg:"#A32D2D",fontSize:12,padding:"10px 14px",minWidth:160},
            director: {bg:"#E1F5EE",fg:"#0F6E56",fontSize:12,padding:"10px 14px",minWidth:160},
            manager:  {bg:"#FAEEDA",fg:"#854F0B",fontSize:12,padding:"10px 14px",minWidth:160},
            tl:       {bg:"#EEEDFE",fg:"#3C3489",fontSize:11,padding:"8px 10px",  minWidth:140}
          }[kind];
          return {padding:map.padding,borderRadius:8,background:map.bg,color:map.fg,fontSize:map.fontSize,fontWeight:500,display:"flex",alignItems:"center",gap:6,minWidth:map.minWidth,justifyContent:"center"};
        };
        var hRow  = function(nodes){return <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:6,flexWrap:"wrap"}}>{nodes}</div>;};
        var hDown = <div style={{textAlign:"center",color:"#999",fontSize:18,lineHeight:1,padding:"4px 0"}}>↓</div>;

        // ───── Permissions matrix data ─────
        var permRows = [
          {label:"View own data",     vals:["✓","✓","✓","✓","✓","✓"]},
          {label:"View team data",    vals:["ALL","ALL","ALL UNDER","TEAMS UNDER","OWN TEAM","—"]},
          {label:"Edit lead data",    vals:["✓","✓","—","—","—","OWN"]},
          {label:"Reassign lead",     vals:["✓","✓","ALL UNDER","TEAMS UNDER","OWN TEAM","—"]},
          {label:"Change lead status",vals:["✓","✓","ALL UNDER","TEAMS UNDER","OWN TEAM","OWN"]},
          {label:"Convert Hot → EOI", vals:["✓","✓","ALL UNDER","TEAMS UNDER","OWN TEAM","OWN"],highlight:"green",bold:true},
          {label:"Convert EOI → Deal",vals:["✓","✓","ALL UNDER","TEAMS UNDER","OWN TEAM","OWN"],highlight:"green",bold:true},
          {label:"Approve EOI",       vals:["✓","✓","—","—","—","—"]},
          {label:"Approve Deal",      vals:["✓","✓","—","—","—","—"]},
          {label:"Cancel EOI / Deal", vals:["✓","✓","—","—","—","—"]},
          {label:"Delete lead",       vals:["✓","—","—","—","—","—"]},
          {label:"Delete user",       vals:["✓","—","—","—","—","—"]},
          {label:"Edit commissions",  vals:["✓","—","—","—","—","—"]},
          {label:"Receive rotation",  vals:["—","—","—","—","✓","✓"],highlight:"blue",bold:true}
        ];
        var roleCols = ["Admin","Sales Admin","Director","Manager","Team Leader","Sales"];
        var cellFor = function(v){
          if(v==="✓")     return <span style={{color:"#0F6E56",fontWeight:500,fontSize:13}}>✓</span>;
          if(v==="—")     return <span style={{color:"#999"}}>—</span>;
          /* scope label */ return <span style={{color:"#0F6E56",fontWeight:500,fontSize:9,letterSpacing:"0.3px"}}>{v}</span>;
        };
        var rowBg = function(h){ if(h==="green") return "#EAF6F0"; if(h==="blue") return "#E6F1FB"; return "transparent"; };

        return <div style={{fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
          {/* ══ Team hierarchy ══ */}
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Team hierarchy</div>
          <div style={{fontSize:12,color:"#666",marginBottom:10}}>6-level structure: Admin → Sales Director → Managers → Team Leaders → Sales</div>

          <div style={{padding:24,background:"#F7F7F5",borderRadius:8,marginBottom:16}}>
            {/* Admin row */}
            {byRole.admin.length===0
              ? hRow([<div key="a" style={Object.assign({},nodeStyle("admin"),{opacity:0.5,fontStyle:"italic"})}>No admin</div>])
              : hRow(byRole.admin.map(function(u){return <div key={gid(u)} style={nodeStyle("admin")}>{u.name} · Admin</div>;}))
            }
            {hDown}

            {/* Sales Director row */}
            {byRole.director.length===0
              ? hRow([<div key="d" style={Object.assign({},nodeStyle("director"),{opacity:0.5,fontStyle:"italic"})}>No Sales Director yet</div>])
              : hRow(byRole.director.map(function(u){return <div key={gid(u)} style={nodeStyle("director")}>{u.name} · Sales Director</div>;}))
            }
            {hDown}

            {/* Sales Manager row (multiple possible) */}
            {byRole.manager.length===0
              ? hRow([<div key="m" style={Object.assign({},nodeStyle("manager"),{opacity:0.5,fontStyle:"italic"})}>No Sales Managers</div>])
              : hRow(byRole.manager.map(function(u){return <div key={gid(u)} style={nodeStyle("manager")}>{u.name} · Sales Manager</div>;}))
            }
            {/* Team Leader row (only if any TL exists) */}
            {byRole.team_leader.length>0 && hDown}
            {byRole.team_leader.length>0 && hRow(byRole.team_leader.map(function(tl){
              var teamLabel = tl.teamName ? (" ("+tl.teamName+")") : "";
              return <div key={gid(tl)} style={nodeStyle("tl")}>{tl.name} · TL{teamLabel}</div>;
            }))}

            {/* Team cards grid — direct-sales-under-manager cards AND TL-led team cards.
                A Sales Manager can have Sales reporting DIRECTLY to them alongside Team
                Leaders; show both as distinct cards. Direct-reports cards use manager
                amber (#854F0B) to signal they're attached to the manager, not a TL. */}
            {(function(){
              var cards = [];
              byRole.manager.forEach(function(mgr){
                var direct = childrenOf(gid(mgr),"sales");
                if(direct.length) cards.push({key:"direct-"+gid(mgr),teamName:"Direct Reports · "+mgr.name,accent:"#854F0B",members:direct});
              });
              byRole.team_leader.forEach(function(tl){
                cards.push({key:"tl-"+gid(tl),teamName:tl.teamName||(tl.name+" Team"),accent:"#3C3489",members:childrenOf(gid(tl),"sales")});
              });
              if(!cards.length) return null;
              return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:10,marginTop:14}}>
                {cards.map(function(tc){
                  return <div key={tc.key} style={{background:"#fff",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:11,fontWeight:500,color:tc.accent,marginBottom:6}}>{tc.teamName}</div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {tc.members.length===0
                        ? <span style={{fontSize:10,color:"#999",fontStyle:"italic"}}>No sales members</span>
                        : tc.members.map(function(m){return <span key={gid(m)} style={{fontSize:10,padding:"2px 6px",background:"#E6F1FB",color:"#185FA5",borderRadius:8}}>{m.name}</span>;})
                      }
                    </div>
                  </div>;
                })}
              </div>;
            })()}

            <div style={{marginTop:14,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
              <button type="button" disabled title="Coming in later tab" style={{fontSize:12,padding:"6px 12px",border:"0.5px solid rgba(0,0,0,0.1)",background:"transparent",borderRadius:8,cursor:"not-allowed",color:"#1a1a1a",fontFamily:"inherit",opacity:0.6}}>+ Add Team</button>
              <button type="button" disabled title="Coming in later tab" style={{fontSize:12,padding:"6px 12px",border:"0.5px solid rgba(0,0,0,0.1)",background:"transparent",borderRadius:8,cursor:"not-allowed",color:"#1a1a1a",fontFamily:"inherit",opacity:0.6}}>+ Add Manager</button>
              <button type="button" disabled title="Coming in later tab" style={{fontSize:12,padding:"6px 12px",border:"0.5px solid rgba(0,0,0,0.1)",background:"transparent",borderRadius:8,cursor:"not-allowed",color:"#1a1a1a",fontFamily:"inherit",opacity:0.6}}>Edit hierarchy</button>
            </div>
          </div>

          {/* Info box */}
          <div style={{background:"#E6F1FB",borderLeft:"3px solid #185FA5",padding:"10px 14px",borderRadius:8,fontSize:12,color:"#185FA5",marginBottom:16,lineHeight:1.5}}>
            <b>Multiple Sales Managers:</b> A Sales Director can oversee multiple Sales Managers. Each Manager can have multiple Team Leaders under them. A Team Leader leads one team of Sales agents.
          </div>

          {/* ══ Permissions matrix ══ */}
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Permissions matrix</div>
          <div style={{fontSize:12,color:"#666",marginBottom:10}}>Scope: ALL = everyone · ALL UNDER = everything in Director's chain · TEAMS UNDER = all Manager's teams · OWN TEAM = Team Leader's team · OWN = own records</div>

          <div style={{overflowX:"auto",marginBottom:24}}>
            <table style={{width:"100%",fontSize:11,borderCollapse:"collapse"}}>
              <thead style={{background:"#F7F7F5"}}>
                <tr>
                  <th style={{textAlign:"left",padding:"10px 8px",fontWeight:500,fontSize:11,color:"#666",minWidth:180}}>Action</th>
                  {roleCols.map(function(r){return <th key={r} style={{textAlign:"center",padding:"10px 8px",fontWeight:500,fontSize:11,color:"#666"}}>{r}</th>;})}
                </tr>
              </thead>
              <tbody>
                {permRows.map(function(row,i){
                  var hBg = rowBg(row.highlight);
                  var actionColor = row.highlight==="blue" ? "#185FA5" : "#1a1a1a";
                  return <tr key={i} style={{background:hBg}}>
                    <td style={{padding:"8px",borderTop:"0.5px solid rgba(0,0,0,0.1)",fontSize:11,fontWeight:row.bold?500:400,color:actionColor}}>
                      {row.bold ? <b>{row.label}</b> : row.label}
                    </td>
                    {row.vals.map(function(v,j){return <td key={j} style={{padding:"8px",borderTop:"0.5px solid rgba(0,0,0,0.1)",fontSize:11,textAlign:"center"}}>{cellFor(v)}</td>;})}
                  </tr>;
                })}
              </tbody>
            </table>
          </div>

          {/* ══ User deletion confirmation preview ══ */}
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>User deletion confirmation preview</div>
          <div style={{fontSize:12,color:"#666",marginBottom:10}}>Cascade effects vary by role</div>

          {previewMgr
            ? <div style={{background:"#FCEBEB",border:"0.5px solid rgba(163,45,45,0.3)",borderRadius:12,padding:"14px 16px",maxWidth:540}}>
                <div style={{fontSize:14,fontWeight:500,color:"#A32D2D",marginBottom:10}}>Delete {previewMgr.name}?</div>
                <div style={{fontSize:13,color:"#A32D2D",lineHeight:1.7,marginBottom:12}}>
                  This user is a <b>Sales Manager</b>. Affected items:<br/>
                  • {previewTLs.length} Team Leader{previewTLs.length===1?"":"s"} under them → flagged for new Manager assignment<br/>
                  • {previewSales.length} Sales in those teams → hierarchy chain broken<br/>
                  • 0 active leads (Managers don't receive rotation)<br/>
                  • Historical Deals approvals → preserved as "Ex-{previewMgr.name}"
                </div>
                <div style={{fontSize:12,color:"#A32D2D",opacity:0.85,marginBottom:14,lineHeight:1.5}}>You must assign the orphaned Team Leaders to another Manager before the hierarchy is complete again.</div>
                <div style={{display:"flex",gap:8}}>
                  <button type="button" disabled style={{fontSize:12,padding:"6px 12px",border:"0.5px solid rgba(0,0,0,0.1)",background:"transparent",borderRadius:8,cursor:"not-allowed",color:"#1a1a1a",fontFamily:"inherit",opacity:0.7}}>Cancel</button>
                  <button type="button" disabled style={{fontSize:12,padding:"6px 12px",border:"0.5px solid #A32D2D",background:"#A32D2D",borderRadius:8,cursor:"not-allowed",color:"#fff",fontWeight:500,fontFamily:"inherit",opacity:0.8}} title="Preview only — actual deletion lives in Users page">Delete &amp; Flag Orphans</button>
                </div>
              </div>
            : <div style={{background:"#F7F7F5",border:"0.5px dashed rgba(0,0,0,0.1)",borderRadius:8,padding:"14px 16px",fontSize:12,color:"#666",maxWidth:540}}>No Sales Managers in the roster yet — add one in the Users page to preview the cascade.</div>
          }
        </div>;
      })()}
      {activeTab==="integrations"&&(function(){
        var integrations = [
          {id:"gs", name:"Google Sheets",     sub:"Lead intake via Apps Script",        tile:"GS", tBg:"#EAF6F0", tFg:"#0F6E56", status:"connected"},
          {id:"fb", name:"Facebook Lead Ads", sub:"via Make.com scenario",              tile:"FB", tBg:"#E6F1FB", tFg:"#185FA5", status:"connected"},
          {id:"wa", name:"WhatsApp API",      sub:"Outbound callbacks & reminders",     tile:"WA", tBg:"#E1F5EE", tFg:"#0F6E56", status:"disconnected"}
        ];
        var pill = function(status){
          if(status==="connected")    return {label:"Connected",    bg:"#EAF6F0", fg:"#0F6E56"};
          if(status==="disconnected") return {label:"Disconnected", bg:"#EEEEEA", fg:"#666"};
          return {label:"Error",                                    bg:"#FCEBEB", fg:"#A32D2D"};
        };
        return <div style={{fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>External integrations</div>
          <div style={{fontSize:12,color:"#666",marginBottom:12}}>Third-party services that feed leads into the CRM or push notifications out.</div>
          <div style={{display:"grid",gap:10}}>
            {integrations.map(function(it){
              var pl = pill(it.status);
              return <div key={it.id} style={{background:"#F7F7F5",borderRadius:8,padding:14,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,background:it.tBg,color:it.tFg,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:500,fontSize:11,flexShrink:0}}>{it.tile}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500}}>{it.name}</div>
                  <div style={{fontSize:12,color:"#666"}}>{it.sub}</div>
                </div>
                <span style={{fontSize:11,background:pl.bg,color:pl.fg,padding:"3px 8px",borderRadius:10,fontWeight:500,flexShrink:0}}>{pl.label}</span>
                <button type="button" disabled title="Integration settings ship later"
                  style={{fontSize:12,padding:"6px 12px",border:"0.5px solid rgba(0,0,0,0.1)",background:"transparent",borderRadius:8,cursor:"not-allowed",color:"#1a1a1a",fontFamily:"inherit",opacity:0.6,flexShrink:0}}>Configure</button>
              </div>;
            })}
          </div>
        </div>;
      })()}
      {activeTab==="rules"&&(function(){
        var setBR = function(k,v){setBizRules(function(prev){var next=Object.assign({},prev);next[k]=v;return next;});};

        // Switch pill — green ON, neutral gray OFF. Grayed + locked cursor when disabled.
        var switchPill = function(on, onClick, disabled){
          return <div
            onClick={disabled ? undefined : onClick}
            title={disabled ? "Locked — cannot be disabled" : "Toggle"}
            style={{width:36,height:20,borderRadius:10,position:"relative",
              cursor: disabled ? "not-allowed" : "pointer",
              flexShrink:0,
              background: on ? (disabled ? "#A0A0A0" : "#0F6E56") : "#CBD5E1",
              opacity: disabled ? 0.7 : 1,
              transition: "background 0.15s"}}>
            <span style={{display:"block",width:14,height:14,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left: on ? 19 : 3,transition:"left 0.15s"}}/>
          </div>;
        };

        // Rule row: label + optional description + switch on the right. Optional locked + redTone.
        var ruleRow = function(opts){
          var locked  = !!opts.locked;
          var redTone = !!opts.redTone;
          return <div style={{
            display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
            background: redTone && locked ? "rgba(252,235,235,0.6)" : (locked ? "#F7F7F5" : "#fff"),
            border: locked
              ? "0.5px dashed " + (redTone ? "rgba(163,45,45,0.4)" : "rgba(0,0,0,0.1)")
              : "0.5px solid rgba(0,0,0,0.08)",
            borderRadius:8, marginBottom:6
          }}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500,color:redTone?"#A32D2D":"#1a1a1a",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span>{opts.label}</span>
                {locked && <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,
                  background: redTone ? "#FCEBEB" : "#EEEEEA",
                  color: redTone ? "#A32D2D" : "#666",fontWeight:500}}>LOCKED</span>}
              </div>
              {opts.desc && <div style={{fontSize:11,color:redTone?"#A32D2D":"#666",marginTop:2,lineHeight:1.5,opacity:redTone?0.9:1}}>{opts.desc}</div>}
              {opts.inline && <div style={{marginTop:6}}>{opts.inline}</div>}
            </div>
            {switchPill(opts.on, opts.onClick, locked)}
          </div>;
        };

        var sectionHdr = function(text, redTone){return <div style={{fontSize:12,color:redTone?"#A32D2D":"#666",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.3px",fontWeight:500}}>{text}</div>;};

        var inlineNum = function(val,setter,min,max,suffix){return <span style={{fontSize:11,color:"#666",display:"inline-flex",alignItems:"center",gap:6}}>
          <input type="number" min={min} max={max} value={val} onChange={function(e){setter(Number(e.target.value)||0);}}
            style={{width:56,padding:"4px 8px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:6,fontSize:12,background:"#fff",textAlign:"center",fontFamily:"inherit"}}/>
          <span>{suffix}</span>
        </span>;};

        return <div style={{fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Business rules</div>
          <div style={{fontSize:12,color:"#666",marginBottom:10}}>Core business logic — locked rules cannot be disabled</div>

          <div style={{background:"#E6F1FB",borderLeft:"3px solid #185FA5",padding:"10px 14px",borderRadius:8,fontSize:12,color:"#185FA5",marginBottom:16,lineHeight:1.5}}>
            These rules govern lead flow, permissions, and rotation exclusions. Locked rules are system-critical.
          </div>

          {/* ── Rotation exclusions ── */}
          <div style={{marginBottom:20}}>
            {sectionHdr("Rotation exclusions")}
            {ruleRow({label:"Exclude Done Deals", desc:"Leads marked DoneDeal never enter rotation — they stay locked with the closing agent.", on:true, locked:true})}
            {ruleRow({label:"Exclude EOIs",       desc:"Leads with an active EOI stay with the current agent until approved or cancelled.",      on:true, locked:true})}
            {ruleRow({label:"Exclude Archived leads", desc:"Archived leads are read-only and skip rotation entirely.", on:bizRules.excludeArchived, onClick:function(){setBR("excludeArchived",!bizRules.excludeArchived);}})}
            {ruleRow({label:"Stop rotation after N days in CRM", desc:"After this age a lead stops rotating and stays with its current agent. Synced with the Rotation tab.", on:rotStopDays>0, onClick:function(){setRotStopDays(rotStopDays>0?0:45);},
              inline: rotStopDays>0 ? inlineNum(rotStopDays,setRotStopDays,1,3650,"days") : null})}
          </div>

          {/* ── Cancel behavior ── */}
          <div style={{marginBottom:20}}>
            {sectionHdr("Cancel behavior")}
            {ruleRow({label:"Admin + Sales Admin only", desc:"Only these roles can cancel a Deal or an EOI. Others see view-only within their scope.", on:true, locked:true})}
            {ruleRow({label:"Cancel returns lead to Hot Case", desc:"Cancelled Deal/EOI resets the lead's status so it rejoins the pipeline.", on:bizRules.cancelReturnsHot, onClick:function(){setBR("cancelReturnsHot",!bizRules.cancelReturnsHot);}})}
            {ruleRow({label:"Forced rotation overrides one-shot rule", desc:"Cancel triggers a rotation that may assign to an agent who already handled the lead.", on:bizRules.cancelForcedRot, onClick:function(){setBR("cancelForcedRot",!bizRules.cancelForcedRot);}})}
            <div style={{background:"#FAEEDA",borderLeft:"3px solid #854F0B",padding:"10px 14px",borderRadius:8,fontSize:12,color:"#854F0B",marginTop:10,lineHeight:1.5}}>
              Cancel is admin-only for data integrity. The forced-rotation override is what makes cancelled leads reach a fresh agent.
            </div>
          </div>

          {/* ── Rotation limits ── */}
          <div style={{marginBottom:20}}>
            {sectionHdr("Rotation limits")}
            {ruleRow({label:"Halt after N× consecutive Not Interested",
              desc:"Stops rotation on a lead once this threshold hits. Synced with the Rotation tab.",
              on:srHaltNI>0, onClick:function(){setSrHaltNI(srHaltNI>0?0:3);},
              inline: srHaltNI>0 ? inlineNum(srHaltNI,setSrHaltNI,1,20,"× Not Interested") : null})}
            {ruleRow({label:"Max rotations per lead",
              desc:"Caps the total number of rotation events a single lead can trigger. 0 = no cap.",
              on:bizRules.maxRotationsPerLead>0,
              onClick:function(){setBR("maxRotationsPerLead", bizRules.maxRotationsPerLead>0 ? 0 : 10);},
              inline: bizRules.maxRotationsPerLead>0
                ? inlineNum(bizRules.maxRotationsPerLead, function(v){setBR("maxRotationsPerLead",v);}, 1, 100, "rotations")
                : null})}
            {ruleRow({label:"Skip agents offline longer than N hours",
              desc:"Agents whose last heartbeat is older than this are skipped in rotation. Synced with the Rotation tab.",
              on:srOffH>0, onClick:function(){setSrOffH(srOffH>0?0:4);},
              inline: srOffH>0 ? inlineNum(srOffH,setSrOffH,1,168,"hours") : null})}
            {ruleRow({label:"Halt rotation when all agents have handled the lead",
              desc:"When every agent in every tier has already handled the lead, rotation halts and admin is notified.",
              on:srHaltAll, onClick:function(){setSrHaltAll(!srHaltAll);}})}
          </div>

          {/* ── Workflow rules ── */}
          <div style={{marginBottom:20}}>
            {sectionHdr("Workflow rules")}
            {ruleRow({label:"Sales → Pending for EOI conversion",
              desc:"Sales-initiated EOIs land in Pending state awaiting Admin / Sales Admin approval before lock-in.",
              on:bizRules.salesEoiToPending, onClick:function(){setBR("salesEoiToPending",!bizRules.salesEoiToPending);}})}
            {ruleRow({label:"Admin approves EOI and Deal",
              desc:"Every EOI and every Deal requires Admin or Sales Admin approval before it activates.",
              on:true, locked:true})}
            {ruleRow({label:"Done Deal removes item from EOI page",
              desc:"Once a deal closes, the originating EOI disappears from the EOI listing.",
              on:bizRules.doneRemovesEoi, onClick:function(){setBR("doneRemovesEoi",!bizRules.doneRemovesEoi);}})}
          </div>

          {/* ── User deletion cascade — locked, red-toned card ── */}
          <div style={{marginBottom:20,padding:"12px 14px",background:"#FCEBEB",border:"0.5px solid rgba(163,45,45,0.3)",borderRadius:12}}>
            {sectionHdr("User deletion cascade", true)}
            {ruleRow({label:"Active Leads & Daily Requests become 'No Agent'",
              desc:"Ownership clears on delete — admin must manually reassign.",
              on:true, locked:true, redTone:true})}
            {ruleRow({label:"Historical Deals and EOIs preserve original agent as 'Ex-{name}'",
              desc:"Closed deals and EOIs keep their original agent label for commission and reporting.",
              on:true, locked:true, redTone:true})}
            {ruleRow({label:"Cascade orphan flags for deleted TLs / Managers / Directors",
              desc:"Sales under a deleted TL get teamLeaderId=null; same for managerId / directorId.",
              on:true, locked:true, redTone:true})}
            {ruleRow({label:"Confirmation dialog required",
              desc:"Admin sees a counts-of-affected-items preview before the delete goes through.",
              on:true, locked:true, redTone:true})}
          </div>

          <div style={{background:"#FCEBEB",borderLeft:"3px solid #A32D2D",padding:"10px 14px",borderRadius:8,fontSize:12,color:"#A32D2D",lineHeight:1.5}}>
            Locked rules protect critical data integrity. They cannot be disabled from the UI.
          </div>
        </div>;
      })()}
      {activeTab==="audit"&&(function(){
        // Apply UI-level filters to the entries array (when backend ships, these run client-side).
        var nowMs = Date.now();
        var withinDate = function(ts){
          if(!ts || auditDate==="all") return true;
          var diff = nowMs - new Date(ts).getTime();
          if(auditDate==="today") return diff < 24*60*60*1000;
          if(auditDate==="week")  return diff < 7*24*60*60*1000;
          if(auditDate==="month") return diff < 30*24*60*60*1000;
          return true;
        };
        var filtered = auditEntries.filter(function(e){
          if(!withinDate(e.timestamp||e.createdAt)) return false;
          if(auditAdmin!=="all" && String(e.changedBy&&e.changedBy._id||e.changedBy) !== auditAdmin) return false;
          if(auditField!=="all" && e.field !== auditField) return false;
          return true;
        });

        // Distinct admin + field lists for the filter dropdowns
        var admins = {};
        auditEntries.forEach(function(e){
          var id   = String(e.changedBy&&e.changedBy._id||e.changedBy||"");
          var name = (e.changedBy&&e.changedBy.name) || e.changedByName || id;
          if(id) admins[id] = name;
        });
        var fields = Array.from(new Set(auditEntries.map(function(e){return e.field;}).filter(Boolean))).sort();

        var filterSelStyle = {padding:"6px 10px",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:8,fontSize:12,background:"#fff",fontFamily:"inherit",color:"#1a1a1a"};

        // Pretty-format a value for display (truncate long values, stringify objects).
        var fmt = function(v){
          if(v==null) return "∅";
          if(typeof v==="boolean") return v ? "on" : "off";
          if(typeof v==="object") { try { v = JSON.stringify(v); } catch(_){ v = "[object]"; } }
          v = String(v);
          return v.length>60 ? v.slice(0,60)+"…" : v;
        };

        var formatTs = function(ts){
          if(!ts) return "";
          var d = new Date(ts);
          var today = new Date(); today.setHours(0,0,0,0);
          var dDay  = new Date(d);  dDay.setHours(0,0,0,0);
          var time = d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
          if(dDay.getTime()===today.getTime()) return "Today "+time;
          var yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
          if(dDay.getTime()===yesterday.getTime()) return "Yesterday "+time;
          return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short"})+" "+time;
        };

        return <div style={{fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"}}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Recent settings changes</div>
          <div style={{fontSize:12,color:"#666",marginBottom:12}}>Every change to company settings, with who made it and when. Click Rollback to revert a single change.</div>

          {/* Filter bar */}
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:11,color:"#666",textTransform:"uppercase",letterSpacing:"0.3px"}}>Filter</span>
            <select value={auditDate} onChange={function(e){setAuditDate(e.target.value);}} style={filterSelStyle}>
              <option value="all">Any date</option>
              <option value="today">Today</option>
              <option value="week">Past 7 days</option>
              <option value="month">Past 30 days</option>
            </select>
            <select value={auditAdmin} onChange={function(e){setAuditAdmin(e.target.value);}} style={filterSelStyle}>
              <option value="all">Any admin</option>
              {Object.keys(admins).map(function(id){return <option key={id} value={id}>{admins[id]}</option>;})}
            </select>
            <select value={auditField} onChange={function(e){setAuditField(e.target.value);}} style={filterSelStyle}>
              <option value="all">Any field</option>
              {fields.map(function(f){return <option key={f} value={f}>{f}</option>;})}
            </select>
            {(auditDate!=="all"||auditAdmin!=="all"||auditField!=="all") &&
              <button type="button" onClick={function(){setAuditDate("all");setAuditAdmin("all");setAuditField("all");}}
                style={{fontSize:12,padding:"6px 12px",border:"0.5px solid rgba(0,0,0,0.1)",background:"transparent",borderRadius:8,cursor:"pointer",color:"#1a1a1a",fontFamily:"inherit"}}>Clear</button>}
          </div>

          {/* Entries */}
          {!auditLoaded
            ? <div style={{background:"#F7F7F5",border:"0.5px dashed rgba(0,0,0,0.1)",borderRadius:8,padding:"16px",textAlign:"center",color:"#666",fontSize:12}}>Loading audit log…</div>
            : filtered.length===0
              ? <div style={{background:"#F7F7F5",border:"0.5px dashed rgba(0,0,0,0.1)",borderRadius:8,padding:"24px 16px",textAlign:"center",color:"#666"}}>
                  <div style={{fontSize:14,fontWeight:500,marginBottom:6,color:"#1a1a1a"}}>
                    {auditEntries.length===0 ? "No settings changes yet" : "No entries match these filters"}
                  </div>
                  <div style={{fontSize:12,lineHeight:1.5}}>
                    {auditEntries.length===0
                      ? "Once the /api/settings/audit endpoint ships, every change to Rotation, Team & Roles, Business Rules, and Integrations will appear here with a Rollback option."
                      : "Try clearing the filters or widening the date range."}
                  </div>
                </div>
              : <div>
                  {filtered.map(function(e,i){
                    var actor = (e.changedBy&&e.changedBy.name) || e.changedByName || "Admin";
                    var field = e.field || "(unknown field)";
                    var rolled = !!e.rolledBack;
                    return <div key={e._id||i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"0.5px solid rgba(0,0,0,0.1)",fontSize:12}}>
                      <div style={{flex:1,minWidth:0,lineHeight:1.5}}>
                        <b>{actor}</b> changed <span style={{color:"#185FA5",fontFamily:"ui-monospace, Menlo, monospace"}}>{field}</span>
                        {" "}from <span style={{color:"#666"}}>"{fmt(e.oldValue)}"</span>
                        {" "}to <span style={{color:"#0F6E56",fontWeight:500}}>"{fmt(e.newValue)}"</span>
                        {rolled && <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:"#EEEEEA",color:"#666",fontWeight:500,marginLeft:8}}>ROLLED BACK</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <span style={{color:"#666",fontSize:11}}>{formatTs(e.timestamp||e.createdAt)}</span>
                        <button type="button" disabled={rolled} title={rolled ? "Already rolled back" : "Rollback not yet wired (endpoint pending)"}
                          style={{fontSize:12,padding:"4px 10px",border:"0.5px solid rgba(0,0,0,0.1)",background:"transparent",borderRadius:6,cursor: rolled ? "not-allowed" : "pointer",color:"#1a1a1a",fontFamily:"inherit",opacity: rolled ? 0.4 : 0.8}}>
                          Rollback
                        </button>
                      </div>
                    </div>;
                  })}
                </div>
          }

          {auditEntries.length>0 && <div style={{fontSize:11,color:"#999",marginTop:12,textAlign:"right"}}>
            Showing {filtered.length} of {auditEntries.length} {auditEntries.length===1?"entry":"entries"}
          </div>}
        </div>;
      })()}

        </div>
      </div>
    </div>
  </div>;
};

// ===== KPIs PAGE (Sales only) =====
var KPIsPage = function(p) {
  var uid = String(p.cu.id);
  var parseBudget = function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var isTeamLeader = p.cu.role==="manager"||p.cu.role==="team_leader";
  // For manager/team leader: include all team deals in revenue calc
  var teamUids = isTeamLeader ? new Set((p.myTeamUsers||[]).map(function(u){return String(u._id);})) : null;
  var myLeads = p.leads.filter(function(l){
    var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");
    var splitId=String(l.splitAgent2Id&&l.splitAgent2Id._id?l.splitAgent2Id._id:l.splitAgent2Id||"");
    if(isTeamLeader && teamUids) return (teamUids.has(aid)||(splitId&&teamUids.has(splitId)))&&!l.archived&&l.source!=="Daily Request";
    return (aid===uid||splitId===uid)&&!l.archived&&l.source!=="Daily Request";
  });
  var myDeals = myLeads.filter(function(l){return l.status==="DoneDeal";});
  var myActs = p.activities.filter(function(a){var auid=a.userId&&a.userId._id?a.userId._id:a.userId;return auid===uid;});
  var myUser = p.users.find(function(u){return String(gid(u))===uid;})||{};

  var getQ = function(date){var m=new Date(date).getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";};
  var getYear = function(date){return new Date(date).getFullYear();};
  var curQ = (function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
  var curYear = new Date().getFullYear();

  var [selQ, setSelQ] = useState(curQ);
  var [selYear, setSelYear] = useState(curYear);

  // Team leader target: sum of every team member's quarterly target so the
  // progress bar reflects the whole team's quota, matching aggregated deals.
  var qTarget = isTeamLeader
    ? (p.myTeamUsers||[]).reduce(function(s,u){ return s + (getEffectiveQTarget(u, p.users, selQ)||0); }, 0)
    : getEffectiveQTarget(myUser, p.users, selQ);

  // Filter by selected Q and year
  var qDeals = myDeals.filter(function(d){
    var dd = d.updatedAt||d.createdAt; if(!dd) return false;
    return getQ(dd)===selQ && getYear(dd)===selYear;
  });
  var qCalls = myActs.filter(function(a){
    if(a.type!=="call"||!a.createdAt) return false;
    return getQ(a.createdAt)===selQ && getYear(a.createdAt)===selYear;
  });
  var qLeads = myLeads.filter(function(l){
    if(!l.createdAt) return false;
    return getQ(l.createdAt)===selQ && getYear(l.createdAt)===selYear;
  });
  var qRev = qDeals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);return s+parseBudget(d.budget)*w*(sp?0.5:1);},0);
  var qProg = qTarget>0?Math.min(100,Math.round(qRev/qTarget*100)):0;
  var convRate = qLeads.length>0?Math.round(qDeals.length/qLeads.length*100):0;

  var isOnlineNow = myUser.lastSeen&&(Date.now()-new Date(myUser.lastSeen).getTime())<3*60*1000;

  // Available years — current and past 2
  var years = [curYear, curYear-1, curYear-2, curYear-3];

  // Profile card uses the exact same design as the Admin's Sales Team page
  // individual agent card (MemberCard). Stable per-user gradient + white
  // stats panel beneath a gradient hero. Data and logic below are unchanged.
  var kpiGradFor = function(uid){var h=0;var s=String(uid||"");for(var i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))&0x7fffffff;}return "kpi-grad-"+((h%8)+1);};
  var kpiGradClass = kpiGradFor(uid);
  var kpiDisplayName = p.cu.username==="amgad" ? "Amgad Mohamed" : p.cu.name;
  var kpiInitials = (kpiDisplayName||"?").split(" ").slice(0,2).map(function(x){return x[0]||"";}).join("").toUpperCase();
  var kpiRoleLabel = p.cu.title || ({admin:"Admin",sales_admin:"Sales Admin",manager:"Manager",team_leader:"Team Leader",sales:"Sales",viewer:"Viewer"}[p.cu.role]||"");
  var kpiLastSeenStr = myUser.lastSeen ? ("Last seen: "+new Date(myUser.lastSeen).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" \u2014 "+timeAgo(myUser.lastSeen,p.t)) : "Never logged in";
  var kpiTotalRevAll = myDeals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp2=getDealSplitFromObj(d);return s+parseBudget(d.budget)*w*(sp2?0.5:1);},0);
  var kpiTotalRevM = (kpiTotalRevAll/1000000).toFixed(1)+"M";
  var kpiMemberStats = [
    { v: myLeads.length, l: "Leads", isDeals:false },
    { v: myDeals.length, l: "Deals", isDeals:true  },
    { v: kpiTotalRevM,   l: "Total", isDeals:false },
    { v: myActs.filter(function(a){return a.type==="call";}).length, l: "Calls", isDeals:false }
  ];
  return <div className="kpi-page-v2" style={{ padding:"18px 16px 40px" }}>
    {/* Inter font + the 8 gradient classes — mirrors Admin's Sales Team page. */}
    <style>{""
      + "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');"
      + ".kpi-page-v2 .kpi-grad-1 { background: linear-gradient(135deg, #43c6db, #3b5cb8); }"
      + ".kpi-page-v2 .kpi-grad-2 { background: linear-gradient(135deg, #f953c6, #b91d73); }"
      + ".kpi-page-v2 .kpi-grad-3 { background: linear-gradient(135deg, #56ab2f, #a8e063); }"
      + ".kpi-page-v2 .kpi-grad-4 { background: linear-gradient(135deg, #f7797d, #c6426e); }"
      + ".kpi-page-v2 .kpi-grad-5 { background: linear-gradient(135deg, #e52d27, #b31217); }"
      + ".kpi-page-v2 .kpi-grad-6 { background: linear-gradient(135deg, #f46b45, #eea849); }"
      + ".kpi-page-v2 .kpi-grad-7 { background: linear-gradient(135deg, #b8d435, #56ab2f); }"
      + ".kpi-page-v2 .kpi-grad-8 { background: linear-gradient(135deg, #a18cd1, #e8a4c8); }"
    }</style>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>KPIs</h2>

    {/* Profile Card — MemberCard design (mirrors Admin's Sales Team page) */}
    <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
      <div style={{ width:"100%", maxWidth:320, borderRadius:16, overflow:"hidden", background:"#fff", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", fontFamily:"'Inter','Segoe UI',sans-serif" }}>
        {/* Gradient hero */}
        <div className={kpiGradClass} style={{ padding:"18px 14px 16px", position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          {isOnlineNow && <span title="Online" style={{ position:"absolute", top:10, right:12, width:9, height:9, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 0 2px rgba(255,255,255,0.45)" }}/>}
          <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.22)", color:"#fff", border:"2px solid rgba(255,255,255,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800 }}>{kpiInitials}</div>
          <div style={{ fontSize:13, fontWeight:700, color:"#fff", textAlign:"center", maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{kpiDisplayName}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.85)", textTransform:"uppercase", letterSpacing:"0.04em", textAlign:"center" }}>{kpiRoleLabel}</div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.55)", textAlign:"center", maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{isOnlineNow?"Online now":kpiLastSeenStr}</div>
        </div>
        {/* White panel */}
        <div style={{ background:"#fff", padding:"14px 14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:600, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>{selQ} Target</span>
            <span style={{ fontSize:10, fontWeight:700, color:"#334155" }}>{qTarget>0?qTarget.toLocaleString()+" EGP":"Not set"}</span>
          </div>
          <div style={{ height:4, background:"#e2e8f0", borderRadius:2, marginBottom:10, overflow:"hidden" }}>
            <div className={kpiGradClass} style={{ height:"100%", width:qProg+"%", borderRadius:2, transition:"width 0.6s" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:12 }}>
            <span style={{ fontSize:18, fontWeight:800, color:qRev>0?"#0f172a":"#94a3b8" }}>{(qRev/1000000).toFixed(2)}M</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>{qProg}%</span>
          </div>
          <div style={{ height:1, background:"#e2e8f0", marginBottom:10, transform:"scaleY(0.5)" }}/>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:6 }}>
            {kpiMemberStats.map(function(s,i){
              var isZero = (s.v === 0) || (s.v === "0.0M") || (s.v === "0M") || (s.v === "0");
              var color;
              if (s.isDeals) color = (s.v > 0 ? "#15803d" : "#cbd5e1");
              else color = isZero ? "#cbd5e1" : "#0f172a";
              return <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:800, color:color, lineHeight:1.1 }}>{s.v}</div>
                <div style={{ fontSize:8, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:4 }}>{s.l}</div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>

    {/* Q selector + year */}
    <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
      <div style={{ display:"flex", gap:6 }}>
        {["Q1","Q2","Q3","Q4"].map(function(q){return <button key={q} onClick={function(){setSelQ(q);}}
          style={{ padding:"7px 16px", borderRadius:8, border:"1px solid", borderColor:selQ===q?C.accent:"#E2E8F0",
            background:selQ===q?C.accent+"12":"#fff", color:selQ===q?C.accent:C.textLight,
            fontSize:13, fontWeight:600, cursor:"pointer" }}>{q}{q===curQ&&selYear===curYear?" 🔵":""}</button>;})}
      </div>
      <select value={selYear} onChange={function(e){setSelYear(Number(e.target.value));}}
        style={{ padding:"7px 12px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, background:"#fff", color:C.text }}>
        {years.map(function(y){return <option key={y} value={y}>{y}</option>;})}
      </select>
    </div>

    {/* Q Target progress */}
    <Card style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:13, fontWeight:700 }}>{selQ} Target — {selYear}</span>
        <span style={{ fontSize:12, color:C.textLight }}>{qTarget>0?qTarget.toLocaleString()+" EGP":"Not set"}</span>
      </div>
      <div style={{ height:10, background:"#E2E8F0", borderRadius:5, marginBottom:8 }}>
        <div style={{ height:"100%", width:qProg+"%", borderRadius:5, background:qProg>=100?C.success:qProg>=50?C.accent:C.warning, transition:"width 0.6s" }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:13, color:C.success, fontWeight:700 }}>{(qRev/1000000).toFixed(2)}M EGP</span>
        <span style={{ fontSize:13, fontWeight:700, color:qProg>=100?C.success:C.accent }}>{qProg}%</span>
      </div>
    </Card>

    {/* Q stats */}
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
      {[
        {v:qDeals.length, l:"Deals", c:C.success, icon:"🏆"},
        {v:qCalls.length, l:"Calls", c:C.info, icon:"📞"},
        {v:qLeads.length, l:"New Leads", c:C.accent, icon:"👤"},
        {v:convRate+"%", l:"Conversion Rate", c:C.warning, icon:"📊"},
      ].map(function(s){return <Card key={s.l} style={{ flex:"1 1 120px", textAlign:"center", padding:"16px 12px" }}>
        <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
        <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
        <div style={{ fontSize:11, color:C.textLight, marginTop:4 }}>{s.l}</div>
      </Card>;})}
    </div>

    {/* Team members grid — team_leader only. Mirrors the admin Sales Team
        MemberCard design (gradient hero + white stats panel) using the 8
        .kpi-page-v2 .kpi-grad-N classes already defined above. */}
    {p.cu.role === "team_leader" && (p.myTeamUsers||[]).length > 1 && <div style={{ marginTop:20 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.04em" }}>Team Members</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:12 }}>
        {(p.myTeamUsers||[]).filter(function(u){ return String(gid(u)) !== uid; }).map(function(a){
          var auid = String(gid(a));
          var aLeads = p.leads.filter(function(l){ var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||""); return aid===auid && !l.archived && l.source!=="Daily Request"; });
          var aDeals = aLeads.filter(function(l){ return l.status==="DoneDeal"; });
          var aQDeals = aDeals.filter(function(d){ var dd=d.updatedAt||d.createdAt; return dd && getQ(dd)===selQ && getYear(dd)===selYear; });
          var aQRev = aQDeals.reduce(function(s,d){ var w=getProjectWeight(d.project,d); var sp=getDealSplitFromObj(d); return s+parseBudget(d.budget)*w*(sp?0.5:1); }, 0);
          var aTarget = getEffectiveQTarget(a, p.users, selQ);
          var aProg = aTarget>0 ? Math.min(100, Math.round(aQRev/aTarget*100)) : 0;
          var aCalls = p.activities.filter(function(ac){ var aauid=ac.userId&&ac.userId._id?ac.userId._id:ac.userId; return String(aauid)===auid && ac.type==="call"; }).length;
          var aTotalRev = aDeals.reduce(function(s,d){ var w=getProjectWeight(d.project,d); var sp=getDealSplitFromObj(d); return s+parseBudget(d.budget)*w*(sp?0.5:1); }, 0);
          var aGrad = kpiGradFor(auid);
          var aInitials = (a.name||"?").split(" ").slice(0,2).map(function(x){return x[0]||"";}).join("").toUpperCase();
          var aOnline = a.lastSeen && (Date.now()-new Date(a.lastSeen).getTime()) < 3*60*1000;
          var aRoleLabel = a.title || ({sales_admin:"Sales Admin",manager:"Manager",team_leader:"Team Leader",sales:"Sales",viewer:"Viewer",admin:"Admin"}[a.role]||"");
          return <div key={auid} style={{ borderRadius:16, overflow:"hidden", background:"#fff", boxShadow:"0 2px 10px rgba(0,0,0,0.08)" }}>
            <div className={aGrad} style={{ padding:"18px 14px 16px", position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              {aOnline && <span title="Online" style={{ position:"absolute", top:10, right:12, width:9, height:9, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 0 2px rgba(255,255,255,0.45)" }}/>}
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.22)", color:"#fff", border:"2px solid rgba(255,255,255,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800 }}>{aInitials}</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff", textAlign:"center", maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.85)", textTransform:"uppercase", letterSpacing:"0.04em" }}>{aRoleLabel}</div>
            </div>
            <div style={{ background:"#fff", padding:"14px 14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
                <span style={{ fontSize:10, fontWeight:600, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.04em" }}>{selQ} Target</span>
                <span style={{ fontSize:10, fontWeight:700, color:"#334155" }}>{aTarget>0?aTarget.toLocaleString()+" EGP":"Not set"}</span>
              </div>
              <div style={{ height:4, background:"#e2e8f0", borderRadius:2, marginBottom:10, overflow:"hidden" }}>
                <div className={aGrad} style={{ height:"100%", width:aProg+"%", borderRadius:2, transition:"width 0.6s" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:12 }}>
                <span style={{ fontSize:18, fontWeight:800, color:aQRev>0?"#0f172a":"#94a3b8" }}>{(aQRev/1000000).toFixed(2)}M</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>{aProg}%</span>
              </div>
              <div style={{ height:1, background:"#e2e8f0", marginBottom:10, transform:"scaleY(0.5)" }}/>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:6 }}>
                {[
                  { v:aLeads.length, l:"Leads", isDeals:false },
                  { v:aDeals.length, l:"Deals", isDeals:true },
                  { v:(aTotalRev/1000000).toFixed(1)+"M", l:"Total", isDeals:false },
                  { v:aCalls, l:"Calls", isDeals:false }
                ].map(function(s,i){
                  var isZero = (s.v === 0) || (s.v === "0.0M") || (s.v === "0M") || (s.v === "0");
                  var color = s.isDeals ? (s.v > 0 ? "#15803d" : "#cbd5e1") : (isZero ? "#cbd5e1" : "#0f172a");
                  return <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:16, fontWeight:800, color:color, lineHeight:1.1 }}>{s.v}</div>
                    <div style={{ fontSize:8, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:4 }}>{s.l}</div>
                  </div>;
                })}
              </div>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {/* Q Deals list */}
    {qDeals.length>0&&<Card style={{ marginTop:16 }}>
      <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>🏆 Deals {selQ} — {selYear}</div>
      {qDeals.map(function(d){return <div key={gid(d)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #F1F5F9" }}>
        <div>
          <div style={{ fontSize:12, fontWeight:600 }}>{d.name}</div>
          <div style={{ fontSize:10, color:C.textLight }}>{d.project||"-"}</div>
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:C.success }}>{parseBudget(d.budget)>0?(parseBudget(d.budget)/1000000).toFixed(2)+"M":d.budget||"-"}</div>
      </div>;})}
    </Card>}
  </div>;
};

// ===== CALL CALENDAR PAGE =====
var CallCalendarPage = function(p) {
  var uid = String(p.cu.id);
  var now = new Date();
  var [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  var year = viewDate.getFullYear(); var month = viewDate.getMonth();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  var firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  var monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  var myCallbacks = p.leads.filter(function(l){
    var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;
    return String(aid)===uid&&l.callbackTime&&!l.archived;
  });

  var getCallbacksForDay = function(day){
    return myCallbacks.filter(function(l){
      var d = new Date(l.callbackTime);
      return d.getFullYear()===year && d.getMonth()===month && d.getDate()===day;
    });
  };

  var today = new Date();
  var [selectedDay, setSelectedDay] = useState(null);

  var cells = [];
  // Empty cells for first day offset (Sunday=0, adjust for RTL week starting Saturday)
  var offset = (firstDay+1)%7; // Mon=0
  for(var i=0;i<offset;i++) cells.push(null);
  for(var d=1;d<=daysInMonth;d++) cells.push(d);

  var dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>📅 Calls Calendar</h2>

    {/* Month nav */}
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
      <button onClick={function(){setViewDate(new Date(year,month-1,1));setSelectedDay(null);}} style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", fontSize:16 }}>‹</button>
      <span style={{ fontSize:15, fontWeight:700 }}>{monthNames[month]} {year}</span>
      <button onClick={function(){setViewDate(new Date(year,month+1,1));setSelectedDay(null);}} style={{ width:32, height:32, borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", fontSize:16 }}>›</button>
    </div>

    {/* Day labels */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:4 }}>
      {dayLabels.map(function(d){return <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:600, color:C.textLight, padding:"4px 0" }}>{d}</div>;})}
    </div>

    {/* Calendar grid */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:16 }}>
      {cells.map(function(day,i){
        if(!day) return <div key={"e"+i}/>;
        var cbs = getCallbacksForDay(day);
        var isToday = day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
        var isSel = day===selectedDay;
        var hasCb = cbs.length>0;
        return <div key={day} onClick={function(){setSelectedDay(isSel?null:day);}}
          style={{ aspectRatio:"1", borderRadius:10, border:"2px solid", borderColor:isSel?C.accent:isToday?C.info:"#E8ECF1",
            background:isSel?C.accent+"12":isToday?"#EFF6FF":"#FAFBFC",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            cursor:hasCb?"pointer":"default", position:"relative", padding:4 }}>
          <span style={{ fontSize:13, fontWeight:isToday||isSel?700:400, color:isSel?C.accent:isToday?C.info:C.text }}>{day}</span>
          {hasCb&&<div style={{ display:"flex", gap:2, marginTop:2, flexWrap:"wrap", justifyContent:"center" }}>
            {cbs.slice(0,3).map(function(l,ci){return <span key={ci} style={{ width:6, height:6, borderRadius:"50%", background:C.accent, display:"inline-block" }}/>;})}
            {cbs.length>3&&<span style={{ fontSize:8, color:C.accent, fontWeight:700 }}>+{cbs.length-3}</span>}
          </div>}
        </div>;
      })}
    </div>

    {/* Selected day callbacks */}
    {selectedDay&&(function(){
      var cbs=getCallbacksForDay(selectedDay);
      return <Card>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📞 Calls {selectedDay} {monthNames[month]}</div>
        {cbs.length===0&&<div style={{ color:C.textLight, fontSize:13 }}>No Calls</div>}
        {cbs.map(function(l){
          var ci=callbackColor(l.callbackTime);
          var sc=STATUSES(p.t); var so=sc.find(function(s){return s.value===l.status;})||sc[0];
          return <div key={gid(l)} onClick={function(){p.nav("leads",true);p.setInitSelected(l);}}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid #F1F5F9", cursor:"pointer" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{l.name}</div>
              <div style={{ fontSize:11, color:C.textLight }}>{l.phone}</div>
            </div>
            <div style={{ textAlign:"left" }}>
              <span style={{ background:so.bg, color:so.color, padding:"2px 8px", borderRadius:12, fontSize:10, fontWeight:600 }}>{so.label}</span>
              <div style={{ fontSize:10, color:ci?ci.color:C.textLight, marginTop:3, fontWeight:600 }}>{l.callbackTime?l.callbackTime.slice(11,16):""}</div>
            </div>
          </div>;
        })}
      </Card>;
    })()}

    {/* Summary */}
    <div style={{ marginTop:16, display:"flex", gap:10 }}>
      <Card style={{ flex:1, textAlign:"center", padding:"12px" }}>
        <div style={{ fontSize:20, fontWeight:700, color:C.accent }}>{myCallbacks.filter(function(l){var d=new Date(l.callbackTime);return d.getFullYear()===year&&d.getMonth()===month;}).length}</div>
        <div style={{ fontSize:11, color:C.textLight, marginTop:4 }}>Calls This Month</div>
      </Card>
      <Card style={{ flex:1, textAlign:"center", padding:"12px" }}>
        <div style={{ fontSize:20, fontWeight:700, color:C.danger }}>{myCallbacks.filter(function(l){return new Date(l.callbackTime)<new Date()&&l.status==="CallBack";}).length}</div>
        <div style={{ fontSize:11, color:C.textLight, marginTop:4 }}>Overdue</div>
      </Card>
    </div>
  </div>;
};

// ===== MAIN APP =====
export default function CRMApp() {
  var [lang,setLang]=useState((function(){try{return "en";}catch(e){return "ar";}})());
  var [currentUser,setCurrentUser]=useState(null); var [token,setToken]=useState(null); var [csrfToken,setCsrfToken]=useState(null);
  // Phase 2 Slice 3 — projectWeights cache rev. Bumped after fetch and after
  // any save so all consumers re-render and read the updated module cache.
  // The actual map lives at module scope (_projWeightsMap) because
  // getProjectWeight is a top-level helper called from many render functions
  // — we just need a state value to trigger re-renders when the cache moves.
  var [projectWeightsRev,setProjectWeightsRev]=useState(0);
  var bumpProjectWeightsRev=useCallback(function(){ setProjectWeightsRev(function(v){return v+1;}); },[]);
  var [page,setPage]=useState((function(){try{return localStorage.getItem("crm_page")||null;}catch(e){return null;}})());
  var [leads,setLeads]=useState([]); var [users,setUsers]=useState([]);
  var [activities,setActivities]=useState([]); var [tasks,setTasks]=useState([]);
  var [dailyReqs,setDailyReqs]=useState([]);
  var [leadFilter,setLeadFilter]=useState("all");
  var [leadSpecialFilter,setLeadSpecialFilter]=useState(null);
  // One-shot initial filter for the Daily Requests page — set from the Sales
  // Dashboard click handlers; the page consumes it on mount and clears it.
  var [drInitFilter,setDrInitFilter]=useState(null);
  // One-shot initial agent filter for the Leads page — set by Admin Dashboard
  // drill-down clicks (Agent Performance row, Callback Compliance row). Leads
  // page consumes it on mount and clears it.
  var [initAgentFilter,setInitAgentFilter]=useState(null);
  useEffect(function(){ if (page && page!=="leads") { setLeadSpecialFilter(null); setInitAgentFilter(null); } },[page]);
  var [leadsPage,setLeadsPage]=useState(1); var [leadsTotal,setLeadsTotal]=useState(0); var [leadsTotalPages,setLeadsTotalPages]=useState(0);
  var [activitiesPage,setActivitiesPage]=useState(1); var [activitiesTotal,setActivitiesTotal]=useState(0); var [activitiesTotalPages,setActivitiesTotalPages]=useState(0);
  var [showNotif,setShowNotif]=useState(false);
  var [dealNotifs,setDealNotifs]=useState([]);
  var [showDealNotif,setShowDealNotif]=useState(false);
  var [showRotNotif,setShowRotNotif]=useState(false);
  var [rotNotifs,setRotNotifs]=useState([]);
  // Client-side "last seen" markers for the Deal and Rotation bells. Stored per
  // user in localStorage so the badge clears across reloads on the same device.
  // Deal badge is driven by live lead/DR state (see buildDealItems), not the
  // Notification collection, so the "seen" flag lives here rather than the DB.
  var [lastSeenDealAt,setLastSeenDealAt]=useState(0);
  var [rotHiddenBefore,setRotHiddenBefore]=useState(0);
  var [loading,setLoading]=useState(false); var [dataError,setDataError]=useState(null);
  var [isMobile,setIsMobile]=useState(window.innerWidth<768);
  var [sidebarOpen,setSidebarOpen]=useState(false);
  var [initSelected,setInitSelected]=useState(null);
  var [search,setSearch]=useState("");
  var [isOnline,setIsOnline]=useState(navigator.onLine);
  var [showPwaBanner,setShowPwaBanner]=useState(function(){
    var isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
    var isStandalone=window.navigator.standalone===true||window.matchMedia("(display-mode: standalone)").matches;
    var isDismissed=false; try{isDismissed=localStorage.getItem("crm_pwa_dismissed")==="1";}catch(e){}
    return isIOS&&!isStandalone&&!isDismissed;
  });

  // Deal notification helper — saves to DB, updates local state
  var addDealNotif = function(n){
    var notif = {type:"deal",leadName:n.leadName||"",leadId:n.leadId||"",agentName:n.agentName||"",status:n.status||"",budget:n.budget||""};
    apiFetch("/api/notifications","POST",notif,token).then(function(saved){
      if(saved) setDealNotifs(function(prev){return [Object.assign({},saved,{seen:false})].concat(prev).slice(0,50);});
    }).catch(function(){});
  };

  // Rotation notification helper — saves to DB, updates local state
  var notifyRotation = function(lead, fromName, toName, reason){
    var notif = {type:"rotation",leadName:lead.name,leadId:gid(lead),fromName:fromName,toName:toName,reason:reason};
    apiFetch("/api/notifications","POST",notif,token).then(function(saved){
      if(saved) setRotNotifs(function(prev){return [Object.assign({},saved,{seen:false})].concat(prev).slice(0,50);});
    }).catch(function(){});
    if (!(currentUser && currentUser.role === "sales")) showBrowserNotif("🔄 Auto Rotation", lead.name+" — from "+fromName+" to "+toName+" ("+reason+")");
  };
  var rotatingNow = useRef(new Set()).current;
  var notifyRotationRef = useRef(notifyRotation);
  notifyRotationRef.current = notifyRotation;

  // Fetch notifications from DB
  var loadNotifications = function(tok){
    apiFetch("/api/notifications?type=deal","GET",null,tok).then(function(data){if(data)setDealNotifs(data);}).catch(function(e){ console.error("Notifications (deal) fetch failed:", e); });
    apiFetch("/api/notifications?type=rotation","GET",null,tok).then(function(data){if(data)setRotNotifs(data);}).catch(function(e){ console.error("Notifications (rotation) fetch failed:", e); });
  };

  useEffect(function(){
    if (!document.getElementById('cairo-font')) {
      var link=document.createElement('link'); link.id='cairo-font'; link.rel='stylesheet';
      link.href='https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  },[]);
  
  useEffect(function(){
    var goOnline=function(){setIsOnline(true);};
    var goOffline=function(){setIsOnline(false);};
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return function(){ window.removeEventListener('online',goOnline); window.removeEventListener('offline',goOffline); };
  },[]);

  useEffect(function(){
    var fn=function(){setIsMobile(window.innerWidth<768);if(window.innerWidth>=768)setSidebarOpen(false);};
    window.addEventListener("resize",fn); return function(){window.removeEventListener("resize",fn);};
  },[]);

  // Load per-user bell "seen" markers from localStorage once the user is known.
  useEffect(function(){
    var uid = gid(currentUser); if (!uid) return;
    try {
      var dv = localStorage.getItem("crm_deal_seen_"+uid);
      if (dv) setLastSeenDealAt(parseInt(dv,10)||0);
      var rv = localStorage.getItem("crm_rot_hidden_"+uid);
      if (rv) setRotHiddenBefore(parseInt(rv,10)||0);
    } catch(e){}
  },[currentUser&&gid(currentUser)]);

  var t=TR[lang];


  // Server already filters leads by role/hierarchy — frontend just returns as-is
  var getVisibleLeads = function(allLeads, user, allUsers) {
    return allLeads; // server handles all filtering
  };

  // Ref flips to false after the first successful data load. Subsequent silent syncs (reconnect, manual refresh) never show the full-screen spinner.
  var isInitialLoadRef = useRef(true);
  var loadData=useCallback(async function(tok, userOverride, opts){
    var silent = opts && opts.silent;
    if (!silent && isInitialLoadRef.current) setLoading(true);
    setDataError(null);
    try {
      var results=await Promise.all([
        apiFetch("/api/leads?page="+leadsPage+"&limit=1000","GET",null,tok),
        apiFetch("/api/users","GET",null,tok),
        apiFetch("/api/activities?page="+activitiesPage+"&limit=1000","GET",null,tok),
        apiFetch("/api/tasks","GET",null,tok),
        apiFetch("/api/daily-requests","GET",null,tok).catch(function(e){ console.error("DR fetch failed:", e); return []; })
      ]);
      // Use userOverride if passed (avoids React state timing issue)
      var effectiveUser = userOverride || currentUser;
      // Restore phone2 from cache for leads that are missing it
      var leadsData = results[0].data||[];
      try {
        var cache = JSON.parse(localStorage.getItem('phone2_cache')||'{}');
        leadsData = leadsData.map(function(l){
          var id = l._id ? String(l._id) : null;
          if (id && cache[id] && !l.phone2) return Object.assign({}, l, {phone2: cache[id]});
          return l;
        });
      } catch(e) {}
      setLeads(getVisibleLeads(leadsData, effectiveUser, results[1]));
      setLeadsTotal(results[0].total || 0);
      setLeadsTotalPages(results[0].totalPages || 0);
      setUsers(results[1]);
      setActivities(results[2].data || []);
      setActivitiesTotal(results[2].total || 0);
      setActivitiesTotalPages(results[2].totalPages || 0);
      setTasks(results[3]);
      setDailyReqs(results[4] || []);
    } catch(e){setDataError(e.message);}
    setLoading(false);
    isInitialLoadRef.current = false;
    // Backfill lastFeedback for existing leads (once per browser, admin only)
    try{
      var bfKey="crm_feedback_backfilled";
      var u = userOverride || currentUser;
      var isAdminUser = u && (u.role === "admin" || u.role === "sales_admin");
      if(!localStorage.getItem(bfKey) && isAdminUser){
        apiFetch("/api/leads/backfill-feedback","GET",null,tok).then(function(){
          localStorage.setItem(bfKey,"1");
          // Reload leads to pick up backfilled data
          apiFetch("/api/leads?page=1&limit=1000","GET",null,tok).then(function(r){if(r&&r.data)setLeads(r.data);}).catch(function(e){ console.error("Leads reload after backfill failed:", e); });
        }).catch(function(e){
          console.error("Backfill-feedback fetch failed:", e);
          // Set the gate even on failure so we don't retry every page load
          localStorage.setItem(bfKey, "failed");
        });
      }
    }catch(e){}
  },[leadsPage, activitiesPage]);

  // Phase 2 Slice 3 — hydrate the projectWeights module cache once auth is
  // available, then bump rev so children re-render and read the new values.
  // Re-runs on token change (login of a different user, session restore).
  useEffect(function(){
    if (!token) return;
    fetchProjectWeights(token).then(function(){ bumpProjectWeightsRev(); });
  },[token, bumpProjectWeightsRev]);

  // Data-refresh polling intervals were removed — WebSocket listener below handles real-time updates.
  // ===== REAL-TIME WEBSOCKET SYNC (single source of truth — replaces all data-refresh polling) =====
  useEffect(function(){
    if(!token) return;
    var wsUrl = (process.env.REACT_APP_API_URL||API).replace("https://","wss://").replace("http://","ws://");
    var ws; var reconnectTimer; var retries=0; var maxRetries=20; var hasConnectedBefore=false; var cancelled=false;
    // Silent background refresh — no spinner, keeps existing state while re-fetching.
    var fetchAll = function(){
      try{ loadData(token, currentUser, {silent:true}); }catch(e){}
      try{ loadNotifications(token); }catch(e){}
    };
    var fetchNotifications = function(){ try{ loadNotifications(token); }catch(e){} };
    var fetchUsers = function(){
      apiFetch("/api/users","GET",null,token).then(function(u){ if(Array.isArray(u)) setUsers(u); }).catch(function(){});
    };
    var fetchActivitiesLatest = function(){
      apiFetch("/api/activities?page="+activitiesPage+"&limit=20","GET",null,token).then(function(r){
        if (r && r.data) setActivities(r.data);
      }).catch(function(){});
    };
    var fetchDRs = function(){
      apiFetch("/api/daily-requests","GET",null,token).then(function(d){ if(Array.isArray(d)) setDailyReqs(d); }).catch(function(){});
    };
    var fetchSingleLead = function(leadId){
      if(!leadId) return;
      apiFetch("/api/leads/"+leadId,"GET",null,token).then(function(fresh){
        if(fresh && fresh._id) setLeads(function(prev){
          var found = prev.some(function(l){return gid(l)===String(fresh._id);});
          return found ? prev.map(function(l){return gid(l)===String(fresh._id)?fresh:l;}) : [fresh].concat(prev);
        });
      }).catch(function(){});
    };
    function connect(){
      if(cancelled || retries>=maxRetries) return;
      try{ ws = new WebSocket(wsUrl); }catch(e){ return; }
      ws.onopen = function(){
        retries = 0;
        // Authenticate the socket so the server can scope per-client broadcasts
        // (sales must only receive events for leads/DRs they own).
        try { ws.send(JSON.stringify({ type: "auth", token: token })); } catch(e){}
        // On reconnect (not the first connect), only refresh lightweight notifications.
        // Lead/DR/activity/user state is kept as-is and will update via subsequent WS events.
        if (hasConnectedBefore) { try{ loadNotifications(token); }catch(e){} }
        hasConnectedBefore = true;
      };
      ws.onmessage = function(e){
        try{
          var msg = JSON.parse(e.data);
          var data = msg.data || {};
          switch(msg.type){
            case "lead_updated":
              if (data.lead && data.lead._id) {
                var lead = data.lead;
                setLeads(function(prev){
                  var hit = prev.some(function(l){return gid(l)===String(lead._id);});
                  return hit ? prev.map(function(l){return gid(l)===String(lead._id)?lead:l;}) : [lead].concat(prev);
                });
              } else if (data.leadId) {
                fetchSingleLead(String(data.leadId));
              }
              break;
            case "lead_deleted":
              if (data.leadId) setLeads(function(prev){return prev.filter(function(l){return gid(l)!==String(data.leadId);});});
              break;
            case "dr_updated":
              if (data.dr && data.dr._id) {
                var dr = data.dr;
                setDailyReqs(function(prev){
                  var hit = prev.some(function(r){return gid(r)===String(dr._id);});
                  return hit ? prev.map(function(r){return gid(r)===String(dr._id)?dr:r;}) : [dr].concat(prev);
                });
              } else {
                fetchDRs();
              }
              break;
            case "dr_deleted":
              if (data.drId) setDailyReqs(function(prev){return prev.filter(function(r){return gid(r)!==String(data.drId);});});
              break;
            case "activity_created":
              if (data.activity) setActivities(function(prev){
                if (prev.some(function(a){return gid(a)===gid(data.activity);})) return prev;
                return [data.activity].concat(prev).slice(0,50);
              });
              else fetchActivitiesLatest();
              break;
            case "user_updated":
              if (data.user && data.user._id) {
                var u = data.user;
                setUsers(function(prev){
                  var hit = prev.some(function(x){return gid(x)===String(u._id);});
                  return hit ? prev.map(function(x){return gid(x)===String(u._id)?u:x;}) : [u].concat(prev);
                });
              } else {
                fetchUsers();
              }
              break;
            case "user_deleted":
              if (data.userId) setUsers(function(prev){return prev.filter(function(x){return gid(x)!==String(data.userId);});});
              break;
            case "notification_updated":
              fetchNotifications();
              break;
            case "rotation_updated":
              if (data.leadId) fetchSingleLead(String(data.leadId));
              fetchNotifications();
              break;
            case "task_updated":
              apiFetch("/api/tasks","GET",null,token).then(function(t){ if(Array.isArray(t)) setTasks(t); }).catch(function(){});
              break;
            case "hello": break; // server greeting
            default: break;
          }
        }catch(err){}
      };
      ws.onclose = function(){
        if (cancelled) return;
        retries++;
        if (retries<maxRetries) {
          var delay = Math.min(1000*Math.pow(2,retries), 30000);
          reconnectTimer = setTimeout(connect, delay);
        }
      };
      ws.onerror = function(){ try{ws.close();}catch(e){} };
    }
    connect();
    // Tab visibility / focus: only reconnect the socket if it was silently dropped.
    // NO data re-fetch, NO loading spinner — events from the live socket keep state fresh.
    var onVis = function(){
      if (document.visibilityState!=="visible") return;
      if (!ws || ws.readyState!==1) { retries=0; connect(); }
    };
    var onFocus = function(){ if (!ws || ws.readyState!==1) { retries=0; connect(); } };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return function(){
      cancelled = true;
      clearTimeout(reconnectTimer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      if (ws) try{ws.close();}catch(e){}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load saved session on startup
  useEffect(function(){
    try {
      var saved = localStorage.getItem('crm_aro_session');
      if (saved) {
        var s = JSON.parse(saved);
        if (s.user && s.token) { setCurrentUser(s.user); setToken(s.token); if(s.csrfToken) setCsrfToken(s.csrfToken); loadData(s.token, s.user); loadNotifications(s.token); }
      }
    } catch(e) {}
  }, []);

  var handleLogin=function(user,tok,csrfTok){
    setCurrentUser(user); setToken(tok); setCsrfToken(csrfTok); loadData(tok, user); loadNotifications(tok);
    var defaultPage = user.role==="team_leader" ? "myday" : "dashboard";
    setPage(defaultPage);
    try { localStorage.setItem('crm_aro_session', JSON.stringify({user:Object.assign({},user),token:tok,csrfToken:csrfTok})); } catch(e){}
  };
  // Auto-refresh disabled

  // ===== NOTIFICATIONS SYSTEM =====
  useEffect(function(){
    if(!token||!currentUser) return;
    var isAgent = currentUser.role==="sales"||currentUser.role==="manager"||currentUser.role==="team_leader";
    if(!isAgent) return;
    var uid = String(currentUser.id||"");

    // Helper: get my leads
    var getMyLeads = function(){
      return leads.filter(function(l){
        var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");
        return aid===uid&&!l.archived;
      });
    };

    // Helper: get my DR
    var getMyDR = function(){
      return dailyReqs.filter(function(r){
        var aid=String(r.agentId&&r.agentId._id?r.agentId._id:r.agentId||"");
        return aid===uid;
      });
    };

    // 1. New lead assigned - track leads present at login time
    var initialLeadIds = new Set(getMyLeads().map(function(l){return String(gid(l));}));
    // Mark all current leads as seen so we don't notify for old ones
    getMyLeads().forEach(function(l){
      try{localStorage.setItem("crm_lead_seen_"+String(gid(l)),"1");}catch(e){}
    });

    var checkNewLeads = function(){
      var myLeads = getMyLeads();
      myLeads.forEach(function(l){
        var lid = String(gid(l));
        var key = "crm_lead_seen_"+lid;
        try{
          if(!localStorage.getItem(key)){
            localStorage.setItem(key,"1");
            showBrowserNotif("🆕 New Lead!", l.name+" has been assigned to you");
          }
        }catch(e){}
      });
    };

    // 2. Callback notifications - all statuses with callbackTime
    var checkCallbacks = function(){
      var now = Date.now();
      var allItems = getMyLeads().concat(getMyDR()).filter(function(l){return l.callbackTime&&l.status!=="DoneDeal"&&l.status!=="NotInterested";});
      allItems.forEach(function(l){
        var cbTime = new Date(l.callbackTime).getTime();
        var diff = cbTime - now;
        var key = "crm_cb_notif_"+gid(l)+"_"+l.callbackTime;
        if(diff<=0 && diff>-60*60*1000){
          try{if(!localStorage.getItem(key)){localStorage.setItem(key,"1");showBrowserNotif("📞 Callback Now!", l.name+" — "+new Date(l.callbackTime).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}));}}catch(e){}
        } else if(diff>0&&diff<=5*60*1000){
          var key5 = "crm_cb_5min_"+gid(l)+"_"+l.callbackTime;
          try{if(!localStorage.getItem(key5)){localStorage.setItem(key5,"1");showBrowserNotif("⏰ Callback in "+Math.round(diff/60000)+" min", l.name);}}catch(e){}
        } else if(diff>60*60*1000){
          try{localStorage.removeItem(key);}catch(e){}
        }
      });
    };

    // 3. Upcoming tasks (within 1 hour)
    var checkTasks = function(){
      var now = Date.now();
      var myTasks = tasks.filter(function(tk){
        var tuid=String(tk.userId&&tk.userId._id?tk.userId._id:tk.userId||"");
        return tuid===uid&&!tk.done&&tk.time;
      });
      myTasks.forEach(function(tk){
        var tTime = new Date(tk.time).getTime();
        var diff = tTime - now;
        var key = "crm_task_notif_"+tk._id;
        if(diff>0&&diff<=60*60*1000){
          try{if(!localStorage.getItem(key)){localStorage.setItem(key,"1");var lName=tk.leadId&&tk.leadId.name?tk.leadId.name:"";showBrowserNotif("✅ Task due in "+Math.round(diff/60000)+" min",tk.title+(lName?" — "+lName:""));}}catch(e){}
        } else if(diff>60*60*1000){
          try{localStorage.removeItem(key);}catch(e){}
        }
      });
    };

    // 4. Follow-up reminders — leads with no activity 2+ days
    var checkFollowUps = function(){
      var now = Date.now();
      var twoDays = 2*24*60*60*1000;
      var myLeads = getMyLeads().filter(function(l){
        return l.status!=="DoneDeal"&&l.status!=="NotInterested"&&l.status!=="EOI";
      });
      myLeads.forEach(function(l){
        var lastAct = l.lastActivityTime?new Date(l.lastActivityTime).getTime():0;
        var idle = now - lastAct;
        if(idle>=twoDays){
          var key="crm_followup_"+gid(l)+"_"+Math.floor(idle/twoDays);
          try{if(!localStorage.getItem(key)){localStorage.setItem(key,"1");showBrowserNotif("🔔 Follow-up Needed",l.name+" — no contact for "+Math.floor(idle/86400000)+" days");}}catch(e){}
        }
      });
    };

    checkCallbacks();
    checkTasks();
    checkFollowUps();
    var interval = setInterval(function(){
      checkCallbacks();
      checkTasks();
      checkNewLeads();
      checkFollowUps();
    }, 30*1000); // every 30 seconds for more accurate callback timing
    return function(){clearInterval(interval);};
  },[token, currentUser, leads, tasks]);

  // ===== DAILY REPORT NOTIFICATION (9 PM for admin) =====
  useEffect(function(){
    if(!token||!currentUser||(currentUser.role!=="admin"&&currentUser.role!=="sales_admin")) return;
    var checkDailyReport = function(){
      var now = new Date();
      var h = now.getHours(); var m = now.getMinutes();
      if(h===21&&m<2){
        var key = "crm_daily_report_"+now.toDateString();
        try{
          if(!localStorage.getItem(key)){
            localStorage.setItem(key,"1");
            // Build report from activities today
            var todayStart = new Date(); todayStart.setHours(0,0,0,0);
            var todayActs = activities.filter(function(a){return new Date(a.createdAt)>=todayStart;});
            var todayLeads = leads.filter(function(l){return l.createdAt&&new Date(l.createdAt)>=todayStart&&!l.archived;});
            var todayDeals = leads.filter(function(l){return l.updatedAt&&new Date(l.updatedAt)>=todayStart&&l.status==="DoneDeal";});
            var calls = todayActs.filter(function(a){return a.type==="call";}).length;
            showBrowserNotif(
              "📊 Daily Report — "+now.toLocaleDateString("en-GB"),
              "New Leads: "+todayLeads.length+" | Calls: "+calls+" | Deals: "+todayDeals.length
            );
          }
        }catch(e){}
      }
    };
    var rptInterval = setInterval(checkDailyReport, 60*1000);
    return function(){clearInterval(rptInterval);};
  },[token, currentUser]);

  // ===== HEARTBEAT + ACTIVITY TRACKING =====
  useEffect(function(){
    if(!token) return;
    var lastUserAction = Date.now();
    // Track user interactions
    var onAction = function(){ lastUserAction = Date.now(); };
    document.addEventListener("click", onAction);
    document.addEventListener("keydown", onAction);
    document.addEventListener("mousemove", onAction);

    var hb=function(){
      var idleMs = Date.now() - lastUserAction;
      var isActive = idleMs < 2*60*1000; // active if action within 2 min
      try{apiFetch("/api/heartbeat","POST",{isActive:isActive},token);}catch(e){}
    };
    hb();
    var interval=setInterval(hb,60*1000); // every 1 min
    return function(){
      clearInterval(interval);
      document.removeEventListener("click", onAction);
      document.removeEventListener("keydown", onAction);
      document.removeEventListener("mousemove", onAction);
    };
  },[token]);

  // Notification polling removed — the WebSocket "notification_updated" event now triggers loadNotifications in real time.

  // ===== SMART AUTO ROTATION SYSTEM =====
  useEffect(function(){
    if(!token||!leads.length||!users.length) return;

    // Rotation config (agents + durations) lives in MongoDB — see /api/settings/rotation.
    // Every cycle re-fetches so admin edits take effect across all users without reload.
    var cycleSavedIds = [];

    // Helper: server picks the next agent using the ordered rotation list + the
    // lead's full assignment history. Target selection, history-exclusion and all
    // hard stops live in the backend /auto-rotate endpoint — we just trigger it.
    var doRotate = async function(lead, reason){
      var lid = gid(lead);
      if(rotatingNow.has(lid)) return;

      // ── Frontend fast-fail guards (match the server's hard stops) ──
      var currentAgentId = lead.agentId&&lead.agentId._id?lead.agentId._id:lead.agentId;
      var curAssign = (lead.assignments||[]).find(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===String(currentAgentId);});
      if(curAssign&&curAssign.noRotation) return;
      if(lead.globalStatus==="eoi") return;
      if(lead.globalStatus==="donedeal") return;
      // Age cutoff is enforced by the backend using rotationStopAfterDays — let it decide.
      var currentAgentUser = users.find(function(u){return String(gid(u))===String(currentAgentId);});
      if(currentAgentUser&&currentAgentUser.role==="team_leader") return;

      rotatingNow.add(lid);
      try{
        var fromName = lead.agentId&&lead.agentId.name?lead.agentId.name:"Agent";
        var timeStr=new Date().toLocaleString("en-GB");
        var result = await apiFetch("/api/leads/"+lid+"/auto-rotate","POST",{ reason: "client_triggered" }, token);
        // Server returns { exhausted } / 409 when every in-list agent has already handled the lead — treat as silent stop.
        if (!result || !result.targetAgentId) return;
        var toUser = users.find(function(u){return String(gid(u))===String(result.targetAgentId);});
        var toName = toUser ? toUser.name : (result.lead && result.lead.agentId && result.lead.agentId.name ? result.lead.agentId.name : "Agent");
        await apiFetch("/api/activities","POST",{
          leadId:lid,type:"reassign",
          note:"🔄 Auto Rotation | From: "+fromName+" → To: "+toName+" | Reason: "+reason+" | "+timeStr
        },token);
        notifyRotationRef.current(lead,fromName,toName,reason);
        // Re-fetch leads from server to get correct per-agent overlay
        var fresh=await apiFetch("/api/leads?page=1&limit=1000","GET",null,token);
        if(fresh&&fresh.data) setLeads(fresh.data);
      }catch(e){
        // All backend /auto-rotate 409 keys are expected and safe to swallow —
        // they mean the backend cron, another tab, or a guard already handled the lead.
        // apiFetch throws Error(data.error), so we match on the error key string
        // (apiFetch discards the HTTP status, so we can't gate on e.status === 409).
        //   exhausted, no_rotation_order, no_agents, concurrent_rotation,
        //   rotation_stopped, rotation_disabled, rotation_paused, cooldown,
        //   not_eligible, stopped_age, locked
        // Any other rotation error (network failure, 5xx, 403, etc.) still logs.
        var msg = String(e && e.message || "");
        var silent = ["exhausted","no_rotation_order","no_agents","concurrent_rotation","rotation_stopped","stopped_age","rotation_disabled","rotation_paused","cooldown","not_eligible","locked"];
        if (!silent.some(function(k){return msg.indexOf(k)>=0;})) console.error("Rotation error:", e);
      }
      finally{ rotatingNow.delete(lid); }
    };

    var HOUR = 60*60*1000;
    var DAY  = 24*60*60*1000;

    var isRunning = false;
    var runChecks = async function(){
      if(isRunning) return;
      isRunning = true;
      try{
      // Pull the latest rotation settings from Mongo at the start of every cycle
      // — any admin change takes effect immediately for every signed-in client.
      var dur;
      var stopDaysCfg = 45;
      try{
        var s = await apiFetch("/api/settings/rotation","GET",null,token);
        // Master switch / pause gate — no rotation triggers while disabled.
        if (s && s.autoRotationEnabled === false) { isRunning=false; return; }
        if (s && s.autoRotationPausedUntil && new Date(s.autoRotationPausedUntil) > new Date()) { isRunning=false; return; }
        cycleSavedIds = Array.isArray(s&&s.reassignAgents) ? s.reassignAgents.map(String) : [];
        dur = {
          naCount:  Number(s&&s.naCount)||2,
          naHours:  Number(s&&s.naHours)||1,
          niDays:   Number(s&&s.niDays)||1,
          noActDays:Number(s&&s.noActDays)||2,
          cbDays:   Number(s&&s.cbDays)||1,
          hotDays:  Number(s&&s.hotDays)||2
        };
        stopDaysCfg = Number(s&&s.rotationStopAfterDays)||45;
      }catch(e){ isRunning=false; return; }
      var now = Date.now();
      var savedIds = cycleSavedIds;
      if(!savedIds.length){ isRunning=false; return; }
      var rotatedThisCycle = new Set();

      var salesLeads = leads.filter(function(l){
        return !l.archived && l.source!=="Daily Request";
      });
      var STOP_MS = stopDaysCfg*24*60*60*1000;

      for(var i=0;i<salesLeads.length;i++){
        var l = salesLeads[i];
        var lid = gid(l);
        if(rotatedThisCycle.has(lid)) continue;

        // ── Hard stops (mirrors backend) ──
        // 1. noRotation on current assignment
        var lAgentId = String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");
        var lCurAssign = (l.assignments||[]).find(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===lAgentId;});
        if(lCurAssign&&lCurAssign.noRotation) continue;
        // 2. globalStatus eoi
        if(l.globalStatus==="eoi") continue;
        // 3. globalStatus donedeal
        if(l.globalStatus==="donedeal") continue;
        // 4. past rotation-stop age (configurable via rotationStopAfterDays, default 45)
        if(l.createdAt&&(new Date()-new Date(l.createdAt))>STOP_MS) continue;
        // Also skip old status checks for backwards compat
        if(l.status==="DoneDeal"||l.status==="EOI") continue;
        // Skip VIP leads — pinned, never rotate
        if(l.isVIP) continue;
        // Skip locked leads
        if(l.locked) continue;
        // 5. 1h cooldown — freshly-rotated leads get a grace period.
        //    GET /api/leads doesn't overlay lastRotationAt for any role, so
        //    every browser sees the same true value here.
        if (l.lastRotationAt && (now - new Date(l.lastRotationAt).getTime()) < HOUR) continue;
        // 6. all agents exhausted — checked inside doRotate/pickAgent

        // Resolve the CURRENT agent's action clock from their assignments[]
        // slice. Top-level l.lastActivityTime is polluted by cross-agent
        // writes (admin edits, activity logs) and isn't reset on rotation, so
        // admin-view browsers saw a stale value and fired false rotations.
        // Fall back to top-level only if no slice exists (pre-assignments
        // legacy rows) — matches server-side fallback.
        var lastAct = (lCurAssign && lCurAssign.lastActionAt)
          ? new Date(lCurAssign.lastActionAt).getTime()
          : new Date(l.lastActivityTime||0).getTime();

        // ── RULE 1: NoAnswer x(naCount) → rotate after naHours ──────────
        if(l.status==="NoAnswer"){
          var naKey="crm_na_count_"+lid; var naTimeKey="crm_na_time_"+lid;
          var naCount=0; var naTime=0;
          try{naCount=Number(localStorage.getItem(naKey)||0);}catch(e){}
          try{naTime=Number(localStorage.getItem(naTimeKey)||0);}catch(e){}
          if(naCount>=dur.naCount && naTime>0 && (now-naTime)>=(dur.naHours*HOUR)){
            rotatedThisCycle.add(lid); await doRotate(l,"No Answer "+dur.naCount+" times");
            try{localStorage.removeItem(naKey);localStorage.removeItem(naTimeKey);}catch(e){}
            continue;
          }
        }

        // ── RULE 2: NotInterested → rotate after niDays ────────────────
        if(l.status==="NotInterested"){
          var niKey="crm_ni_time_"+lid; var niTime=0;
          try{niTime=Number(localStorage.getItem(niKey)||0);}catch(e){}
          if(!niTime){try{localStorage.setItem(niKey,String(lastAct));}catch(e){} continue;}
          if((now-niTime)>=(dur.niDays*DAY)){
            rotatedThisCycle.add(lid); await doRotate(l,"Not Interested — new opportunity after "+dur.niDays+" days");
            try{localStorage.removeItem(niKey);}catch(e){}
            continue;
          }
        }

        // ── RULE 3: No activity +noActDays (NewLead only — other statuses have their own rules) ──
        if(l.status==="NewLead"){
          if((now-lastAct)>=(dur.noActDays*DAY)){
            var noActKey="crm_noact2_"+lid; var noActDone=false;
            try{noActDone=localStorage.getItem(noActKey)==="1";}catch(e){}
            if(!noActDone){
              rotatedThisCycle.add(lid); await doRotate(l,"No Contact +"+dur.noActDays+" days");
              try{localStorage.setItem(noActKey,"1");}catch(e){}
              continue;
            }
          } else { try{localStorage.removeItem("crm_noact2_"+lid);}catch(e){} }
        }

        // ── RULE 4: CallBack overdue by cbDays ─────────────────────────
        if(l.status==="CallBack"&&l.callbackTime){
          var cbTime=new Date(l.callbackTime).getTime();
          if((now-cbTime)>=(dur.cbDays*DAY)){
            var cbDoneKey="crm_cbrot_"+lid; var cbDone=false;
            try{cbDone=localStorage.getItem(cbDoneKey)==="1";}catch(e){}
            if(!cbDone){
              rotatedThisCycle.add(lid); await doRotate(l,"CallBack overdue by "+dur.cbDays+" days");
              try{localStorage.setItem(cbDoneKey,"1");}catch(e){}
              continue;
            }
          } else { try{localStorage.removeItem("crm_cbrot_"+lid);}catch(e){} }
        }

        // ── RULE 5: Potential/HotCase/MeetingDone no action hotDays ────
        if(["Potential","HotCase","MeetingDone"].includes(l.status)){
          if((now-lastAct)>=(dur.hotDays*DAY)){
            var hotKey="crm_hotrot_"+lid; var hotDone=false;
            try{hotDone=localStorage.getItem(hotKey)==="1";}catch(e){}
            if(!hotDone){
              rotatedThisCycle.add(lid); await doRotate(l,l.status+" — no action "+dur.hotDays+" days");
              try{localStorage.setItem(hotKey,"1");}catch(e){}
              continue;
            }
          } else { try{localStorage.removeItem("crm_hotrot_"+lid);}catch(e){} }
        }
      }
      }finally{ isRunning=false; }
    };

    runChecks();
    var rotInterval = setInterval(runChecks, 5*60*1000);
    return function(){clearInterval(rotInterval);};
  },[token, users]);

  var handleLogout=function(){setCurrentUser(null);setToken(null);setCsrfToken(null);setLeads([]);setUsers([]);setActivities([]);setTasks([]);setPage("dashboard");setSidebarOpen(false);try{localStorage.removeItem('crm_aro_session');}catch(e){}};
  var nav=function(pg,initLead){var p2=pg||"dashboard";setPage(p2);if(initLead){setInitSelected(initLead);}else{setInitSelected(null);}try{localStorage.setItem("crm_page",p2);}catch(e){}};

  if(!currentUser) return <LoginPage t={t} onLogin={handleLogin}/>;
  if(loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#F0F2F5", fontFamily:"Cairo,sans-serif" }}><div style={{ textAlign:"center" }}><div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #E8ECF1", borderTopColor:C.accent, animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/><div style={{ color:C.textLight, fontSize:14 }}>{t.loading}</div></div></div>;
  if(dataError) return <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:16, fontFamily:"Cairo,sans-serif" }}><AlertCircle size={48} color={C.danger}/><div style={{ fontSize:16, color:C.danger, fontWeight:700 }}>{t.error}</div><div style={{ color:C.textLight }}>{dataError}</div><button onClick={function(){loadData(token);}} style={{ padding:"10px 24px", borderRadius:10, background:C.accent, border:"none", color:"#fff", fontWeight:700, cursor:"pointer" }}>{t.retry}</button></div>;

  var isAdmin=currentUser.role==="admin"||currentUser.role==="manager"||currentUser.role==="team_leader"; var isOnlyAdmin=currentUser.role==="admin"||currentUser.role==="sales_admin";
  var currentPage=page||"dashboard";
  var titles={dashboard:t.dashboard,myday:t.myDay,kpis:"KPIs",calendar:"Calls Calendar",leads:t.leads,dailyReq:t.dailyReq,deals:t.deals,eoi:"EOI",projects:t.projects,tasks:t.tasks,reports:t.reports,team:t.team,users:t.users,archive:t.archive,queue:"Assignment Queue",settings:t.settings};
  // Server already filters users by role — p.users IS the team
  var myId = String(currentUser.id||currentUser._id||"");

  // Team-leader scope (defense in depth) — backend scopes /api/users,
  // /api/leads, /api/activities, and /api/daily-requests for team_leader
  // callers, but the WS broadcaster's per-client filter is sales-only, so a
  // team_leader socket receives every lead_updated/dr_updated/activity_created
  // event in the system. Without this filter, a sales_admin saving a deal
  // for an out-of-team agent would prepend that lead into a TL's local state
  // and surface across LeadsPage, DealsPage, EOIPage, dashboards, KPIs, and
  // the Sales Team cards. tlScope is null for every other role, in which
  // case the raw arrays pass through unchanged.
  var tlScope = getTeamScopeIds(currentUser, users);
  var leadInScope = function(l){
    var aid=String(l&&l.agentId&&l.agentId._id?l.agentId._id:(l&&l.agentId)||"");
    var sid=String(l&&l.splitAgent2Id&&l.splitAgent2Id._id?l.splitAgent2Id._id:(l&&l.splitAgent2Id)||"");
    return tlScope.has(aid)||(!!sid&&tlScope.has(sid));
  };
  var scopedLeads     = tlScope ? leads.filter(leadInScope) : leads;
  var scopedUsers     = tlScope ? users.filter(function(u){return tlScope.has(String((u&&u._id)||""));}) : users;
  var scopedActivities= tlScope ? (activities||[]).filter(function(a){var auid=String(a&&a.userId&&a.userId._id?a.userId._id:(a&&a.userId)||"");return tlScope.has(auid);}) : activities;
  var scopedDailyReqs = tlScope ? (dailyReqs||[]).filter(function(r){var aid=String(r&&r.agentId&&r.agentId._id?r.agentId._id:(r&&r.agentId)||"");return tlScope.has(aid);}) : dailyReqs;
  var myTeamUsers = scopedUsers;

  var sp={t,leads:scopedLeads,setLeads,users:scopedUsers,setUsers,activities:scopedActivities,setActivities,tasks,setTasks,cu:currentUser,token,csrfToken,nav,setFilter:setLeadFilter,leadFilter,specialFilter:leadSpecialFilter,setSpecialFilter:setLeadSpecialFilter,drInitFilter:drInitFilter,setDrInitFilter:setDrInitFilter,lang,setLang,search,setSearch,isMobile,initSelected,setInitSelected,initAgentFilter,setInitAgentFilter,isOnlyAdmin,myTeamUsers,addDealNotif:addDealNotif,notifyRotation:notifyRotation,rotNotifs:rotNotifs,dailyReqs:scopedDailyReqs,bumpProjectWeightsRev:bumpProjectWeightsRev,projectWeightsRev:projectWeightsRev};

  var renderPage=function(){
    switch(currentPage){
      case "dashboard": return <DashboardPage {...sp}/>;
      case "kpis": return <KPIsPage {...sp}/>
      case "calendar": return <CallCalendarPage {...sp}/>
      case "myday_disabled": return <MyDayPage {...sp}/>;
      case "leads": return <LeadsPage {...sp} isRequest={false}/>;
      case "dailyReq": return <DailyRequestsPage {...sp}/>;
      case "deals": return <DealsPage {...sp}/>;
      case "eoi": return <EOIPage {...sp}/>;
      case "projects": return <ProjectsPage {...sp}/>;
      case "tasks": return <TasksPage {...sp}/>;
      case "reports": return (currentUser.role==="admin"||currentUser.role==="sales_admin") ? <ReportsPage {...sp}/> : <DashboardPage {...sp}/>;
      case "team": return <TeamPage {...sp}/>;
      case "users": return <UsersPage {...sp}/>;
      case "archive": return <ArchivePage {...sp}/>;
      case "settings": return (currentUser.role==="admin"||currentUser.role==="sales_admin") ? <SettingsPage {...sp} users={users}/> : <DashboardPage {...sp}/>;
      default: return <DashboardPage {...sp}/>;
    }
  };

  return <div className="crm-app" style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Cairo','Segoe UI',Tahoma,sans-serif", direction:t.dir }}>
    {/* Global base styles + mobile safety-net. Desktop behaviour is unchanged
        — every mobile rule lives inside @media (max-width: 768px). The goal
        of the mobile block is a reliable layer-of-last-resort: no page can
        horizontally scroll, every modal becomes a full-screen sheet, every
        button has a 44 px tap target, inputs use 16 px font so iOS doesn't
        auto-zoom on focus, and wide tables/cards are clamped to the
        viewport width. */}
    <style>{""
+ "* { box-sizing: border-box; margin: 0; padding: 0; }"
+ "::-webkit-scrollbar { width: 4px; height: 4px; }"
+ "::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }"
+ "input::placeholder, textarea::placeholder { color: #94A3B8; }"
+ "@keyframes spin { to { transform: rotate(360deg); } }"
+ "@media (max-width: 768px) {"
+   "html, body, #root, .crm-app { max-width: 100vw; overflow-x: hidden; }"
+   ".crm-app, .crm-app *, .crm-app *::before, .crm-app *::after { box-sizing: border-box; }"
+   /* Prevent iOS auto-zoom on focus and keep body text readable. */
+   ".crm-app input, .crm-app select, .crm-app textarea { font-size: 16px !important; }"
+   /* Touch targets: buttons need at least a 40 px tap area on phones. Icon
+      buttons and filter chips opt out with .crm-btn-xs. */
+   ".crm-app button:not(.crm-btn-xs) { min-height: 40px; }"
+   /* Modals become full-screen sheets on mobile so no content is clipped. */
+   ".crm-modal { padding: 0 !important; align-items: stretch !important; }"
+   ".crm-modal > .crm-modal-inner { width: 100vw !important; max-width: 100vw !important; min-height: 100vh !important; max-height: 100vh !important; border-radius: 0 !important; padding: 16px !important; box-sizing: border-box !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch; }"
+   /* Dashboard-specific safety net (admin + sales). */
+   ".crm-dash { width: 100% !important; max-width: 100vw !important; overflow-x: hidden !important; padding-left: 12px !important; padding-right: 12px !important; }"
+   ".crm-dash .crm-dash-card { width: 100% !important; max-width: 100% !important; min-width: 0 !important; padding: 14px !important; box-sizing: border-box !important; }"
+   ".crm-dash .crm-dash-card > * { max-width: 100%; }"
+   ".crm-dash .crm-dash-scroll { overflow-x: auto !important; overflow-y: auto !important; max-width: 100% !important; width: 100% !important; -webkit-overflow-scrolling: touch; }"
+   ".crm-dash .crm-dash-header { flex-direction: column !important; align-items: stretch !important; width: 100% !important; }"
+   ".crm-dash .crm-dash-header > * { width: 100% !important; min-width: 0 !important; }"
+   ".crm-dash .crm-dash-filters { overflow-x: visible !important; flex-wrap: wrap !important; gap: 6px !important; }"
+   ".crm-dash .crm-dash-filters > * { flex: 1 1 auto !important; min-width: 0 !important; }"
+   ".crm-dash .crm-dash-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px !important; }"
+   ".crm-dash .crm-dash-row { grid-template-columns: minmax(0, 1fr) !important; gap: 10px !important; }"
+   /* Long Arabic / English text should wrap instead of stretching a parent. */
+   ".crm-dash h1, .crm-dash h2, .crm-dash h3 { max-width: 100%; overflow-wrap: anywhere; }"
+ "}"
}</style>
    {showPwaBanner&&<div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:9999, background:C.primary, color:"#fff", padding:"14px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 -4px 20px rgba(0,0,0,0.2)" }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>📲 Enable Notifications</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", lineHeight:1.4 }}>Tap <b>Share</b> → <b>Add to Home Screen</b> to install the app and receive notifications.</div>
      </div>
      <button onClick={function(){setShowPwaBanner(false);try{localStorage.setItem("crm_pwa_dismissed","1");}catch(e){}}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, color:"#fff", padding:"6px 12px", fontSize:12, cursor:"pointer", flexShrink:0 }}>Got it</button>
    </div>}
    <Sidebar active={currentPage} setActive={setPage} t={t} cu={currentUser} onLogout={handleLogout} isMobile={isMobile} open={sidebarOpen} onClose={function(){setSidebarOpen(false);}} leads={scopedLeads}/>
    <div style={{ flex:1, marginRight:!isMobile&&t.dir==="rtl"?240:0, marginLeft:!isMobile&&t.dir==="ltr"?240:0, minHeight:"100vh", display:"flex", flexDirection:"column", minWidth:0 }}>
      <QuickPhoneSearch leads={scopedLeads} dailyReqs={scopedDailyReqs} t={t} onSelect={function(lead){setPage("leads");setInitSelected(lead);}} onSelectDR={function(req){setPage("dailyReq");setInitSelected(req);}}/>
      {!isOnline&&<div style={{ background:"#FEF3C7", color:"#B45309", padding:"8px 16px", fontSize:12, fontWeight:600, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        ⚠️ You are offline — data will not be saved until connection is restored
      </div>}
      <Header title={titles[currentPage]||""} t={t} leads={scopedLeads} lang={lang} setLang={function(l){setLang(l);try{localStorage.setItem("crm_lang",l);}catch(e){}}} showNotif={showNotif} setShowNotif={setShowNotif} search={search} setSearch={setSearch} isMobile={isMobile} onMenu={function(){setSidebarOpen(true);}} onLeadClick={function(l){nav("leads",l);}} onDRClick={function(){setPage("dailyReq");}} onDRItemClick={function(r){nav("dailyReq",r);}} onDealNotifClick={function(pg,lead){nav(pg,lead);}} onRotNotifClick={function(lead){nav("leads",lead);}} dealNotifs={dealNotifs} setDealNotifs={setDealNotifs} showDealNotif={showDealNotif} setShowDealNotif={setShowDealNotif} cu={currentUser} isAdmin={isAdmin} showRotNotif={showRotNotif} setShowRotNotif={setShowRotNotif} rotNotifs={rotNotifs.filter(function(n){return !rotHiddenBefore||new Date(n.createdAt||n.time||0).getTime()>rotHiddenBefore;})} setRotNotifs={setRotNotifs} unseenRot={rotNotifs.filter(function(n){return !n.seen&&(!rotHiddenBefore||new Date(n.createdAt||n.time||0).getTime()>rotHiddenBefore);}).length} onRotNotifSeen={function(){apiFetch("/api/notifications/mark-seen","PUT",{type:"rotation"},token).then(function(){loadNotifications(token);}).catch(function(){});}} onRotClearAll={function(){var now=Date.now();setRotHiddenBefore(now);try{var uid=gid(currentUser);if(uid)localStorage.setItem("crm_rot_hidden_"+uid,String(now));}catch(e){}apiFetch("/api/notifications/mark-seen","PUT",{type:"rotation"},token).then(function(){loadNotifications(token);}).catch(function(){});}} dailyRequests={scopedDailyReqs} myTeamUsers={myTeamUsers} unseenDeals={(function(){var items=buildDealItems(scopedLeads,scopedDailyReqs,currentUser,myTeamUsers);var cutoff=lastSeenDealAt||0;return items.filter(function(it){return new Date(it.time||0).getTime()>cutoff;}).length;})()} onDealNotifSeen={function(){var now=Date.now();setLastSeenDealAt(now);try{var uid=gid(currentUser);if(uid)localStorage.setItem("crm_deal_seen_"+uid,String(now));}catch(e){}apiFetch("/api/notifications/mark-seen","PUT",{type:"deal"},token).then(function(){loadNotifications(token);}).catch(function(){});}}/>
      <div style={{ flex:1 }}>{renderPage()}</div>
    </div>
  </div>;
}