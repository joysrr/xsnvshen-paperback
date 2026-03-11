const fs = require("fs");
const path = require("path");

const versioningPath = "docs/versioning.json";

if (!fs.existsSync(versioningPath)) {
    console.error("✘ versioning.json not found, skipping postbuild");
    process.exit(0);
}

const v = JSON.parse(fs.readFileSync(versioningPath, "utf8"));

// 過濾掉 null（build 失敗的 source）
v.sources = v.sources.filter(Boolean);

// 補上 desc 欄位（向下相容）
v.sources.forEach((s) => {
    s.desc = s.description ?? s.desc ?? "";
});

fs.writeFileSync(versioningPath, JSON.stringify(v, null, 2));
console.log("✔ Added desc field");

// 為每個 source 產生 <id>.js
v.sources.forEach((s) => {
    const dir = `docs/${s.id}`;
    const src = path.join(dir, "source.js");
    const dst = path.join(dir, `${s.id}.js`);
    // 同時也複製一份給 main.js
    const mainDst = path.join(dir, "main.js");

    if (!fs.existsSync(src)) {
        console.warn(`⚠ ${src} not found, skipping`);
        return;
    }

    let content = fs.readFileSync(src, "utf8");
    fs.copyFileSync(src, mainDst); // ← app 下載這個
    content += `\nvar ${s.id} = source.${s.id};\n`;
    fs.writeFileSync(dst, content);
    console.log(`✔ Created ${dst} and main.js`);
});
