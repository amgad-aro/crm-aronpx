// One-off: drop the now-empty `leadartifactarchives` collection, retired after
// the Backblaze B2 file-storage migration (see migrate-artifacts-to-b2.js).
//
// SAFETY: refuses to drop unless the collection has 0 documents. Touches NO
// other collection. Read-only until the final drop.
//
//   MONGODB_URI=... node drop-leadartifactarchive.js
"use strict";
var mongoose = require("mongoose");

(async function () {
  var URI = process.env.MONGODB_URI;
  if (!URI) { console.error("Abort: MONGODB_URI missing"); process.exit(1); }
  await mongoose.connect(URI);
  var db = mongoose.connection.db;

  var names = (await db.listCollections({ name: "leadartifactarchives" }).toArray()).map(function (c) { return c.name; });
  if (!names.length) { console.log("Collection `leadartifactarchives` does not exist — nothing to do."); await mongoose.disconnect(); return; }

  var count = await db.collection("leadartifactarchives").countDocuments({});
  console.log("leadartifactarchives document count:", count);
  if (count !== 0) {
    console.error("Abort: collection is NOT empty (" + count + " docs). Refusing to drop.");
    await mongoose.disconnect();
    process.exit(1);
  }

  await db.collection("leadartifactarchives").drop();
  console.log("Dropped empty collection `leadartifactarchives`.");
  await mongoose.disconnect();
})().catch(function (e) { console.error("FATAL:", e && e.message ? e.message : e); process.exit(1); });
