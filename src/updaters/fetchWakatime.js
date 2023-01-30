import fetch from "node-fetch";
import { percentageBar } from "../util/percentage.js";

export async function fetchWakatime(apiToken) {
 console.log(`::debug:: [Wakatime] Fetching Wakatime data...`);

 let content = "";
 await fetch("https://wakatime.com/api/v1/users/current/stats/last_7_days", {
  headers: {
   Authorization: `Basic ${Buffer.from(apiToken).toString("base64")}`,
  },
 })
  .then((res) => res.json())
  .then((data) => {
   console.log(`::debug:: [Wakatime] Parsing Wakatime data...`);
   const { languages, operating_systems: operatingSystems, status, best_day: bestDay } = data.data;
   if (status !== "ok") throw new Error("Wakatime API returned an error");
   let other = 0;
   const maxNameLength = Math.max(...languages.map(({ name }) => name.length), ...operatingSystems.map(({ name }) => name.length));
   const otherLanguages = languages.slice(5).reduce((acc, { percent }) => acc + percent, 0);
   // prettier-ignore
   const restLanguages = languages.slice(0, 5).map(({ name, percent }) => {
    if (name === "Other") { other += percent; return }
    let spaces = Array(maxNameLength - name.length + 1).fill(" ").join("");
    return `${name}${spaces}- ${percentageBar(100, percent)}`;
   });
   // prettier-ignore
   const languagesList = `${restLanguages.join("\n")}${otherLanguages > 0 ? `Other${Array(maxNameLength - 5 + 1).fill(" ").join("")}- ${percentageBar(100, otherLanguages + other)}` : ""}`;
   const operatingSystemsList = operatingSystems.map(({ name, percent }) => {
    let spaces = Array(maxNameLength - name.length + 1)
     .fill(" ")
     .join("");
    return `${name}${spaces}- ${percentageBar(100, percent)}`;
   });
   const mostProductiveDay = `#### 📅 I'm most productive on ${new Date(bestDay.date).toLocaleDateString("EN", { weekday: "long" })} (${bestDay.text})`;
   const weekly = `#### 📊 Weekly work stats (last 7 days)\n\n\`\`\`\n💬 Programming Languages:\n\n${languagesList}\n\n💻 Operating Systems:\n${operatingSystemsList.join("\n")}\n\`\`\``;
   console.log(`::debug:: [Wakatime] Saving Wakatime data!`);
   content = `\n${mostProductiveDay}\n\n${weekly}`;
  });
 return content;
}
