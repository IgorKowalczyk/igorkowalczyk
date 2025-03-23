import { readFileSync, writeFileSync } from "node:fs";
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

async function updateReadmeSection(originalContent: string, marker: Marker, newContent: string): Promise<string> {
 const start = originalContent.indexOf(marker.open);
 const end = originalContent.indexOf(marker.close, start + marker.open.length);

 if (start === -1 || end === -1) throw new Error(`Markers not found in the content: ${marker.open}, ${marker.close}`);

 const beforeMarker = originalContent.substring(0, start + marker.open.length);
 const afterMarker = originalContent.substring(end);

 return `${beforeMarker}\n${newContent.trim()}\n${afterMarker}`;
}

const start: number = new Date().getTime();
const readmePath = "./README.md";

try {
 let readmeContent = readFileSync(readmePath, "utf-8");

 const [activityList, statsList, posts, tech] = await Promise.all([fetchActivities(activity.gitUsername), fetchCodingStats(wakatime.apiKey, activity.gitUsername), fetchPosts(feed.link), fetchTechnologies(technologies.link)]);

 readmeContent = await updateReadmeSection(readmeContent, activity as Marker, activityList);
 readmeContent = await updateReadmeSection(readmeContent, wakatime as Marker, statsList);
 readmeContent = await updateReadmeSection(readmeContent, feed as Marker, posts);
 readmeContent = await updateReadmeSection(readmeContent, technologies as Marker, tech);

 writeFileSync(readmePath, readmeContent.trim());

 Logger("done", `Finished updating README in ${((new Date().getTime() - start) / 1000).toFixed(2)}s`);
} catch (error) {
 Logger("error", `Failed to update README: ${error}`);
}
