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
]; };

var DR_STATUSES = function(t) { return STATUSES(t).filter(function(s){return s.value!=="NewLead";}); };

var PROJECTS = [
  "العاصمة الإدارية", "المستقبل سيتي", "التجمع الخامس", "الشروق", "6 أكتوبر",
  "بالم هيلز", "ماونتن فيو", "سوديك ايست", "الرحاب", "مدينتي"
];
var SOURCES = ["Facebook", "Instagram", "TikTok", "WhatsApp", "Google Ads", "Referral", "Snap Chat", "Website"];
var PROP_TYPES = ["Apartment","Duplex","Townhouse","Twinhouse","Standalone","Commercial","Admin","Clinic","Service Apartment","Chalet"];


// ===== AVATAR COLORS =====
var AVATAR_COLORS = ["#6366F1","#EC4899","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EF4444","#14B8A6","#F97316","#06B6D4"];
var avatarColor = function(name){ var i=0; if(name)for(var j=0;j<name.length;j++)i+=name.charCodeAt(j); return AVATAR_COLORS[i%AVATAR_COLORS.length]; };
var Avatar = function(p){ var color=avatarColor(p.name); var size=p.size||36; return <div style={{ width:size, height:size, borderRadius:p.round?"50%":Math.round(size*0.28), background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:Math.round(size*0.38), flexShrink:0, position:"relative" }}>{p.name?(p.name[0]+( p.name.split(" ")[1]?p.name.split(" ")[1][0]:"")).toUpperCase():""}{p.online!==undefined&&<span style={{ position:"absolute", bottom:1, right:1, width:Math.round(size*0.28), height:Math.round(size*0.28), borderRadius:"50%", background:p.online?"#22C55E":"#94A3B8", border:"2px solid #fff" }}/>}</div>; };
var gid = function(o) { if(!o) return null; return String(o._id || o.id || ""); };

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
  return <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.52)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:600, padding:16 }} onClick={p.onClose}>
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
  var [eoiDateInput, setEoiDateInput] = useState("");
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
    setComment(""); setCbTime(""); setDealProject(""); setDealUnitType(""); setDealBudget(""); setEoiDeposit(""); setEoiDateInput(""); setRejectNote("");
    setPotBudget(""); setPotDeposit(""); setPotInstalment(""); setErr("");
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
      ? { project: dealProject, notes: dealUnitType, budget: dealBudget, eoiDeposit: eoiDeposit, eoiDate: eoiDateInput }
      : (needsPotFields && (potBudget||potDeposit||potInstalment))
        ? { budget: potBudget, deposit: potDeposit, instalment: potInstalment }
        : {};
    var finalComment = isReject&&rejectNote.trim() ? comment.trim()+" — "+rejectNote.trim() : comment.trim();
    await p.onConfirm(finalComment, cbTime, extra);
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
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>📅 Upcoming Callback <span style={{color:C.danger}}>*</span></label>
      <input type="datetime-local" value={cbTime} onChange={function(e){setCbTime(e.target.value);setErr("");}} style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box" }}/>
    </div>}
    {needsComment&&<div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:C.text, marginBottom:5 }}>💬 Feedback <span style={{color:C.danger}}>*</span></label>
      <textarea rows={3} placeholder="" value={comment} onChange={function(e){setComment(e.target.value);setErr("");}}
        style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}/>
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
      <textarea rows={2} placeholder="" value={comment} onChange={function(e){setComment(e.target.value);}}
        style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}/>
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
        <textarea rows={2} placeholder="" value={rejectNote} onChange={function(e){setRejectNote(e.target.value);setErr("");}}
          style={{ width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #E2E8F0", fontSize:14, boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}/>
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
var Sidebar = function(p) {
  var t = p.t; var isAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin";
  var isSales = p.cu.role==="sales";
  var isSalesOrTL = p.cu.role==="sales"||p.cu.role==="team_leader";
  var items = [
    {id:"dashboard",icon:Home,label:t.dashboard},
    isSalesOrTL&&{id:"myday",icon:CheckCircle,label:t.myDay},
    {id:"leads",icon:Users,label:t.leads},
    {id:"dailyReq",icon:ClipboardList,label:t.dailyReq},
    {id:"deals",icon:Briefcase,label:t.deals},
    {id:"eoi",icon:Target,label:"EOI"},
    {id:"tasks",icon:CheckCircle,label:t.tasks},
    isSalesOrTL&&{id:"kpis",icon:TrendingUp,label:"KPIs"},
    isSales&&{id:"calendar",icon:Calendar,label:"Calendar"},
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
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9 }}></div>
        </div>
        {p.isMobile&&<button onClick={p.onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.6)", display:"flex" }}><X size={18}/></button>}
      </div>
      <div style={{ flex:1, padding:"8px 6px", overflowY:"auto" }}>
        {items.map(function(item){ var I=item.icon; var act=p.active===item.id;
          return <button key={item.id} onClick={function(){p.setActive(item.id);try{localStorage.setItem("crm_page",item.id);}catch(e){}if(p.isMobile)p.onClose();}} style={{ width:"100%", display:"flex", alignItems:"center", gap:11, padding:"10px 14px", background:act?"rgba(232,168,56,0.18)":"transparent", border:"none", borderRadius:8, cursor:"pointer", color:act?C.accent:"rgba(255,255,255,0.62)", fontSize:13, fontWeight:act?600:400, marginBottom:1, textAlign:isRTL?"right":"left" }}><I size={17}/><span>{item.label}</span></button>;
        })}
      </div>
      <div style={{ padding:"14px 16px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#3B82F6,#1D4ED8)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0 }}>{(p.cu.username==="amgad"?"Amgad Mohamed":p.cu.name)[0]}</div>
          <div style={{ flex:1, minWidth:0 }}><div style={{ color:"#fff", fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.cu.username==="amgad"?"Amgad Mohamed":p.cu.name}</div><div style={{ color:"rgba(255,255,255,0.4)", fontSize:10 }}>{p.cu.title}</div></div>
        </div>
        <button onClick={p.onLogout} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px", background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, color:"rgba(255,255,255,0.55)", fontSize:12, cursor:"pointer" }}><LogOut size={14}/> {t.logout}</button>
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
              {p.dealNotifs&&p.dealNotifs.length>0&&<span style={{ background:"#F0FDF4", color:"#15803D", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>{p.dealNotifs.length}</span>}
            </div>
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              {p.unseenDeals>0&&<button onClick={function(){if(p.onDealNotifSeen)p.onDealNotifSeen();}} style={{ background:"#F0FDF4", border:"none", borderRadius:6, cursor:"pointer", fontSize:11, color:"#15803D", fontWeight:600, padding:"4px 10px" }}>Mark Read</button>}
              <button onClick={function(){p.setShowDealNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex", padding:4 }}><X size={15}/></button>
            </div>
          </div>
          <div style={{ overflowY:"auto", flex:1 }}>
            {(!p.dealNotifs||p.dealNotifs.length===0)&&<div style={{ padding:32, textAlign:"center", color:C.textLight, fontSize:13 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💰</div>No deals yet
            </div>}
            {p.dealNotifs&&p.dealNotifs.filter(function(n){
              if(p.cu.role!=="team_leader") return true;
              var teamNames=new Set((p.myTeamUsers||[]).map(function(u){return u.name;}));
              teamNames.add(p.cu.name);
              return teamNames.has(n.agentName);
            }).map(function(n){var isDeal=n.status==="DoneDeal";return <div key={n._id||n.id} style={{ padding:"12px 18px", borderBottom:"1px solid #F8FAFC", display:"flex", alignItems:"center", gap:12, background:n.seen?"#fff":"#FAFFFE", transition:"background 0.2s" }}>
              <div style={{ width:38, height:38, borderRadius:10, background:isDeal?"linear-gradient(135deg,#DCFCE7,#BBF7D0)":"linear-gradient(135deg,#FFF7ED,#FED7AA)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>{isDeal?"🎉":"🎯"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{isDeal?"Done Deal":"EOI"}{n.leadName?" — "+n.leadName:""}</div>
                <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>{n.agentName?"By "+n.agentName:""}{n.budget?" · "+n.budget+" EGP":""}</div>
                <div style={{ fontSize:10, color:C.textLight, marginTop:1 }}>{timeAgo(n.createdAt||n.time,p.t)}</div>
              </div>
              {!n.seen&&<div style={{ width:8, height:8, borderRadius:"50%", background:"#15803D", flexShrink:0 }}/>}
            </div>;})}
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
              {p.unseenRot>0&&<button onClick={function(){if(p.onRotNotifSeen)p.onRotNotifSeen();}} style={{ background:"#FFF7ED", border:"none", borderRadius:6, cursor:"pointer", fontSize:11, color:"#EA580C", fontWeight:600, padding:"4px 10px" }}>Mark Read</button>}
              <button onClick={function(){if(p.setShowRotNotif)p.setShowRotNotif(false);}} style={{ background:"none", border:"none", cursor:"pointer", color:C.textLight, display:"flex", padding:4 }}><X size={15}/></button>
            </div>
          </div>
          <div style={{ overflowY:"auto", flex:1 }}>
            {(!p.rotNotifs||p.rotNotifs.length===0)&&<div style={{ padding:32, textAlign:"center", color:C.textLight, fontSize:13 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🔄</div>No rotations
            </div>}
            {p.rotNotifs&&p.rotNotifs.map(function(n){return <div key={n._id||n.id} style={{ padding:"12px 18px", borderBottom:"1px solid #F8FAFC", display:"flex", alignItems:"center", gap:12, background:n.seen?"#fff":"#FFFBF5", transition:"background 0.2s" }}>
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
            </div>;})}
          </div>
        </div>}
      </div>}

      {/* BELL 1 — Callbacks (isolated component) */}
      <CallbackBell t={p.t} leads={p.leads} dailyRequests={p.dailyRequests} cu={p.cu} myTeamUsers={p.myTeamUsers} showNotif={p.showNotif} setShowNotif={p.setShowNotif} setShowDealNotif={p.setShowDealNotif} setShowRotNotif={p.setShowRotNotif} onLeadClick={p.onLeadClick} onDRClick={p.onDRClick}/>
    </div>
  </div>;
};

// ===== LEAD FORM (shared for add/edit) =====
var LeadForm = function(p) {
  var t = p.t; var isAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader";
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
  var isReq = p.isReq||false;
  var isEOIForm = p.initialStatus==="EOI"||(p.editId&&p.initial&&p.initial.status==="EOI");

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
    if (isEOIForm && !form.budget) { alert("Please enter the Amount (EGP)"); return; }
    if (isEOIForm && !form.project) { alert("Please enter the Project"); return; }
    if (isEOIForm && !form.eoiDeposit) { alert("Please enter the Deposit (EGP)"); return; }
    setSaving(true);
    try {
      var payload = Object.assign({}, form, { source: isReq?"Daily Request":form.source, agentId: form.agentId||"", status: p.editId ? (form.status||"Potential") : (p.initialStatus||"NewLead"), phone2: form.phone2||"" });
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
      <Inp label={t.phone} req value={form.phone} onChange={function(e){upd("phone",e.target.value);checkDup(e.target.value);}} placeholder=""/>
      <Inp label={t.phone2} value={form.phone2||""} onChange={function(e){upd("phone2",e.target.value);}} placeholder=""/>
      <Inp label={t.email} value={form.email} onChange={function(e){upd("email",e.target.value);}}/>
      <Inp label={isEOIForm?"💰 Amount (EGP)":t.budget} req={isEOIForm} value={form.budget} onChange={function(e){var raw=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");upd("budget",raw?Number(raw).toLocaleString():"");}}/>
    </div>
    <Inp label={t.project} req={isEOIForm} value={form.project||""} onChange={function(e){upd("project",e.target.value);}} placeholder=""/>
    <Inp label="Campaign Name" value={form.campaign||""} onChange={function(e){upd("campaign",e.target.value);}} placeholder="e.g. Campaign A April"/>
    {!isReq&&<Inp label={t.source} type="select" value={form.source} onChange={function(e){upd("source",e.target.value);}} options={SOURCES.map(function(x){return{value:x,label:x};})}/>}
    {isAdmin&&<Inp label={t.agent} type="select" value={form.agentId} onChange={function(e){upd("agentId",e.target.value);}} options={[{value:"",label:"- Select -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name+" - "+u.title};}))}/>}
    {isEOIForm&&<Inp label="📅 EOI Date" type="date" value={form.eoiDate||""} onChange={function(e){upd("eoiDate",e.target.value);}}/>}
    {isEOIForm&&<Inp label="💵 Deposit (EGP)" req value={form.eoiDeposit||""} onChange={function(e){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");upd("eoiDeposit",r?Number(r).toLocaleString():"");}} placeholder=""/>}
    {!isEOIForm&&<Inp label={t.callbackTime} type="datetime-local" value={form.callbackTime} onChange={function(e){upd("callbackTime",e.target.value);}}/>}
    <Inp label={t.notes} type="textarea" value={form.notes} onChange={function(e){upd("notes",e.target.value);}}/>
    {(p.initialStatus==="DoneDeal"||(p.editId&&p.initial&&p.initial.status==="DoneDeal"))&&<Inp label="Deal Date" type="date" value={form.dealDate||""} onChange={function(e){upd("dealDate",e.target.value);}}/>}
    {(p.initialStatus==="DoneDeal"||(p.editId&&p.initial&&p.initial.status==="DoneDeal"))&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
      <Inp label="Down Payment %" value={form.downPaymentPct||""} onChange={function(e){upd("downPaymentPct",e.target.value.replace(/[^0-9.]/g,""));}} placeholder="e.g. 10"/>
      <Inp label="Installment Years" value={form.installmentYears||""} onChange={function(e){upd("installmentYears",e.target.value.replace(/[^0-9]/g,""));}} placeholder="e.g. 7"/>
    </div>}
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

// ===== LEADS PAGE =====
var LeadsPage = function(p) {
  var t = p.t; var sc = STATUSES(t);
  var isAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin = p.cu.role==="admin"||p.cu.role==="sales_admin";
  var salesUsers = p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
  var isManager = p.cu.role==="manager"||p.cu.role==="team_leader";
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
  var [quickForm, setQuickForm] = useState({name:"",phone:"",project:PROJECTS[0],source:"Facebook"});
  var [quickSaving, setQuickSaving] = useState(false);
  var [notifGranted, setNotifGranted] = useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  var [vipFilter, setVipFilter] = useState(false);
  var [noAgentFilter, setNoAgentFilter] = useState(false);
  var [agentFilter, setAgentFilter] = useState("");
  var [sortBy, setSortBy] = useState("lastActivity");
  var [panelHistory, setPanelHistory] = useState([]);
  var fileRef = useRef(null);

  // ---- Filter logic (uses state values above) ----
  var allVisible = p.leads.filter(function(l){
    if(l.archived) return false;
    var matchSource = isReq?l.source==="Daily Request":l.source!=="Daily Request";
    if(!matchSource) return false;
    // Hide EOI and DoneDeal from Leads page — they have their own pages
    if(!isReq && (l.status==="EOI"||l.status==="DoneDeal")) return false;
    // Manager: hide leads with no agent in daily request
    if(isReq && (p.cu.role==="manager"||p.cu.role==="team_leader") && !l.agentId) return false;
    return true;
  });
  var filtered = p.leadFilter==="all"?allVisible:allVisible.filter(function(l){return l.status===p.leadFilter;});
  filtered = filtered.filter(function(l){return matchSearch(l,p.search);});
  if (vipFilter) filtered = filtered.filter(function(l){return l.isVIP;});
  if (noAgentFilter) filtered = filtered.filter(function(l){ var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId; return !aid; });
  if (agentFilter) filtered = filtered.filter(function(l){ var aid=l.agentId&&l.agentId._id?l.agentId._id:l.agentId; return aid===agentFilter; });
  filtered = filtered.slice().sort(function(a,b){
    if (sortBy==="lastActivity") return new Date(b.lastActivityTime||0)-new Date(a.lastActivityTime||0);
    if (sortBy==="newest") return new Date(b.createdAt||0)-new Date(a.createdAt||0);
    if (sortBy==="oldest") return new Date(a.createdAt||0)-new Date(b.createdAt||0);
    if (sortBy==="name") return a.name.localeCompare(b.name,"ar");
    return 0;
  });

  useEffect(function(){ if(p.initSelected){setSelected(p.initSelected);} },[p.initSelected]);

  // Fetch full history when a lead is selected
  useEffect(function(){
    if(!selected){setPanelHistory([]);return;}
    var lid=gid(selected);
    apiFetch("/api/leads/"+lid+"/full-history","GET",null,p.token).then(function(hist){
      var all=hist||[];
      var isAdminRole=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader";
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

  var confirmStatus = async function(comment, cbTime, extra) {
    if(!pendingStatus) return;
    try {
      var upData = { status: pendingStatus.newStatus };
      if(comment) upData.lastFeedback = comment;
      if(cbTime) upData.callbackTime = cbTime;
      else upData.callbackTime = "";
      if(extra) {
        if(extra.budget)     upData.budget     = extra.budget;
        if(extra.project)    upData.project    = extra.project;
        if(extra.notes)      upData.notes      = extra.notes;
        if(extra.eoiDeposit) upData.eoiDeposit = extra.eoiDeposit;
        if(extra.deposit) {
          upData.notes = (upData.notes?upData.notes+" | ":"")+"Down Payment: "+extra.deposit+" EGP | Installments: "+extra.instalment+" EGP";
        }
      }
      if(comment) upData.notes = comment;
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
    var isAdminRole = p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader";
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

  var doBulkReassign = async function() {
    if(!bulkAgent||selected2.length===0) return;
    try {
      await apiFetch("/api/leads/bulk-reassign","PUT",{leadIds:selected2,agentId:bulkAgent},p.token,p.csrfToken);
      var updAgent=p.users.find(function(u){return gid(u)===bulkAgent;});
      p.setLeads(function(prev){return prev.map(function(l){return selected2.includes(gid(l))?Object.assign({},l,{agentId:updAgent||bulkAgent}):l;});});
      setSelected2([]); setShowBulk(false);
    } catch(e){alert(e.message);}
  };

  var leadActs = selected ? p.activities.filter(function(a){ var lid=gid(selected); return a.leadId&&(gid(a.leadId)===lid||a.leadId===lid); }) : [];

  return <div style={{ padding:"18px 16px 40px" }}>
    <WaChooser show={!!waChooser} phone={waChooser} onClose={function(){setWaChooser(null);}}/>
    {showStatusPicker&&selected&&!showStatusComment&&<Modal show={true} onClose={function(){setShowStatusPicker(false);}} title={t.changeStatus}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        {sc.map(function(s){return <button key={s.value} onClick={function(){reqStatus(gid(selected),s.value);}} style={{ padding:"8px 14px", borderRadius:9, border:"1px solid "+s.color, background:selected.status===s.value?s.bg:"#fff", color:s.color, fontSize:13, fontWeight:600, cursor:"pointer" }}>{s.label}</button>;})}
      </div>
      <Btn outline onClick={function(){setShowStatusPicker(false);}} style={{ width:"100%" }}>{t.cancel}</Btn>
    </Modal>}
    <StatusModal show={showStatusComment} t={t} newStatus={pendingStatus?pendingStatus.newStatus:null} lead={selected} onClose={function(){setShowStatusComment(false);}} onConfirm={confirmStatus}/>

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
        {[{v:"all",l:t.all}].concat(sc.map(function(s){return{v:s.value,l:s.label};})).map(function(s){
          var cnt=s.v==="all"?allVisible.length:allVisible.filter(function(l){return l.status===s.v;}).length;
          return <button key={s.v} onClick={function(){p.setFilter(s.v);}} style={{ padding:"5px 10px", borderRadius:7, border:"1px solid", borderColor:p.leadFilter===s.v?C.accent:"#E8ECF1", background:p.leadFilter===s.v?C.accent+"12":"#fff", color:p.leadFilter===s.v?C.accent:C.textLight, fontSize:11, fontWeight:500, cursor:"pointer" }}>{s.l} ({cnt})</button>;
        })}
      </div>
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
        <select value={sortBy} onChange={function(e){setSortBy(e.target.value);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
          <option value="lastActivity">⏱ Last Activity</option>
          <option value="newest">🆕 Newest</option>
          <option value="oldest">📅 Oldest</option>
          <option value="name">🔤 Name</option>
        </select>
        {isAdmin&&<select value={agentFilter} onChange={function(e){setAgentFilter(e.target.value);setNoAgentFilter(false);}} style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #E2E8F0", fontSize:12, background:"#fff", color:C.text }}>
          <option value="">👤 All Agents</option>
          {salesUsers.map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name}</option>;})}
        </select>}
        {isOnlyAdmin&&<button onClick={function(){setNoAgentFilter(!noAgentFilter);setAgentFilter("");}} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid", borderColor:noAgentFilter?"#EF4444":"#E8ECF1", background:noAgentFilter?"#FEE2E2":"#fff", color:noAgentFilter?"#B91C1C":C.textLight, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>🚫 No Agent {noAgentFilter?"✓":""}</button>}
        <button onClick={function(){setVipFilter(!vipFilter);}} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid", borderColor:vipFilter?"#F59E0B":"#E8ECF1", background:vipFilter?"#FEF3C7":"#fff", color:vipFilter?"#B45309":C.textLight, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>⭐ VIP Only {vipFilter?"✓":""}</button>
      </div>
    </div>
    {importMsg&&<div style={{ marginBottom:10, padding:"9px 14px", background:importMsg.startsWith("✅")?"#DCFCE7":"#FEE2E2", color:importMsg.startsWith("✅")?"#15803D":"#B91C1C", borderRadius:9, fontSize:13 }}>{importMsg}</div>}

    <div style={{ display:"flex", gap:14, paddingRight:!p.isMobile&&selected?330:0, transition:"padding-right 0.25s" }}>
      {/* Status dropdown overlay */}
      {statusDrop&&<div style={{ position:"fixed", inset:0, zIndex:499 }} onClick={function(){setStatusDrop(null);}}/>}
    {/* Table */}
      {p.isMobile&&!selected?<div style={{ display:"flex", flexDirection:"column", gap:12, padding:"4px 16px", maxWidth:480, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
        {filtered.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight }}>No data</div>}
        {filtered.map(function(lead){
          var lid=gid(lead); var so=sc.find(function(s){return s.value===lead.status;})||sc[0]; var isVIP=lead.isVIP;
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
            {/* Project + Last Activity */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              {lead.project?<span style={{ fontSize:11, color:"#6D28D9", fontWeight:700, background:"#EDE9FE", padding:"2px 8px", borderRadius:6 }}>📍 {lead.project}</span>:<span style={{ color:C.textLight, fontSize:11 }}>—</span>}
              <span style={{ fontSize:11, color:actColor, fontWeight:600 }}>🕐 {lastAct}</span>
            </div>
            {/* Last Feedback */}
            {lead.lastFeedback&&<div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:8, padding:"6px 10px", background:"#F8FAFC", borderRadius:8, borderLeft:"3px solid "+C.accent }}>💬 {lead.lastFeedback}</div>}
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
              <button onClick={function(e){e.stopPropagation();openHistory(lead);}} style={{ padding:"11px 14px", borderRadius:10, background:"#F3E8FF", color:"#7C3AED", fontSize:13, fontWeight:700, border:"1px solid #DDD6FE", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                📋
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
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:100 }}>{t.project}</th>
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:110 }}>{t.status}</th>
              {!p.isMobile&&<th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>Last Feedback</th>}
              {!p.isMobile&&isAdmin&&<th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:90 }}>{t.source}</th>}
              {isAdmin&&<th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:100 }}>{t.agent}</th>}
              <th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:90 }}>{t.lastActivity}</th>
              {!p.isMobile&&<th style={{ textAlign:"left", padding:"10px 12px", fontSize:11, fontWeight:600, color:C.textLight, minWidth:120 }}>{t.callbackTime}</th>}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:C.textLight, fontSize:13 }}>No data</td></tr>}
              {filtered.map(function(lead){
                var lid=gid(lead); var so=sc.find(function(s){return s.value===lead.status;})||sc[0];
                var isSel=selected&&gid(selected)===lid; var isChk=selected2.includes(lid); var isVIP=lead.isVIP;
                var isRotated = isOnlyAdmin && lead.previousAgentIds && lead.previousAgentIds.filter(function(x){ return x != null; }).length > 0;
                return <tr key={lid} onClick={function(){setSelected(lead);}} style={{ borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:isSel?"#EFF6FF":isVIP?"#FFFBEB":isChk?"#F0FDF4":isRotated?"#FFF7ED":"transparent", transition:"background 0.12s", borderRight:isVIP?"3px solid #F59E0B":"3px solid transparent" }}>
                  <td style={{ padding:"10px 8px" }} onClick={function(e){e.stopPropagation();setSelected2(function(prev){return prev.includes(lid)?prev.filter(function(x){return x!==lid;}):[...prev,lid];});}}><input type="checkbox" checked={isChk} readOnly/></td>
                  <td style={{ padding:"10px 12px", textAlign:"left" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {lead.isVIP&&<span style={{ fontSize:14 }} title="VIP">⭐</span>}
                      {lead.locked&&<span style={{ fontSize:12 }} title="Locked — no rotation">🔒</span>}
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
                  <td style={{ padding:"10px 12px", fontSize:12, color:C.textLight, textAlign:"left", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.project}</td>
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
                    {(function(){if(!isOnlyAdmin||!lead.assignments||lead.assignments.length<=1)return null;var SP=["MeetingDone","HotCase","Potential","CallBack","NoAnswer","NotInterested","NewLead"];var SL={"MeetingDone":"Meeting Done","HotCase":"Hot Case","Potential":"Potential","CallBack":"Call Back","NoAnswer":"No Answer","NotInterested":"Not Interested","NewLead":"New Lead"};var curIdx=SP.indexOf(lead.status);var bestIdx=SP.length;for(var ai=0;ai<lead.assignments.length;ai++){var si=SP.indexOf(lead.assignments[ai].status);if(si>=0&&si<bestIdx)bestIdx=si;}if(bestIdx>=curIdx||bestIdx>=SP.length)return null;return <span style={{background:"#F1F5F9",color:"#64748B",padding:"2px 6px",borderRadius:8,fontSize:10,fontWeight:500,marginLeft:4,whiteSpace:"nowrap"}}>was: {SL[SP[bestIdx]]||SP[bestIdx]}</span>;})()}
                  </td>
                  {!p.isMobile&&<td style={{ padding:"10px 12px", fontSize:13, fontWeight:700, color:C.text, textAlign:"left", maxWidth:220, wordBreak:"break-word", whiteSpace:"normal", lineHeight:1.4 }}>{lead.lastFeedback||<span style={{color:"#CBD5E1", fontWeight:400}}>-</span>}</td>}
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
                      {(isOnlyAdmin?salesUsers:(p.myTeamUsers||salesUsers).filter(function(u){return u.role==="sales"||u.role==="team_leader";})).map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name}</option>;})}
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
                  <td style={{ padding:"10px 8px" }} onClick={function(e){e.stopPropagation();}}>
                    <button onClick={function(e){e.stopPropagation();openHistory(lead);}} style={{ padding:"4px 8px", borderRadius:7, background:"#F3E8FF", color:"#7C3AED", fontSize:12, border:"1px solid #DDD6FE", cursor:"pointer" }} title="History">📋</button>
                  </td>
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
      {selected&&<Card style={p.isMobile?{ position:"fixed", inset:0, zIndex:300, borderRadius:0, overflowY:"auto", padding:0, margin:0 }:{ position:"fixed", top:0, right:0, bottom:0, width:320, zIndex:300, borderRadius:0, overflowY:"auto", padding:0, boxShadow:"-4px 0 24px rgba(0,0,0,0.12)" }}>
        <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:"14px 16px", position:"sticky", top:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <button onClick={function(){setSelected(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><X size={11}/></button>
            <div style={{ display:"flex", gap:5 }}>
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
              {(isOnlyAdmin?p.myTeamUsers||salesUsers:(p.myTeamUsers||salesUsers).filter(function(u){return u.role==="sales"||u.role==="team_leader";})).map(function(u){var uid=gid(u);return <option key={uid} value={uid}>{u.name}</option>;})}
            </select>
          </div>}
          {/* Assigned Agents — admin remove */}
          {isOnlyAdmin&&selected.assignments&&selected.assignments.length>1&&<div style={{ marginBottom:12, padding:10, background:"#F0F9FF", borderRadius:10, border:"1px solid #BFDBFE" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#1D4ED8", marginBottom:6 }}>👥 Assigned Agents ({selected.assignments.length})</div>
            {selected.assignments.map(function(a,i){
              var aName=a.agentId&&a.agentId.name?a.agentId.name:"Unknown";
              var aId=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;
              var isCurrent=String(aId)===String(selected.agentId&&selected.agentId._id?selected.agentId._id:selected.agentId);
              return <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:i<selected.assignments.length-1?"1px solid #DBEAFE":"none" }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:isCurrent?700:400, color:isCurrent?C.accent:C.text }}>{aName}</span>
                  {isCurrent&&<span style={{ fontSize:9, background:"#DCFCE7", color:"#15803D", padding:"1px 5px", borderRadius:6, marginLeft:4, fontWeight:600 }}>current</span>}
                  <span style={{ fontSize:10, color:C.textLight, marginLeft:4 }}>{a.status||""}</span>
                </div>
                <button onClick={async function(){
                  if(!window.confirm("Remove "+aName+" from this lead?"))return;
                  try{var upd=await apiFetch("/api/leads/"+gid(selected)+"/assignment/"+aId,"DELETE",null,p.token);p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selected)?upd:l;});});setSelected(upd);}catch(ex){alert(ex.message||"Failed");}
                }} style={{ background:"none", border:"none", cursor:"pointer", color:"#EF4444", fontSize:14, padding:"2px 6px", borderRadius:6 }} title="Remove agent">🗑</button>
              </div>;
            })}
          </div>}
          {/* Details - grid on mobile */}
          {p.isMobile?<div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              {[{l:t.budget,v:selected.budget,icon:"💰"},{l:t.source,v:isAdmin?selected.source:null,icon:"📢"},{l:t.agent,v:getAgentName(selected),icon:"👤"},{l:t.callbackTime,v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):null,icon:"📞"},{l:"Last Contact",v:selected.lastActivityTime?timeAgo(selected.lastActivityTime,t):null,icon:"🕐"},{l:"Date Added",v:isOnlyAdmin?selected.createdAt?new Date(selected.createdAt).toLocaleDateString("en-GB"):null:null,icon:"📅"}].map(function(f){return f.v?<div key={f.l} style={{ background:"#F8FAFC", borderRadius:12, padding:"10px 12px", border:"1px solid #E8ECF1" }}>
                <div style={{ fontSize:10, color:C.textLight, marginBottom:3, fontWeight:600 }}>{f.icon} {f.l}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, wordBreak:"break-word" }}>{f.v}</div>
              </div>:null;})}
            </div>
            {selected.notes&&<div style={{ background:"#FFFBEB", borderRadius:12, padding:"12px 14px", border:"1px solid #FDE68A", marginBottom:12 }}>
              <div style={{ fontSize:10, color:"#92400E", fontWeight:600, marginBottom:4 }}>📝 Notes</div>
              <div style={{ fontSize:13, color:C.text }}>{selected.notes}</div>
            </div>}
          </div>:[{l:t.budget,v:selected.budget},{l:t.source,v:isAdmin?selected.source:null},{l:t.agent,v:getAgentName(selected)},{l:t.callbackTime,v:selected.callbackTime?selected.callbackTime.slice(0,16).replace("T"," "):"-"},{l:"Last Contact",v:selected.lastActivityTime?new Date(selected.lastActivityTime).toLocaleDateString("en-GB")+" — "+timeAgo(selected.lastActivityTime,t):"-"},{l:"Date Added",v:isOnlyAdmin?selected.createdAt?new Date(selected.createdAt).toLocaleDateString("en-GB"):"-":null},{l:t.notes,v:selected.notes}].map(function(f){
            return f.v?<div key={f.l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #F1F5F9", gap:8 }}><span style={{ fontSize:11, color:C.textLight, flexShrink:0 }}>{f.l}</span><span style={{ fontSize:11, fontWeight:500, textAlign:"right", wordBreak:"break-word" }}>{f.v}</span></div>:null;
          })}
          {/* WhatsApp Templates */}
          <div style={{ marginTop:10, display:"flex", gap:6 }}>
            <button onClick={function(){setWaLead(selected);setShowWaTemplates(true);}} style={{ flex:1, padding:"7px 8px", borderRadius:9, border:"1px solid #25D366", background:"#25D36610", color:"#25D366", fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>💬 {t.waTemplates}</button>
            <button onClick={async function(){
              try{var newVip=!selected.isVIP;var upd=await apiFetch("/api/leads/"+gid(selected),"PUT",{isVIP:newVip},p.token);var merged=Object.assign({},selected,{isVIP:newVip});p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selected)?Object.assign({},l,{isVIP:newVip}):l;});});setSelected(merged);}catch(e){console.error("VIP error",e);}
            }} style={{ padding:"7px 10px", borderRadius:9, border:"1px solid "+(selected.isVIP?"#F59E0B":"#E2E8F0"), background:selected.isVIP?"#FEF3C7":"#fff", fontSize:13, cursor:"pointer" }} title={selected.isVIP?t.removeVip:t.markVip}>⭐</button>
            {(function(){
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
          </div>

          {/* Agent History — admin only */}
          {isOnlyAdmin&&selected.agentHistory&&selected.agentHistory.length>0&&<div style={{ marginTop:14, padding:10, background:"#F5F3FF", borderRadius:10, border:"1px solid #DDD6FE" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#7C3AED", marginBottom:8 }}>🔄 Rotation History ({selected.agentHistory.filter(function(h){return h.action==="Rotation";}).length})</div>
            {selected.agentHistory.slice().reverse().map(function(h,i){
              if(h.action==="Rotation"){
                var reasonLabel=h.reason==="auto_timeout"?"Auto Timeout":h.reason==="no_rotation_override"?"Admin Override":"Manual";
                return <div key={i} style={{ padding:"8px 0", borderBottom:"1px solid #EDE9FE" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{h.fromAgent||"Unassigned"} → {h.toAgent||"Unknown"}</div>
                  <div style={{ fontSize:10, color:C.textLight, marginTop:2 }}>
                    <span style={{ background:h.reason==="auto_timeout"?"#FEF3C7":h.reason==="no_rotation_override"?"#FEE2E2":"#E0E7FF", color:h.reason==="auto_timeout"?"#B45309":h.reason==="no_rotation_override"?"#DC2626":"#4338CA", padding:"1px 6px", borderRadius:6, fontSize:9, fontWeight:600, marginRight:4 }}>{reasonLabel}</span>
                    <span>by {h.by||"System"}</span>
                  </div>
                  <div style={{ fontSize:9, color:C.textLight, marginTop:3 }}>{h.date?new Date(h.date).toLocaleString("en-GB"):""}</div>
                </div>;
              }
              // Legacy format fallback
              return <div key={i} style={{ padding:"8px 0", borderBottom:"1px solid #EDE9FE" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{h.agentName||h.note||"Unknown"}</div>
                <div style={{ fontSize:10, color:C.textLight, marginTop:2 }}>
                  {h.status&&<span style={{ background:"#E0E7FF", color:"#4338CA", padding:"1px 6px", borderRadius:6, fontSize:9, fontWeight:600, marginRight:4 }}>{h.status}</span>}
                  {h.budget&&<span style={{ color:C.success, fontWeight:600 }}>{h.budget} EGP</span>}
                </div>
                {h.feedback&&<div style={{ fontSize:11, color:C.text, marginTop:4, padding:"4px 8px", background:"#fff", borderRadius:6 }}>💬 {h.feedback}</div>}
                <div style={{ fontSize:9, color:C.textLight, marginTop:3 }}>
                  {h.assignedAt?new Date(h.assignedAt).toLocaleDateString("en-GB"):""}
                  {h.removedAt?" → "+new Date(h.removedAt).toLocaleDateString("en-GB"):""}
                  {h.date?new Date(h.date).toLocaleString("en-GB"):""}
                </div>
              </div>;
            })}
          </div>}

          {/* Activity Log — full history */}
          <div style={{ marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:11, color:C.textLight, fontWeight:600 }}>{t.clientHistory} ({panelHistory.length})</span>
              {isOnlyAdmin&&selected&&(selected.rotationCount||0)>0&&<span style={{ fontSize:9, background:"#FEF3C7", color:"#B45309", padding:"2px 6px", borderRadius:6, fontWeight:600 }}>🔄 {selected.rotationCount} transfers</span>}
            </div>
            {panelHistory.length===0&&<div style={{ fontSize:11, color:C.textLight, textAlign:"center", padding:12 }}>No history</div>}
            {panelHistory.map(function(a,i){var uname=a.userId&&a.userId.name?a.userId.name:"";return <div key={a._id||i} style={{ fontSize:10, padding:"8px 0", borderBottom:"1px solid #F8FAFC" }}>
              <div style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                <span style={{ flexShrink:0 }}>{a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":a.type==="reassign"?"↩️":a.type==="note"?"📝":"🔔"}</span>
                <span style={{ flex:1 }}>{a.note}</span>
                <span style={{ color:C.textLight, flexShrink:0 }}>{timeAgo(a.createdAt,t)}</span>
              </div>
              {uname&&<div style={{ fontSize:9, color:C.textLight, marginTop:2 }}>{uname} · {new Date(a.createdAt).toLocaleDateString("en-GB")}</div>}
            </div>;})}
          </div>
        </div>
      </Card>}
    </div>

    {/* Full History Modal */}
    {showHistory&&historyLead&&<Modal show={true} onClose={function(){setShowHistory(false);setHistoryLead(null);}} title={"📋 Lead History — "+historyLead.name} w={520}>
      {historyLoading&&<div style={{ textAlign:"center", padding:30, color:C.textLight }}>Loading...</div>}
      {!historyLoading&&fullHistory.length===0&&<div style={{ textAlign:"center", padding:30, color:C.textLight }}>No activity history</div>}
      {!historyLoading&&fullHistory.length>0&&<div style={{ maxHeight:500, overflowY:"auto" }}>
        <div style={{ fontSize:11, color:C.textLight, marginBottom:10, padding:"6px 10px", background:"#F8FAFC", borderRadius:8 }}>
          {fullHistory.length} activity — من الأحدث للأقدم
        </div>
        {fullHistory.slice().reverse().map(function(a,i){
          var uname=a.userId&&a.userId.name?a.userId.name:"";
          var icon=a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":a.type==="reassign"?"↩️":a.type==="note"?"📝":"🔔";
          return <div key={a._id||i} style={{ padding:"10px 0", borderBottom:"1px solid #F1F5F9" }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:C.text }}>{a.note}</div>
                <div style={{ fontSize:10, color:C.textLight, marginTop:3, display:"flex", gap:8, flexWrap:"wrap" }}>
                  {uname&&<span style={{ fontWeight:700, color:C.accent }}>👤 {uname}</span>}
                  <span>📅 {a.createdAt?new Date(a.createdAt).toLocaleDateString("en-GB")+" "+new Date(a.createdAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):""}</span>
                </div>
              </div>
            </div>
          </div>;
        })}
      </div>}
    </Modal>}

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
  // eslint-disable-next-line no-unused-vars
  var [tick, setTick] = useState(0);
  useEffect(function(){
    var id = setInterval(function(){ setTick(function(t){return t+1;}); }, 1000);
    return function(){ clearInterval(id); };
  },[]);
  var now = Date.now();
  var DAY=86400000, WEEK=7*DAY, MONTH=30*DAY;
  var rangeMs = filter==="today"?DAY:filter==="week"?WEEK:MONTH;

  var leads = useMemo(function(){
    return (p.leads||[]).filter(function(l){return !l.archived&&l.source!=="Daily Request";});
  },[p.leads]);

  var timeStr = new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  var hourNow = new Date().getHours();
  var greeting = hourNow<6 ? "Good Night \ud83d\ude34" : hourNow<12 ? "Good Morning \u2600\ufe0f" : hourNow<18 ? "Good Afternoon \ud83c\udf24\ufe0f" : hourNow<24 ? "Good Evening \ud83c\udf06" : "Good Night \ud83d\ude34";

  if(!leads.length) return <div style={{padding:40,textAlign:"center",color:"#94A3B8",fontSize:14}}>Loading data...</div>;

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

  var agentPerf=(p.users||[]).filter(function(u){return u.role==="sales"||u.role==="sales_admin";}).map(function(u){
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
  var kpiCard=function(label,value,sub,bg,vc,onClick){
    var bars=[30,45,55,40,65,70,85];
    return <div onClick={onClick} style={{background:bg,borderRadius:14,padding:"16px",cursor:onClick?"pointer":"default"}}>
      <div style={{fontSize:11,fontWeight:600,color:vc,opacity:0.75,marginBottom:6}}>{label}</div>
      <div style={{fontSize:28,fontWeight:800,color:vc,lineHeight:1}}>{value}</div>
      <div style={{fontSize:11,color:vc,opacity:0.6,marginTop:4}}>{sub}</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:2,height:20,marginTop:8}}>
        {bars.map(function(h,i){return <div key={i} style={{flex:1,borderRadius:2,height:h+"%",background:vc,opacity:i===6?0.8:0.2}}/>;})}</div>
      <div style={{display:"flex",gap:2,marginTop:3}}>
        {weekDays.map(function(d,i){return <div key={i} style={{flex:1,fontSize:"6px",textAlign:"center",color:vc,opacity:0.5}}>{d}</div>;})}</div>
    </div>;
  };

  var bRow=function(label,count,total2,color){
    var pct=total2>0?Math.max(2,Math.round(count/total2*100)):0;
    return <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
      <div style={{fontSize:12,color:"#64748B",width:82,flexShrink:0}}>{label}</div>
      <div style={{flex:1,height:5,background:"#F1F5F9",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:color,borderRadius:3}}/></div>
      <div style={{fontSize:12,fontWeight:600,color:"#334155",width:28,textAlign:"right"}}>{count}</div>
    </div>;
  };

  var card=function(children,extra){return <div style={Object.assign({background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:"20px 22px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"},extra||{})}>{children}</div>;};
  var sec=function(label){return <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",letterSpacing:"0.1em",textTransform:"uppercase",margin:"24px 0 12px"}}>{label}</div>;};
  var qBadge=function(q){var m2={High:["#DCFCE7","#166534"],Medium:["#FEF3C7","#92400E"],Low:["#FEE2E2","#991B1B"]};var c2=m2[q]||m2.Low;return <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:c2[0],color:c2[1]}}>{q}</span>;};

  if(!isOnlyAdmin) {
    var myLeads2 = leads.filter(function(l){return l.assignments&&l.assignments.some(function(a){return String(a.agentId&&a.agentId._id?a.agentId._id:a.agentId)===String(p.cu._id||p.cu.id);});});
    var myTotal2=myLeads2.length;
    var myInt2=myLeads2.filter(function(l){return["HotCase","Potential","MeetingDone","DoneDeal"].includes(l.status);}).length;
    var myMeet2=myLeads2.filter(function(l){return["MeetingDone","DoneDeal"].includes(l.status);}).length;
    var myOv2=myLeads2.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).getTime()<now;}).length;
    var myDR2=(p.activities||[]).filter(function(a){return String(a.userId&&a.userId._id?a.userId._id:a.userId)===String(p.cu._id||p.cu.id)&&a.type==="daily_request";}).length;
    var urgent2=myLeads2.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).getTime()<now;}).sort(function(a,b){return new Date(a.callbackTime)-new Date(b.callbackTime);}).slice(0,5);
    var urgentNew2=myLeads2.filter(function(l){return l.status==="NewLead"&&l.createdAt&&(now-new Date(l.createdAt).getTime())>2*3600000;}).slice(0,3);
    var schedule2=myLeads2.filter(function(l){return l.callbackTime&&!l.archived;}).sort(function(a,b){return new Date(a.callbackTime)-new Date(b.callbackTime);}).slice(0,7);
    var mySC2={};myLeads2.forEach(function(l){mySC2[l.status]=(mySC2[l.status]||0)+1;});
    var recentActs2=(p.activities||[]).filter(function(a){return String(a.userId&&a.userId._id?a.userId._id:a.userId)===String(p.cu._id||p.cu.id);}).slice(-6).reverse();
    var allUsers2=(p.users||[]).filter(function(u){return u.role==="sales"||u.role==="sales_admin";});
    var statusColors2={"NewLead":"#1565C0","Potential":"#00796B","HotCase":"#E65100","CallBack":"#6A1B9A","MeetingDone":"#2E7D32","NotInterested":"#EF4444","NoAnswer":"#94A3B8","DoneDeal":"#065F46"};
    var rankBar2=function(label,pos,total2){
      var arr=Array.from({length:total2},function(_,i){return i;});
      return <div style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
          <span style={{color:"#64748B"}}>{label}</span>
          <span style={{fontWeight:700,color:pos===1?"#1565C0":pos===2?"#6A1B9A":"#94A3B8"}}>{pos} of {total2}</span>
        </div>
        <div style={{display:"flex",gap:2}}>
          {arr.map(function(_,i){return <div key={i} style={{flex:1,height:6,borderRadius:3,background:i===(pos-1)?"#1565C0":i<(pos-1)?"#BFDBFE":"#F1F5F9"}}/>;}) }
        </div>
      </div>;
    };
    return <div style={{padding:"16px 12px 40px",background:"#F1F5F9"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:"#0F172A"}}>{greeting} {p.cu.name}</div>
          <div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{timeStr} {"\u00b7"} {new Date().toDateString()}</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {[["today","Today"],["week","This Week"],["month","This Month"]].map(function(f){return <button key={f[0]} onClick={function(){setFilter(f[0]);}} style={{fontSize:12,padding:"6px 12px",border:filter===f[0]?"1px solid #3B82F6":"1px solid #E2E8F0",borderRadius:8,background:filter===f[0]?"#EFF6FF":"#fff",color:filter===f[0]?"#1D4ED8":"#64748B",cursor:"pointer",fontWeight:filter===f[0]?600:500}}>{f[1]}</button>;})}
          <div style={{position:"relative"}}>
            <button onClick={function(){setQOpen(!qOpen);}} style={{fontSize:12,padding:"6px 12px",border:"1px solid #E2E8F0",borderRadius:8,background:"#fff",color:"#64748B",cursor:"pointer"}}>{"Quarter \u25be"}</button>
            {qOpen&&<div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,minWidth:110,zIndex:99,boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
              {["Q1 2026","Q2 2026","Q3 2026","Q4 2025"].map(function(q){return <div key={q} onClick={function(){setFilter(q);setQOpen(false);}} style={{padding:"8px 14px",fontSize:12,color:"#334155",cursor:"pointer"}}>{q}</div>;})}
            </div>}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:20}}>
        {kpiCard("My Leads",myTotal2,"assigned","#1565C0","#ffffff",function(){p.nav("leads");})}
        {kpiCard("Daily Requests",myDR2,"total","#00796B","#ffffff",null)}
        {kpiCard("Followups",myLeads2.filter(function(l){return l.callbackTime&&!l.archived;}).length,"scheduled","#E65100","#ffffff",function(){p.nav("leads");p.setFilter&&p.setFilter("CallBack");})}
        {kpiCard("Interested",myInt2,myTotal2>0?Math.round(myInt2/myTotal2*100)+"%":"0%","#6A1B9A","#ffffff",null)}
        {kpiCard("Meetings",myMeet2,myTotal2>0?Math.round(myMeet2/myTotal2*100)+"%":"0%","#2E7D32","#ffffff",null)}
        {kpiCard("Target",myTotal2>0?Math.round(myMeet2/myTotal2*100*5)+"%":"0%","this month","#AD1457","#ffffff",null)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:14}}>
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:14}}>My Rank vs Team</div>
          <div style={{fontSize:11,color:"#94A3B8",marginBottom:12}}>{"Position only \u2014 no team numbers shown"}</div>
          {rankBar2("Activity",1,allUsers2.length)}
          {rankBar2("Followups",1,allUsers2.length)}
          {rankBar2("Meetings",myMeet2>0?1:2,allUsers2.length)}
          {rankBar2("Response time",1,allUsers2.length)}
          {rankBar2("Target %",1,allUsers2.length)}
          <div style={{borderTop:"1px solid #F1F5F9",marginTop:10,paddingTop:10,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>{"\ud83e\udd47"}</span>
            <div><div style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>Overall rank: 1st</div><div style={{fontSize:11,color:"#94A3B8"}}>Score {Math.min(99,Math.round(myInt2/Math.max(myTotal2,1)*100*0.4+myMeet2/Math.max(myTotal2,1)*100*0.3+30))}/100</div></div>
          </div>
        </div>
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:14}}>{"\ud83d\udea8"} Urgent {"\u2014"} Action Needed</div>
          {urgent2.length===0&&urgentNew2.length===0&&<div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>{"\u2705"} No urgent items</div>}
          {urgent2.map(function(l,i){var mins=Math.round((now-new Date(l.callbackTime).getTime())/60000);return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #F8FAFC"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#EF4444",flexShrink:0}}/>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{l.name}</div><div style={{fontSize:11,color:"#94A3B8"}}>Overdue {mins>60?Math.round(mins/60)+"h":mins+"min"} {"\u00b7"} {l.status}</div></div>
            <span style={{fontSize:11,fontWeight:700,color:"#DC2626"}}>LATE</span>
          </div>;})}
          {urgentNew2.map(function(l,i){var hrs=Math.round((now-new Date(l.createdAt).getTime())/3600000);return <div key={"n"+i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #F8FAFC"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#3B82F6",flexShrink:0}}/>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{l.name}</div><div style={{fontSize:11,color:"#94A3B8"}}>New lead {"\u2014"} no action {hrs}h</div></div>
            <span style={{fontSize:11,fontWeight:700,color:"#1D4ED8"}}>NEW</span>
          </div>;})}
        </div>
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:14}}>{"\ud83d\udcc5"} Today's Schedule</div>
          {schedule2.length===0&&<div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>No callbacks scheduled today</div>}
          {schedule2.map(function(l,i){
            var t2=l.callbackTime?new Date(l.callbackTime).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"\u2014";
            var isLate2=l.callbackTime&&new Date(l.callbackTime).getTime()<now;
            return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #F8FAFC"}}>
              <div style={{fontSize:11,color:isLate2?"#DC2626":"#64748B",width:38,flexShrink:0,fontWeight:600}}>{t2}</div>
              <div style={{flex:1}}><div style={{fontSize:13,color:"#0F172A"}}>{l.name}</div><div style={{fontSize:11,color:isLate2?"#DC2626":"#94A3B8"}}>{isLate2?"Overdue":"Callback scheduled"}</div></div>
              <div style={{width:8,height:8,borderRadius:"50%",background:isLate2?"#EF4444":"#10B981"}}/>
            </div>;
          })}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:14}}>
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:14}}>My Leads {"\u2014"} Status</div>
          {[["New Lead","NewLead","#3B82F6"],["Potential","Potential","#10B981"],["Hot Case","HotCase","#F59E0B"],["Call Back","CallBack","#EF4444"],["Meeting","MeetingDone","#8B5CF6"],["Not Int.","NotInterested","#94A3B8"]].map(function(s){return bRow(s[0],mySC2[s[1]]||0,myTotal2,s[2]);}) }
          <div style={{borderTop:"1px solid #F1F5F9",marginTop:8,paddingTop:8,display:"flex",gap:14,fontSize:11}}>
            <span style={{color:"#64748B"}}>Overdue: <span style={{color:"#EF4444",fontWeight:700}}>{myOv2}</span></span>
            <span style={{color:"#64748B"}}>Untouched: <span style={{color:"#3B82F6",fontWeight:700}}>{myLeads2.filter(function(l){return l.status==="NewLead"&&l.createdAt&&(now-new Date(l.createdAt).getTime())>2*DAY;}).length}</span></span>
          </div>
        </div>
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:14}}>My Conversion Funnel</div>
          {[{l:"Assigned",v:myTotal2,c:"#DBEAFE",tc:"#1E40AF"},{l:"Contacted",v:myTotal2-(mySC2["NewLead"]||0),c:"#DCFCE7",tc:"#166534"},{l:"Interested",v:myInt2,c:"#FEF3C7",tc:"#92400E"},{l:"Hot Case",v:mySC2["HotCase"]||0,c:"#EDE9FE",tc:"#5B21B6"},{l:"Meeting",v:myMeet2,c:"#D1FAE5",tc:"#065F46"},{l:"Deal",v:mySC2["DoneDeal"]||0,c:"#FFE4E6",tc:"#9F1239"}].map(function(row,i){
            var pct=myTotal2>0?Math.max(6,Math.round(row.v/myTotal2*100)):6;
            return <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{fontSize:11,color:"#64748B",width:65,flexShrink:0,textAlign:"right"}}>{row.l}</div>
              <div style={{height:20,borderRadius:4,background:row.c,display:"flex",alignItems:"center",padding:"0 8px",width:pct+"%",minWidth:45}}>
                <span style={{fontSize:11,fontWeight:700,color:row.tc}}>{row.v}</span>
              </div>
              <div style={{fontSize:10,color:"#94A3B8"}}>{myTotal2>0?Math.round(row.v/myTotal2*100)+"%":""}</div>
            </div>;
          })}
        </div>
        <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:14}}>Recent Activity</div>
          {recentActs2.length===0&&<div style={{fontSize:12,color:"#94A3B8"}}>No recent activity</div>}
          {recentActs2.map(function(a,i){
            var lead2=myLeads2.find(function(l){return String(l._id)===String(a.leadId);});
            var stC=statusColors2[lead2&&lead2.status]||"#94A3B8";
            return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #F8FAFC"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:stC,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:"#0F172A"}}>{lead2?lead2.name:"Lead"} {"\u2014"} <span style={{color:stC,fontWeight:600}}>{lead2&&lead2.status}</span></div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{a.note||""}</div>
              </div>
            </div>;
          })}
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
  var monthStart = new Date(nowD.getFullYear(),nowD.getMonth(),1,0,0,0,0);
  var rangeStart, rangeEnd = now;
  if (filter==="today") rangeStart = todayStart.getTime();
  else if (filter==="week") { rangeStart = weekStart.getTime(); rangeEnd = weekEnd.getTime(); }
  else if (filter==="month") rangeStart = monthStart.getTime();
  else if (typeof filter==="string" && filter.indexOf("Q")===0) {
    var qm = filter.match(/Q(\d)\s+(\d{4})/);
    if (qm) { var qNum=parseInt(qm[1]); var qYear=parseInt(qm[2]); var qStartMonth=(qNum-1)*3; rangeStart = new Date(qYear,qStartMonth,1).getTime(); rangeEnd = new Date(qYear,qStartMonth+3,1).getTime()-1; }
    else rangeStart = monthStart.getTime();
  } else rangeStart = monthStart.getTime();

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
    return (l.assignments||[]).some(function(a){return a.status==="Meeting Done"||a.status==="MeetingDone";})||l.status==="MeetingDone";
  }).filter(function(l){
    // If filtered, check if the status change falls in range
    if (filter==="today" || filter==="week" || filter==="month" || (typeof filter==="string"&&filter.indexOf("Q")===0)) {
      return statusChangedInRange(l,"Meeting Done") || statusChangedInRange(l,"MeetingDone") || (l.updatedAt && new Date(l.updatedAt).getTime()>=rangeStart && new Date(l.updatedAt).getTime()<=rangeEnd);
    }
    return true;
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
  // Overdue: leads with overdue callback + DR with overdue dueDate not completed
  var overdueLeads = allLeadsUntimed.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).getTime()<now&&!["MeetingDone","DoneDeal","EOI"].includes(l.status);}).length;
  var overdueDR = (p.dailyReqs||[]).filter(function(r){
    var d = r.dueDate||r.callbackTime;
    return d && new Date(d).getTime()<now && r.status!=="Meeting" && r.status!=="MeetingDone" && r.status!=="DoneDeal";
  }).length;
  var overdueFiltered = overdueLeads + overdueDR;
  // Contacted: leads where ANY assignment.lastActionAt falls in the active date range
  var contactedFiltered = leads.filter(function(l){
    return (l.assignments||[]).some(function(a){
      if (!a.lastActionAt) return false;
      var t = new Date(a.lastActionAt).getTime();
      return !isNaN(t) && t>=rangeStart && t<=rangeEnd;
    });
  }).length;
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
  var fAgentPerf=(p.users||[]).filter(function(u){return u.role==="sales"||u.role==="sales_admin";}).map(function(u){
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
    var aint=al.filter(function(l){return (l.assignments||[]).some(function(a){return interestedStatuses.includes(a.status);})||interestedStatuses.includes(l.status);}).length;
    var ameet=al.filter(function(l){return (l.assignments||[]).some(function(a){return a.status==="Meeting Done"||a.status==="MeetingDone";})||l.status==="MeetingDone";}).length;
    var afup=al.filter(function(l){return l.callbackTime;}).length;
    var aover=al.filter(function(l){return l.callbackTime&&new Date(l.callbackTime).getTime()<now&&!["MeetingDone","DoneDeal","EOI"].includes(l.status);}).length;
    var adeals=al.filter(function(l){return l.status==="DoneDeal"||l.globalStatus==="donedeal";}).length;
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
    // Score: 40% activity + 30% meetings% + 20% interested% + 10% resp.time score (lower is better)
    var actScore=Math.min(100,(al.length+adr.length)*5);
    var rtScore=respH>0?Math.max(0,100-respH*2):50;
    var score=Math.round(actScore*0.4 + mp*0.3 + ip*0.2 + rtScore*0.1);
    return {uid:uid,name:u.name,leads:al.length,dr:adr.length,total:al.length+adr.length,followups:afup,overdue:aover,interested:aint,ip:ip,meetings:ameet,mp:mp,deals:adeals,respTime:respH>0?respH.toFixed(1):"\u2014",score:score};
  }).sort(function(a,b){return b.score-a.score;});

  // Untouched leads — no activity since assignment
  var untouchedLeads = leads.filter(function(l){
    if (l.status!=="NewLead") return false;
    if (l.callbackTime) return false;
    if (l.notes && l.notes.trim().length>0) return false;
    if (l.lastFeedback && l.lastFeedback.trim().length>0) return false;
    return true;
  }).slice(0,20);

  // Today's activities feed
  var todayActs = (p.activities||[]).filter(function(a){return a.createdAt&&new Date(a.createdAt).getTime()>=todayStart.getTime();}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,20);

  // Mask phone
  var maskPh = function(ph){if(!ph)return "";if(ph.length<5)return ph;return ph.slice(0,3)+"****"+ph.slice(-2);};

  // Click lead navigation
  var openLead = function(l){ if(p.nav)p.nav("leads",l); };
  // Click alert navigation to filtered leads
  var gotoFilter = function(status){ if(p.setFilter)p.setFilter(status||"all"); if(p.nav)p.nav("leads"); };

  // Locked leads count
  var lockedCount = leads.filter(function(l){return (l.assignments||[]).some(function(a){return a.noRotation;})||l.locked;}).length;
  var missingFBCount = leads.filter(function(l){return !l.lastFeedback&&l.status!=="NewLead"&&l.status!=="DoneDeal";}).length;
  var stale48Count = leads.filter(function(l){return new Date(l.lastActivityTime||l.createdAt).getTime()<(now-2*DAY)&&l.status!=="DoneDeal"&&l.status!=="NotInterested";}).length;
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

  return <div style={{padding:"16px 12px 40px",background:"#F1F5F9"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:22,fontWeight:700,color:"#0F172A"}}>{greeting+" "+p.cu.name}</div>
        <div style={{fontSize:12,color:"#94A3B8",marginTop:2,fontVariantNumeric:"tabular-nums"}}>{dateLabel}</div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        {[["today","Today"],["week","This Week"],["month","This Month"]].map(function(f){
          return <button key={f[0]} onClick={function(){setFilter(f[0]);}} style={{fontSize:12,padding:"6px 14px",border:filter===f[0]?"1px solid #3B82F6":"1px solid #E2E8F0",borderRadius:8,background:filter===f[0]?"#EFF6FF":"#fff",color:filter===f[0]?"#1D4ED8":"#64748B",cursor:"pointer",fontWeight:filter===f[0]?600:500}}>{f[1]}</button>;
        })}
        <div style={{position:"relative"}}>
          <button onClick={function(){setQOpen(!qOpen);}} style={{fontSize:12,padding:"6px 14px",border:(typeof filter==="string"&&filter.indexOf("Q")===0)?"1px solid #3B82F6":"1px solid #E2E8F0",borderRadius:8,background:(typeof filter==="string"&&filter.indexOf("Q")===0)?"#EFF6FF":"#fff",color:(typeof filter==="string"&&filter.indexOf("Q")===0)?"#1D4ED8":"#64748B",cursor:"pointer",fontWeight:(typeof filter==="string"&&filter.indexOf("Q")===0)?600:500}}>{(typeof filter==="string"&&filter.indexOf("Q")===0)?filter:"Quarter"} &#9662;</button>
          {qOpen&&<div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,minWidth:120,zIndex:99,boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
            {["Q1 2026","Q2 2026","Q3 2026","Q4 2026"].map(function(q){return <div key={q} onClick={function(){setFilter(q);setQOpen(false);}} style={{padding:"8px 14px",fontSize:12,color:"#334155",cursor:"pointer"}}>{q}</div>;})}
          </div>}
        </div>
      </div>
    </div>

    {sec("Key Metrics")}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:0}}>
      {kpiCard("Leads",fLeads.length,"in period","#1565C0","#ffffff",function(){p.nav("leads");})}
      {kpiCard("Daily Requests",drFiltered,"in period","#00796B","#ffffff",function(){p.nav("dailyReq");})}
      {kpiCard("Interested",interestedFiltered,Math.round(interestedFiltered/fTotal*100)+"%","#E65100","#ffffff",function(){p.nav("leads");p.setFilter&&p.setFilter("HotCase");})}
      {kpiCard("Meetings",meetingsFiltered,Math.round(meetingsFiltered/fTotal*100)+"%","#6A1B9A","#ffffff",function(){p.nav("leads");p.setFilter&&p.setFilter("MeetingDone");})}
      {kpiCard("Overdue",overdueFiltered,"late callbacks","#2E7D32","#ffffff",function(){p.nav("leads");p.setFilter&&p.setFilter("CallBack");})}
      {kpiCard("Deals",dealsFiltered,fTotal>0?((dealsFiltered/fTotal)*100).toFixed(1)+"%":"0%","#AD1457","#ffffff",function(){p.nav("deals");})}
      {kpiCard("Contacted",contactedFiltered,Math.round(contactedFiltered/fTotal*100)+"%","#00695C","#ffffff",function(){p.nav("leads");})}
    </div>

    {sec("Campaigns & Pipeline")}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",gap:14,marginBottom:14}}>
      {card(<>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>Campaign &amp; Source Performance</div>
          <div style={{display:"flex",gap:8}}>
            {[["#1877F2","Facebook"],["#0F9D58","Sheets"],["#EA4335","G.Ads"]].map(function(s){return <span key={s[1]} style={{fontSize:10,color:"#64748B",display:"flex",alignItems:"center",gap:3}}><span style={{width:6,height:6,borderRadius:"50%",background:s[0],display:"inline-block"}}/>{s[1]}</span>;})}
          </div>
        </div>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 50px 90px 90px 50px 60px",gap:4,paddingBottom:8,borderBottom:"1px solid #F1F5F9",marginBottom:4,minWidth:500}}>
          {["Campaign \u00b7 Project","Leads","Interested","Meetings","Deals","Quality"].map(function(h){return <div key={h} style={{fontSize:11,fontWeight:700,color:"#94A3B8",textAlign:h==="Campaign \u00b7 Project"?"left":"center"}}>{h}</div>;})}
        </div>
        {fCamps.map(function(c,i){
          var srcC=c.source==="Facebook"?"#1877F2":c.source==="Google Sheets"?"#0F9D58":"#EA4335";
          return <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 50px 90px 90px 50px 60px",gap:4,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F8FAFC"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:srcC,display:"inline-block",flexShrink:0}}/>
                <span style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>{c.campaign||"\u2014"} &middot; {c.project||"\u2014"}</span>
              </div>
              <div style={{fontSize:11,color:"#94A3B8",paddingLeft:12}}>{c.source}</div>
            </div>
            <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#334155"}}>{c.leads}</div>
            <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:"#15803D"}}>{c.int}</div><div style={{fontSize:10,color:"#94A3B8"}}>{c.ip}%</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:"#6D28D9"}}>{c.meet}</div><div style={{fontSize:10,color:"#94A3B8"}}>{c.mp}%</div></div>
            <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#065F46"}}>{c.deals}</div>
            <div style={{textAlign:"center"}}>{qBadge(c.quality)}</div>
          </div>;
        })}
        </div>
      </>)}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {card(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>Untouched Leads</div>
            <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,background:"#FEE2E2",color:"#991B1B"}}>{untouchedLeads.length}</span>
          </div>
          {untouchedLeads.length===0 ? <div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>{"\u2705"} All leads have activity</div> : untouchedLeads.map(function(l,i){
            var hrs = l.createdAt ? Math.round((now-new Date(l.createdAt).getTime())/3600000) : 0;
            var aName = l.agentId && l.agentId.name ? l.agentId.name : (l.agentId ? agentName(l.agentId) : "\u2014");
            var projectName = (l.project||"\u2014").replace(/_/g," ");
            return <div key={gid(l)} onClick={function(){openLead(l);}} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:6,padding:"8px 0",borderBottom:i<untouchedLeads.length-1?"1px solid #F8FAFC":"none",cursor:"pointer"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{l.name}</div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{maskPh(l.phone)} {"\u00b7"} {aName} {"\u00b7"} {projectName}</div>
              </div>
              <div style={{fontSize:11,fontWeight:600,color:hrs>48?"#DC2626":"#92400E",alignSelf:"center"}}>{hrs}h</div>
            </div>;
          })}
        </>)}
        {card(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>Today's Activities</div>
            <span style={{fontSize:11,fontWeight:600,color:"#1D4ED8",cursor:"pointer"}} onClick={function(){p.nav&&p.nav("activities");}}>View All ({todayActs.length})</span>
          </div>
          <div style={{maxHeight:378,overflowY:"auto",WebkitOverflowScrolling:"touch",marginRight:-6,paddingRight:6}}>
          {todayActs.length===0 ? <div style={{fontSize:12,color:"#94A3B8",padding:"10px 0"}}>No activity yet today</div> : todayActs.map(function(a,i){
            var aid = a.userId&&a.userId._id?a.userId._id:a.userId;
            var aName = a.userId&&a.userId.name?a.userId.name:agentName(aid);
            var lName = a.leadId&&a.leadId.name?a.leadId.name:"";
            // Build action label: "Status: X" / "Call initiated" / "DailyReq: X" / "Note added" / etc.
            var aNote = a.note||"";
            var actionLabel = actLabel(a);
            var feedbackText = aNote;
            if (a.type==="status_change") {
              var m1 = aNote.match(/\[([^\]]+)\]/);
              var statusName = m1 ? m1[1] : (aNote.split(":")[1]||"").trim().split("|")[0].trim();
              actionLabel = "Status: "+(statusName||"changed");
              // Feedback after "|" separator if present
              var pipeIdx = aNote.indexOf("|");
              feedbackText = pipeIdx>=0 ? aNote.slice(pipeIdx+1).trim() : "";
            } else if (a.type==="call") {
              actionLabel = "Call initiated";
            } else if (a.type==="note") {
              actionLabel = "Note added";
            } else if (a.type==="reassign") {
              actionLabel = "Reassign";
              feedbackText = "";
            } else if (a.type==="daily_request" || (aNote.toLowerCase().indexOf("daily")>=0)) {
              actionLabel = "DailyReq: "+((aNote.split(":")[1]||"").trim().split("|")[0].trim()||"updated");
            }
            // Icon + colors by action type
            var noteLc = aNote.toLowerCase();
            var ic;
            if (a.type==="call") ic={icon:"\ud83d\udcde",bg:"#DCFCE7",fg:"#166534"};
            else if (a.type==="meeting" || noteLc.indexOf("deal")>=0) ic={icon:"\ud83c\udfc6",bg:"#FEF3C7",fg:"#92400E"};
            else if (a.type==="status_change") ic={icon:"\u2197",bg:"#EDE9FE",fg:"#5B21B6"};
            else if (a.type==="note") ic={icon:"\ud83d\udcdd",bg:"#FFE4E6",fg:"#9F1239"};
            else if (noteLc.indexOf("callback")>=0) ic={icon:"\ud83d\udcc5",bg:"#DBEAFE",fg:"#1D4ED8"};
            else ic={icon:"\u2022",bg:"#F1F5F9",fg:"#64748B"};
            if (feedbackText && feedbackText.length>60) feedbackText = feedbackText.slice(0,60)+"\u2026";
            return <div key={a._id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<todayActs.length-1?"1px solid #F1F5F9":"none"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:ic.bg,color:ic.fg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ic.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"#0F172A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{aName}{lName?" \u2014 "+lName:""}</div>
                <div style={{fontSize:11,color:"#64748B",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  <span style={{fontWeight:600,color:ic.fg}}>{actionLabel}</span>
                  {feedbackText?<span style={{color:"#94A3B8"}}>{" \u2014 "+feedbackText}</span>:null}
                </div>
              </div>
              <div style={{fontSize:11,color:"#94A3B8",flexShrink:0,fontWeight:500}}>{timeAgoShort(a.createdAt)}</div>
            </div>;
          })}
          </div>
        </>)}
      </div>
    </div>

    {sec("Team Performance")}
    <div style={{marginBottom:14}}>
    {card(<>
      <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:12}}>Agent Performance</div>
      <div style={{overflowX:"auto",overflowY:"auto",maxHeight:320,WebkitOverflowScrolling:"touch",width:"100%"}}>
      <div style={{display:"grid",gridTemplateColumns:"150px 50px 45px 55px 70px 60px 65px 65px 50px 70px 55px",gap:4,paddingBottom:8,borderBottom:"1px solid #F1F5F9",marginBottom:4,minWidth:850}}>
        {["Agent","Leads","DR","Total","Followups","Overdue","Int%","Meet%","Deals","Resp.Time","Score"].map(function(h){return <div key={h} style={{fontSize:11,fontWeight:700,color:"#94A3B8",textAlign:h==="Agent"?"left":"center"}}>{h}</div>;})}
      </div>
      {fAgentPerf.map(function(a,i){
        var medals=["🥇","🥈","🥉"];
        var avBg=["#DBEAFE","#DCFCE7","#FEF3C7","#EDE9FE","#FFE4E6"][i%5];
        var avC=["#1D4ED8","#166534","#92400E","#5B21B6","#9F1239"][i%5];
        var initials=(a.name||"?").split(" ").slice(0,2).map(function(x){return x[0];}).join("").toUpperCase();
        return <div key={a.uid} style={{display:"grid",gridTemplateColumns:"150px 50px 45px 55px 70px 60px 65px 65px 50px 70px 55px",gap:4,alignItems:"center",padding:"9px 0",borderBottom:"1px solid #F8FAFC",minWidth:850}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:avBg,color:avC,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{initials}</div>
            <div><div style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>{a.name}</div>
              <div style={{height:3,borderRadius:2,background:"#F1F5F9",width:55,marginTop:3}}><div style={{height:"100%",width:Math.min(100,a.score)+"%",background:avC,borderRadius:2}}/></div>
            </div>
          </div>
          <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#334155"}}>{a.leads}</div>
          <div style={{fontSize:13,fontWeight:600,textAlign:"center",color:"#0F172A"}}>{a.dr}</div>
          <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#334155"}}>{a.total}</div>
          <div style={{fontSize:13,fontWeight:600,textAlign:"center",color:"#334155"}}>{a.followups}</div>
          <div style={{fontSize:13,fontWeight:600,textAlign:"center",color:a.overdue>0?"#DC2626":"#94A3B8"}}>{a.overdue}</div>
          <div style={{fontSize:12,fontWeight:600,textAlign:"center",color:a.ip>30?"#15803D":a.ip>15?"#92400E":"#94A3B8"}}>{a.ip}%</div>
          <div style={{fontSize:12,fontWeight:600,textAlign:"center",color:a.mp>20?"#6D28D9":a.mp>10?"#92400E":"#94A3B8"}}>{a.mp}%</div>
          <div style={{fontSize:13,fontWeight:700,textAlign:"center",color:"#065F46"}}>{a.deals}</div>
          <div style={{fontSize:12,fontWeight:600,textAlign:"center",color:"#334155"}}>{a.respTime!=="\u2014"?a.respTime+"h":"\u2014"}</div>
          <div style={{fontSize:12,fontWeight:700,textAlign:"center",color:a.score>=70?"#15803D":a.score>=50?"#92400E":"#94A3B8"}}>{medals[i]||""} {a.score}</div>
        </div>;
      })}
      </div>
    </>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
      {card(<>
        <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:12}}>Leads by Status</div>
        {[["New Lead","NewLead","#3B82F6"],["Potential","Potential","#10B981"],["Hot Case","HotCase","#F59E0B"],["Call Back","CallBack","#EF4444"],["Meeting","MeetingDone","#8B5CF6"],["Not Int.","NotInterested","#94A3B8"],["No Answer","NoAnswer","#CBD5E1"]].map(function(s){return bRow(s[0],sc[s[1]]||0,total,s[2]);})}
      </>)}
      {card(<>
        <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:12}}>Lead Aging</div>
        {[{l:"0\u20131 days",sub:"fresh",v:leads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt).getTime())<DAY;}).length,c:"#10B981"},{l:"2\u20133 days",sub:"followup needed",v:leads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt).getTime())>=DAY&&(now-new Date(l.createdAt).getTime())<3*DAY;}).length,c:"#F59E0B"},{l:"4\u20137 days",sub:"at risk",v:leads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt).getTime())>=3*DAY&&(now-new Date(l.createdAt).getTime())<7*DAY;}).length,c:"#EF4444"},{l:"30+ days",sub:"rotation stopped",v:leads.filter(function(l){return l.createdAt&&(now-new Date(l.createdAt).getTime())>=MONTH;}).length,c:"#94A3B8"}].map(function(row,i){
          return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<3?"1px solid #F8FAFC":"none"}}>
            <div><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{row.l}</div><div style={{fontSize:11,color:"#94A3B8"}}>{row.sub}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:18,fontWeight:800,color:row.c}}>{row.v}</div><div style={{fontSize:10,color:"#94A3B8"}}>{total>0?Math.round(row.v/total*100)+"%":"\u2014"}</div></div>
          </div>;
        })}
      </>)}
      {card(<>
        <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:12}}>Call Outcomes</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <div style={{background:"#EFF6FF",borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#1D4ED8"}}>{(p.activities||[]).filter(function(a){return a.type==="call"&&a.createdAt&&(now-new Date(a.createdAt).getTime())<DAY;}).length}</div><div style={{fontSize:10,fontWeight:600,color:"#3B82F6"}}>Calls Today</div></div>
          <div style={{background:"#FFF1F2",borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#BE123C"}}>{total>0?Math.round((sc["NotInterested"]||0)/total*100):0}%</div><div style={{fontSize:10,fontWeight:600,color:"#F43F5E"}}>Not Interested</div></div>
        </div>
        {[["Interested",interested,"#10B981"],["No Answer",sc["NoAnswer"]||0,"#94A3B8"],["Not Int.",sc["NotInterested"]||0,"#EF4444"],["Call Back",sc["CallBack"]||0,"#F59E0B"]].map(function(s){return bRow(s[0],s[1],total,s[2]);})}
      </>)}
      {card(<>
        <div style={{fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:12}}>Management Alerts</div>
        {[
          {dot:"#EF4444",t:untouched+" untouched leads",s:"no calls yet",onClick:function(){gotoFilter("NewLead");}},
          {dot:"#F59E0B",t:missingFBCount+" missing feedback",s:"no notes",onClick:function(){gotoFilter("all");}},
          {dot:"#F97316",t:overdue+" overdue callbacks",s:"past scheduled",onClick:function(){gotoFilter("CallBack");}},
          {dot:"#DC2626",t:stale48Count+" stale 48h+",s:"no activity",onClick:function(){gotoFilter("all");}},
          {dot:"#6366F1",t:rotationsTotal+" total rotations",s:"all time",onClick:function(){gotoFilter("all");}},
          {dot:"#7C3AED",t:lockedCount+" leads locked",s:"noRotation flag",onClick:function(){gotoFilter("all");}}
        ].map(function(a,i){
          return <div key={i} onClick={a.onClick} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<5?"1px solid #F8FAFC":"none",cursor:"pointer"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:a.dot,flexShrink:0,marginTop:3}}/>
            <div><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{a.t}</div><div style={{fontSize:11,color:"#94A3B8"}}>{a.s}</div></div>
          </div>;
        })}
        <div style={{marginTop:10,padding:10,background:"#F8FAFC",borderRadius:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:"#64748B",fontWeight:500}}>Data quality</span><span style={{fontWeight:700,color:"#0F172A"}}>{Math.max(0,100-Math.round((untouched+overdue)*100/Math.max(total,1)))}%</span></div>
          <div style={{height:4,background:"#E2E8F0",borderRadius:2}}><div style={{height:"100%",width:Math.max(0,100-Math.round((untouched+overdue)*100/Math.max(total,1)))+"%",background:"#10B981",borderRadius:2}}/></div>
        </div>
      </>)}
    </div>
  </div>;
};


