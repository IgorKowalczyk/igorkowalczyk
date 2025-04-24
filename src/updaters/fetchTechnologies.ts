import { Logger } from "@/util/functions";

interface Entry {
 name: string;
 icon: string;
 link: string;
}

function formatTechnologies(entries: Entry[], base: string): string {
 return entries
  .map(({ name, icon }) => `<code><img src="${new URL(icon, base).href}" alt="${name} icon" height="30" width="30" /></code>`)
  .join("\n")
  .trim();
}

export async function fetchTechnologies(link: string): Promise<string> {
 try {
  if (!link) throw new Error("You must provide a link to get technologies!");
  Logger("event", `Fetching technologies from ${link}`);

  const res = await fetch(link, {
   method: "GET",
   headers: {
    // Bypass for Cloudflare Security
    "X-Bypass-Token": process.env.BYPASS_TOKEN || "",
   },
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

  const body = (await res.json()) as Entry[];
  Logger("done", `Fetched ${body.length} technologies from ${link}`);

  const baseUrl = new URL(link).origin;

  const content = formatTechnologies(body, baseUrl);

  return content.concat(`\n<!-- List last updated on ${new Date().toString()} -->`);
 } catch (error) {
  Logger("error", `Failed to fetch technologies: ${error}`);
  return "";
 }
}
