/* ============================================================
 * Push Notifications (Capacitor Firebase Messaging) — native-only helper
 * ------------------------------------------------------------
 * This module is a NO-OP on the web build. Every entry point first
 * lazy-loads @capacitor/core and bails out unless we're running inside
 * a real native shell (Capacitor.isNativePlatform()). That means:
 *   - The web bundle never pulls the push SDK into the critical path
 *     (dynamic import() => its own chunk, only fetched on native).
 *   - Calling these from App.js on the web is completely safe.
 *
 * Uses @capacitor-firebase/messaging so iOS and Android BOTH register an
 * FCM token (the backend dispatches via firebase-admin). Unlike the old
 * @capacitor/push-notifications, the token is fetched imperatively via
 * getToken() (no register()/registration event); addListener('tokenReceived')
 * handles refreshes. Notification payloads are nested under event.notification.
 *
 * EXTERNAL CONTRACTS (kept stable so App.js needs zero changes):
 *   - exports: initPushNotifications(), disposePushNotifications(),
 *     removeTokenFromBackend(token)
 *   - window CustomEvents: 'crm:push-received' (foreground) and 'crm:open-lead' (tap)
 *   - localStorage tap keys: crm_pending_lead / crm_pending_lead_type / crm_pending_lead_status
 *   - POST /api/users/push-token { token, platform, deviceId }
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

// Cache the most recent FCM token so logout can deregister it (Capacitor
// exposes no synchronous getter). Mirrored to localStorage so a cold logout
// after a fresh module load can still find the token.
var _lastToken = "";
try {
  _lastToken = (typeof window !== "undefined" && window.localStorage)
    ? (localStorage.getItem("crm_push_token") || "") : "";
} catch (e) { _lastToken = ""; }

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

// Coerce an FCM data payload (typed `unknown` by the plugin) to a plain object
// so reads of .type/.leadId/.status never throw on a null/string value.
function _asObject(v) {
  return (v && typeof v === "object") ? v : {};
}

// POST the device token to the backend. Reads auth from the saved session.
// Exported so a re-register flow can push a refreshed token directly.
export async function sendTokenToBackend(token, platform) {
  if (!token) return;
  _lastToken = token;
  try { if (typeof window !== "undefined" && window.localStorage) localStorage.setItem("crm_push_token", token); } catch (e) {}
  var session = null;
  try {
    var raw = (typeof window !== "undefined" && window.localStorage)
      ? localStorage.getItem("crm_aro_session") : null;
    if (raw) session = JSON.parse(raw);
  } catch (e) { session = null; }
  if (!session || !session.token) return; // not logged in — nothing to associate
  // Stable per-install device id. Get-or-create so EVERY registration carries a
  // unique, non-empty deviceId — the backend uses it to keep one token per
  // device (dropping the stale token left by FCM rotation that caused duplicate
  // pushes). Previously this only READ the key, which was never set => always "".
  var deviceId = "";
  try {
    if (window.localStorage) {
      deviceId = localStorage.getItem("crm_device_id") || "";
      if (!deviceId) {
        deviceId = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : ("dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
        localStorage.setItem("crm_device_id", deviceId);
      }
    }
  } catch (e) { deviceId = ""; }
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

// Deregister this device's token from the CURRENT user (logout cleanup).
// MUST be called BEFORE the session is cleared — it needs a valid bearer.
// Fire-and-forget: never blocks logout. Reads the cached token by default.
export async function removeTokenFromBackend(token) {
  var tok = token || _lastToken;
  if (!tok) return;
  var session = null;
  try {
    var raw = (typeof window !== "undefined" && window.localStorage)
      ? localStorage.getItem("crm_aro_session") : null;
    if (raw) session = JSON.parse(raw);
  } catch (e) { session = null; }
  if (!session || !session.token) return; // not logged in — nothing to deregister
  try {
    await fetch(API + "/api/users/push-token", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.token
      },
      body: JSON.stringify({ token: tok })
    });
  } catch (e) { /* best-effort — token is also reclaimed on next user's login */ }
  try {
    _lastToken = "";
    if (typeof window !== "undefined" && window.localStorage) localStorage.removeItem("crm_push_token");
  } catch (e) {}
}

