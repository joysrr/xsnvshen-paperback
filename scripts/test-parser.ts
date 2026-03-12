import * as https from "https";
import * as cheerio from "cheerio";
import * as zlib from "zlib"; // ★ GZIP 解壓縮

import {
    buildCategoryListUrl,
    parseCategories,
    parseAlbumList,
    parseAlbumDetail,
    buildListUrl,
    buildDetailUrl,
} from "../src/XiuShen/parser";

// ★ 修正 fetch：加入 headers、正確的 error handling
async function fetch(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const client = https;

        const req = client.request(
            {
                hostname: parsed.hostname,
                port: Number(parsed.port) || 443,
                path: parsed.pathname + parsed.search,
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
                    Accept: "text/html,application/xhtml+xml,*/*;q=0.9",
                    "Accept-Language": "zh-TW,zh;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    Referer: "https://www.google.com/",
                },
            },
            (res) => {
                console.log(`${res.statusCode} ${res.statusMessage}`);

                const chunks: Buffer[] = [];

                res.on("data", (chunk: Buffer) => chunks.push(chunk));
                res.on("end", () => {
                    let rawData = Buffer.concat(chunks);

                    // ★ GZIP 自動解壓
                    const encoding = res.headers["content-encoding"];
                    if (encoding === "gzip") {
                        zlib.gunzip(rawData, (err, decompressed) => {
                            if (err) {
                                console.error("GZIP 解壓失敗:", err);
                                resolve(rawData.toString("utf8"));
                            } else {
                                console.log(
                                    `解壓後: ${decompressed.length} bytes`,
                                );
                                resolve(decompressed.toString("utf8"));
                            }
                        });
                    } else if (encoding === "deflate") {
                        zlib.inflate(rawData, (err, decompressed) => {
                            if (err) reject(err);
                            else resolve(decompressed.toString("utf8"));
                        });
                    } else {
                        console.log(`原始大小: ${rawData.length} bytes`);
                        resolve(rawData.toString("utf8"));
                    }
                });
            },
        );

        req.on("error", reject);
        req.end();
    });
}
const BASE_URL = "https://m.xsnvshen.com";

async function main() {
    try {
        console.log("=== 測試分類頁 ===");
        const categoriesHtml = await fetch(BASE_URL + "/album");
        console.log("HTML 大小:", categoriesHtml.length, "bytes");

        const $categories = cheerio.load(categoriesHtml);
        console.log("分類導航是否存在:", !!$categories("#m_album").length);
        console.log(
            "導航 HTML:",
            $categories("#m_album").html()?.substring(0, 500),
        );

        const categories = parseCategories(categoriesHtml);
        for (let i = 0; i < categories.length; i++) {
            console.log(
                `${i + 1}. ${categories[i].label} (${categories[i].id})`,
            );

            const categoryUrl = buildCategoryListUrl(categories[i].id, 2);
            const categoryHtml = await fetch(categoryUrl);
            const items = parseAlbumList(categoryHtml);
            console.log(`  找到 ${items.length} 個套圖`);
            items.forEach((item, idx) => {
                console.log(`  ${idx + 1}. ${item.title} (${item.id}`);
            });
        }

        console.log(`找到 ${categories.length} 個分類`);
        if (categories.length === 0) {
            console.error("❌ parseCategories selector 失敗！");
        }

        console.log("\n=== 測試列表頁 ===");
        const listHtml = await fetch(buildListUrl(1));
        console.log("列表 HTML 大小:", listHtml.length, "bytes");

        const $list = cheerio.load(listHtml);
        console.log("列表 ul.list:", $list("ul.list").length);
        console.log("列表 ul.picpos_6_1:", $list("ul.picpos_6_1").length);

        const items = parseAlbumList(listHtml);
        console.log(`找到 ${items.length} 個套圖`);
        if (items.length === 0) {
            console.error("❌ parseAlbumList selector 失敗！");
            console.log("可能 selector:", $list("ul li a").length, "個連結");
        }

        // ★ 修正：檢查 items 是否有內容才抓詳情頁
        if (items.length > 0) {
            console.log("\n=== 測試詳情頁 ===");
            const detailHtml = await fetch(buildDetailUrl(items[0].id));
            const detail = parseAlbumDetail(detailHtml);
            console.log(`標題: "${detail.title}"`);
            console.log(`圖片數: ${detail.images.length}`);
            console.log(`總頁數: ${detail.totalPages}`);
        } else {
            console.log("跳過詳情頁測試 (無列表項目)");
        }
    } catch (error) {
        console.error("測試失敗:", error);
    }
}

main().catch(console.error);
