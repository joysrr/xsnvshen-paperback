"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XiuShen = exports.XiuShenInfo = void 0;
const types_1 = require("@paperback/types");
const parser_1 = require("./parser");
const BASE_URL = "https://m.xsnvshen.com";
exports.XiuShenInfo = {
    version: "1.0.0",
    name: "XiuShen",
    icon: "icon.png",
    author: "YourGitHubName",
    authorWebsite: "https://github.com/YourGitHubName",
    description: "秀色女神 - 寫真套圖來源",
    contentRating: types_1.ContentRating.ADULT,
    websiteBaseURL: BASE_URL,
    language: "zh",
};
class XiuShen extends types_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = App.createRequestManager({
            requestsPerSecond: 2,
            requestTimeout: 15000,
        });
    }
    // ──────────────────────────────────────────────
    // 首頁 Section
    // ──────────────────────────────────────────────
    async getHomePageSections(sectionCallback) {
        const section = App.createHomeSection({
            id: "latest",
            title: "最新套圖",
            containsMoreItems: true,
            type: types_1.HomeSectionType.singleRowNormal,
        });
        sectionCallback(section);
        const request = App.createRequest({
            url: (0, parser_1.buildListUrl)(1),
            method: "GET",
        });
        const response = await this.requestManager.schedule(request, 1);
        const items = (0, parser_1.parseAlbumList)(response.data);
        section.items = items.map((item) => this.albumToInfo(item));
        sectionCallback(section);
    }
    // 載入更多（翻頁）
    async getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        const page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
        const request = App.createRequest({
            url: (0, parser_1.buildListUrl)(page),
            method: "GET",
        });
        const response = await this.requestManager.schedule(request, 1);
        const items = (0, parser_1.parseAlbumList)(response.data);
        return App.createPagedResults({
            results: items.map((item) => this.albumToInfo(item)),
            metadata: items.length > 0 ? { page: page + 1 } : undefined,
        });
    }
    // ──────────────────────────────────────────────
    // 搜尋
    // ──────────────────────────────────────────────
    async getSearchResults(query, metadata) {
        var _a, _b;
        const page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
        const keyword = (_b = query.title) !== null && _b !== void 0 ? _b : "";
        const url = keyword
            ? `${BASE_URL}/search/?k=${encodeURIComponent(keyword)}&p=${page}`
            : (0, parser_1.buildListUrl)(page);
        const request = App.createRequest({ url, method: "GET" });
        const response = await this.requestManager.schedule(request, 1);
        const items = (0, parser_1.parseAlbumList)(response.data);
        return App.createPagedResults({
            results: items.map((item) => this.albumToInfo(item)),
            metadata: items.length > 0 ? { page: page + 1 } : undefined,
        });
    }
    // ──────────────────────────────────────────────
    // 套圖詳情
    // ──────────────────────────────────────────────
    async getMangaDetails(mangaId) {
        const request = App.createRequest({
            url: (0, parser_1.buildDetailUrl)(mangaId),
            method: 'GET',
        });
        const response = await this.requestManager.schedule(request, 1);
        const detail = (0, parser_1.parseAlbumDetail)(response.data);
        return App.createMangaInfo({
            titles: [detail.title],
            image: detail.cover,
            author: detail.author,
            desc: '',
            status: 'COMPLETED',
            tags: [
                App.createTagSection({
                    id: 'tags',
                    label: '標籤',
                    tags: detail.tags.map((t) => App.createTag({ id: t, label: t })),
                }),
            ],
        });
    }
    // ──────────────────────────────────────────────
    // 章節列表（每套圖只有 1 個 chapter）
    // ──────────────────────────────────────────────
    async getChapters(mangaId) {
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
    async getChapterDetails(mangaId, chapterId) {
        const request = App.createRequest({
            url: (0, parser_1.buildDetailUrl)(mangaId),
            method: "GET",
        });
        const response = await this.requestManager.schedule(request, 1);
        const detail = (0, parser_1.parseAlbumDetail)(response.data);
        return App.createChapterDetails({
            id: chapterId,
            mangaId,
            pages: detail.images,
        });
    }
    // ──────────────────────────────────────────────
    // 更新檢查
    // ──────────────────────────────────────────────
    async filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) {
        mangaUpdatesFoundCallback(App.createMangaUpdates({ ids: [] }));
    }
    // ──────────────────────────────────────────────
    // 工具函式
    // ──────────────────────────────────────────────
    albumToInfo(item) {
        return App.createMangaInfo({
            titles: [item.title],
            image: item.cover,
            desc: '',
            status: 'COMPLETED',
        });
    }
}
exports.XiuShen = XiuShen;
