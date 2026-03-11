// scripts/postbuild.js
const fs = require("fs");

const versioningPath = "docs/versioning.json";
const v = JSON.parse(fs.readFileSync(versioningPath));

v.sources.forEach((s) => {
    s.desc = s.description;
});

fs.writeFileSync(versioningPath, JSON.stringify(v, null, 2));
console.log("✔ Added desc field to versioning.json");
