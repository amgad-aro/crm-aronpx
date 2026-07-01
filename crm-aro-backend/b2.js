// Backblaze B2 (S3-compatible) object storage helper.
//
// Private bucket: Mongo stores only the object KEY + metadata; short-lived
// signed GET URLs are minted at read time (see resolveArtifacts in server.js).
// Files are uploaded server-side (backend-proxied), so no bucket CORS is needed
// for writes.
//
// FAIL-SAFE: if the B2_* env vars (or the AWS SDK) are missing, this module
// still loads. isConfigured() returns false, putObject() throws a tagged
// B2_UNCONFIGURED error (write endpoints turn that into a clean 503), and the
// read/delete helpers no-op instead of crashing the server.
//
// Required env (set on Railway):
//   B2_ENDPOINT           e.g. https://s3.us-east-005.backblazeb2.com
//   B2_REGION             e.g. us-east-005
//   B2_ACCESS_KEY_ID
//   B2_SECRET_ACCESS_KEY
//   B2_BUCKET             e.g. aro-crm-files
//   B2_SIGN_TTL           optional, seconds (default 3600)
"use strict";

var S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, getSignedUrl;
try {
  var s3 = require("@aws-sdk/client-s3");
  S3Client = s3.S3Client;
  PutObjectCommand = s3.PutObjectCommand;
  DeleteObjectCommand = s3.DeleteObjectCommand;
  GetObjectCommand = s3.GetObjectCommand;
  getSignedUrl = require("@aws-sdk/s3-request-presigner").getSignedUrl;
} catch (e) {
  console.error("[b2] AWS SDK not installed:", e && e.message ? e.message : e);
}

var ENDPOINT     = process.env.B2_ENDPOINT || "";
var REGION       = process.env.B2_REGION || "";
var ACCESS_KEY   = process.env.B2_ACCESS_KEY_ID || "";
var SECRET_KEY   = process.env.B2_SECRET_ACCESS_KEY || "";
var BUCKET       = process.env.B2_BUCKET || "";
var DEFAULT_TTL  = Number(process.env.B2_SIGN_TTL || 3600);

var _client = null;
var _configured = !!(S3Client && getSignedUrl && ENDPOINT && REGION && ACCESS_KEY && SECRET_KEY && BUCKET);

if (_configured) {
  try {
    _client = new S3Client({
      endpoint: ENDPOINT,
      region: REGION,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
      forcePathStyle: true, // S3-compatible (B2) — path-style addressing
    });
    console.log("[b2] file storage configured — bucket:", BUCKET, "region:", REGION);
  } catch (e) {
    console.error("[b2] client init failed:", e && e.message ? e.message : e);
    _client = null;
    _configured = false;
  }
} else {
  console.warn("[b2] file storage NOT configured — uploads will 503 until B2_* env vars are set");
}

function isConfigured() { return _configured; }

// Upload a buffer. Throws B2_UNCONFIGURED if storage isn't set up so the caller
// can return a clean 503. Any real S3 error propagates to the caller's catch.
async function putObject(key, buffer, contentType) {
  if (!_configured) {
    var err = new Error("file storage not configured");
    err.code = "B2_UNCONFIGURED";
    throw err;
  }
  await _client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
  }));
  return key;
}

// Best-effort delete. Never throws — a failed cleanup must not fail the request
// (returns false and logs so orphans can be reconciled later).
async function deleteObject(key) {
  if (!_configured || !key) return false;
  try {
    await _client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (e) {
    console.error("[b2] deleteObject failed:", key, e && e.message ? e.message : e);
    return false;
  }
}

// Mint a short-lived signed GET URL for a stored key. Returns null (never
// throws) if unconfigured or on error, so read resolvers can fall back safely.
async function getSignedReadUrl(key, ttl) {
  if (!_configured || !key) return null;
  try {
    return await getSignedUrl(
      _client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: ttl || DEFAULT_TTL }
    );
  } catch (e) {
    console.error("[b2] getSignedReadUrl failed:", key, e && e.message ? e.message : e);
    return null;
  }
}

module.exports = {
  isConfigured: isConfigured,
  putObject: putObject,
  deleteObject: deleteObject,
  getSignedReadUrl: getSignedReadUrl,
  DEFAULT_TTL: DEFAULT_TTL,
};