// Request permission, register with APNs/FCM, wire listeners, and ship the
// token to the backend. Safe to call multiple times — guarded by _initialized.
export async function initPushNotifications() {
  var Capacitor = await _getNativeCapacitor();
  if (!Capacitor) return; // web or non-native — no-op
  if (_initialized) return;

  var FirebaseMessaging;
  try {
    var mod = await import("@capacitor-firebase/messaging");
    FirebaseMessaging = mod && (mod.FirebaseMessaging || (mod.default && mod.default.FirebaseMessaging));
  } catch (e) { return; }
  if (!FirebaseMessaging) return;

  try {
    var perm = await FirebaseMessaging.checkPermissions();
    if (perm && perm.receive !== "granted") {
      perm = await FirebaseMessaging.requestPermissions();
    }
    if (!perm || perm.receive !== "granted") return; // user denied

    var platform = (typeof Capacitor.getPlatform === "function") ? Capacitor.getPlatform() : "unknown";

    // tokenReceived => fires with the FCM token (initial + on every refresh).
    // getToken() below covers the initial fetch; this keeps a rotated token in sync.
    _listeners.push(FirebaseMessaging.addListener("tokenReceived", function (event) {
      try { sendTokenToBackend(event && event.token, platform); } catch (e) {}
    }));
    // Foreground receipt: the OS suppresses its own banner while the app is
    // open (presentationOptions:[] in capacitor.config.ts), so we surface an
    // in-app banner instead. Mirror the crm:open-lead bridge — dispatch a
    // window event App.js listens for. Native-only (this listener is only wired
    // inside the native shell), so web never fires it. Payload is nested under
    // event.notification (vs the old flat notification object).
    _listeners.push(FirebaseMessaging.addListener("notificationReceived", function (event) {
      try {
        var n    = (event && event.notification) || {};
        var data = _asObject(n.data);
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("crm:push-received", {
            detail: {
              title:  n.title  ? String(n.title)  : "",
              body:   n.body   ? String(n.body)   : "",
              type:   data.type   ? String(data.type)   : "",
              leadId: data.leadId ? String(data.leadId) : "",
              status: data.status ? String(data.status) : ""
            }
          }));
        }
      } catch (e) { /* never let a foreground receipt throw */ }
    }));
    _listeners.push(FirebaseMessaging.addListener("notificationActionPerformed", function (event) {
      try {
        var data = _asObject(event && event.notification && event.notification.data);
        var lid  = data.leadId ? String(data.leadId) : "";
        if (!lid) return;
        // Durable bridge: App.js reads these on mount (cold start / resume from
        // a tapped notification). type + status let it route to the right page.
        try {
          localStorage.setItem("crm_pending_lead", lid);
          localStorage.setItem("crm_pending_lead_type", data.type ? String(data.type) : "");
          localStorage.setItem("crm_pending_lead_status", data.status ? String(data.status) : "");
        } catch (e) {}
        // Instant path when the app is already foreground: App.js listens for this.
        if (typeof window !== "undefined" && window.dispatchEvent) {
          try {
            window.dispatchEvent(new CustomEvent("crm:open-lead", {
              detail: { leadId: lid, type: data.type || "", status: data.status || "" }
            }));
          } catch (e) {}
        }
      } catch (e) { /* never let tap handling throw */ }
    }));

    // Imperative initial fetch (replaces register() + the registration event).
    // Wrapped in its OWN try/catch — this is the error path the old
    // registrationError listener handled. A getToken() failure is swallowed
    // here: init still completes (_initialized becomes true below) and the
    // tokenReceived listener remains the fallback that delivers the token if/
    // when it later becomes available.
    try {
      var result = await FirebaseMessaging.getToken();
      if (result && result.token) sendTokenToBackend(result.token, platform);
    } catch (e) { /* token fetch failed — tokenReceived may still deliver it */ }

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
