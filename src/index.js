import { feed, activity } from "./config.js";
import { fetch_posts } from "./updaters/fetch_posts.js";
import { fetch_activities } from "./updaters/fetch_activities.js";
import { writeFileSync, readFileSync } from "fs";
import "dotenv/config";

const readme = readFileSync("./README.md", "utf8");

const posts = await fetch_posts(feed.link);
const activity_l = await fetch_activities(activity.git_username);

const readme_posts = `${readme.substring(0, readme.indexOf(feed.open) + feed.open.length)}\n${posts}\n${readme.substring(readme.indexOf(feed.close))}`;
const readme_activity = `${readme_posts.substring(0, readme_posts.indexOf(activity.open) + activity.open.length)}\n${activity_l.join("<br>")}\n${readme_posts.substring(readme_posts.indexOf(activity.close))}`;

writeFileSync("./README.md", readme_activity.trim());
