import {
    Source,
    Chapter,
    ChapterDetails,
    HomeSection,
    SearchRequest,
    PagedResults,
    SourceInfo,
    ContentRating,
    MangaUpdates,
    HomeSectionType,
    RequestManager,
} from "@paperback/types";

import {
    parseAlbumList,
    parseAlbumDetail,
    buildListUrl,
    buildDetailUrl,
    AlbumItem,
} from "./parser";

const BASE_URL = "https://m.xsnvshen.com";

export const XiuShenInfo: SourceInfo = {
    version: "1.0.0",
    name: "XiuShen",
    icon: "icon.png",
    author: "YourGitHubName",
    authorWebsite: "https://github.com/YourGitHubName",
    description: "秀色女神 - 寫真套圖來源",
    contentRating: ContentRating.ADULT,
    websiteBaseURL: BASE_URL,
    language: "zh",
};

export class XiuShen extends Source {
    readonly requestManager: RequestManager = App.createRequestManager({
        requestsPerSecond: 2,
        requestTimeout: 15000,
    });

    // ──────────────────────────────────────────────
    // 首頁 Section
    // ──────────────────────────────────────────────
    async getHomePageSections(
        sectionCallback: (section: HomeSection) => void,
    ): Promise<void> {
        const section = App.createHomeSection({
            id: "latest",
            title: "最新套圖",
            containsMoreItems: true,
            type: HomeSectionType.singleRowNormal,
        });

        sectionCallback(section);

        const request = App.createRequest({
            url: buildListUrl(1),
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1);
        const items = parseAlbumList(response.data);

        section.items = items.map((item) => this.albumToInfo(item));
        sectionCallback(section);
    }

    // 載入更多（翻頁）
    async getViewMoreItems(
        homepageSectionId: string,
        metadata: { page?: number } | undefined,
    ): Promise<PagedResults> {
        const page = metadata?.page ?? 1;

        const request = App.createRequest({
            url: buildListUrl(page),
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1);
        const items = parseAlbumList(response.data);

        return App.createPagedResults({
            results: items.map((item) => this.albumToInfo(item)),
            metadata: items.length > 0 ? { page: page + 1 } : undefined,
        });
    }

    // ──────────────────────────────────────────────
    // 搜尋
    // ──────────────────────────────────────────────
    async getSearchResults(
        query: SearchRequest,
        metadata: { page?: number } | undefined,
    ): Promise<PagedResults> {
        const page = metadata?.page ?? 1;
        const keyword = query.title ?? "";

        const url = keyword
            ? `${BASE_URL}/search/?k=${encodeURIComponent(keyword)}&p=${page}`
            : buildListUrl(page);

        const request = App.createRequest({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const items = parseAlbumList(response.data);

        return App.createPagedResults({
            results: items.map((item) => this.albumToInfo(item)),
            metadata: items.length > 0 ? { page: page + 1 } : undefined,
        });
    }

    // ──────────────────────────────────────────────
    // 套圖詳情
    // ──────────────────────────────────────────────
    async getMangaDetails(mangaId: string): Promise<any> {
        const request = App.createRequest({
            url: buildDetailUrl(mangaId),
            method: 'GET',
        })

        const response = await this.requestManager.schedule(request, 1)
        const detail = parseAlbumDetail(response.data)

        return App.createMangaInfo({
            titles: [detail.title],
            image: detail.cover,
            author: detail.author,
            desc: '',          // 必填，寫真站無簡介
            status: 'COMPLETED',
            tags: [
                App.createTagSection({
                    id: 'tags',
                    label: '標籤',
                    tags: detail.tags.map((t: string) =>
                        App.createTag({ id: t, label: t })
                    ),
                }),
            ],
        })
    }

    // ──────────────────────────────────────────────
    // 章節列表（每套圖只有 1 個 chapter）
    // ──────────────────────────────────────────────
    async getChapters(mangaId: string): Promise<Chapter[]> {
        return [
            App.createChapter({
                id: "all",
                chapNum: 1,
                name: "完整套圖",
                langCode: "🇨🇳",
            }),
        ];
    }

    // ──────────────────────────────────────────────
    // 章節內容（圖片列表）
    // ──────────────────────────────────────────────
    async getChapterDetails(
        mangaId: string,
        chapterId: string,
    ): Promise<ChapterDetails> {
        const request = App.createRequest({
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

    // ──────────────────────────────────────────────
    // 更新檢查
    // ──────────────────────────────────────────────
    async filterUpdatedManga(
        mangaUpdatesFoundCallback: (updates: MangaUpdates) => void,
        time: Date,
        ids: string[],
    ): Promise<void> {
        mangaUpdatesFoundCallback(App.createMangaUpdates({ ids: [] }));
    }

    // ──────────────────────────────────────────────
    // 工具函式
    // ──────────────────────────────────────────────
    private albumToInfo(item: AlbumItem): any {
        return App.createMangaInfo({
            titles: [item.title],
            image: item.cover,
            desc: '',
            status: 'COMPLETED',
        })
    }
}
