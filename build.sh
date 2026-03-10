#!/bin/bash
echo "🔨 Building TypeScript..."
npx tsc

echo "📦 Copying to docs/..."
mkdir -p docs/XiuShen
cp dist/XiuShen/XiuShen.js docs/XiuShen/index.js
cp src/XiuShen/icon.png docs/XiuShen/icon.png

# 更新 buildTime
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
sed -i "s/\"buildTime\": \".*\"/\"buildTime\": \"$BUILD_TIME\"/" docs/versioning.json

echo "✅ Done! docs/ is ready to deploy."
