/* ============================================================
 * Push Notifications (Capacitor) — native-only helper
 * ------------------------------------------------------------
 * This module is a NO-OP on the web build. Every entry point first
 * lazy-loads @capacitor/core and bails out unless we're running inside
 * a real native shell (Capacitor.isNativePlatform()). That means:
 *   - The web bundle never pulls the push SDK into the critical path
 *     (dynamic import() => its own chunk, only fetched on native).
 *   - Calling these from App.js on the web is completely safe.
 *
 * Backend contract: POST /api/users/push-token  { token, platform, deviceId }
 * Auth: Bearer token read from localStorage 'crm_aro_session' (same shape
 * the rest of App.js uses: { user, token, csrfToken }).
 * ============================================================ */

var API = (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL
  : "https://crm-aro-backend-production.up.railway.app";

// Handles to the registered listeners so disposePushNotifications() can
// remove them. Capacitor's addListener returns a promise of a handle with
// a .remove() method; we stash the promises and await them on cleanup.
var _listeners = [];
var _initialized = false;

// Lazy-load @capacitor/core and report whether we're on a native platform.
// Returns the Capacitor object on native, or null on web / if unavailable.
async function _getNativeCapacitor() {
  try {
    var mod = await import("@capacitor/core");
    var Capacitor = mod && (mod.Capacitor || (mod.default && mod.default.Capacitor));
    if (Capacitor && typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform()) {
      return Capacitor;
    }
  } catch (e) { /* core not present (pure web build) — fall through */ }
  return null;
}

// POST the device token to the backend. Reads auth from the saved session.
// Exported so a re-register flow can push a refreshed token directly.
export async function sendTokenToBackend(token, platform) {
  if (!token) return;
  var session = null;
  try {
    var raw = (typeof window !== "undefined" && window.localStorage)
      ? localStorage.getItem("crm_aro_session") : null;
    if (raw) session = JSON.parse(raw);
  } catch (e) { session = null; }
  if (!session || !session.token) return; // not logged in — nothing to associate
  var deviceId = "";
  try { deviceId = (window.localStorage && localStorage.getItem("crm_device_id")) || ""; } catch (e) {}
  try {
    await fetch(API + "/api/users/push-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.token
      },
      body: JSON.stringify({ token: token, platform: platform || "unknown", deviceId: deviceId })
    });
  } catch (e) { /* offline / transient — token re-syncs on next init */ }
}

// Request permission, register with APNs/FCM, wire listeners, and ship the
// token to the backend. Safe to call multiple times — guarded by _initialized.
export async function initPushNotifications() {
  var Capacitor = await _getNativeCapacitor();
  if (!Capacitor) return; // web or non-native — no-op
  if (_initialized) return;

  var PushNotifications;
  try {
    var mod = await import("@capacitor/push-notifications");
    PushNotifications = mod && (mod.PushNotifications || (mod.default && mod.default.PushNotifications));
  } catch (e) { return; }
  if (!PushNotifications) return;

  try {
    var perm = await PushNotifications.checkPermissions();
    if (perm && perm.receive !== "granted") {
      perm = await PushNotifications.requestPermissions();
    }
    if (!perm || perm.receive !== "granted") return; // user denied

    var platform = (typeof Capacitor.getPlatform === "function") ? Capacitor.getPlatform() : "unknown";

    // registration => fires with the FCM/APNs token
    _listeners.push(PushNotifications.addListener("registration", function (tokenData) {
      try { sendTokenToBackend(tokenData && tokenData.value, platform); } catch (e) {}
    }));
    _listeners.push(PushNotifications.addListener("registrationError", function () { /* silent — retried next launch */ }));
    _listeners.push(PushNotifications.addListener("pushNotificationReceived", function () { /* foreground receipt; UI bell already polls */ }));
    _listeners.push(PushNotifications.addListener("pushNotificationActionPerformed", function (action) {
      try {
        var data = (action && action.notification && action.notification.data) || {};
        console.log("[TAP] action received, data=", JSON.stringify(action && action.notification && action.notification.data));
        var lid  = data.leadId ? String(data.leadId) : "";
        if (!lid) return;
        // Durable bridge: App.js reads these on mount (cold start / resume from
        // a tapped notification). type + status let it route to the right page.
        try {
          localStorage.setItem("crm_pending_lead", lid);
          localStorage.setItem("crm_pending_lead_type", data.type ? String(data.type) : "");
          localStorage.setItem("crm_pending_lead_status", data.status ? String(data.status) : "");
          console.log("[TAP] wrote crm_pending_lead=", lid);
        } catch (e) {}
        // Instant path when the app is already foreground: App.js listens for this.
        if (typeof window !== "undefined" && window.dispatchEvent) {
          try {
            window.dispatchEvent(new CustomEvent("crm:open-lead", {
              detail: { leadId: lid, type: data.type || "", status: data.status || "" }
            }));
            console.log("[TAP] dispatched crm:open-lead");
          } catch (e) {}
        }
      } catch (e) { /* never let tap handling throw */ }
    }));

    await PushNotifications.register();
    _initialized = true;
  } catch (e) { /* registration failed — leave _initialized false so a later call retries */ }
}

// Remove all listeners registered by initPushNotifications(). Idempotent.
export async function disposePushNotifications() {
  var pending = _listeners.slice();
  _listeners = [];
  _initialized = false;
  for (var i = 0; i < pending.length; i++) {
    try {
      var handle = await pending[i];
      if (handle && typeof handle.remove === "function") await handle.remove();
    } catch (e) { /* ignore */ }
  }
}
