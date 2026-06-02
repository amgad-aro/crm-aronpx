/* ============================================================
 * Biometric App-Lock (Capacitor) — native-only helper
 * ------------------------------------------------------------
 * NO-OP on web (all calls guarded by isNativePlatformSync()).
 *
 * Talks DIRECTLY to the native plugin via registerPlugin(), NOT through
 * @aparajita/capacitor-biometric-auth's JS index. The wrapper registers
 * with platform-implementation factories that do a nested lazy
 * import('./native'); that chunk never resolves when the app is served
 * from a remote server.url origin (crm-aro.com), so checkBiometry()/
 * authenticate() hang forever. A direct registerPlugin proxy bridges
 * straight to native (same pattern as @capacitor/push-notifications),
 * with no secondary chunk. The npm package is still required — it ships
 * the native Android/iOS code + capacitor.plugins.json registration.
 *
 * SECURITY MODEL: if the device has ANY lock (biometric OR PIN/pattern),
 * the app MUST require it — there is no bypass. The app opens without
 * auth ONLY when we positively confirm the device has no lock at all
 * (canAuth === false && canAuthKnown === true).
 * ============================================================ */

import { registerPlugin } from "@capacitor/core";

// Direct proxy to the native plugin (Android @CapacitorPlugin(name="BiometricAuthNative"),
// methods: checkBiometry, internalAuthenticate). No JS wrapper, no nested lazy chunk.
var BiometricAuthNative = registerPlugin("BiometricAuthNative");

var CHECK_TIMEOUT_MS = 8000;    // availability probe — short
var AUTH_TIMEOUT_MS  = 60000;   // prompt may legitimately wait on the user — long

// Synchronous native check — reads the global Capacitor injects natively.
// Absent on web => false. Seeds App.js's initial lock state (no flash).
export function isNativePlatformSync() {
  try {
    return !!(typeof window !== "undefined" && window.Capacitor
      && typeof window.Capacitor.isNativePlatform === "function"
      && window.Capacitor.isNativePlatform());
  } catch (e) { return false; }
}

// Race a promise against a timeout. On timeout REJECTS with a tagged error.
// Guarantees the returned promise always settles (never leaves the UI pending,
// so there is no permanent spinner).
function _race(promise, ms) {
  return new Promise(function (resolve, reject) {
    var to = setTimeout(function () {
      var e = new Error("biometric_timeout"); e.__timeout = true; reject(e);
    }, ms);
    Promise.resolve(promise).then(
      function (v) { clearTimeout(to); resolve(v); },
      function (err) { clearTimeout(to); reject(err); }
    );
  });
}

// Probe what the device can do. Returns:
//   { native, canAuthKnown, canAuth, isAvailable, deviceIsSecure }
// canAuthKnown=true  => checkBiometry resolved; canAuth is authoritative.
// canAuthKnown=false => timeout/error; canAuth is UNKNOWN (App.js must NOT
//                       treat this as "no lock" — it requires auth instead).
// Never throws, always settles.
export async function isBiometricAvailable() {
  if (!isNativePlatformSync()) {
    return { native: false, canAuthKnown: false, canAuth: false, isAvailable: false, deviceIsSecure: false };
  }
  try {
    var r = await _race(BiometricAuthNative.checkBiometry(), CHECK_TIMEOUT_MS);
    return {
      native: true,
      canAuthKnown: true,
      // canAuth = biometric enrolled OR device credential available (PIN/pattern/passcode)
      canAuth: !!(r.isAvailable || r.deviceIsSecure),
      isAvailable: !!r.isAvailable,
      deviceIsSecure: !!r.deviceIsSecure
    };
  } catch (e) {
    // Timeout or error — we could NOT confirm the device's lock state. Stay
    // secure: report unknown so the caller requires auth rather than opening.
    return { native: true, canAuthKnown: false, canAuth: false, isAvailable: false, deviceIsSecure: false };
  }
}

// Present the native auth prompt. Resolves true on success, false on
// cancel/fail/timeout. allowDeviceCredential:true => device PIN/passcode
// fallback (so a user with a lock can always satisfy it). Never throws.
export async function runBiometricAuth(reason) {
  if (!isNativePlatformSync()) return true; // web — treat as unlocked
  try {
    await _race(BiometricAuthNative.internalAuthenticate({
      reason: reason || "Unlock ARO CRM",
      cancelTitle: "Cancel",
      allowDeviceCredential: true,
      iosFallbackTitle: "Use passcode",
      androidTitle: "ARO CRM locked",
      androidSubtitle: "Verify your identity to continue",
      androidConfirmationRequired: false
    }), AUTH_TIMEOUT_MS);
    return true;
  } catch (e) {
    return false; // cancel / failure / timeout => not authenticated (stays locked)
  }
}
