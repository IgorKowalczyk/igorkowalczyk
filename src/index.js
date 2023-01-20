import { feed, activity } from "./config.js";
import { fetchPosts } from "./updaters/fetchPosts.js";
import { fetchActivities } from "./updaters/fetchActivities.js";
import { writeFileSync, readFileSync } from "fs";
import "dotenv/config";

const readme = readFileSync("./README.md", "utf8");

const posts = await fetchPosts(feed.link);
const activityList = await fetchActivities(activity.gitUsername);

const readmePosts = `${readme.substring(0, readme.indexOf(feed.open) + feed.open.length)}\n${posts}\n${readme.substring(readme.indexOf(feed.close))}`;
const readmeActivity = `${readmePosts.substring(0, readmePosts.indexOf(activity.open) + activity.open.length)}\n${activityList.join("<br>")}\n${readmePosts.substring(readmePosts.indexOf(activity.close))}`;

writeFileSync("./README.md", readmeActivity.trim());
