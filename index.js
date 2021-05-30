const fs = require('fs');
const fetch = require('node-fetch');
const parser = require("xml2json");
const path = require('path');

const date = new Date()
const open = `<!-- FEED-START -->`;
const close = `<!-- FEED-END -->`;
const untilstart = `<!-- UNTIL-START -->`
const untilend = `<!-- UNTIL-END -->`
try {
const fetchArticles = async () => {
 const articles = await fetch("https://igorkowalczyk.github.io/blog/feeds/feed.xml");
 const articlesText = await articles.text();
 const articlesJSON = parser.toJson(articlesText);
 const newC = JSON.parse(articlesJSON).rss.channel.item.slice(0, 5);
 return newC.map(({ title, link }) => `- [${title}](${link})`).join("\n");
};

const fetchData = async () => {
 const user = await fetch('https://api.github.com/users/igorkowalczyk').then(res => res.json())
 const name = user.name;
 const age = user.created_at;
 return `${name} ${age}
 <i>Last updated on ${date.getDate()}${date.getDate()===1?"st":date.getDate()===2?"nd":date.getDate()===3?"rd":"th"} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()]} ${date.getFullYear()} using Github Actions</i>
 `
};

(async () => {
 const readme = fs.readFileSync("./README.md", "utf8");
 const indexBefore = readme.indexOf(open) + open.length;
 const indexAfter = readme.indexOf(close);
 const readmeContentChunkBreakBefore = readme.substring(0, indexBefore);
 const readmeContentChunkBreakAfter = readme.substring(indexAfter);

 const indexBefore2 = readme.indexOf(untilstart) + untilstart.length;
 const indexAfter2 = readme.indexOf(untilend);
 const readmeContentChunkBreakBefore2 = readme.substring(0, indexBefore2);
 const readmeContentChunkBreakAfter2 = readme.substring(indexAfter2);

 const posts = await fetchArticles();
 const until = await fetchData();
 const readmeNew = `
 ${readmeContentChunkBreakBefore}
 ${posts}
 ${readmeContentChunkBreakAfter}

 ${readmeContentChunkBreakBefore2}
 ${until}
 ${readmeContentChunkBreakAfter2}
 `;

 fs.writeFileSync("./README.md", readmeNew.trim());
})()

} catch (err) {
 console.error(err);
}
