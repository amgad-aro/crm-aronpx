/* ============================================================
 * Biometric App-Lock (Capacitor) — native-only helper
 * ------------------------------------------------------------
 * NO-OP on web. Every entry point lazy-loads the plugin and bails
 * out unless running inside a native shell. The web bundle never
 * pulls the biometric SDK into the critical path (dynamic import
 * => its own chunk, only fetched on native).
 *
 * Plugin: @aparajita/capacitor-biometric-auth (Capacitor 8).
 * ============================================================ */

// Synchronous native check — reads the global Capacitor injects in the
// native shell. Absent on web => false, with zero imports. Used by App.js
// to seed the initial lock state on the very first paint (no flash).
export function isNativePlatformSync() {
  try {
    return !!(typeof window !== "undefined" && window.Capacitor
      && typeof window.Capacitor.isNativePlatform === "function"
      && window.Capacitor.isNativePlatform());
  } catch (e) { return false; }
}

// Lazy-load the plugin only on native. Returns the BiometricAuth object or null.
async function _getPlugin() {
  if (!isNativePlatformSync()) return null;
  try {
    var mod = await import("@aparajita/capacitor-biometric-auth");
    return mod && (mod.BiometricAuth || (mod.default && mod.default.BiometricAuth)) || null;
  } catch (e) { return null; }
}

// Is there ANY way to authenticate? biometry enrolled OR device has a PIN/passcode.
// Returns { native, canAuth, isAvailable, deviceIsSecure }. On web: native:false,
// canAuth:false. The escape hatch in App.js uses canAuth: when false there is no
// possible authentication mechanism, so the app must NOT hard-lock the user out.
export async function isBiometricAvailable() {
  var plugin = await _getPlugin();
  if (!plugin) return { native: false, canAuth: false, isAvailable: false, deviceIsSecure: false };
  try {
    var r = await plugin.checkBiometry();
    return {
      native: true,
      isAvailable: !!r.isAvailable,
      deviceIsSecure: !!r.deviceIsSecure,
      // canAuth = biometric enrolled OR device credential available (PIN fallback)
      canAuth: !!(r.isAvailable || r.deviceIsSecure)
    };
  } catch (e) {
    // checkBiometry failed — be safe and report no auth mechanism so the
    // escape hatch lets the user through rather than trapping them.
    return { native: true, canAuth: false, isAvailable: false, deviceIsSecure: false };
  }
}

// Prompt the user. Resolves true on success, false on cancel/failure.
// allowDeviceCredential:true => falls back to device PIN/passcode when biometry
// is unavailable or after biometric lockout. Never throws.
export async function runBiometricAuth(reason) {
  var plugin = await _getPlugin();
  if (!plugin) return true; // web / non-native — treat as unlocked
  try {
    await plugin.authenticate({
      reason: reason || "Unlock ARO CRM",
      cancelTitle: "Cancel",
      allowDeviceCredential: true,        // PIN/passcode fallback
      iosFallbackTitle: "Use passcode",
      androidTitle: "ARO CRM locked",
      androidSubtitle: "Verify your identity to continue",
      androidConfirmationRequired: false
    });
    return true;                          // resolves => authenticated
  } catch (e) {
    return false;                         // BiometryError (cancel/fail) => stay locked
  }
}

// Register the plugin's native resume listener. cb() is called when the app
// returns to the foreground. Returns a cleanup function (removes the listener).
// No-op on web (returns a no-op cleanup).
export async function addBiometricResumeListener(cb) {
  var plugin = await _getPlugin();
  if (!plugin || typeof plugin.addResumeListener !== "function") return function(){};
  try {
    var handle = await plugin.addResumeListener(function(){ try { cb(); } catch (e) {} });
    return function(){ try { handle && handle.remove && handle.remove(); } catch (e) {} };
  } catch (e) { return function(){}; }
}
