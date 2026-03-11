import { ContentRating, SourceIntents } from "@paperback/types";

const info = {
    version: "1.0.0",
    name: "XiuShen",
    icon: "icon.png",
    author: "LuLuLaLaHaHa",
    authorWebsite: "https://github.com/joysrr",
    description: "秀色女神寫真套圖來源",
    contentRating: ContentRating.ADULT,
    websiteBaseURL: "https://m.xsnvshen.com",
    language: "zh",
    intents:
        SourceIntents.CHAPTER_PROVIDING |
        SourceIntents.DISCOVER_SECIONS_PROVIDING,
};

export default info;
