/* ============================================================
 * Geolocation (Capacitor) — web + native helper
 * ------------------------------------------------------------
 * WEB:    navigator.geolocation (unchanged behavior).
 * NATIVE: the @capacitor/geolocation plugin via a DIRECT
 *         registerPlugin('Geolocation') bridge — same robust
 *         pattern as biometric.js (no nested lazy chunk, so no
 *         hang when the app is served from the remote server.url
 *         origin). The npm package ships the native code +
 *         capacitor.plugins.json registration; we talk to it by name.
 *
 * Both paths resolve the SAME shape { latitude, longitude, accuracy }
 * so the backend / attendance logic is untouched. Always settles
 * (rejects on timeout) — never hangs the check-in spinner.
 * ============================================================ */

import { registerPlugin } from "@capacitor/core";

// Direct native-bridge proxy (Android @CapacitorPlugin(name="Geolocation")).
// Harmless unused proxy on web — all calls are guarded by isNativePlatformSync().
var GeolocationNative = registerPlugin("Geolocation");

function isNativePlatformSync() {
  try {
    return !!(typeof window !== "undefined" && window.Capacitor
      && typeof window.Capacitor.isNativePlatform === "function"
      && window.Capacitor.isNativePlatform());
  } catch (e) { return false; }
}

// Reject if `promise` doesn't settle within ms — guarantees the caller's
// error path fires instead of a permanent "Getting location…" state.
function _race(promise, ms) {
  return new Promise(function (resolve, reject) {
    var to = setTimeout(function () { reject(new Error("Location request timed out")); }, ms);
    Promise.resolve(promise).then(
      function (v) { clearTimeout(to); resolve(v); },
      function (e) { clearTimeout(to); reject(e); }
    );
  });
}

async function _nativeGetPosition(opts) {
  var granted = function (p) { return !!(p && (p.location === "granted" || p.coarseLocation === "granted")); };
  var perm = await GeolocationNative.checkPermissions();
  if (!granted(perm)) {
    perm = await GeolocationNative.requestPermissions({ permissions: ["location", "coarseLocation"] });
  }
  if (!granted(perm)) throw new Error("Location permission denied");
  var pos = await GeolocationNative.getCurrentPosition({
    enableHighAccuracy: opts.enableHighAccuracy !== false,
    timeout: opts.timeout || 15000,
    maximumAge: opts.maximumAge != null ? opts.maximumAge : 0
  });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
}

// Returns Promise<{ latitude, longitude, accuracy }>. Always settles.
export function getCurrentPosition(options) {
  var opts = options || {};
  if (!isNativePlatformSync()) {
    // WEB — unchanged behavior (navigator.geolocation has its own timeout).
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(
        function (pos) { resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }); },
        function (err) { reject(new Error(err.message || "Location denied")); },
        { enableHighAccuracy: opts.enableHighAccuracy !== false, timeout: opts.timeout || 15000, maximumAge: opts.maximumAge != null ? opts.maximumAge : 0 }
      );
    });
  }
  // NATIVE — plugin flow with a hard backstop timeout so it always settles.
  return _race(_nativeGetPosition(opts), (opts.timeout || 15000) + 5000);
}
