import { markdownTable } from "markdown-table";
import { wakatime } from "@/config";
import { formatBytes, formatNumber, Logger, percentageBar } from "@/util/functions";
import { getCommits } from "@/util/getCommits";
import { getTotalContributionsForYears } from "@/util/getContributions";
import { getLinesOfCode } from "@/util/getLinesOfCode";
import { getRepositories } from "@/util/getRepositories";

interface Language {
 name: string;
 text: string;
 percent: number;
 total_seconds: number;
}

interface OperatingSystem {
 name: string;
 text: string;
 percent: number;
}

interface WakatimeData {
 data: {
  languages: Language[];
  operating_systems: OperatingSystem[];
  status: string;
 };
}

export async function fetchCodingStats(apiToken: string, username: string): Promise<string> {
 try {
  Logger("event", `Getting coding stats for ${username}`);
  const [
   //
   contributions,
   repositories,
   contributionsLastYear,
   linesOfCode,
  ] = await Promise.all([
   //
   getTotalContributionsForYears(username).then((data) => (data ? data.sort((a, b) => a.year - b.year) : [])),
   getRepositories(username),
   getCommits(username),
   getLinesOfCode(username),
  ]);
  Logger("done", `Got coding stats for ${username}`);

  const totalContributions = contributions.reduce((acc, { totalContributions }) => acc + totalContributions, 0);
  const contributionsInLastYear = contributions[contributions.length - 1].totalContributions;
  const lastYear = contributions[contributions.length - 1].year;

  Logger("event", `Fetching Wakatime data for ${username}`);
  const request = await fetch("https://wakatime.com/api/v1/users/current/stats/last_7_days", {
   headers: {
    Authorization: `Basic ${btoa(apiToken)}`,
   },
  });

  if (!request.ok) throw new Error("Wakatime API returned an error");

  const data: WakatimeData = await request.json();
  Logger("done", `Got Wakatime data for ${username}`);

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
    return "";
   }
   const spaces = Array(maxNameLength - name.length + 1)
    .fill(" ")
    .join("");
   const timeSpaces = Array(maxTimeLength - text.length + 1)
    .fill(" ")
    .join("");
   return `${name} ${spaces} [${text}] ${timeSpaces} ${percentageBar(100, percent)}`;
  });

  const languagesList = `${restLanguages.filter(Boolean).join("\n")}${
   otherLanguages > 0
    ? `\nOther ${Array(maxNameLength - 5 + 1)
       .fill(" ")
       .join("")} [${otherLanguagesText}] ${Array(maxTimeLength - otherLanguagesText.length + 1)
       .fill(" ")
       .join("")} ${percentageBar(100, otherLanguages + other)}`
    : ""
  }`;

  const operatingSystemsList = operatingSystems.map(({ name, percent, text }) => {
   return `${name} ${Array(maxNameLength - name.length + 1)
    .fill(" ")
    .join("")} [${text}]${Array(maxTimeLength - text.length + 1)
    .fill(" ")
    .join("")} ${percentageBar(100, percent)}`;
  });

  const weekly = `#### 📊 Weekly work stats (last 7 days)\n\n\`\`\`text\n💬 Programming Languages:\n${languagesList}\n\n💻 Operating Systems:\n${operatingSystemsList.join("\n")}\n\`\`\``;

  const mostProductiveDay = Object.entries(contributionsLastYear.weekdaySums).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  const maxCount = contributionsLastYear.weekdaySums[mostProductiveDay];

  const totalCount = Object.values(contributionsLastYear.weekdaySums).reduce((acc, curr) => acc + curr, 0);
  const mostProductiveDays = Object.entries(contributionsLastYear.weekdaySums).map(([weekday, count]) => {
   return `${weekday} ${Array(9 - weekday.length + 1)
    .fill(" ")
    .join("")} ${count.toString()} commits ${Array(maxCount.toString().length - count.toString().length + 1)
    .fill(" ")
    .join("")} ${percentageBar(totalCount, count)}`;
  });

  const result = contributionsLastYear.timeOfDayCounts.reduce((acc: Record<string, { count: number; timeOfDay: string }>, curr) => {
   const timeOfDay = curr.timeOfDay;
   const count = curr.count;
   if (acc[timeOfDay]) {
    acc[timeOfDay].count += count;
   } else {
    acc[timeOfDay] = { count: count, timeOfDay: timeOfDay };
   }
   return acc;
  }, {});

  const timeOfDayOrder: Record<string, number> = {
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
   return `${item.timeOfDay} ${Array(9 - item.timeOfDay.toString().length + 2)
    .fill(" ")
    .join("")} ${count} ${count > 1 ? "commits" : "commit"} ${Array(maxCount.toString().length - count.toString().length + 1)
    .fill(" ")
    .join("")} ${percentageBar(totalCount, count)}`;
  });

  const mostProductiveTimeOfDay = sortedResult.reduce((max, curr) => (curr.count > max.count ? curr : max), sortedResult[0]).timeOfDay;

  const mostProductiveParts = `#### 📅 I work mostly during the ${["🌙 Night", "🌃 Evening"].includes(mostProductiveTimeOfDay) ? "day" : "night"}\n\n\`\`\`text\n${lines.join("\n")}\n\`\`\``;

  const mostProductiveDaysText = `#### 📅 I'm most productive on ${mostProductiveDay}\n\n\`\`\`text\n${mostProductiveDays.join("\n")}\n\`\`\``;

  const table = markdownTable(
   [
    ["🏆 Contributions (total):", `${formatNumber(totalContributions)}`],
    [`**🏆 Contributions in ${lastYear}:**`, `**${formatNumber(contributionsInLastYear)}**`],
    ["**📝 Total lines of code:**", `**${formatNumber(linesOfCode)}**`],
    ["**📦 Github Storage:**", `**${repositories ? formatBytes(repositories.size * 1000) : ""}**`],
    ["**📚 Public Repositories:**", `**${formatNumber(repositories ? repositories.publicRepositories.map(({ name }) => name).length : 0)}**`],
   ],
   {
    align: ["l", "c"],
   }
  );

  const detailsSections: string[] = [];
  if (wakatime.showMostProductiveDayParts) detailsSections.push(mostProductiveParts);
  if (wakatime.showProductiveDays) detailsSections.push(mostProductiveDaysText);
  if (wakatime.showWeekly) detailsSections.push(weekly);

  let detailsContent = "";
  if (detailsSections.length > 0) {
   detailsContent = `

<details><summary>✨ Show more stats</summary>\n
${detailsSections.join("\n\n")}
</details>
`;
  }

  return `${table}${detailsContent}
<!-- Wakatime last updated on ${new Date().toString()} -->`;
 } catch (error) {
  Logger("error", `Failed to get coding stats for ${username}: ${error}`);
  return "";
 }
}
