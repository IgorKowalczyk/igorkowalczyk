import type { GraphQlQueryResponseData } from "@octokit/graphql";
import { getTimeOfDay } from "@/util/functions";
import { getRepositories } from "@/util/getRepositories";
import { client } from "@/util/graphQlClient";

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
  console.error("Failed to get repositories for user:", username);
  return contributions;
 }

 for (const repo of repositories.publicRepositories) {
  const query = `
      query ($username: String!, $repoName: String!, $authorId: ID!) {
        repository(owner: $username, name: $repoName) {
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 100, author: { id: $authorId }) {
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

  const variables = {
   username,
   repoName: repo.name,
   authorId: repositories.id,
  };

  try {
   const response = (await client(query, variables)) as RepositoryCommitsResponse;
   const commits = response?.repository?.defaultBranchRef?.target?.history?.edges;

   if (!commits) {
    console.error(`Invalid or empty response for repository: ${repo.name}`);
    continue;
   }

   for (const commit of commits) {
    const date = new Date(commit.node.committedDate);
    contributions.push({
     weekday: date.getDay(),
     timeOfDay: getTimeOfDay(date.getHours()),
     count: 1,
    });
   }
  } catch (error) {
   console.error(`Error executing query for repository "${repo.name}":`, error);
  }
 }

 return contributions;
}

export async function getCommits(username: string): Promise<Contributions> {
 try {
  const contributions: Contributions = { timeOfDayCounts: [], weekdaySums: {} };
  const weeks = await getContributionsGraphQl(username);

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Calculate weekday counts
  const weekdayCounts = weeks.reduce(
   (acc, week) => {
    const key = week.weekday;
    if (!acc[key]) {
     acc[key] = { weekday: weekdays[key], count: 0 };
    }
    acc[key].count += week.count;
    return acc;
   },
   {} as { [key: number]: { weekday: string; count: number } },
  );

  // Map weekday counts to weekday sums
  const weekdaySums = Object.values(weekdayCounts).reduce(
   (sums, { weekday, count }) => {
    sums[weekday] = count;
    return sums;
   },
   {} as { [key: string]: number },
  );

  // Sort contributions by weekday and time of day
  const timeOfDayCounts = weeks.sort((a, b) => a.weekday - b.weekday || a.timeOfDay.localeCompare(b.timeOfDay));

  contributions.timeOfDayCounts = timeOfDayCounts;
  contributions.weekdaySums = weekdaySums;

  return contributions;
 } catch (error) {
  console.error(`Error in getCommits: ${error}`);
  return { timeOfDayCounts: [], weekdaySums: {} };
 }
}
