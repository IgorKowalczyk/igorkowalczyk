import { readFile, writeFile } from "node:fs/promises";
import { activity, feed, technologies, wakatime } from "@/config";
import { fetchActivities } from "@/updaters/fetchActivities";
import { fetchCodingStats } from "@/updaters/fetchCodingStats";
import { fetchPosts } from "@/updaters/fetchPosts";
import { fetchTechnologies } from "@/updaters/fetchTechnologies";
import { Logger } from "@/util/functions";

interface Marker {
 open: string;
 close: string;
}

Logger("info", "Updating README...");

async function updateReadmeSections(originalContent: string, updates: { marker: Marker; newContent: string }[]): Promise<string> {
 let updatedContent = originalContent;

 for (const { marker, newContent } of updates) {
  const start = updatedContent.indexOf(marker.open);
  const end = updatedContent.indexOf(marker.close, start + marker.open.length);

  if (start === -1 || end === -1) {
   throw new Error(`Markers not found in the content: ${marker.open}, ${marker.close}`);
  }

  const beforeMarker = updatedContent.substring(0, start + marker.open.length);
  const afterMarker = updatedContent.substring(end);

  updatedContent = `${beforeMarker}\n${newContent.trim()}\n${afterMarker}`;
 }

 return updatedContent;
}

const start: number = Date.now();
const readmePath = "./README.md";

try {
 const [readmeContent, activityList, statsList, posts, tech] = await Promise.all([
  // breakline
  readFile(readmePath, "utf-8"),
  fetchActivities(activity.gitUsername),
  fetchCodingStats(wakatime.apiKey, activity.gitUsername),
  fetchPosts(feed.link),
  fetchTechnologies(technologies.link),
 ]);

 const updates = [
  { marker: activity as Marker, newContent: activityList },
  { marker: wakatime as Marker, newContent: statsList },
  { marker: feed as Marker, newContent: posts },
  { marker: technologies as Marker, newContent: tech },
 ];

 const updatedReadme = await updateReadmeSections(readmeContent, updates);

 await writeFile(readmePath, updatedReadme.trim());

 Logger("done", `Finished updating README in ${((Date.now() - start) / 1000).toFixed(2)}s`);
} catch (error) {
 Logger("error", `Failed to update README: ${error}`);
}
