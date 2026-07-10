// Trims geoip-lite's city databases (~104MB on disk / ~100MB resident RAM) after
// install, leaving country-only data (~6MB / ~5MB RAM). ARO CRM session/device
// tracking only needs country-level geolocation; the city DB is a large build and
// memory cost we don't use. geoip-lite degrades gracefully to country-only when the
// city .dat files are absent (returns country with an empty city).
//
// Runs as the backend's npm "postinstall" hook so Railway/CI reinstalls stay lean.
// Safe/idempotent: no-ops if geoip-lite isn't installed or the files are already gone.
var fs = require("fs");
var path = require("path");

var dataDir = path.join(__dirname, "node_modules", "geoip-lite", "data");
var cityFiles = ["geoip-city.dat", "geoip-city6.dat", "geoip-city-names.dat"];

var removed = 0;
cityFiles.forEach(function (f) {
  var p = path.join(dataDir, f);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      removed++;
    }
  } catch (e) {
    // Non-fatal — never fail an install over this.
    console.warn("[trim-geoip-city] could not remove " + f + ": " + (e && e.message ? e.message : e));
  }
});

console.log("[trim-geoip-city] removed " + removed + " city data file(s); country-only geoip retained.");
