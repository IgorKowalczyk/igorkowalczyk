import { getTimeOfDay } from "@/util/functions";
import { getRepositories } from "@/util/getRepositories";
import { client } from "@/util/graphQlClient";
import type { GraphQlQueryResponseData } from "@octokit/graphql";

interface CommitNode {
 node: {
  committedDate: string;
 };
}

interface RepositoryCommitsResponse extends GraphQlQueryResponseData {
 repository: {
  defaultBranchRef: {
   target: {
    history: {
     edges: CommitNode[];
    };
   };
  };
 };
}

export interface Contribution {
 weekday: number;
 timeOfDay: string;
 count: number;
}

export interface Contributions {
 timeOfDayCounts: Contribution[];
 weekdaySums: { [key: string]: number };
}

async function getContributionsGraphQl(username: string): Promise<Contribution[]> {
 const contributions: Contribution[] = [];
 const repositories = await getRepositories(username);

 if (!repositories) {
  console.error("Failed to get repositories");
  return contributions;
 }

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
   const response = (await client(query)) as RepositoryCommitsResponse;
   if (!response || !response.repository || !response.repository.defaultBranchRef || !response.repository.defaultBranchRef.target || !response.repository.defaultBranchRef.target.history || !response.repository.defaultBranchRef.target.history.edges) {
    console.error("Invalid response received! [getContributionsGraphQl]");
    continue;
   }
   const commits = response.repository.defaultBranchRef.target.history.edges;

   for (const commit of commits) {
    const date = new Date(commit.node.committedDate);
    const weekday = date.getDay();
    const hour = date.getHours();
    const timeOfDay = getTimeOfDay(hour);

    const contribution: Contribution = {
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

export async function getCommits(username: string): Promise<Contributions> {
 try {
  const contributions: Contributions = { timeOfDayCounts: [], weekdaySums: {} };
  const weeks = await getContributionsGraphQl(username);

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const weekdayCounts = weeks.reduce(
   (acc, week) => {
    const key = week.weekday;
    if (!acc[key]) {
     acc[key] = {
      weekday: weekdays[key],
      counts: [],
      count: 0,
     };
    }

    acc[key].counts.push(week.count);
    acc[key].count += week.count;

    return acc;
   },
   {} as { [key: number]: { weekday: string; counts: number[]; count: number } },
  );

  const weekdaySums: { [key: string]: number } = {};

  for (const weekdayCount of Object.values(weekdayCounts)) {
   weekdaySums[weekdayCount.weekday] = weekdayCount.count;
  }

  const timeOfDayCounts = weeks.sort((a, b) => {
   if (a.weekday < b.weekday) return -1;
   if (a.weekday > b.weekday) return 1;
   if (a.timeOfDay < b.timeOfDay) return -1;
   if (a.timeOfDay > b.timeOfDay) return 1;
   return 0;
  });

  contributions.timeOfDayCounts = timeOfDayCounts;
  contributions.weekdaySums = weekdaySums;

  return contributions;
 } catch (error) {
  console.error(`Error in getCommits: ${error}`);
  return { timeOfDayCounts: [], weekdaySums: {} };
 }
}
