import {
    Chapter,
    ChapterDetails,
    ChapterProviding,
    HomePageSectionsProviding,
    HomeSection,
    PagedResults,
    Request,
    RequestManager,
    SearchRequest,
    SearchResultsProviding,
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
    intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS,
};

export class XiuShen
    implements
        ChapterProviding,
        HomePageSectionsProviding,
        SearchResultsProviding
{
    // ──────────────────────────────────────────────
    // RequestManagerProviding（必要）
    // ──────────────────────────────────────────────
    readonly requestManager: RequestManager = App.createRequestManager({
        requestsPerSecond: 2,
        requestTimeout: 15000,
        interceptor: {
            interceptRequest: async (request) => request,
            interceptResponse: async (response) => response,
        },
    });

    // ──────────────────────────────────────────────
    // 首頁
    // ──────────────────────────────────────────────
    async getHomePageSections(
        sectionCallback: (section: HomeSection) => void,
    ): Promise<void> {
        const section = App.createHomeSection({
            id: "latest",
            title: "最新套圖",
            type: "singleRowNormal",
            containsMoreItems: true,
        });

        sectionCallback(section);

        const request: Request = App.createRequest({
            url: buildListUrl(1),
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1);
        const items = parseAlbumList(response.data);

        section.items = items.map((item) =>
            App.createPartialSourceManga({
                mangaId: item.id,
                image: item.cover,
                title: item.title,
            }),
        );

        sectionCallback(section);
    }

    async getViewMoreItems(
        homepageSectionId: string,
        metadata: any,
    ): Promise<PagedResults> {
        const page = (metadata?.page ?? 1) as number;
        const request: Request = App.createRequest({
            url: buildListUrl(page),
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1);
        const items = parseAlbumList(response.data);

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

        const url = keyword
            ? `${BASE_URL}/search/?k=${encodeURIComponent(keyword)}&p=${page}`
            : buildListUrl(page);

        const request: Request = App.createRequest({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const items = parseAlbumList(response.data);

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
    }

    // ──────────────────────────────────────────────
    // 套圖詳情
    // ──────────────────────────────────────────────
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request: Request = App.createRequest({
            url: buildDetailUrl(mangaId),
            method: "GET",
        });
        const response = await this.requestManager.schedule(request, 1);
        const detail = parseAlbumDetail(response.data);

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
    }

    // ──────────────────────────────────────────────
    // 章節列表
    // ──────────────────────────────────────────────
    async getChapters(mangaId: string): Promise<Chapter[]> {
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
        const request: Request = App.createRequest({
            url: buildDetailUrl(mangaId),
            method: "GET",
        });
        const response = await this.requestManager.schedule(request, 1);
        const detail = parseAlbumDetail(response.data);

        return App.createChapterDetails({
            id: chapterId,
            mangaId,
            pages: detail.images,
        });
    }
}
