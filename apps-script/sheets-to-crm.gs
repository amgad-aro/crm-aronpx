/**
 * ARO CRM — Google Sheets → CRM lead importer.
 *
 * Sheet header (row 1) must contain (case-insensitive, order-independent):
 *   name, phone, phone2, campaign, project
 * Any extra columns (e.g. "number") are ignored. Missing columns send as "".
 *
 * Setup:
 *   1. Open the sheet → Extensions → Apps Script → paste this file.
 *   2. Project Settings → Script Properties:
 *        CRM_BASE_URL  = https://crm-aro-backend-production.up.railway.app
 *        CRM_API_KEY   = <value of INTEGRATION_API_KEY from Railway>
 *        SHEET_NAME    = <tab name>       (optional — defaults to "Sheet1")
 *   3. Triggers → Add Trigger → function: onEditTrigger, event: "On edit".
 *      For bulk back-fill, run pushAllRows() once from the editor.
 *
 * The backend (POST /api/leads) deduplicates by phone, so resending a row is safe.
 */

var REQUIRED_FIELDS = ["name", "phone", "phone2", "campaign", "project"];

function _props_() {
  return PropertiesService.getScriptProperties();
}

function _sheet_() {
  var name = _props_().getProperty("SHEET_NAME") || "Sheet1";
  return SpreadsheetApp.getActive().getSheetByName(name);
}

function _rowToPayload_(headers, values) {
  var row = {};
  for (var c = 0; c < headers.length; c++) {
    var key = String(headers[c] || "").trim().toLowerCase();
    if (key) row[key] = values[c];
  }
  return {
    name:     String(row.name     || "").trim(),
    phone:    String(row.phone    || "").trim(),
    phone2:   String(row.phone2   || "").trim(),
    campaign: String(row.campaign || "").trim(),
    project:  String(row.project  || "").trim(),
    source:   "Google Sheets"
  };
}

function _sendToCrm_(payload) {
  if (!payload.name || !payload.phone) return { skipped: "missing name/phone" };
  var base = _props_().getProperty("CRM_BASE_URL");
  var key  = _props_().getProperty("CRM_API_KEY");
  if (!base || !key) throw new Error("Missing CRM_BASE_URL or CRM_API_KEY script property");
  var res = UrlFetchApp.fetch(base.replace(/\/+$/, "") + "/api/leads", {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": key },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  return { status: res.getResponseCode(), body: res.getContentText() };
}

/** On-edit trigger — sends the edited row. */
function onEditTrigger(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var wantName = _props_().getProperty("SHEET_NAME") || "Sheet1";
  if (sheet.getName() !== wantName) return;
  var rowIndex = e.range.getRow();
  if (rowIndex < 2) return;
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values  = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
  _sendToCrm_(_rowToPayload_(headers, values));
}

/** Manual back-fill — pushes every data row. Safe to re-run (backend dedupes by phone). */
function pushAllRows() {
  var sheet = _sheet_();
  if (!sheet) throw new Error("Sheet not found — check SHEET_NAME script property");
  var all = sheet.getDataRange().getValues();
  if (all.length < 2) return;
  var headers = all[0];
  for (var i = 1; i < all.length; i++) {
    _sendToCrm_(_rowToPayload_(headers, all[i]));
  }
}
