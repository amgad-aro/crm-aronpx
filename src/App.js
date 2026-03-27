import { useState, useEffect, useCallback, useRef } from "react";

import {
  Search, Bell, Plus, Phone, Calendar, Building, Users, BarChart3,
  Settings, Home, Briefcase, Target, TrendingUp, UserPlus, CheckCircle,
  Activity, Layers, DollarSign, X, Lock, Globe, LogOut, Eye, EyeOff,
  Trash2, AlertCircle, Menu, Upload, MessageSquare, ChevronRight,
  ClipboardList, Edit, Archive, Award, Zap, RotateCcw, ExternalLink, KeyRound, FileSpreadsheet
} from "lucide-react";

/* ========== CRM ARO v7 — Complete Edition ========== */

const API = "https://crm-aro-backend-production.up.railway.app";

async function apiFetch(path, method, body, token) {
  var opts = { method: method || "GET", headers: { "Content-Type": "application/json" } };
  if (token) opts.headers["Authorization"] = "Bearer " + token;
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(API + path, opts);
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || "API Error");
  return data;
}

// ===== TRANSLATIONS =====
var TR = {
  ar: {
    dir: "rtl",
    login: "تسجيل الدخول", loginBtn: "دخول", loginError: "Username أو كلمة المرور غلط",
    username: "Username", password: "كلمة المرور", logout: "تسجيل خروج",
    dashboard: "الرئيسية", leads: "الLeads", deals: "الDeals", projects: "المشاريع",
    tasks: "المهام", reports: "التقارير", team: "فريق المبيعات", users: "Users",
    units: "الوحدات", settings: "الإعدادات", channels: "القنوات", dailyReq: "Daily Request",
    archive: "الArchive",
    search: "Search...",
    all: "الكل", totalLeads: "Total الLeads", newLeads: "جدد",
    activeDeals: "Deals نشطة", doneDeals: "تم البيع",
    addLead: "إضافة leads", addUser: "Add User", addTask: "إضافة مهمة", addRequest: "Add Number",
    name: "الاسم", phone: "الهاتف", phone2: "هاتف إضافي", email: "الإيميل", budget: "الميزانية",
    project: "المشروع", source: "المصدر", agent: "الموظف",
    status: "Status", cancel: "إلغاء", save: "حفظ", add: "إضافة", edit: "تعديل",
    callbackTime: "Callback", notes: "ملاحظات",
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
    agentPerf: "أداء الموظفين", companyName: "اسم الشركة",
    welcome: "مرحباً", myLeads: "عملائي", allLeads: "كل الLeads",
    pending: "متبقية", ago: "منذ", minutes: "دقيقة", hours: "ساعة", days: "يوم", just: "الآن",
    loading: "Loading...", error: "خطأ في الاتصال", retry: "إعادة المحاولة",
    deleteConfirm: "هل أنت متأكد؟", archiveConfirm: "أرشفة الleads؟ يمكن استعادته لاحقاً",
    logActivity: "تسجيل نشاط",
    statusComment: "سبب Change Status (مطلوب)", statusCommentPH: "اكتب ملاحظة عن هذا التغيير...",
    commentRequired: "⚠️ لازم تكتب ملاحظة قبل Change Status",
    importExcel: "استيراد Excel", importDone: "تم الاستيراد", importErr: "خطأ — تأكد من الأعمدة: name, phone",
    activityLog: "سجل الأنشطة", clientHistory: "تاريخ الleads",
    duplicateFound: "⚠️ الرقم ده موجود بالفعل!", duplicateClient: "leads موجود بنفس الرقم",
    monthlyTarget: "Monthly Target", myDay: "يومي",
    salesDay:"مبيعات Today", salesWeek:"مبيعات This Week", salesMonth:"مبيعات This Month", dealsCount:"deal", newLeadsToday:"Leads جدد Today", bestAgent:"🏆 الأفضل هذا This Month", kpiTitle:"📊 KPIs — المبيعات",
    bulkReassign: "تحويل جماعي", selectAll: "تحديد الكل", reassignTo: "تحويل لـ",
    whatsapp: "واتساب", call: "اتصال",
    propertyType: "Property Type", area: "Area",
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
    propertyType: "Property Type", area: "Area",
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
]; };

var PROJECTS = [
  "العاصمة الإدارية", "المستقبل سيتي", "التجمع الخامس", "الشروق", "6 أكتوبر",
  "بالم هيلز", "ماونتن فيو", "سوديك ايست", "الرحاب", "مدينتي"
];
var SOURCES = ["Facebook", "Instagram", "TikTok", "WhatsApp", "Google Ads", "Referral", "Walk In", "Website"];
var PROP_TYPES = ["شقة", "دوبلكس", "تاون هاوس", "فيلا", "محل تجاري", "مكتب"];


// ===== AVATAR COLORS =====
var AVATAR_COLORS = ["#6366F1","#EC4899","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EF4444","#14B8A6","#F97316","#06B6D4"];
var avatarColor = function(name){ var i=0; if(name)for(var j=0;j<name.length;j++)i+=name.charCodeAt(j); return AVATAR_COLORS[i%AVATAR_COLORS.length]; };
var Avatar = function(p){ var color=avatarColor(p.name); var size=p.size||36; return <div style={{ width:size, height:size, borderRadius:p.round?"50%":Math.round(size*0.28), background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:Math.round(size*0.38), flexShrink:0, position:"relative" }}>{p.name?(p.name[0]+( p.name.split(" ")[1]?p.name.split(" ")[1][0]:"")).toUpperCase():""}{p.online!==undefined&&<span style={{ position:"absolute", bottom:1, right:1, width:Math.round(size*0.28), height:Math.round(size*0.28), borderRadius:"50%", background:p.online?"#22C55E":"#94A3B8", border:"2px solid #fff" }}/>}</div>; };
var gid = function(o) { return o && (o._id || o.id); };
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
  return { name: g("name","الاسم","اسم الleads"), phone: g("phone","phone number","الهاتف","موبايل","رقم"), phone2: g("phone2","phone2 ","phone 2","هاتف إضافي","هاتف2","رقم2","موبايل2"), email: g("email","الإيميل"), budget: g("budget","الميزانية"), project: g("project","campaign","المشروع","الكامبين") || "", source: g("source","المصدر") || "Facebook", notes: g("notes","ملاحظات") };
};