// ===== EOI PAGE =====
var EOIPage = function(p) {
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin";
  var eoiLeads=p.leads.filter(function(l){return l.status==="EOI"&&!l.archived;});
  var getAg=function(l){if(!l.agentId)return"-";if(l.agentId.name)return l.agentId.name;var u=p.users.find(function(x){return gid(x)===l.agentId;});return u?u.name:"-";};
  var parseBudget=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var total=eoiLeads.reduce(function(s,d){return s+parseBudget(d.budget);},0);
  var [editLead,setEditLead]=useState(null);
  var [showAdd,setShowAdd]=useState(false);
  var [selectedEOI,setSelectedEOI]=useState(null);
  var [imgUploading,setImgUploading]=useState(false);
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});

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

  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>🎯 EOI ({eoiLeads.length})</h2>
        {total>0&&<div style={{ fontSize:13, fontWeight:700, color:"#9333EA", background:"#F3E8FF", padding:"5px 14px", borderRadius:20 }}>Total: {total.toLocaleString()} EGP</div>}
      </div>
      {(isAdmin||p.cu.role==="sales")&&<Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 14px", fontSize:12 }}><Plus size={13}/> Add EOI</Btn>}
    </div>

    {showAdd&&<Modal show={true} onClose={function(){setShowAdd(false);}} title={"➕ Add EOI"}>
      <LeadForm t={t} cu={p.cu} users={p.users} token={p.token} isReq={false}
        initialStatus="EOI"
        initial={{status:"EOI", source:"Facebook", name:"", phone:"", phone2:"", budget:"", project:"", notes:"", eoiDeposit:""}}
        onClose={function(){setShowAdd(false);}}
        onSave={function(added){p.setLeads(function(prev){return [added].concat(prev);});setShowAdd(false);}}/>
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
            <td style={{ padding:"11px 12px", fontSize:12, color:C.textLight, textAlign:"left" }}>{d.notes||"-"}</td>
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
              <div style={{ display:"flex", gap:5 }}>
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
    {selectedEOI&&<div style={ p.isMobile?{ position:"fixed", inset:0, zIndex:300, background:"#fff", overflowY:"auto" }:{ flex:"0 0 260px", background:"#fff", borderRadius:14, border:"1px solid #E8ECF1", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden", maxHeight:"80vh", overflowY:"auto" }}>
      <div style={{ background:"linear-gradient(135deg,#9333EA,#7C3AED)", padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <button onClick={function(){setSelectedEOI(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><X size={11}/></button>
          {isOnlyAdmin&&<button onClick={function(){toggleApproved(selectedEOI,"eoiApproved");}} style={{ background:selectedEOI.eoiApproved?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", color:"#fff", fontSize:11, fontWeight:700 }}>
            {selectedEOI.eoiApproved?"✅ Approved":"⏳ Approve"}
          </button>}
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

var getProjectWeight = function(project, lead){
  // If lead has projectWeight field use it
  if(lead&&lead.projectWeight&&lead.projectWeight!==1) return lead.projectWeight;
  try{ var w=localStorage.getItem("crm_proj_weight_"+(project||"").replace(/\s/g,"_")); return w?parseFloat(w):1; }catch(e){return 1;}
};
var saveProjectWeight = function(project,weight){
  try{localStorage.setItem("crm_proj_weight_"+(project||"").replace(/\s/g,"_"),String(weight));}catch(e){}
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
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin";
  var deals=p.leads.filter(function(l){return l.status==="DoneDeal"&&!l.archived;}).slice().sort(function(a,b){return new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0);});
  var getAg=function(l){if(!l.agentId)return"-";if(l.agentId.name)return l.agentId.name;var u=p.users.find(function(x){return gid(x)===l.agentId;});return u?u.name:"-";};
  var parseBudget=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var total=deals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);return s+parseBudget(d.budget)*w*(sp?0.5:1);},0);
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
  var [showAdd,setShowAdd]=useState(false);
  var [editDeal,setEditDeal]=useState(null);
  var [selectedDeal,setSelectedDeal]=useState(null);
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
  var [dealQ,setDealQ]=useState("all"); var [dealYear,setDealYear]=useState(curYear);
  var filteredDeals=deals.filter(function(d){
    if(dealQ!=="all"){var dd=getDealDate(d);if(!dd)return false;var m=new Date(dd).getMonth();var q=m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";if(q!==dealQ)return false;}
    if(dealQ!=="all"&&new Date(getDealDate(d)||0).getFullYear()!==dealYear) return false;
    if(dateFrom&&new Date(d.updatedAt||d.createdAt)<new Date(dateFrom)) return false;
    if(dateTo&&new Date(d.updatedAt||d.createdAt)>new Date(dateTo+"T23:59:59")) return false;
    if(dealSearch){var q2=dealSearch.toLowerCase();var nm=d.name?d.name.toLowerCase():"";var pr=d.project?d.project.toLowerCase():"";var ph=d.phone||"";if(!nm.includes(q2)&&!pr.includes(q2)&&!ph.includes(q2))return false;}
    if(dealAgent){var aid=d.agentId&&d.agentId._id?d.agentId._id:d.agentId;if(aid!==dealAgent)return false;}
    return true;
  });
  var filteredTotal=filteredDeals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);return s+parseBudget(d.budget)*w*(sp?0.5:1);},0);

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
      {(isOnlyAdmin||p.cu.role==="team_leader")&&<Btn onClick={function(){setShowAdd(true);}} style={{ padding:"7px 13px", fontSize:13 }}><Plus size={14}/> Add Deal</Btn>}
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
        var saveWeight=async function(newW){
          saveProjectWeight(proj,newW);
          setProjWeights(function(prev){return Object.assign({},prev,{[proj]:newW});});
          // Update all deals of this project in DB
          var projDeals=deals.filter(function(d){return d.project===proj;});
          await Promise.all(projDeals.map(function(d){
            return apiFetch("/api/leads/"+gid(d),"PUT",{projectWeight:newW},p.token).then(function(updated){
              p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(d)?updated:l;});});
            }).catch(function(){});
          }));
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
                  return <div>
                    <div style={{ color:C.success }}>{effectiveBv.toLocaleString()}</div>
                    <div style={{ fontSize:10, color:C.textLight, marginTop:1 }}>من {bv.toLocaleString()}</div>
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
      return <div style={{ flex:"0 0 280px", background:"#fff", borderRadius:14, border:"1px solid #E8ECF1", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden", maxHeight:"80vh", overflowY:"auto" }}>
      <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:"14px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <button onClick={function(){setSelectedDeal(null);}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><X size={11}/></button>
          {isOnlyAdmin&&<button onClick={async function(){
            try{
              var upd={dealApproved:!selectedDeal.dealApproved};
              var updated=await apiFetch("/api/leads/"+gid(selectedDeal),"PUT",upd,p.token);
              p.setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(selectedDeal)?updated:l;});});
              setSelectedDeal(updated);
            }catch(e){}
          }} style={{ background:selectedDeal.dealApproved?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"4px 10px", cursor:"pointer", color:"#fff", fontSize:11, fontWeight:700 }}>
            {selectedDeal.dealApproved?"✅ Approved":"⏳ Approve"}
          </button>}
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
  var t=p.t; var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader";
  var isOnlyAdmin=p.cu.role==="admin";
  var archived = p.leads.filter(function(l){ return l.archived; });
  var [archivedDR,setArchivedDR]=useState([]);
  useEffect(function(){
    var ids=[];try{ids=JSON.parse(localStorage.getItem("crm_dr_archived")||"[]");}catch(e){}
    if(!ids.length){setArchivedDR([]);return;}
    apiFetch("/api/daily-requests","GET",null,p.token)
      .then(function(data){
        var all=Array.isArray(data)?data:[];
        setArchivedDR(all.filter(function(r){return ids.includes(gid(r));}));
      }).catch(function(){setArchivedDR([]);});
  },[]);
  var restoreDR=function(rid){
    var ids=[];try{ids=JSON.parse(localStorage.getItem("crm_dr_archived")||"[]");}catch(e){}
    ids=ids.filter(function(x){return x!==rid;});
    try{localStorage.setItem("crm_dr_archived",JSON.stringify(ids));}catch(e){}
    setArchivedDR(function(prev){return prev.filter(function(r){return gid(r)!==rid;});});
  };
  var restore=async function(lid){
    try{
      await apiFetch("/api/leads/"+lid,"PUT",{archived:false},p.token);
      p.setLeads(function(prev){return prev.map(function(l){return gid(l)===lid?Object.assign({},l,{archived:false}):l;});});
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
          <td style={{ padding:"11px 12px" }}><Btn onClick={function(){restore(lid);}} style={{ padding:"5px 12px", fontSize:11 }}><RotateCcw size={12}/> {t.restore}</Btn></td>
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
            <td style={{ padding:"11px 12px" }}><Btn onClick={function(){restoreDR(rid);}} style={{ padding:"5px 12px", fontSize:11 }}><RotateCcw size={12}/> Restore</Btn></td>
          </tr>;
        })}</tbody>
      </table></div></Card>
    </div>}
  </div>;
};

