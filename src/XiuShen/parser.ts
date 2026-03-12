import { HomeSection, TagSection } from "@paperback/types";
import * as cheerio from "cheerio";

export interface AlbumItem {
    id: string;
    title: string;
    cover: string;
}

export interface AlbumDetail {
    title: string;
    cover: string;
    author: string;
    tags: string[];
    images: string[];
    totalPages: number;
}

const BASE_URL = "https://m.xsnvshen.com";

function fixUrl(url: string): string {
    if (!url) return "";
    if (url.startsWith("//")) return "https:" + url;
    return url;
}

// ★ 純解析：回傳分類樹狀結構
export interface CategoryTree {
    name: string; // "着装", "风格"
    id: string; // "picl_1", "picl_2"
    smallCategories: Array<{ id: string; label: string }>;
}

export function parseCategoryTree(html: string): CategoryTree[] {
    const $ = cheerio.load(html);
    const bigCategories: CategoryTree[] = [];

    // 解析大分類 tab
    $(".Lnavlists .sort-nav-item").each((index, tabElem) => {
        const name = $(tabElem).attr("title") || $(tabElem).text().trim();
        const id = $(tabElem).attr("tab");

        console.log(`大分類 [${id}]: ${name}`);
        if (!name || !id) return;

        const smallCategories: Array<{ id: string; label: string }> = [];

        // 對應的小分類
        $(`#${id} .sort-item-box-inner a[href^='/album/']`).each((_, aElem) => {
            const href = $(aElem).attr("href") || "";
            const label =
                $(aElem).find(".spimgtit").text().trim() ||
                $(aElem).attr("title") ||
                $(aElem).text().trim();

            const match = href.match(/\/album\/([^\/]+)\/?$/);
            if (match && match[1] && label) {
                smallCategories.push({ id: match[1], label });
                console.log(
                    `  小分類 ${smallCategories.length}: ${label} (${match[1]})`,
                );
            }
        });

        bigCategories.push({ name, id, smallCategories });
    });

    console.log(
        `總共 ${bigCategories.length} 個大分類，${bigCategories.reduce((sum, c) => sum + c.smallCategories.length, 0)} 個小分類`,
    );
    return bigCategories;
}

// 解析分類
export function parseCategories(
    html: string,
): Array<{ id: string; label: string }> {
    const $ = cheerio.load(html);
    const categories: Array<{ id: string; label: string }> = [];

    // ★ 新手機版 selector：.Lnavlists .sort-item-box a
    // 直接抓所有 <a href='/album/tXXX/'> 標籤
    $(".Lnavlists a[href^='/album/']:not([href='/album/'])").each(
        (_, aElem) => {
            const href = $(aElem).attr("href") || "";
            const label =
                $(aElem).find(".spimgtit").text().trim() ||
                $(aElem).text().trim();
            // 提取 ID：/album/t167/ → t167
            const match = href.match(/\/album\/([^\/]+)\/?$/);
            if (match && match[1] && label) {
                categories.push({
                    id: match[1],
                    label: label,
                });
            }
        },
    );

    console.log(`手機版 parseCategories: 找到 ${categories.length} 個分類`);
    return categories;
}

//解析標籤
export function parseTags(html: string): TagSection[] {
    const $ = cheerio.load(html);
    const tagSections: TagSection[] = [];

    // ★ 精準定位：只抓取 id="m_album" (套圖分類) 裡面的 dl 標籤
    $("#m_album .navigation-down-inner dl").each((index, dlElem) => {
        // 抓取分類標題 (例如 "着装", "机构" 等)
        const sectionTitle =
            $(dlElem).find("dt").text().trim() || `分類 ${index + 1}`;

        const tags: any[] = [];

        // 抓取該分類下的所有連結
        $(dlElem)
            .find("dd a")
            .each((_, aElem) => {
                const href = $(aElem).attr("href"); // 例如: "/album/t175/"
                const tagName = $(aElem).text().trim(); // 例如: "内衣"

                if (href && tagName) {
                    // 從 href 中提取標籤的 ID。 "/album/t175/" -> "t175"
                    const match = href.match(/\/album\/([^\/]+)\//);
                    const tagId = match ? match[1] : href;

                    tags.push(
                        App.createTag({
                            id: tagId,
                            label: tagName,
                        }),
                    );
                }
            });

        // 只有當該分類底下有標籤時，才加入到清單中
        if (tags.length > 0) {
            tagSections.push(
                App.createTagSection({
                    id: `album_category_${index}`,
                    label: sectionTitle,
                    tags: tags,
                }),
            );
        }
    });

    return tagSections;
}

// 解析列表頁
export function parseAlbumList(html: string): AlbumItem[] {
    const $ = cheerio.load(html);
    const items: AlbumItem[] = [];

    $("ul.list li").each((_: number, el: cheerio.Element) => {
        const $el = $(el);
        const link = $el.find("a").attr("href") || "";
        const idMatch = link.match(/\/album\/(\d+)/);
        const id = idMatch ? idMatch[1] : "";
        const title = $el.find(".txtbts3").text().trim();
        const cover = fixUrl($el.find("img").attr("src") || "");

        if (id && title) {
            items.push({ id, title, cover });
        }
    });

    return items;
}

// 解析套圖詳情頁
export function parseAlbumDetail(html: string): AlbumDetail {
    const $ = cheerio.load(html);

    // 標題：優先 h1，fallback 到第一張圖的 alt
    const title =
        $("h1").first().text().trim() || $("p img").first().attr("alt") || "";

    // 封面：第一張內容圖
    const cover = fixUrl($("p img").first().attr("src") || "");

    // 作者
    const author =
        $(".model-name, .girl-name, .author").first().text().trim() ||
        "Unknown";

    // 標籤
    const tags: string[] = [];
    $(".tags a, .tag-list a, .label a").each(
        (_: number, el: cheerio.Element) => {
            const t = $(el).text().trim();
            if (t) tags.push(t);
        },
    );

    // 圖片：詳情頁的內容圖在 <p><img class='lazy'></p>
    // thumb_600x900 是內容圖，thumb_205x308 是推薦縮圖，只取內容圖
    const images: string[] = [];
    $("p img").each((_: number, el: cheerio.Element) => {
        const src = fixUrl($(el).attr("src") || $(el).attr("data-src") || "");
        if (src && src.includes("thumb_600x900")) {
            images.push(src);
        }
    });

    // 解析總頁數
    let totalPages = 1;
    // 定位到 <div id="pageNum"> 下的 <span class="pg_current"> 裡的 <b>
    const pageText = $("#pageNum .pg_current b").text();

    if (pageText) {
        // pageText 可能會長得像 '1"/6"' 或是 '1 /6'
        // 使用 Regex 抓取斜線 '/' 後面的連續數字
        const match = pageText.match(/\/(\d+)/);
        if (match && match[1]) {
            const parsedPage = parseInt(match[1], 10);
            if (!isNaN(parsedPage)) {
                totalPages = parsedPage;
            }
        }
    }

    return { title, cover, author, tags, images, totalPages };
}

export function buildListUrl(page: number): string {
    return `${BASE_URL}/album/hd/?p=${page}`;
}

export function buildDetailUrl(id: string): string {
    return `${BASE_URL}/album/${id}/`;
}
