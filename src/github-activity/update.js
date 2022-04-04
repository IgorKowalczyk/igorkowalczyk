//Inspired by https://github.com/cheesits456/github-activity-readme

const { Toolkit } = require("actions-toolkit");
require("dotenv").config();
const limit_lines = 15;

module.exports = async function (username) {
 if (!username) throw new Error("Invaild github username!");
 GH_USERNAME = username.toString();
 console.log(`Fetching activity for ${GH_USERNAME}`);
 const capitalize = (str) => str.slice(0, 1).toUpperCase() + str.slice(1);
 const serializers = {
  CommitCommentEvent: (item) => {
   const hash = item.payload.comment.commit_id.slice(0, 7);
   return `${actionIcon("comment", "🗣")} Commented on ${item.public ? `[\`${hash}\`](${item.payload.comment.html_url})` : `\`${hash}\``} in ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
  CreateEvent: (item) => {
   if (item.payload.ref_type === "repository") return `${actionIcon("create-repo", "➕")} Created repository ${toUrlFormat(item.repo.name, null, item.public)}`;
   if (item.payload.ref_type === "branch") return `${actionIcon("create-branch", "📂")} Created branch ${toUrlFormat(item.repo.name, item.payload.ref, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
  DeleteEvent: (item) => {
   return `${actionIcon("delete", "❌")} Deleted \`${item.payload.ref}\` from ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
  ForkEvent: (item) => {
   return `${actionIcon("fork", "🍴")} Forked ${toUrlFormat(item.repo.name, null, item.public)} to ${toUrlFormat(item.payload.forkee.full_name, null, item.payload.forkee.public)}`;
  },
  IssueCommentEvent: (item) => {
   return `${actionIcon("comment", "🗣")} Commented on ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
  IssuesEvent: (item) => {
   return `${actionIcon("issue", "❗️")} ${capitalize(item.payload.action)} issue ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
  PullRequestEvent: (item) => {
   const emoji = item.payload.action === "opened" ? actionIcon("pr-open", "✅") : actionIcon("pr-close", "❌");
   const line = item.payload.pull_request.merged ? `${actionIcon("merge", "🎉")} Merged` : `${emoji} ${capitalize(item.payload.action)}`;
   return `${line} PR ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
  PullRequestReviewEvent: (item) => {
   return `${actionIcon("review", "🔍")} Reviewed ${toUrlFormat(item, null, item.public)} in ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
  PushEvent: (item) => {
   console.log(item.repo.name.split("/")[1])
   if (item.repo.name == `${GH_USERNAME}/${GH_USERNAME}`) return;
   return `${actionIcon("commit", "📝")} Made \`${item.payload.size}\` commit${item.payload.size === 1 ? "" : "s"} in ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
  ReleaseEvent: (item) => {
   return `${actionIcon("release", "🏷")} Released ${item.public ? `[\`${item.payload.release.tag_name}\`](${item.payload.release.html_url})` : `\`${item.payload.release.tag_name}\``} in ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
  WatchEvent: (item) => {
   return `${actionIcon("star", "⭐")} Starred ${toUrlFormat(item.repo.name, null, item.public)}`;
  },
 };

 const timestamper = (item) => `\`[${item.created_at.split("T")[0].split("-").slice(1, 3).join("/")} ${item.created_at.split("T")[1].split(":").slice(0, 2).join(":")}]\``;
 const toUrlFormat = (item, branch, public = true) => {
  if (typeof item === "object") {
   return Object.hasOwnProperty.call(item.payload, "issue") ? (public ? `[\`#${item.payload.issue.number}\`](https://github.com//${item.repo.name}/issues/${item.payload.issue.number} '${item.payload.issue.title.replace(/'/g, "\\'")}')` : `\`#${item.payload.issue.number}\``) : public ? `[\`#${item.payload.pull_request.number}\`](https://github.com//${item.repo.name}/pull/${item.payload.pull_request.number} '${item.payload.pull_request.title.replace(/'/g, "\\'")}')` : `\`#${item.payload.pull_request.number}\``;
  }
  return !public ? (branch ? `\`${branch}\`` : `<span title="Private Repo">\`🔒${item}\`</span>`) : `[${branch ? `\`${branch}\`` : item}](https://github.com/${item}${branch ? `/tree/${branch}` : ""})`;
 };
 const actionIcon = (name, alt) => `<a href="https://github.com/igorkowalczyk" title="${alt}"><img alt="${alt}" src="https://github.com/${GH_USERNAME}/${GH_USERNAME}/raw/master/src/images/icons/${name}.png" align="top" height="18"></a>`;
 await Toolkit.run(async (tools) => {
  //console.info(`::debug:: Getting activity for ${GH_USERNAME}`);
  let eventArrs = [];
  for (let i = 0; i < 3; i++) {
   eventArrs[i] = await tools.github.activity.listEventsForAuthenticatedUser({
    username: GH_USERNAME,
    per_page: 100,
    page: i + 1,
   });
  }

  //console.info(`::debug:: Activity for ${GH_USERNAME}, ${eventArrs.reduce((a, c) => a + c.data.length, 0)} events found.`);
  const last = (array) => array[array.length - 1];
  let arr = [];
  for (const events of eventArrs) {
   for (const data of events.data) {
    if (arr.length && data.type === "PushEvent" && last(arr).type === "PushEvent" && data.repo.name === last(arr).repo.name) arr[arr.length - 1].payload.size += data.payload.size;
    else arr.push(data);
   }
  }
  content = arr
   .filter((event) => {
    let r = serializers.hasOwnProperty(event.type);
    // if (!r) console.info(event);
    return r;
   })
   .slice(0, limit_lines)
   .map((item) => `${timestamper(item)} ${serializers[item.type](item)}`)
   .filter((item) => !item.match(/^`\[\d{1,2}\/\d{1,2} \d{1,2}:\d{2}]` undefined$/));
  if (!content.length) throw new Error("No events found!");
  if (content.length < 5) throw new Error("Found less than 5 activities!");
 });
 return content;
};
