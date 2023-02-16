import { GraphQLClient } from "graphql-request";
import { getRepositories } from "./getRepositoriesInfo.js";

const client = new GraphQLClient("https://api.github.com/graphql", {
 headers: {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
 },
});

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

  const response = await client.request(query);
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
 }
 return contributions;
}

export async function getCommits(username) {
 let contributions = [];
 await getContributionsGraphQl(username).then(async (weeks) => {
  const groupedWeekdays = Object.values(weeks).reduce((acc, week) => {
   const key = week.weekday;
   if (!acc[key]) {
    acc[key] = {
     weekday: getWeekday(week.weekday),
     number: week.weekday,
     timeOfDay: week.timeOfDay,
     count: 0,
    };
   }
   acc[key].count += week.count;
   return acc;
  }, {});
  contributions = Object.values(groupedWeekdays);
 });
 return contributions;
}

function getWeekday(number) {
 const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
 return weekdays[number];
}

function getTimeOfDay(hour) {
 if (hour >= 6 && hour < 12) {
  return "🌞 Morning";
 } else if (hour >= 12 && hour < 18) {
  return "🌆 Daytime";
 } else if (hour >= 18 && hour < 24) {
  return "🌃 Evening";
 } else {
  return "🌙 Night";
 }
}