// ===== UI COMPONENTS =====
var Badge = function(p) { return <span style={{ background: p.bg||"#F1F5F9", color: p.color||C.text, padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600, whiteSpace:"nowrap", cursor:p.onClick?"pointer":"default", border:p.dashed?"1px dashed "+(p.color||C.text):"none", display:"inline-flex", alignItems:"center", gap:4 }} onClick={p.onClick}>{p.children}</span>; };
var Card = function(p) { return <div style={Object.assign({ background:"#fff", borderRadius:14, padding:p.p!==undefined?p.p:22, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", border:"1px solid #E8ECF1" }, p.style||{})}>{p.children}</div>; };
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
  return <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.52)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:16 }} onClick={p.onClose}>
    <div style={{ background:"#fff", borderRadius:18, padding:26, width:"100%", maxWidth:p.w||500, maxHeight:"90vh", overflowY:"auto" }} onClick={function(e){e.stopPropagation();}}>
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

// Status change requires mandatory comment
var StatusModal = function(p) {
  var [comment, setComment] = useState("");
  var [cbTime, setCbTime] = useState("");
  var [dealProject, setDealProject] = useState("");
  var [dealUnitType, setDealUnitType] = useState("");
  var [dealBudget, setDealBudget] = useState("");
  var [eoiDeposit, setEoiDeposit] = useState("");
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

  useEffect(function(){
    setComment(""); setCbTime(""); setDealProject(""); setDealUnitType(""); setDealBudget(""); setEoiDeposit("");
    setPotBudget(""); setPotDeposit(""); setPotInstalment(""); setErr("");
  },[p.show]);

  var fmtNum = function(val, set){ return function(e){ var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,""); set(r?Number(r).toLocaleString():""); setErr(""); }; };

  var submit = async function() {
    if (needsComment && !cbTime)         { setErr("لازم تختار Callback"); return; }
    if (needsComment && !comment.trim()) { setErr("لازم تكتب ملاحظة"); return; }
    if (needsCb && !cbTime)              { setErr("لازم تختار موعد"); return; }
    if (isReject && !comment.trim())     { setErr("لازم تختار سبب الرفض"); return; }
    if ((isDoneDeal||isEOI) && !dealBudget.trim()){ setErr("لازم تكتب المبلغ"); return; }
    if (needsPotFields && !potBudget.trim()){ setErr("لازم تكتب الميزانية"); return; }
    if (needsPotFields && !potDeposit.trim()){ setErr("لازم تكتب المقدم"); return; }
    if (needsPotFields && !potInstalment.trim()){ setErr("لازم تكتب الأقساط"); return; }
    setSaving(true);
    var extra = (isDoneDeal||isEOI)
      ? { project: dealProject, notes: dealUnitType, budget: dealBudget, eoiDeposit: eoiDeposit }
      : needsPotFields
        ? { budget: potBudget, deposit: potDeposit, instalment: potInstalment }
        : {};
    await p.onConfirm(comment.trim(), cbTime, extra);
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
    </div>}

    {/* Potential / HotCase / MeetingDone: date + comment required */}
    {needsComment&&<div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>📅 Callback الUpcoming <span style={{color:C.danger}}>*</span></label>
      <input type="datetime-local" value={cbTime} onChange={function(e){setCbTime(e.target.value);setErr("");}} style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box" }}/>
    </div>}
    {needsComment&&<div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💬 ملاحظة <span style={{color:C.danger}}>*</span></label>
      <textarea rows={3} placeholder="اكتب ملاحظة..." value={comment} onChange={function(e){setComment(e.target.value);setErr("");}}
        style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}/>
    </div>}

    {/* Potential / HotCase: budget + deposit + instalment */}
    {needsPotFields&&<div style={{ background:"#F0F9FF", borderRadius:10, padding:"12px 14px", marginBottom:12, border:"1px solid #BAE6FD" }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#0284C7", marginBottom:10 }}>💰 البيانات المالية</div>
      <div style={{ marginBottom:9 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text, marginBottom:4 }}>Budget (EGP) <span style={{color:C.danger}}>*</span></label>
          <input type="text" placeholder="مثال: 1,000,000" value={potBudget} onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setPotBudget(r?Number(r).toLocaleString():"");setErr("");}}
            style={{ width:"100%", padding:"8px 12px", borderRadius:9, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box", direction:"ltr" }}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text, marginBottom:4 }}>Down Payment (EGP) <span style={{color:C.danger}}>*</span></label>
          <input type="text" placeholder="مثال: 500,000" value={potDeposit} onChange={fmtNum(potDeposit,setPotDeposit)}
            style={{ width:"100%", padding:"8px 12px", borderRadius:9, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box", direction:"ltr" }}/>
        </div>
        <div>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.text, marginBottom:4 }}>Installments (EGP) <span style={{color:C.danger}}>*</span></label>
          <input type="text" placeholder="مثال: 20,000" value={potInstalment} onChange={fmtNum(potInstalment,setPotInstalment)}
            style={{ width:"100%", padding:"8px 12px", borderRadius:9, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box", direction:"ltr" }}/>
        </div>
      </div>
    </div>}

    {/* CallBack / NoAnswer: optional comment */}
    {needsCb&&<div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💬 ملاحظة (اختياري)</label>
      <textarea rows={2} placeholder="اختياري..." value={comment} onChange={function(e){setComment(e.target.value);}}
        style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}/>
    </div>}

    {/* NotInterested: reason required */}
    {isReject&&<div style={{ marginBottom:12 }}>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:8, color:"#EF4444" }}>Rejection Reason <span style={{color:C.danger}}>*</span></div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {["السعر مرتفع","Area مش مناسبة","اشترى من مكان تاني","مش جاهز دلوقتي","مش مهتم خالص","سبب تاني"].map(function(r){
          return <button key={r} onClick={function(){setComment(r);setErr("");}}
            style={{ padding:"8px 12px", borderRadius:8, border:"1px solid", borderColor:comment===r?"#EF4444":"#E2E8F0",
              background:comment===r?"#FEF2F2":"#fff", color:comment===r?"#EF4444":"#64748B", fontSize:12, cursor:"pointer", textAlign:"right" }}>{r}</button>;
        })}
      </div>
    </div>}

    {/* DoneDeal / EOI: project + unit type + budget */}
    {(isDoneDeal||isEOI)&&<div>
      <div style={{ marginBottom:11 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>🏠 المشروع</label>
        <input type="text" placeholder="اسم المشروع" value={dealProject} onChange={function(e){setDealProject(e.target.value);}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box" }}/>
      </div>
      <div style={{ marginBottom:11 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>🏷️ Unit Type</label>
        <select value={dealUnitType} onChange={function(e){setDealUnitType(e.target.value);}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, background:"#fff", boxSizing:"border-box" }}>
          {["- Select -","شقة","دوبلكس","تاون هاوس","فيلا","محل تجاري","مكتب"].map(function(x){return <option key={x} value={x}>{x}</option>;})}
        </select>
      </div>
      <div style={{ marginBottom:11 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💰 المبلغ (EGP) <span style={{color:C.danger}}>*</span></label>
        <input type="text" placeholder="مثال: 1,500,000" value={dealBudget}
          onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setDealBudget(r?Number(r).toLocaleString():"");setErr("");}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", direction:"ltr" }}/>
      </div>
      {isEOI&&<div style={{ marginBottom:11 }}>
        <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💵 Deposit (EGP)</label>
        <input type="text" placeholder="مثال: 50,000" value={eoiDeposit}
          onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setEoiDeposit(r?Number(r).toLocaleString():"");}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", direction:"ltr" }}/>
      </div>}
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
    try { var data = await apiFetch("/api/login","POST",{username:user,password:pass}); p.onLogin(data.user,data.token); }
    catch(e) { setErr(t.loginError); } setLoading(false);
  };
  return <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,"+C.primaryDark+" 0%,"+C.primary+" 55%,"+C.primaryLight+" 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Cairo','Segoe UI',sans-serif", padding:16 }}>
    <div style={{ background:"#fff", borderRadius:24, padding:"40px 36px", width:"100%", maxWidth:420, boxShadow:"0 24px 64px rgba(0,0,0,0.28)" }}>
      <div style={{ textAlign:"center", marginBottom:34 }}>
        <div style={{ width:68, height:68, borderRadius:18, background:"linear-gradient(135deg,"+C.accent+","+C.accentLight+")", display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:22, color:"#fff", boxShadow:"0 8px 24px rgba(232,168,56,0.45)", marginBottom:16 }}>ARO</div>
        <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:C.text }}>ARO CRM</h1>
        <p style={{ margin:"6px 0 0", fontSize:13, color:C.textLight }}>Real Estate CRM</p>
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
var Sidebar = function(p) {
  var t = p.t; var isAdmin = p.cu.role==="admin"||p.cu.role==="manager"; var isOnlyAdmin = p.cu.role==="admin";
  var isSales = p.cu.role==="sales";
  var items = [
    {id:"dashboard",icon:Home,label:t.dashboard},
    {id:"leads",icon:Users,label:t.leads},
    {id:"dailyReq",icon:ClipboardList,label:t.dailyReq},
    {id:"deals",icon:Briefcase,label:t.deals},
    {id:"eoi",icon:Target,label:"EOI"},
    {id:"tasks",icon:CheckCircle,label:t.tasks},
    isSales&&{id:"kpis",icon:TrendingUp,label:"KPIs"},
    isSales&&{id:"calendar",icon:Calendar,label:"تقويم"},
    isAdmin&&{id:"reports",icon:BarChart3,label:t.reports},
    isAdmin&&{id:"team",icon:UserPlus,label:t.team},
    isOnlyAdmin&&{id:"users",icon:Lock,label:t.users},
    isOnlyAdmin&&{id:"archive",icon:Archive,label:t.archive},
    isOnlyAdmin&&{id:"settings",icon:Settings,label:t.settings},
  ].filter(Boolean);
  var isRTL = t.dir==="rtl";
  var st = { width:240, height:"100vh", background:"linear-gradient(180deg,"+C.primaryDark+" 0%,"+C.primary+" 100%)", display:"flex", flexDirection:"column", position:"fixed", top:0, zIndex:150, transition:"transform 0.28s ease" };
  if (isRTL) st.right=0; else st.left=0;
  if (p.isMobile&&!p.open) st.transform=isRTL?"translateX(100%)":"translateX(-100%)";
  return <>
    {p.isMobile&&p.open&&<div onClick={p.onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.48)", zIndex:140 }}/>}
    <div style={st}>
      <div style={{ padding:"18px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,0.08)", minHeight:68 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,"+C.accent+","+C.accentLight+")", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#fff", flexShrink:0, letterSpacing:"-0.5px" }}>ARO</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:"#fff", fontWeight:700, fontSize:14, display:"flex", alignItems:"center", gap:6 }}>
            <span>ARO CRM</span>
          </div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9 }}>Real Estate Platform</div>
        </div>
        {p.isMobile&&<button onClick={p.onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.6)", display:"flex" }}><X size={18}/></button>}
      </div>
      <div style={{ flex:1, padding:"8px 6px", overflowY:"auto" }}>
        {items.map(function(item){ var I=item.icon; var act=p.active===item.id;
          return <button key={item.id} onClick={function(){p.setActive(item.id);if(p.isMobile)p.onClose();}} style={{ width:"100%", display:"flex", alignItems:"center", gap:11, padding:"10px 14px", background:act?"rgba(232,168,56,0.18)":"transparent", border:"none", borderRadius:8, cursor:"pointer", color:act?C.accent:"rgba(255,255,255,0.62)", fontSize:13, fontWeight:act?600:400, marginBottom:1, textAlign:isRTL?"right":"left" }}><I size={17}/><span>{item.label}</span></button>;
        })}
      </div>
      <div style={{ padding:"14px 16px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#3B82F6,#1D4ED8)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0 }}>{p.cu.name[0]}</div>
          <div style={{ flex:1, minWidth:0 }}><div style={{ color:"#fff", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.cu.name}</div><div style={{ color:"rgba(255,255,255,0.4)", fontSize:10 }}>{p.cu.title}</div></div>
        </div>
        <button onClick={p.onLogout} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px", background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, color:"rgba(255,255,255,0.55)", fontSize:12, cursor:"pointer" }}><LogOut size={14}/> {t.logout}</button>
      </div>
    </div>
  </>;
};

// ===== HEADER =====
var Header = function(p) {
  var t = p.t; var isOnlyAdmin = p.cu&&p.cu.role==="admin";
  var upcoming = p.leads.filter(function(l){return l.callbackTime&&l.status!=="DoneDeal"&&l.status!=="NotInterested"&&!l.archived;});
  var overdueCallback = p.leads.filter(function(l){return l.status==="CallBack"&&l.callbackTime&&new Date(l.callbackTime)<new Date()&&!l.archived;});
  var noActivityLeads = p.leads.filter(function(l){return !l.archived&&l.status!=="DoneDeal"&&l.status!=="NotInterested"&&(Date.now()-new Date(l.lastActivityTime||0).getTime())>1*24*60*60*1000;});
  var noActivityDR = (p.dailyRequests||[]).filter(function(r){return !r.archived&&r.status!=="DoneDeal"&&r.status!=="NotInterested"&&(Date.now()-new Date(r.lastActivityTime||0).getTime())>1*24*60*60*1000;});
  var allNoActivity = noActivityLeads.concat(noActivityDR);
  var notifRef = useRef(null);
  var [badgeHidden, setBadgeHidden] = useState(function(){
    try{return localStorage.getItem("crm_notif_seen")==="1";}catch(e){return false;}
  });
  useEffect(function(){
    if (!p.showNotif) return;
    setBadgeHidden(true);
    try{localStorage.setItem("crm_notif_seen","1");}catch(e){}
    var fn=function(e){if(notifRef.current&&!notifRef.current.contains(e.target))p.setShowNotif(false);};
    document.addEventListener("mousedown",fn); return function(){document.removeEventListener("mousedown",fn);};
  },[p.showNotif]);
  // Close deal notif + rot notif on outside click
  useEffect(function(){
    if(!p.showDealNotif&&!p.showRotNotif) return;
    var fn=function(e){
      if(p.showDealNotif&&p.setShowDealNotif) p.setShowDealNotif(false);
      if(p.showRotNotif&&p.setShowRotNotif) p.setShowRotNotif(false);
    };
    setTimeout(function(){document.addEventListener("mousedown",fn);},0);
    return function(){document.removeEventListener("mousedown",fn);};
  },[p.showDealNotif,p.showRotNotif]);
  return <div style={{ height:64, background:"#fff", borderBottom:"1px solid #E8ECF1", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", position:"sticky", top:0, zIndex:100, gap:10 }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
      {p.isMobile&&<button onClick={p.onMenu} style={{ width:36, height:36, borderRadius:9, border:"1px solid #E8ECF1", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}><Menu size={18} color={C.text}/></button>}
      <h1 style={{ fontSize:p.isMobile?15:19, fontWeight:700, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</h1>
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
      {!p.isMobile&&<div style={{ display:"flex", alignItems:"center", gap:7, background:"#F1F5F9", borderRadius:10, padding:"7px 14px", width:260 }}>
        <Search size={14} color={C.textLight}/>
        <input placeholder={t.search} value={p.search} onChange={function(e){p.setSearch(e.target.value);}} style={{ border:"none", background:"transparent", outline:"none", fontSize:13, color:C.text, width:"100%" }}/>
      </div>}
      <button onClick={function(){p.setLang(p.lang==="ar"?"en":"ar");}} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", fontSize:12, fontWeight:600, color:C.text }}>{p.lang==="ar"?"EN":"عر"}</button>
      {/* Deal notifications bell - admin only */}
      {p.isAdmin&&<div style={{ position:"relative" }}>
        <button onClick={function(){var opening=!p.showDealNotif;p.setShowDealNotif(opening);if(opening&&p.onDealNotifSeen)p.onDealNotifSeen();}} style={{ width:36, height:36, borderRadius:9, border:"1px solid #E8ECF1", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
          <DollarSign size={16} color={p.unseenDeals>0&&!p.showDealNotif?"#15803D":C.textLight}/>
          {p.unseenDeals>0&&!p.showDealNotif&&<span style={{ position:"absolute", top:4, right:4, width:14, height:14, borderRadius:"50%", background:"#15803D", color:"#fff", fontSize:8, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{p.unseenDeals}</span>}
        </button>
        {p.showDealNotif&&<div style={{ position:"absolute", top:44, left:0, width:310, background:"#fff", borderRadius:14, boxShadow:"0 12px 48px rgba(0,0,0,0.15)", border:"1px solid #E8ECF1", zIndex:200, maxHeight:400, overflowY:"auto" }}>
          <div style={{ padding:"13px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:700, fontSize:13 }}>🎉 New Deals ({p.dealNotifs?p.dealNotifs.length:0})</span>
            <div style={{ display:"flex", gap:6 }}>
              {p.dealNotifs&&p.dealNotifs.length>0&&<button onClick={function(){p.setDealNotifs([]);}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, color:C.textLight }}>Clear All</button>}
              <button onClick={function(){p.setShowDealNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex" }}><X size={14}/></button>
            </div>
          </div>
          {(!p.dealNotifs||p.dealNotifs.length===0)&&<div style={{ padding:24, textAlign:"center", color:C.textLight, fontSize:13 }}>No new deals</div>}
          {p.dealNotifs&&p.dealNotifs.map(function(n){return <div key={n.id} style={{ padding:"12px 16px", borderBottom:"1px solid #F8FAFC" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:n.status==="DoneDeal"?"#DCFCE7":"#FFF7ED", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:16 }}>{n.status==="DoneDeal"?"🎉":"🎯"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700 }}>{n.status==="DoneDeal"?"Done Deal":"EOI"} — {n.leadName}</div>
                <div style={{ fontSize:11, color:C.textLight }}>By {n.agentName}{n.budget?" · "+n.budget+" EGP":""}</div>
                <div style={{ fontSize:10, color:C.textLight }}>{timeAgo(n.time,p.t)}</div>
              </div>
            </div>
          </div>;})}
        </div>}
      </div>}

      {/* Rotation notifications bell - admin only */}
      {p.isAdmin&&(!p.cu||p.cu.role!=="manager")&&(function(){
        var rotNotifs=[];
        try{rotNotifs=JSON.parse(localStorage.getItem("crm_rot_notifs")||"[]");}catch(e){}
        var unseenRot=0;
        try{var seen=Number(localStorage.getItem("crm_rot_seen")||"0");unseenRot=Math.max(0,rotNotifs.length-seen);}catch(e){}
        var [showRot,setShowRot]=p.rotNotifState||[false,function(){}];
        return <div style={{ position:"relative" }}>
          <button onClick={function(){
            var next=!showRot;
            if(p.setShowRotNotif)p.setShowRotNotif(next);
            if(next){try{localStorage.setItem("crm_rot_seen",String(rotNotifs.length));}catch(e){}}
          }} style={{ width:36, height:36, borderRadius:9, border:"1px solid #E8ECF1", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative", fontSize:15 }}>
            🔄
            {unseenRot>0&&!p.showRotNotif&&<span style={{ position:"absolute", top:4, right:4, width:14, height:14, borderRadius:"50%", background:C.warning, color:"#fff", fontSize:8, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{unseenRot}</span>}
          </button>
          {p.showRotNotif&&<div style={{ position:"absolute", top:44, left:0, width:320, background:"#fff", borderRadius:14, boxShadow:"0 12px 48px rgba(0,0,0,0.15)", border:"1px solid #E8ECF1", zIndex:200, maxHeight:400, overflowY:"auto" }}>
            <div style={{ padding:"13px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontWeight:700, fontSize:13 }}>🔄 Auto Rotation ({rotNotifs.length})</span>
              <div style={{ display:"flex", gap:6 }}>
                {rotNotifs.length>0&&<button onClick={function(){try{localStorage.setItem("crm_rot_notifs","[]");}catch(e){}if(p.setShowRotNotif)p.setShowRotNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, color:C.danger }}>Clear All</button>}
                <button onClick={function(){if(p.setShowRotNotif)p.setShowRotNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex" }}><X size={14}/></button>
              </div>
            </div>
            {rotNotifs.length===0&&<div style={{ padding:24, textAlign:"center", color:C.textLight, fontSize:13 }}>No rotations</div>}
            {rotNotifs.map(function(n){return <div key={n.id} style={{ padding:"11px 16px", borderBottom:"1px solid #F8FAFC" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                <span style={{ fontSize:16, flexShrink:0 }}>🔄</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700 }}>{n.leadName}</div>
                  <div style={{ fontSize:11, color:C.textLight }}>{n.fromName} ← {n.toName}</div>
                  <div style={{ fontSize:10, color:C.warning, fontWeight:600, marginTop:2 }}>{n.reason}</div>
                  <div style={{ fontSize:10, color:C.textLight }}>{timeAgo(n.time,p.t)}</div>
                </div>
              </div>
            </div>;})}
          </div>}
        </div>;
      })()}

      <div style={{ position:"relative" }} ref={notifRef}>

        <button onClick={function(){p.setShowNotif(!p.showNotif);}} style={{ width:36, height:36, borderRadius:9, border:"1px solid #E8ECF1", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
          <Bell size={16} color={C.textLight}/>
          {(upcoming.length+allNoActivity.length+overdueCallback.length)>0&&!badgeHidden&&<span style={{ position:"absolute", top:4, right:4, width:8, height:8, borderRadius:"50%", background:C.danger }}/>}
        </button>
        {p.showNotif&&<div style={{ position:"absolute", top:44, left:0, width:290, background:"#fff", borderRadius:14, boxShadow:"0 12px 48px rgba(0,0,0,0.15)", border:"1px solid #E8ECF1", zIndex:200, maxHeight:360, overflowY:"auto" }}>
          <div style={{ padding:"13px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:700, fontSize:13 }}>{t.callReminder}</span>
            <button onClick={function(){p.setShowNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex" }}><X size={14}/></button>
          </div>
          {upcoming.length===0&&allNoActivity.length===0&&overdueCallback.length===0&&<div style={{ padding:24, textAlign:"center", color:C.textLight, fontSize:13 }}>No notifications</div>}
          {overdueCallback.length>0&&<div style={{ padding:"8px 16px", background:"#FEF2F2", borderBottom:"1px solid #FECACA" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.danger, marginBottom:6 }}>📞 CallBack فات موعده</div>
            {overdueCallback.map(function(l){var agName=l.agentId&&l.agentId.name?l.agentId.name:"";return <div key={gid(l)} onClick={function(){p.onLeadClick(l);p.setShowNotif(false);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", cursor:"pointer", borderBottom:"1px solid #FEE2E2" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"#FEE2E2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>📞</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.name}</div>
                <div style={{ fontSize:10, color:C.danger }}>{agName?agName+" · ":""}{l.callbackTime?l.callbackTime.slice(0,16).replace("T"," "):""}</div>
              </div>
            </div>;})}
          </div>}
          {allNoActivity.length>0&&<div style={{ padding:"8px 16px", background:"#FFF7ED", borderBottom:"1px solid #FEF3E2" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#EA580C", marginBottom:6 }}>😴 بدون تواصل +يوم</div>
            {allNoActivity.map(function(l){var agName=l.agentId&&l.agentId.name?l.agentId.name:"";return <div key={gid(l)} onClick={function(){p.onLeadClick(l);p.setShowNotif(false);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", cursor:"pointer", borderBottom:"1px solid #FEF3E2" }}>
              <div style={{ width:28, height:28, borderRadius:7, background:"#FED7AA", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>😴</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.name}</div>
                <div style={{ fontSize:10, color:"#EA580C" }}>{agName?agName+" · ":""}{timeAgo(l.lastActivityTime,p.t)}</div>
              </div>
            </div>;})}
          </div>}
          {upcoming.map(function(l){ return <div key={gid(l)} onClick={function(){p.onLeadClick(l);p.setShowNotif(false);}} style={{ padding:"11px 16px", borderBottom:"1px solid #F8FAFC", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
            onMouseEnter={function(e){e.currentTarget.style.background="#F8FAFC";}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
            <div style={{ width:32, height:32, borderRadius:8, background:C.warning+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Phone size={14} color={C.warning}/></div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.name}</div>
              <div style={{ fontSize:11, color:C.textLight }}>{l.callbackTime?l.callbackTime.slice(0,16).replace("T"," "):""}</div>
            </div>
            <ChevronRight size={13} color={C.textLight}/>
          </div>;})}
        </div>}
      </div>
    </div>
  </div>;
};

// ===== LEAD FORM (shared for add/edit) =====
var LeadForm = function(p) {
  var t = p.t; var isAdmin = p.cu.role==="admin"||p.cu.role==="manager";
  var salesUsers = p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
  var [form, setForm] = useState(p.initial||{ name:"", phone:"", phone2:"", email:"", budget:"", project:"", source:p.isReq?"Daily Request":"Facebook", agentId:"", callbackTime:"", notes:"", status:"Potential" });
  var [dupWarning, setDupWarning] = useState(null);
  var [saving, setSaving] = useState(false);
  var isReq = p.isReq||false;

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
    if (!form.name||!form.phone) return;
    setSaving(true);
    try {
      var payload = Object.assign({}, form, { source: isReq?"Daily Request":form.source, agentId: form.agentId||"", status: p.editId ? (form.status||"Potential") : (p.initialStatus||"NewLead"), phone2: form.phone2||"" });
      var result = p.editId
        ? await apiFetch("/api/leads/"+p.editId, "PUT", payload, p.token)
        : await apiFetch("/api/leads", "POST", payload, p.token);
      if (payload.phone2) {
        result.phone2 = payload.phone2;
        // Cache phone2 in localStorage
        try {
          var cache = JSON.parse(localStorage.getItem('phone2_cache')||'{}');
          if (result._id) cache[String(result._id)] = payload.phone2;
          localStorage.setItem('phone2_cache', JSON.stringify(cache));
        } catch(e) {}
      }
      p.onSave(result);
    } catch(e) { alert(e.message); }
    setSaving(false);
  };

  return <div>
    {dupWarning&&<div style={{ marginBottom:14, padding:"10px 14px", background:"#FEF3C7", borderRadius:10, fontSize:13, fontWeight:500, color:"#B45309", display:"flex", alignItems:"center", gap:8 }}>
      <AlertCircle size={16}/> {t.duplicateFound} — <b>{dupWarning.name}</b>
    </div>}
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
      <div style={{ gridColumn:"1/-1" }}><Inp label={t.name} req value={form.name} onChange={function(e){upd("name",e.target.value);}}/></div>
      <Inp label={t.phone} req value={form.phone} onChange={function(e){upd("phone",e.target.value);checkDup(e.target.value);}} placeholder="01xxxxxxxxx"/>
      <Inp label={t.phone2} value={form.phone2||""} onChange={function(e){upd("phone2",e.target.value);}} placeholder="اختياري"/>
      <Inp label={t.email} value={form.email} onChange={function(e){upd("email",e.target.value);}}/>
      <Inp label={t.budget} value={form.budget} onChange={function(e){var raw=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");upd("budget",raw?Number(raw).toLocaleString():"");}}/>
    </div>
    <Inp label={t.project} value={form.project||""} onChange={function(e){upd("project",e.target.value);}} placeholder="اكتب اسم المشروع..."/>
    {!isReq&&<Inp label={t.source} type="select" value={form.source} onChange={function(e){upd("source",e.target.value);}} options={SOURCES.map(function(x){return{value:x,label:x};})}/>}
    {isAdmin&&<Inp label={t.agent} type="select" value={form.agentId} onChange={function(e){upd("agentId",e.target.value);}} options={[{value:"",label:"- Select -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name+" - "+u.title};}))}/>}
    <Inp label={t.callbackTime} type="datetime-local" value={form.callbackTime} onChange={function(e){upd("callbackTime",e.target.value);}}/>
    <Inp label={t.notes} type="textarea" value={form.notes} onChange={function(e){upd("notes",e.target.value);}}/>
    <div style={{ display:"flex", gap:10 }}>
      <Btn outline onClick={p.onClose} style={{ flex:1 }}>{t.cancel}</Btn>
      <Btn onClick={submit} loading={saving} style={{ flex:1 }}>{p.editId?t.save:t.add}</Btn>
    </div>
  </div>;
};



// ===== BROWSER NOTIFICATIONS =====
var requestNotifPermission = async function() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  var perm = await Notification.requestPermission();
  return perm === "granted";
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
  { id:1, label:"ترحيب", text:"أهلاً {name} 👋\nأنا {agent} من شركة ARO العقارية\nشكراً لاهتمامك بمشروع {project}\nمتى يناسبك نتكلم؟" },
  { id:2, label:"متابعة", text:"أهلاً {name}\nبتواصل معاكم بخصوص عرضنا على {project}\nهل عندك وقت نتكلم Today؟ 🏠" },
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
    "الاسم": l.name,
    "الهاتف": l.phone,
    "هاتف إضافي": l.phone2 || "",
    "الإيميل": l.email || "",
    "المشروع": l.project || "",
    "Status": l.status || "",
    "المصدر": l.source || "",
    "الميزانية": l.budget || "",
    "الموظف": getAgentName(l),
    "VIP": l.isVIP ? "نعم" : "",
    "ملاحظات": l.notes || "",
    "Callback": l.callbackTime ? l.callbackTime.slice(0,16).replace("T"," ") : "",
    "Last Activity": l.lastActivityTime ? new Date(l.lastActivityTime).toLocaleDateString("en-GB") : "",
    "تاريخ الإضافة": l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-GB") : "",
  };});
  var ws = XLSX.utils.json_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "الLeads");
  XLSX.writeFile(wb, (filename || "leads") + "_" + new Date().toISOString().slice(0,10) + ".xlsx");
};


var callbackColor = function(cbTime) {
  if (!cbTime) return null;
  var diff = new Date(cbTime).getTime() - Date.now();
  var mins = diff / 60000;
  if (mins < 0) return { bg:"#FEE2E2", color:"#DC2626", label:"⚠️ فات الموعد" };
  if (mins < 60) return { bg:"#FEF3C7", color:"#D97706", label:"🔔 خلال ساعة" };
  if (mins < 1440) return { bg:"#DCFCE7", color:"#15803D", label:"✅ Today" };
  return null;
};


// ===== QUICK PHONE SEARCH =====
var QuickPhoneSearch = function(p) {
  var [show,setShow]=useState(false);
  var [q,setQ]=useState("");
  var results=q.length>=4?p.leads.filter(function(l){
    return l.phone&&(l.phone.includes(q)||l.phone.endsWith(q));
  }):[];
  var sc=STATUSES(p.t);
  if(!show)return <button onClick={function(){setShow(true);}} style={{ position:"fixed", bottom:24, left:24, zIndex:300, width:52, height:52, borderRadius:"50%", background:"#25D366", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px rgba(37,211,102,0.5)", fontSize:22 }} title="بحث سريع بالموبايل">📞</button>;
  return <div style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={function(){setShow(false);setQ("");}}>
    <div style={{ background:"#fff", borderRadius:18, padding:20, width:340, maxWidth:"90vw", maxHeight:"80vh", overflow:"auto" }} onClick={function(e){e.stopPropagation();}}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:700 }}>📞 بحث سريع بالموبايل</div>
        <button onClick={function(){setShow(false);setQ("");}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#94A3B8" }}>✕</button>
      </div>
      <input autoFocus value={q} onChange={function(e){setQ(e.target.value);}} placeholder="اكتب آخر 4 أرقام أو الرقم كامل..." style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", direction:"ltr", marginBottom:12 }}/>
      {q.length>0&&q.length<4&&<div style={{ fontSize:12, color:"#94A3B8", textAlign:"center", marginBottom:10 }}>Type at least 4 digits</div>}
      {results.length===0&&q.length>=4&&<div style={{ fontSize:13, color:"#94A3B8", textAlign:"center", padding:20 }}>No results</div>}
      {results.map(function(l){
        var so=sc.find(function(s){return s.value===l.status;})||sc[0];
        return <div key={gid(l)} onClick={function(){p.onSelect(l);setShow(false);setQ("");}} style={{ padding:"12px 14px", borderRadius:12, border:"1px solid #E8ECF1", marginBottom:8, cursor:"pointer", background:"#FAFBFC" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontWeight:700, fontSize:14 }}>{l.name}</div>
            <span style={{ background:so.bg, color:so.color, padding:"2px 8px", borderRadius:12, fontSize:11, fontWeight:600 }}>{so.label}</span>
          </div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:4, direction:"ltr" }}>{l.phone}</div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <a href={"tel:"+l.phone} onClick={function(e){e.stopPropagation();}} style={{ flex:1, padding:"6px", borderRadius:8, background:"#DCFCE7", color:"#15803D", fontSize:12, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>📞 اتصال</a>
            <a href={"https://wa.me/2"+l.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ flex:1, padding:"6px", borderRadius:8, background:"#DCFCE7", color:"#25D366", fontSize:12, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> واتساب</a>
          </div>
        </div>;
      })}
    </div>
  </div>;
};


// Phone cell with hover reveal
var PhoneCell = function(p) {
  var [show, setShow] = useState(false);
  if (!p.phone) return <span style={{ color:"#CBD5E1" }}>-</span>;
  var masked = p.phone.slice(0,-4) + "****";
  return <span
    onMouseEnter={function(){setShow(true);}}
    onMouseLeave={function(){setShow(false);}}
    style={{ cursor:"pointer", direction:"ltr", letterSpacing:1, userSelect:show?"text":"none" }}
    title="اضغط للإظهار"
  >{show ? p.phone : masked}</span>;
};

// ===== LEADS PAGE =====
var LeadsPage = function(p) {
  var t = p.t; var sc = STATUSES(t);
  var isAdmin = p.cu.role==="admin"||p.cu.role==="manager"; var isOnlyAdmin = p.cu.role==="admin";
  var salesUsers = p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
  var isManager = p.cu.role==="manager";
  var myTeamUsers = p.myTeamUsers || salesUsers;
  var isReq = !!p.isRequest;

  // ---- State declarations (must be before filter logic) ----
  var [selected, setSelected] = useState(null);
  var [statusDrop, setStatusDrop] = useState(null);
  var [showAdd, setShowAdd] = useState(false);
  var [editLead, setEditLead] = useState(null);
  var [showStatusPicker, setShowStatusPicker] = useState(false);
  var [showStatusComment, setShowStatusComment] = useState(false);
  var [pendingStatus, setPendingStatus] = useState(null);
  var [actNote, setActNote] = useState(""); var [actType, setActType] = useState("call"); var [showActForm, setShowActForm] = useState(false);
  var [saving, setSaving] = useState(false);
  var [importing, setImporting] = useState(false); var [importMsg, setImportMsg] = useState("");
  var [selected2, setSelected2] = useState([]);
  var [showBulk, setShowBulk] = useState(false); var [bulkAgent, setBulkAgent] = useState("");
  var [showWaTemplates, setShowWaTemplates] = useState(false);
  var [waLead, setWaLead] = useState(null);
  var [showQuickAdd, setShowQuickAdd] = useState(false);
  var [showHistory, setShowHistory] = useState(false);
  var [historyLead, setHistoryLead] = useState(null);
  var [fullHistory, setFullHistory] = useState([]);
  var [historyLoading, setHistoryLoading] = useState(false);
  var [quickForm, setQuickForm] = useState({name:"",phone:"",project:PROJECTS[0],source:"Facebook"});
  var [quickSaving, setQuickSaving] = useState(false);
  var [notifGranted, setNotifGranted] = useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  var [vipFilter, setVipFilter] = useState(false);
  var [agentFilter, setAgentFilter] = useState("");
  var [sortBy, setSortBy] = useState("lastActivity");
  var fileRef = useRef(null);

  // ---- Filter logic (uses state values above) ----
  var allVisible = p.leads.filter(function(l){
    if(l.archived) return false;
    var matchSource = isReq?l.source==="Daily Request":l.source!=="Daily Request";
    if(!matchSource) return false;
    // Manager: hide leads with no agent in daily request
    if(isReq && p.cu.role==="manager" && !l.agentId) return false;
    return true;
  });
  var filtered = p.leadFilter==="all"?allVisible:allVisible.filter(function(l){return l.status===p.leadFilter;});
  filtered = filtered.filter(function(l){return matchSearch(l,p.search);});
  if (vipFilter) filtered = filtered.filter(function(l){return l.isVIP;});
  if (agentFilter) filtered = filtered.filter(function(l){ var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId; return aid===agentFilter; });
  filtered = filtered.slice().sort(function(a,b){
    if (sortBy==="lastActivity") return new Date(b.lastActivityTime||0)-new Date(a.lastActivityTime||0);
    if (sortBy==="newest") return new Date(b.createdAt||0)-new Date(a.createdAt||0);
    if (sortBy==="oldest") return new Date(a.createdAt||0)-new Date(b.createdAt||0);
    if (sortBy==="name") return a.name.localeCompare(b.name,"ar");
    return 0;
  });

  useEffect(function(){ if(p.initSelected){setSelected(p.initSelected);} },[p.initSelected]);

  var getAgentName = function(l){ if(!l.agentId)return"-"; if(l.agentId.name)return l.agentId.name; var u=p.users.find(function(x){return gid(x)===l.agentId;}); return u?u.name:"-"; };

  var reqStatus = function(lid, st) {
    if (st === "DoneDeal") {
      if (!window.confirm("⚠️ Are you sure this deal is done? This cannot be undone!")) return;
    }
    setPendingStatus({leadId:lid,newStatus:st}); setShowStatusComment(true);
  };

  var confirmStatus = async function(comment, cbTime, extra) {
    if(!pendingStatus) return;
    try {
      var upData = { status: pendingStatus.newStatus };
      if(cbTime) upData.callbackTime = cbTime;
      if(extra) {
        if(extra.budget)     upData.budget     = extra.budget;
        if(extra.project)    upData.project    = extra.project;
        if(extra.notes)      upData.notes      = extra.notes;
        if(extra.eoiDeposit) upData.eoiDeposit = extra.eoiDeposit;
        if(extra.deposit)    upData.notes      = (upData.notes?upData.notes+" | ":"")+"مقدم: "+extra.deposit+" EGP | أقساط: "+extra.instalment+" EGP";
      }
      if(pendingStatus.newStatus === "EOI") upData.eoiDate = new Date().toISOString();
      // Notify admin when DoneDeal or EOI
      if(pendingStatus.newStatus==="DoneDeal"||pendingStatus.newStatus==="EOI"){
        var notifEntry={id:Date.now(),leadName:selected?selected.name:"leads",agentName:p.cu.name,status:pendingStatus.newStatus,budget:extra&&extra.budget?extra.budget:"",time:new Date().toISOString()};
        if(p.addDealNotif) p.addDealNotif(notifEntry);
      }
      var updated = await apiFetch("/api/leads/"+pendingStatus.leadId,"PUT",upData,p.token);
      try { await apiFetch("/api/activities","POST",{leadId:pendingStatus.leadId,type:"status_change",note:"["+pendingStatus.newStatus+"] "+comment},p.token); } catch(actE){ console.error("activity log error:",actE.message); }
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===pendingStatus.leadId?updated:l;});});
      if(selected&&gid(selected)===pendingStatus.leadId) setSelected(updated);
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
    } catch(e){alert(e.message);}
    setShowStatusComment(false); setPendingStatus(null); setShowStatusPicker(false);
  };

  var openHistory = async function(lead) {
    setHistoryLead(lead); setShowHistory(true); setFullHistory([]); setHistoryLoading(true);
    var isAdmin = p.cu.role==="admin"||p.cu.role==="manager";
    try {
      if(isAdmin) {
        var hist = await apiFetch("/api/leads/"+gid(lead)+"/full-history","GET",null,p.token);
        setFullHistory(hist||[]);
      } else {
        var rotTime = lead.lastRotationAt ? new Date(lead.lastRotationAt).getTime() : 0;
        var acts = p.activities.filter(function(a){
          var lid=gid(lead); var match=a.leadId&&(gid(a.leadId)===lid||a.leadId===lid);
          return match && (!rotTime||new Date(a.createdAt).getTime()>=rotTime);
        });
        setFullHistory(acts);
      }
    } catch(e){ setFullHistory([]); }
    setHistoryLoading(false);
  };

  var archiveLead = async function(lid) {
    if(!window.confirm(t.archiveConfirm)) return;
    try {
      await apiFetch("/api/leads/"+lid+"/archive","PUT",null,p.token);
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

  var doBulkReassign = async function() {
    if(!bulkAgent||selected2.length===0) return;
    try {
      await apiFetch("/api/leads/bulk-reassign","PUT",{leadIds:selected2,agentId:bulkAgent},p.token);
      var updAgent=p.users.find(function(u){return gid(u)===bulkAgent;});
      p.setLeads(function(prev){return prev.map(function(l){return selected2.includes(gid(l))?Object.assign({},l,{agentId:updAgent||bulkAgent}):l;});});
      setSelected2([]); setShowBulk(false);
    } catch(e){alert(e.message);}
  };

  var leadActs = selected ? p.activities.filter(function(a){ var lid=gid(selected); return a.leadId&&(gid(a.leadId)===lid||a.leadId===lid); }) : [];

  return <div style={{ padding:"18px 16px 40px" }}>
    {showStatusPicker&&selected&&!showStatusComment&&<Modal show={true} onClose={function(){setShowStatusPicker(false);}} title={t.changeStatus}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        {sc.map(function(s){return <button key={s.value} onClick={function(){reqStatus(gid(selected),s.value);}} style={{ padding:"8px 14px", borderRadius:9, border:"1px solid "+s.color, background:selected.status===s.value?s.bg:"#fff", color:s.color, fontSize:13, fontWeight:600, cursor:"pointer" }}>{s.label}</button>;})}
      </div>
      <Btn outline onClick={function(){setShowStatusPicker(false);}} style={{ width:"100%" }}>{t.cancel}</Btn>
    </Modal>}
    <StatusModal show={showStatusComment} t={t} newStatus={pendingStatus?pendingStatus.newStatus:null} onClose={function(){setShowStatusComment(false);}} onConfirm={confirmStatus}/>

    {/* Bulk Reassign Modal */}
    <Modal show={showBulk} onClose={function(){setShowBulk(false);}} title={t.bulkReassign}>
      <div style={{ marginBottom:14, padding:"10px 14px", background:"#F0F9FF", borderRadius:10, fontSize:13 }}>{selected2.length} leads selected</div>
      <Inp label={t.reassignTo} type="select" value={bulkAgent} onChange={function(e){setBulkAgent(e.target.value);}} options={[{value:"",label:"- Select Agent -"}].concat((isOnlyAdmin?p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;}):myTeamUsers).map(function(u){return{value:gid(u),label:u.name+" - "+u.title};}))}/>
      <div style={{ display:"flex", gap:10 }}><Btn outline onClick={function(){setShowBulk(false);}} style={{ flex:1 }}>{t.cancel}</Btn><Btn onClick={doBulkReassign} style={{ flex:1 }}>{t.bulkReassign}</Btn></div>
    </Modal>

    {/* Toolbar */}
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, gap:10, flexWrap:"wrap" }}>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", flex:1 }}>
        {[{v:"all",l:t.all}].concat(sc.map(function(s){return{v:s.value,l:s.label};})).map(function(s){
          var cnt=s.v==="all"?allVisible.length:allVisible.filter(function(l){return l.status===s.v;}).length;
          return <button key={s.v} onClick={function(){p.setFilter(s.v);}} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid", borderColor:p.leadFilter===s.v?C.accent:"#E8ECF1", background:p.leadFilter===s.v?C.accent+"12":"#fff", color:p.leadFilter===s.v?C.accent:C.textLight, fontSize:11, fontWeight:500, cursor:"pointer" }}>{s.l} ({cnt})</button>;
        })}
      </div>
      <div style={{ display:"flex", gap:7, flexShrink:0, flexWrap:"wrap" }}>
        {selected2.length>0&&isAdmin&&<Btn outline onClick={function(){setShowBulk(true);}} style={{ padding:"7px 11px", fontSize:12, color:C.info, borderColor:C.info }}><RotateCcw size={13}/> {t.bulkReassign} ({selected2.length})</Btn>}
        {selected2.length>0&&isOnlyAdmin&&<Btn outline onClick={async function(){
          if(!window.confirm("أرشفة "+selected2.length+" leads؟"))return;
          var ids=[...selected2];
          for(var i=0;i<ids.length;i++){
            try{await apiFetch("/api/leads/"+ids[i]+"/archive","PUT",null,p.token);}catch(e){}
          }
          p.setLeads(function(prev){return prev.map(function(l){return ids.includes(gid(l))?Object.assign({},l,{archived:true}):l;});});
          setSelected2([]);
          if(selected&&ids.includes(gid(selected)))setSelected(null);
        }} style={{ padding:"7px 11px", fontSize:12, color:C.warning, borderColor:C.warning }}><Archive size={13}/> أرشفة ({selected2.length})</Btn>}
        {selected2.length>0&&<Btn outline onClick={function(){
          var selectedLeads=filtered.filter(function(l){return selected2.includes(gid(l));});
          var msg=encodeURIComponent("أهلاً، نحن من شركة ARO العقارية\nلدينا عروض مميزة على مشاريعنا\nتواصل معنا للمزيد 🏠");
          selectedLeads.forEach(function(l){window.open("https://wa.me/2"+l.phone.replace(/^0/,"")+"?text="+msg,"_blank");});
        }} style={{ padding:"7px 11px", fontSize:12, color:"#25D366", borderColor:"#25D366" }}>💬 {t.bulkWhatsApp} ({selected2.length})</Btn>}
        <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleImport} style={{ display:"none" }}/>
        {isOnlyAdmin&&<Btn outline onClick={function(){fileRef.current.click();}} loading={importing} style={{ padding:"7px 11px", fontSize:12 }}><Upload size={13}/> {t.importExcel}</Btn>}
        {isOnlyAdmin&&<Btn outline onClick={function(){exportLeadsToExcel(filtered,p.users,isReq?"daily_requests":"leads");}} style={{ padding:"7px 11px", fontSize:12, color:C.success, borderColor:C.success }}><FileSpreadsheet size={13}/> {t.exportExcel}</Btn>}
        {!notifGranted&&<Btn outline onClick={async function(){var ok=await requestNotifPermission();setNotifGranted(ok);}} style={{ padding:"7px 11px", fontSize:12, color:C.warning, borderColor:C.warning }}><Bell size={13}/> {t.enableNotif}</Btn>}
        {isOnlyAdmin&&<Btn outline onClick={function(){setShowQuickAdd(true);}} style={{ padding:"7px 11px", fontSize:12, color:C.info, borderColor:C.info }}><Zap size={13}/> {t.quickAdd}</Btn>}
        {isOnlyAdmin&&<Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><Plus size={14}/> {isReq?t.addRequest:t.addLead}</Btn>}
      </div>
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
      <select value={sortBy} onChange={function(e){setSortBy(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
        <option value="lastActivity">⏱ Last Activity</option>
        <option value="newest">🆕 الأحدث</option>
        <option value="oldest">📅 الأقدم</option>
        <option value="name">🔤 الاسم</option>
      </select>
      {isAdmin&&<select value={agentFilter} onChange={function(e){setAgentFilter(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
        <option value="">👤 All Agents</option>
        {salesUsers.map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name}</option>;})}
      </select>}
      <button onClick={function(){setVipFilter(!vipFilter);}} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid", borderColor:vipFilter?"#F59E0B":"#E8ECF1", background:vipFilter?"#FEF3C7":"#fff", color:vipFilter?"#B45309":C.textLight, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>⭐ VIP Only {vipFilter?"✓":""}</button>
    </div>
    {importMsg&&<div style={{ marginBottom:10, padding:"9px 14px", background:importMsg.startsWith("✅")?"#DCFCE7":"#FEE2E2", color:importMsg.startsWith("✅")?"#15803D":"#B91C1C", borderRadius:9, fontSize:13 }}>{importMsg}</div>}

    <div style={{ display:"flex", gap:14 }}>
      {/* Status dropdown overlay */}
      {statusDrop&&<div style={{ position:"fixed", inset:0, zIndex:499 }} onClick={function(){setStatusDrop(null);}}/>}
    {/* Table */}
      {p.isMobile&&!selected?<div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight }}>No data</div>}
        {filtered.map(function(lead){
          var lid=gid(lead); var so=sc.find(function(s){return s.value===lead.status;})||sc[0]; var isVIP=lead.isVIP;
          return <div key={lid} onClick={function(){setSelected(lead);}} style={{ background:"#fff", borderRadius:12, padding:"12px 14px", border:"1px solid #E8ECF1", borderRight:isVIP?"3px solid #F59E0B":"1px solid #E8ECF1", cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div><div style={{ fontSize:14, fontWeight:700, color:isVIP?C.accent:C.text }}>{isVIP?"⭐ ":""}{lead.name}</div><div style={{ fontSize:11, color:C.textLight, direction:"ltr", marginTop:2 }}>{lead.phone}</div></div>
              <span style={{ background:so.bg, color:so.color, padding:"3px 10px", borderRadius:12, fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{so.label}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:11, color:C.textLight }}>{lead.project||"—"}</span>
              <span style={{ fontSize:10, color:C.accent }}>{timeAgo(lead.lastActivityTime,t)}</span>
            </div>
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              <a href={"tel:"+lead.phone} onClick={function(e){e.stopPropagation();}} style={{ flex:1, padding:"6px", borderRadius:8, background:"#DCFCE7", color:"#15803D", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><Phone size={11}/> اتصال</a>
              <a href={"https://wa.me/2"+lead.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ flex:1, padding:"6px", borderRadius:8, background:"#DCFCE7", color:"#25D366", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> واتساب</a>
            </div>
          </div>;
        })}
      </div>:<Card style={{ flex:1, padding:0, overflow:"hidden", minWidth:0 }}>
        <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:p.isMobile?600:900 }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
              <th style={{ padding:"10px 8px", width:32 }}><input type="checkbox" onChange={function(e){setSelected2(e.target.checked?filtered.map(function(l){return gid(l);}):[])}}/></th>
              <th style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:100 }}>{t.name}</th>
              <th style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>{t.phone}</th>
              <th style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:110 }}>{t.phone2}</th>
              <th style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:100 }}>{t.project}</th>
              <th style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:110 }}>{t.status}</th>
              {!p.isMobile&&isAdmin&&<th style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:90 }}>{t.source}</th>}
              {isAdmin&&<th style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:100 }}>{t.agent}</th>}
              <th style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:90 }}>{t.lastActivity}</th>
              {!p.isMobile&&<th style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>{t.callbackTime}</th>}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:C.textLight, fontSize:13 }}>No data</td></tr>}
              {filtered.map(function(lead){
                var lid=gid(lead); var so=sc.find(function(s){return s.value===lead.status;})||sc[0];
                var isSel=selected&&gid(selected)===lid; var isChk=selected2.includes(lid); var isVIP=lead.isVIP;
                return <tr key={lid} onClick={function(){setSelected(lead);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSel?"#EFF6FF":isVIP?"#FFFBEB":isChk?"#F0FDF4":"transparent", transition:"background 0.12s", borderRight:isVIP?"3px solid #F59E0B":"3px solid transparent" }}>
                  <td style={{ padding:"10px 8px" }} onClick={function(e){e.stopPropagation();setSelected2(function(prev){return prev.includes(lid)?prev.filter(function(x){return x!==lid;}):[...prev,lid];});}}><input type="checkbox" checked={isChk} readOnly/></td>
                  <td style={{ padding:"10px 12px", textAlign:"right" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {lead.isVIP&&<span style={{ fontSize:14 }} title="VIP">⭐</span>}
                      <div style={{ fontSize:13, fontWeight:600, color:lead.isVIP?C.accent:C.text, whiteSpace:"nowrap" }}>{lead.name}</div>
                    </div>
                    <div style={{ fontSize:10, color:C.textLight }}>{lead.email}</div>
                  </td>
                  <td style={{ padding:"10px 12px", whiteSpace:"nowrap", textAlign:"right" }}>
                    <div style={{ fontSize:12, direction:"ltr", display:"inline-block" }}><PhoneCell phone={lead.phone}/></div>
                    <div style={{ display:"flex", gap:4, marginTop:2, justifyContent:"flex-end" }}>
                      <a href={"tel:"+lead.phone} onClick={function(e){e.stopPropagation();}} style={{ fontSize:10, color:C.success, textDecoration:"none", display:"flex", alignItems:"center", gap:2 }}><Phone size={9}/> {t.call}</a>
                      <a href={"https://wa.me/2"+lead.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ fontSize:10, color:"#25D366", textDecoration:"none", display:"flex", alignItems:"center", gap:2 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> {t.whatsapp}</a>
                    </div>
                  </td>
                  <td style={{ padding:"10px 12px", whiteSpace:"nowrap", textAlign:"right" }}>
                    <span style={{ fontSize:12, direction:"ltr", display:"inline-block" }}>{lead.phone2 ? <PhoneCell phone={lead.phone2}/> : <span style={{color:"#CBD5E1"}}>-</span>}</span>
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.textLight, textAlign:"right", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.project}</td>
                  <td style={{ padding:"10px 12px", position:"relative" }} onClick={function(e){e.stopPropagation();}}>
                    <div style={{ position:"relative", display:"inline-block" }}>
                      <span style={{ background:so.bg, color:so.color, padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:600, whiteSpace:"nowrap", border:"1px dashed "+so.color, display:"inline-flex", alignItems:"center", gap:4, cursor:"pointer" }}
                        onClick={function(e){e.stopPropagation();setStatusDrop(statusDrop===lid?null:lid);}}>
                        {so.label} ▼
                      </span>
                      {statusDrop===lid&&<div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:500, background:"#fff", borderRadius:14, padding:8, minWidth:180, boxShadow:"0 16px 48px rgba(0,0,0,0.22)", border:"1px solid #E8ECF1" }} onClick={function(e){e.stopPropagation();}}>
                        <div style={{ fontSize:12, fontWeight:600, color:C.textLight, padding:"6px 10px 10px", borderBottom:"1px solid #F1F5F9", marginBottom:4 }}>{t.changeStatus}</div>
                        {sc.map(function(s){return <div key={s.value} onClick={function(e){e.stopPropagation();setSelected(lead);reqStatus(lid,s.value);setStatusDrop(null);}} style={{ padding:"9px 12px", borderRadius:9, cursor:"pointer", display:"flex", alignItems:"center", gap:10, background:lead.status===s.value?s.bg:"transparent", fontSize:13, fontWeight:lead.status===s.value?600:400 }}
                          onMouseEnter={function(e){if(lead.status!==s.value)e.currentTarget.style.background="#F8FAFC";}}
                          onMouseLeave={function(e){if(lead.status!==s.value)e.currentTarget.style.background=lead.status===s.value?s.bg:"transparent";}}>
                          <span style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0 }}/><span style={{ color:s.color }}>{s.label}</span>
                        </div>;})}
                        <div style={{ borderTop:"1px solid #F1F5F9", marginTop:4, paddingTop:4 }}><button onClick={function(e){e.stopPropagation();setStatusDrop(null);}} style={{ width:"100%", padding:"7px", borderRadius:8, border:"none", background:"#F1F5F9", cursor:"pointer", fontSize:12, color:C.textLight }}>{t.cancel}</button></div>
                      </div>}
                    </div>
                  </td>
                  {!p.isMobile&&isAdmin&&<td style={{ padding:"10px 12px", fontSize:11, color:C.textLight, textAlign:"right", whiteSpace:"nowrap" }}>{lead.source}</td>}
                  {isAdmin&&<td style={{ padding:"10px 12px", fontSize:11, whiteSpace:"nowrap" }} onClick={function(e){e.stopPropagation();}}>
                    <select value={lead.agentId&&lead.agentId._id?lead.agentId._id:(lead.agentId||"")} onChange={async function(e){
                      var newAgent=e.target.value;
                      try{var upd=await apiFetch("/api/leads/"+gid(lead),"PUT",{agentId:newAgent,status:"NewLead",reassignedAt:new Date().toISOString()},p.token);p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(lead)?upd:l;});});if(selected&&gid(selected)===gid(lead))setSelected(upd);}catch(ex){}
                    }} style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", color:C.text, cursor:"pointer", maxWidth:110 }}>
                      <option value="">— No Agent —</option>
                      {salesUsers.map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name}</option>;})}
                    </select>
                  </td>}
                  <td style={{ padding:"10px 12px", fontSize:11, color:C.accent, textAlign:"right", whiteSpace:"nowrap" }}>{timeAgo(lead.lastActivityTime,t)}</td>
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

      {/* Side Panel */}
      {selected&&<Card style={{ flex:"0 0 295px", maxHeight:"calc(100vh - 120px)", overflowY:"auto", padding:0 }}>
        <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:"14px 16px", position:"sticky", top:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <button onClick={function(){setSelected(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><X size={11}/></button>
            <div style={{ display:"flex", gap:5 }}>
              {isOnlyAdmin&&<button onClick={function(){openHistory(selected);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }} title="تاريخ الleads">📋</button>}
              {isOnlyAdmin&&<button onClick={function(){setEditLead(selected);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }} title={t.edit}><Edit size={11}/></button>}
              {isOnlyAdmin&&<button onClick={function(){archiveLead(gid(selected));}} style={{ background:"rgba(255,165,0,0.3)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }} title={t.archive}><Archive size={11}/></button>}
            </div>
          </div>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{selected.name}</div>
          <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, marginTop:2 }}>
            {selected.phone}{selected.phone2?" / "+selected.phone2:""}
          </div>
          {/* Quick action buttons */}
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            <a href={"tel:"+selected.phone} style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(34,197,94,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><Phone size={12}/> {t.call}</a>
            <a href={"https://wa.me/2"+selected.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(37,211,102,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> {t.whatsapp}</a>
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
              var isManagerUser=p.cu.role==="manager";
              if(isManagerUser&&p.cu.teamId){var tgt=p.users.find(function(u){return gid(u)===newAgent;});if(tgt&&tgt.teamId!==p.cu.teamId)return;}
              try{var upd=await apiFetch("/api/leads/"+gid(selected),"PUT",{agentId:newAgent,status:"NewLead",reassignedAt:new Date().toISOString()},p.token);p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selected)?upd:l;});});setSelected(upd);}catch(ex){}
            }} style={{ width:"100%", padding:"6px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
              <option value="">— No Agent —</option>
              {(p.myTeamUsers||salesUsers).map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name} - {u.title}</option>;})}
            </select>
          </div>}
          {/* Details */}
          {[{l:t.budget,v:selected.budget},{l:t.source,v:isAdmin?selected.source:null},{l:t.agent,v:getAgentName(selected)},{l:t.callbackTime,v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):"-"},{l:"Last Contact",v:selected.lastActivityTime?new Date(selected.lastActivityTime).toLocaleDateString("en-GB")+" — "+timeAgo(selected.lastActivityTime,t):"-"},{l:"تاريخ الإضافة",v:isOnlyAdmin?selected.createdAt?new Date(selected.createdAt).toLocaleDateString("en-GB"):"-":null},{l:t.notes,v:selected.notes}].map(function(f){
            return f.v?<div key={f.l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F1F5F9", gap:8 }}><span style={{ fontSize:11, color:C.textLight, flexShrink:0 }}>{f.l}</span><span style={{ fontSize:11, fontWeight:500, textAlign:"right", wordBreak:"break-word" }}>{f.v}</span></div>:null;
          })}
          {/* WhatsApp Templates */}
          <div style={{ marginTop:10, display:"flex", gap:6 }}>
            <button onClick={function(){setWaLead(selected);setShowWaTemplates(true);}} style={{ flex:1, padding:"7px 8px", borderRadius:9, border:"1px solid #25D366", background:"#25D36610", color:"#25D366", fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>💬 {t.waTemplates}</button>
            <button onClick={async function(){
              try{var newVip=!selected.isVIP;var upd=await apiFetch("/api/leads/"+gid(selected),"PUT",{isVIP:newVip},p.token);var merged=Object.assign({},selected,{isVIP:newVip});p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selected)?Object.assign({},l,{isVIP:newVip}):l;});});setSelected(merged);}catch(e){console.error("VIP error",e);}
            }} style={{ padding:"7px 10px", borderRadius:9, border:"1px solid "+(selected.isVIP?"#F59E0B":"#E2E8F0"), background:selected.isVIP?"#FEF3C7":"#fff", fontSize:13, cursor:"pointer" }} title={selected.isVIP?t.removeVip:t.markVip}>⭐</button>
          </div>
          {/* Log Activity */}
          <div style={{ marginTop:10 }}>
            <button onClick={function(){setShowActForm(!showActForm);}} style={{ width:"100%", padding:"8px", borderRadius:9, border:"1px dashed "+C.accent, background:C.accent+"08", color:C.accent, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><MessageSquare size={12}/> {t.logActivity}</button>
            {showActForm&&<div style={{ marginTop:9, padding:10, background:"#F8FAFC", borderRadius:10 }}>
              <select value={actType} onChange={function(e){setActType(e.target.value);}} style={{ width:"100%", padding:"6px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, marginBottom:7, background:"#fff" }}>
                <option value="call">📞 مكالمة</option>
                <option value="meeting">🤝 اجتماع</option>
                <option value="followup">🔔 متابعة</option>
                <option value="note">📝 ملاحظة</option>
              </select>
              <textarea rows={2} placeholder={t.statusCommentPH} value={actNote} onChange={function(e){setActNote(e.target.value);}} style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, boxSizing:"border-box", resize:"none", fontFamily:"inherit" }}/>
              <div style={{ display:"flex", gap:6, marginTop:6 }}>
                <Btn onClick={logActivity} loading={saving} style={{ flex:1, padding:"6px", fontSize:11 }}>{t.save}</Btn>
                <Btn outline onClick={function(){setShowActForm(false);setActNote("");}} style={{ flex:1, padding:"6px", fontSize:11 }}>{t.cancel}</Btn>
              </div>
            </div>}
          </div>
          {/* Activity Log */}
          {(function(){
            var cuRole=p.cu.role;
            var isOnlyAdminH=cuRole==="admin";
            // Admin: sees all history
            // Manager: sees only activities after last reassign (reassignedAt)
            // Sales: sees only activities after last reassign (reassignedAt)
            var visibleActs=leadActs;
            if(!isOnlyAdminH && selected){
              var cutoffTime = 0;
              if(selected.reassignedAt){
                cutoffTime = new Date(selected.reassignedAt).getTime();
              } else if(selected.lastRotationAt){
                cutoffTime = new Date(selected.lastRotationAt).getTime();
              } else {
                // No reassign date: show only activities by current agent
                var curAgentId = selected.agentId && selected.agentId._id
                  ? String(selected.agentId._id)
                  : String(selected.agentId||"");
                visibleActs = leadActs.filter(function(a){
                  var auid = a.userId && a.userId._id ? String(a.userId._id) : String(a.userId||"");
                  return auid === curAgentId || auid === String(p.cu.id||"");
                });
              }
              if(cutoffTime>0){
                visibleActs=leadActs.filter(function(a){return new Date(a.createdAt).getTime()>=cutoffTime;});
              }
            }
            // sort by createdAt ascending then reverse = newest first
            var displayActs = visibleActs.slice().sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);}).reverse();
            if(displayActs.length===0&&!isOnlyAdminH) return null;
            return <div style={{ marginTop:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:11, color:C.textLight, fontWeight:600 }}>{t.clientHistory}</span>
                {isOnlyAdminH&&selected&&(selected.rotationCount||0)>0&&<span style={{ fontSize:9, background:"#FEF3C7", color:"#B45309", padding:"2px 6px", borderRadius:6, fontWeight:600 }}>🔄 {selected.rotationCount} تحويل</span>}
              </div>
              {displayActs.map(function(a,i){var uname=a.userId&&a.userId.name?a.userId.name:"";return <div key={a._id||i} style={{ fontSize:10, padding:"8px 0", borderBottom:"1px solid #F8FAFC" }}>
                <div style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                  <span style={{ flexShrink:0 }}>{a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":a.type==="reassign"?"↩️":a.type==="note"?"📝":"🔔"}</span>
                  <span style={{ flex:1 }}>{a.note}</span>
                  <span style={{ color:C.textLight, flexShrink:0 }}>{timeAgo(a.createdAt,t)}</span>
                </div>
                {uname&&<div style={{ fontSize:9, color:C.textLight, marginTop:2 }}>{uname} · {new Date(a.createdAt).toLocaleDateString("en-GB")}</div>}
              </div>;})}
            </div>;
          })()}
        </div>
      </Card>}
    </div>

    {/* Full History Modal */}
    {showHistory&&historyLead&&<Modal show={true} onClose={function(){setShowHistory(false);setHistoryLead(null);}} title={"📋 تاريخ الleads — "+historyLead.name} w={520}>
      {historyLoading&&<div style={{ textAlign:"center", padding:30, color:C.textLight }}>Loading...</div>}
      {!historyLoading&&fullHistory.length===0&&<div style={{ textAlign:"center", padding:30, color:C.textLight }}>No activity history</div>}
      {!historyLoading&&fullHistory.length>0&&<div style={{ maxHeight:400, overflowY:"auto" }}>
        {fullHistory.slice().reverse().map(function(a,i){
          var uname=a.userId&&a.userId.name?a.userId.name:"";
          return <div key={a._id||i} style={{ padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":a.type==="reassign"?"↩️":a.type==="note"?"📝":"🔔"}</span>
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

    {/* WhatsApp Templates Modal */}
    {showWaTemplates&&waLead&&<Modal show={true} onClose={function(){setShowWaTemplates(false);setWaLead(null);}} title={"💬 رسائل واتساب — "+waLead.name}>
      <div style={{ marginBottom:14, padding:"10px 14px", background:"#F0FDF4", borderRadius:10, fontSize:12, color:"#15803D", display:"flex", alignItems:"center", gap:8 }}>
        <Phone size={14}/> {waLead.phone}{waLead.phone2?" / "+waLead.phone2:""}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {WA_TEMPLATES_AR.map(function(tmpl){
          var agentName=p.cu.name;
          var msg=fillTemplate(tmpl.text,waLead,agentName);
          var waUrl="https://wa.me/2"+waLead.phone.replace(/^0/,"")+"?text="+encodeURIComponent(msg);
          return <div key={tmpl.id} style={{ border:"1px solid #E8ECF1", borderRadius:12, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, marginBottom:6, color:C.text }}>{tmpl.label}</div>
            <div style={{ fontSize:11, color:C.textLight, marginBottom:10, lineHeight:1.6, whiteSpace:"pre-line" }}>{msg}</div>
            <div style={{ display:"flex", gap:8 }}>
              <a href={waUrl} target="_blank" rel="noreferrer" style={{ flex:1, padding:"8px", borderRadius:8, background:"#25D366", color:"#fff", fontSize:12, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>💬 إرسال</a>
              <button onClick={function(){navigator.clipboard.writeText(msg);}} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #E2E8F0", background:"#fff", fontSize:12, cursor:"pointer", color:C.textLight }}>📋 نسخ</button>
            </div>
          </div>;
        })}
      </div>
    </Modal>}

    {/* Quick Add Modal */}
    <Modal show={showQuickAdd} onClose={function(){setShowQuickAdd(false);}} title={"⚡ "+t.quickAdd} w={360}>
      <Inp label={t.name} req value={quickForm.name} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{name:e.target.value});});}}/>
      <Inp label={t.phone} req value={quickForm.phone} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{phone:e.target.value});});}} placeholder="01xxxxxxxxx"/>
      <Inp label={t.project} value={quickForm.project||""} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{project:e.target.value});});}} placeholder="اكتب اسم المشروع..."/>
      <Inp label={t.source} type="select" value={quickForm.source} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{source:e.target.value});});}} options={SOURCES.map(function(x){return{value:x,label:x};})}/>
      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setShowQuickAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn>
        <Btn loading={quickSaving} onClick={async function(){
          if(!quickForm.name||!quickForm.phone)return;
          setQuickSaving(true);
          try{
            var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
            var lead=await apiFetch("/api/leads","POST",Object.assign({},quickForm,{agentId:quickForm.agentId||""}),p.token);
            p.setLeads(function(prev){return [lead].concat(prev);});
            setShowQuickAdd(false);
            setQuickForm({name:"",phone:"",project:PROJECTS[0],source:"Facebook"});
            showBrowserNotif("✅ تم إضافة leads",lead.name+" — "+lead.phone);
          }catch(e){alert(e.message);}
          setQuickSaving(false);
        }} style={{ flex:2 }}>⚡ {t.quickAdd}</Btn>
      </div>
    </Modal>

    {/* Add Modal */}
    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={isReq?t.addRequest:t.addLead}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={isReq} onClose={function(){setShowAdd(false);}} onSave={function(lead){p.setLeads(function(prev){return [lead].concat(prev);});setShowAdd(false);}}/>
    </Modal>
    {/* Edit Modal */}
    {editLead&&<Modal show={true} onClose={function(){setEditLead(null);}} title={t.edit}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={isReq} editId={gid(editLead)} initial={editLead} onClose={function(){setEditLead(null);}} onSave={function(updated){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(updated)?updated:l;});});setSelected(updated);setEditLead(null);}}/>
    </Modal>}
  </div>;
};

