import fetch from "node-fetch";
import { percentageBar } from "../util/percentage.js";
import { getTotalContributionsForYears } from "../util/getContributions.js";
import { markdownTable } from "markdown-table";
import { getRepositoriesInfo } from "../util/getRepositoriesInfo.js";
import { getCommits } from "../util/getCommits.js";
import { ConvertBytes } from "../util/convertBytes.js";

export async function fetchCodingStats(apiToken, username) {
 console.log(`::debug:: [Github] Fetching Github data...`);
 const contributions = await getTotalContributionsForYears(username).then((data) => data.sort());
 const repositories = await getRepositoriesInfo(username);
 const contributionsLastYear = await getCommits(username);
 console.log(`::debug:: [Github] Done fetching Github data!`);
 const totalContributions = contributions.reduce((acc, { totalContributions }) => acc + totalContributions, 0);
 const contributionsInLastYear = contributions[contributions.length - 1].totalContributions;
 const lastYear = contributions[contributions.length - 1].year;

 console.log(`::debug:: [Wakatime] Fetching Wakatime data...`);
 let content = "";
 await fetch("https://wakatime.com/api/v1/users/current/stats/last_7_days", {
  headers: {
   Authorization: `Basic ${Buffer.from(apiToken).toString("base64")}`,
  },
 })
  .then((res) => res.json())
  .then((data) => {
   console.log(`::debug:: [Wakatime] Done fetching Wakatime data!`);
   const { languages, operating_systems: operatingSystems, status, best_day: bestDay } = data.data;
   if (status !== "ok") throw new Error("Wakatime API returned an error");
   let other = 0;
   const maxNameLength = Math.max(...languages.map(({ name }) => name.length), ...operatingSystems.map(({ name }) => name.length));
   const maxTimeLength = Math.max(...languages.map(({ text }) => text.length), ...operatingSystems.map(({ text }) => text.length));
   const otherLanguages = languages.slice(5).reduce((acc, { percent }) => acc + percent, 0);
   const otherLanguagesTime = otherLanguages ? languages.slice(5).reduce((acc, { total_seconds }) => acc + total_seconds, 0) : 0;
   const otherLanguagesText = otherLanguages ? `${Math.floor(otherLanguagesTime / 3600)}h ${Math.floor((otherLanguagesTime % 3600) / 60)}m` : "";

   // prettier-ignore
   const restLanguages = languages.slice(0, 5).map(({ name, text, percent }) => {
      if (name === "Other") { other += percent; return }
      const spaces = Array(maxNameLength - name.length + 1).fill(" ").join("");
      const timeSpaces = Array(maxTimeLength - text.length + 1).fill(" ").join("");
      return `${name} ${spaces} [${text}] ${timeSpaces} ${percentageBar(100, percent)}`;
    });

   // prettier-ignore
   const languagesList = `${restLanguages.join("\n")}${otherLanguages > 0 ? `\nOther ${Array(maxNameLength - 5 + 1).fill(" ").join("")} [${otherLanguagesText}] ${Array(maxTimeLength - otherLanguagesText.length + 1).fill(" ").join("")} ${percentageBar(100, otherLanguages + other)}` : ""}`;

   const operatingSystemsList = operatingSystems.map(({ name, percent, text }) => {
    return `${name} ${Array(maxNameLength - name.length + 1)
     .fill(" ")
     .join("")} [${text}]${Array(maxTimeLength - text.length + 1)
     .fill(" ")
     .join("")} ${percentageBar(100, percent)}`;
   });

   const weekly = `#### 📊 Weekly work stats (last 7 days)\n\n\`\`\`text\n💬 Programming Languages:\n${languagesList}\n\n💻 Operating Systems:\n${operatingSystemsList.join("\n")}\n\`\`\``;
   const totalCount = contributionsLastYear.reduce((accumulator, currentValue) => {
    return accumulator + currentValue.count;
   }, 0);

   const mostProductiveDays = contributionsLastYear
    .sort((a, b) => {
     if (a.weekday === "Monday") {
      return -1;
     } else if (b.weekday === "Monday") {
      return 1;
     } else {
      return 0;
     }
    })
    .map((item) => {
     return `${item.weekday}${Array(9 - item.weekday.length + 3)
      .fill(" ")
      .join("")}${item.count} commits   ${percentageBar(totalCount, item.count)}`;
    });

   const mostProductiveDay = contributionsLastYear.reduce((prev, current) => {
    return prev.count > current.count ? prev : current;
   });

   const maxCount = contributionsLastYear.reduce((prev, current) => {
    return prev.count > current.count ? prev.count : current.count;
   });

   const times = contributionsLastYear.reduce((accumulator, current) => {
    const { ...rest } = current;
    const timeOfDay = current.timeOfDay;
    if (!accumulator[timeOfDay]) {
     accumulator[timeOfDay] = { ...rest, count: current.count };
    } else {
     accumulator[timeOfDay].count += current.count;
    }
    return accumulator;
   }, {});

   // Todo: Sotring is not working properly
   const sortedTimes = Object.entries(times)
    .map(([timeOfDay, { count }]) => ({ timeOfDay, count }))
    .sort((a, b) => {
     if (a.timeOfDay === "🌞 Morning") return -1;
     if (b.timeOfDay === "🌞 Morning") return 1;
     if (a.timeOfDay === "🌃 Evening" && b.timeOfDay === "🌆 Daytime") return 1;
     if (a.timeOfDay === "🌆 Daytime" && b.timeOfDay === "🌃 Evening") return -1;
     return 0;
    })
    .map((item) => {
     return `${item.timeOfDay}${Array(9 - item.timeOfDay.length + 3)
      .fill(" ")
      .join("")} ${item.count} commits${Array(maxCount.toString().length - item.count.toString().length + 3)
      .fill(" ")
      .join("")} ${percentageBar(totalCount, item.count)}`;
    });

   const productiveOn = ["🌙 Night", "🌃 Evening"].includes(mostProductiveDay.weekday) ? "day" : "night";
   const mostProductiveDaysText = `#### 📅 I'm most productive on ${mostProductiveDay.weekday}\n\n\`\`\`text\n${mostProductiveDays.join("\n")}\n\`\`\``;
   const mostProductiveParts = `#### 📅 I work mostly during the ${productiveOn}\n\n\`\`\`text\n${sortedTimes.join("\n")}\n\`\`\``;

   const table = markdownTable(
    [
     [`🏆 Contributions (Total)`, `${totalContributions}`],
     [`**🏆 Contributions in ${lastYear}:**`, `**${contributionsInLastYear}**`],
     [`**📦 Github Storage:**`, `**${ConvertBytes(repositories.size * 1000)}**`],
     [`**📚 Public Repositories:**`, `**${repositories.publicRepositories}**`],
     [`**🔑 Private Repositories:**`, `**${repositories.privateRepositories}**`],
    ],
    {
     align: ["c", "c"],
    }
   );

   console.log(`::debug:: [Wakatime] Saving Wakatime data!`);
   content = `${table}\n\n<details><summary>✨ Show more stats</summary>\n\n${mostProductiveParts}\n\n${mostProductiveDaysText}\n\n${weekly}\n\n<!-- Wakatime last updated on ${new Date().toString()} -->\n</details>
   `;
  });
 return content;
}
