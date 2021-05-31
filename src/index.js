const fetch = require("node-fetch");
const parser = require("xml2json");
const fs = require("fs");
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
  let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function cdate(str) {
   temp_date = str.split("-");
   return temp_date[2] + " " + months[Number(temp_date[1]) - 1] + " " + temp_date[0];
  }
  const newC = JSON.parse(articlesJSON).rss.channel.item.slice(0, 5);
  return newC.map(({ title, link }) => `- [${title}](${link}) [${cdate(pubDate)}]`).join("\n") + `\n<!-- Posts last updated on ${date.toString()} -->`;
 };
 const fetchGithub = async () => {
  const user = await fetch('https://api.github.com/users/igorkowalczyk').then(res => res.json())
  const name = user.name;
  const age = user.created_at;
  return `${name} ${age}<i>Last updated on ${date.getDate()}${date.getDate()===1?"st":date.getDate()===2?"nd":date.getDate()===3?"rd":"th"} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()]} ${date.getFullYear()} using Github Actions</i>`
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

