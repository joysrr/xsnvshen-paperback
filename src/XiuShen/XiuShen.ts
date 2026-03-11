import {
    Chapter,
    ChapterDetails,
    HomeSection,
    PagedResults,
    Request,
    RequestManager,
    SearchRequest,
    Source,
    SourceInfo,
    SourceIntents,
    SourceManga,
    ContentRating,
    TagSection,
} from "@paperback/types";

import {
    parseAlbumList,
    parseAlbumDetail,
    buildListUrl,
    buildDetailUrl,
} from "./parser";

const BASE_URL = "https://m.xsnvshen.com";

export const XiuShenInfo: SourceInfo = {
    version: "1.0.0",
    name: "XiuShen",
    icon: "icon.png",
    author: "LuLuLaLaHaHa",
    authorWebsite: "https://github.com/joysrr",
    description: "秀色女神寫真套圖來源",
    contentRating: ContentRating.ADULT,
    websiteBaseURL: BASE_URL,
    language: "zh",
    intents:
        SourceIntents.MANGA_CHAPTERS |
        SourceIntents.HOMEPAGE_SECTIONS |
        SourceIntents.CLOUDFLARE_BYPASS_REQUIRED,
};

const TAG = "[XiuShen]";

export class XiuShen extends Source {
    // ──────────────────────────────────────────────
    // RequestManager
    // ──────────────────────────────────────────────
    readonly requestManager: RequestManager = App.createRequestManager({
        requestsPerSecond: 2,
        requestTimeout: 15000,
        interceptor: {
            interceptRequest: async (request) => {
                // 加入完整瀏覽器 headers，模擬手機 Safari
                request.headers = {
                    ...request.headers,
                    "User-Agent":
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) " +
                        "AppleWebKit/605.1.15 (KHTML, like Gecko) " +
                        "Version/16.0 Mobile/15E148 Safari/604.1",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "zh-TW,zh;q=0.9",
                    Referer: BASE_URL + "/",
                    Connection: "keep-alive",
                };
                console.log(`${TAG} → ${request.method} ${request.url}`);
                return request;
            },
            interceptResponse: async (response) => {
                console.log(
                    `${TAG} ← HTTP ${response.status} ` +
                        `${response.request.url} ` +
                        `(${(response.data ?? "").length} bytes)`,
                );
                // 偵測是否被重導向到登入頁或錯誤頁
                if (response.status !== 200) {
                    console.error(
                        `${TAG} 非 200 狀態碼！data preview: ${(response.data ?? "").substring(0, 300)}`,
                    );
                }
                return response;
            },
        },
    });

    // ──────────────────────────────────────────────
    // 首頁
    // ──────────────────────────────────────────────
    async getHomePageSections(
        sectionCallback: (section: HomeSection) => void,
    ): Promise<void> {
        console.log(`${TAG} getHomePageSections: start`);

        // 先送出空 section（顯示 loading 狀態）
        const section = App.createHomeSection({
            id: "latest",
            title: "最新套圖",
            type: "singleRowNormal",
            containsMoreItems: true,
        });
        sectionCallback(section);

        try {
            const request: Request = App.createRequest({
                url: buildListUrl(1),
                method: "GET",
            });

            const response = await this.requestManager.schedule(request, 1);

            if (!response.data) {
                console.error(
                    `${TAG} getHomePageSections: response.data is empty`,
                );
                return;
            }

            const items = parseAlbumList(response.data);
            console.log(
                `${TAG} getHomePageSections: parsed ${items.length} items`,
            );

            if (items.length === 0) {
                console.warn(
                    `${TAG} getHomePageSections: 0 items — selector 可能沒 match，檢查 parseAlbumList`,
                );
                // 印出前 500 字方便 debug
                console.log(
                    `${TAG} html preview: ${response.data.substring(0, 500)}`,
                );
                return;
            }

            section.items = items.map((item) =>
                App.createPartialSourceManga({
                    mangaId: item.id,
                    image: item.cover,
                    title: item.title,
                }),
            );

            sectionCallback(section);
            console.log(`${TAG} getHomePageSections: done`);
        } catch (e) {
            console.error(`${TAG} getHomePageSections: ERROR`, e);
        }
    }

    // ──────────────────────────────────────────────
    // 載入更多
    // ──────────────────────────────────────────────
    async getViewMoreItems(
        homepageSectionId: string,
        metadata: any,
    ): Promise<PagedResults> {
        const page = (metadata?.page ?? 1) as number;
        console.log(
            `${TAG} getViewMoreItems: section=${homepageSectionId} page=${page}`,
        );

        try {
            const request: Request = App.createRequest({
                url: buildListUrl(page),
                method: "GET",
            });

            const response = await this.requestManager.schedule(request, 1);
            const items = parseAlbumList(response.data);
            console.log(
                `${TAG} getViewMoreItems: parsed ${items.length} items (page ${page})`,
            );

            return App.createPagedResults({
                results: items.map((item) =>
                    App.createPartialSourceManga({
                        mangaId: item.id,
                        image: item.cover,
                        title: item.title,
                    }),
                ),
                metadata: items.length > 0 ? { page: page + 1 } : undefined,
            });
        } catch (e) {
            console.error(`${TAG} getViewMoreItems: ERROR`, e);
            return App.createPagedResults({ results: [] });
        }
    }

    // ──────────────────────────────────────────────
    // 搜尋
    // ──────────────────────────────────────────────
    async getSearchResults(
        query: SearchRequest,
        metadata: unknown,
    ): Promise<PagedResults> {
        const page = ((metadata as any)?.page ?? 1) as number;
        const keyword = query.title ?? "";
        console.log(
            `${TAG} getSearchResults: keyword="${keyword}" page=${page}`,
        );

        try {
            const url = keyword
                ? `${BASE_URL}/search/?k=${encodeURIComponent(keyword)}&p=${page}`
                : buildListUrl(page);

            const request: Request = App.createRequest({ url, method: "GET" });
            const response = await this.requestManager.schedule(request, 1);
            const items = parseAlbumList(response.data);
            console.log(
                `${TAG} getSearchResults: parsed ${items.length} items`,
            );

            return App.createPagedResults({
                results: items.map((item) =>
                    App.createPartialSourceManga({
                        mangaId: item.id,
                        image: item.cover,
                        title: item.title,
                    }),
                ),
                metadata: items.length > 0 ? { page: page + 1 } : undefined,
            });
        } catch (e) {
            console.error(`${TAG} getSearchResults: ERROR`, e);
            return App.createPagedResults({ results: [] });
        }
    }

    // ──────────────────────────────────────────────
    // 套圖詳情
    // ──────────────────────────────────────────────
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        console.log(`${TAG} getMangaDetails: mangaId=${mangaId}`);

        try {
            const request: Request = App.createRequest({
                url: buildDetailUrl(mangaId),
                method: "GET",
            });
            const response = await this.requestManager.schedule(request, 1);
            const detail = parseAlbumDetail(response.data);

            console.log(
                `${TAG} getMangaDetails: title="${detail.title}" author="${detail.author}" tags=${detail.tags.length} images=${detail.images.length}`,
            );

            if (detail.images.length === 0) {
                console.warn(
                    `${TAG} getMangaDetails: 0 images — 檢查 parseAlbumDetail selector`,
                );
                console.log(
                    `${TAG} html preview: ${response.data.substring(0, 500)}`,
                );
            }

            const tagGroups: TagSection[] =
                detail.tags.length > 0
                    ? [
                          App.createTagSection({
                              id: "tags",
                              label: "標籤",
                              tags: detail.tags.map((t: string) =>
                                  App.createTag({ id: t, label: t }),
                              ),
                          }),
                      ]
                    : [];

            return App.createSourceManga({
                id: mangaId,
                mangaInfo: App.createMangaInfo({
                    image: detail.cover,
                    titles: [detail.title],
                    desc: "",
                    status: "Completed",
                    author: detail.author ?? "",
                    tags: tagGroups,
                }),
            });
        } catch (e) {
            console.error(`${TAG} getMangaDetails: ERROR`, e);
            throw e;
        }
    }

    // ──────────────────────────────────────────────
    // 章節列表
    // ──────────────────────────────────────────────
    async getChapters(mangaId: string): Promise<Chapter[]> {
        console.log(`${TAG} getChapters: mangaId=${mangaId}`);
        return [
            App.createChapter({
                id: "all",
                chapNum: 1,
                name: "完整套圖",
                langCode: "zh",
            }),
        ];
    }

    // ──────────────────────────────────────────────
    // 章節圖片
    // ──────────────────────────────────────────────
    async getChapterDetails(
        mangaId: string,
        chapterId: string,
    ): Promise<ChapterDetails> {
        console.log(
            `${TAG} getChapterDetails: mangaId=${mangaId} chapterId=${chapterId}`,
        );

        try {
            const request: Request = App.createRequest({
                url: buildDetailUrl(mangaId),
                method: "GET",
            });
            const response = await this.requestManager.schedule(request, 1);
            const detail = parseAlbumDetail(response.data);

            console.log(
                `${TAG} getChapterDetails: ${detail.images.length} pages`,
            );

            if (detail.images.length === 0) {
                console.warn(
                    `${TAG} getChapterDetails: 0 pages — 圖片將無法顯示`,
                );
                console.log(
                    `${TAG} html preview: ${response.data.substring(0, 500)}`,
                );
            } else {
                console.log(
                    `${TAG} getChapterDetails: first=${detail.images[0]}`,
                );
                console.log(
                    `${TAG} getChapterDetails: last=${detail.images[detail.images.length - 1]}`,
                );
            }

            return App.createChapterDetails({
                id: chapterId,
                mangaId,
                pages: detail.images,
            });
        } catch (e) {
            console.error(`${TAG} getChapterDetails: ERROR`, e);
            throw e;
        }
    }

    // ──────────────────────────────────────────────
    // Cloudflare Bypass（讓 app 先取得 cookie）
    // ──────────────────────────────────────────────
    override getCloudflareBypassRequest(): Request {
        console.log(
            `${TAG} getCloudflareBypassRequest: 取得 Cloudflare cookie`,
        );
        return App.createRequest({
            url: BASE_URL,
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) " +
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) " +
                    "Version/16.0 Mobile/15E148 Safari/604.1",
                Referer: BASE_URL + "/",
            },
        });
    }
}
