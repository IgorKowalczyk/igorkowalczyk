const fs = require("fs");
const fetch = require("node-fetch");
const parser = require("xml2json");
const moment = require("moment");
const date = new Date();
const open = `<!-- FEED-START -->`;
const close = `<!-- FEED-END -->`;
const open2 = `<!-- STAT-START -->`;
const close2 = `<!-- STAT-END -->`;

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
  const stars = await fetch(`https://api.github.com/users/igorkowalczyk/starred`).then(res => res.json())
  stars.forEach(star => {
   Object.entries(star).forEach(([key, value]) => {
    console.log(`${key} ${value}`);
   });
  })
  return `
  - 🕚 Total Commits: **9483**
  - 📚 Total Repositories: **${user.public_repos}**
  - 📖 Total Gists: **${user.public_gists}**
  - 🚀 Total PRs: **9**
  - ❗Total Issues: **4**
  - 📝 Contributed to: **4**
  <!-- Posts last updated on ${date.toString()} -->`
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
  const indexBefore2 = readmeNew.indexOf(open2) + open.length;
  const indexAfter2 = readmeNew.indexOf(close2);
  const readmeContentChunkBreakBefore2 = readmeNew.substring(0, indexBefore2);
  const readmeContentChunkBreakAfter2 = readmeNew.substring(indexAfter2);
  const stats = await fetchGithub();
  const readmeFinal = `
  ${readmeContentChunkBreakBefore2}
  ${stats}
  ${readmeContentChunkBreakAfter2}
 `;
 fs.writeFileSync("./README.md", readmeFinal.trim());
 })();
} catch (err) {
 return console.error(err);
}
