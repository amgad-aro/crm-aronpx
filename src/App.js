import { useState, useEffect, useCallback, useRef } from "react";

import {
  Search, Bell, Plus, Phone, Calendar, Building, Users, BarChart3,
  Settings, Home, Briefcase, Target, TrendingUp, UserPlus, CheckCircle,
  Activity, Layers, DollarSign, X, Lock, Globe, LogOut, Eye, EyeOff,
  Trash2, AlertCircle, Menu, Upload, MessageSquare, ChevronRight,
  ClipboardList, Edit, Archive, Award, Zap, RotateCcw, ExternalLink, KeyRound, FileSpreadsheet
} from "lucide-react";

/* ========== CRM ARO v7 — Complete Edition ========== */

const API = "https://crm-aro-api-production.up.railway.app";

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
    login: "تسجيل الدخول", loginBtn: "دخول", loginError: "اسم الدخول أو كلمة المرور غلط",
    username: "اسم الدخول", password: "كلمة المرور", logout: "تسجيل خروج",
    dashboard: "الرئيسية", leads: "العملاء", deals: "الصفقات", projects: "المشاريع",
    tasks: "المهام", reports: "التقارير", team: "فريق المبيعات", users: "المستخدمين",
    units: "الوحدات", settings: "الإعدادات", channels: "القنوات", dailyReq: "Daily Request",
    archive: "الأرشيف",
    search: "بحث...",
    all: "الكل", totalLeads: "إجمالي العملاء", newLeads: "جدد",
    activeDeals: "صفقات نشطة", doneDeals: "تم البيع",
    addLead: "إضافة عميل", addUser: "إضافة مستخدم", addTask: "إضافة مهمة", addRequest: "إضافة رقم",
    name: "الاسم", phone: "الهاتف", phone2: "هاتف إضافي", email: "الإيميل", budget: "الميزانية",
    project: "المشروع", source: "المصدر", agent: "الموظف",
    status: "الحالة", cancel: "إلغاء", save: "حفظ", add: "إضافة", edit: "تعديل",
    callbackTime: "موعد المكالمة", notes: "ملاحظات",
    changeStatus: "تغيير الحالة", assignTo: "تعيين لـ",
    lastActivity: "آخر نشاط", title: "المسمى الوظيفي", role: "الصلاحية",
    active: "نشط", inactive: "غير نشط",
    admin: "مدير نظام", salesManager: "مدير مبيعات", salesAgent: "موظف مبيعات", viewer: "مشاهد",
    potential: "Potential", hotCase: "Hot Case", callBack: "Call Back", notInterested: "Not Interested",
    noAnswer: "No Answer", doneDeal: "Done Deal", meetingDone: "Meeting Done",
    connected: "متصل", disconnected: "غير متصل",
    conversionRate: "معدل التحويل", totalCalls: "المكالمات",
    todayActivities: "أنشطة اليوم", callReminder: "تنبيهات",
    available: "متاح", reserved: "محجوز", sold: "مباع",
    language: "اللغة", calls: "مكالمات", meetings: "اجتماعات", followups: "متابعات",
    taskTitle: "عنوان المهمة", taskType: "النوع", taskTime: "الوقت", relatedLead: "العميل",
    sourcePerf: "أداء المصادر", leadsByStatus: "العملاء حسب الحالة",
    agentPerf: "أداء الموظفين", companyName: "اسم الشركة",
    welcome: "مرحباً", myLeads: "عملائي", allLeads: "كل العملاء",
    pending: "متبقية", ago: "منذ", minutes: "دقيقة", hours: "ساعة", days: "يوم", just: "الآن",
    loading: "جاري التحميل...", error: "خطأ في الاتصال", retry: "إعادة المحاولة",
    deleteConfirm: "هل أنت متأكد؟", archiveConfirm: "أرشفة العميل؟ يمكن استعادته لاحقاً",
    logActivity: "تسجيل نشاط",
    statusComment: "سبب تغيير الحالة (مطلوب)", statusCommentPH: "اكتب ملاحظة عن هذا التغيير...",
    commentRequired: "⚠️ لازم تكتب ملاحظة قبل تغيير الحالة",
    importExcel: "استيراد Excel", importDone: "تم الاستيراد", importErr: "خطأ — تأكد من الأعمدة: name, phone",
    activityLog: "سجل الأنشطة", clientHistory: "تاريخ العميل",
    duplicateFound: "⚠️ الرقم ده موجود بالفعل!", duplicateClient: "عميل موجود بنفس الرقم",
    monthlyTarget: "التارجت الشهري", myDay: "يومي",
    bulkReassign: "تحويل جماعي", selectAll: "تحديد الكل", reassignTo: "تحويل لـ",
    whatsapp: "واتساب", call: "اتصال",
    propertyType: "نوع العقار", area: "المنطقة",
    totalRequests: "إجمالي الأرقام",
    restore: "استعادة",
    overdue: "متأخرون",
    noActivity: "بدون نشاط +3 أيام",
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
    confirmPassword: "تأكيد كلمة المرور الجديدة",
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
    bulkReassign: "Bulk Reassign", selectAll: "Select All", reassignTo: "Reassign To",
    whatsapp: "WhatsApp", call: "Call",
    propertyType: "Property Type", area: "Area",
    totalRequests: "Total Numbers",
    restore: "Restore",
    overdue: "Overdue",
    noActivity: "No activity +3 days",
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
  { value: "NewLead",      label: t.lang==="ar"?"وارد جديد":"New Lead",   bg: "#F0FDF4", color: "#16A34A" },
  { value: "Potential",    label: t.lang==="ar"?"Potential":"Potential",  bg: "#EEF2FF", color: "#6366F1" },
  { value: "HotCase",      label: t.hotCase,                               bg: "#FEE2E2", color: "#DC2626" },
  { value: "CallBack",     label: t.callBack,                              bg: "#FEF3C7", color: "#B45309" },
  { value: "MeetingDone",  label: t.meetingDone,                           bg: "#F3E8FF", color: "#7C3AED" },
  { value: "NotInterested",label: t.notInterested,                         bg: "#F1F5F9", color: "#64748B" },
  { value: "NoAnswer",     label: t.noAnswer,                              bg: "#E0E7FF", color: "#4338CA" },
  { value: "DoneDeal",     label: t.doneDeal,                              bg: "#DCFCE7", color: "#15803D" },
]; };

var PROJECTS = [
  "العاصمة الإدارية", "المستقبل سيتي", "التجمع الخامس", "الشروق", "6 أكتوبر",
  "بالم هيلز", "ماونتن فيو", "سوديك ايست", "الرحاب", "مدينتي"
];
var SOURCES = ["Facebook", "Instagram", "TikTok", "WhatsApp", "Google Ads", "Referral", "Walk In", "Website"];
var PROP_TYPES = ["شقة", "دوبلكس", "تاون هاوس", "فيلا", "محل تجاري", "مكتب"];

var gid = function(o) { return o && (o._id || o.id); };

// Mask phone: show first 4 + last 2, rest as *
var maskPhone = function(phone) {
  if (!phone) return "";
  if (phone.length <= 6) return phone;
  var shown = phone.slice(0,4);
  var end = phone.slice(-2);
  var masked = "*".repeat(phone.length - 6);
  return shown + masked + end;
};

