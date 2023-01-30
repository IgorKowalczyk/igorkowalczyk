import "dotenv/config";
import { feed, activity, wakatime } from "./config.js";
import { fetchPosts } from "./updaters/fetchPosts.js";
import { fetchActivities } from "./updaters/fetchActivities.js";
import { writeFileSync, readFileSync } from "fs";
import { fetchWakatime } from "./updaters/fetchWakatime.js";

const readme = readFileSync("./README.md", "utf8");

const [posts, activityList, wakatimeList] = await Promise.all([fetchPosts(feed.link), fetchActivities(activity.gitUsername), fetchWakatime(wakatime.apiKey)]);

const readmePosts = `${readme.substring(0, readme.indexOf(feed.open) + feed.open.length)}\n${posts}\n${readme.substring(readme.indexOf(feed.close))}`;
const readmeActivity = `${readmePosts.substring(0, readmePosts.indexOf(activity.open) + activity.open.length)}\n${activityList.join("<br>")}\n${readmePosts.substring(readmePosts.indexOf(activity.close))}`;
const wakatimeActivity = `${readmeActivity.substring(0, readmeActivity.indexOf(wakatime.open) + wakatime.open.length)}\n${wakatimeList}\n${readmeActivity.substring(readmeActivity.indexOf(wakatime.close))}`;
writeFileSync("./README.md", wakatimeActivity.trim());
