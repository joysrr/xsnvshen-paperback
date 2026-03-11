import * as https from "https";
import {
    parseAlbumList,
    parseAlbumDetail,
    buildListUrl,
    buildDetailUrl,
} from "../src/XiuShen/parser";

function fetch(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https
            .get(
                url,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
                    },
                },
                (res) => {
                    let data = "";
                    res.on("data", (chunk) => (data += chunk));
                    res.on("end", () => resolve(data));
                },
            )
            .on("error", reject);
    });
}

async function main() {
    console.log("=== 測試列表頁 ===");
    const listHtml = await fetch(buildListUrl(1));
    const items = parseAlbumList(listHtml);
    console.log(`找到 ${items.length} 個套圖`);
    items.slice(0, 3).forEach((i) => console.log(` - [${i.id}] ${i.title}`));
    console.log(`   cover: ${items[0]?.cover}`);

    if (items.length === 0) {
        console.error("❌ 列表解析失敗！");
        return;
    }

    console.log("\n=== 測試詳情頁 ===");
    const detailHtml = await fetch(buildDetailUrl(items[0].id));
    const detail = parseAlbumDetail(detailHtml);
    console.log(`標題: ${detail.title}`);
    console.log(`作者: ${detail.author}`);
    console.log(`標籤: ${detail.tags.join(", ")}`);
    console.log(`圖片數: ${detail.images.length}`);
    detail.images.slice(0, 3).forEach((u) => console.log(` - ${u}`));

    if (detail.images.length === 0) {
        console.error("❌ 圖片解析失敗！");
    } else {
        console.log("✅ 全部通過！");
    }
}

main().catch(console.error);
