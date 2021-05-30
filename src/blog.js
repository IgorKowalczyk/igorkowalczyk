const fs = require("fs");
const fetch = require("node-fetch");
const parser = require("xml2json");

const date = new Date();
const open = `<!-- FEED-START -->`;
const close = `<!-- FEED-END -->`;
try {
 const fetchArticles = async () => {
  const articles = await fetch("https://igorkowalczyk.github.io/blog/feeds/feed.xml");
  const articlesText = await articles.text();
  const articlesJSON = parser.toJson(articlesText);
  const newC = JSON.parse(articlesJSON).rss.channel.item.slice(0, 5);
  return newC.map(({ title, link }) => `- [${title}](${link})`).join("\n") + `\n<!-- Posts updated on ${date.toString()} -->`
  ;
 };

 (async () => {
  const readme = fs.readFileSync("./README.md", "utf8");
  const indexBefore = readme.indexOf(open) + open.length;
  const indexAfter = readme.indexOf(close);
  const readmeContentChunkBreakBefore = readme.substring(0, indexBefore);
  const readmeContentChunkBreakAfter = readme.substring(indexAfter);
  const posts = await fetchArticles();
  const readmeNew = `
   ${readmeContentChunkBreakBefore}
   ${posts}
   ${readmeContentChunkBreakAfter}
  `;
  fs.writeFileSync("./README.md", readmeNew.trim());
 })();
} catch (err) {
 return console.error(err);
}
