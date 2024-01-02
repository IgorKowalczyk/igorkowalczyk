import { getRepositories } from "./getRepositoriesInfo.js";
import { client } from "./graphQlClient.js";

function getWeekday(number) {
 const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
 return weekdays[number];
}

function getTimeOfDay(hour) {
 if (hour >= 6 && hour < 12) {
  return "🌞 Morning";
 } else if (hour >= 12 && hour < 18) {
  return "🌆 Daytime";
 } else if (hour >= 18 && hour < 23) {
  return "🌃 Evening";
 } else {
  return "🌙 Night";
 }
}

async function getContributionsGraphQl(username) {
 const contributions = [];
 const repositories = await getRepositories(username);
 for (const repo of repositories.publicRepositories) {
  const query = `
  query {
    repository(owner: "${username}", name: "${repo.name}") {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 100, author: { id: "${repositories.id}" }) {
              edges {
                node {
                  committedDate
                }
              }
            }
          }
        }
      }
    }
  }
  `;

  try {
   const response = await client.request(query);
   if (!response || !response.repository || !response.repository.defaultBranchRef || !response.repository.defaultBranchRef.target || !response.repository.defaultBranchRef.target.history || !response.repository.defaultBranchRef.target.history.edges) {
    console.error("Invalid response received");
    continue;
   }
   const commits = response.repository.defaultBranchRef.target.history.edges;

   for (const commit of commits) {
    const date = new Date(commit.node.committedDate);
    const weekday = date.getDay();
    const hour = date.getHours();
    const timeOfDay = getTimeOfDay(hour);
    const contribution = {
     weekday,
     timeOfDay,
     count: 1,
    };
    contributions.push(contribution);
   }
  } catch (error) {
   console.error(`Error executing query: ${error}`);
  }
 }
 return contributions;
}

export async function getCommits(username) {
 try {
  const contributions = {};
  await getContributionsGraphQl(username).then((weeks) => {
   const weekdayCounts = Object.values(weeks).reduce((acc, week) => {
    const key = week.weekday;
    if (!acc[key]) {
     acc[key] = {
      weekday: getWeekday(week.weekday),
      counts: [],
      count: 0,
     };
    }
    acc[key].counts.push(week.count);
    acc[key].count += week.count;
    return acc;
   }, {});

   const weekdaySums = {};

   for (const weekdayCount of Object.values(weekdayCounts)) {
    weekdaySums[weekdayCount.weekday] = weekdayCount.count;
   }

   const timeOfDayCounts = Object.values(weeks).sort((a, b) => {
    if (a.weekday < b.weekday) return -1;
    if (a.weekday > b.weekday) return 1;
    if (a.timeOfDay < b.timeOfDay) return -1;
    if (a.timeOfDay > b.timeOfDay) return 1;
    return 0;
   });

   contributions.timeOfDayCounts = timeOfDayCounts;
   contributions.weekdaySums = weekdaySums;
  });
  return contributions;
 } catch (error) {
  console.error(`Error in getCommits: ${error}`);
  return null;
 }
}
