const posts = require("./blog/update");
const activity = require("./github-activity/update");
const fs = require("fs");
const feed_open = `<!-- START_SECTION:feed -->`;
const feed_close = `<!-- END_SECTION:feed -->`;
const activity_start = `<!--START_SECTION:activity-->`;
const activity_end = `<!--END_SECTION:activity-->`;
const readme = fs.readFileSync("./README.md", "utf8");

(async () => {
 const post_list = await posts("https://igorkowalczyk.github.io/blog/feeds/feed.xml");
 const activity_list = await activity("igorkowalczyk");
 async function update_blog() {
  const feed_before = readme.indexOf(feed_open) + feed_open.length;
  const feed_after = readme.indexOf(feed_close);
  if (!feed_before) throw new Error(`${feed_open} tag was not found!`);
  if (!feed_after) throw new Error(`${feed_close} tag was not found!`);
  const feed_before_final = readme.substring(0, feed_before);
  const feed_after_final = readme.substring(feed_after);
  const readme_feed = `
${feed_before_final}
${post_list}
${feed_after_final}
`;
  await fs.writeFileSync("./README.md", readme_feed.trim());
 }
 async function update_activity() {
  const activity_before = readme.indexOf(activity_start) + activity_start.length;
  const activity_after = readme.indexOf(activity_end);
  if (activity_before === -1) throw new Error(`${activity_start} tag was not found!`);
  if (activity_after === -1) throw new Error(`${activity_end} tag was not found!`);
  const activity_before_final = readme.substring(0, activity_before);
  const activity_after_final = readme.substring(activity_after);
  const activity_table = `
 ${activity_before_final}
 ${activity_list.join("<br>")}
 ${activity_after_final}
 `;
  await fs.writeFileSync("./README.md", activity_table.trim());
 }
 update_blog();
 update_activity();
})();
