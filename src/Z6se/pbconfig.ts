import { ContentRating, SourceIntents } from "@paperback/types";

const info = {
    version: "1.0.0",
    name: "06se",
    icon: "icon.png",
    author: "LuLuLaLaHaHa",
    authorWebsite: "https://github.com/joysrr",
    description: "六色網寫真套圖來源",
    contentRating: ContentRating.ADULT,
    websiteBaseURL: "https://m.xsnvshen.com",
    language: "zh",
    intents:
        SourceIntents.MANGA_CHAPTERS |
        SourceIntents.HOMEPAGE_SECTIONS |
        SourceIntents.CLOUDFLARE_BYPASS_REQUIRED,
};

export default info;
