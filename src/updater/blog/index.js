const { toJson } = require("xml2json");
const moment = require("moment");
const fetch = require("node-fetch");

module.exports = async (xml, max_lines) => {
 if (!xml) throw new Error("You must provide a link to get feed!");
 if (!xml.endsWith(".xml")) throw new Error("Link must have an .xml extension!");
 console.log(`::debug:: Fetching ${xml}`);
 const request = await fetch(xml);
 if (!request.headers.get("content-type").includes("xml")) throw new Error("Link must be an xml file!");
 const rss = JSON.parse(toJson(await request.text())).rss.channel.item.slice(0, max_lines || 5);
 const posts = rss.map(({ title, link, date }) => `- [${title}](${link}) \`[${moment(date).format("DD/MM/YYYY")}]\``).join("\n") + `\n<!-- Posts last updated on ${new Date().toString()} -->`;
 console.log(`::debug:: Fetched ${xml}, ${rss.length} posts found`);
 return posts;
};
