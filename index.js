import fs from "fs";
import fetch from "node-fetch";
import parser from "xml2json";

const FEED_URL = "https://igorkowalczyk.github.io/blog/feeds/feed.xml";
const TAG_OPEN = `<!-- FEED-START -->`;
const TAG_CLOSE = `<!-- FEED-END -->`;

const fetchArticles = async () => {
 const articles = await fetch(FEED_URL);
 const articlesText = await articles.text();
 const articlesJSON = parser.toJson(articlesText);
 const newC = JSON.parse(articlesJSON).rss.channel.item.slice(0, 5);
 return newC.map(({ title, link }) => `- [${title}](${link})`).join("\n");
};

async function main() {
 const readme = fs.readFileSync("./README.md", "utf8");
 const indexBefore = readme.indexOf(TAG_OPEN) + TAG_OPEN.length;
 const indexAfter = readme.indexOf(TAG_CLOSE);
 const readmeContentChunkBreakBefore = readme.substring(0, indexBefore);
 const readmeContentChunkBreakAfter = readme.substring(indexAfter);
 const posts = await fetchArticles();
 const readmeNew = `
 ${readmeContentChunkBreakBefore}
 ${posts}
 ${readmeContentChunkBreakAfter}
 `;

 fs.writeFileSync("./README.md", readmeNew.trim());
}

try {
 main();
} catch (err) {
 console.error(err);
}
