const fs = require("fs");
const path = require("path");

const versioningPath = "docs/versioning.json";
const v = JSON.parse(fs.readFileSync(versioningPath));

v.sources.forEach((s) => {
    s.desc = s.description;
});
fs.writeFileSync(versioningPath, JSON.stringify(v, null, 2));
console.log("✔ Added desc field");

v.sources.forEach((s) => {
    const dir = `docs/${s.id}`;
    const src = path.join(dir, "index.js");
    const dst = path.join(dir, `${s.id}.js`);
    if (fs.existsSync(src)) {
        let content = fs.readFileSync(src, "utf8");
        content += `\nvar ${s.id} = source.${s.id};`;
        fs.writeFileSync(dst, content);
        console.log(`✔ Created ${s.id}.js with export`);
    }
});
