import { toJson } from "xml2json";
import { feed } from "../config.js";
import fetch from "node-fetch";
import moment from "moment";

export async function fetch_posts(xml) {
 if (!xml) throw new Error("You must provide a link to get feed!");
 if (!xml.endsWith(".xml")) throw new Error("Link must have an .xml extension!");
 let content;
 console.log(`::debug:: Fetching ${xml}`);
 await fetch(xml).then(async (res) => {
  if (!res.headers.get("content-type").includes("xml")) throw new Error("Link must be an xml file!");
  const rss = JSON.parse(toJson(await res.text())).rss.channel.item.slice(0, feed.max_lines || 5);
  console.log(`::debug:: Fetched ${xml}, ${rss.length} posts found`);
  content = rss.map(({ title, link, date }) => `- [${title}](${link}) \`[${moment(date).format("DD/MM/YYYY")}]\``).join("\n") + `\n<!-- Posts last updated on ${new Date().toString()} -->`;
 });
 return content;
}
