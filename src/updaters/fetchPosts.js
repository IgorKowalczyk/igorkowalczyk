import { feed } from "../config.js";
import { parseString } from "xml2js";
import { format } from "date-fns";
import fetch from "node-fetch";

export async function fetchPosts(xml) {
 if (!xml) throw new Error("You must provide a link to get feed!");
 if (!xml.endsWith(".xml")) throw new Error("Link must have an .xml extension!");
 let content;
 console.log(`::debug:: [Posts] Fetching ${xml}`);
 await fetch(xml).then(async (res) => {
  if (!res.headers.get("content-type").includes("xml")) throw new Error("Link must be an xml file!");
  const xmlBody = await res.text();
  parseString(xmlBody, function (err, result) {
   if (err) throw new Error(err);
   content =
    result.rss.channel[0].item
     .slice(0, feed.maxLines || 5)
     .map(({ title, guid, pubDate }) => `- [${title}](${guid}) \`[${format(new Date(pubDate[0]), "MMMM dd, yyyy")}]\``)
     .join("\n") + `\n<!-- Posts last updated on ${new Date().toString()} -->`;
  });
 });
 return content;
}
