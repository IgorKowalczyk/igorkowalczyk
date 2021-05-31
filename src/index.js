const fs = require("fs");
const fetch = require("node-fetch");
const parser = require("xml2json");
const moment = require("moment");
const date = new Date();
const feed_open = `<!-- FEED-START -->`;
const feed_close = `<!-- FEED-END -->`;
const stats_open = `<!-- STAT-START -->`;
const stats_close = `<!-- STAT-END -->`;

try {
 const fetchArticles = async () => {
  const articles = await fetch("https://igorkowalczyk.github.io/blog/feeds/feed.xml");
  const articlesText = await articles.text();
  const articlesJSON = parser.toJson(articlesText);
  const newC = JSON.parse(articlesJSON).rss.channel.item.slice(0, 5);
  return newC.map(({ title, link, pubDate }) => `- [${title}](${link}) [${moment(pubDate).format("D MMM YYYY")}]`).join("\n") + `\n<!-- Posts last updated on ${date.toString()} -->`;
 };
 const fetchGithub = async () => {
  const user = await fetch('https://api.github.com/users/igorkowalczyk').then(res => res.json())
  return `
  - 📚 Total Repositories: **${user.public_repos}**
  - 📖 Total Gists: **${user.public_gists}**
  <!-- Stats last updated on ${date.toString()} -->`
 };
 /*
   return `
  - ⭐ Total Stars: **${allstars}**
  - 🕚 Total Commits: **9483**
  - 📚 Total Repositories: **${user.public_repos}**
  - 📖 Total Gists: **${user.public_gists}**
  - 🚀 Total PRs: **9**
  - ❗Total Issues: **4**
  - 📝 Contributed to: **4**
  <!-- Posts last updated on ${date.toString()} -->`
 };
 */
 (async () => {
  const readme = fs.readFileSync("./README.md", "utf8");
  const feed_before = readme.indexOf(feed_open) + feed_open.length;
  const feed_after = readme.indexOf(feed_close);
  const feed_before_final = readme.substring(0, feed_before);
  const feed_after_final = readme.substring(feed_after);
  const posts = await fetchArticles();
  const readme_feed = `
   ${feed_before_final}
   ${posts}
   ${feed_after_final}
  `;
  const stats_before = readme_feed.indexOf(stats_open) + stats_open.length;
  const stats_after = readme_feed.indexOf(stats_close);
  const stats_before_final = readme_feed.substring(0, stats_before);
  const stats_after_final = readme_feed.substring(stats_after);
  const stats = await fetchGithub();
  const readme_final = `
  ${stats_before_final}
  ${stats}
  ${stats_after_final}
 `;
 fs.writeFileSync("./README.md", readme_final.trim());
 })();
} catch (err) {
 return console.error(err);
}