// Format budget with commas
var fmtMoney = function(v) {
  if (!v) return "";
  var num = v.toString().replace(/[^0-9]/g,"");
  if (!num) return v;
  return Number(num).toLocaleString("en-US");
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
  return { name: g("name","الاسم","اسم العميل"), phone: g("phone","الهاتف","موبايل","رقم"), email: g("email","الإيميل"), budget: g("budget","الميزانية"), project: g("project","المشروع") || PROJECTS[0], source: g("source","المصدر") || "Facebook", notes: g("notes","ملاحظات") };
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
  var [err, setErr] = useState(false);
  var [saving, setSaving] = useState(false);
  var sc = STATUSES(p.t); var ns = sc.find(function(s){return s.value===p.newStatus;});
  // Callback mandatory for: CallBack, NoAnswer, HotCase, MeetingDone, Potential
  var needsCb = ["CallBack","NoAnswer","HotCase","MeetingDone","Potential"].includes(p.newStatus);
  var isReject = p.newStatus==="NotInterested";
  var isNewLead = p.newStatus==="NewLead";
  useEffect(function(){setComment("");setCbTime("");setErr(false);},[p.show]);
  var submit = async function() {
    if (needsCb && !cbTime) { alert("اختار موعد المكالمة القادمة (مطلوب)"); return; }
    if (!isNewLead && !isReject && needsCb && !comment.trim()) { setErr(true); return; }
    if (!isNewLead && !isReject && !needsCb && !comment.trim()) { setErr(true); return; }
    setSaving(true); await p.onConfirm(comment.trim(), cbTime); setSaving(false); setComment(""); setCbTime(""); setErr(false);
  };
  return <Modal show={p.show} onClose={p.onClose} title={p.t.changeStatus}>
    {ns && <div style={{ marginBottom:14, padding:"10px 14px", background:ns.bg, borderRadius:10, display:"flex", alignItems:"center", gap:8 }}><span style={{ width:10, height:10, borderRadius:"50%", background:ns.color }}/><span style={{ fontSize:14, fontWeight:600, color:ns.color }}>{ns.label}</span></div>}
    {!isNewLead && <div style={{ marginBottom:12 }}>
      <Inp label={"📅 موعد المكالمة القادمة "+(needsCb?"(مطلوب)":"(اختياري)")} type="datetime-local" value={cbTime} onChange={function(e){setCbTime(e.target.value);}} req={needsCb}/>
      {cbTime&&<div style={{ fontSize:11, color:"#6366F1", marginTop:-8, marginBottom:10 }}>🔔 سيتم تذكيرك قبل الموعد بـ 15 دقيقة</div>}
    </div>}
    {isReject && <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:12, fontWeight:600, marginBottom:8, color:"#EF4444" }}>سبب الرفض:</div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
        {["السعر مرتفع","المنطقة مش مناسبة","اشترى من مكان تاني","مش جاهز دلوقتي","مش مهتم خالص","سبب تاني"].map(function(reason){
          return <button key={reason} onClick={function(){setComment(reason);}} style={{ padding:"8px 12px", borderRadius:8, border:"1px solid", borderColor:comment===reason?"#EF4444":"#E2E8F0", background:comment===reason?"#FEF2F2":"#fff", color:comment===reason?"#EF4444":"#64748B", fontSize:12, cursor:"pointer", textAlign:"right" }}>{reason}</button>;
        })}
      </div>
    </div>}
    {!isNewLead && <Inp label={isReject?"ملاحظة إضافية (اختياري)":p.t.statusComment} type="textarea" placeholder={p.t.statusCommentPH} value={comment} onChange={function(e){setComment(e.target.value);setErr(false);}} req={!isReject}/>}
    {err && <div style={{ color:C.danger, fontSize:12, marginBottom:12, padding:"8px 12px", background:"#FEF2F2", borderRadius:8 }}>{p.t.commentRequired}</div>}
    <div style={{ display:"flex", gap:10 }}><Btn outline onClick={p.onClose} style={{ flex:1 }}>{p.t.cancel}</Btn><Btn onClick={submit} loading={saving} style={{ flex:1 }}>{p.t.save}</Btn></div>
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
  var t = p.t; var isAdmin = p.cu.role==="admin"||p.cu.role==="manager";
  var items = [
    {id:"dashboard",icon:Home,label:t.dashboard},
    {id:"leads",icon:Users,label:t.leads},
    {id:"dailyReq",icon:ClipboardList,label:t.dailyReq},
    {id:"deals",icon:Briefcase,label:t.deals},
    {id:"tasks",icon:CheckCircle,label:t.tasks},
    isAdmin&&{id:"reports",icon:BarChart3,label:t.reports},
    isAdmin&&{id:"team",icon:UserPlus,label:t.team},
    isAdmin&&{id:"users",icon:Lock,label:t.users},
    isAdmin&&{id:"archive",icon:Archive,label:t.archive},
    isAdmin&&{id:"settings",icon:Settings,label:t.settings},
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
  var t = p.t;
  var upcoming = p.leads.filter(function(l){return l.callbackTime&&l.status!=="DoneDeal"&&l.status!=="NotInterested"&&!l.archived;});
  var notifRef = useRef(null);
  useEffect(function(){
    if (!p.showNotif) return;
    var fn=function(e){if(notifRef.current&&!notifRef.current.contains(e.target))p.setShowNotif(false);};
    document.addEventListener("mousedown",fn); return function(){document.removeEventListener("mousedown",fn);};
  },[p.showNotif]);
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
      <div style={{ position:"relative" }} ref={notifRef}>
        <button onClick={function(){p.setShowNotif(!p.showNotif);}} style={{ width:36, height:36, borderRadius:9, border:"1px solid #E8ECF1", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }}>
          <Bell size={16} color={C.textLight}/>
          {upcoming.length>0&&!p.showNotif&&<span style={{ position:"absolute", top:4, right:4, width:14, height:14, borderRadius:"50%", background:C.danger, color:"#fff", fontSize:8, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{upcoming.length}</span>}
        </button>
        {p.showNotif&&<div style={{ position:"absolute", top:44, right:0, width:290, background:"#fff", borderRadius:14, boxShadow:"0 12px 48px rgba(0,0,0,0.15)", border:"1px solid #E8ECF1", zIndex:200, maxHeight:360, overflowY:"auto" }}>
          <div style={{ padding:"13px 16px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:700, fontSize:13 }}>{t.callReminder} ({upcoming.length})</span>
            <button onClick={function(){p.setShowNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex" }}><X size={14}/></button>
          </div>
          {upcoming.length===0&&<div style={{ padding:24, textAlign:"center", color:C.textLight, fontSize:13 }}>لا يوجد تنبيهات</div>}
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

  // Format budget with commas
  var fmtBudget = function(v) {
    var digits = v.replace(/[^0-9]/g,"");
    if (!digits) return "";
    return Number(digits).toLocaleString("en-US");
  };

  var submit = async function() {
    if (!form.name||!form.phone) return;
    setSaving(true);
    try {
      var sendStatus = (form.status||"Potential") === "NewLead" ? "Potential" : form.status;
      var payload = Object.assign({}, form, { source: isReq?"Daily Request":form.source, agentId: form.agentId||(salesUsers[0]?gid(salesUsers[0]):p.cu.id), status: p.editId?form.status:sendStatus });
      var result = p.editId
        ? await apiFetch("/api/leads/"+p.editId, "PUT", payload, p.token)
        : await apiFetch("/api/leads", "POST", payload, p.token);
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
      <Inp label={t.budget+" (مثال: 1,000,000)"} value={form.budget} onChange={function(e){upd("budget",fmtBudget(e.target.value));}} placeholder="0"/>
    </div>
    <Inp label={t.project} value={form.project||""} onChange={function(e){upd("project",e.target.value);}} placeholder="اكتب اسم المشروع"/>
    {!isReq&&<Inp label={t.source} type="select" value={form.source} onChange={function(e){upd("source",e.target.value);}} options={SOURCES.map(function(x){return{value:x,label:x};})}/>}
    {isAdmin&&<Inp label={t.agent} type="select" value={form.agentId} onChange={function(e){upd("agentId",e.target.value);}} options={[{value:"",label:"- اختر -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name+" - "+u.title};}))}/>}
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


// ===== WHATSAPP TEMPLATES =====
var WA_TEMPLATES_AR = [
  { id:1, label:"ترحيب", text:"أهلاً {name} 👋\nأنا {agent} من شركة ARO العقارية\nشكراً لاهتمامك بمشروع {project}\nمتى يناسبك نتكلم؟" },
  { id:2, label:"متابعة", text:"أهلاً {name}\nبتواصل معاكم بخصوص عرضنا على {project}\nهل عندك وقت نتكلم اليوم؟ 🏠" },
  { id:3, label:"عرض خاص", text:"🎯 عرض خاص لـ {name}\nلدينا وحدات محدودة في {project}\nبسعر مميز - تواصل معنا الآن! 📞" },
  { id:4, label:"تأكيد موعد", text:"أهلاً {name} 😊\nبتذكيرك بموعدنا غداً\nنتطلع لنراك! ✅" },
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
    "الحالة": l.status || "",
    "المصدر": l.source || "",
    "الميزانية": l.budget || "",
    "الموظف": getAgentName(l),
    "VIP": l.isVIP ? "نعم" : "",
    "ملاحظات": l.notes || "",
    "موعد المكالمة": l.callbackTime ? l.callbackTime.slice(0,16).replace("T"," ") : "",
    "آخر نشاط": l.lastActivityTime ? new Date(l.lastActivityTime).toLocaleDateString("ar-EG") : "",
    "تاريخ الإضافة": l.createdAt ? new Date(l.createdAt).toLocaleDateString("ar-EG") : "",
  };});
  var ws = XLSX.utils.json_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "العملاء");
  XLSX.writeFile(wb, (filename || "leads") + "_" + new Date().toISOString().slice(0,10) + ".xlsx");
};


var callbackColor = function(cbTime) {
  if (!cbTime) return null;
  var diff = new Date(cbTime).getTime() - Date.now();
  var mins = diff / 60000;
  if (mins < 0) return { bg:"#FEE2E2", color:"#DC2626", label:"⚠️ فات الموعد" };
  if (mins < 60) return { bg:"#FEF3C7", color:"#D97706", label:"🔔 خلال ساعة" };
  if (mins < 1440) return { bg:"#DCFCE7", color:"#15803D", label:"✅ اليوم" };
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
      {q.length>0&&q.length<4&&<div style={{ fontSize:12, color:"#94A3B8", textAlign:"center", marginBottom:10 }}>اكتب على الأقل 4 أرقام</div>}
      {results.length===0&&q.length>=4&&<div style={{ fontSize:13, color:"#94A3B8", textAlign:"center", padding:20 }}>مفيش نتائج</div>}
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
            <a href={"https://wa.me/2"+l.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ flex:1, padding:"6px", borderRadius:8, background:"#DCFCE7", color:"#25D366", fontSize:12, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>💬 واتساب</a>
          </div>
        </div>;
      })}
    </div>
  </div>;
};

// ===== PHONE CELL WITH MASKING =====
var PhoneCell = function(p) {
  var [revealed, setRevealed] = useState(false);
  var t = p.t;
  return <div onMouseEnter={function(){setRevealed(true);}} onMouseLeave={function(){setRevealed(false);}}>
    <div style={{ fontWeight:600, color:C.text, letterSpacing: revealed?0:1 }}>{revealed?p.phone:maskPhone(p.phone)}</div>
    {p.phone2&&<div style={{ fontSize:10, color:C.textLight, marginTop:1 }}>{revealed?p.phone2:maskPhone(p.phone2)}</div>}
    <div style={{ display:"flex", gap:4, marginTop:3 }}>
      <a href={"tel:"+p.phone} onClick={function(e){e.stopPropagation();}} style={{ fontSize:10, color:C.success, textDecoration:"none", display:"flex", alignItems:"center", gap:2 }}><Phone size={9}/> {t.call}</a>
      <a href={"https://wa.me/2"+p.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ fontSize:10, color:"#25D366", textDecoration:"none", display:"flex", alignItems:"center", gap:2 }}>💬 {t.whatsapp}</a>
    </div>
    {!revealed&&<div style={{ fontSize:9, color:C.textLight, marginTop:1 }}>🔒 مرّر للإظهار</div>}
  </div>;
};

// ===== LEADS PAGE =====
var LeadsPage = function(p) {
  var t = p.t; var sc = STATUSES(t);
  var isAdmin = p.cu.role==="admin"||p.cu.role==="manager";
  var salesUsers = p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
  var isReq = !!p.isRequest;

  var allVisible = p.leads.filter(function(l){ return !l.archived && (isReq?l.source==="Daily Request":l.source!=="Daily Request"); });
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
  var [selected2, setSelected2] = useState([]); // bulk select
  var [showBulk, setShowBulk] = useState(false); var [bulkAgent, setBulkAgent] = useState("");
  var [showWaTemplates, setShowWaTemplates] = useState(false);
  var [waLead, setWaLead] = useState(null);
  var [showQuickAdd, setShowQuickAdd] = useState(false);
  var [quickForm, setQuickForm] = useState({name:"",phone:"",project:PROJECTS[0],source:"Facebook"});
  var [quickSaving, setQuickSaving] = useState(false);
  var [notifGranted, setNotifGranted] = useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  var [vipFilter, setVipFilter] = useState(false);
  var [agentFilter, setAgentFilter] = useState("");
  var [sortBy, setSortBy] = useState("lastActivity");
  var fileRef = useRef(null);

  useEffect(function(){ if(p.initSelected){setSelected(p.initSelected);} },[p.initSelected]);

  var getAgentName = function(l){ if(!l.agentId)return"-"; if(l.agentId.name)return l.agentId.name; var u=p.users.find(function(x){return gid(x)===l.agentId;}); return u?u.name:"-"; };

  var reqStatus = function(lid, st) {
    if (st === "DoneDeal") {
      if (!window.confirm("⚠️ هل أنت متأكد إن الصفقة اتعملت؟ مش هتقدر ترجع!")) return;
    }
    setPendingStatus({leadId:lid,newStatus:st}); setShowStatusComment(true);
  };

  var confirmStatus = async function(comment) {
    if(!pendingStatus) return;
    try {
      var updated = await apiFetch("/api/leads/"+pendingStatus.leadId,"PUT",{status:pendingStatus.newStatus},p.token);
      await apiFetch("/api/activities","POST",{leadId:pendingStatus.leadId,type:"status_change",note:"["+pendingStatus.newStatus+"] "+comment},p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===pendingStatus.leadId?updated:l;});});
      if(selected&&gid(selected)===pendingStatus.leadId) setSelected(updated);
      p.setActivities(function(prev){return [{_id:Date.now(),userId:{name:p.cu.name},leadId:{_id:pendingStatus.leadId,name:selected?selected.name:""},type:"status_change",note:"["+pendingStatus.newStatus+"] "+comment,createdAt:new Date().toISOString()}].concat(prev);});
    } catch(e){alert(e.message);}
    setShowStatusComment(false); setPendingStatus(null); setShowStatusPicker(false);
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
      var agId=salesUsers[0]?gid(salesUsers[0]):p.cu.id;
      var created=[]; for(var i=0;i<toImport.length;i++){try{var lead=await apiFetch("/api/leads","POST",Object.assign({agentId:agId,source:isReq?"Daily Request":toImport[i].source},toImport[i]),p.token);created.push(lead);}catch(ex){}}
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
      <div style={{ marginBottom:14, padding:"10px 14px", background:"#F0F9FF", borderRadius:10, fontSize:13 }}>تم تحديد <b>{selected2.length}</b> عميل</div>
      <Inp label={t.reassignTo} type="select" value={bulkAgent} onChange={function(e){setBulkAgent(e.target.value);}} options={[{value:"",label:"- اختر موظف -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name+" - "+u.title};}))}/>
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
        {selected2.length>0&&<Btn outline onClick={function(){
          var selectedLeads=filtered.filter(function(l){return selected2.includes(gid(l));});
          var msg=encodeURIComponent("أهلاً، نحن من شركة ARO العقارية\nلدينا عروض مميزة على مشاريعنا\nتواصل معنا للمزيد 🏠");
          selectedLeads.forEach(function(l){window.open("https://wa.me/2"+l.phone.replace(/^0/,"")+"?text="+msg,"_blank");});
        }} style={{ padding:"7px 11px", fontSize:12, color:"#25D366", borderColor:"#25D366" }}>💬 {t.bulkWhatsApp} ({selected2.length})</Btn>}
        <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" onChange={handleImport} style={{ display:"none" }}/>
        {isAdmin&&<Btn outline onClick={function(){fileRef.current.click();}} loading={importing} style={{ padding:"7px 11px", fontSize:12 }}><Upload size={13}/> {t.importExcel}</Btn>}
        {isAdmin&&<Btn outline onClick={function(){exportLeadsToExcel(filtered,p.users,isReq?"daily_requests":"leads");}} style={{ padding:"7px 11px", fontSize:12, color:C.success, borderColor:C.success }}><FileSpreadsheet size={13}/> {t.exportExcel}</Btn>}
        {!notifGranted&&<Btn outline onClick={async function(){var ok=await requestNotifPermission();setNotifGranted(ok);}} style={{ padding:"7px 11px", fontSize:12, color:C.warning, borderColor:C.warning }}><Bell size={13}/> {t.enableNotif}</Btn>}
        <Btn outline onClick={function(){setShowQuickAdd(true);}} style={{ padding:"7px 11px", fontSize:12, color:C.info, borderColor:C.info }}><Zap size={13}/> {t.quickAdd}</Btn>
        {isAdmin&&<Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><Plus size={14}/> {isReq?t.addRequest:t.addLead}</Btn>}
      </div>
    </div>

    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
      <select value={sortBy} onChange={function(e){setSortBy(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
        <option value="lastActivity">⏱ آخر نشاط</option>
        <option value="newest">🆕 الأحدث</option>
        <option value="oldest">📅 الأقدم</option>
        <option value="name">🔤 الاسم</option>
      </select>
      {isAdmin&&<select value={agentFilter} onChange={function(e){setAgentFilter(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
        <option value="">👤 كل الموظفين</option>
        {salesUsers.map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name}</option>;})}
      </select>}
      <button onClick={function(){setVipFilter(!vipFilter);}} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid", borderColor:vipFilter?"#F59E0B":"#E8ECF1", background:vipFilter?"#FEF3C7":"#fff", color:vipFilter?"#B45309":C.textLight, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>⭐ VIP فقط {vipFilter?"✓":""}</button>
    </div>
    {importMsg&&<div style={{ marginBottom:10, padding:"9px 14px", background:importMsg.startsWith("✅")?"#DCFCE7":"#FEE2E2", color:importMsg.startsWith("✅")?"#15803D":"#B91C1C", borderRadius:9, fontSize:13 }}>{importMsg}</div>}

    <div style={{ display:"flex", gap:14 }}>
      {/* Status dropdown overlay */}
      {statusDrop&&<div style={{ position:"fixed", inset:0, zIndex:499 }} onClick={function(){setStatusDrop(null);}}/>}
    {/* Table */}
      <Card style={{ flex:1, padding:0, overflow:"hidden", minWidth:0 }}>
        <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:p.isMobile?500:620 }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
              {isAdmin&&<th style={{ padding:"10px 8px", width:32 }}><input type="checkbox" onChange={function(e){setSelected2(e.target.checked?filtered.map(function(l){return gid(l);}):[])}}/></th>}
              {[t.name,t.phone,t.project,t.status,!p.isMobile&&t.source,isAdmin&&t.agent,t.lastActivity,!p.isMobile&&t.callbackTime].filter(Boolean).map(function(h){return <th key={h} style={{ textAlign:t.dir==="rtl"?"right":"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:C.textLight, fontSize:13 }}>لا يوجد بيانات</td></tr>}
              {filtered.map(function(lead){
                var lid=gid(lead); var so=sc.find(function(s){return s.value===lead.status;})||sc[0];
                var isSel=selected&&gid(selected)===lid; var isChk=selected2.includes(lid); var isVIP=lead.isVIP;
                return <tr key={lid} onClick={function(){setSelected(lead);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSel?"#EFF6FF":isVIP?"#FFFBEB":isChk?"#F0FDF4":"transparent", transition:"background 0.12s", borderRight:isVIP?"3px solid #F59E0B":"3px solid transparent" }}>
                  {isAdmin&&<td style={{ padding:"10px 8px" }} onClick={function(e){e.stopPropagation();setSelected2(function(prev){return prev.includes(lid)?prev.filter(function(x){return x!==lid;}):[...prev,lid];});}}><input type="checkbox" checked={isChk} readOnly/></td>}
                  <td style={{ padding:"10px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {lead.isVIP&&<span style={{ fontSize:14 }} title="VIP">⭐</span>}
                      <div style={{ fontSize:13, fontWeight:600, color:lead.isVIP?C.accent:C.text, whiteSpace:"nowrap" }}>{lead.name}</div>
                    </div>
                    <div style={{ fontSize:10, color:C.textLight }}>{lead.email}</div>
                    {lead.phone2&&<div style={{ fontSize:10, color:C.textLight, direction:"ltr" }}>{lead.phone2}</div>}
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:12, direction:"ltr", whiteSpace:"nowrap" }}>
                    <PhoneCell phone={lead.phone} phone2={lead.phone2} t={t}/>
                  </td>
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.textLight, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.project}</td>
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
                  {!p.isMobile&&<td style={{ padding:"10px 12px", fontSize:11, color:C.textLight, whiteSpace:"nowrap" }}>{lead.source}</td>}
                  {isAdmin&&<td style={{ padding:"10px 12px", fontSize:11, whiteSpace:"nowrap" }} onClick={function(e){e.stopPropagation();}}>
                    <select value={lead.agentId&&lead.agentId._id?lead.agentId._id:(lead.agentId||"")} onChange={async function(e){
                      var newAgent=e.target.value;
                      try{var upd=await apiFetch("/api/leads/"+gid(lead),"PUT",{agentId:newAgent},p.token);p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(lead)?upd:l;});});if(selected&&gid(selected)===gid(lead))setSelected(upd);}catch(ex){}
                    }} style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", color:C.text, cursor:"pointer", maxWidth:110 }}>
                      {salesUsers.map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name}</option>;})}
                    </select>
                  </td>}
                  <td style={{ padding:"10px 12px", fontSize:11, color:C.accent, whiteSpace:"nowrap" }}>{timeAgo(lead.lastActivityTime,t)}</td>
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
      </Card>

      {/* Side Panel */}
      {selected&&<Card style={{ flex:"0 0 295px", maxHeight:"calc(100vh - 120px)", overflowY:"auto", padding:0 }}>
        <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:"14px 16px", position:"sticky", top:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <button onClick={function(){setSelected(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><X size={11}/></button>
            <div style={{ display:"flex", gap:5 }}>
              {isAdmin&&<button onClick={function(){setEditLead(selected);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }} title={t.edit}><Edit size={11}/></button>}
              {isAdmin&&<button onClick={function(){archiveLead(gid(selected));}} style={{ background:"rgba(255,165,0,0.3)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }} title={t.archive}><Archive size={11}/></button>}
            </div>
          </div>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{selected.name}</div>
          <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, marginTop:2 }}>
            {selected.phone}{selected.phone2?" / "+selected.phone2:""}
          </div>
          {/* Quick action buttons */}
          <div style={{ display:"flex", gap:6, marginTop:10 }}>
            <a href={"tel:"+selected.phone} style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(34,197,94,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}><Phone size={12}/> {t.call}</a>
            <a href={"https://wa.me/2"+selected.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(37,211,102,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>💬 {t.whatsapp}</a>
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
              try{var upd=await apiFetch("/api/leads/"+gid(selected),"PUT",{agentId:newAgent},p.token);p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selected)?upd:l;});});setSelected(upd);}catch(ex){}
            }} style={{ width:"100%", padding:"6px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
              {salesUsers.map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name} - {u.title}</option>;})}
            </select>
          </div>}
          {/* Details */}
          {[{l:t.budget,v:fmtMoney(selected.budget)},{l:t.source,v:selected.source},{l:t.agent,v:getAgentName(selected)},{l:t.callbackTime,v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):"-"},{l:"آخر تواصل",v:selected.lastActivityTime?new Date(selected.lastActivityTime).toLocaleDateString("ar-EG")+" — "+timeAgo(selected.lastActivityTime,t):"-"},{l:"تاريخ الإضافة",v:selected.createdAt?new Date(selected.createdAt).toLocaleDateString("ar-EG"):"-"},{l:t.notes,v:selected.notes}].map(function(f){
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
          {leadActs.length>0&&<div style={{ marginTop:14 }}>
            <div style={{ fontSize:11, color:C.textLight, fontWeight:600, marginBottom:8 }}>{t.clientHistory}</div>
            {leadActs.map(function(a,i){return <div key={a._id||i} style={{ fontSize:10, padding:"6px 0", borderBottom:"1px solid #F8FAFC", display:"flex", gap:6 }}>
              <span style={{ flexShrink:0 }}>{a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":a.type==="note"?"📝":"🔔"}</span>
              <span style={{ flex:1 }}>{a.note}</span>
              <span style={{ color:C.textLight, flexShrink:0 }}>{timeAgo(a.createdAt,t)}</span>
            </div>;})}
          </div>}
        </div>
      </Card>}
    </div>

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
      <Inp label={t.project} value={quickForm.project||""} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{project:e.target.value});});}} placeholder="اسم المشروع"/>
      <Inp label={t.source} type="select" value={quickForm.source} onChange={function(e){setQuickForm(function(f){return Object.assign({},f,{source:e.target.value});});}} options={SOURCES.map(function(x){return{value:x,label:x};})}/>
      <div style={{ display:"flex", gap:10 }}>
        <Btn outline onClick={function(){setShowQuickAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn>
        <Btn loading={quickSaving} onClick={async function(){
          if(!quickForm.name||!quickForm.phone)return;
          setQuickSaving(true);
          try{
            var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
            var lead=await apiFetch("/api/leads","POST",Object.assign({agentId:salesUsers[0]?gid(salesUsers[0]):p.cu.id},quickForm),p.token);
            p.setLeads(function(prev){return [lead].concat(prev);});
            setShowQuickAdd(false);
            setQuickForm({name:"",phone:"",project:PROJECTS[0],source:"Facebook"});
            showBrowserNotif("✅ تم إضافة عميل",lead.name+" — "+lead.phone);
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
  var myLeads = p.leads.filter(function(l){
    if(l.archived) return false;
    var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;
    return aid===p.cu.id;
  });
  var myTasks = p.tasks.filter(function(tk){var uid=tk.userId&&tk.userId._id?tk.userId._id:tk.userId;return uid===p.cu.id&&!tk.done;});
  var callbacks = myLeads.filter(function(l){return l.callbackTime&&new Date(l.callbackTime)<=new Date(Date.now()+24*60*60*1000);}).sort(function(a,b){return new Date(a.callbackTime)-new Date(b.callbackTime);});
  var noActivity = myLeads.filter(function(l){return !l.archived&&l.status!=="DoneDeal"&&l.status!=="NotInterested"&&(Date.now()-new Date(l.lastActivityTime).getTime())>3*24*60*60*1000;});

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ fontSize:16, color:C.textLight, marginBottom:18 }}>{t.welcome}, <b style={{ color:C.text }}>{p.cu.name}</b> 👋</div>
    <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
      <StatCard icon={Users} label={t.myLeads} value={myLeads.length+""} c={C.info}/>
      <StatCard icon={CheckCircle} label={t.tasks+" "+t.pending} value={myTasks.length+""} c={C.accent}/>
      <StatCard icon={Phone} label={t.callReminder} value={callbacks.length+""} c={C.warning}/>
      <StatCard icon={AlertCircle} label={t.noActivity} value={noActivity.length+""} c={C.danger}/>
    </div>
    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
      {/* Today Callbacks */}
      <Card style={{ flex:1, minWidth:280 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}><Phone size={16} color={C.warning}/> {t.callReminder}</h3>
        {callbacks.length===0&&<div style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"20px 0" }}>لا يوجد مكالمات</div>}
        {callbacks.slice(0,8).map(function(l){var so=sc.find(function(s){return s.value===l.status;})||sc[0];
          return <div key={gid(l)} onClick={function(){p.nav("leads");p.setInitSelected(l);}} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid #F8FAFC", cursor:"pointer" }}>
            <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:12, fontWeight:600 }}>{l.name}</div><div style={{ fontSize:10, color:C.textLight, direction:"ltr" }}>{l.callbackTime?l.callbackTime.slice(0,16).replace("T"," "):""}</div></div>
            <Badge bg={so.bg} color={so.color}>{so.label}</Badge>
            <div style={{ display:"flex", gap:4 }}>
              <a href={"tel:"+l.phone} onClick={function(e){e.stopPropagation();}} style={{ width:26, height:26, borderRadius:6, background:C.success+"15", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}><Phone size={12} color={C.success}/></a>
              <a href={"https://wa.me/2"+l.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ width:26, height:26, borderRadius:6, background:"#25D36615", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", fontSize:12 }}>💬</a>
            </div>
          </div>;
        })}
      </Card>
      {/* My Tasks */}
      <Card style={{ flex:1, minWidth:260 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}><CheckCircle size={16} color={C.accent}/> {t.tasks}</h3>
        {myTasks.length===0&&<div style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"20px 0" }}>لا يوجد مهام</div>}
        {myTasks.slice(0,8).map(function(tk){var lName=tk.leadId&&tk.leadId.name?tk.leadId.name:"";
          return <div key={gid(tk)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid #F8FAFC" }}>
            <div style={{ width:20, height:20, borderRadius:5, border:"2px solid #CBD5E1", flexShrink:0 }}/>
            <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{tk.title}</div><div style={{ fontSize:10, color:C.textLight }}>{lName} {tk.time}</div></div>
            <Badge bg={tk.type==="call"?"#DCFCE7":tk.type==="meeting"?"#DBEAFE":"#FEF3C7"} color={tk.type==="call"?"#15803D":tk.type==="meeting"?"#1D4ED8":"#B45309"}>{tk.type}</Badge>
          </div>;
        })}
      </Card>
      {/* No Activity */}
      {noActivity.length>0&&<Card style={{ flex:1, minWidth:260 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, display:"flex", alignItems:"center", gap:8, color:C.danger }}><AlertCircle size={16}/> {t.noActivity}</h3>
        {noActivity.slice(0,6).map(function(l){return <div key={gid(l)} onClick={function(){p.nav("leads");p.setInitSelected(l);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid #F8FAFC", cursor:"pointer" }}>
          <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{l.name}</div><div style={{ fontSize:10, color:C.danger }}>{timeAgo(l.lastActivityTime,t)}</div></div>
          <a href={"tel:"+l.phone} onClick={function(e){e.stopPropagation();}} style={{ width:26, height:26, borderRadius:6, background:C.success+"15", display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none" }}><Phone size={12} color={C.success}/></a>
        </div>;})}
      </Card>}
    </div>
  </div>;
};

// ===== DASHBOARD =====
var DashboardPage = function(p) {
  var t = p.t; var sc = STATUSES(t);
  var isAdmin = p.cu.role==="admin"||p.cu.role==="manager";
  var normalLeads = p.leads.filter(function(l){return !l.archived&&l.source!=="Daily Request";});
  var myLeads = isAdmin?normalLeads:normalLeads.filter(function(l){var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return aid===p.cu.id;});
  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ fontSize:14, color:C.textLight, marginBottom:18 }}>{t.welcome}, <b style={{ color:C.text }}>{p.cu.name}</b> 👋</div>
    <div style={{ display:"flex", gap:10, marginBottom:22, flexWrap:"wrap" }}>
      <StatCard icon={Users} label={isAdmin?t.allLeads:t.myLeads} value={myLeads.length+""} c={C.info} onClick={function(){p.nav("leads");}}/>
      <StatCard icon={Target} label={t.newLeads} value={myLeads.filter(function(l){return l.status==="Potential";}).length+""} c={C.success} onClick={function(){p.nav("leads");p.setFilter("Potential");}}/>
      <StatCard icon={Briefcase} label={t.activeDeals} value={myLeads.filter(function(l){return["HotCase","CallBack","MeetingDone"].includes(l.status);}).length+""} c={C.accent} onClick={function(){p.nav("leads");p.setFilter("HotCase");}}/>
      <StatCard icon={DollarSign} label={t.doneDeals} value={myLeads.filter(function(l){return l.status==="DoneDeal";}).length+""} c={C.primary} onClick={function(){p.nav("deals");}}/>
      <StatCard icon={Activity} label={"جدد اليوم"} value={(function(){ return myLeads.filter(function(l){ return l.createdAt && (Date.now()-new Date(l.createdAt).getTime())<86400000; }).length+""; })()} c={"#8B5CF6"}/>
    </div>
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
        {p.activities.length===0&&<div style={{ color:C.textLight, fontSize:13, textAlign:"center", padding:"20px 0" }}>لا يوجد نشاط</div>}
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

// ===== DEALS =====
var DealsPage = function(p) {
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="manager";
  var deals=p.leads.filter(function(l){return l.status==="DoneDeal"&&!l.archived;});
  var getAg=function(l){if(!l.agentId)return"-";if(l.agentId.name)return l.agentId.name;var u=p.users.find(function(x){return gid(x)===l.agentId;});return u?u.name:"-";};
  var total=deals.reduce(function(s,d){return s+(parseFloat((d.budget||"0").replace(/,/g,""))||0);},0);
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
  var [showAdd,setShowAdd]=useState(false);
  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{t.deals} ({deals.length})</h2>
        {total>0&&<div style={{ fontSize:13, fontWeight:700, color:C.success, background:"#DCFCE7", padding:"5px 14px", borderRadius:20 }}>إجمالي: {total.toLocaleString()} EGP</div>}
      </div>
      {isAdmin&&<Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><Plus size={14}/> {t.addLead}</Btn>}
    </div>
    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={t.addLead+" (Done Deal)"}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={false}
        initial={{name:"",phone:"",phone2:"",email:"",budget:"",project:"",source:"Referral",agentId:"",callbackTime:"",notes:"",status:"DoneDeal"}}
        onClose={function(){setShowAdd(false);}}
        onSave={function(lead){p.setLeads(function(prev){return [lead].concat(prev);});setShowAdd(false);}}/>
    </Modal>
    <Card p={0}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:480 }}>
      <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
        {[t.name,t.phone,t.project,t.budget,isAdmin&&t.agent,t.source].filter(Boolean).map(function(h){return <th key={h} style={{ textAlign:t.dir==="rtl"?"right":"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
      </tr></thead>
      <tbody>
        {deals.length===0&&<tr><td colSpan={6} style={{ padding:40, textAlign:"center", color:C.textLight }}>لا يوجد صفقات بعد</td></tr>}
        {deals.map(function(d){return <tr key={gid(d)} style={{ borderBottom:"1px solid #F1F5F9" }}>
          <td style={{ padding:"11px 12px", fontSize:13, fontWeight:600 }}>{d.name}</td>
          <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr" }}>{d.phone}</td>
          <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{d.project}</td>
          <td style={{ padding:"11px 12px", fontSize:13, fontWeight:700, color:C.success }}>{d.budget}</td>
          {isAdmin&&<td style={{ padding:"11px 12px", fontSize:12 }}>{getAg(d)}</td>}
          <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight }}>{d.source}</td>
        </tr>;})}
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
  var noActivity=myLeads.filter(function(l){return (!l.lastActivityTime||(now-new Date(l.lastActivityTime).getTime())>3*24*60*60*1000)&&l.status!=="DoneDeal"&&l.status!=="NotInterested";});

  var myTasks=p.tasks.filter(function(tk){return !tk.done&&(p.cu.role==="admin"||p.cu.role==="manager"||tk.userId===p.cu.id);});
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
        <h2 style={{ margin:"0 0 2px", fontSize:18, fontWeight:800 }}>☀️ يومي والمهام</h2>
        <div style={{ fontSize:12, color:C.textLight }}>{new Date().toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
      </div>
      <Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><Plus size={14}/> مهمة جديدة</Btn>
    </div>

    <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
      <StatCard icon={Phone} label={"مكالمات اليوم"} value={callbacksToday.length+""} c={C.info}/>
      <StatCard icon={AlertCircle} label={"متأخرة"} value={(overdue.length+overdueTasks.length)+""} c={C.danger}/>
      <StatCard icon={Activity} label={"بدون نشاط"} value={noActivity.length+""} c={C.warning}/>
      <StatCard icon={CheckCircle} label={"مهام اليوم"} value={todayTasks.length+""} c={"#8B5CF6"}/>
    </div>

    {overdue.length>0&&<Sec icon="⚠️" title="مكالمات متأخرة" color={C.danger} count={overdue.length}>{overdue.slice(0,5).map(function(l){return <LRow key={gid(l)} lead={l}/>;})}</Sec>}
    {overdueTasks.length>0&&<Sec icon="🔴" title="مهام متأخرة" color={C.danger} count={overdueTasks.length}>{overdueTasks.map(function(tk){return <TRow key={tk._id} task={tk} bg="#FEF2F2" border="#FECACA" tc={C.danger}/>;})}</Sec>}
    {callbacksToday.length>0&&<Sec icon="📞" title="مكالمات اليوم" color={C.info} count={callbacksToday.length}>{callbacksToday.map(function(l){return <LRow key={gid(l)} lead={l}/>;})}</Sec>}
    {todayTasks.length>0&&<Sec icon="📋" title="مهام اليوم" color={"#8B5CF6"} count={todayTasks.length}>{todayTasks.map(function(tk){return <TRow key={tk._id} task={tk} bg="#F5F3FF" border="#DDD6FE" tc={"#7C3AED"}/>;})}</Sec>}
    {noActivity.length>0&&<Sec icon="😴" title="بدون نشاط +3 أيام" color={C.warning} count={noActivity.length}>{noActivity.slice(0,5).map(function(l){return <LRow key={gid(l)} lead={l}/>;})}</Sec>}
    {upcoming.length>0&&<Sec icon="📅" title="مهام قادمة" color={C.textLight} count={upcoming.length}>{upcoming.slice(0,5).map(function(tk){return <TRow key={tk._id} task={tk} bg="#F8FAFC" border="#E2E8F0"/>;})}</Sec>}

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
  var [archivedLeads, setArchivedLeads] = useState([]);
  var [archLoading, setArchLoading] = useState(true);
  useEffect(function(){
    apiFetch("/api/leads/archived", "GET", null, p.token)
      .then(function(data){ setArchivedLeads(Array.isArray(data)?data:[]); setArchLoading(false); })
      .catch(function(){ setArchivedLeads([]); setArchLoading(false); });
  },[]);
  var archived = archivedLeads;
  var restore=async function(lid){
    try{
      var upd=await apiFetch("/api/leads/"+lid,"PUT",{archived:false},p.token);
      setArchivedLeads(function(prev){return prev.filter(function(l){return gid(l)!==lid;});});
      p.setLeads(function(prev){return [upd].concat(prev);});
    }catch(e){alert(e.message);}
  };
  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>{t.archive} ({archived.length})</h2>
    {archived.length===0&&<div style={{ textAlign:"center", padding:50, color:C.textLight }}>الأرشيف فاضي</div>}
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
  var isAdmin=p.cu.role==="admin"||p.cu.role==="manager";
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
    if(st==="DoneDeal"&&!window.confirm("⚠️ هل أنت متأكد؟"))return;
    setPendingStatus({leadId:rid,newStatus:st});setShowStatusComment(true);
  };
  var confirmStatus=async function(comment,cbTime){
    if(!pendingStatus)return;
    try{
      var updateData={status:pendingStatus.newStatus};
      if(cbTime)updateData.callbackTime=cbTime;
      var upd=await apiFetch("/api/daily-requests/"+pendingStatus.leadId,"PUT",updateData,p.token);
      setRequests(function(prev){return prev.map(function(r){return gid(r)===pendingStatus.leadId?upd:r;});});
      if(selected&&gid(selected)===pendingStatus.leadId)setSelected(upd);
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
    if(!form.name||!form.phone)return;setSaving(true);
    try{
      var drAgentId=form.agentId||(p.cu.role==="sales"?p.cu.id:(salesUsers.length>0?gid(salesUsers[0]):p.cu.id));
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
      <StatCard icon={ClipboardList} label={"إجمالي الأرقام"} value={requests.length+""} c={C.info}/>
      <StatCard icon={Target} label={"Potential"} value={requests.filter(function(r){return r.status==="Potential";}).length+""} c={"#1D4ED8"}/>
      <StatCard icon={DollarSign} label={t.doneDeals} value={requests.filter(function(r){return r.status==="DoneDeal";}).length+""} c={C.success}/>
      <Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13, alignSelf:"center", marginRight:"auto" }}><Plus size={14}/> إضافة رقم</Btn>
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
        <option value="">👤 كل الموظفين</option>
        {salesUsers.map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name}</option>;})}
      </select>}
      <select value={sortBy} onChange={function(e){setSortBy(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff" }}>
        <option value="lastActivity">⏱ آخر نشاط</option>
        <option value="newest">🆕 الأحدث</option>
      </select>
    </div>

    <div style={{ display:"flex", gap:14 }}>
      <Card style={{ flex:1, padding:0, overflow:"hidden", minWidth:0 }}>
        {loading?<Loader/>:<div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
            <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
              {["الاسم","الهاتف","نوع العقار","المنطقة","الميزانية","الحالة",isAdmin&&"الموظف","آخر نشاط","موعد المكالمة"].filter(Boolean).map(function(h){return <th key={h} style={{ textAlign:"right", padding:"10px 12px", fontSize:11, fontWeight:700, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:C.textLight }}>لا يوجد أرقام</td></tr>}
              {filtered.map(function(r){
                var rid=gid(r); var so=sc.find(function(s){return s.value===r.status;})||sc[0]; var isSel=selected&&gid(selected)===rid;
                var ci=callbackColor(r.callbackTime);
                return <tr key={rid} onClick={function(){setSelected(r);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSel?"#EFF6FF":"transparent", borderRight:"3px solid "+(isSel?C.accent:"transparent") }}>
                  <td style={{ padding:"10px 12px" }}><div style={{ fontSize:13, fontWeight:600 }}>{r.name}</div><div style={{ fontSize:10, color:C.textLight }}>{r.email}</div></td>
                  <td style={{ padding:"10px 12px", fontSize:12, direction:"ltr" }}>
                    {r.phone}{r.phone2&&<div style={{ fontSize:10, color:C.textLight }}>{r.phone2}</div>}
                    <div style={{ display:"flex", gap:4, marginTop:2 }}>
                      <a href={"tel:"+r.phone} onClick={function(e){e.stopPropagation();}} style={{ fontSize:10, color:C.success, textDecoration:"none", display:"flex", alignItems:"center", gap:2 }}><Phone size={9}/></a>
                      <a href={"https://wa.me/2"+r.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" onClick={function(e){e.stopPropagation();}} style={{ fontSize:10, color:"#25D366", textDecoration:"none" }}>💬</a>
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
                      {sc.map(function(s){return <div key={s.value} onClick={function(e){e.stopPropagation();setSelected(r);reqStatus(rid,s.value);}} style={{ padding:"9px 12px", borderRadius:9, cursor:"pointer", display:"flex", alignItems:"center", gap:10, background:r.status===s.value?s.bg:"transparent", fontSize:13 }}
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
            <a href={"https://wa.me/2"+selected.phone.replace(/^0/,"")} target="_blank" rel="noreferrer" style={{ flex:1, padding:"6px", borderRadius:8, background:"rgba(37,211,102,0.2)", color:"#fff", fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>💬 واتساب</a>
          </div>
        </div>
        <div style={{ padding:"12px 14px" }}>
          <div style={{ marginBottom:12, padding:10, background:"#F8FAFC", borderRadius:10 }}>
            <div style={{ fontSize:11, color:C.textLight, marginBottom:7, fontWeight:600 }}>{t.changeStatus}</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {sc.map(function(s){return <button key={s.value} onClick={function(){reqStatus(gid(selected),s.value);}} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid", borderColor:selected.status===s.value?s.color:"#E2E8F0", background:selected.status===s.value?s.bg:"#fff", color:selected.status===s.value?s.color:C.textLight, fontSize:10, fontWeight:600, cursor:"pointer" }}>{s.label}</button>;})}
            </div>
          </div>
          {[{l:"نوع العقار",v:selected.propertyType},{l:"المنطقة",v:selected.area},{l:"الميزانية",v:selected.budget},{l:t.agent,v:getAgentName(selected)},{l:t.callbackTime,v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):"-"},{l:t.lastActivity,v:timeAgo(selected.lastActivityTime,t)},{l:"تاريخ الإضافة",v:selected.createdAt?new Date(selected.createdAt).toLocaleDateString("ar-EG"):"-"},{l:t.notes,v:selected.notes}].map(function(f){
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

    <Modal show={showAdd} onClose={function(){setShowAdd(false);}} title={"➕ إضافة رقم جديد"}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
        <div style={{ gridColumn:"1/-1" }}><Inp label={"الاسم"} req value={form.name} onChange={function(e){setForm(function(f){return Object.assign({},f,{name:e.target.value});})}}/></div>
        <Inp label={"الهاتف"} req value={form.phone} onChange={function(e){setForm(function(f){return Object.assign({},f,{phone:e.target.value});})}} placeholder="01xxxxxxxxx"/>
        <Inp label={"هاتف إضافي"} value={form.phone2} onChange={function(e){setForm(function(f){return Object.assign({},f,{phone2:e.target.value});})}} placeholder="اختياري"/>
        <Inp label={"نوع العقار"} type="select" value={form.propertyType} onChange={function(e){setForm(function(f){return Object.assign({},f,{propertyType:e.target.value});})}} options={[""].concat(PROP_TYPES).map(function(x){return{value:x,label:x||"- اختر -"};})}/>
        <Inp label={"المنطقة"} value={form.area} onChange={function(e){setForm(function(f){return Object.assign({},f,{area:e.target.value});})}} placeholder="مثال: التجمع الخامس"/>
        <div style={{ gridColumn:"1/-1" }}><Inp label={"الميزانية"} value={form.budget} onChange={function(e){setForm(function(f){return Object.assign({},f,{budget:e.target.value});})}}/></div>
      </div>
      {isAdmin&&<Inp label={t.agent} type="select" value={form.agentId} onChange={function(e){setForm(function(f){return Object.assign({},f,{agentId:e.target.value});})}} options={[{value:"",label:"- اختر -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name};}))}/>}
      <Inp label={t.callbackTime} type="datetime-local" value={form.callbackTime} onChange={function(e){setForm(function(f){return Object.assign({},f,{callbackTime:e.target.value});})}}/> 
      <Inp label={t.notes} type="textarea" value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});})}}/> 
      <div style={{ display:"flex", gap:10 }}><Btn outline onClick={function(){setShowAdd(false);}} style={{ flex:1 }}>{t.cancel}</Btn><Btn onClick={addReq} loading={saving} style={{ flex:1 }}>إضافة رقم</Btn></div>
    </Modal>
  </div>;
};

// ===== USERS =====
var UsersPage = function(p) {
  var t=p.t; var [showAdd,setShowAdd]=useState(false); var [saving,setSaving]=useState(false);
  var [nU,setNU]=useState({name:"",username:"",password:"sales123",email:"",phone:"",role:"sales",title:"",monthlyTarget:15,teamId:"",teamName:""});
  var [pwModal,setPwModal]=useState(null); // {userId, userName}
  var [pwForm,setPwForm]=useState({newPass:"",confirmPass:""});
  var [pwMsg,setPwMsg]=useState(""); var [pwSaving,setPwSaving]=useState(false);
  var rc={admin:"#EF4444",manager:"#8B5CF6",sales:"#3B82F6",viewer:"#94A3B8"};
  var rl={admin:t.admin,manager:t.salesManager,sales:t.salesAgent,viewer:t.viewer};
  var changePassword=async function(){if(!pwForm.newPass||!pwForm.confirmPass)return;if(pwForm.newPass!==pwForm.confirmPass){setPwMsg(t.passwordMismatch);return;}setPwSaving(true);try{await apiFetch("/api/users/"+pwModal.userId,"PUT",{password:pwForm.newPass},p.token);setPwMsg(t.passwordSuccess);setTimeout(function(){setPwModal(null);setPwMsg("");setPwForm({newPass:"",confirmPass:""});},1500);}catch(e){setPwMsg(t.passwordError);}setPwSaving(false);};
  var add=async function(){if(!nU.name||!nU.username)return;setSaving(true);try{var user=await apiFetch("/api/users","POST",nU,p.token);p.setUsers(function(prev){return prev.concat([user]);});setShowAdd(false);setNU({name:"",username:"",password:"sales123",email:"",phone:"",role:"sales",title:"",monthlyTarget:15});}catch(e){alert(e.message);}setSaving(false);};
  var toggleActive=async function(u){var uid=gid(u);try{var upd=await apiFetch("/api/users/"+uid,"PUT",{active:!u.active},p.token);p.setUsers(function(prev){return prev.map(function(x){return gid(x)===uid?upd:x;});});}catch(e){}};
  var del=async function(uid){if(!window.confirm(t.deleteConfirm))return;try{await apiFetch("/api/users/"+uid,"DELETE",null,p.token);p.setUsers(function(prev){return prev.filter(function(x){return gid(x)!==uid;});});}catch(e){alert(e.message);}};
  var updateTarget=async function(u,val){var uid=gid(u);try{var upd=await apiFetch("/api/users/"+uid+"/target","PUT",{monthlyTarget:Number(val)},p.token);p.setUsers(function(prev){return prev.map(function(x){return gid(x)===uid?upd:x;});});}catch(e){}};

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{t.users} ({p.users.length})</h2>
      <Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><UserPlus size={14}/> {t.addUser}</Btn>
    </div>
    <Card p={0}><div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse", minWidth:580 }}>
      <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
        {[t.name,t.username,t.title,t.role,t.phone,t.monthlyTarget,t.status,""].map(function(h){return <th key={h||"x"} style={{ textAlign:t.dir==="rtl"?"right":"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
      </tr></thead>
      <tbody>{p.users.map(function(u){var uid=gid(u);return <tr key={uid} style={{ borderBottom:"1px solid #F1F5F9" }}>
        <td style={{ padding:"11px 12px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:32, height:32, borderRadius:8, background:C.primary+"15", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:C.primary, flexShrink:0 }}>{u.name[0]}</div><div><div style={{ fontSize:12, fontWeight:600 }}>{u.name}</div><div style={{ fontSize:10, color:C.textLight }}>{u.email}</div></div></div></td>
        <td style={{ padding:"11px 12px", fontSize:12, fontFamily:"monospace" }}>{u.username}</td>
        <td style={{ padding:"11px 12px", fontSize:12 }}>{u.title}</td>
        <td style={{ padding:"11px 12px" }}><Badge bg={(rc[u.role]||"#94A3B8")+"15"} color={rc[u.role]||"#94A3B8"}>{rl[u.role]||u.role}</Badge></td>
        <td style={{ padding:"11px 12px", fontSize:12, direction:"ltr" }}>{u.phone}</td>
        <td style={{ padding:"11px 12px" }}><input type="number" value={u.monthlyTarget||15} onChange={function(e){updateTarget(u,e.target.value);}} style={{ width:60, padding:"4px 8px", borderRadius:7, border:"1px solid #E2E8F0", fontSize:12 }}/></td>
        <td style={{ padding:"11px 12px" }}><Badge bg={u.active?"#DCFCE7":"#FEE2E2"} color={u.active?"#15803D":"#B91C1C"} onClick={function(){if(u.role!=="admin")toggleActive(u);}}>{u.active?t.active:t.inactive}</Badge></td>
        <td style={{ padding:"11px 12px" }}><div style={{display:"flex",gap:6,alignItems:"center"}}><button onClick={function(){setPwModal({userId:uid,userName:u.name});setPwForm({newPass:"",confirmPass:""});setPwMsg("");}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} title={t.changePassword}><KeyRound size={12} color={C.info}/></button><button onClick={function(){if(u.role!=="admin")del(uid);}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:u.role!=="admin"?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", opacity:u.role==="admin"?0.3:1 }}><Trash2 size={12} color={C.danger}/></button></div></td>
      </tr>;})}
      </tbody>
    </table></div></Card>
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
        <Inp label={"اسم الفريق"} value={nU.teamName||""} onChange={function(e){setNU(Object.assign({},nU,{teamName:e.target.value}));}} placeholder="مثال: فريق أ"/>
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
  var pLabel={daily:"اليوم",weekly:"الأسبوع",monthly:"الشهر"};
  var ms={daily:86400000,weekly:604800000,monthly:2592000000}[period];
  var now=Date.now();
  var allLeads=p.leads.filter(function(l){return !l.archived;});
  var periodLeads=allLeads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt).getTime())<ms;});
  var periodDeals=allLeads.filter(function(l){return l.status==="DoneDeal"&&l.updatedAt&&(now-new Date(l.updatedAt).getTime())<ms;});
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager")&&u.active;});
  var agentStats=salesUsers.map(function(u){
    var uid=gid(u);
    var uNew=periodLeads.filter(function(l){var a=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return a===uid;});
    var uDeals=periodDeals.filter(function(l){var a=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return a===uid;});
    var target=u.monthlyTarget||15; var prog=Math.min(100,Math.round((uDeals.length/target)*100));
    return{user:u,newL:uNew.length,deals:uDeals.length,target:target,prog:prog};
  }).sort(function(a,b){return b.deals-a.deals;});
  var exportReport=async function(){
    setExporting(true);
    var XLSX=await new Promise(function(res){if(window.XLSX){res(window.XLSX);return;}var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";s.onload=function(){res(window.XLSX);};document.head.appendChild(s);});
    var rows=agentStats.map(function(a){return{"الموظف":a.user.name,"جدد":a.newL,"صفقات":a.deals,"الهدف":a.target,"نسبة":a.prog+"%"};});
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
      <StatCard icon={DollarSign} label={"صفقات — "+pLabel[period]} value={periodDeals.length+""} c={C.success}/>
      <StatCard icon={Target} label={"إجمالي"} value={allLeads.length+""} c={C.accent}/>
      <StatCard icon={Activity} label={"معدل التحويل"} value={allLeads.length?Math.round((allLeads.filter(function(l){return l.status==="DoneDeal";}).length/allLeads.length)*100)+"%":"0%"} c={"#8B5CF6"}/>
    </div>
    <Card style={{ marginBottom:20 }}>
      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>🏆 أداء الفريق — {pLabel[period]}</h3>
      <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
          {["#","الموظف","جدد","صفقات","الهدف","نسبة الإنجاز"].map(function(h){return <th key={h} style={{ padding:"10px 12px", fontSize:11, fontWeight:700, color:C.textLight, textAlign:"right" }}>{h}</th>;})}
        </tr></thead>
        <tbody>{agentStats.map(function(a,i){return <tr key={gid(a.user)} style={{ borderBottom:"1px solid #F1F5F9", background:i===0?"#FFFBEB":"transparent" }}>
          <td style={{ padding:"12px", fontSize:16 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td>
          <td style={{ padding:"12px", fontWeight:700 }}>{a.user.name}</td>
          <td style={{ padding:"12px", color:C.info, fontWeight:600 }}>{a.newL}</td>
          <td style={{ padding:"12px", color:C.success, fontWeight:700 }}>{a.deals}</td>
          <td style={{ padding:"12px", color:C.textLight }}>{a.target}</td>
          <td style={{ padding:"12px", minWidth:120 }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ flex:1, height:6, background:"#F1F5F9", borderRadius:3 }}><div style={{ height:"100%", width:a.prog+"%", borderRadius:3, background:a.prog>=100?C.success:a.prog>=50?C.accent:C.warning }}/></div><span style={{ fontSize:11, fontWeight:700, minWidth:32 }}>{a.prog}%</span></div></td>
        </tr>;})}
        </tbody>
      </table></div>
    </Card>
    <Card>
      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>📈 توزيع العملاء</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
        {sc.map(function(s){var cnt=allLeads.filter(function(l){return l.status===s.value;}).length;var pct=allLeads.length?Math.round((cnt/allLeads.length)*100):0;return cnt>0?<div key={s.value} style={{ padding:"14px", borderRadius:12, background:s.bg, border:"1px solid "+s.color+"30" }}><div style={{ fontSize:22, fontWeight:800, color:s.color }}>{cnt}</div><div style={{ fontSize:12, color:s.color, fontWeight:600, marginTop:2 }}>{s.label}</div><div style={{ fontSize:11, color:s.color+"99", marginTop:4 }}>{pct}%</div></div>:null;})}
      </div>
    </Card>
  </div>;
};

var TeamPage = function(p) {
  var t=p.t;
  var sales=p.users.filter(function(u){return u.role==="sales"||u.role==="manager";});
  var normalLeads=p.leads.filter(function(l){return !l.archived&&l.source!=="Daily Request";});
  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>{t.team}</h2>
    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
      {sales.map(function(a){
        var uid=gid(a);
        var al=normalLeads.filter(function(l){var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return aid===uid;});
        var deals=al.filter(function(l){return l.status==="DoneDeal";}).length;
        var calls=p.activities.filter(function(ac){var auid=ac.userId&&ac.userId._id?ac.userId._id:ac.userId;return auid===uid&&ac.type==="call";}).length;
        var meets=p.activities.filter(function(ac){var auid=ac.userId&&ac.userId._id?ac.userId._id:ac.userId;return auid===uid&&ac.type==="meeting";}).length;
        var rate=al.length>0?Math.round(deals/al.length*100):0;
        var target=a.monthlyTarget||15;
        var progress=Math.min(Math.round(deals/target*100),100);
        return <Card key={uid} style={{ flex:"1 1 280px", maxWidth:360, overflow:"hidden", padding:0 }}>
          <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:20, textAlign:"center" }}>
            <div style={{ width:52, height:52, borderRadius:14, margin:"0 auto 10px", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:20 }}>{a.name[0]}</div>
            <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>{a.name}</div>
            <div style={{ color:"rgba(255,255,255,0.55)", fontSize:12, marginTop:2 }}>{a.title}</div>
          </div>
          <div style={{ padding:"14px 16px" }}>
            {/* Target Progress */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:11, color:C.textLight }}>{t.monthlyTarget}: {target}</span>
                <span style={{ fontSize:11, fontWeight:700, color:progress>=100?C.success:C.accent }}>{deals} / {target}</span>
              </div>
              <div style={{ height:6, background:"#F1F5F9", borderRadius:3 }}><div style={{ height:"100%", width:progress+"%", background:progress>=100?C.success:"linear-gradient(90deg,"+C.accent+","+C.accentLight+")", borderRadius:3, transition:"width 0.6s" }}/></div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-around", marginBottom:12 }}>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:700 }}>{al.length}</div><div style={{ fontSize:10, color:C.textLight }}>{t.leads}</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:700, color:C.success }}>{deals}</div><div style={{ fontSize:10, color:C.textLight }}>{t.deals}</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:18, fontWeight:700, color:C.accent }}>{rate}%</div><div style={{ fontSize:10, color:C.textLight }}>Conv.</div></div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-around", borderTop:"1px solid #F1F5F9", paddingTop:10 }}>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:14, fontWeight:700, color:C.success }}>{calls}</div><div style={{ fontSize:10, color:C.textLight }}>{t.calls}</div></div>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:14, fontWeight:700, color:C.info }}>{meets}</div><div style={{ fontSize:10, color:C.textLight }}>{t.meetings}</div></div>
            </div>
          </div>
        </Card>;
      })}
    </div>
  </div>;
};

// ===== REPORTS =====
var ReportsPage = function(p) {
  var t=p.t;
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
        {sales.map(function(a){var uid=gid(a);
          var al=normalLeads.filter(function(l){var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId;return aid===uid;});
          var d=al.filter(function(l){return l.status==="DoneDeal";}).length;
          var cl=p.activities.filter(function(ac){var auid=ac.userId&&ac.userId._id?ac.userId._id:ac.userId;return auid===uid&&ac.type==="call";}).length;
          var rate=al.length>0?Math.round(d/al.length*100):0;
          var target=a.monthlyTarget||15; var prog=Math.min(Math.round(d/target*100),100);
          return <div key={uid} style={{ padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:C.primary+"15", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12, color:C.primary, flexShrink:0 }}>{a.name[0]}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{a.name}</div><div style={{ fontSize:10, color:C.textLight }}>{a.title}</div></div>
              {[{v:al.length,l:t.leads,c:C.text},{v:d,l:t.deals,c:C.success},{v:cl,l:t.calls,c:C.info},{v:rate+"%",l:"Conv.",c:C.accent}].map(function(s){return <div key={s.l} style={{ textAlign:"center", minWidth:36 }}><div style={{ fontSize:12, fontWeight:700, color:s.c }}>{s.v}</div><div style={{ fontSize:9, color:C.textLight }}>{s.l}</div></div>;})}
            </div>
            <div style={{ height:4, background:"#F1F5F9", borderRadius:2 }}><div style={{ height:"100%", width:prog+"%", background:prog>=100?C.success:C.accent, borderRadius:2 }}/></div>
            <div style={{ fontSize:9, color:C.textLight, marginTop:2 }}>{t.monthlyTarget}: {d}/{target}</div>
          </div>;
        })}
      </Card>
      <Card style={{ flex:1, minWidth:260 }}>
        <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>{t.sourcePerf}</h3>
        {SOURCES.map(function(src){
          var cnt=normalLeads.filter(function(l){return l.source===src;}).length;
          var won=normalLeads.filter(function(l){return l.source===src&&l.status==="DoneDeal";}).length;
          if(cnt===0)return null;
          return <div key={src} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid #F1F5F9" }}>
            <span style={{ flex:1, fontSize:12, fontWeight:500 }}>{src}</span>
            <div style={{ textAlign:"center", minWidth:36 }}><div style={{ fontSize:12, fontWeight:700 }}>{cnt}</div><div style={{ fontSize:9, color:C.textLight }}>{t.leads}</div></div>
            <div style={{ textAlign:"center", minWidth:36 }}><div style={{ fontSize:12, fontWeight:700, color:C.success }}>{won}</div><div style={{ fontSize:9, color:C.textLight }}>{t.deals}</div></div>
          </div>;
        })}
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
  var [reassignAgent,setReassignAgent]=useState(function(){return getSaved('reassign_agent','');});
  var [saved,setSaved]=useState(false);
  var doSave=function(){
    try{ localStorage.setItem('crm_set_company',company); localStorage.setItem('crm_set_email',em); localStorage.setItem('crm_set_phone',ph); localStorage.setItem('crm_set_reassign_agent',reassignAgent); }catch(e){}
    setSaved(true); setTimeout(function(){setSaved(false);},2500);
  };
  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>{t.settings}</h2>
    <Card style={{ maxWidth:520 }}>
      <Inp label={t.companyName} value={company} onChange={function(e){setCompany(e.target.value);}}/>
      <Inp label={t.email} value={em} onChange={function(e){setEm(e.target.value);}}/>
      <Inp label={t.phone} value={ph} onChange={function(e){setPh(e.target.value);}}/>
      <div style={{marginBottom:13}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,color:C.text,marginBottom:5}}>موظف الإعادة التلقائية (CallBack)</label>
        <select value={reassignAgent} onChange={function(e){setReassignAgent(e.target.value);}} style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #E2E8F0",fontSize:14,background:"#fff",boxSizing:"border-box"}}>
          <option value="">- اختر موظف -</option>
          {salesAgentsForSetting.map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name} — {u.title}</option>;})}
        </select>
        <div style={{fontSize:11,color:C.textLight,marginTop:4}}>لما يفوت موعد CallBack هيتحول تلقائياً لهذا الموظف</div>
      </div>
      <Inp label={t.language} type="select" value={p.lang} onChange={function(e){p.setLang(e.target.value);}} options={[{value:"ar",label:"عربي"},{value:"en",label:"English"}]}/>
      {saved&&<div style={{marginBottom:12,padding:"10px 14px",background:"#DCFCE7",borderRadius:10,color:"#15803D",fontSize:13,fontWeight:600}}>✅ تم الحفظ بنجاح</div>}
      <Btn onClick={doSave}>{t.save}</Btn>
    </Card>
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


  var getVisibleLeads = function(allLeads, user) {
    if (!user || user.role === "admin") return allLeads;
    if (user.role === "manager") {
      if (!user.teamId) return allLeads;
      return allLeads.filter(function(l) {
        var agent = l.agentId;
        if (!agent) return false;
        if (typeof agent === "object" && agent.teamId) return agent.teamId === user.teamId;
        return false;
      });
    }
    // Sales sees only their own leads (including archived)
    return allLeads.filter(function(l) {
      var aid = l.agentId && l.agentId._id ? l.agentId._id : l.agentId;
      return aid === user.id;
    });
  };

  var loadData=useCallback(async function(tok){
    setLoading(true); setDataError(null);
    try {
      var results=await Promise.all([apiFetch("/api/leads","GET",null,tok),apiFetch("/api/users","GET",null,tok),apiFetch("/api/activities","GET",null,tok),apiFetch("/api/tasks","GET",null,tok)]);
      var loadedUser=results[1]?results[1].find(function(u){return u._id===tok||true;}):null;
      setLeads(getVisibleLeads(results[0]||[], currentUser)); setUsers(results[1]); setActivities(results[2]); setTasks(results[3]);
    } catch(e){setDataError(e.message);}
    setLoading(false);
  },[]);

  // Load saved session on startup
  useEffect(function(){
    try {
      var saved = localStorage.getItem('crm_aro_session');
      if (saved) {
        var s = JSON.parse(saved);
        if (s.user && s.token) { setCurrentUser(s.user); setToken(s.token); loadData(s.token); }
      }
    } catch(e) {}
  }, []);

  var handleLogin=function(user,tok){
    setCurrentUser(user); setToken(tok); loadData(tok);
    var defaultPage = (user.role==="sales") ? "myday" : "dashboard";
    setPage(defaultPage);
    try { localStorage.setItem('crm_aro_session', JSON.stringify({user:Object.assign({},user),token:tok})); } catch(e){}
  };
  // ===== AUTO REASSIGN: CallBack leads past callback time -> specific agent from settings =====
  useEffect(function(){
    if (!token || !leads.length || !users.length) return;

    var check = async function() {
      // Smart reassign - pick agent with least leads (most available)
      var salesAgents = users.filter(function(u){ return (u.role==="sales"||u.role==="manager") && u.active; });
      if (!salesAgents.length) return;

      var now = new Date();
      var toReassign = leads.filter(function(l){
        var currentAgentId = l.agentId && l.agentId._id ? l.agentId._id : l.agentId;
        return l.status === "CallBack" &&
               l.callbackTime &&
               new Date(l.callbackTime) < now &&
               !l.archived &&
               currentAgentId !== targetAgentId; // don't reassign if already assigned to target
      });

      for (var i = 0; i < toReassign.length; i++) {
        var lead = toReassign[i];
        var currentAgentId = lead.agentId && lead.agentId._id ? lead.agentId._id : lead.agentId;
        var fromName = lead.agentId && lead.agentId.name ? lead.agentId.name : "موظف";
        // Pick agent with least leads (excluding current agent)
        var others = salesAgents.filter(function(u){ return gid(u) !== currentAgentId; });
        if (!others.length) others = salesAgents;
        var agentLoads = others.map(function(u){
          return { agent:u, cnt:leads.filter(function(l){ var a=l.agentId&&l.agentId._id?l.agentId._id:l.agentId; return a===gid(u)&&!l.archived; }).length };
        });
        agentLoads.sort(function(a,b){ return a.cnt-b.cnt; });
        var targetAgent = agentLoads[0].agent;
        var targetAgentId = gid(targetAgent);
        try {
          var updated = await apiFetch("/api/leads/" + gid(lead), "PUT", {
            agentId: targetAgentId,
            status: "Potential",
            callbackTime: ""
          }, token);
          await apiFetch("/api/activities", "POST", {
            leadId: gid(lead),
            type: "reassign",
            note: "🔄 تحويل تلقائي من " + fromName + " إلى " + targetAgent.name + " (فات موعد المكالمة)"
          }, token);
          setLeads(function(prev){ return prev.map(function(l){ return gid(l)===gid(lead)?updated:l; }); });
          showBrowserNotif("🔄 تحويل تلقائي", lead.name+" تم تحويله لـ "+targetAgent.name);
        } catch(e) { console.error("Auto reassign error:", e); }
      }
    };

    check();
    var interval = setInterval(check, 60000); // check every minute
    return function(){ clearInterval(interval); };
  }, [token, leads.length, users.length]);

  var handleLogout=function(){setCurrentUser(null);setToken(null);setLeads([]);setUsers([]);setActivities([]);setTasks([]);setPage("dashboard");setSidebarOpen(false);try{localStorage.removeItem('crm_aro_session');}catch(e){}};
  var nav=function(pg){setPage(pg||"dashboard");setInitSelected(null);};

  if(!currentUser) return <LoginPage t={t} onLogin={handleLogin}/>;
  if(loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#F0F2F5", fontFamily:"Cairo,sans-serif" }}><div style={{ textAlign:"center" }}><div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #E8ECF1", borderTopColor:C.accent, animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/><div style={{ color:C.textLight, fontSize:14 }}>{t.loading}</div></div></div>;
  if(dataError) return <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", gap:16, fontFamily:"Cairo,sans-serif" }}><AlertCircle size={48} color={C.danger}/><div style={{ fontSize:16, color:C.danger, fontWeight:700 }}>{t.error}</div><div style={{ color:C.textLight }}>{dataError}</div><button onClick={function(){loadData(token);}} style={{ padding:"10px 24px", borderRadius:10, background:C.accent, border:"none", color:"#fff", fontWeight:700, cursor:"pointer" }}>{t.retry}</button></div>;

  var isAdmin=currentUser.role==="admin"||currentUser.role==="manager";
  var currentPage=page||"dashboard";
  var titles={dashboard:t.dashboard,myday:t.myDay,leads:t.leads,dailyReq:t.dailyReq,deals:t.deals,projects:t.projects,tasks:t.tasks,reports:t.reports,team:t.team,users:t.users,archive:t.archive,settings:t.settings};
  var sp={t,leads,setLeads,users,setUsers,activities,setActivities,tasks,setTasks,cu:currentUser,token,nav,setFilter:setLeadFilter,leadFilter,lang,setLang,search,isMobile,initSelected,setInitSelected};

  var renderPage=function(){
    switch(currentPage){
      case "dashboard": return <DashboardPage {...sp}/>;
      case "myday_disabled": return <MyDayPage {...sp}/>;
      case "leads": return <LeadsPage {...sp} isRequest={false}/>;
      case "dailyReq": return <DailyRequestsPage {...sp}/>;
      case "deals": return <DealsPage {...sp}/>;
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
        ⚠️ أنت غير متصل بالإنترنت — البيانات لن تُحفظ حتى يعود الاتصال
      </div>}
      <Header title={titles[currentPage]||""} t={t} leads={leads} lang={lang} setLang={setLang} showNotif={showNotif} setShowNotif={setShowNotif} search={search} setSearch={setSearch} isMobile={isMobile} onMenu={function(){setSidebarOpen(true);}} onLeadClick={function(l){setInitSelected(l);nav("leads");}}/>
      <div style={{ flex:1 }}>{renderPage()}</div>
    </div>
  </div>;
}
