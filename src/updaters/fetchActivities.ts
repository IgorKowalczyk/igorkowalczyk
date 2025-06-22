// Inspired by https://github.com/cheesits456/github-activity-readme

import { activity } from "@/config";
import { Logger } from "@/util/functions";

interface Event {
 message?: string;
 type: string;
 public: boolean;
 repo: { name: string };
 payload: {
  issue?: { number: number; title: string };
  pull_request?: { number: number; title: string; merged?: boolean };
  comment?: { commit_id: string; html_url: string };
  ref?: string;
  ref_type?: string;
  forkee?: { full_name: string; public: boolean };
  release?: { tag_name: string; html_url: string };
  action?: string;
  size?: number;
 };
 created_at: string;
}

interface Serializer {
 [key: string]: (item: Event) => string | null;
}

export async function fetchActivities(username: string): Promise<string> {
 try {
  if (!username) throw new Error("You must provide a Github username!");

  const capitalize = (str: string) => str.slice(0, 1).toUpperCase() + str.slice(1);

  const toUrlFormat = (item: Event | string, branch: string | null, repoPublic: boolean): string => {
   if (typeof item === "object") {
    if (!item.payload) return "";

    if (Object.hasOwn(item.payload, "issue")) {
     if (repoPublic) {
      if (!item.payload || !item.payload.issue) return "";
      return `[\`#${item.payload.issue.number}\`](https://github.com/${item.repo.name}/issues/${item.payload.issue.number} '${item.payload.issue.title.replace(/'/g, "\\'")}')`;
     }

     if (!item.payload || !item.payload.issue) return "";
     return `\`#${item.payload.issue.number}\``;
    }

    if (repoPublic) {
     if (!item.payload || !item.payload.pull_request) return "";
     return `[\`#${item.payload.pull_request.number}\`](https://github.com/${item.repo.name}/pull/${item.payload.pull_request.number} '${item.payload.pull_request.title.replace(/'/g, "\\'")}')`;
    }

    if (!item.payload || !item.payload.pull_request) return "";
    return `\`#${item.payload.pull_request.number}\``;
   }

   return `[${branch ? `\`${branch}\`` : item}](https://github.com/${item}${branch ? `/tree/${branch}` : ""})`;
  };

  const actionIcon = (name: string, alt: string): string => `<a href="https://github.com/${username}" title="${alt}"><img alt="${alt}" src="https://github.com/${username}/${username}/raw/master/src/images/icons/${name}.png" align="top" height="18"></a>`;

  const serializers: Serializer = {
   CommitCommentEvent: (item: Event): string => {
    if (!item.payload.comment) return "";
    const hash = item.payload.comment.commit_id.slice(0, 7);
    return `${actionIcon("comment", "🗣")} Commented on ${item.public ? `[\`${hash}\`](${item.payload.comment.html_url})` : `\`${hash}\``} in ${toUrlFormat(item.repo.name, null, item.public)}`;
   },
   CreateEvent: (item: Event): string => {
    if (!item.payload) return "";
    if (item.payload.ref_type === "repository") return `${actionIcon("create-repo", "➕")} Created repository ${toUrlFormat(item.repo.name, null, item.public)}`;
    if (item.payload.ref_type === "branch") return `${actionIcon("create-branch", "📂")} Created branch ${toUrlFormat(item.repo.name, item.payload.ref ?? null, item.public ?? null)} in ${toUrlFormat(item.repo.name, null, item.public ?? null)}`;
    if (item.payload.ref_type === "tag") return `${actionIcon("create-tag", "🔖")} Created tag \`${item.payload.ref}\` in ${toUrlFormat(item.repo.name, null, item.public)}`;
    return "";
   },
   DeleteEvent: (item: Event): string => {
    if (!item.payload || !item.payload.ref) return "";
    return `${actionIcon("delete", "❌")} Deleted \`${item.payload.ref.slice(0, 30)}${item.payload.ref.length >= 30 ? "..." : ""}\` from ${toUrlFormat(item.repo.name, null, item.public)}`;
   },
   ForkEvent: (item: Event): string => {
    if (!item.payload.forkee) return "";
    return `${actionIcon("fork", "🍴")} Forked ${toUrlFormat(item.repo.name, null, item.public)} to ${toUrlFormat(item.payload.forkee.full_name, null, item.payload.forkee.public)}`;
   },
   IssueCommentEvent: (item: Event): string => {
    return `${actionIcon("comment", "🗣")} Commented on ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
   },
   IssuesEvent: (item: Event): string => {
    if (!item.payload.issue) return "";
    return `${actionIcon("issue", "❗️")} ${capitalize(item.payload.action || "")} issue ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
   },
   PullRequestEvent: (item: Event): string => {
    if (!item.payload.pull_request) return "";
    const emoji = item.payload.action === "opened" ? actionIcon("pr-open", "✅") : actionIcon("pr-close", "❌");
    const line = item.payload.pull_request.merged ? `${actionIcon("merge", "🎉")} Merged` : `${emoji} ${capitalize(item.payload.action || "")}`;
    return `${line} PR ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
   },
   PullRequestReviewEvent: (item: Event): string => {
    return `${actionIcon("review", "🔍")} Reviewed ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
   },
   PushEvent: (item: Event): string => {
    if (item.repo.name.split("/")[1] === username) return "";
    return `${actionIcon("commit", "📝")} Made \`${item.payload.size}\` commit${item.payload.size === 1 ? "" : "s"} in ${toUrlFormat(item.repo.name, null, item.public)}`;
   },
   ReleaseEvent: (item: Event): string => {
    if (!item.payload.release) return "";
    return `${actionIcon("release", "🏷")} Released ${item.public ? `[\`${item.payload.release.tag_name}\`](${item.payload.release.html_url})` : `\`${item.payload.release.tag_name}\``} in ${toUrlFormat(item.repo.name, null, item.public)}`;
   },
   WatchEvent: (item: Event): string => {
    return `${actionIcon("star", "⭐")} Starred repository ${toUrlFormat(item.repo.name, null, item.public)}`;
   },
  };

  const timestamper = (item: Event): string => `\`[${item.created_at.split("T")[0].split("-").slice(1, 3).join("/")} ${item.created_at.split("T")[1].split(":").slice(0, 2).join(":")}]\``;

  Logger("event", `Getting activity for ${username}`);
  const eventArrs: Event[][] = [];

  for (let i = 0; i < 3; i++) {
   const response = await fetch(`https://api.github.com/users/${username}/events?per_page=100&page=${i + 1}`);
   if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.message || "Failed to fetch events");
   }
   const events: Event[] = await response.json();
   eventArrs.push(events);
  }

  if (!eventArrs.length) throw new Error("No events found!");

  Logger("done", `Found ${eventArrs.reduce((a, c) => a + c.length, 0)} events for ${username}`);

  const last = <T>(array: T[]) => array.at(-1);
  const arr = [];

  for (const events of eventArrs) {
   if (!events) continue;
   for (const data of events) {
    if (arr.length && data.type === "PushEvent" && last(arr)?.type === "PushEvent" && data.repo.name === last(arr)?.repo.name) {
     if (!arr[arr.length - 1].payload.size) arr[arr.length - 1].payload.size = 0;
    } else {
     arr.push(data);
    }
   }
  }

  const content = arr
   .filter((event) => Object.hasOwn(serializers, event.type))
   .map((item) => {
    if (!item.public) return null; // Hide private events
    return `${timestamper(item)} ${serializers[item.type](item)}`;
   })
   .filter((item) => (item ? !item.match(/^`\[\d{1,2}\/\d{1,2} \d{1,2}:\d{2}]` undefined$/) : false))
   .slice(0, activity.maxLines || 15);

  if (!content.length) throw new Error("No events found!");
  if (content.length < 5) throw new Error("Found less than 5 activities!");

  return content.join("<br/>").concat(`\n<!-- Activity last updated on ${new Date().toString()} -->`);
 } catch (error) {
  Logger("error", `Failed to get activity: ${error}`);
  return "";
 }
}
