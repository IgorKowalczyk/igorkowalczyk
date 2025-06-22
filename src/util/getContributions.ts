import type { GraphQlQueryResponseData } from "@octokit/graphql";
import { client } from "@/util/graphQlClient";
import { Logger } from "./functions";

interface ContributionYearsResponse extends GraphQlQueryResponseData {
 user: {
  contributionsCollection: {
   contributionYears: number[];
  };
 };
}

interface TotalContributionsResponse extends GraphQlQueryResponseData {
 user: {
  contributionsCollection: {
   contributionCalendar: {
    totalContributions: number;
   };
  };
 };
}

interface ContributionResult {
 year: number;
 totalContributions: number;
}

export async function getTotalYears(username: string): Promise<number[] | null> {
 const query = `
    query ($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionYears
        }
      }
    }
  `;

 try {
  const variables = { username };
  const data = (await client(query, variables)) as ContributionYearsResponse;
  return data?.user?.contributionsCollection?.contributionYears || null;
 } catch (error) {
  console.error(`Error executing query [getTotalYears]: ${error}`);
  return null;
 }
}

export async function getTotalContributionsForYear(username: string, year: number): Promise<number | null> {
 const query = `
    query ($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }
  `;

 const variables = {
  username,
  from: `${year}-01-01T00:00:00Z`,
  to: `${year}-12-31T23:59:59Z`,
 };

 try {
  const data = (await client(query, variables)) as TotalContributionsResponse;
  return data?.user?.contributionsCollection?.contributionCalendar?.totalContributions ?? null;
 } catch (error) {
  console.error(`Error executing query [getTotalContributionsForYear]: ${error}`);
  return null;
 }
}

export async function getTotalContributionsForYears(username: string): Promise<ContributionResult[] | null> {
 try {
  Logger("event", `Getting total contributions for ${username}`);
  const years = await getTotalYears(username);
  if (!years) {
   console.error("Invalid years data");
   return null;
  }

  // Fetch contributions for all years concurrently
  const contributions = await Promise.all(
   years.map(async (year) => {
    const totalContributions = await getTotalContributionsForYear(username, year);
    return totalContributions !== null ? { year, totalContributions } : null;
   }),
  );

  const results = contributions.filter((result): result is ContributionResult => result !== null);

  Logger("done", `Got total contributions for ${username}`);
  return results;
 } catch (error) {
  console.error(`Error in getTotalContributionsForYears: ${error}`);
  return null;
 }
}
