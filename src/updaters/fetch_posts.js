import { feed } from "../config.js";
import { parseString } from "xml2js";
import fetch from "node-fetch";
import { format } from "date-fns";

export async function fetch_posts(xml) {
 if (!xml) throw new Error("You must provide a link to get feed!");
 if (!xml.endsWith(".xml")) throw new Error("Link must have an .xml extension!");
 let content;
 console.log(`::debug:: Fetching ${xml}`);
 await fetch(xml).then(async (res) => {
  if (!res.headers.get("content-type").includes("xml")) throw new Error("Link must be an xml file!");
  const xml_body = await res.text();
  parseString(xml_body, function (err, result) {
   content =
    result.rss.channel[0].item
     .slice(0, feed.max_lines || 5)
     .map(({ title, link, pubDate }) => `- [${title}](${link}) \`[${format(new Date(pubDate[0]), "MMMM dd, yyyy")}]\``)
     .join("\n") + `\n<!-- Posts last updated on ${new Date().toString()} -->}`;
  });
 });
 return content;
}
