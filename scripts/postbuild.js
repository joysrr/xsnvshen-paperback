// scripts/postbuild.js
const fs = require("fs");
const path = require("path");

// 修正 versioning.json 加上 desc
const versioningPath = "docs/versioning.json";
const v = JSON.parse(fs.readFileSync(versioningPath));
v.sources.forEach((s) => {
    s.desc = s.description;
});
fs.writeFileSync(versioningPath, JSON.stringify(v, null, 2));
console.log("✔ Added desc field to versioning.json");

// 為每個 source 複製 index.js → {SourceId}.js
v.sources.forEach((s) => {
    const dir = `docs/${s.id}`;
    const src = path.join(dir, "index.js");
    const dst = path.join(dir, `${s.id}.js`);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
        console.log(`✔ Copied index.js → ${s.id}.js`);
    }
});
