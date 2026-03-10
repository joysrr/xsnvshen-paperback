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

const BASE_URL = "https://m.xsnvshen.com";

// 解析列表頁，取得套圖列表
export function parseAlbumList(html: string): AlbumItem[] {
    const $ = cheerio.load(html);
    const items: AlbumItem[] = [];

    $("ul.pic-list li, .album-list li, li.pic-item").each(
        (_: number, el: cheerio.Element) => {
            const $el = $(el);
            const link = $el.find("a").attr("href") || "";
            const idMatch = link.match(/\/album\/(\d+)/);
            const id = idMatch ? idMatch[1] : "";
            const title = $el.find("p, .title, span").first().text().trim();
            const cover =
                $el.find("img").attr("src") ||
                $el.find("img").attr("data-src") ||
                "";

            if (id && title) {
                items.push({ id, title, cover });
            }
        },
    );

    return items;
}

// 解析套圖詳情頁，取得圖片列表
export function parseAlbumDetail(html: string): AlbumDetail {
    const $ = cheerio.load(html);

    const title = $("h1, .album-title, title").first().text().trim();
    const cover = $("img").first().attr("src") || "";
    const author =
        $(".model-name, .author, .girl-name").first().text().trim() ||
        "Unknown";

    const tags: string[] = [];
    $(".tags a, .tag-list a, .label a").each(
        (_: number, el: cheerio.Element) => {
            tags.push($(el).text().trim());
        },
    );

    const images: string[] = [];
    $("ul.pic-list img, .swiper-slide img, .photo-list img, #piclist img").each(
        (_: number, el: cheerio.Element) => {
            const src = $(el).attr("src") || $(el).attr("data-src") || "";
            if (src) images.push(src);
        },
    );

    // fallback：抓所有大圖
    if (images.length === 0) {
        $("img").each((_: number, el: cheerio.Element) => {
            const src = $(el).attr("src") || $(el).attr("data-src") || "";
            if (
                src &&
                src.includes("http") &&
                !src.includes("logo") &&
                !src.includes("icon")
            ) {
                images.push(src);
            }
        });
    }

    return { title, cover, author, tags, images };
}

export function buildListUrl(page: number): string {
    return `${BASE_URL}/album/hd/?p=${page}`;
}

export function buildDetailUrl(id: string): string {
    return `${BASE_URL}/album/${id}/`;
}
