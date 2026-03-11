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
}

const BASE_URL = "https://www.xsnvshen.com";

function fixUrl(url: string): string {
    if (!url) return "";
    if (url.startsWith("//")) return "https:" + url;
    return url;
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
        $("h1").first().text().trim() ||
        $("p img.lazy").first().attr("alt") ||
        "";

    // 封面：第一張內容圖
    const cover = fixUrl($("p img.lazy").first().attr("src") || "");

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
    $("p img.lazy").each((_: number, el: cheerio.Element) => {
        const src = fixUrl($(el).attr("src") || $(el).attr("data-src") || "");
        if (src && src.includes("thumb_600x900")) {
            images.push(src);
        }
    });

    return { title, cover, author, tags, images };
}

export function buildListUrl(page: number): string {
    return `${BASE_URL}/album/hd/?p=${page}`;
}

export function buildDetailUrl(id: string): string {
    return `${BASE_URL}/album/${id}/`;
}
