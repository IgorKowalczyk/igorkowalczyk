import { markdownTable } from "npm:markdown-table";
import { formatBytes } from "../util/formatBytes.js";
import { formatNumber } from "../util/formatNumber.js";
import { getCommits } from "../util/getCommits.js";
import { getTotalContributionsForYears } from "../util/getContributions.js";
import { getLinesOfCode } from "../util/getLinesOfCode.js";
import { getRepositoriesInfo } from "../util/getRepositoriesInfo.js";
import { percentageBar } from "../util/percentageBar.js";

export async function fetchCodingStats(apiToken, username) {
 console.log("::debug:: [Github] Fetching Github data...");
 const [contributions, repositories, contributionsLastYear, linesOfCode] = await Promise.all([getTotalContributionsForYears(username).then((data) => data.sort()), getRepositoriesInfo(username), getCommits(username), getLinesOfCode(username)]);
 console.log("::debug:: [Github] Done fetching Github data!");

 const totalContributions = contributions.reduce((acc, { totalContributions }) => acc + totalContributions, 0);
 const contributionsInLastYear = contributions[contributions.length - 1].totalContributions;
 const lastYear = contributions[contributions.length - 1].year;

 console.log("::debug:: [Wakatime] Fetching Wakatime data...");
 const request = await fetch("https://wakatime.com/api/v1/users/current/stats/last_7_days", {
  headers: {
   Authorization: `Basic ${btoa(apiToken)}`,
  },
 });

 if (!request.ok) throw new Error("Wakatime API returned an error");

 const data = await request.json();
 console.log("::debug:: [Wakatime] Done fetching Wakatime data!");

 const { languages, operating_systems: operatingSystems, status } = data.data;
 if (status !== "ok") throw new Error("Wakatime API returned an error");
 let other = 0;

 const maxNameLength = Math.max(...languages.map(({ name }) => name.length), ...operatingSystems.map(({ name }) => name.length));
 const maxTimeLength = Math.max(...languages.map(({ text }) => text.length), ...operatingSystems.map(({ text }) => text.length));
 const otherLanguages = languages.slice(5).reduce((acc, { percent }) => acc + percent, 0);
 const otherLanguagesTime = otherLanguages ? languages.slice(5).reduce((acc, { total_seconds }) => acc + total_seconds, 0) : 0;
 const otherLanguagesText = otherLanguages ? `${Math.floor(otherLanguagesTime / 3600)}h ${Math.floor((otherLanguagesTime % 3600) / 60)}m` : "";

 const restLanguages = languages.slice(0, 5).map(({ name, text, percent }) => {
  if (name === "Other") {
   other += percent;
   return;
  }
  const spaces = Array(maxNameLength - name.length + 1).fill(" ").join("");
  const timeSpaces = Array(maxTimeLength - text.length + 1).fill(" ").join("");
  return `${name} ${spaces} [${text}] ${timeSpaces} ${percentageBar(100, percent)}`;
 });

 const languagesList = `${restLanguages.join("\n")}${otherLanguages > 0 ? `\nOther ${Array(maxNameLength - 5 + 1).fill(" ").join("")} [${otherLanguagesText}] ${Array(maxTimeLength - otherLanguagesText.length + 1).fill(" ").join("")} ${percentageBar(100, otherLanguages + other)}` : ""}`;

 const operatingSystemsList = operatingSystems.map(({ name, percent, text }) => {
  return `${name} ${
   Array(maxNameLength - name.length + 1)
    .fill(" ")
    .join("")
  } [${text}]${
   Array(maxTimeLength - text.length + 1)
    .fill(" ")
    .join("")
  } ${percentageBar(100, percent)}`;
 });

 const weekly = `#### 📊 Weekly work stats (last 7 days)\n\n\`\`\`text\n💬 Programming Languages:\n${languagesList}\n\n💻 Operating Systems:\n${operatingSystemsList.join("\n")}\n\`\`\``;

 const mostProductiveDay = Object.entries(contributionsLastYear.weekdaySums).sort((a, b) => b[1] - a[1])[0][0];
 const maxCount = contributionsLastYear.weekdaySums[mostProductiveDay];

 const totalCount = Object.values(contributionsLastYear.weekdaySums).reduce((acc, curr) => acc + curr, 0);
 const mostProductiveDays = Object.entries(contributionsLastYear.weekdaySums).map(([weekday, count]) => {
  return `${weekday} ${
   Array(9 - weekday.length + 1)
    .fill(" ")
    .join("")
  } ${count.toString()} commits ${
   Array(maxCount.toString().length - count.toString().length + 1)
    .fill(" ")
    .join("")
  } ${percentageBar(totalCount, count)}`;
 });

 const result = contributionsLastYear.timeOfDayCounts.reduce((acc, curr) => {
  const timeOfDay = curr.timeOfDay;
  const count = curr.count;
  if (acc[timeOfDay]) {
   acc[timeOfDay].count += count;
  } else {
   acc[timeOfDay] = { count: count, timeOfDay: timeOfDay };
  }
  return acc;
 }, {});

 const timeOfDayOrder = {
  "🌞 Morning": 0,
  "🌆 Daytime": 1,
  "🌃 Evening": 2,
  "🌙 Night": 3,
 };

 const sortedResult = Object.values(result).sort((a, b) => {
  return timeOfDayOrder[a.timeOfDay] - timeOfDayOrder[b.timeOfDay];
 });

 const lines = Object.values(sortedResult).map((item) => {
  const count = item.count;
  return `${item.timeOfDay} ${
   Array(9 - item.timeOfDay.toString().length + 2)
    .fill(" ")
    .join("")
  } ${count} ${count > 1 ? "commits" : "commit"} ${
   Array(maxCount.toString().length - count.toString().length + 1)
    .fill(" ")
    .join("")
  } ${percentageBar(totalCount, count)}`;
 });

 const productiveOn = ["🌙 Night", "🌃 Evening"].includes(mostProductiveDay.weekday) ? "day" : "night";
 const mostProductiveDaysText = `#### 📅 I'm most productive on ${mostProductiveDay}\n\n\`\`\`text\n${mostProductiveDays.join("\n")}\n\`\`\``;
 const mostProductiveParts = `#### 📅 I work mostly during the ${productiveOn}\n\n\`\`\`text\n${lines.join("\n")}\n\`\`\``;

 /* eslint-disable comma-dangle */
 const table = markdownTable(
  [
   ["🏆 Contributions (total):", `${formatNumber(totalContributions)}`],
   [`**🏆 Contributions in ${lastYear}:**`, `**${formatNumber(contributionsInLastYear)}**`],
   ["**📝 Total lines of code:**", `**${formatNumber(linesOfCode)}**`],
   ["**📦 Github Storage:**", `**${formatBytes(repositories.size * 1000)}**`],
   ["**📚 Public Repositories:**", `**${formatNumber(repositories.publicRepositories)}**`],
  ],
  {
   align: ["l", "c"],
  },
 );
 /* eslint-enable comma-dangle */

 console.log("::debug:: [Wakatime] Saving Wakatime data!");
 return `${table}\n\n<details><summary>✨ Show more stats</summary>\n\n${mostProductiveParts}\n\n${mostProductiveDaysText}\n\n${weekly}\n\n<!-- Wakatime last updated on ${new Date().toString()} -->\n</details>`;
}
