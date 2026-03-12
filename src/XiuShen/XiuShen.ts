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
    parseTags,
    parseAlbumList,
    parseAlbumDetail,
    buildListUrl,
    buildDetailUrl,
} from "./parser";

const BASE_URL = "https://www.xsnvshen.com";
const USER_AGENT =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";

export const XiuShenInfo: SourceInfo = {
    version: "1.0.5",
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
                const isImage =
                    request.url.includes("img.xsnvshen.com") ||
                    request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                // ★ 動態產生 Referer
                let dynamicReferer = BASE_URL + "/";
                if (isImage) {
                    // 圖片網址範例: https://img.xsnvshen.com/thumb_600x900/album/0/45581/000.jpg
                    // 用 Regex 抓取倒數第二個資料夾的數字 (也就是 45581)
                    const match =
                        request.url.match(/album\/\d+\/(\d+)\//i) ||
                        request.url.match(/album\/(\d+)\//i);
                    if (match && match[1]) {
                        // 組裝出手機版的 Referer
                        dynamicReferer = `https://m.xsnvshen.com/album/${match[1]}`;
                    }
                }

                request.headers = {
                    ...(request.headers ?? {}),
                    "User-Agent": USER_AGENT,
                    "Accept-Language": "zh-TW,zh-Hant;q=0.9",
                    Referer: dynamicReferer, // ★ 使用動態 Referer
                    "Sec-Fetch-Dest": isImage ? "image" : "document",
                    "Sec-Fetch-Mode": isImage ? "no-cors" : "navigate",
                    "Sec-Fetch-Site": isImage ? "same-site" : "same-origin",
                };

                // 刪除手動指定的 Connection，交給 iOS 底層網路庫自動處理
                delete request.headers["Connection"];

                // 根據請求類型給予 100% 符合 Safari 特徵的 Accept 標頭
                if (isImage) {
                    request.headers["Accept"] =
                        "image/webp,image/avif,image/jxl,image/heic,image/heic-sequence,video/*;q=0.8,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5";
                } else {
                    request.headers["Accept"] =
                        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
                }

                console.log(
                    `${TAG} → ${request.method} ${request.url} | 動態 Referer: ${dynamicReferer}`,
                );
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
    // 取得分類
    // ──────────────────────────────────────────────
    async getSearchTags(): Promise<TagSection[]> {
        console.log(`${TAG} getSearchTags: start`);
        try {
            const request: Request = App.createRequest({
                url: BASE_URL, // 直接打首頁，因為 <div id="m_album"> 是在全站共用的導覽列中
                method: "GET",
            });
            const response = await this.requestManager.schedule(request, 1);
            const tags = parseTags(response.data);
            return tags;
        } catch (e) {
            console.error(`${TAG} getSearchTags: ERROR`, e);
            return [];
        }
    }

    // ──────────────────────────────────────────────
    // 搜尋與分類瀏覽
    // ──────────────────────────────────────────────
    async getSearchResults(
        query: SearchRequest,
        metadata: unknown,
    ): Promise<PagedResults> {
        const page = ((metadata as any)?.page ?? 1) as number;
        console.log(`${TAG} getSearchResults: page=${page}`);

        try {
            let url: string;

            // 1. 處理分類標籤搜尋 (例如點擊了 "t175")
            if (query.includedTags && query.includedTags.length > 0) {
                const tagId = query.includedTags[0].id; // 取得 "t175"
                console.log(`${TAG} 正在瀏覽分類: ${tagId}`);

                // 組裝分類頁面的 URL。第一頁通常沒有 ?p=，第二頁開始有
                if (page === 1) {
                    url = `${BASE_URL}/album/${tagId}/`;
                } else {
                    url = `${BASE_URL}/album/${tagId}/?p=${page}`; // 或是 /album/${tagId}/${page}.html 視該網站實際的翻頁規則而定
                }
            }
            // 2. 處理關鍵字搜尋
            else if (query.title) {
                console.log(`${TAG} 正在搜尋關鍵字: ${query.title}`);
                url = `${BASE_URL}/search/?k=${encodeURIComponent(query.title)}&p=${page}`;
            }
            // 3. 預設列表 (Fallback)
            else {
                url = buildListUrl(page);
            }

            const request: Request = App.createRequest({ url, method: "GET" });
            const response = await this.requestManager.schedule(request, 1);

            // ★ 你提供的 HTML 結構 (<ul class="picpos_6_1..."><li class="min-h-imgall_300">)
            // 看起來跟你原本首頁的結構是一樣的，所以可以直接共用 parseAlbumList！
            const items = parseAlbumList(response.data);
            console.log(
                `${TAG} getSearchResults: parsed ${items.length} items from URL: ${url}`,
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
    // ──────────────────────────────────────────────
    // 章節圖片 (支援多頁合併)
    // ──────────────────────────────────────────────
    async getChapterDetails(
        mangaId: string,
        chapterId: string,
    ): Promise<ChapterDetails> {
        console.log(
            `${TAG} getChapterDetails: mangaId=${mangaId} chapterId=${chapterId}`,
        );

        try {
            // 1. 先請求第一頁
            const firstPageRequest: Request = App.createRequest({
                url: buildDetailUrl(mangaId), // 預設第一頁
                method: "GET",
            });
            const firstPageResponse = await this.requestManager.schedule(
                firstPageRequest,
                1,
            );
            const firstPageDetail = parseAlbumDetail(firstPageResponse.data);

            // 存放所有收集到的圖片
            let allImages: string[] = [...firstPageDetail.images];
            const totalPages = firstPageDetail.totalPages;

            console.log(
                `${TAG} 第 1 頁抓到 ${firstPageDetail.images.length} 張圖，總頁數: ${totalPages}`,
            );

            // 2. 如果總頁數 > 1，發起並發請求抓取剩餘頁面
            if (totalPages > 1) {
                const pageRequests: Promise<any>[] = [];

                // 從第 2 頁開始 loop 到最後一頁
                for (let i = 2; i <= totalPages; i++) {
                    const pageUrl = `${BASE_URL}/album/${mangaId}?p=${i}`; // 根據該站分頁邏輯組裝

                    const request = App.createRequest({
                        url: pageUrl,
                        method: "GET",
                    });

                    // 將 Promise 推入陣列
                    pageRequests.push(
                        this.requestManager
                            .schedule(request, 1)
                            .then((response) => {
                                const detail = parseAlbumDetail(response.data);
                                return detail.images;
                            })
                            .catch((err) => {
                                console.error(
                                    `${TAG} 抓取第 ${i} 頁失敗:`,
                                    err,
                                );
                                return []; // 失敗回傳空陣列，避免整個流程 crash
                            }),
                    );
                }

                // 並發執行所有請求，加快速度
                const remainingPagesImages = await Promise.all(pageRequests);

                // 將所有陣列攤平合併進 allImages
                remainingPagesImages.forEach((imagesArray) => {
                    allImages = allImages.concat(imagesArray);
                });
            }

            console.log(`${TAG} 最終成功抓取總計 ${allImages.length} 張圖片`);

            if (allImages.length === 0) {
                console.warn(
                    `${TAG} getChapterDetails: 0 pages — 圖片將無法顯示`,
                );
            }

            return App.createChapterDetails({
                id: chapterId,
                mangaId,
                pages: allImages, // 回傳合併後的所有圖片
            });
        } catch (e) {
            console.error(`${TAG} getChapterDetails: ERROR`, e);
            throw e;
        }
    }

    // ──────────────────────────────────────────────
    // Cloudflare Bypass（讓 app 先取得 cookie）
    // ──────────────────────────────────────────────
    async getCloudflareBypassRequestAsync(): Promise<Request> {
        console.log(
            `${TAG} getCloudflareBypassRequestAsync: 針對圖床取得 CF cookie`,
        );
        return App.createRequest({
            url: "https://img.xsnvshen.com/thumb_600x900/album/0/45581/000.jpg",
            method: "GET",
            headers: {
                "User-Agent": USER_AGENT,
            },
        });
    }
}