// ===== MY DAY PAGE =====
var MyDayPage = function(p) {
  var t = p.t; var sc = STATUSES(t);
  var isManager = p.cu.role==="manager";
  var getAgName = function(l){ if(!l.agentId) return ""; var a=l.agentId; if(a.name) return a.name; var u=p.users.find(function(x){return String(gid(x))===String(a);}); return u?u.name:""; };
  var [activeTab, setActiveTab] = useState("callbacks");
  var myLeads = p.leads.filter(function(l){
    if(l.archived) return false;
    var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;
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
    {id:"noact", label:"⚠️ بدون تواصل", count:noActivity.length, danger:noActivity.length>0},
    {id:"tasks", label:"✅ المهام", count:myTasks.length, danger:false},
    {id:"activity", label:"📊 نشاطي", count:todayActs.length, danger:false},
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
      <div style={{ fontSize:12, color:C.textLight }}>{new Date().toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
    </div>

    {/* Summary cards */}
    <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
      {[
        {label:"عملائي",v:myLeads.length,c:"#3B82F6",bg:"#EFF6FF",icon:"👥"},
        {label:"Today's Calls",v:todayActs.filter(function(a){return a.type==="call";}).length,c:"#10B981",bg:"#F0FDF4",icon:"📞"},
        {label:"Overdue",v:overdue.length,c:overdue.length>0?"#EF4444":"#94A3B8",bg:overdue.length>0?"#FEF2F2":"#F8FAFC",icon:"⚠️"},
        {label:"مهام",v:myTasks.length,c:"#8B5CF6",bg:"#F5F3FF",icon:"✅"},
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
        <div style={{ fontSize:11, fontWeight:700, color:"#EF4444", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}><AlertCircle size={12}/> فات موعدها ({overdue.length})</div>
        {overdue.map(function(l){var so=sc.find(function(s){return s.value===l.status;})||sc[0];
          return <div key={gid(l)} onClick={function(){p.nav("leads",true);p.setInitSelected(l);}} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FECACA", marginBottom:6, cursor:"pointer" }}>
            <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:C.text }}>{l.name}{isManager&&getAgName(l)?<span style={{ fontSize:10, color:"#8B5CF6", marginRight:6, fontWeight:400 }}>({getAgName(l)})</span>:null}</div><div style={{ fontSize:10, color:"#EF4444", fontWeight:600 }}>{l.callbackTime?l.callbackTime.slice(0,16).replace("T"," "):""}</div></div>
            <div style={{ display:"flex", gap:5 }}>
              <a href={"tel:"+l.phone} onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:C.success, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}><Phone size={13} color="#fff"/></a>
              <a href={"https://wa.me/2"+l.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:14 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
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
              <a href={"tel:"+l.phone} onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:C.success, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}><Phone size={13} color="#fff"/></a>
              <a href={"https://wa.me/2"+l.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:14 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
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
          <a href={"tel:"+l.phone} onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:C.success, display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}><Phone size={13} color="#fff"/></a>
          <a href={"https://wa.me/2"+l.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ width:30, height:30, borderRadius:8, background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:14 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
        </div>
      </div>;})}
    </div>}

    {activeTab==="tasks"&&<div>
      {myTasks.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight, fontSize:13 }}>✅ مفيش مهام</div>}
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
var DashboardPage = function(p) {
  var t = p.t; var sc = STATUSES(t);
  var isAdmin = p.cu.role==="admin"||p.cu.role==="manager"; var isOnlyAdmin = p.cu.role==="admin";
  var normalLeads = p.leads.filter(function(l){return !l.archived&&l.source!=="Daily Request";});
  var myLeads = isAdmin?normalLeads:normalLeads.filter(function(l){var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return aid===p.cu.id;});
  var parseBudget=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var now=Date.now();
  var DAY=86400000; var WEEK=7*DAY; var MONTH=30*DAY;
  var allDeals=normalLeads.filter(function(l){return l.status==="DoneDeal";});
  var todayDeals=allDeals.filter(function(l){return l.updatedAt&&(now-new Date(l.updatedAt).getTime())<DAY;});
  var weekDeals=allDeals.filter(function(l){return l.updatedAt&&(now-new Date(l.updatedAt).getTime())<WEEK;});
  var monthDeals=allDeals.filter(function(l){return l.updatedAt&&(now-new Date(l.updatedAt).getTime())<MONTH;});
  var todayRev=todayDeals.reduce(function(s,d){return s+parseBudget(d.budget);},0);
  var weekRev=weekDeals.reduce(function(s,d){return s+parseBudget(d.budget);},0);
  var monthRev=monthDeals.reduce(function(s,d){return s+parseBudget(d.budget);},0);
  var todayLeads=normalLeads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt).getTime())<DAY;});
  var salesUsers=p.myTeamUsers||p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
  var topAgent=isAdmin?(function(){
    var stats=salesUsers.map(function(u){var uid=gid(u);var rev=monthDeals.filter(function(d){var a=d.agentId&&d.agentId._id?d.agentId._id:d.agentId;return a===uid;}).reduce(function(s,d){return s+parseBudget(d.budget);},0);return{u:u,rev:rev};});
    stats.sort(function(a,b){return b.rev-a.rev;});
    return stats[0]&&stats[0].rev>0?stats[0]:null;
  })():null;

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ fontSize:14, color:C.textLight, marginBottom:18 }}>{t.welcome}, <b style={{ color:C.text }}>{p.cu.name}</b> 👋</div>

    {/* Admin KPI Section */}
    {isAdmin&&<div style={{ marginBottom:22 }}>
      <div style={{ fontSize:12, fontWeight:700, color:C.textLight, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>{t.kpiTitle}</div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
        <div style={{ flex:"1 1 150px", background:"linear-gradient(135deg,#0EA5E9,#0284C7)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
          <div style={{ fontSize:11, opacity:0.8, marginBottom:6 }}>{t.salesDay}</div>
          <div style={{ fontSize:22, fontWeight:800 }}>{todayRev>0?(todayRev/1000000).toFixed(2)+"M":"—"}</div>
          <div style={{ fontSize:11, opacity:0.7, marginTop:4 }}>{todayDeals.length} {t.dealsCount}</div>
        </div>
        <div style={{ flex:"1 1 150px", background:"linear-gradient(135deg,#8B5CF6,#7C3AED)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
          <div style={{ fontSize:11, opacity:0.8, marginBottom:6 }}>{t.salesWeek}</div>
          <div style={{ fontSize:22, fontWeight:800 }}>{weekRev>0?(weekRev/1000000).toFixed(2)+"M":"—"}</div>
          <div style={{ fontSize:11, opacity:0.7, marginTop:4 }}>{weekDeals.length} {t.dealsCount}</div>
        </div>
        <div style={{ flex:"1 1 150px", background:"linear-gradient(135deg,#10B981,#059669)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
          <div style={{ fontSize:11, opacity:0.8, marginBottom:6 }}>{t.salesMonth}</div>
          <div style={{ fontSize:22, fontWeight:800 }}>{monthRev>0?(monthRev/1000000).toFixed(2)+"M":"—"}</div>
          <div style={{ fontSize:11, opacity:0.7, marginTop:4 }}>{monthDeals.length} {t.dealsCount}</div>
        </div>
        <div style={{ flex:"1 1 150px", background:"linear-gradient(135deg,#F59E0B,#D97706)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
          <div style={{ fontSize:11, opacity:0.8, marginBottom:6 }}>{t.newLeadsToday}</div>
          <div style={{ fontSize:22, fontWeight:800 }}>{todayLeads.length}</div>
          <div style={{ fontSize:11, opacity:0.7, marginTop:4 }}>{normalLeads.length} {t.totalLeads}</div>
        </div>
        {topAgent&&<div style={{ flex:"1 1 150px", background:"linear-gradient(135deg,#EC4899,#DB2777)", borderRadius:14, padding:"16px 18px", color:"#fff" }}>
          <div style={{ fontSize:11, opacity:0.8, marginBottom:6 }}>{t.bestAgent}</div>
          <div style={{ fontSize:16, fontWeight:800 }}>{topAgent.u.name}</div>
          <div style={{ fontSize:12, opacity:0.85, marginTop:4 }}>{(topAgent.rev/1000000).toFixed(2)}M EGP</div>
        </div>}
      </div>
    </div>}

    {/* Sales colorful cards */}
    {!isAdmin&&(function(){
      var uid=String(p.cu.id);
      var myU=p.users.find(function(u){return String(gid(u))===uid;})||{};
      var qt=(myU.qTargets&&Object.keys(myU.qTargets).length>0)?myU.qTargets:(function(){try{return JSON.parse(localStorage.getItem("crm_qt_"+uid)||"{}");}catch(e){return {};}})();
      var curQ=(function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
      var qTarget=qt[curQ]||0;
      var myDeals=myLeads.filter(function(l){return l.status==="DoneDeal";});
      var getQ=function(d){var m=new Date(d).getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";};
      var qRev=myDeals.filter(function(d){var dd=d.updatedAt||d.createdAt;return dd&&getQ(dd)===curQ;}).reduce(function(s,d){return s+parseBudget(d.budget);},0);
      var qProg=qTarget>0?Math.min(100,Math.round(qRev/qTarget*100)):0;
      var callbackSoon=myLeads.filter(function(l){return l.callbackTime&&!l.archived&&(new Date(l.callbackTime).getTime()-Date.now())<2*60*60*1000&&new Date(l.callbackTime).getTime()>Date.now();});
      var noAct=myLeads.filter(function(l){return !l.archived&&l.status!=="DoneDeal"&&l.status!=="NotInterested"&&(Date.now()-new Date(l.lastActivityTime||0).getTime())>2*DAY;});
      var todayCallsCount=p.activities.filter(function(a){var auid=a.userId&&a.userId._id?a.userId._id:a.userId;return String(auid)===uid&&a.type==="call"&&a.createdAt&&(Date.now()-new Date(a.createdAt).getTime())<DAY;}).length;
      var cards=[
        {label:p.lang==="en"?"My Leads":"عملائي",value:myLeads.length+"",bg:"linear-gradient(135deg,#3B82F6,#1D4ED8)",icon:"👥",onClick:function(){p.nav("leads");}},
        {label:p.lang==="en"?"Today's Calls":"Today's Calls",value:todayCallsCount+"",bg:"linear-gradient(135deg,#10B981,#059669)",icon:"📞",onClick:function(){p.nav("myday");}},
        {label:p.lang==="en"?"CallBack Soon":"CallBack قريب",value:callbackSoon.length+"",bg:"linear-gradient(135deg,#F59E0B,#D97706)",icon:"🔔",onClick:function(){p.nav("leads");p.setFilter("CallBack");}},
        {label:p.lang==="en"?"No Contact":"بدون تواصل",value:noAct.length+"",bg:"linear-gradient(135deg,#EF4444,#DC2626)",icon:"⚠️",onClick:function(){p.nav("leads");}},
        {label:p.lang==="en"?"My Deals":"My Deals",value:myDeals.length+"",bg:"linear-gradient(135deg,#8B5CF6,#7C3AED)",icon:"🏆",onClick:function(){p.nav("deals");}},
      ];
      return <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.textLight, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>{p.lang==="en"?"OVERVIEW":"نظرة عامة"}</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
          {cards.map(function(card){return <div key={card.label} onClick={card.onClick} style={{ flex:"1 1 130px", background:card.bg, borderRadius:14, padding:"16px 18px", color:"#fff", cursor:"pointer", transition:"transform 0.15s,box-shadow 0.15s" }}
            onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.2)";}}
            onMouseLeave={function(e){e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
            <div style={{ fontSize:20, marginBottom:6 }}>{card.icon}</div>
            <div style={{ fontSize:22, fontWeight:800 }}>{card.value}</div>
            <div style={{ fontSize:11, opacity:0.85, marginTop:4 }}>{card.label}</div>
          </div>;})}
          <div onClick={function(){p.nav("kpis");}} style={{ flex:"1 1 130px", background:"linear-gradient(135deg,#EC4899,#DB2777)", borderRadius:14, padding:"16px 18px", color:"#fff", cursor:"pointer", transition:"transform 0.15s" }}
            onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={function(e){e.currentTarget.style.transform="none";}}>
            <div style={{ fontSize:20, marginBottom:6 }}>🎯</div>
            <div style={{ fontSize:18, fontWeight:800 }}>{qProg}%</div>
            <div style={{ fontSize:11, opacity:0.85, marginTop:2 }}>{curQ} Target</div>
            <div style={{ height:4, background:"rgba(255,255,255,0.3)", borderRadius:2, marginTop:6 }}><div style={{ height:"100%", width:qProg+"%", background:"#fff", borderRadius:2 }}/></div>
          </div>
        </div>
      </div>;
    })()}

    {/* Regular stats - admin only */}
    {isAdmin&&<div style={{ display:"flex", gap:10, marginBottom:22, flexWrap:"wrap" }}>
      <StatCard icon={Users} label={isAdmin?t.allLeads:t.myLeads} value={myLeads.length+""} c={C.info} onClick={function(){p.nav("leads");}}/>
      <StatCard icon={Target} label={t.newLeads} value={myLeads.filter(function(l){return l.status==="Potential";}).length+""} c={C.success} onClick={function(){p.nav("leads");p.setFilter("Potential");}}/>
      <StatCard icon={Briefcase} label={t.activeDeals} value={myLeads.filter(function(l){return["HotCase","CallBack","MeetingDone"].includes(l.status);}).length+""} c={C.accent} onClick={function(){p.nav("leads");p.setFilter("HotCase");}}/>
      <StatCard icon={DollarSign} label={t.doneDeals} value={myLeads.filter(function(l){return l.status==="DoneDeal";}).length+""} c={C.primary} onClick={function(){p.nav("deals");}}/>
      {(function(){var rots=[];try{rots=JSON.parse(localStorage.getItem("crm_rot_notifs")||"[]");}catch(e){}var todayRots=rots.filter(function(r){return r.time&&(Date.now()-new Date(r.time).getTime())<24*60*60*1000;});return todayRots.length>0?<StatCard icon={RotateCcw} label="تحويلات Today" value={todayRots.length+""} c={C.warning}/>:null;})()}
    </div>}

    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
      <Card style={{ flex:2, minWidth:250 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>{t.leadsByStatus}</h3>
        {sc.map(function(s){ var cnt=myLeads.filter(function(l){return l.status===s.value;}).length; var pct=myLeads.length>0?Math.round(cnt/myLeads.length*100):0;
          return <div key={s.value} style={{ marginBottom:10, cursor:"pointer" }} onClick={function(){p.nav("leads");p.setFilter(s.value);}}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:12 }}>{s.label}</span><span style={{ fontSize:12, color:C.textLight, fontWeight:600 }}>{cnt}</span></div>
            <div style={{ height:5, background:"#F1F5F9", borderRadius:3 }}><div style={{ height:"100%", width:pct+"%", background:s.color, borderRadius:3, transition:"width 0.6s" }}/></div>
          </div>;
        })}
      </Card>
      <Card style={{ flex:1, minWidth:230 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>{t.todayActivities}</h3>
        {p.activities.length===0&&<div style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"20px 0" }}>No activity</div>}
        {p.activities.slice(0,8).map(function(a){
          var lId=a.leadId?(gid(a.leadId)):null; var lName=a.leadId&&a.leadId.name?a.leadId.name:""; var uName=a.userId&&a.userId.name?a.userId.name:"";
          var ml=lId?p.leads.find(function(l){return gid(l)===lId;}):null;
          return <div key={a._id||a.id} onClick={function(){if(ml){p.setInitSelected(ml);p.nav("leads");}}} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:"1px solid #F8FAFC", cursor:ml?"pointer":"default", borderRadius:4 }}
            onMouseEnter={function(e){if(ml)e.currentTarget.style.background="#F8FAFC";}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
            <div style={{ width:26, height:26, borderRadius:7, background:(a.type==="call"?C.success:a.type==="status_change"?C.warning:C.info)+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {a.type==="call"?<Phone size={11} color={C.success}/>:a.type==="meeting"?<Calendar size={11} color={C.info}/>:<Activity size={11} color={C.warning}/>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{uName}{uName&&lName?" ← ":""}{lName}</div>
              <div style={{ fontSize:10, color:C.textLight, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.note}</div>
            </div>
            <span style={{ fontSize:9, color:C.textLight, flexShrink:0 }}>{timeAgo(a.createdAt,t)}</span>
          </div>;
        })}
      </Card>
    </div>
  </div>;
};


// ===== EOI PAGE =====
var EOIPage = function(p) {
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="manager"; var isOnlyAdmin=p.cu.role==="admin";
  var eoiLeads=p.leads.filter(function(l){return l.status==="EOI"&&!l.archived;});
  var getAg=function(l){if(!l.agentId)return"-";if(l.agentId.name)return l.agentId.name;var u=p.users.find(function(x){return gid(x)===l.agentId;});return u?u.name:"-";};
  var parseBudget=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var total=eoiLeads.reduce(function(s,d){return s+parseBudget(d.budget);},0);
  var [editLead,setEditLead]=useState(null);

  var archiveLead=async function(lid){
    if(!window.confirm(t.archiveConfirm))return;
    try{
      await apiFetch("/api/leads/"+lid+"/archive","PUT",null,p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===lid?Object.assign({},l,{archived:true}):l;});});
    }catch(e){alert(e.message);}
  };

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>🎯 EOI ({eoiLeads.length})</h2>
        {total>0&&<div style={{ fontSize:13, fontWeight:700, color:"#EA580C", background:"#FFF7ED", padding:"5px 14px", borderRadius:20 }}>Total: {total.toLocaleString()} EGP</div>}
      </div>
    </div>

    {editLead&&<Modal show={true} onClose={function(){setEditLead(null);}} title={t.edit}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={false}
        editId={gid(editLead)} initial={editLead}
        onClose={function(){setEditLead(null);}}
        onSave={function(updated){p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(updated)?updated:l;});});setEditLead(null);}}/>
    </Modal>}

    {eoiLeads.length===0&&<div style={{ textAlign:"center", padding:"60px 20px", color:C.textLight }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
      <div style={{ fontSize:16, fontWeight:700 }}>No EOI clients yet</div>
      <div style={{ fontSize:13, marginTop:8 }}>Clients with EOI status will appear here automatically</div>
    </div>}

    {eoiLeads.length>0&&<Card p={0}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
      <thead><tr style={{ background:"#FFF7ED", borderBottom:"2px solid #FED7AA" }}>
        {[t.name,t.phone,t.project,"Unit Type",t.budget,"Deposit",isAdmin?t.agent:null,"تاريخ التحويل لـ EOI",""].filter(function(h){return h!==null;}).map(function(h,i){return <th key={i} style={{ textAlign:"right", padding:"11px 12px", fontSize:11, fontWeight:600, color:"#EA580C", whiteSpace:"nowrap" }}>{h}</th>;})}
      </tr></thead>
      <tbody>
        {eoiLeads.map(function(d){
          var bv=parseBudget(d.budget);
          var eoiDateStr=d.eoiDate?new Date(d.eoiDate).toLocaleDateString("en-GB"):d.updatedAt?new Date(d.updatedAt).toLocaleDateString("en-GB"):"-";
          return <tr key={gid(d)} style={{ borderBottom:"1px solid #FEF3E2" }}>
            <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600 }}>{d.name}</td>
            <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr" }}>{d.phone}</td>
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{d.project||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{d.notes||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:13, fontWeight:700, color:"#EA580C" }}>{bv>0?bv.toLocaleString():d.budget||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{d.eoiDeposit||"-"}</td>
            {isAdmin&&<td style={{ padding:"11px 12px", fontSize:12 }}>{getAg(d)}</td>}
            <td style={{ padding:"11px 12px", fontSize:11, color:C.textLight }}>{eoiDateStr}</td>
            <td style={{ padding:"8px 12px" }}>
              <div style={{ display:"flex", gap:5 }}>
                {isOnlyAdmin&&<button onClick={function(){setEditLead(d);}} title={t.edit}
                  style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Edit size={13} color={C.info}/>
                </button>}
                {isAdmin&&<button onClick={function(){archiveLead(gid(d));}} title={t.archive}
                  style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Archive size={13} color={C.warning}/>
                </button>}
              </div>
            </td>
          </tr>;
        })}
      </tbody>
    </table></div></Card>}
  </div>;
};

// ===== DEALS =====

// ===== COMMISSION SYSTEM =====
// Project weight settings stored in localStorage: crm_proj_weight_{projectName} = 0.5 or 1
var getEffectiveQTarget = function(user, allUsers, forQ) {
  var uid = String(typeof user === "string" ? user : gid(user));
  var userObj = typeof user === "object" ? user : (allUsers||[]).find(function(u){return String(gid(u))===uid;}) || {};
  var curQ = forQ || (function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();

  if(userObj.role === "manager" && allUsers) {
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

var getProjectWeight = function(project){
  try{ var w=localStorage.getItem("crm_proj_weight_"+(project||"").replace(/\s/g,"_")); return w?parseFloat(w):1; }catch(e){return 1;}
};
var saveProjectWeight = function(project,weight){
  try{localStorage.setItem("crm_proj_weight_"+(project||"").replace(/\s/g,"_"),String(weight));}catch(e){}
};
// Deal split stored in localStorage: crm_deal_split_{leadId} = {agent2Id, agent2Name}
var getDealSplit = function(lid){ try{return JSON.parse(localStorage.getItem("crm_deal_split_"+lid)||"null");}catch(e){return null;}};
var saveDealSplit = function(lid,split){ try{localStorage.setItem("crm_deal_split_"+lid,JSON.stringify(split));}catch(e){}};

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
  var qTarget = (qtUser && qtUser.role === "manager" && qtUser.reportsTo && allUsers)
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
    var weight = getProjectWeight(d.project);
    var split = getDealSplit(gid(d));
    var splitFactor = split ? 0.5 : 1;
    return sum + (raw * weight * splitFactor);
  }, 0);

  // Also add deals where this agent is agent2 in a split
  allDeals.forEach(function(d){
    var split = getDealSplit(gid(d));
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
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="manager"; var isOnlyAdmin=p.cu.role==="admin";
  var deals=p.leads.filter(function(l){return l.status==="DoneDeal"&&!l.archived;}).slice().sort(function(a,b){return new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0);});
  var getAg=function(l){if(!l.agentId)return"-";if(l.agentId.name)return l.agentId.name;var u=p.users.find(function(x){return gid(x)===l.agentId;});return u?u.name:"-";};
  var parseBudget=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var total=deals.reduce(function(s,d){return s+parseBudget(d.budget);},0);
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
  var [showAdd,setShowAdd]=useState(false);
  var [editDeal,setEditDeal]=useState(null);
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
  var filteredDeals=deals.filter(function(d){
    if(dateFrom&&new Date(d.updatedAt||d.createdAt)<new Date(dateFrom)) return false;
    if(dateTo&&new Date(d.updatedAt||d.createdAt)>new Date(dateTo+"T23:59:59")) return false;
    if(dealSearch){var q=dealSearch.toLowerCase();var nm=d.name?d.name.toLowerCase():"";var pr=d.project?d.project.toLowerCase():"";var ph=d.phone||"";if(!nm.includes(q)&&!pr.includes(q)&&!ph.includes(q))return false;}
    if(dealAgent){var aid=d.agentId&&d.agentId._id?d.agentId._id:d.agentId;if(aid!==dealAgent)return false;}
    return true;
  });
  var filteredTotal=filteredDeals.reduce(function(s,d){return s+parseBudget(d.budget);},0);

  // Get stages from localStorage
  var getStages=function(lid){try{return JSON.parse(localStorage.getItem("crm_stages_"+lid)||"{}");} catch(e){return {};}};
  var saveStages=function(lid,stages){try{localStorage.setItem("crm_stages_"+lid,JSON.stringify(stages));}catch(e){}};
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
      {isOnlyAdmin&&<Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><Plus size={14}/> {t.addLead}</Btn>}
    </div>

    {/* Deals Search + Filter bar */}
    <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14, flexWrap:"wrap" }}>
      <input placeholder="🔍 Search by name, project or phone..." value={dealSearch} onChange={function(e){setDealSearch(e.target.value);}} style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, minWidth:220 }}/>
      {isAdmin&&<select value={dealAgent} onChange={function(e){setDealAgent(e.target.value);}} style={{ padding:"6px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
        <option value="">👤 All Agents</option>
        {salesUsers.map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name}</option>;})}
      </select>}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:12, color:C.textLight, fontWeight:600 }}>📅 من:</span>
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
        onSave={function(lead){p.setLeads(function(prev){return [lead].concat(prev);});setShowAdd(false);}}/>
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
        {stagesProgress(gid(stagesModal))}/3 مراحل مكتملة
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
          <span style={{ fontSize:13, fontWeight:600 }}>📝 العقد اتوقع</span>
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
          <span style={{ fontSize:13, fontWeight:600 }}>💰 الدفعة الأولى</span>
        </div>
        {stagesForm.payment1&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 10px", marginTop:8 }}>
          <div>
            <label style={{ fontSize:11, color:C.textLight, display:"block", marginBottom:4 }}>Date</label>
            <input type="date" value={stagesForm.payment1Date} onChange={function(e){setStagesForm(function(f){return Object.assign({},f,{payment1Date:e.target.value});});}}
              style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box" }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.textLight, display:"block", marginBottom:4 }}>Amount (EGP)</label>
            <input type="text" placeholder="مثال: 500,000" value={stagesForm.payment1Amount}
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
          <span style={{ fontSize:13, fontWeight:600 }}>💰 الدفعة الثانية</span>
        </div>
        {stagesForm.payment2&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 10px", marginTop:8 }}>
          <div>
            <label style={{ fontSize:11, color:C.textLight, display:"block", marginBottom:4 }}>Date</label>
            <input type="date" value={stagesForm.payment2Date} onChange={function(e){setStagesForm(function(f){return Object.assign({},f,{payment2Date:e.target.value});});}}
              style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box" }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:C.textLight, display:"block", marginBottom:4 }}>Amount (EGP)</label>
            <input type="text" placeholder="مثال: 500,000" value={stagesForm.payment2Amount}
              onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");setStagesForm(function(f){return Object.assign({},f,{payment2Amount:r?Number(r).toLocaleString():""});});}}
              style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:13, boxSizing:"border-box", direction:"ltr" }}/>
          </div>
        </div>}
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setStagesModal(null);}} style={{ flex:1 }}>إلغاء</Btn>
        <Btn onClick={function(){saveStages(gid(stagesModal),stagesForm);setStagesModal(null);}} style={{ flex:1 }}>✅ حفظ</Btn>
      </div>
    </Modal>}

    {/* Commission Summary Modal */}
    {commModal&&<Modal show={true} onClose={function(){setCommModal(false);}} title={"💰 العمولات — "+commQ}>
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {["Q1","Q2","Q3","Q4"].map(function(q){return <button key={q} onClick={function(){setCommQ(q);}}
          style={{ flex:1, padding:"6px", borderRadius:8, border:"1px solid", borderColor:commQ===q?C.accent:"#E2E8F0", background:commQ===q?C.accent+"12":"#fff", color:commQ===q?C.accent:C.textLight, fontSize:12, fontWeight:600, cursor:"pointer" }}>{q}</button>;})}
      </div>
      {p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;}).map(function(u){
        var res = calcCommission(u, deals, p.users, commQ);
        return <div key={gid(u)} style={{ padding:"12px 0", borderBottom:"1px solid #F1F5F9" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700 }}>{u.name}</div>
              <div style={{ fontSize:11, color:C.textLight }}>{u.role==="manager"?"مدير — 2,000/M ثابت":"سيلز — "+res.commRate.toLocaleString()+"/M"}</div>
            </div>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:15, fontWeight:800, color:C.success }}>{res.commission.toLocaleString()} EGP</div>
              <div style={{ fontSize:10, color:C.textLight }}>مبيعات فعلية: {(res.effectiveRevenue/1000000).toFixed(2)}M</div>
            </div>
          </div>
          {res.qTarget>0&&<div style={{ marginTop:6 }}>
            <div style={{ height:5, background:"#F1F5F9", borderRadius:3 }}>
              <div style={{ height:"100%", width:Math.min(100,(res.effectiveRevenue/res.qTarget*100))+"%", background:res.effectiveRevenue>=res.qTarget*3?C.success:res.effectiveRevenue>=res.qTarget*2?"#8B5CF6":C.accent, borderRadius:3 }}/>
            </div>
            <div style={{ fontSize:10, color:C.textLight, marginTop:2 }}>
              {res.effectiveRevenue>=res.qTarget*3?"🏆 3x — Commission 7,000/M":res.effectiveRevenue>=res.qTarget*2?"⚡ 2x — Commission 6,000/M":"📈 "+Math.round(res.effectiveRevenue/res.qTarget*100)+"% من التارجت"}
            </div>
          </div>}
        </div>;
      })}
    </Modal>}

    {/* Project Weight Modal */}
    {isAdmin&&projWeightModal&&<Modal show={true} onClose={function(){setProjWeightModal(false);}} title={"⚙️ Commission المشاريع"}>
      <div style={{ fontSize:12, color:C.textLight, marginBottom:12, padding:"8px 12px", background:"#F8FAFC", borderRadius:8 }}>
        100% = يحسب كامل في التارجت والCommission<br/>50% = يحسب نص في التارجت والCommission
      </div>
      {(function(){var projects=[];deals.forEach(function(d){if(d.project&&!projects.includes(d.project))projects.push(d.project);});return projects.map(function(proj){
        var w=getProjectWeight(proj);
        return <div key={proj} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
          <span style={{ fontSize:13, fontWeight:600 }}>{proj}</span>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={function(){saveProjectWeight(proj,1);setProjWeights(function(prev){return Object.assign({},prev,{[proj]:1});});}}
              style={{ padding:"5px 12px", borderRadius:7, border:"2px solid", borderColor:w===1?C.success:"#E2E8F0", background:w===1?"#DCFCE7":"#fff", color:w===1?C.success:C.textLight, fontSize:12, fontWeight:w===1?700:400, cursor:"pointer" }}>100%</button>
            <button onClick={function(){saveProjectWeight(proj,0.5);setProjWeights(function(prev){return Object.assign({},prev,{[proj]:0.5});});}}
              style={{ padding:"5px 12px", borderRadius:7, border:"2px solid", borderColor:w===0.5?"#F59E0B":"#E2E8F0", background:w===0.5?"#FEF3C7":"#fff", color:w===0.5?"#B45309":C.textLight, fontSize:12, fontWeight:w===0.5?700:400, cursor:"pointer" }}>50%</button>
          </div>
        </div>;
      });})()}
      <Btn onClick={function(){setProjWeightModal(false);}} style={{ marginTop:14, width:"100%" }}>إغلاق</Btn>
    </Modal>}

    {/* Split Modal */}
    {splitModal&&<Modal show={true} onClose={function(){setSplitModal(null);setSplitAgent2("");}} title={"🤝 Split Deal — "+splitModal.name}>
      <div style={{ fontSize:12, color:C.textLight, marginBottom:12 }}>Deal will be split 50/50 between two agents</div>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>السيلز الأول</div>
        <div style={{ padding:"8px 12px", borderRadius:8, background:"#F8FAFC", fontSize:13 }}>{splitModal.agentId&&splitModal.agentId.name?splitModal.agentId.name:"—"}</div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>السيلز الثاني</div>
        <select value={splitAgent2} onChange={function(e){setSplitAgent2(e.target.value);}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, background:"#fff", boxSizing:"border-box" }}>
          <option value="">— اختر سيلز —</option>
          {salesUsers.filter(function(u){var uid=gid(u);var a1=splitModal.agentId&&splitModal.agentId._id?splitModal.agentId._id:splitModal.agentId;return uid!==a1;}).map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name} — {u.title}</option>;})}
        </select>
      </div>
      {getDealSplit(gid(splitModal))&&<div style={{ padding:"8px 12px", background:"#FEF3C7", borderRadius:8, fontSize:12, marginBottom:10 }}>
        تقسيم حالي: {getDealSplit(gid(splitModal)).agent2Name} — <button onClick={function(){saveDealSplit(gid(splitModal),null);setSplitModal(null);}} style={{ background:"none", border:"none", color:C.danger, cursor:"pointer", fontSize:12 }}>إلغاء التقسيم</button>
      </div>}
      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setSplitModal(null);setSplitAgent2("");}} style={{ flex:1 }}>إلغاء</Btn>
        <Btn onClick={function(){
          if(!splitAgent2) return;
          var ag2=salesUsers.find(function(u){return gid(u)===splitAgent2;});
          saveDealSplit(gid(splitModal),{agent2Id:splitAgent2,agent2Name:ag2?ag2.name:"?"});
          setSplitModal(null); setSplitAgent2("");
        }} style={{ flex:1 }}>✅ حفظ</Btn>
      </div>
    </Modal>}

    {/* Action buttons row */}
    {isOnlyAdmin&&<div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
      <Btn outline onClick={function(){setCommModal(true);}} style={{ padding:"7px 13px", fontSize:12, color:C.success, borderColor:C.success }}>💰 العمولات</Btn>
      <Btn outline onClick={function(){setProjWeightModal(true);}} style={{ padding:"7px 13px", fontSize:12, color:C.accent, borderColor:C.accent }}>⚙️ Commission المشاريع</Btn>
    </div>}

    <Card p={0}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
      <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
        {[t.name,t.phone,"Alt. Phone",t.project,t.budget,"Deal Date","Deal Stages",isOnlyAdmin?"Commission":null,isAdmin?t.agent:null,isAdmin?t.source:null,""].filter(function(h){return h!==null;}).map(function(h,i){return <th key={i} style={{ textAlign:"right", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
      </tr></thead>
      <tbody>
        {filteredDeals.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:C.textLight }}>No deals yet</td></tr>}
        {filteredDeals.map(function(d){
          var bv=parseBudget(d.budget);
          var prog=stagesProgress(gid(d));
          var stages=getStages(gid(d));
          return <tr key={gid(d)} style={{ borderBottom:"1px solid #F1F5F9" }}>
            <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600 }}>{d.name}</td>
            <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr" }}>{d.phone}</td>
            <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr", color:C.textLight }}>{d.phone2||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{d.project||"-"}</td>
            <td style={{ padding:"11px 12px", fontSize:13, fontWeight:700, color:C.success }}>
              {(function(){
                var split=getDealSplit(gid(d));
                var displayVal=bv>0?bv.toLocaleString():d.budget||"-";
                if(split&&bv>0){
                  return <div>
                    <div>{(bv/2).toLocaleString()}</div>
                    <div style={{ fontSize:10, color:"#8B5CF6", fontWeight:600 }}>🤝 50% — {split.agent2Name||"مشترك"}</div>
                  </div>;
                }
                return displayVal;
              })()}
            </td>
            <td style={{ padding:"11px 12px", fontSize:11, color:C.textLight, whiteSpace:"nowrap" }}>{d.updatedAt?new Date(d.updatedAt).toLocaleDateString("en-GB")+" "+new Date(d.updatedAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):"-"}</td>
            <td style={{ padding:"11px 12px", minWidth:130 }}>
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
                var weight=getProjectWeight(d.project);
                var split=getDealSplit(gid(d));
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
                    var ddate=dd.updatedAt||dd.createdAt;
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
                  {split&&<div style={{ fontSize:9, color:"#8B5CF6" }}>🤝 مقسومة</div>}
                </div>;
              })()}
            </td>}
            {isAdmin&&<td style={{ padding:"11px 12px", fontSize:12 }}>
              <div>{getAg(d)}</div>
              {(function(){var sp=getDealSplit(gid(d));return sp?<div style={{ fontSize:10, color:"#8B5CF6", marginTop:2 }}>🤝 +{sp.agent2Name}</div>:null;})()}
            </td>}
            {isAdmin&&<td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{d.source}</td>}
            <td style={{ padding:"8px 12px" }}>
              <div style={{ display:"flex", gap:5 }}>
                {isOnlyAdmin&&<button onClick={function(){setSplitModal(d);var sp=getDealSplit(gid(d));setSplitAgent2(sp?sp.agent2Id:"");}} title="Split Deal"
                  style={{ width:28, height:28, borderRadius:6, border:"1px solid "+(getDealSplit(gid(d))?"#8B5CF6":"#E2E8F0"), background:getDealSplit(gid(d))?"#F5F3FF":"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🤝</button>}
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
    return p.cu.role==="admin"||p.cu.role==="manager"||aid===p.cu.id;
  });

  var callbacksToday=myLeads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).toDateString()===today;}).sort(function(a,b){return new Date(a.callbackTime)-new Date(b.callbackTime);});
  var overdue=myLeads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime)<new Date()&&new Date(l.callbackTime).toDateString()!==today;});
  var noActivity=myLeads.filter(function(l){return (!l.lastActivityTime||(now-new Date(l.lastActivityTime).getTime())>1*24*60*60*1000)&&l.status!=="DoneDeal"&&l.status!=="NotInterested";});

  var myTasks=p.tasks.filter(function(tk){
    if(tk.done) return false;
    if(p.cu.role==="admin") return true;
    if(p.cu.role==="manager"){
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
    <div><div style={{ fontWeight:600, fontSize:13 }}>{tk.title}</div><div style={{ fontSize:11, color:tp.tc||"#64748B" }}>{tk.time?tk.time.slice(0,16).replace("T"," "):"بدون موعد"}</div></div>
    <button onClick={function(){doneTask(tk._id);}} style={{ padding:"4px 12px", borderRadius:7, border:"none", background:C.success, color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>✓ تم</button>
  </div>;};

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
      <div>
        <h2 style={{ margin:"0 0 2px", fontSize:18, fontWeight:800 }}>☀️ My Day & Tasks</h2>
        <div style={{ fontSize:12, color:C.textLight }}>{new Date().toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
      </div>
      <Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><Plus size={14}/> مهمة جديدة</Btn>
    </div>

    <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
      <StatCard icon={Phone} label={"Today's Calls"} value={callbacksToday.length+""} c={C.info} onClick={function(){var el=document.getElementById("t-callbacks");if(el)el.scrollIntoView({behavior:"smooth"});}}/>
      <StatCard icon={AlertCircle} label={"Overdue"} value={(overdue.length+overdueTasks.length)+""} c={C.danger} onClick={function(){var el=document.getElementById("t-overdue");if(el)el.scrollIntoView({behavior:"smooth"});}}/>
      <StatCard icon={Activity} label={"No Activity"} value={noActivity.length+""} c={C.warning} onClick={function(){var el=document.getElementById("t-noact");if(el)el.scrollIntoView({behavior:"smooth"});}}/>
      <StatCard icon={CheckCircle} label={"Today's Tasks"} value={todayTasks.length+""} c={"#8B5CF6"} onClick={function(){var el=document.getElementById("t-today");if(el)el.scrollIntoView({behavior:"smooth"});}}/>
    </div>

    {overdue.length>0&&<div id="t-overdue"><Sec icon="⚠️" title="Overdue Calls" color={C.danger} count={overdue.length}>{overdue.slice(0,5).map(function(l){return <LRow key={gid(l)} lead={l}/>;})}</Sec></div>}
    {overdueTasks.length>0&&<Sec icon="🔴" title="مهام Overdue" color={C.danger} count={overdueTasks.length}>{overdueTasks.map(function(tk){return <TRow key={tk._id} task={tk} bg="#FEF2F2" border="#FECACA" tc={C.danger}/>;})}</Sec>}
    {callbacksToday.length>0&&<div id="t-callbacks"><Sec icon="📞" title="Today's Calls" color={C.info} count={callbacksToday.length}>{callbacksToday.map(function(l){return <LRow key={gid(l)} lead={l}/>;})}</Sec></div>}
    {todayTasks.length>0&&<div id="t-today"><Sec icon="📋" title="Today's Tasks" color={"#8B5CF6"} count={todayTasks.length}>{todayTasks.map(function(tk){return <TRow key={tk._id} task={tk} bg="#F5F3FF" border="#DDD6FE" tc={"#7C3AED"}/>;})}</Sec></div>}
    {noActivity.length>0&&<div id="t-noact"><Sec icon="😴" title="No Activity +3 أيام" color={C.warning} count={noActivity.length}>{noActivity.slice(0,5).map(function(l){return <LRow key={gid(l)} lead={l}/>;})}</Sec></div>}
    {upcoming.length>0&&<Sec icon="📅" title="مهام Upcoming" color={C.textLight} count={upcoming.length}>{upcoming.slice(0,5).map(function(tk){return <TRow key={tk._id} task={tk} bg="#F8FAFC" border="#E2E8F0"/>;})}</Sec>}

    {callbacksToday.length===0&&overdue.length===0&&noActivity.length===0&&myTasks.length===0&&
      <div style={{ textAlign:"center", padding:"60px 20px" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>يومك نضيف!</div>
        <div style={{ fontSize:13, color:C.textLight }}>مفيش مهام معلقة دلوقتي</div>
      </div>}

    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={"➕ مهمة جديدة"}>
      <Inp label={"عنوان المهمة"} req value={nT.title} onChange={function(e){setNT(function(f){return Object.assign({},f,{title:e.target.value});});}}/>
      <Inp label={"النوع"} type="select" value={nT.type} onChange={function(e){setNT(function(f){return Object.assign({},f,{type:e.target.value});});}} options={[{value:"call",label:"📞 مكالمة"},{value:"meeting",label:"🤝 اجتماع"},{value:"followup",label:"🔔 متابعة"},{value:"email",label:"📧 إيميل"}]}/>
      <Inp label={"الموعد"} type="datetime-local" value={nT.time} onChange={function(e){setNT(function(f){return Object.assign({},f,{time:e.target.value});});}}/>
      <Inp label={"ملاحظات (اختياري)"} type="textarea" value={nT.notes} onChange={function(e){setNT(function(f){return Object.assign({},f,{notes:e.target.value});});}}/>
      <div style={{ display:"flex", gap:10 }}><Btn outline onClick={function(){setShowAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn><Btn onClick={addTask} loading={saving} style={{ flex:1 }}>إضافة</Btn></div>
    </Modal>
  </div>;
};


var ArchivePage = function(p) {
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="manager";
  var archived = p.leads.filter(function(l){ return l.archived; });
  var restore=async function(lid){
    try{
      await apiFetch("/api/leads/"+lid,"PUT",{archived:false},p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===lid?Object.assign({},l,{archived:false}):l;});});
    }catch(e){alert(e.message);}
  };
  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>{t.archive} ({archived.length})</h2>
    {archived.length===0&&<div style={{ textAlign:"center", padding:50, color:C.textLight }}>الArchive فاضي</div>}
    <Card p={0}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
      <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
        {[t.name,t.phone,t.project,t.status,isAdmin&&t.agent,""].filter(Boolean).map(function(h){return <th key={h||"x"} style={{ textAlign:t.dir==="rtl"?"right":"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight }}>{h}</th>;})}
      </tr></thead>
      <tbody>{archived.map(function(l){var lid=gid(l);var so=STATUSES(t).find(function(s){return s.value===l.status;})||STATUSES(t)[0];var ag=l.agentId&&l.agentId.name?l.agentId.name:"";
        return <tr key={lid} style={{ borderBottom:"1px solid #F1F5F9", opacity:0.7 }}>
          <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600 }}>{l.name}</td>
          <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr" }}>{l.phone}</td>
          <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{l.project}</td>
          <td style={{ padding:"11px 12px" }}><Badge bg={so.bg} color={so.color}>{so.label}</Badge></td>
          {isAdmin&&<td style={{ padding:"11px 12px", fontSize:12 }}>{ag}</td>}
          <td style={{ padding:"11px 12px" }}><Btn onClick={function(){restore(lid);}} style={{ padding:"5px 12px", fontSize:11 }}><RotateCcw size={12}/> {t.restore}</Btn></td>
        </tr>;
      })}</tbody>
    </table></div></Card>
  </div>;
};

// ===== DAILY REQUESTS =====
var DailyRequestsPage = function(p) {
  var t=p.t; var sc=STATUSES(t);
  var isAdmin=p.cu.role==="admin"||p.cu.role==="manager"; var isOnlyAdmin=p.cu.role==="admin";
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
  var [requests,setRequests]=useState([]);
  var [loading,setLoading]=useState(true);
  var [showAdd,setShowAdd]=useState(false);
  var [saving,setSaving]=useState(false);
  var [selected,setSelected]=useState(null);
  var [statusDrop,setStatusDrop]=useState(null);
  var [showStatusComment,setShowStatusComment]=useState(false);
  var [pendingStatus,setPendingStatus]=useState(null);
  var [actNote,setActNote]=useState(""); var [actType,setActType]=useState("call"); var [showActForm,setShowActForm]=useState(false);
  var [actSaving,setActSaving]=useState(false);
  var [filterStatus,setFilterStatus]=useState("all");
  var [sortBy,setSortBy]=useState("lastActivity");
  var [agentFilter,setAgentFilter]=useState("");
  var [form,setForm]=useState({name:"",phone:"",phone2:"",propertyType:"",area:"",budget:"",notes:"",agentId:"",callbackTime:""});

  useEffect(function(){
    apiFetch("/api/daily-requests","GET",null,p.token)
      .then(function(data){setRequests(Array.isArray(data)?data:[]);setLoading(false);})
      .catch(function(){setRequests([]);setLoading(false);});
  },[]);

  var filtered=requests.filter(function(r){
    if(filterStatus!=="all"&&r.status!==filterStatus)return false;
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
    try{
      var updateData={status:pendingStatus.newStatus};
      if(cbTime) updateData.callbackTime=cbTime;
      if(comment) updateData.notes=comment;
      // Pass deal fields from StatusModal
      if(extra){
        if(extra.budget)    updateData.budget=extra.budget;
        if(extra.project)   updateData.project=extra.project;
        if(extra.notes)     updateData.notes=(updateData.notes?updateData.notes+" | ":"")+extra.notes;
        if(extra.eoiDeposit) updateData.eoiDeposit=extra.eoiDeposit;
      }
      var upd=await apiFetch("/api/daily-requests/"+pendingStatus.leadId,"PUT",updateData,p.token);
      setRequests(function(prev){return prev.map(function(r){return gid(r)===pendingStatus.leadId?upd:r;});});
      if(selected&&gid(selected)===pendingStatus.leadId)setSelected(upd);
      // Notify admin on DoneDeal or EOI
      if((pendingStatus.newStatus==="DoneDeal"||pendingStatus.newStatus==="EOI")&&p.addDealNotif){
        var req=requests.find(function(r){return gid(r)===pendingStatus.leadId;})||{};
        p.addDealNotif({
          id:Date.now(),
          leadName:req.name||upd.name||"",
          agentName:req.agentId&&req.agentId.name?req.agentId.name:p.cu.name,
          status:pendingStatus.newStatus,
          budget:updateData.budget||req.budget||"",
          time:new Date().toISOString()
        });
        showBrowserNotif(
          pendingStatus.newStatus==="DoneDeal"?"🏆 deal جديدة!":"📋 EOI جديد!",
          (req.name||"leads")+" — "+(updateData.budget||req.budget||"")
        );
      }
    }catch(e){alert(e.message);}
    setShowStatusComment(false);setPendingStatus(null);setStatusDrop(null);
  };

  var logActivity=async function(){
    if(!actNote.trim()||!selected)return;
    setActSaving(true);
    try{
      await apiFetch("/api/daily-requests/"+gid(selected),"PUT",{lastActivityTime:new Date()},p.token);
      setRequests(function(prev){return prev.map(function(r){return gid(r)===gid(selected)?Object.assign({},r,{lastActivityTime:new Date().toISOString()}):r;});});
      setActNote(""); setShowActForm(false);
    }catch(e){}
    setActSaving(false);
  };

  var addReq=async function(){
    if(!form.name||!form.phone)return;
    if(!form.area.trim()){alert("Area مطلوبة");return;}
    if(!form.budget.trim()){alert("الميزانية مطلوبة");return;}
    if(!form.callbackTime){alert("Callback مطلوب");return;}
    setSaving(true);
    try{
      var drAgentId=form.agentId||"";
      var submitData={
        name:form.name||"",
        phone:form.phone||"",
        phone2:form.phone2||"",
        propertyType:form.propertyType||"",
        area:form.area||"",
        budget:form.budget||"",
        notes:form.notes||"",
        callbackTime:form.callbackTime||"",
        agentId:drAgentId,
        source:"Daily Request",
        status:"Potential"
      };
      var r=await apiFetch("/api/daily-requests","POST",submitData,p.token);
      setRequests(function(prev){return [r].concat(prev);});
      setShowAdd(false);setForm({name:"",phone:"",phone2:"",propertyType:"",area:"",budget:"",notes:"",agentId:"",callbackTime:""});
    }catch(e){alert(e.message);}setSaving(false);
  };

  var getAgentName=function(r){if(!r.agentId)return"-";if(r.agentId.name)return r.agentId.name;var u=p.users.find(function(x){return gid(x)===r.agentId;});return u?u.name:"-";};

  return <div style={{ padding:"18px 16px 40px" }}>
    <StatusModal show={showStatusComment} t={t} newStatus={pendingStatus?pendingStatus.newStatus:null} onClose={function(){setShowStatusComment(false);}} onConfirm={confirmStatus}/>
    {statusDrop&&<div style={{ position:"fixed", inset:0, zIndex:499 }} onClick={function(){setStatusDrop(null);}}/>}

    {/* Stats */}
    <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
      <StatCard icon={ClipboardList} label={"Total Numbers"} value={requests.length+""} c={C.info}/>
      <StatCard icon={Target} label={"Potential"} value={requests.filter(function(r){return r.status==="Potential";}).length+""} c={"#1D4ED8"}/>
      <StatCard icon={DollarSign} label={t.doneDeals} value={requests.filter(function(r){return r.status==="DoneDeal";}).length+""} c={C.success}/>
      <Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13, alignSelf:"center", marginRight:"auto" }}><Plus size={14}/> Add Number</Btn>
    </div>

    {/* Filters */}
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
      {[{v:"all",l:t.all}].concat(sc.map(function(s){return{v:s.value,l:s.label};})).map(function(s){
        var cnt=s.v==="all"?requests.length:requests.filter(function(r){return r.status===s.v;}).length;
        return <button key={s.v} onClick={function(){setFilterStatus(s.v);}} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid", borderColor:filterStatus===s.v?C.accent:"#E8ECF1", background:filterStatus===s.v?C.accent+"12":"#fff", color:filterStatus===s.v?C.accent:C.textLight, fontSize:11, fontWeight:500, cursor:"pointer" }}>{s.l} ({cnt})</button>;
      })}
    </div>
    <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
      {isAdmin&&<select value={agentFilter} onChange={function(e){setAgentFilter(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
        <option value="">👤 All Agents</option>
        {salesUsers.map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name}</option>;})}
      </select>}
      <select value={sortBy} onChange={function(e){setSortBy(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
        <option value="lastActivity">⏱ Last Activity</option>
        <option value="newest">🆕 الأحدث</option>
      </select>
    </div>

    <div style={{ display:"flex", gap:14 }}>
      <Card style={{ flex:1, padding:0, overflow:"hidden", minWidth:0 }}>
        {loading?<Loader/>:<div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
              {["الاسم","الهاتف","Property Type","Area","الميزانية","Status",isAdmin&&"الموظف","Last Activity","Callback"].filter(Boolean).map(function(h){return <th key={h} style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:700, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:C.textLight }}>No أرقام</td></tr>}
              {filtered.map(function(r){
                var rid=gid(r); var so=sc.find(function(s){return s.value===r.status;})||sc[0]; var isSel=selected&&gid(selected)===rid;
                var ci=callbackColor(r.callbackTime);
                return <tr key={rid} onClick={function(){setSelected(r);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSel?"#EFF6FF":"transparent", borderRight:"3px solid "+(isSel?C.accent:"transparent") }}>
                  <td style={{ padding:"10px 12px" }}><div style={{ fontSize:13, fontWeight:600 }}>{r.name}</div><div style={{ fontSize:10, color:C.textLight }}>{r.email}</div></td>
                  <td style={{ padding:"10px 12px", fontSize:12, direction:"ltr" }}>
                    {r.phone}{r.phone2&&<div style={{ fontSize:10, color:C.textLight }}>{r.phone2}</div>}
                    <div style={{ display:"flex", gap:4, marginTop:2 }}>
                      <a href={"tel:"+r.phone} onClick={function(e){e.stopPropagation();}} style={{ fontSize:10, color:C.success, textDecoration:"none", display:"flex", alignItems:"center", gap:2 }}><Phone size={9}/></a>
                      <a href={"https://wa.me/2"+r.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ fontSize:10, color:"#25D366", textDecoration:"none" }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
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
                  {isAdmin&&<td style={{ padding:"10px 12px", fontSize:11, color:C.textLight }} onClick={function(e){e.stopPropagation();}}>
                    <select value={r.agentId&&r.agentId._id?r.agentId._id:(r.agentId||"")} onChange={async function(e){
                      var newAgent=e.target.value;
                      try{var upd=await apiFetch("/api/daily-requests/"+rid,"PUT",{agentId:newAgent},p.token);setRequests(function(prev){return prev.map(function(x){return gid(x)===rid?upd:x;});});if(selected&&gid(selected)===rid)setSelected(upd);}catch(ex){}
                    }} style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", maxWidth:110 }}>
                      <option value="">— No Agent —</option>
                      {salesUsers.map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name}</option>;})}
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
      {selected&&<Card style={{ flex:"0 0 280px", maxHeight:"calc(100vh - 120px)", overflowY:"auto", padding:0 }}>
        <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:"14px 16px" }}>
          <button onClick={function(){setSelected(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", marginBottom:8 }}><X size={11}/></button>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{selected.name}</div>
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:2 }}>{selected.phone}{selected.phone2?" / "+selected.phone2:""}</div>
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            <a href={"tel:"+selected.phone} style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(34,197,94,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><Phone size={12}/> اتصال</a>
            <a href={"https://wa.me/2"+selected.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(37,211,102,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> واتساب</a>
          </div>
        </div>
        <div style={{ padding:"12px 14px" }}>
          <div style={{ marginBottom:12, padding:10, background:"#F8FAFC", borderRadius:10 }}>
            <div style={{ fontSize:11, color:C.textLight, marginBottom:7, fontWeight:600 }}>{t.changeStatus}</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {sc.map(function(s){return <button key={s.value} onClick={function(){reqStatus(gid(selected),s.value);}} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid", borderColor:selected.status===s.value?s.color:"#E2E8F0", background:selected.status===s.value?s.bg:"#fff", color:selected.status===s.value?s.color:C.textLight, fontSize:10, fontWeight:600, cursor:"pointer" }}>{s.label}</button>;})}
            </div>
          </div>
          {[{l:"Property Type",v:selected.propertyType},{l:"Area",v:selected.area},{l:"الميزانية",v:selected.budget},{l:t.agent,v:getAgentName(selected)},{l:t.callbackTime,v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):"-"},{l:t.lastActivity,v:timeAgo(selected.lastActivityTime,t)},{l:"تاريخ الإضافة",v:isOnlyAdmin?selected.createdAt?new Date(selected.createdAt).toLocaleDateString("en-GB"):"-":null},{l:t.notes,v:selected.notes}].map(function(f){
            return f.v?<div key={f.l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F1F5F9", gap:8 }}><span style={{ fontSize:11, color:C.textLight, flexShrink:0 }}>{f.l}</span><span style={{ fontSize:11, fontWeight:500, textAlign:"right" }}>{f.v}</span></div>:null;
          })}
          <div style={{ marginTop:12 }}>
            <button onClick={function(){setShowActForm(!showActForm);}} style={{ width:"100%", padding:"8px", borderRadius:9, border:"1px dashed "+C.accent, background:C.accent+"08", color:C.accent, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><MessageSquare size={12}/> تسجيل نشاط</button>
            {showActForm&&<div style={{ marginTop:9, padding:10, background:"#F8FAFC", borderRadius:10 }}>
              <select value={actType} onChange={function(e){setActType(e.target.value);}} style={{ width:"100%", padding:"6px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, marginBottom:7, background:"#fff" }}>
                <option value="call">📞 مكالمة</option>
                <option value="meeting">🤝 اجتماع</option>
                <option value="followup">🔔 متابعة</option>
                <option value="note">📝 ملاحظة</option>
              </select>
              <textarea rows={2} placeholder="ملاحظة..." value={actNote} onChange={function(e){setActNote(e.target.value);}} style={{ width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, boxSizing:"border-box", resize:"none", fontFamily:"inherit" }}/>
              <div style={{ display:"flex", gap:6, marginTop:6 }}>
                <Btn onClick={logActivity} loading={actSaving} style={{ flex:1, padding:"6px", fontSize:11 }}>{t.save}</Btn>
                <Btn outline onClick={function(){setShowActForm(false);setActNote("");}} style={{ flex:1, padding:"6px", fontSize:11 }}>{t.cancel}</Btn>
              </div>
            </div>}
          </div>
        </div>
      </Card>}
    </div>

    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={"➕ Add Number جديد"}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
        <div style={{ gridColumn:"1/-1" }}><Inp label={"الاسم"} req value={form.name} onChange={function(e){setForm(function(f){return Object.assign({},f,{name:e.target.value});})}}/></div>
        <Inp label={"الهاتف"} req value={form.phone} onChange={function(e){setForm(function(f){return Object.assign({},f,{phone:e.target.value});})}} placeholder="01xxxxxxxxx"/>
        <Inp label={"هاتف إضافي"} value={form.phone2} onChange={function(e){setForm(function(f){return Object.assign({},f,{phone2:e.target.value});})}} placeholder="اختياري"/>
        <Inp label={"Property Type"} type="select" value={form.propertyType} onChange={function(e){setForm(function(f){return Object.assign({},f,{propertyType:e.target.value});})}} options={[""].concat(PROP_TYPES).map(function(x){return{value:x,label:x||"- Select -"};})}/>
        <Inp label={"Area"} req value={form.area} onChange={function(e){setForm(function(f){return Object.assign({},f,{area:e.target.value});})}} placeholder="مثال: التجمع الخامس"/>
        <div style={{ gridColumn:"1/-1" }}><Inp label={"الميزانية"} req value={form.budget} onChange={function(e){setForm(function(f){return Object.assign({},f,{budget:(function(){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");return r?Number(r).toLocaleString():"";})()});})}}/></div>
      </div>
      {isAdmin&&<Inp label={t.agent} type="select" value={form.agentId} onChange={function(e){setForm(function(f){return Object.assign({},f,{agentId:e.target.value});})}} options={[{value:"",label:"- Select -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name};}))}/>}
      <Inp label={t.callbackTime} req type="datetime-local" value={form.callbackTime} onChange={function(e){setForm(function(f){return Object.assign({},f,{callbackTime:e.target.value});})}}/> 
      <Inp label={t.notes} type="textarea" value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});})}}/> 
      <div style={{ display:"flex", gap:10 }}><Btn outline onClick={function(){setShowAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn><Btn onClick={addReq} loading={saving} style={{ flex:1 }}>Add Number</Btn></div>
    </Modal>
  </div>;
};

// ===== USERS =====
var UsersPage = function(p) {
  var t=p.t; var isOnlyAdmin=p.cu.role==="admin"; var [showAdd,setShowAdd]=useState(false); var [saving,setSaving]=useState(false);
  var [nU,setNU]=useState({name:"",username:"",password:"sales123",email:"",phone:"",role:"sales",title:"",monthlyTarget:15,teamId:"",teamName:""});
  var [pwModal,setPwModal]=useState(null); // {userId, userName}
  var [pwForm,setPwForm]=useState({newPass:"",confirmPass:""});
  var [pwMsg,setPwMsg]=useState(""); var [pwSaving,setPwSaving]=useState(false);
  var [teamModal,setTeamModal]=useState(null); // {userId, userName, teamId, teamName, reportsTo}
  var [teamSaving,setTeamSaving]=useState(false);
  var saveTeam=async function(){
    if(!teamModal)return; setTeamSaving(true);
    try{
      var upd=await apiFetch("/api/users/"+teamModal.userId,"PUT",{teamId:teamModal.teamId,teamName:teamModal.teamName,reportsTo:teamModal.reportsTo||null},p.token);
      p.setUsers(function(prev){return prev.map(function(x){return gid(x)===teamModal.userId?Object.assign({},x,{teamId:teamModal.teamId,teamName:teamModal.teamName,reportsTo:teamModal.reportsTo||null}):x;});});
      setTeamModal(null);
    }catch(e){alert(e.message);} setTeamSaving(false);
  };
  var rc={admin:"#EF4444",manager:"#8B5CF6",sales:"#3B82F6",viewer:"#94A3B8"};
  var getManagerName=function(uid){var u=p.users.find(function(x){return gid(x)===String(uid||"");});return u?u.name:"";};
  var getRoleLabel=function(u){if(u.role==="manager"&&u.reportsTo)return "Team Leader";if(u.role==="manager")return "Manager";return u.role==="admin"?"Admin":"Sales";};
  var rl={admin:t.admin,manager:t.salesManager,sales:t.salesAgent,viewer:t.viewer};
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
        {[t.name,t.username,t.title,t.role,t.phone,t.monthlyTarget,"Last Seen",t.status,""].map(function(h){return <th key={h||"x"} style={{ textAlign:t.dir==="rtl"?"right":"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
      </tr></thead>
      <tbody>{p.users.map(function(u){var uid=gid(u);return <tr key={uid} style={{ borderBottom:"1px solid #F1F5F9" }}>
        <td style={{ padding:"11px 12px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:32, height:32, borderRadius:8, background:C.primary+"15", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:C.primary, flexShrink:0 }}>{u.name[0]}</div><div><div style={{ fontSize:12, fontWeight:600 }}>{u.name}</div><div style={{ fontSize:10, color:C.textLight }}>{u.email}</div></div></div></td>
        <td style={{ padding:"11px 12px", fontSize:12, fontFamily:"monospace" }}>{u.username}</td>
        <td style={{ padding:"11px 12px", fontSize:12 }}>{u.title}</td>
        <td style={{ padding:"11px 12px" }}><Badge bg={(rc[u.role]||"#94A3B8")+"15"} color={rc[u.role]||"#94A3B8"}>{rl[u.role]||u.role}</Badge></td>
        <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr" }}>{u.phone}</td>
        <td style={{ padding:"8px 12px" }}>
          {p.cu.role==="admin"
            ?<div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <input type="number" value={u.monthlyTarget||15} onChange={function(e){updateTarget(u,e.target.value);}} style={{ width:60, padding:"4px 8px", borderRadius:7, border:"1px solid #E2E8F0", fontSize:12 }}/>
              <button onClick={function(){var qt=getQTargets(uid);setQtModal({user:u,targets:{Q1:qt.Q1||0,Q2:qt.Q2||0,Q3:qt.Q3||0,Q4:qt.Q4||0}});}}
                title="Quarterly Targets"
                style={{ padding:"3px 8px", borderRadius:6, border:"1px solid "+C.accent, background:C.accent+"10", color:C.accent, fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>Q</button>
            </div>
            :<div>
              <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{(u.monthlyTarget||0).toLocaleString()}</div>
              <div style={{ display:"flex", gap:3, marginTop:3 }}>
                {["Q1","Q2","Q3","Q4"].map(function(q){var qt=getQTargets(uid);var v=qt[q]||0;return <span key={q} style={{ fontSize:9, padding:"1px 4px", borderRadius:3, background:"#F1F5F9", color:C.textLight }}>{q}:{v>0?(v/1000000).toFixed(1)+"M":"—"}</span>;})}
              </div>
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
        <td style={{ padding:"11px 12px" }}><Badge bg={u.active?"#DCFCE7":"#FEE2E2"} color={u.active?"#15803D":"#B91C1C"} onClick={function(){if(u.role!=="admin")toggleActive(u);}}>{u.active?t.active:t.inactive}</Badge></td>
        <td style={{ padding:"11px 12px" }}><div style={{display:"flex",gap:6,alignItems:"center"}}><button onClick={function(){setPwModal({userId:uid,userName:u.name});setPwForm({newPass:"",confirmPass:""});setPwMsg("");}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} title={t.changePassword}><KeyRound size={12} color={C.info}/></button>
              <button onClick={function(){setTeamModal({userId:uid,userName:u.name,teamId:u.teamId||"",teamName:u.teamName||"",reportsTo:u.reportsTo||""});}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} title="تعديل الفريق"><Users size={12} color="#8B5CF6"/></button><button onClick={function(){if(u.role!=="admin")del(uid);}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:u.role!=="admin"?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", opacity:u.role==="admin"?0.3:1 }}><Trash2 size={12} color={C.danger}/></button></div></td>
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
        <Btn outline onClick={function(){setQtModal(null);}} style={{ flex:1 }}>إلغاء</Btn>
        <Btn onClick={function(){saveQTargets(gid(qtModal.user),qtModal.targets).then(function(){setQtModal(null);});}} style={{ flex:1 }}>✅ حفظ</Btn>
      </div>
    </Modal>}
    {teamModal&&<Modal show={true} onClose={function(){setTeamModal(null);}} title={"👥 تعديل الفريق — "+teamModal.userName}>
      {/* reportsTo */}
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,marginBottom:5}}>Reports To (Direct Manager)</label>
        <select value={teamModal.reportsTo||""} onChange={function(e){setTeamModal(function(prev){return Object.assign({},prev,{reportsTo:e.target.value||null});});}}
          style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #E2E8F0",fontSize:13,background:"#fff",boxSizing:"border-box"}}>
          <option value="">— No (مدير رئيسي) —</option>
          {p.users.filter(function(u){return u.role==="manager"&&gid(u)!==teamModal.userId;}).map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name} ({u.title||"مدير"})</option>;})}
        </select>
        <div style={{fontSize:10,color:"#8B5CF6",marginTop:4}}>Empty = Top Manager. Set = Team Leader sees only direct team.</div>
      </div>
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
        <Inp label={t.title} value={nU.title} onChange={function(e){setNU(Object.assign({},nU,{title:e.target.value}));}}/>
        <Inp label={t.email} value={nU.email} onChange={function(e){setNU(Object.assign({},nU,{email:e.target.value}));}}/>
        <div style={{ gridColumn:"1/-1" }}><Inp label={t.phone} value={nU.phone} onChange={function(e){setNU(Object.assign({},nU,{phone:e.target.value}));}}/></div>
        <Inp label={t.monthlyTarget} type="number" value={nU.monthlyTarget} onChange={function(e){setNU(Object.assign({},nU,{monthlyTarget:Number(e.target.value)}));}}/>
      {(nU.role==="sales"||nU.role==="manager")&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
        <Inp label={"اسم الفريق"} value={nU.teamName||""} onChange={function(e){setNU(Object.assign({},nU,{teamName:e.target.value}));}} placeholder="e.g. Team A"/>
        <Inp label={"كود الفريق"} value={nU.teamId||""} onChange={function(e){setNU(Object.assign({},nU,{teamId:e.target.value}));}} placeholder="team-a"/>
      </div>}
        <div style={{ gridColumn:"1/-1" }}><Inp label={t.role} type="select" value={nU.role} onChange={function(e){setNU(Object.assign({},nU,{role:e.target.value}));}} options={[{value:"admin",label:t.admin},{value:"manager",label:t.salesManager},{value:"sales",label:t.salesAgent},{value:"viewer",label:t.viewer}]}/></div>
      </div>
      <div style={{ display:"flex", gap:10 }}><Btn outline onClick={function(){setShowAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn><Btn onClick={add} loading={saving} style={{ flex:1 }}>{t.add}</Btn></div>
    </Modal>
  </div>;
};

// ===== TEAM =====
// ===== REPORTS PAGE =====
var ReportsPage = function(p) {
  var t=p.t; var sc=STATUSES(t);
  var [period,setPeriod]=useState("monthly");
  var [exporting,setExporting]=useState(false);
  var pLabel={daily:"Today",weekly:"This Week",monthly:"This Month"};
  var ms={daily:86400000,weekly:604800000,monthly:2592000000}[period];
  var now=Date.now();
  var allLeads=p.leads.filter(function(l){return !l.archived;});
  var periodLeads=allLeads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt).getTime())<ms;});
  var periodDeals=allLeads.filter(function(l){return l.status==="DoneDeal"&&l.updatedAt&&(now-new Date(l.updatedAt).getTime())<ms;});
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
  var parseBudgetR=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var getQTargetsR=function(uid){var u=p.users.find(function(x){return gid(x)===uid;});if(u&&u.qTargets&&Object.keys(u.qTargets).length>0)return u.qTargets;try{return JSON.parse(localStorage.getItem("crm_qt_"+uid)||"{}");} catch(e){return {};}}
  var agentStats=salesUsers.map(function(u){
    var uid=gid(u);
    var uNew=periodLeads.filter(function(l){var a=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return a===uid&&l.source!=="Daily Request";});
    var uDailyReq=periodLeads.filter(function(l){var a=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return a===uid&&l.source==="Daily Request";});
    var uDeals=periodDeals.filter(function(l){var a=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return a===uid;});
    var uMeetingDone=allLeads.filter(function(l){var a=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return a===uid&&l.status==="MeetingDone"&&l.updatedAt&&(now-new Date(l.updatedAt).getTime())<ms;});
    var revenue=uDeals.reduce(function(s,d){return s+parseBudgetR(d.budget);},0);
    var qt=getQTargetsR(uid);
    var curQR=(function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
    var qTarget=qt[curQR]||0;
    var target=qTarget>0?qTarget:(u.monthlyTarget||0)*1000000;
    var prog=target>0?Math.min(100,Math.round((revenue/target)*100)):0;
    return{user:u,newL:uNew.length,dailyReq:uDailyReq.length,deals:uDeals.length,meetingDone:uMeetingDone.length,revenue:revenue,target:target,prog:prog};
  }).sort(function(a,b){return b.revenue-a.revenue;});
  var exportReport=async function(){
    setExporting(true);
    var XLSX=await new Promise(function(res){if(window.XLSX){res(window.XLSX);return;}var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";s.onload=function(){res(window.XLSX);};document.head.appendChild(s);});
    var rows=agentStats.map(function(a){return{"الموظف":a.user.name,"جدد":a.newL,"Daily Request":a.dailyReq,"Meeting Done":a.meetingDone,"Deals":a.deals,"الهدف":a.target,"نسبة":a.prog+"%"};});
    var ws=XLSX.utils.json_to_sheet(rows);var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"تقرير");
    XLSX.writeFile(wb,"تقرير_ARO_"+new Date().toISOString().slice(0,10)+".xlsx");setExporting(false);
  };
  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>📊 التقارير</h2>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {["daily","weekly","monthly"].map(function(p2){return <button key={p2} onClick={function(){setPeriod(p2);}} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid", borderColor:period===p2?C.accent:"#E2E8F0", background:period===p2?C.accent+"12":"#fff", color:period===p2?C.accent:C.textLight, fontSize:12, fontWeight:600, cursor:"pointer" }}>{pLabel[p2]}</button>;})}
        <Btn outline onClick={exportReport} loading={exporting} style={{ padding:"6px 12px", fontSize:12, color:C.success, borderColor:C.success }}><FileSpreadsheet size={13}/> Excel</Btn>
      </div>
    </div>
    <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
      <StatCard icon={Users} label={"جدد — "+pLabel[period]} value={periodLeads.length+""} c={C.info}/>
      <StatCard icon={DollarSign} label={"Deals — "+pLabel[period]} value={periodDeals.length+""} c={C.success}/>
      <StatCard icon={Target} label={"Total"} value={allLeads.length+""} c={C.accent}/>
      <StatCard icon={Activity} label={"معدل التحويل"} value={allLeads.length?Math.round((allLeads.filter(function(l){return l.status==="DoneDeal";}).length/allLeads.length)*100)+"%":"0%"} c={"#8B5CF6"}/>
    </div>
    <Card style={{ marginBottom:20 }}>
      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>🏆 أداء الفريق — {pLabel[period]}</h3>
      <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
          {["#","الموظف","جدد","Daily Req","Meeting Done","Deals","الإيراد","الهدف","نسبة الإنجاز"].map(function(h){return <th key={h} style={{ padding:"10px 12px", fontSize:11, fontWeight:700, color:C.textLight, textAlign:"right" }}>{h}</th>;})}
        </tr></thead>
        <tbody>{agentStats.map(function(a,i){return <tr key={gid(a.user)} style={{ borderBottom:"1px solid #F1F5F9", background:i===0?"#FFFBEB":"transparent" }}>
          <td style={{ padding:"12px", fontSize:16 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td>
          <td style={{ padding:"12px", fontWeight:700 }}>{a.user.name}</td>
          <td style={{ padding:"12px", color:C.info, fontWeight:600 }}>{a.newL}</td>
          <td style={{ padding:"12px", color:"#8B5CF6", fontWeight:600 }}>{a.dailyReq}</td>
          <td style={{ padding:"12px", color:"#F59E0B", fontWeight:600 }}>{a.meetingDone}</td>
          <td style={{ padding:"12px", color:C.success, fontWeight:700 }}>{a.deals}</td>
          <td style={{ padding:"12px", color:C.success, fontWeight:700 }}>{(a.revenue/1000000).toFixed(2)}M</td>
          <td style={{ padding:"12px", color:C.textLight }}>{a.target>0?(a.target/1000000).toFixed(2)+"M":"—"}</td>
          <td style={{ padding:"12px", minWidth:120 }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ flex:1, height:6, background:"#F1F5F9", borderRadius:3 }}><div style={{ height:"100%", width:a.prog+"%", borderRadius:3, background:a.prog>=100?C.success:a.prog>=50?C.accent:C.warning }}/></div><span style={{ fontSize:11, fontWeight:700, minWidth:32 }}>{a.prog}%</span></div></td>
        </tr>;})}
        </tbody>
      </table></div>
    </Card>
    <Card>
      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>📈 توزيع الLeads</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
        {sc.map(function(s){var cnt=allLeads.filter(function(l){return l.status===s.value;}).length;var pct=allLeads.length?Math.round((cnt/allLeads.length)*100):0;return cnt>0?<div key={s.value} style={{ padding:"14px", borderRadius:12, background:s.bg, border:"1px solid "+s.color+"30" }}><div style={{ fontSize:22, fontWeight:800, color:s.color }}>{cnt}</div><div style={{ fontSize:12, color:s.color, fontWeight:600, marginTop:2 }}>{s.label}</div><div style={{ fontSize:11, color:s.color+"99", marginTop:4 }}>{pct}%</div></div>:null;})}
      </div>
    </Card>
  </div>;
};

var TeamPage = function(p) {
  var t=p.t;
  var isAdmin=p.cu.role==="admin";
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
  var years=[curYear,curYear-1,curYear-2];
  var [viewYear,setViewYear]=useState(curYear);
  var [editQModal,setEditQModal]=useState(null);
  var [expandedManager,setExpandedManager]=useState(null); // uid of expanded manager

  // Build hierarchy: managers + their teams
  var managers = p.users.filter(function(u){return u.role==="manager"&&u.active;});
  var getSalesUnder = function(muid){
    return p.users.filter(function(u){
      return u.active && (u.role==="sales"||u.role==="manager") && String(u.reportsTo||"")===muid;
    });
  };

  // For non-admin manager: show only their own team
  var visibleManagers = isAdmin ? managers : managers.filter(function(m){return gid(m)===String(p.cu.id||"");});
  // Also show sales not under any manager (top-level sales)
  var topLevelSales = isAdmin ? p.users.filter(function(u){return u.role==="sales"&&u.active&&!u.reportsTo;}) : [];

  // Card for one member
  var MemberCard = function(mp){
    var a=mp.user; var uid=String(gid(a));
    var isManagerCard = a.role==="manager";
    // For manager card: get all team member IDs
    var teamUids = isManagerCard ? new Set(p.users.filter(function(u){
      var rt=u.reportsTo&&u.reportsTo._id?String(u.reportsTo._id):String(u.reportsTo||"");
      return rt===uid;
    }).map(function(u){return String(u._id);})) : null;
    var matchesAgent = function(d){
      var aid=String(d.agentId&&d.agentId._id?d.agentId._id:d.agentId||"");
      if(isManagerCard && teamUids) return aid===uid||teamUids.has(aid);
      return aid===uid;
    };
    var al=p.leads.filter(function(l){var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return String(aid)===uid&&!l.archived;});
    var calls=p.activities.filter(function(ac){var auid=ac.userId&&ac.userId._id?ac.userId._id:ac.userId;return String(auid)===uid&&ac.type==="call";}).length;
    var qt=getQTargets(uid);
    var qTarget=getEffectiveQTarget(a,p.users,viewQ);
    var qDeals=allDeals.filter(function(d){if(!matchesAgent(d))return false;var dd=d.updatedAt||d.createdAt;return dd&&getQ(dd)===viewQ&&new Date(dd).getFullYear()===viewYear;});
    var qRevenue=qDeals.reduce(function(s,d){return s+parseBudget(d.budget);},0);
    var qProg=qTarget>0?Math.min(100,Math.round((qRevenue/qTarget)*100)):0;
    var allAgentDeals=allDeals.filter(function(d){return matchesAgent(d);});
    var totalRevenue=allAgentDeals.reduce(function(s,d){return s+parseBudget(d.budget);},0);
    var isOnlineNow=a.lastSeen&&(Date.now()-new Date(a.lastSeen).getTime())<3*60*1000;
    var lastSeenStr=a.lastSeen?timeAgo(a.lastSeen,p.t):"Never logged in";
    return <Card key={uid} style={{ flex:"1 1 280px", maxWidth:360, overflow:"hidden", padding:0 }}>
      <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:18, textAlign:"center" }}>
        <div style={{ margin:"0 auto 8px", display:"inline-block" }}><Avatar name={a.name} size={48} online={isOnlineNow}/></div>
        <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{a.name}</div>
        <div style={{ color:"rgba(255,255,255,0.55)", fontSize:11, marginTop:2 }}>{a.title}</div>
        <div style={{ marginTop:4, fontSize:10, color:isOnlineNow?"#86EFAC":"rgba(255,255,255,0.45)", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:isOnlineNow?"#22C55E":"rgba(255,255,255,0.3)", display:"inline-block" }}/>
          {isOnlineNow?"Online now":"Last Seen: "+lastSeenStr}
        </div>
        {isAdmin&&<button onClick={function(){var qt=getQTargets(uid);setEditQModal({user:a,targets:{Q1:qt.Q1||0,Q2:qt.Q2||0,Q3:qt.Q3||0,Q4:qt.Q4||0}});}}
          style={{ marginTop:8, padding:"4px 12px", borderRadius:6, border:"none", background:"rgba(255,255,255,0.2)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}>🎯 Edit Targets</button>}
      </div>
      <div style={{ padding:"12px 14px" }}>
        <div style={{ marginBottom:10, padding:"8px 10px", background:"#F8FAFC", borderRadius:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:11, fontWeight:700 }}>{viewQ} Target</span>
            <span style={{ fontSize:10, color:C.textLight }}>{qTarget>0?qTarget.toLocaleString()+" EGP":"Not set"}</span>
          </div>
          <div style={{ height:6, background:"#E2E8F0", borderRadius:3, marginBottom:4 }}>
            <div style={{ height:"100%", width:qProg+"%", borderRadius:3, background:qProg>=100?C.success:qProg>=50?C.accent:C.warning, transition:"width 0.6s" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11, color:C.success, fontWeight:700 }}>{(qRevenue/1000000).toFixed(2)}M</span>
            <span style={{ fontSize:11, fontWeight:700, color:qProg>=100?C.success:C.accent }}>{qProg}%</span>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-around" }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:15, fontWeight:700 }}>{al.length}</div><div style={{ fontSize:10, color:C.textLight }}>Leads</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:15, fontWeight:700, color:C.success }}>{allAgentDeals.length}</div><div style={{ fontSize:10, color:C.textLight }}>Deals</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:12, fontWeight:700, color:C.accent }}>{(totalRevenue/1000000).toFixed(1)}M</div><div style={{ fontSize:10, color:C.textLight }}>Total</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:15, fontWeight:700, color:C.info }}>{calls}</div><div style={{ fontSize:10, color:C.textLight }}>Calls</div></div>
        </div>
      </div>
    </Card>;
  };

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{t.team}</h2>
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
      var mDeals=allDeals.filter(function(d){
        var allTeamIds=new Set([muid].concat(team.map(function(u){return gid(u);})));
        var aid=d.agentId&&d.agentId._id?String(d.agentId._id):String(d.agentId||"");
        var dd=d.updatedAt||d.createdAt; return dd&&getQ(dd)===viewQ&&new Date(dd).getFullYear()===viewYear&&allTeamIds.has(aid);
      });
      var mRev=mDeals.reduce(function(s,d){return s+parseBudget(d.budget);},0);
      var mTarget=getEffectiveQTarget(mgr,p.users,viewQ);
      var mProg=mTarget>0?Math.min(100,Math.round(mRev/mTarget*100)):0;
      var isOnline=mgr.lastSeen&&(Date.now()-new Date(mgr.lastSeen).getTime())<3*60*1000;
      return <div key={muid} style={{ marginBottom:16 }}>
        {/* Manager row - clickable */}
        <div onClick={function(){setExpandedManager(isExpanded?null:muid);}}
          style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", borderRadius:12, cursor:"pointer", marginBottom:isExpanded?10:0 }}>
          <Avatar name={mgr.name} size={40} online={isOnline}/>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{mgr.name}</div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11 }}>{mgr.title} — {team.length} member</div>
          </div>
          <div style={{ textAlign:"left", minWidth:100 }}>
            <div style={{ height:5, background:"rgba(255,255,255,0.2)", borderRadius:3, marginBottom:3, width:100 }}>
              <div style={{ height:"100%", width:mProg+"%", background:mProg>=100?"#22C55E":"#E8A838", borderRadius:3 }}/>
            </div>
            <div style={{ color:"rgba(255,255,255,0.8)", fontSize:10 }}>{(mRev/1000000).toFixed(1)}M / {mTarget>0?(mTarget/1000000).toFixed(1)+"M":"—"}</div>
          </div>
          <span style={{ color:"rgba(255,255,255,0.7)", fontSize:14 }}>{isExpanded?"▲":"▼"}</span>
        </div>
        {/* Team members expanded */}
        {isExpanded&&<div style={{ display:"flex", gap:12, flexWrap:"wrap", paddingRight:16 }}>
          <MemberCard user={mgr}/>
          {team.map(function(u){return <MemberCard key={gid(u)} user={u}/>;})}</div>}
      </div>;
    })}

    {/* Top-level sales (no manager) */}
    {topLevelSales.length>0&&<div>
      <div style={{ fontSize:12, fontWeight:700, color:C.textLight, marginBottom:10 }}>موظفون بدون مدير</div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {topLevelSales.map(function(a){return <MemberCard key={gid(a)} user={a}/>;})}
      </div>
    </div>}

    {/* Old fallback if no managers defined */}
    {visibleManagers.length===0&&<div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
      {p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;}).map(function(a){
        return <MemberCard key={gid(a)} user={a}/>;
      })}
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
        <Btn outline onClick={function(){setEditQModal(null);}} style={{ flex:1 }}>إلغاء</Btn>
        <Btn onClick={function(){saveQTargets(gid(editQModal.user),editQModal.targets);setEditQModal(null);}} style={{ flex:1 }}>✅ حفظ</Btn>
      </div>
    </Modal>}
  </div>;
};

// ===== REPORTS =====
var ReportsPage = function(p) {
  var t=p.t;
  var [rPeriod,setRPeriod]=useState("monthly");
  var [dailyRequests,setDailyRequests]=useState([]);
  useEffect(function(){
    apiFetch("/api/daily-requests","GET",null,p.token)
      .then(function(d){setDailyRequests(Array.isArray(d)?d:[]);})
      .catch(function(){setDailyRequests([]);});
  },[]);
  var sales=p.users.filter(function(u){return u.role==="sales"||u.role==="manager";});
  var normalLeads=p.leads.filter(function(l){return !l.archived&&l.source!=="Daily Request";});
  var convRate=normalLeads.length>0?Math.round(normalLeads.filter(function(l){return l.status==="DoneDeal";}).length/normalLeads.length*100):0;
  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>{t.reports}</h2>
    <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
      <StatCard icon={TrendingUp} label={t.conversionRate} value={convRate+"%"} c={C.success}/>
      <StatCard icon={Activity} label={t.totalCalls} value={p.activities.filter(function(a){return a.type==="call";}).length+""} c={C.info}/>
      <StatCard icon={DollarSign} label={t.doneDeals} value={normalLeads.filter(function(l){return l.status==="DoneDeal";}).length+""} c={C.accent}/>
      <StatCard icon={Users} label={t.totalLeads} value={normalLeads.length+""} c={C.primary}/>
    </div>
    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
      <Card style={{ flex:1, minWidth:280 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>{t.agentPerf}</h3>
        {(function(){
          var now2=Date.now();
          var ms2={daily:86400000,weekly:604800000,monthly:2592000000}[rPeriod];
          return <>
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              {["daily","weekly","monthly"].map(function(pp){var lbl={daily:"Today",weekly:"This Week",monthly:"This Month"}[pp];return <button key={pp} onClick={function(){setRPeriod(pp);}} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid", borderColor:rPeriod===pp?C.accent:"#E2E8F0", background:rPeriod===pp?C.accent+"12":"#fff", color:rPeriod===pp?C.accent:C.textLight, fontSize:11, cursor:"pointer" }}>{lbl}</button>;})}
            </div>
            {sales.map(function(a){var uid=gid(a);
              var curQR2=(function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
              var al=normalLeads.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.createdAt&&(now2-new Date(l.createdAt).getTime())<ms2;});
              var dailyReqCount=dailyRequests.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.createdAt&&(now2-new Date(l.createdAt).getTime())<ms2;}).length;
              var meetDone=p.leads.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.status==="MeetingDone"&&l.updatedAt&&(now2-new Date(l.updatedAt).getTime())<ms2;}).length+dailyRequests.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.status==="MeetingDone"&&l.updatedAt&&(now2-new Date(l.updatedAt).getTime())<ms2;}).length;
              var d=p.leads.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.status==="DoneDeal"&&!l.archived&&l.updatedAt&&(now2-new Date(l.updatedAt).getTime())<ms2;}).length;
              var cl=p.activities.filter(function(ac){var auid=String(ac.userId&&ac.userId._id?ac.userId._id:ac.userId||"");return auid===uid&&ac.type==="call"&&ac.createdAt&&(now2-new Date(ac.createdAt).getTime())<ms2;}).length;
              var rate=al.length>0?Math.round(d/al.length*100):0;
              var qt2=a.qTargets&&Object.keys(a.qTargets).length>0?a.qTargets:{};
              var qTarget2=getEffectiveQTarget(a,p.users,curQR2);
              var revenue2=p.leads.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.status==="DoneDeal"&&!l.archived&&l.updatedAt&&(now2-new Date(l.updatedAt).getTime())<ms2;}).reduce(function(s,l){return s+parseFloat((l.budget||"0").toString().replace(/,/g,""))||0;},0);
              var prog=qTarget2>0?Math.min(100,Math.round(revenue2/qTarget2*100)):0;
              return <div key={uid} style={{ padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <Avatar name={a.name} size={32}/>
                  <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{a.name}</div><div style={{ fontSize:10, color:C.textLight }}>{a.title}</div></div>
                  {[{v:al.length,l:t.leads,c:C.text},{v:dailyReqCount,l:"Requests",c:"#8B5CF6"},{v:meetDone,l:"Meeting",c:"#F59E0B"},{v:d,l:t.deals,c:C.success},{v:cl,l:t.calls,c:C.info},{v:rate+"%",l:"Conv.",c:C.accent}].map(function(s){return <div key={s.l} style={{ textAlign:"center", minWidth:32 }}><div style={{ fontSize:12, fontWeight:700, color:s.c }}>{s.v}</div><div style={{ fontSize:9, color:C.textLight }}>{s.l}</div></div>;})}
                </div>
                <div style={{ height:4, background:"#F1F5F9", borderRadius:2 }}><div style={{ height:"100%", width:prog+"%", background:prog>=100?C.success:C.accent, borderRadius:2 }}/></div>
                <div style={{ fontSize:9, color:C.textLight, marginTop:2 }}>Q Target: {(revenue2/1000000).toFixed(1)}M / {qTarget2>0?(qTarget2/1000000).toFixed(1)+"M":"—"}</div>
              </div>;
            })}
          </>;
        })()}
      </Card>
      <Card style={{ flex:1, minWidth:260 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>{t.sourcePerf}</h3>
        {SOURCES.map(function(src){
          var cnt=normalLeads.filter(function(l){return l.source===src;}).length;
          var won=normalLeads.filter(function(l){return l.source===src&&l.status==="DoneDeal";}).length;
          if(cnt===0)return null;
          var convR=cnt>0?Math.round(won/cnt*100):0;
          return <div key={src} style={{ padding:"9px 0", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ flex:1, fontSize:12, fontWeight:500 }}>{src}</span>
              <div style={{ textAlign:"center", minWidth:36 }}><div style={{ fontSize:12, fontWeight:700 }}>{cnt}</div><div style={{ fontSize:9, color:C.textLight }}>{t.leads}</div></div>
              <div style={{ textAlign:"center", minWidth:36 }}><div style={{ fontSize:12, fontWeight:700, color:C.success }}>{won}</div><div style={{ fontSize:9, color:C.textLight }}>{t.deals}</div></div>
              <div style={{ textAlign:"center", minWidth:40 }}><div style={{ fontSize:12, fontWeight:700, color:C.accent }}>{convR}%</div><div style={{ fontSize:9, color:C.textLight }}>Conv.</div></div>
            </div>
            {won>0&&<div style={{ height:3, background:"#F1F5F9", borderRadius:2, marginTop:5 }}><div style={{ height:"100%", width:convR+"%", background:convR>=20?C.success:C.accent, borderRadius:2 }}/></div>}
          </div>;
        })}
      </Card>
      <Card style={{ flex:1, minWidth:260 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>🏆 Deal Sources</h3>
        {(function(){
          var dealsBySource={};
          normalLeads.filter(function(l){return l.status==="DoneDeal";}).forEach(function(l){
            var src=l.source||"Unknown";
            if(!dealsBySource[src])dealsBySource[src]={cnt:0,rev:0};
            dealsBySource[src].cnt++;
            dealsBySource[src].rev+=parseFloat((l.budget||"0").toString().replace(/,/g,""))||0;
          });
          var sorted=Object.keys(dealsBySource).sort(function(a,b){return dealsBySource[b].cnt-dealsBySource[a].cnt;});
          if(sorted.length===0)return <div style={{ padding:24, textAlign:"center", color:C.textLight, fontSize:13 }}>No deals yet</div>;
          return sorted.map(function(src,i){
            var d=dealsBySource[src];
            var maxCnt=dealsBySource[sorted[0]].cnt;
            return <div key={src} style={{ padding:"9px 0", borderBottom:"1px solid #F1F5F9" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:14 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"📌"}</span>
                <span style={{ flex:1, fontSize:12, fontWeight:600 }}>{src}</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.success }}>{d.cnt} deal</div>
                  {d.rev>0&&<div style={{ fontSize:9, color:C.textLight }}>{(d.rev/1000000).toFixed(1)}M EGP</div>}
                </div>
              </div>
              <div style={{ height:3, background:"#F1F5F9", borderRadius:2, marginTop:5 }}><div style={{ height:"100%", width:Math.round(d.cnt/maxCnt*100)+"%", background:i===0?C.success:i===1?"#8B5CF6":C.accent, borderRadius:2 }}/></div>
            </div>;
          });
        })()}
      </Card>
    </div>
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
  var salesAgentsForSetting = p.users ? p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;}) : [];
  var [company,setCompany]=useState(function(){return getSaved('company','شركة ARO العقارية');});
  var [em,setEm]=useState(function(){return getSaved('email','admin@aro.com');});
  var [ph,setPh]=useState(function(){return getSaved('phone','01012345678');});
  var [reassignAgents,setReassignAgents]=useState(function(){
    try{return JSON.parse(localStorage.getItem('crm_set_reassign_agents')||'[]');}catch(e){return[];}
  });
  // Rotation durations (in hours)
  var [rotNoAnswerCount,setRotNoAnswerCount]=useState(function(){try{return Number(localStorage.getItem('crm_rot_na_count')||'2');}catch(e){return 2;}});
  var [rotNoAnswerHours,setRotNoAnswerHours]=useState(function(){try{return Number(localStorage.getItem('crm_rot_na_hours')||'1');}catch(e){return 1;}});
  var [rotNotIntDays,setRotNotIntDays]=useState(function(){try{return Number(localStorage.getItem('crm_rot_ni_days')||'1');}catch(e){return 1;}});
  var [rotNoActDays,setRotNoActDays]=useState(function(){try{return Number(localStorage.getItem('crm_rot_noact_days')||'2');}catch(e){return 2;}});
  var [rotCbDays,setRotCbDays]=useState(function(){try{return Number(localStorage.getItem('crm_rot_cb_days')||'1');}catch(e){return 1;}});
  var [rotHotDays,setRotHotDays]=useState(function(){try{return Number(localStorage.getItem('crm_rot_hot_days')||'2');}catch(e){return 2;}});
  var [saved,setSaved]=useState(false);
  var toggleAgent=function(uid){
    setReassignAgents(function(prev){
      return prev.includes(uid)?prev.filter(function(x){return x!==uid;}):[...prev,uid];
    });
  };
  var doSave=function(){
    try{
      localStorage.setItem('crm_set_company',company);
      localStorage.setItem('crm_set_email',em);
      localStorage.setItem('crm_set_phone',ph);
      localStorage.setItem('crm_set_reassign_agents',JSON.stringify(reassignAgents));
      localStorage.setItem('crm_rot_na_count',String(rotNoAnswerCount));
      localStorage.setItem('crm_rot_na_hours',String(rotNoAnswerHours));
      localStorage.setItem('crm_rot_ni_days',String(rotNotIntDays));
      localStorage.setItem('crm_rot_noact_days',String(rotNoActDays));
      localStorage.setItem('crm_rot_cb_days',String(rotCbDays));
      localStorage.setItem('crm_rot_hot_days',String(rotHotDays));
    }catch(e){}
    setSaved(true); setTimeout(function(){setSaved(false);},2500);
  };
  var rotInpStyle={width:60,padding:"4px 8px",borderRadius:7,border:"1px solid #E2E8F0",fontSize:13,textAlign:"center"};
  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>{t.settings}</h2>
    <Card style={{ maxWidth:560 }}>
      <Inp label={t.companyName} value={company} onChange={function(e){setCompany(e.target.value);}}/>
      <Inp label={t.email} value={em} onChange={function(e){setEm(e.target.value);}}/>
      <Inp label={t.phone} value={ph} onChange={function(e){setPh(e.target.value);}}/>

      {/* Rotation Agents */}
      <div style={{marginBottom:13}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,color:C.text,marginBottom:5}}>🔄 موظفو الإعادة التلقائية (الروتيشن)</label>
        <div style={{border:"1px solid #E2E8F0",borderRadius:10,padding:"8px 12px",background:"#fff",maxHeight:200,overflowY:"auto"}}>
          {salesAgentsForSetting.length===0&&<div style={{fontSize:12,color:C.textLight,padding:"6px 0"}}>No موظفين</div>}
          {salesAgentsForSetting.map(function(u){
            var uid=gid(u); var checked=reassignAgents.includes(uid);
            return <div key={uid} onClick={function(){toggleAgent(uid);}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 4px",cursor:"pointer",borderRadius:7,background:checked?C.accent+"10":"transparent",marginBottom:2}}>
              <div style={{width:18,height:18,borderRadius:5,border:"2px solid",borderColor:checked?C.accent:"#CBD5E1",background:checked?C.accent:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                {checked&&<span style={{color:"#fff",fontSize:11,fontWeight:700,lineHeight:1}}>✓</span>}
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{u.name}</div>
                <div style={{fontSize:11,color:C.textLight}}>{u.title}</div>
              </div>
            </div>;
          })}
        </div>
        <div style={{fontSize:11,color:C.textLight,marginTop:4}}>الLeads هيتوزعوا بس على الموظفين المحددين ({reassignAgents.length} محدد) — لو مفيش محدد مفيش روتيشن</div>
      </div>

      {/* Rotation Durations */}
      <div style={{marginBottom:13,padding:"14px 16px",background:"#F8FAFC",borderRadius:12,border:"1px solid #E8ECF1"}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:12}}>⚙️ مدد الروتيشن التلقائي</div>
        {[
          {label:"No Answer — عدد المرات قبل التحويل",val:rotNoAnswerCount,set:setRotNoAnswerCount,unit:"مرة"},
          {label:"No Answer — انتظر بعد آخر مرة",val:rotNoAnswerHours,set:setRotNoAnswerHours,unit:"ساعة"},
          {label:"Not Interested — يرجع بعد",val:rotNotIntDays,set:setRotNotIntDays,unit:"يوم"},
          {label:"بدون تواصل — يتحول بعد",val:rotNoActDays,set:setRotNoActDays,unit:"يوم"},
          {label:"CallBack فات موعده — يتحول بعد",val:rotCbDays,set:setRotCbDays,unit:"يوم"},
          {label:"Potential/HotCase/Meeting بدون أكشن — يتحول بعد",val:rotHotDays,set:setRotHotDays,unit:"يوم"},
        ].map(function(row){return <div key={row.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9,gap:10}}>
          <span style={{fontSize:12,color:C.text,flex:1}}>{row.label}</span>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <input type="number" min={1} max={30} value={row.val} onChange={function(e){row.set(Number(e.target.value));}} style={rotInpStyle}/>
            <span style={{fontSize:11,color:C.textLight}}>{row.unit}</span>
          </div>
        </div>;})}
      </div>

      <Inp label={t.language} type="select" value={p.lang} onChange={function(e){p.setLang(e.target.value);}} options={[{value:"ar",label:"عربي"},{value:"en",label:"English"}]}/>
      {saved&&<div style={{marginBottom:12,padding:"10px 14px",background:"#DCFCE7",borderRadius:10,color:"#15803D",fontSize:13,fontWeight:600}}>✅ تم الحفظ بنجاح</div>}
      <Btn onClick={doSave}>{t.save}</Btn>
    </Card>
  </div>;
};

// ===== KPIs PAGE (Sales only) =====
var KPIsPage = function(p) {
  var uid = String(p.cu.id);
  var parseBudget = function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var isTeamLeader = p.cu.role==="manager";
  // For manager/team leader: include all team deals in revenue calc
  var teamUids = isTeamLeader ? new Set((p.myTeamUsers||[]).map(function(u){return String(u._id);})) : null;
  var myLeads = p.leads.filter(function(l){
    var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");
    if(isTeamLeader && teamUids) return teamUids.has(aid)&&!l.archived&&l.source!=="Daily Request";
    return aid===uid&&!l.archived&&l.source!=="Daily Request";
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

  var qTarget = getEffectiveQTarget(myUser, p.users, selQ);

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
  var qRev = qDeals.reduce(function(s,d){return s+parseBudget(d.budget);},0);
  var qProg = qTarget>0?Math.min(100,Math.round(qRev/qTarget*100)):0;
  var convRate = qLeads.length>0?Math.round(qDeals.length/qLeads.length*100):0;

  var isOnlineNow = myUser.lastSeen&&(Date.now()-new Date(myUser.lastSeen).getTime())<3*60*1000;

  // Available years — current and past 2
  var years = [curYear, curYear-1, curYear-2];

  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>KPIs</h2>

    {/* Profile Card — centered */}
    <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
      <Card style={{ width:"100%", maxWidth:420, padding:0, overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:24, textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
            <Avatar name={p.cu.name} size={60} online={isOnlineNow}/>
          </div>
          <div style={{ color:"#fff", fontSize:16, fontWeight:700 }}>{p.cu.name}</div>
          <div style={{ color:"rgba(255,255,255,0.55)", fontSize:12, marginTop:2 }}>{p.cu.title}</div>
          <div style={{ marginTop:6, fontSize:10, color:isOnlineNow?"#86EFAC":"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:isOnlineNow?"#22C55E":"rgba(255,255,255,0.3)", display:"inline-block" }}/>
            {isOnlineNow?"Online now":""}
          </div>
        </div>
        {/* Overall stats */}
        <div style={{ display:"flex", padding:"12px 16px", gap:8 }}>
          {[
            {v:myLeads.length, l:"Total الLeads", c:C.info},
            {v:myDeals.length, l:"Total الDeals", c:C.success},
            {v:myActs.filter(function(a){return a.type==="call";}).length, l:"Total الCalls", c:C.accent},
            {v:myLeads.length>0?Math.round(myDeals.length/myLeads.length*100)+"%":"0%", l:"معدل التحويل", c:C.warning},
          ].map(function(s){return <div key={s.l} style={{ flex:1, textAlign:"center", padding:"8px 4px", background:"#F8FAFC", borderRadius:8 }}>
            <div style={{ fontSize:15, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:9, color:C.textLight, marginTop:2 }}>{s.l}</div>
          </div>;})}
        </div>
      </Card>
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
        {v:qLeads.length, l:"Leads جدد", c:C.accent, icon:"👤"},
        {v:convRate+"%", l:"معدل التحويل", c:C.warning, icon:"📊"},
      ].map(function(s){return <Card key={s.l} style={{ flex:"1 1 120px", textAlign:"center", padding:"16px 12px" }}>
        <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
        <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
        <div style={{ fontSize:11, color:C.textLight, marginTop:4 }}>{s.l}</div>
      </Card>;})}
    </div>


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

  var dayLabels = ["الإثنين","الثلاثاء","الأربعاء","الخميس","Friday","السبت","الأحد"];

  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>📅 تقويم الCalls</h2>

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
        <div style={{ fontSize:11, color:C.textLight, marginTop:4 }}>فات موعدها</div>
      </Card>
    </div>
  </div>;
};

// ===== MAIN APP =====
export default function CRMApp() {
  var [lang,setLang]=useState("ar");
  var [currentUser,setCurrentUser]=useState(null); var [token,setToken]=useState(null);
  var [page,setPage]=useState(null); // will be set after login
  var [leads,setLeads]=useState([]); var [users,setUsers]=useState([]);
  var [activities,setActivities]=useState([]); var [tasks,setTasks]=useState([]);
  var [leadFilter,setLeadFilter]=useState("all");
  var [showNotif,setShowNotif]=useState(false);
  var [dealNotifsSeenCount,setDealNotifsSeenCount]=useState(function(){try{return Number(localStorage.getItem("crm_deal_seen_count")||"0");}catch(e){return 0;}});
  var [dealNotifs,setDealNotifsRaw]=useState(function(){try{return JSON.parse(localStorage.getItem("crm_deal_notifs")||"[]");}catch(e){return[];}});
  var setDealNotifs=function(fn){setDealNotifsRaw(function(prev){var next=typeof fn==="function"?fn(prev):fn;try{localStorage.setItem("crm_deal_notifs",JSON.stringify(next));}catch(e){}return next;});};
  var [showDealNotif,setShowDealNotif]=useState(false);
  var [showRotNotif,setShowRotNotif]=useState(false);
  var [loading,setLoading]=useState(false); var [dataError,setDataError]=useState(null);
  var [isMobile,setIsMobile]=useState(window.innerWidth<768);
  var [sidebarOpen,setSidebarOpen]=useState(false);
  var [initSelected,setInitSelected]=useState(null);
  var [search,setSearch]=useState("");
  var [isOnline,setIsOnline]=useState(navigator.onLine);
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

  var t=TR[lang];


  // Server already filters leads by role/hierarchy — frontend just returns as-is
  var getVisibleLeads = function(allLeads, user, allUsers) {
    return allLeads; // server handles all filtering
  };

  var loadData=useCallback(async function(tok, userOverride){
    setLoading(true); setDataError(null);
    try {
      var results=await Promise.all([apiFetch("/api/leads","GET",null,tok),apiFetch("/api/users","GET",null,tok),apiFetch("/api/activities","GET",null,tok),apiFetch("/api/tasks","GET",null,tok)]);
      // Use userOverride if passed (avoids React state timing issue)
      var effectiveUser = userOverride || currentUser;
      // Restore phone2 from cache for leads that are missing it
      var leadsData = results[0]||[];
      try {
        var cache = JSON.parse(localStorage.getItem('phone2_cache')||'{}');
        leadsData = leadsData.map(function(l){
          var id = l._id ? String(l._id) : null;
          if (id && cache[id] && !l.phone2) return Object.assign({}, l, {phone2: cache[id]});
          return l;
        });
      } catch(e) {}
      setLeads(getVisibleLeads(leadsData, effectiveUser, results[1])); setUsers(results[1]); setActivities(results[2]); setTasks(results[3]);
    } catch(e){setDataError(e.message);}
    setLoading(false);
  },[]);

  // Load saved session on startup
  useEffect(function(){
    try {
      var saved = localStorage.getItem('crm_aro_session');
      if (saved) {
        var s = JSON.parse(saved);
        if (s.user && s.token) { setCurrentUser(s.user); setToken(s.token); loadData(s.token, s.user); }
      }
    } catch(e) {}
  }, []);

  var handleLogin=function(user,tok){
    setCurrentUser(user); setToken(tok); loadData(tok, user);
    var defaultPage = (user.role==="sales") ? "myday" : "dashboard";
    setPage(defaultPage);
    try { localStorage.setItem('crm_aro_session', JSON.stringify({user:Object.assign({},user),token:tok})); } catch(e){}
  };
  // ===== AUTO REFRESH every 5 minutes =====
  useEffect(function(){
    if(!token) return;
    var interval = setInterval(function(){ loadData(token, currentUser); }, 5*60*1000);
    return function(){ clearInterval(interval); };
  },[token]);

  // ===== SALES NOTIFICATIONS =====
  useEffect(function(){
    if(!token||!currentUser||currentUser.role!=="sales") return;
    var lastLeadCount = leads.filter(function(l){var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return aid===currentUser.id;}).length;

    // Notify on new lead assigned
    var checkNewLeads = function(){
      var myLeads = leads.filter(function(l){var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return aid===currentUser.id&&!l.archived;});
      if(myLeads.length>lastLeadCount){
        var newOnes = myLeads.slice(0, myLeads.length-lastLeadCount);
        newOnes.forEach(function(l){
          showBrowserNotif("👤 leads جديد وصلك", l.name+" — "+l.phone);
        });
      }
    };

    // Notify on upcoming callbacks (within 30 min)
    var checkCallbacks = function(){
      var now = Date.now();
      var soon = 30*60*1000;
      var myLeads = leads.filter(function(l){var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return aid===currentUser.id&&l.callbackTime&&!l.archived;});
      myLeads.forEach(function(l){
        var cbTime = new Date(l.callbackTime).getTime();
        var diff = cbTime - now;
        if(diff>0&&diff<=soon){
          var key="crm_cb_notif_"+gid(l);
          try{if(!localStorage.getItem(key)){localStorage.setItem(key,"1");showBrowserNotif("📞 موعد مكالمة قريب",l.name+" — خلال "+Math.round(diff/60000)+" دقيقة");}}catch(e){}
        } else if(diff<0){
          try{localStorage.removeItem("crm_cb_notif_"+gid(l));}catch(e){}
        }
      });
    };

    checkCallbacks();
    var cbInterval = setInterval(checkCallbacks, 60000);
    return function(){clearInterval(cbInterval);};
  },[token, currentUser, leads.length]);

  // ===== HEARTBEAT every 2 minutes =====
  useEffect(function(){
    if(!token) return;
    var hb=function(){try{apiFetch("/api/heartbeat","POST",null,token);}catch(e){}};
    hb();
    var interval=setInterval(hb,2*60*1000);
    return function(){clearInterval(interval);};
  },[token]);

  // ===== SMART AUTO ROTATION SYSTEM =====
  useEffect(function(){
    if(!token||!leads.length||!users.length) return;

    // Load rotation agents from settings — if none selected, NO rotation
    var getSavedAgents = function(){
      try{return JSON.parse(localStorage.getItem('crm_set_reassign_agents')||'[]');}catch(e){return[];}
    };

    // Load configurable durations from settings
    var getRotDurations = function(){
      try{return {
        naCount:  Number(localStorage.getItem('crm_rot_na_count')||'2'),
        naHours:  Number(localStorage.getItem('crm_rot_na_hours')||'1'),
        niDays:   Number(localStorage.getItem('crm_rot_ni_days')||'1'),
        noActDays:Number(localStorage.getItem('crm_rot_noact_days')||'2'),
        cbDays:   Number(localStorage.getItem('crm_rot_cb_days')||'1'),
        hotDays:  Number(localStorage.getItem('crm_rot_hot_days')||'2'),
      };}catch(e){return{naCount:2,naHours:1,niDays:1,noActDays:2,cbDays:1,hotDays:2};}
    };

    // Helper: pick agent from saved list with least active leads
    var pickAgent = function(excludeId){
      var savedIds = getSavedAgents();
      if(!savedIds.length) return null; // no agents = no rotation
      var agents = users.filter(function(u){return savedIds.includes(gid(u))&&(u.role==="sales"||u.role==="manager")&&u.active;});
      if(!agents.length) return null;
      var loads = agents.map(function(u){
        return {agent:u, cnt:leads.filter(function(l){
          var a=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;
          return a===gid(u)&&!l.archived;
        }).length};
      });
      loads.sort(function(a,b){return a.cnt-b.cnt;});
      var best = loads.find(function(x){return gid(x.agent)!==excludeId;});
      return best?best.agent:(loads[0].agent!==excludeId?loads[0].agent:null);
    };

    // Helper: send in-app notification to admins + browser notif
    var notifyAdmins = function(lead, fromName, toName, reason){
      var timeStr = new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
      var dateStr = new Date().toLocaleDateString("en-GB");
      showBrowserNotif("🔄 تحويل تلقائي", lead.name+" — من "+fromName+" إلى "+toName+" ("+reason+")");
      // Store in-app notification for admins
      try{
        var notifs = JSON.parse(localStorage.getItem("crm_rot_notifs")||"[]");
        notifs.unshift({id:Date.now(),leadName:lead.name,leadId:gid(lead),fromName:fromName,toName:toName,reason:reason,time:new Date().toISOString()});
        localStorage.setItem("crm_rot_notifs",JSON.stringify(notifs.slice(0,50)));
      }catch(e){}
    };

    // Helper: do rotation
    var doRotate = async function(lead, reason){
      var currentAgentId = lead.agentId&&lead.agentId._id?lead.agentId._id:lead.agentId;
      var fromName = lead.agentId&&lead.agentId.name?lead.agentId.name:"موظف";
      var targetAgent = pickAgent(currentAgentId);
      if(!targetAgent) return; // no valid target agent
      var targetAgentId = gid(targetAgent);
      if(targetAgentId===currentAgentId) return;
      var timeStr=new Date().toLocaleString("ar-EG");
      try{
        var updated = await apiFetch("/api/leads/"+gid(lead),"PUT",{
          agentId: targetAgentId,
          status: "NewLead",
          callbackTime: "",
          lastRotationAt: new Date().toISOString(),
          rotationCount: (lead.rotationCount||0)+1
        },token);
        await apiFetch("/api/activities","POST",{
          leadId:gid(lead),type:"reassign",
          note:"🔄 تحويل تلقائي | من: "+fromName+" ← إلى: "+targetAgent.name+" | السبب: "+reason+" | "+timeStr
        },token);
        setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(lead)?updated:l;});});
        notifyAdmins(lead,fromName,targetAgent.name,reason);
      }catch(e){console.error("Rotation error:",e);}
    };

    var HOUR = 60*60*1000;
    var DAY  = 24*60*60*1000;
    var now  = Date.now();

    var runChecks = async function(){
      var savedIds = getSavedAgents();
      if(!savedIds.length) return; // ← no agents configured = no rotation at all
      var dur = getRotDurations();

      var salesLeads = leads.filter(function(l){
        return !l.archived && l.source!=="Daily Request";
      });

      for(var i=0;i<salesLeads.length;i++){
        var l = salesLeads[i];
        var lid = gid(l);
        var lastAct = new Date(l.lastActivityTime||0).getTime();

        // Skip DoneDeal and EOI — never rotate
        if(l.status==="DoneDeal"||l.status==="EOI") continue;

        // Skip VIP leads — pinned, never rotate
        if(l.isVIP) continue;

        // ── RULE 1: NoAnswer x(naCount) → rotate after naHours ──────────
        if(l.status==="NoAnswer"){
          var naKey="crm_na_count_"+lid; var naTimeKey="crm_na_time_"+lid;
          var naCount=0; var naTime=0;
          try{naCount=Number(localStorage.getItem(naKey)||0);}catch(e){}
          try{naTime=Number(localStorage.getItem(naTimeKey)||0);}catch(e){}
          if(naCount>=dur.naCount && naTime>0 && (now-naTime)>=(dur.naHours*HOUR)){
            await doRotate(l,"No Answer "+dur.naCount+" مرات");
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
            await doRotate(l,"Not Interested — فرصة جديدة بعد "+dur.niDays+" يوم");
            try{localStorage.removeItem(niKey);}catch(e){}
            continue;
          }
        }

        // ── RULE 3: No activity +noActDays ─────────────────────────────
        if(l.status!=="NotInterested"&&l.status!=="DoneDeal"&&l.status!=="EOI"){
          if((now-lastAct)>=(dur.noActDays*DAY)){
            var noActKey="crm_noact2_"+lid; var noActDone=false;
            try{noActDone=localStorage.getItem(noActKey)==="1";}catch(e){}
            if(!noActDone){
              await doRotate(l,"بدون تواصل +"+dur.noActDays+" أيام");
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
              await doRotate(l,"CallBack فات موعده بـ "+dur.cbDays+" يوم");
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
              await doRotate(l,l.status+" — بدون أكشن "+dur.hotDays+" أيام");
              try{localStorage.setItem(hotKey,"1");}catch(e){}
              continue;
            }
          } else { try{localStorage.removeItem("crm_hotrot_"+lid);}catch(e){} }
        }
      }
    };

    runChecks();
    var rotInterval = setInterval(runChecks, 5*60*1000);
    return function(){clearInterval(rotInterval);};
  },[token, leads.length, users.length]);

  var handleLogout=function(){setCurrentUser(null);setToken(null);setLeads([]);setUsers([]);setActivities([]);setTasks([]);setPage("dashboard");setSidebarOpen(false);try{localStorage.removeItem('crm_aro_session');}catch(e){}};
  var nav=function(pg){setPage(pg||"dashboard");setInitSelected(null);};

  if(!currentUser) return <LoginPage t={t} onLogin={handleLogin}/>;
  if(loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#F0F2F5", fontFamily:"Cairo,sans-serif" }}><div style={{ textAlign:"center" }}><div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #E8ECF1", borderTopColor:C.accent, animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/><div style={{ color:C.textLight, fontSize:14 }}>{t.loading}</div></div></div>;
  if(dataError) return <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:16, fontFamily:"Cairo,sans-serif" }}><AlertCircle size={48} color={C.danger}/><div style={{ fontSize:16, color:C.danger, fontWeight:700 }}>{t.error}</div><div style={{ color:C.textLight }}>{dataError}</div><button onClick={function(){loadData(token);}} style={{ padding:"10px 24px", borderRadius:10, background:C.accent, border:"none", color:"#fff", fontWeight:700, cursor:"pointer" }}>{t.retry}</button></div>;

  var isAdmin=currentUser.role==="admin"||currentUser.role==="manager"; var isOnlyAdmin=currentUser.role==="admin";
  var currentPage=page||"dashboard";
  var titles={dashboard:t.dashboard,myday:t.myDay,kpis:"KPIs",calendar:"تقويم الCalls",leads:t.leads,dailyReq:t.dailyReq,deals:t.deals,eoi:"EOI",projects:t.projects,tasks:t.tasks,reports:t.reports,team:t.team,users:t.users,archive:t.archive,settings:t.settings};
  // Build team-filtered users for manager
  // Server already filters users by role/hierarchy — p.users IS the team
  var myTeamUsers = users;

  var sp={t,leads,setLeads,users,setUsers,activities,setActivities,tasks,setTasks,cu:currentUser,token,nav,setFilter:setLeadFilter,leadFilter,lang,setLang,search,isMobile,initSelected,setInitSelected,isOnlyAdmin,myTeamUsers,addDealNotif:function(n){setDealNotifs(function(prev){return [n].concat(prev).slice(0,50);});setShowDealNotif(false);try{localStorage.setItem("crm_notif_seen","0");}catch(e){}}}; 

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
      case "reports": return <ReportsPage {...sp}/>;
      case "team": return <TeamPage {...sp}/>;
      case "users": return <UsersPage {...sp}/>;
      case "archive": return <ArchivePage {...sp}/>;
      case "settings": return <SettingsPage {...sp} users={users}/>;
      default: return <DashboardPage {...sp}/>;
    }
  };

  return <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Cairo','Segoe UI',Tahoma,sans-serif", direction:t.dir }}>
    <style>{"* { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; } input::placeholder, textarea::placeholder { color: #94A3B8; } @keyframes spin { to { transform: rotate(360deg); } }"}</style>
    <Sidebar active={currentPage} setActive={setPage} t={t} cu={currentUser} onLogout={handleLogout} isMobile={isMobile} open={sidebarOpen} onClose={function(){setSidebarOpen(false);}}/>
    <div style={{ flex:1, marginRight:!isMobile&&t.dir==="rtl"?240:0, marginLeft:!isMobile&&t.dir==="ltr"?240:0, minHeight:"100vh", display:"flex", flexDirection:"column", minWidth:0 }}>
      <QuickPhoneSearch leads={leads} t={t} onSelect={function(lead){setPage("leads");setInitSelected(lead);}}/>
      {!isOnline&&<div style={{ background:"#FEF3C7", color:"#B45309", padding:"8px 16px", fontSize:12, fontWeight:600, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        ⚠️ أنت غير Online بالإنترنت — البيانات لن تُحفظ حتى يعود الاتصال
      </div>}
      <Header title={titles[currentPage]||""} t={t} leads={leads} lang={lang} setLang={setLang} showNotif={showNotif} setShowNotif={setShowNotif} search={search} setSearch={setSearch} isMobile={isMobile} onMenu={function(){setSidebarOpen(true);}} onLeadClick={function(l){setInitSelected(l);setPage("leads");}} dealNotifs={dealNotifs} setDealNotifs={setDealNotifs} showDealNotif={showDealNotif} setShowDealNotif={setShowDealNotif} cu={currentUser} isAdmin={isAdmin} showRotNotif={showRotNotif} setShowRotNotif={setShowRotNotif} dailyRequests={[]} unseenDeals={dealNotifs.length-dealNotifsSeenCount>0?dealNotifs.length-dealNotifsSeenCount:0} onDealNotifSeen={function(){setDealNotifsSeenCount(dealNotifs.length);try{localStorage.setItem("crm_deal_seen_count",String(dealNotifs.length));}catch(e){}}}/>
      <div style={{ flex:1 }}>{renderPage()}</div>
    </div>
  </div>;
}
