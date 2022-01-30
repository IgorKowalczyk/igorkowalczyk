const parser = require("xml2json");
const moment = require("moment");
const fetch = require("node-fetch");
module.exports = async function (link) {
 if (!link) throw new Error("You must provide a link to get feed!");
 if (!link.endsWith(".xml")) throw new Error("Link must have an .xml extension!");
 const articles = await fetch(link);
 const articlesText = await articles.text();
 const articlesJSON = parser.toJson(articlesText);
 const newC = JSON.parse(articlesJSON).rss.channel.item.slice(0, 5);
 const posts = newC.map(({ title, link, pubDate }) => `- [${title}](${link}) \`[${moment(pubDate).format("DD/MM/YYYY")}]\``).join("\n") + `\n<!-- Posts last updated on ${new Date().toString()} -->`;
 return await posts;
};
