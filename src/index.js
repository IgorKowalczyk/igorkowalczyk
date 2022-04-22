const config = require("./config");
const posts = require("./updater/blog/index");
const activity = require("./updater/github-activity/index");
const { writeFileSync, readFileSync } = require("fs");

(async () => {
 const readme = readFileSync("./README.md", "utf8");
 const post_list = await posts(config.feed.link, config.feed.max_lines);
 const feed_section_end = readme.split(config.feed.open).join(config.feed.open + "\n" + post_list).split(config.feed.close).join(config.feed.close + "\n");
 const activity_list = await activity(config.user, config.activity.max_lines);
 const activity_section_end = feed_section_end.split(config.activity.open).join(config.activity.open + "\n" + activity_list).split(config.activity.close).join(config.activity.close + "\n");
 writeFileSync("./README.md", activity_section_end);
})();
