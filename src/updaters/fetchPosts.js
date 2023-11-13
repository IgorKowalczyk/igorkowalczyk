import { format } from "npm:date-fns";
import { parseString } from "npm:xml2js";
import { feed } from "../config.js";

export async function fetchPosts(xml) {
 if (!xml) throw new Error("You must provide a link to get feed!");
 console.log(`::debug:: [Posts] Fetching ${xml}`);

 let content = "";
 const res = await fetch(xml);
 if (!res.headers.get("content-type").includes("xml")) throw new Error("Link must be an xml file!");
 const xmlBody = await res.text();

 await parseString(xmlBody, (err, result) => {
  if (err) throw new Error(err);
  console.log(`::debug:: [Posts] Fetched ${result.feed.entry.length} posts`);
  content = result.feed.entry
   .slice(0, feed.maxLines || 5)
   .map(({ title, id, updated }) => `- [${title}](${id}) \`[${format(new Date(updated[0]), "MMMM dd, yyyy")}]\``)
   .join("\n") + `\n<!-- Posts last updated on ${new Date().toString()} -->`;
 });

 return content;
}
