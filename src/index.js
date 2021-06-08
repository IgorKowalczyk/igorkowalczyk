const fs = require("fs");
const fetch = require("node-fetch");
const parser = require("xml2json");
const moment = require("moment");
const date = new Date();
const feed_open = `<!-- START_SECTION:feed -->`;
const feed_close = `<!-- END_SECTION:feed -->`;

try {
 const fetchArticles = async () => {
  const articles = await fetch("https://igorkowalczyk.github.io/blog/feeds/feed.xml");
  const articlesText = await articles.text();
  const articlesJSON = parser.toJson(articlesText);
  const newC = JSON.parse(articlesJSON).rss.channel.item.slice(0, 5);
  return newC.map(({ title, link, pubDate }) => `- [${title}](${link}) \`[${moment(pubDate).format("DD/MM/YYYY")}]\``).join("\n") + `\n<!-- Posts last updated on ${date.toString()} -->`;
 };
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
  fs.writeFileSync("./README.md", readme_feed.trim());
 })();
} catch (err) {
 return console.error(err);
}
