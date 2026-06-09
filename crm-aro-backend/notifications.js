// Firebase Cloud Messaging dispatcher. Used to push notifications to a list
// of user IDs across all their registered devices.
//
// Initialization is lazy: the module loads cleanly even when
// FIREBASE_SERVICE_ACCOUNT_JSON is not set (e.g. local dev), so requiring
// this file never crashes the server. The first call to sendPushNotification()
// tries to init; if firebase-admin is missing or the env var is unset/bad,
// the call resolves to a no-op result instead of throwing.
//
// On send, tokens whose FCM error code marks them as permanently invalid
// (messaging/registration-token-not-registered, invalid-registration-token,
// invalid-argument) are pruned from the owning user's pushTokens array.

var admin = null;
try {
  admin = require("firebase-admin");
} catch (e) {
  // firebase-admin not installed — sendPushNotification() becomes a no-op
}

var initialized = false;
var initAttempted = false;

function init() {
  if (initialized) return true;
  if (initAttempted) return false;
  initAttempted = true;
  if (!admin) {
    console.warn("[notifications] firebase-admin not installed; push disabled");
    return false;
  }
  var raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.warn("[notifications] FIREBASE_SERVICE_ACCOUNT_JSON not set; push disabled");
    return false;
  }
  try {
    var creds = JSON.parse(raw);
    if (!admin.apps || admin.apps.length === 0) {
      admin.initializeApp({ credential: admin.credential.cert(creds) });
    }
    initialized = true;
    return true;
  } catch (e) {
    console.error("[notifications] failed to init firebase-admin:", e.message);
    return false;
  }
}

// FCM error codes that mean the token is permanently dead. Anything else
// (network blip, quota, etc.) is treated as transient — the token stays put.
var PERMANENT_ERROR_CODES = {
  "messaging/registration-token-not-registered": true,
  "messaging/invalid-registration-token": true,
  "messaging/invalid-argument": true,
};

async function sendPushNotification(userIds, title, body, data) {
  if (!init()) {
    return { disabled: true, sent: 0, failed: 0, invalidTokensRemoved: 0 };
  }
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return { sent: 0, failed: 0, invalidTokensRemoved: 0 };
  }

  // Resolve User model at call-time, not require-time: server.js redefines
  // the User schema inline after this file is required, and grabbing it at
  // load time would either throw (model not registered yet) or capture the
  // shadowed models.js version (missing pushTokens).
  var mongoose = require("mongoose");
  var User;
  try {
    User = mongoose.model("User");
  } catch (e) {
    console.error("[notifications] User model not registered yet:", e.message);
    return { sent: 0, failed: 0, invalidTokensRemoved: 0 };
  }

  // FCM requires data payload to be Record<string,string>; coerce everything.
  var dataPayload = {};
  if (data && typeof data === "object") {
    Object.keys(data).forEach(function(k) {
      var v = data[k];
      dataPayload[k] = (v === null || v === undefined) ? "" : String(v);
    });
  }

  var users = await User.find({ _id: { $in: userIds }, active: { $ne: false } })
    .select("_id pushTokens")
    .lean();

  // Flatten to [{userId, token}, ...] so we can prune by owner on failure.
  // Dedupe token VALUES so a device can never get the same push twice even if a
  // duplicate token slipped into pushTokens[] (belt-and-suspenders vs the
  // one-token-per-device dedupe in POST /api/users/push-token).
  var entries = [];
  var seenTokens = {};
  users.forEach(function(u) {
    (u.pushTokens || []).forEach(function(t) {
      if (t && t.token && !seenTokens[t.token]) {
        seenTokens[t.token] = true;
        entries.push({ userId: String(u._id), token: t.token });
      }
    });
  });
  if (entries.length === 0) {
    console.log("[notifications] no pushTokens for users:", userIds);
    return { sent: 0, failed: 0, invalidTokensRemoved: 0 };
  }

  var message = {
    notification: { title: String(title || ""), body: String(body || "") },
    data: dataPayload,
    // iOS sound: APNs only plays a sound if aps.sound is set. Android sound comes
    // from the notification channel (unaffected by this iOS-only block).
    apns: { payload: { aps: { sound: "default" } } },
    tokens: entries.map(function(e){ return e.token; }),
  };

  var resp;
  try {
    resp = await admin.messaging().sendEachForMulticast(message);
  } catch (e) {
    console.error("[notifications] FCM send failed:", e.message);
    return { sent: 0, failed: entries.length, invalidTokensRemoved: 0, error: e.message };
  }
  console.log("[notifications] FCM sent:", resp.successCount, "to", userIds.length, "users");

  // Group permanently-dead tokens by userId for $pull.
  var deadByUser = {};
  resp.responses.forEach(function(r, i) {
    if (!r.success) {
      var e0 = entries[i];
      var code = (r.error && r.error.code) || "unknown";
      var maskedTok = e0 && e0.token ? ("…" + String(e0.token).slice(-6)) : "(none)";
      console.warn("[notifications] token failed:", code, "user", e0 && e0.userId, "token", maskedTok);
      if (r.error && PERMANENT_ERROR_CODES[r.error.code]) {
        if (!deadByUser[e0.userId]) deadByUser[e0.userId] = [];
        deadByUser[e0.userId].push(e0.token);
      }
    }
  });

  var pruned = 0;
  var pruneUserIds = Object.keys(deadByUser);
  for (var i = 0; i < pruneUserIds.length; i++) {
    var uid = pruneUserIds[i];
    var deadTokens = deadByUser[uid];
    try {
      await User.updateOne(
        { _id: uid },
        { $pull: { pushTokens: { token: { $in: deadTokens } } } }
      );
      pruned += deadTokens.length;
    } catch (e) {
      console.error("[notifications] failed to prune dead tokens for user", uid, e.message);
    }
  }
  if (pruned > 0) console.log("[notifications] pruned", pruned, "dead token(s)");

  return {
    sent: resp.successCount,
    failed: resp.failureCount,
    invalidTokensRemoved: pruned,
  };
}

module.exports = {
  sendPushNotification: sendPushNotification,
  init: init,
};
