const config = require("./config");
const posts = require("./updater/blog/index");
const activity = require("./updater/github-activity/index");
const { writeFileSync, readFileSync } = require("fs");

(async () => {
 const readme = readFileSync("./README.md", "utf8");
 const post_list = await posts(config.feed.link, config.feed.max_lines);
 const activity_list = await activity(config.user, config.activity.max_lines);
 const readme_posts = `${readme.substring(0, readme.indexOf(config.feed.open) + config.feed.open.length)}\n${post_list}\n${readme.substring(readme.indexOf(config.feed.close))}`;
 const readme_activity = `${readme_posts.substring(0, readme_posts.indexOf(config.activity.open) + config.activity.open.length)}\n${activity_list.join("<br>")}\n${readme_posts.substring(readme_posts.indexOf(config.activity.close))}`;
 writeFileSync("./README.md", readme_activity.trim());
})();