// ===== DAILY REQUESTS =====
var DailyRequestsPage = function(p) {
  var t=p.t; var sc=DR_STATUSES(t);
  var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader"; var isOnlyAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin";
  var salesUsers=p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
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
  var [showDrHistory,setShowDrHistory]=useState(false);
  var [drHistoryReq,setDrHistoryReq]=useState(null);
  var [drHistoryList,setDrHistoryList]=useState([]);
  var [drHistoryLoading,setDrHistoryLoading]=useState(false);
  var [filterStatus,setFilterStatus]=useState("all");
  var [sortBy,setSortBy]=useState("lastActivity");
  var [agentFilter,setAgentFilter]=useState("");
  var [form,setForm]=useState({name:"",phone:"",phone2:"",propertyType:"",area:"",budget:"",notes:"",agentId:"",callbackTime:"",status:"NewLead"});
  var [selected2,setSelected2]=useState([]);
  var [showBulk,setShowBulk]=useState(false);
  var [bulkAgent,setBulkAgent]=useState("");

  useEffect(function(){
    apiFetch("/api/daily-requests","GET",null,p.token)
      .then(function(data){
        var archivedIds=[];
        try{archivedIds=JSON.parse(localStorage.getItem("crm_dr_archived")||"[]");}catch(e){}
        var filtered2=Array.isArray(data)?data.filter(function(r){return !archivedIds.includes(gid(r));}):[];
        setRequests(filtered2);setLoading(false);
      })
      .catch(function(){setRequests([]);setLoading(false);});
  },[]);

  useEffect(function(){ if(p.initSelected){setSelected(p.initSelected);p.setInitSelected(null);} },[p.initSelected]);

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
        if(extra.notes)     updateData.notes=(updateData.notes?updateData.notes+" | ":"")+extra.notes;
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
    if(!form.budget.trim()){alert("Budget is required");return;}
    if(!form.callbackTime){alert("Callback is required");return;}
    if(!form.notes.trim()){alert("Feedback is required");return;}
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
        status:form.status||"NewLead"
      };
      var r=await apiFetch("/api/daily-requests","POST",submitData,p.token);
      setRequests(function(prev){return [r].concat(prev);});
      setShowAdd(false);setForm({name:"",phone:"",phone2:"",propertyType:"",area:"",budget:"",notes:"",agentId:"",callbackTime:"",status:"NewLead"});
    }catch(e){alert(e.message);}setSaving(false);
  };

  var getAgentName=function(r){if(!r.agentId)return"-";if(r.agentId.name)return r.agentId.name;var u=p.users.find(function(x){return gid(x)===r.agentId;});return u?u.name:"-";};

  return <div style={{ padding:"18px 16px 40px" }}>
    <StatusModal show={showStatusComment} t={t} newStatus={pendingStatus?pendingStatus.newStatus:null} lead={selected} onClose={function(){setShowStatusComment(false);}} onConfirm={confirmStatus}/>
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
        // Try API first, fallback to localStorage
        for(var i=0;i<ids.length;i++){
          try{await apiFetch("/api/leads/"+ids[i]+"/archive","PUT",null,p.token);}
          catch(e){
            try{await apiFetch("/api/daily-requests/"+ids[i],"PUT",{archived:true},p.token);}catch(e2){}
          }
        }
        // Store archived IDs in localStorage as backup
        try{
          // DR archived via API - no localStorage needed
        }catch(e){}
        setRequests(function(prev){return prev.filter(function(r){return !ids.includes(gid(r));});});
        setSelected2([]);
        if(selected&&ids.includes(gid(selected)))setSelected(null);
      }} style={{ padding:"7px 11px", fontSize:12, color:C.warning, borderColor:C.warning }}><Archive size={13}/> Archive ({selected2.length})</Btn>}
      {p.cu.role==="admin"&&<Btn outline onClick={async function(){var XLSX=await new Promise(function(res){if(window.XLSX){res(window.XLSX);return;}var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";s.onload=function(){res(window.XLSX);};document.head.appendChild(s);});var rows=filtered.map(function(r){return{"Name":r.name,"Phone":r.phone,"Phone2":r.phone2||"","Property Type":r.propertyType||"","Location":r.area||"","Budget":r.budget||"","Status":r.status||"","Agent":r.agentId&&r.agentId.name?r.agentId.name:"","Callback":r.callbackTime||"","Last Activity":r.lastActivityTime?new Date(r.lastActivityTime).toLocaleDateString("en-GB"):"","Notes":r.notes||""};});var ws=XLSX.utils.json_to_sheet(rows);var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Daily Requests");XLSX.writeFile(wb,"daily_requests_"+new Date().toISOString().slice(0,10)+".xlsx");}} style={{ padding:"7px 11px", fontSize:12, color:C.success, borderColor:C.success }}><FileSpreadsheet size={13}/> Export Excel</Btn>}
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
        <option value="newest">🆕 Newest</option>
      </select>
    </div>

    <div style={{ display:"flex", gap:14, paddingRight:!p.isMobile&&selected?330:0, transition:"padding-right 0.25s" }}>
      <Card style={{ flex:1, padding:0, overflow:"hidden", minWidth:0 }}>
        {loading?<Loader/>:p.isMobile?<div style={{ display:"flex", flexDirection:"column", gap:12, padding:"12px", maxWidth:500, margin:"0 auto" }}>
          {filtered.length===0&&<div style={{ textAlign:"center", padding:40, color:C.textLight }}>No requests</div>}
          {selected&&<div style={{ position:"fixed", inset:0, zIndex:300, background:"#fff", overflowY:"auto" }}>
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
      {selected&&<Card style={p.isMobile?{ position:"fixed", inset:0, zIndex:300, borderRadius:0, overflowY:"auto", padding:0, margin:0 }:{ position:"fixed", top:0, right:0, bottom:0, width:320, zIndex:300, borderRadius:0, overflowY:"auto", padding:0, boxShadow:"-4px 0 24px rgba(0,0,0,0.12)" }}>
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
        <Inp label={"Property Type"} type="select" value={form.propertyType} onChange={function(e){setForm(function(f){return Object.assign({},f,{propertyType:e.target.value});})}} options={[""].concat(PROP_TYPES).map(function(x){return{value:x,label:x||"- Select -"};})}/>
        <Inp label={"Location"} req value={form.area} onChange={function(e){setForm(function(f){return Object.assign({},f,{area:e.target.value});})}} placeholder=""/>
        <div style={{ gridColumn:"1/-1" }}><Inp label={"Budget"} req value={form.budget} onChange={function(e){setForm(function(f){return Object.assign({},f,{budget:(function(){var r=e.target.value.replace(/,/g,"").replace(/[^0-9]/g,"");return r?Number(r).toLocaleString():"";})()});})}}/></div>
      </div>
      {isAdmin&&<Inp label={t.agent} type="select" value={form.agentId} onChange={function(e){setForm(function(f){return Object.assign({},f,{agentId:e.target.value});})}} options={[{value:"",label:"- Select -"}].concat(salesUsers.map(function(u){return{value:gid(u),label:u.name};}))}/>}
      <Inp label={t.status+" *"} req type="select" value={form.status||"NewLead"} onChange={function(e){setForm(function(f){return Object.assign({},f,{status:e.target.value});})}} options={sc.map(function(s){return{value:s.value,label:s.label};})}/>
      <Inp label={t.callbackTime} req type="datetime-local" value={form.callbackTime} onChange={function(e){setForm(function(f){return Object.assign({},f,{callbackTime:e.target.value});})}}/>
      <Inp label={"Feedback *"} req type="textarea" value={form.notes} onChange={function(e){setForm(function(f){return Object.assign({},f,{notes:e.target.value});})}}/> 
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
var UsersPage = function(p) {
  var t=p.t; var isOnlyAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"; var [showAdd,setShowAdd]=useState(false); var [saving,setSaving]=useState(false);
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
  var rc={admin:"#EF4444",sales_admin:"#E8A838",manager:"#8B5CF6",team_leader:"#0EA5E9",sales:"#3B82F6",viewer:"#94A3B8"};
  var getManagerName=function(uid){var u=p.users.find(function(x){return gid(x)===String(uid||"");});return u?u.name:"";};
  var getRoleLabel=function(u){if(u.role==="manager"&&u.reportsTo)return "Team Leader";if(u.role==="manager")return "Manager";return u.role==="admin"?"Admin":"Sales";};
  var rl={admin:t.admin,sales_admin:"Sales Admin",manager:t.salesManager,team_leader:"Team Leader",sales:t.salesAgent,viewer:t.viewer};
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
        {[t.name,t.username,t.title,t.role,t.phone,"Quarterly Target","Last Seen",t.status,""].map(function(h){return <th key={h||"x"} style={{ textAlign:t.dir==="rtl"?"right":"left", padding:"11px 12px", fontSize:11, fontWeight:600, color:C.textLight, whiteSpace:"nowrap" }}>{h}</th>;})}
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
        <td style={{ padding:"11px 12px" }}><Badge bg={u.active?"#DCFCE7":"#FEE2E2"} color={u.active?"#15803D":"#B91C1C"} onClick={function(){if(u.role!=="admin")toggleActive(u);}}>{u.active?t.active:t.inactive}</Badge></td>
        <td style={{ padding:"11px 12px" }}><div style={{display:"flex",gap:6,alignItems:"center"}}><button onClick={function(){setPwModal({userId:uid,userName:displayName});setPwForm({newPass:"",confirmPass:""});setPwMsg("");}} disabled={p.cu.role==="sales_admin"&&u.role==="admin"} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:p.cu.role==="sales_admin"&&u.role==="admin"?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:p.cu.role==="sales_admin"&&u.role==="admin"?0.3:1 }} title={t.changePassword}><KeyRound size={12} color={C.info}/></button>
              <button onClick={function(){setTeamModal({userId:uid,userName:u.name,teamId:u.teamId||"",teamName:u.teamName||"",reportsTo:u.reportsTo||""});}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} title="Edit Team"><Users size={12} color="#8B5CF6"/></button><button onClick={function(){if(u.username!=="amgad")del(uid);}} style={{ width:28, height:28, borderRadius:6, border:"1px solid #E2E8F0", background:"#fff", cursor:u.username!=="amgad"?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", opacity:u.username==="amgad"?0.3:1 }}><Trash2 size={12} color={C.danger}/></button></div></td>
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
    {teamModal&&<Modal show={true} onClose={function(){setTeamModal(null);}} title={"👥 Edit Team — "+teamModal.userName}>
      {/* reportsTo */}
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,marginBottom:5}}>Reports To (Direct Manager)</label>
        <select value={teamModal.reportsTo||""} onChange={function(e){setTeamModal(function(prev){return Object.assign({},prev,{reportsTo:e.target.value||null});});}}
          style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #E2E8F0",fontSize:13,background:"#fff",boxSizing:"border-box"}}>
          <option value="">— No (Top Manager) —</option>
          {p.users.filter(function(u){return (u.role==="manager"||u.role==="team_leader")&&gid(u)!==teamModal.userId;}).map(function(u){return <option key={gid(u)} value={gid(u)}>{u.name} ({u.title||u.role})</option>;})}
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
      {(nU.role==="sales"||nU.role==="manager"||nU.role==="team_leader")&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
        <Inp label={"Team Name"} value={nU.teamName||""} onChange={function(e){setNU(Object.assign({},nU,{teamName:e.target.value}));}} placeholder="e.g. Team A"/>
        <Inp label={"Team Code"} value={nU.teamId||""} onChange={function(e){setNU(Object.assign({},nU,{teamId:e.target.value}));}} placeholder="team-a"/>
      </div>}
        <div style={{ gridColumn:"1/-1" }}><Inp label={t.role} type="select" value={nU.role} onChange={function(e){setNU(Object.assign({},nU,{role:e.target.value}));}} options={[{value:"admin",label:t.admin},{value:"sales_admin",label:"Sales Admin"},{value:"manager",label:t.salesManager},{value:"team_leader",label:"Team Leader"},{value:"sales",label:t.salesAgent},{value:"viewer",label:t.viewer}]}/></div>
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
  var curQR=(function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
  var pLabel={daily:"Today",weekly:"This Week",monthly:"This Month",q:"This Quarter"};
  var qStartMs=(function(){var m=new Date().getMonth();var qStart=m<3?0:m<6?3:m<9?6:9;var d=new Date();d.setMonth(qStart,1);d.setHours(0,0,0,0);return d.getTime();})();
  var ms=period==="q"?null:{daily:86400000,weekly:604800000,monthly:2592000000}[period];
  var now=Date.now();
  var allLeads=p.leads.filter(function(l){return !l.archived;});
  var inPeriod=function(dateStr){
    if(!dateStr) return false;
    if(period==="q") return new Date(dateStr).getTime()>=qStartMs;
    return (now-new Date(dateStr).getTime())<ms;
  };
  var periodLeads=allLeads.filter(function(l){return l.createdAt&&inPeriod(l.createdAt);});
  var periodDeals=allLeads.filter(function(l){return l.status==="DoneDeal"&&l.updatedAt&&inPeriod(l.updatedAt);});
  var salesUsers=(p.cu.role==="team_leader"||p.cu.role==="manager")
    ? (p.myTeamUsers||[]).filter(function(u){return u.active&&(u.role==="sales"||u.role==="team_leader");})
    : p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
  var parseBudgetR=function(b){return parseFloat((b||"0").toString().replace(/,/g,""))||0;};
  var getQTargetsR=function(uid){var u=p.users.find(function(x){return gid(x)===uid;});if(u&&u.qTargets&&Object.keys(u.qTargets).length>0)return u.qTargets;try{return JSON.parse(localStorage.getItem("crm_qt_"+uid)||"{}");} catch(e){return {};}}
  var agentStats=salesUsers.map(function(u){
    var uid=gid(u);
    var uNew=periodLeads.filter(function(l){var a=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return a===uid&&l.source!=="Daily Request";});
    var uDailyReq=periodLeads.filter(function(l){var a=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return a===uid&&l.source==="Daily Request";});
    var uDeals=periodDeals.filter(function(l){var a=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return a===uid;});
    var uMeetingDone=allLeads.filter(function(l){var a=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return a===uid&&l.status==="MeetingDone"&&l.updatedAt&&inPeriod(l.updatedAt);});
    var revenue=uDeals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);return s+parseBudgetR(d.budget)*w*(sp?0.5:1);},0);
    var qt=getQTargetsR(uid);
    var qTarget=qt[curQR]||0;
    var target=qTarget>0?qTarget:(u.monthlyTarget||0)*1000000;
    var prog=target>0?Math.min(100,Math.round((revenue/target)*100)):0;
    return{user:u,newL:uNew.length,dailyReq:uDailyReq.length,deals:uDeals.length,meetingDone:uMeetingDone.length,revenue:revenue,target:target,prog:prog};
  }).sort(function(a,b){return b.revenue-a.revenue;});
  var exportReport=async function(){
    setExporting(true);
    var XLSX=await new Promise(function(res){if(window.XLSX){res(window.XLSX);return;}var s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";s.onload=function(){res(window.XLSX);};document.head.appendChild(s);});
    var rows=agentStats.map(function(a){return{"Agent":a.user.name,"New":a.newL,"Daily Request":a.dailyReq,"Meeting Done":a.meetingDone,"Deals":a.deals,"Target":a.target,"Rate":a.prog+"%"};});
    var ws=XLSX.utils.json_to_sheet(rows);var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Report");
    XLSX.writeFile(wb,"Report_ARO_"+new Date().toISOString().slice(0,10)+".xlsx");setExporting(false);
  };
  return <div style={{ padding:"18px 16px 40px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>📊 Reports</h2>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {["daily","weekly","monthly","q"].map(function(p2){return <button key={p2} onClick={function(){setPeriod(p2);}} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid", borderColor:period===p2?C.accent:"#E2E8F0", background:period===p2?C.accent+"12":"#fff", color:period===p2?C.accent:C.textLight, fontSize:12, fontWeight:600, cursor:"pointer" }}>{p2==="q"?curQR+" 🔵":pLabel[p2]}</button>;})}
        <Btn outline onClick={exportReport} loading={exporting} style={{ padding:"6px 12px", fontSize:12, color:C.success, borderColor:C.success }}><FileSpreadsheet size={13}/> Excel</Btn>
      </div>
    </div>
    <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
      <StatCard icon={Users} label={"New — "+pLabel[period]} value={periodLeads.length+""} c={C.info}/>
      <StatCard icon={DollarSign} label={"Deals — "+pLabel[period]} value={periodDeals.length+""} c={C.success}/>
      <StatCard icon={Target} label={"Total"} value={allLeads.length+""} c={C.accent}/>
      <StatCard icon={Activity} label={"Conversion Rate"} value={allLeads.length?Math.round((allLeads.filter(function(l){return l.status==="DoneDeal";}).length/allLeads.length)*100)+"%":"0%"} c={"#8B5CF6"}/>
    </div>
    <Card style={{ marginBottom:20 }}>
      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>🏆 Team Performance — {pLabel[period]}</h3>
      <div style={{ overflowX:"auto" }}><table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead><tr style={{ background:"#F8FAFC", borderBottom:"2px solid #E8ECF1" }}>
          {["#","Agent","New","Daily Req","Meeting Done","Deals","Revenue","Target","Achievement"].map(function(h){return <th key={h} style={{ padding:"10px 12px", fontSize:11, fontWeight:700, color:C.textLight, textAlign:"right" }}>{h}</th>;})}
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
      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700 }}>📈 Leads Distribution</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
        {sc.map(function(s){var cnt=allLeads.filter(function(l){return l.status===s.value;}).length;var pct=allLeads.length?Math.round((cnt/allLeads.length)*100):0;return cnt>0?<div key={s.value} style={{ padding:"14px", borderRadius:12, background:s.bg, border:"1px solid "+s.color+"30" }}><div style={{ fontSize:22, fontWeight:800, color:s.color }}>{cnt}</div><div style={{ fontSize:12, color:s.color, fontWeight:600, marginTop:2 }}>{s.label}</div><div style={{ fontSize:11, color:s.color+"99", marginTop:4 }}>{pct}%</div></div>:null;})}
      </div>
    </Card>
  </div>;
};

