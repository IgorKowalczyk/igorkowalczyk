export const feed = {
 open: "<!-- START_SECTION:feed -->",
 close: "<!-- END_SECTION:feed -->",
 link: "https://igorkowalczyk.dev/feed",
 maxLines: 5,
};

export const activity = {
 open: "<!--START_SECTION:activity-->",
 close: "<!--END_SECTION:activity-->",
 gitUsername: "igorkowalczyk",
 maxLines: 10,
};

export const wakatime = {
 open: "<!--START_SECTION:wakatime-->",
 close: "<!--END_SECTION:wakatime-->",
 apiKey: process.env.WAKATIME_API_KEY,
};
