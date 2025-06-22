import { format } from "date-fns";
import { XMLParser } from "fast-xml-parser";
import { feed } from "@/config";
import { Logger } from "@/util/functions";

interface Entry {
 title: string;
 id: string;
 updated: string;
}

interface Feed {
 entry: Entry[];
}

interface ParsedXML {
 feed: Feed;
}

async function parseXML(xmlBody: string): Promise<ParsedXML> {
 try {
  const parser = new XMLParser({
   isArray: (name: string) => name === "entry",
  });
  const result: ParsedXML = await parser.parse(xmlBody);
  return result;
 } catch (err) {
  throw new Error(`Failed to parse XML: ${err}`);
 }
}

function formatPosts(entries: Entry[]): string {
 return entries
  .slice(0, feed.maxLines || 5)
  .map(({ title, id, updated }) => `- [${title}](${id}) \`[${format(new Date(updated), "MMMM dd, yyyy")}]\``)
  .join("\n")
  .trim();
}

export async function fetchPosts(xml: string): Promise<string> {
 try {
  if (!xml) throw new Error("You must provide a link to get feed!");
  Logger("event", `Fetching posts from ${xml}`);

  const res = await fetch(xml, {
   method: "GET",
   headers: {
    // Bypass for Cloudflare Security
    "x-bypass-token": process.env.BYPASS_TOKEN || "",
   },
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
  if (!res.headers.get("content-type")?.includes("xml")) throw new Error("Link must be an xml file!");

  const xmlBody = await res.text();
  const result = await parseXML(xmlBody);

  Logger("done", `Fetched ${result.feed.entry.length} posts from ${xml}`);

  const content = formatPosts(result.feed.entry);

  return content.concat(`\n<!-- Posts last updated on ${new Date().toString()} -->`);
 } catch (error) {
  Logger("error", `Failed to fetch posts: ${error}`);
  return "";
 }
}