var TeamPage = function(p) {
  var t=p.t;
  var isAdmin=p.cu.role==="admin"||p.cu.role==="sales_admin"||p.cu.role==="manager"||p.cu.role==="team_leader";
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

  // Card for one member
  var MemberCard = function(mp){
    var a=mp.user; var uid=String(gid(a));
    var isManagerCard = a.role==="manager"||a.role==="team_leader";
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
    var qDeals=allDeals.filter(function(d){if(!matchesAgent(d))return false;var dd=getDealDate(d);return dd&&getQ(dd)===viewQ&&new Date(dd).getFullYear()===viewYear;});
    var qRevenue=qDeals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);return s+parseBudget(d.budget)*w*(sp?0.5:1);},0);
    var qProg=qTarget>0?Math.min(100,Math.round((qRevenue/qTarget)*100)):0;
    var allAgentDeals=allDeals.filter(function(d){return matchesAgent(d);});
    var totalRevenue=allAgentDeals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);return s+parseBudget(d.budget)*w*(sp?0.5:1);},0);
    var isOnlineNow=a.lastSeen&&(Date.now()-new Date(a.lastSeen).getTime())<2*60*1000;
    var isIdleNow=!isOnlineNow&&a.lastSeen&&(Date.now()-new Date(a.lastSeen).getTime())<15*60*1000;
    var lastSeenStr=a.lastSeen?("Last seen: "+new Date(a.lastSeen).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})+" — "+timeAgo(a.lastSeen,p.t)):"Never logged in";
    var onlineStatus=isOnlineNow?"🟢 Active now":isIdleNow?"🟡 Idle ("+timeAgo(a.lastSeen,p.t)+")":"⚫ "+lastSeenStr;
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

  // Activity feed - last 20 activities across all team
  var teamActivityFeed = p.activities.map(function(a){
    var uname=a.userId&&a.userId.name?a.userId.name:"";
    var lname=a.leadId&&a.leadId.name?a.leadId.name:"";
    var icon=a.type==="call"?"📞":a.type==="meeting"?"🤝":a.type==="status_change"?"🔄":a.type==="reassign"?"↩️":a.type==="note"?"📝":"🔔";
    return {icon,uname,lname,note:a.note,time:a.createdAt};
  });

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
      <div style={{ fontSize:12, fontWeight:700, color:C.textLight, marginBottom:10 }}>Agents without a manager</div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {topLevelSales.map(function(a){return <MemberCard key={gid(a)} user={a}/>;})}
      </div>
    </div>}

    {/* Old fallback if no managers defined */}
    {visibleManagers.length===0&&<div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
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
  </div>;
};

