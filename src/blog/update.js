const fs = require("fs");
const parser = require("xml2json");
const moment = require("moment");
const fetch = require("node-fetch")
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
  const posts = await fetchArticles();
  const readme_feed = `
${feed_open}
${posts}
${feed_close}
`;
   console.log(readme_feed)
   return readme_feed;
 })();
} catch (err) {
 return console.error(err);
}
