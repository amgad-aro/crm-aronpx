/**
 * ARO CRM — Google Sheets → CRM importer.
 *
 * Runs every minute via a time-based trigger, scans for rows added since
 * the last run, and pushes each one into the CRM via POST /api/leads.
 *
 * Sheet columns (row 1 headers, any order, case-insensitive):
 *   name, phone, phone2, campaign, project
 * Column 5 is the status column — after each row is processed we write:
 *   "CRM"        — row pushed to the CRM successfully
 *   "Duplicate"  — phone already exists in the CRM
 *   "Error ..."  — anything else (http code or exception text)
 *
 * Setup:
 *   1. Extensions → Apps Script → paste this file.
 *   2. Project Settings → Script Properties:
 *        CRM_BASE_URL = https://crm-aro-backend-production.up.railway.app
 *        CRM_USERNAME = <CRM user with lead-create permission>
 *        CRM_PASSWORD = <that user's password>
 *   3. Run setupTrigger() once from the editor to install the 1-minute poll.
 *      Run resetLastRow() if you ever need to re-scan every row from the top.
 */

var SPREADSHEET_ID = "1iVfFjL-mdq4uyI0wRYZ0s-KPXiefzhUP7S08Gmu9b5E";
var STATUS_COL     = 5; // 1-indexed — "CRM" / "Duplicate" / "Error ..." land here.

function _props_()   { return PropertiesService.getScriptProperties(); }
function _sheet_()   { return SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0]; }
function _baseUrl_() {
  var u = _props_().getProperty("CRM_BASE_URL");
  if (!u) throw new Error("Missing CRM_BASE_URL script property");
  return u.replace(/\/+$/, "");
}

/**
 * Username/password login → JWT. Tokens live 7 days server-side; we refresh
 * a day early, and also retry once on a 401 in case the cached token was
 * invalidated server-side (password change, JWT_SECRET rotated, etc).
 */
function _getToken_() {
  var cached = _props_().getProperty("CRM_TOKEN");
  var exp    = Number(_props_().getProperty("CRM_TOKEN_EXP") || 0);
  if (cached && Date.now() < exp) return cached;
  var user = _props_().getProperty("CRM_USERNAME");
  var pass = _props_().getProperty("CRM_PASSWORD");
  if (!user || !pass) throw new Error("Missing CRM_USERNAME / CRM_PASSWORD script property");
  var res = UrlFetchApp.fetch(_baseUrl_() + "/api/login", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ username: user, password: pass }),
    muteHttpExceptions: true
  });
  var body = {};
  try { body = JSON.parse(res.getContentText() || "{}"); } catch (_) {}
  if (res.getResponseCode() !== 200 || !body.token) {
    throw new Error("Login failed: " + res.getResponseCode() + " " + (body.error || res.getContentText()));
  }
  _props_().setProperty("CRM_TOKEN", body.token);
  _props_().setProperty("CRM_TOKEN_EXP", String(Date.now() + 6 * 24 * 60 * 60 * 1000));
  return body.token;
}

function _authFetch_(path, opts) {
  opts = opts || {};
  opts.muteHttpExceptions = true;
  opts.headers = opts.headers || {};
  opts.headers.Authorization = "Bearer " + _getToken_();
  var res = UrlFetchApp.fetch(_baseUrl_() + path, opts);
  if (res.getResponseCode() === 401) {
    _props_().deleteProperty("CRM_TOKEN");
    _props_().deleteProperty("CRM_TOKEN_EXP");
    opts.headers.Authorization = "Bearer " + _getToken_();
    res = UrlFetchApp.fetch(_baseUrl_() + path, opts);
  }
  return res;
}

/**
 * Map header name (lowercased) → 0-indexed column number. Case-insensitive
 * so the sheet can use "Name" / "NAME" / "name" interchangeably. Campaign
 * and project must resolve to DIFFERENT columns — reading by name
 * guarantees they're never merged.
 */
function _headersMap_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  var row = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var c = 0; c < row.length; c++) {
    var k = String(row[c] || "").trim().toLowerCase();
    if (k && !(k in map)) map[k] = c;
  }
  return map;
}

function _rowToPayload_(headersMap, values) {
  var pick = function(key) {
    var i = headersMap[key];
    return i == null ? "" : String(values[i] == null ? "" : values[i]).trim();
  };
  return {
    name:     pick("name"),
    phone:    pick("phone"),
    phone2:   pick("phone2"),
    campaign: pick("campaign"),
    project:  pick("project"),
    source:   "Facebook",
    status:   "NewLead"
  };
}

function _isDuplicate_(phone) {
  var res = _authFetch_("/api/leads/check-duplicate/" + encodeURIComponent(phone), { method: "get" });
  if (res.getResponseCode() !== 200) return false;
  var body = {};
  try { body = JSON.parse(res.getContentText() || "{}"); } catch (_) {}
  return !!body.exists;
}

function _postLead_(payload) {
  return _authFetch_("/api/leads", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}

/**
 * Main polling function — called by the 1-minute trigger. LockService
 * ensures two concurrent ticks never process the same row twice (Apps
 * Script occasionally overlaps triggers when a previous run ran long).
 */
function checkNewLeads() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) return;
  try {
    var sheet   = _sheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    var start = Number(_props_().getProperty("LAST_ROW") || 1) + 1;
    if (start < 2) start = 2;
    if (start > lastRow) return;
    var headersMap = _headersMap_(sheet);
    var lastCol    = sheet.getLastColumn();
    var values     = sheet.getRange(start, 1, lastRow - start + 1, lastCol).getValues();
    for (var i = 0; i < values.length; i++) {
      var rowIndex = start + i;
      var statusCell = sheet.getRange(rowIndex, STATUS_COL);
      try {
        var payload = _rowToPayload_(headersMap, values[i]);
        if (!payload.name || !payload.phone) {
          statusCell.setValue("Error missing name/phone");
        } else if (_isDuplicate_(payload.phone)) {
          statusCell.setValue("Duplicate");
        } else {
          var res  = _postLead_(payload);
          var code = res.getResponseCode();
          if (code === 200 || code === 201)      statusCell.setValue("CRM");
          else if (code === 409)                 statusCell.setValue("Duplicate");
          else                                   statusCell.setValue("Error " + code);
        }
      } catch (err) {
        statusCell.setValue("Error " + (err && err.message ? err.message : err));
      }
      _props_().setProperty("LAST_ROW", String(rowIndex));
    }
  } finally {
    lock.releaseLock();
  }
}

/** Install the 1-minute polling trigger. Safe to re-run — removes old copies first. */
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "checkNewLeads") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("checkNewLeads").timeBased().everyMinutes(1).create();
}

/** Clear the last-row marker so the next run re-scans from row 2. */
function resetLastRow() {
  _props_().deleteProperty("LAST_ROW");
}