// ===== REPORTS =====
var ReportsPage = function(p) {
  var t=p.t;
  var [rPeriod,setRPeriod]=useState("monthly");
  var [rYear,setRYear]=useState(new Date().getFullYear());
  var rYears=[new Date().getFullYear(),new Date().getFullYear()-1,new Date().getFullYear()-2,new Date().getFullYear()-3];
  var [dailyRequests,setDailyRequests]=useState([]);
  useEffect(function(){
    apiFetch("/api/daily-requests","GET",null,p.token)
      .then(function(d){setDailyRequests(Array.isArray(d)?d:[]);})
      .catch(function(){setDailyRequests([]);});
  },[]);
  var sales=(p.cu.role==="team_leader"||p.cu.role==="manager")
    ? (p.myTeamUsers||[]).filter(function(u){return u.role==="sales"||u.role==="team_leader";})
    : p.users.filter(function(u){return u.role==="sales"||u.role==="manager"||u.role==="team_leader";});
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
          var curQR2=(function(){var m=new Date().getMonth();return m<3?"Q1":m<6?"Q2":m<9?"Q3":"Q4";})();
          var curYearR2=new Date().getFullYear();
          var qStartMs2=(function(){
            var qMap={Q1:0,Q2:3,Q3:6,Q4:9};
            var qStart=qMap[rPeriod]!==undefined?qMap[rPeriod]:null;
            if(qStart===null) return null;
            var d=new Date(rYear,qStart,1); d.setHours(0,0,0,0); return d.getTime();
          })();
          var qEndMs2=(function(){
            var qMap={Q1:3,Q2:6,Q3:9,Q4:12};
            var qEnd=qMap[rPeriod]!==undefined?qMap[rPeriod]:null;
            if(qEnd===null) return null;
            var d=new Date(rYear,qEnd,1); d.setHours(0,0,0,0); return d.getTime();
          })();
          var now2=Date.now();
          var ms2=["Q1","Q2","Q3","Q4"].includes(rPeriod)?null:{daily:86400000,weekly:604800000,monthly:2592000000}[rPeriod];
          var inP2=function(dateStr){
            if(!dateStr) return false;
            if(["Q1","Q2","Q3","Q4"].includes(rPeriod)){
              var t2=new Date(dateStr).getTime();
              return t2>=qStartMs2&&t2<qEndMs2;
            }
            return (now2-new Date(dateStr).getTime())<ms2;
          };
          var isQMode=["Q1","Q2","Q3","Q4"].includes(rPeriod);
          return <>
            <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap", alignItems:"center" }}>
              {["daily","weekly","monthly"].map(function(pp){var lbl={daily:"Today",weekly:"This Week",monthly:"This Month"}[pp];return <button key={pp} onClick={function(){setRPeriod(pp);}} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid", borderColor:rPeriod===pp?C.accent:"#E2E8F0", background:rPeriod===pp?C.accent+"12":"#fff", color:rPeriod===pp?C.accent:C.textLight, fontSize:11, cursor:"pointer" }}>{lbl}</button>;})}
              <div style={{ width:"1px", height:18, background:"#E2E8F0", margin:"0 2px" }}/>
              {["Q1","Q2","Q3","Q4"].map(function(pp){var isCur=pp===curQR2&&rYear===curYearR2;return <button key={pp} onClick={function(){setRPeriod(pp);}} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid", borderColor:rPeriod===pp?C.accent:"#E2E8F0", background:rPeriod===pp?C.accent+"12":"#fff", color:rPeriod===pp?C.accent:C.textLight, fontSize:11, fontWeight:600, cursor:"pointer" }}>{pp}{isCur?" 🔵":""}</button>;})}
              {isQMode&&<select value={rYear} onChange={function(e){setRYear(Number(e.target.value));}} style={{ padding:"3px 8px", borderRadius:7, border:"1px solid #E2E8F0", fontSize:11, background:"#fff", color:C.text }}>
                {rYears.map(function(y){return <option key={y} value={y}>{y}</option>;})}
              </select>}
            </div>
            {sales.map(function(a){var uid=gid(a);
              var al=normalLeads.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.createdAt&&inP2(l.createdAt);});
              var dailyReqCount=dailyRequests.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.createdAt&&inP2(l.createdAt);}).length;
              var meetDone=p.leads.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.status==="MeetingDone"&&l.updatedAt&&inP2(l.updatedAt);}).length+dailyRequests.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.status==="MeetingDone"&&l.updatedAt&&inP2(l.updatedAt);}).length;
              var d=p.leads.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.status==="DoneDeal"&&!l.archived&&l.updatedAt&&inP2(l.updatedAt);}).length;
              var cl=p.activities.filter(function(ac){var auid=String(ac.userId&&ac.userId._id?ac.userId._id:ac.userId||"");return auid===uid&&ac.type==="call"&&ac.createdAt&&inP2(ac.createdAt);}).length;
              var rate=al.length>0?Math.round(d/al.length*100):0;
              var qTarget2=getEffectiveQTarget(a,p.users,curQR2);
              var revenue2=p.leads.filter(function(l){var aid=String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");return aid===uid&&l.status==="DoneDeal"&&!l.archived&&l.updatedAt&&inP2(l.updatedAt);}).reduce(function(s,l){return s+parseFloat((l.budget||"0").toString().replace(/,/g,""))||0;},0);
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
  var salesAgentsForSetting = p.users ? p.users.filter(function(u){return (u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;}) : [];
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
        <label style={{display:"block",fontSize:13,fontWeight:600,color:C.text,marginBottom:5}}>🔄 Auto-Rotation Agents</label>
        <div style={{border:"1px solid #E2E8F0",borderRadius:10,padding:"8px 12px",background:"#fff",maxHeight:200,overflowY:"auto"}}>
          {salesAgentsForSetting.length===0&&<div style={{fontSize:12,color:C.textLight,padding:"6px 0"}}>No agents</div>}
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
        <div style={{fontSize:11,color:C.textLight,marginTop:4}}>Leads will only be assigned to selected agents ({reassignAgents.length} selected) — if none selected, no rotation occurs</div>
      </div>

      {/* Rotation Durations */}
      <div style={{marginBottom:13,padding:"14px 16px",background:"#F8FAFC",borderRadius:12,border:"1px solid #E8ECF1"}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:12}}>⚙️ Auto-Rotation Durations</div>
        {[
          {label:"No Answer — times before rotation",val:rotNoAnswerCount,set:setRotNoAnswerCount,unit:"times"},
          {label:"No Answer — wait after last attempt",val:rotNoAnswerHours,set:setRotNoAnswerHours,unit:"hrs"},
          {label:"Not Interested — return after",val:rotNotIntDays,set:setRotNotIntDays,unit:"days"},
          {label:"No Contact — rotate after",val:rotNoActDays,set:setRotNoActDays,unit:"days"},
          {label:"CallBack overdue — rotate after",val:rotCbDays,set:setRotCbDays,unit:"days"},
          {label:"Potential/HotCase/Meeting no action — rotate after",val:rotHotDays,set:setRotHotDays,unit:"days"},
        ].map(function(row){return <div key={row.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9,gap:10}}>
          <span style={{fontSize:12,color:C.text,flex:1}}>{row.label}</span>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <input type="number" min={1} max={30} value={row.val} onChange={function(e){row.set(Number(e.target.value));}} style={rotInpStyle}/>
            <span style={{fontSize:11,color:C.textLight}}>{row.unit}</span>
          </div>
        </div>;})}
      </div>

      <Inp label={t.language} type="select" value={p.lang} onChange={function(e){p.setLang(e.target.value);}} options={[{value:"ar",label:"Arabic"},{value:"en",label:"English"}]}/>
      {saved&&<div style={{marginBottom:12,padding:"10px 14px",background:"#DCFCE7",borderRadius:10,color:"#15803D",fontSize:13,fontWeight:600}}>✅ Saved successfully</div>}
      <Btn onClick={doSave}>{t.save}</Btn>
    </Card>
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
  var qRev = qDeals.reduce(function(s,d){var w=getProjectWeight(d.project,d);var sp=getDealSplitFromObj(d);return s+parseBudget(d.budget)*w*(sp?0.5:1);},0);
  var qProg = qTarget>0?Math.min(100,Math.round(qRev/qTarget*100)):0;
  var convRate = qLeads.length>0?Math.round(qDeals.length/qLeads.length*100):0;

  var isOnlineNow = myUser.lastSeen&&(Date.now()-new Date(myUser.lastSeen).getTime())<3*60*1000;

  // Available years — current and past 2
  var years = [curYear, curYear-1, curYear-2, curYear-3];

  return <div style={{ padding:"18px 16px 40px" }}>
    <h2 style={{ margin:"0 0 18px", fontSize:18, fontWeight:700 }}>KPIs</h2>

    {/* Profile Card — centered */}
    <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
      <Card style={{ width:"100%", maxWidth:420, padding:0, overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,"+C.primary+","+C.primaryLight+")", padding:24, textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
            <Avatar name={p.cu.username==="amgad"?"Amgad Mohamed":p.cu.name} size={60} online={isOnlineNow}/>
          </div>
          <div style={{ color:"#fff", fontSize:16, fontWeight:700 }}>{p.cu.username==="amgad"?"Amgad Mohamed":p.cu.name}</div>
          <div style={{ color:"rgba(255,255,255,0.55)", fontSize:12, marginTop:2 }}>{p.cu.title}</div>
          <div style={{ marginTop:6, fontSize:10, color:isOnlineNow?"#86EFAC":"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:isOnlineNow?"#22C55E":"rgba(255,255,255,0.3)", display:"inline-block" }}/>
            {isOnlineNow?"Online now":""}
          </div>
        </div>
        {/* Overall stats */}
        <div style={{ display:"flex", padding:"12px 16px", gap:8 }}>
          {[
            {v:myLeads.length, l:"Total Leads", c:C.info},
            {v:myDeals.length, l:"Total Deals", c:C.success},
            {v:myActs.filter(function(a){return a.type==="call";}).length, l:"Total Calls", c:C.accent},
            {v:myLeads.length>0?Math.round(myDeals.length/myLeads.length*100)+"%":"0%", l:"Conversion Rate", c:C.warning},
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
        {v:qLeads.length, l:"New Leads", c:C.accent, icon:"👤"},
        {v:convRate+"%", l:"Conversion Rate", c:C.warning, icon:"📊"},
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
  var [page,setPage]=useState((function(){try{return localStorage.getItem("crm_page")||null;}catch(e){return null;}})());
  var [leads,setLeads]=useState([]); var [users,setUsers]=useState([]);
  var [activities,setActivities]=useState([]); var [tasks,setTasks]=useState([]);
  var [dailyReqs,setDailyReqs]=useState([]);
  var [leadFilter,setLeadFilter]=useState("all");
  var [leadsPage,setLeadsPage]=useState(1); var [leadsTotal,setLeadsTotal]=useState(0); var [leadsTotalPages,setLeadsTotalPages]=useState(0);
  var [activitiesPage,setActivitiesPage]=useState(1); var [activitiesTotal,setActivitiesTotal]=useState(0); var [activitiesTotalPages,setActivitiesTotalPages]=useState(0);
  var [showNotif,setShowNotif]=useState(false);
  var [dealNotifs,setDealNotifs]=useState([]);
  var [showDealNotif,setShowDealNotif]=useState(false);
  var [showRotNotif,setShowRotNotif]=useState(false);
  var [rotNotifs,setRotNotifs]=useState([]);
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
    showBrowserNotif("🔄 Auto Rotation", lead.name+" — from "+fromName+" to "+toName+" ("+reason+")");
  };
  var rotatingNow = useRef(new Set()).current;
  var notifyRotationRef = useRef(notifyRotation);
  notifyRotationRef.current = notifyRotation;

  // Fetch notifications from DB
  var loadNotifications = function(tok){
    apiFetch("/api/notifications?type=deal","GET",null,tok).then(function(data){if(data)setDealNotifs(data);}).catch(function(){});
    apiFetch("/api/notifications?type=rotation","GET",null,tok).then(function(data){if(data)setRotNotifs(data);}).catch(function(){});
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

  var t=TR[lang];


  // Server already filters leads by role/hierarchy — frontend just returns as-is
  var getVisibleLeads = function(allLeads, user, allUsers) {
    return allLeads; // server handles all filtering
  };

  var loadData=useCallback(async function(tok, userOverride){
    setLoading(true); setDataError(null);
    try {
      var results=await Promise.all([
        apiFetch("/api/leads?page="+leadsPage+"&limit=1000","GET",null,tok),
        apiFetch("/api/users","GET",null,tok),
        apiFetch("/api/activities?page="+activitiesPage+"&limit=20","GET",null,tok),
        apiFetch("/api/tasks","GET",null,tok)
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
      try{ var drData = await apiFetch("/api/daily-requests","GET",null,tok); setDailyReqs(drData||[]); }catch(e){}
    } catch(e){setDataError(e.message);}
    setLoading(false);
    // Backfill lastFeedback for existing leads (once per browser)
    try{
      var bfKey="crm_feedback_backfilled";
      if(!localStorage.getItem(bfKey)){
        apiFetch("/api/leads/backfill-feedback","GET",null,tok).then(function(){
          localStorage.setItem(bfKey,"1");
          // Reload leads to pick up backfilled data
          apiFetch("/api/leads?page=1&limit=1000","GET",null,tok).then(function(r){if(r&&r.data)setLeads(r.data);}).catch(function(){});
        }).catch(function(){});
      }
    }catch(e){}
  },[leadsPage, activitiesPage]);

  // ===== POLLING BACKUP (every 15 seconds) =====
  useEffect(function(){
    if(!token) return;
    var knownLeadIds = null;
    var knownActivityIds = null;
    // Interval 1 — leads every 15s (skip if tab hidden)
    var leadsInterval = setInterval(async function(){
      if(document.visibilityState!=="visible") return;
      try{
        var result = await apiFetch("/api/leads?page="+leadsPage+"&limit=1000","GET",null,token);
        var leadsData = result.data||[];
        try{
          var cache=JSON.parse(localStorage.getItem('phone2_cache')||'{}');
          leadsData=leadsData.map(function(l){var id=l._id?String(l._id):null;if(id&&cache[id]&&!l.phone2)return Object.assign({},l,{phone2:cache[id]});return l;});
        }catch(e){}
        if(knownLeadIds !== null){
          var newLeads = leadsData.filter(function(l){return !knownLeadIds.has(String(l._id));});
          newLeads.forEach(function(l){
            var agName = l.agentId&&l.agentId.name?l.agentId.name:"";
            showBrowserNotif("🆕 New Lead", l.name+(agName?" → "+agName:""));
          });
        }
        knownLeadIds = new Set(leadsData.map(function(l){return String(l._id);}));
        setLeads(leadsData);
      }catch(e){}
    }, 15000);
    // Interval 2 — activities every 15s
    var actInterval = setInterval(async function(){
      try{
        var result = await apiFetch("/api/activities?page="+activitiesPage+"&limit=20","GET",null,token);
        var activitiesData = result.data||[];
        if(knownActivityIds !== null){
          var newActs = activitiesData.filter(function(a){return !knownActivityIds.has(String(a._id));});
          newActs.forEach(function(a){
            var who = a.userId&&a.userId.name?a.userId.name:"";
            var lead = a.leadId&&a.leadId.name?a.leadId.name:"";
            if(currentUser.role==="team_leader"){
              var teamNames=new Set((users||[]).filter(function(u){return u.role==="sales";}).map(function(u){return u.name;}));
              teamNames.add(currentUser.name);
              if(!teamNames.has(who)) return;
            }
            if(a.type==="call") showBrowserNotif("📞 Call logged", (who?who+" — ":"")+(lead||a.note||""));
            else if(a.type==="status_change"&&(a.note||"").includes("DoneDeal")) showBrowserNotif("🎉 Done Deal", (lead?lead+" — ":"")+who);
            else if(a.type==="reassign") showBrowserNotif("👤 Lead reassigned", (lead||"")+(a.note?" — "+a.note:""));
          });
        }
        knownActivityIds = new Set(activitiesData.map(function(a){return String(a._id);}));
        setActivities(activitiesData);
      }catch(e){}
    }, 15000);
    // Interval 3 — daily requests every 30s
    var drInterval = setInterval(async function(){
      try{
        var drData = await apiFetch("/api/daily-requests","GET",null,token);
        setDailyReqs(drData||[]);
      }catch(e){}
    }, 30000);
    return function(){ clearInterval(leadsInterval); clearInterval(actInterval); clearInterval(drInterval); };
  }, [token]);
  useEffect(function(){
    if(!token) return;
    var wsUrl = (process.env.REACT_APP_API_URL||API).replace("https://","wss://").replace("http://","ws://");
    var ws; var reconnectTimer; var retries=0; var maxRetries=10;
    function connect(){
      if(retries>=maxRetries) return;
      try{ ws = new WebSocket(wsUrl); }catch(e){ return; }
      ws.onopen = function(){ retries=0; };
      ws.onmessage = function(e){
        try{
          var msg = JSON.parse(e.data);
          if(msg.type==="lead_created"){
            setLeads(function(prev){
              if(prev.find(function(l){return gid(l)===gid(msg.data);})) return prev;
              return [msg.data].concat(prev);
            });
          } else if(msg.type==="lead_updated"){
            setLeads(function(prev){return prev.map(function(l){return gid(l)===gid(msg.data)?msg.data:l;});});
          } else if(msg.type==="activity_created"){
            setActivities(function(prev){return [msg.data].concat(prev).slice(0,50);});
          }
        }catch(err){}
      };
      ws.onclose = function(){
        retries++;
        if(retries<maxRetries){
          var delay=Math.min(1000*Math.pow(2,retries),30000);
          reconnectTimer = setTimeout(connect, delay);
        }
      };
      ws.onerror = function(){ try{ws.close();}catch(e){} };
    }
    connect();
    return function(){ clearTimeout(reconnectTimer); if(ws) try{ws.close();}catch(e){} };
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
    var defaultPage = (user.role==="sales"||user.role==="team_leader") ? "myday" : "dashboard";
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

  // ===== NOTIFICATION POLLING (every 30s) =====
  useEffect(function(){
    if(!token) return;
    var poll = function(){ loadNotifications(token); };
    var interval = setInterval(poll, 30000);
    return function(){ clearInterval(interval); };
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

    // Helper: pick agent using round-robin rotation
    var pickAgent = function(excludeId, previousAgentIds){
      var savedIds = getSavedAgents();
      if(!savedIds.length) return null;
      var agents = users.filter(function(u){return savedIds.includes(gid(u))&&(u.role==="sales"||u.role==="manager"||u.role==="team_leader")&&u.active;});
      if(!agents.length) return null;
      // Filter out the current agent and all previous agents
      var prevSet = (previousAgentIds||[]).map(function(id){return String(id);});
      var candidates = agents.filter(function(u){return gid(u)!==excludeId && !prevSet.includes(String(gid(u)));});
      if(!candidates.length) return null; // all agents exhausted
      // Round-robin: get last index from localStorage
      var lastIdx = 0;
      try{lastIdx = Number(localStorage.getItem('crm_rot_last_idx')||'0');}catch(e){}
      var nextIdx = lastIdx % candidates.length;
      var picked = candidates[nextIdx];
      // Save next index
      try{localStorage.setItem('crm_rot_last_idx', String((nextIdx+1) % candidates.length));}catch(e){}
      return picked;
    };

    // Helper: do rotation via backend /rotate endpoint (all 5 hard stops enforced server-side)
    var doRotate = async function(lead, reason){
      var lid = gid(lead);
      if(rotatingNow.has(lid)) return;

      // ── Frontend hard stop checks (fast fail before API call) ──
      // 1. noRotation on current assignment
      var currentAgentId = lead.agentId&&lead.agentId._id?lead.agentId._id:lead.agentId;
      var curAssign = (lead.assignments||[]).find(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===String(currentAgentId);});
      if(curAssign&&curAssign.noRotation) return;
      // 2. globalStatus eoi
      if(lead.globalStatus==="eoi") return;
      // 3. globalStatus donedeal
      if(lead.globalStatus==="donedeal") return;
      // 4. older than 30 days
      if(lead.createdAt&&(new Date()-new Date(lead.createdAt))>30*24*60*60*1000) return;
      // 5. Skip team_leader
      var currentAgentUser = users.find(function(u){return String(gid(u))===String(currentAgentId);});
      if(currentAgentUser&&currentAgentUser.role==="team_leader") return;

      var targetAgent = pickAgent(currentAgentId, lead.previousAgentIds);
      if(!targetAgent) return; // all agents exhausted (hard stop 5)
      var targetAgentId = gid(targetAgent);
      if(targetAgentId===currentAgentId) return;

      rotatingNow.add(lid);
      try{
        var fromName = lead.agentId&&lead.agentId.name?lead.agentId.name:"Agent";
        var timeStr=new Date().toLocaleString("en-GB");
        await apiFetch("/api/leads/"+gid(lead)+"/rotate","POST",{
          targetAgentId: targetAgentId,
          reason: "auto_timeout"
        },token);
        await apiFetch("/api/activities","POST",{
          leadId:gid(lead),type:"reassign",
          note:"🔄 Auto Rotation | From: "+fromName+" → To: "+targetAgent.name+" | Reason: "+reason+" | "+timeStr
        },token);
        notifyRotationRef.current(lead,fromName,targetAgent.name,reason);
        // Re-fetch leads from server to get correct per-agent overlay
        var fresh=await apiFetch("/api/leads?page=1&limit=1000","GET",null,token);
        if(fresh&&fresh.data) setLeads(fresh.data);
      }catch(e){console.error("Rotation error:",e);}
      finally{ rotatingNow.delete(lid); }
    };

    var HOUR = 60*60*1000;
    var DAY  = 24*60*60*1000;

    var isRunning = false;
    var runChecks = async function(){
      if(isRunning) return;
      isRunning = true;
      try{
      var now = Date.now();
      var savedIds = getSavedAgents();
      if(!savedIds.length){ isRunning=false; return; }
      var dur = getRotDurations();
      var rotatedThisCycle = new Set();

      var salesLeads = leads.filter(function(l){
        return !l.archived && l.source!=="Daily Request";
      });
      var THIRTY_DAYS = 30*24*60*60*1000;

      for(var i=0;i<salesLeads.length;i++){
        var l = salesLeads[i];
        var lid = gid(l);
        if(rotatedThisCycle.has(lid)) continue;
        var lastAct = new Date(l.lastActivityTime||0).getTime();

        // ── Hard stops (mirrors backend) ──
        // 1. noRotation on current assignment
        var lAgentId = String(l.agentId&&l.agentId._id?l.agentId._id:l.agentId||"");
        var lCurAssign = (l.assignments||[]).find(function(a){var aid=a.agentId&&a.agentId._id?a.agentId._id:a.agentId;return String(aid)===lAgentId;});
        if(lCurAssign&&lCurAssign.noRotation) continue;
        // 2. globalStatus eoi
        if(l.globalStatus==="eoi") continue;
        // 3. globalStatus donedeal
        if(l.globalStatus==="donedeal") continue;
        // 4. expired
        if(l.createdAt&&(new Date()-new Date(l.createdAt))>30*24*60*60*1000) continue;
        // Also skip old status checks for backwards compat
        if(l.status==="DoneDeal"||l.status==="EOI") continue;
        // Skip VIP leads — pinned, never rotate
        if(l.isVIP) continue;
        // Skip locked leads
        if(l.locked) continue;
        // 5. all agents exhausted — checked inside doRotate/pickAgent

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
  var titles={dashboard:t.dashboard,myday:t.myDay,kpis:"KPIs",calendar:"Calls Calendar",leads:t.leads,dailyReq:t.dailyReq,deals:t.deals,eoi:"EOI",projects:t.projects,tasks:t.tasks,reports:t.reports,team:t.team,users:t.users,archive:t.archive,settings:t.settings};
  // Server already filters users by role — p.users IS the team
  var myId = String(currentUser.id||currentUser._id||"");
  var myTeamUsers = users; // server handles all filtering per role

  var sp={t,leads,setLeads,users,setUsers,activities,setActivities,tasks,setTasks,cu:currentUser,token,csrfToken,nav,setFilter:setLeadFilter,leadFilter,lang,setLang,search,isMobile,initSelected,setInitSelected,isOnlyAdmin,myTeamUsers,addDealNotif:addDealNotif,notifyRotation:notifyRotation,rotNotifs:rotNotifs,dailyReqs:dailyReqs};

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
    {showPwaBanner&&<div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:9999, background:C.primary, color:"#fff", padding:"14px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 -4px 20px rgba(0,0,0,0.2)" }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>📲 Enable Notifications</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", lineHeight:1.4 }}>Tap <b>Share</b> → <b>Add to Home Screen</b> to install the app and receive notifications.</div>
      </div>
      <button onClick={function(){setShowPwaBanner(false);try{localStorage.setItem("crm_pwa_dismissed","1");}catch(e){}}} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, color:"#fff", padding:"6px 12px", fontSize:12, cursor:"pointer", flexShrink:0 }}>Got it</button>
    </div>}
    <Sidebar active={currentPage} setActive={setPage} t={t} cu={currentUser} onLogout={handleLogout} isMobile={isMobile} open={sidebarOpen} onClose={function(){setSidebarOpen(false);}}/>
    <div style={{ flex:1, marginRight:!isMobile&&t.dir==="rtl"?240:0, marginLeft:!isMobile&&t.dir==="ltr"?240:0, minHeight:"100vh", display:"flex", flexDirection:"column", minWidth:0 }}>
      <QuickPhoneSearch leads={leads} dailyReqs={dailyReqs} t={t} onSelect={function(lead){setPage("leads");setInitSelected(lead);}} onSelectDR={function(req){setPage("dailyReq");setInitSelected(req);}}/>
      {!isOnline&&<div style={{ background:"#FEF3C7", color:"#B45309", padding:"8px 16px", fontSize:12, fontWeight:600, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        ⚠️ You are offline — data will not be saved until connection is restored
      </div>}
      <Header title={titles[currentPage]||""} t={t} leads={leads} lang={lang} setLang={function(l){setLang(l);try{localStorage.setItem("crm_lang",l);}catch(e){}}} showNotif={showNotif} setShowNotif={setShowNotif} search={search} setSearch={setSearch} isMobile={isMobile} onMenu={function(){setSidebarOpen(true);}} onLeadClick={function(l){nav("leads",l);}} onDRClick={function(){setPage("dailyReq");}} dealNotifs={dealNotifs} setDealNotifs={setDealNotifs} showDealNotif={showDealNotif} setShowDealNotif={setShowDealNotif} cu={currentUser} isAdmin={isAdmin} showRotNotif={showRotNotif} setShowRotNotif={setShowRotNotif} rotNotifs={rotNotifs} setRotNotifs={setRotNotifs} unseenRot={rotNotifs.filter(function(n){return !n.seen;}).length} onRotNotifSeen={function(){apiFetch("/api/notifications/mark-seen","PUT",{type:"rotation"},token).then(function(){loadNotifications(token);}).catch(function(){});}} dailyRequests={dailyReqs} myTeamUsers={myTeamUsers} unseenDeals={dealNotifs.filter(function(n){return !n.seen;}).length} onDealNotifSeen={function(){apiFetch("/api/notifications/mark-seen","PUT",{type:"deal"},token).then(function(){loadNotifications(token);}).catch(function(){});}}/>
      <div style={{ flex:1 }}>{renderPage()}</div>
    </div>
  </div>;
}