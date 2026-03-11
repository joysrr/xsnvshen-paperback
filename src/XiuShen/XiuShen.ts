import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    ContentRating,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionType,
    MangaProviding,
    PagedResults,
    Request,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SourceIntents,
    SourceManga,
    TagSection,
} from "@paperback/types";

import {
    parseAlbumList,
    parseAlbumDetail,
    buildListUrl,
    buildDetailUrl,
} from "./parser";

const BASE_URL = "https://m.xsnvshen.com";

export const XiuShenInfo = {
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
        SourceIntents.CHAPTER_PROVIDING |
        SourceIntents.DISCOVER_SECIONS_PROVIDING,
};

export class XiuShen
    implements MangaProviding, ChapterProviding, SearchResultsProviding
{
    globalRateLimiter = new BasicRateLimiter("ratelimiter", {
        numberOfRequests: 2,
        bufferInterval: 1,
        ignoreImages: true,
    });

    async initialise(): Promise<void> {
        // 可留空
    }

    // ──────────────────────────────────────────────
    // 首頁
    // ──────────────────────────────────────────────
    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "latest",
                title: "最新套圖",
                type: DiscoverSectionType.simpleCarousel,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: { page?: number } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        const request: Request = {
            url: buildListUrl(page),
            method: "GET",
        };
        const [, data] = await Application.scheduleRequest(request);
        const items = parseAlbumList(Application.arrayBufferToUTF8String(data));

        return {
            items: items.map(
                (item) =>
                    ({
                        type: "simpleCarouselItem",
                        mangaId: item.id,
                        imageUrl: item.cover,
                        title: item.title,
                    }) as DiscoverSectionItem,
            ),
            metadata: items.length > 0 ? { page: page + 1 } : undefined,
        };
    }

    // ──────────────────────────────────────────────
    // 搜尋
    // ──────────────────────────────────────────────
    async getSearchResults(
        query: SearchQuery,
        metadata: { page?: number } | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;
        const keyword = query.title ?? "";

        const url = keyword
            ? `${BASE_URL}/search/?k=${encodeURIComponent(keyword)}&p=${page}`
            : buildListUrl(page);

        const request: Request = { url, method: "GET" };
        const [, data] = await Application.scheduleRequest(request);
        const items = parseAlbumList(Application.arrayBufferToUTF8String(data));

        return {
            items: items.map(
                (item) =>
                    ({
                        mangaId: item.id,
                        imageUrl: item.cover,
                        title: item.title,
                    }) as SearchResultItem,
            ),
            metadata: items.length > 0 ? { page: page + 1 } : undefined,
        };
    }

    // ──────────────────────────────────────────────
    // 套圖詳情
    // ──────────────────────────────────────────────
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request: Request = {
            url: buildDetailUrl(mangaId),
            method: "GET",
        };
        const [, data] = await Application.scheduleRequest(request);
        const detail = parseAlbumDetail(
            Application.arrayBufferToUTF8String(data),
        );

        return {
            mangaId,
            mangaInfo: {
                thumbnailUrl: detail.cover,
                primaryTitle: detail.title,
                secondaryTitles: [],
                synopsis: "",
                contentRating: ContentRating.ADULT,
                author: detail.author,
                status: "Completed",
                tagGroups:
                    detail.tags.length > 0
                        ? [
                              {
                                  id: "tags",
                                  title: "標籤",
                                  tags: detail.tags.map((t: string) => ({
                                      id: t,
                                      title: t,
                                  })),
                              } as TagSection,
                          ]
                        : [],
            },
        };
    }

    // ──────────────────────────────────────────────
    // 章節列表
    // ──────────────────────────────────────────────
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        return [
            {
                chapterId: "all",
                title: "完整套圖",
                sourceManga,
                chapNum: 1,
                langCode: "zh",
            },
        ];
    }

    // ──────────────────────────────────────────────
    // 章節圖片
    // ──────────────────────────────────────────────
    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const request: Request = {
            url: buildDetailUrl(chapter.sourceManga.mangaId),
            method: "GET",
        };
        const [, data] = await Application.scheduleRequest(request);
        const detail = parseAlbumDetail(
            Application.arrayBufferToUTF8String(data),
        );

        return {
            id: chapter.chapterId,
            mangaId: chapter.sourceManga.mangaId,
            pages: detail.images,
        };
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        return [];
    }
}
