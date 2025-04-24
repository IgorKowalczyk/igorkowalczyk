import { client } from "@/util/graphQlClient";
import type { GraphQlQueryResponseData } from "@octokit/graphql";

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

export async function getTotalYears(username: string): Promise<number[] | null> {
 const query = `
    query {
      user(login: "${username}") {
        contributionsCollection {
          contributionYears
        }
      }
    }
  `;

 try {
  const data = (await client(query)) as ContributionYearsResponse;
  if (!data || !data.user || !data.user.contributionsCollection || !data.user.contributionsCollection.contributionYears) {
   console.error("Invalid response received [getTotalYears]");
   return null;
  }
  return data.user.contributionsCollection.contributionYears;
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}

export async function getTotalContributionsForYear(username: string, year: number): Promise<number | null> {
 const from = `${year}-01-01T00:00:00Z`;
 const to = `${year}-12-31T23:59:59Z`;

 const query = `
    query {
      user(login: "${username}") {
        contributionsCollection(from: "${from}", to: "${to}") {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }
  `;

 try {
  const data = (await client(query)) as TotalContributionsResponse;
  if (!data || !data.user || !data.user.contributionsCollection || !data.user.contributionsCollection.contributionCalendar || !data.user.contributionsCollection.contributionCalendar.totalContributions) {
   console.error("Invalid response received [getTotalContributionsForYear]");
   return null;
  }
  return data.user.contributionsCollection.contributionCalendar.totalContributions;
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}

interface ContributionResult {
 year: number;
 totalContributions: number;
}

export async function getTotalContributionsForYears(username: string): Promise<ContributionResult[] | null> {
 try {
  const results: ContributionResult[] = [];
  const years = await getTotalYears(username);
  if (!years) {
   console.error("Invalid years data");
   return null;
  }
  years.sort();
  const startYear = years[0];
  const endYear = years[years.length - 1];
  for (let year = startYear; year <= endYear; year++) {
   const totalContributions = await getTotalContributionsForYear(username, year);
   if (totalContributions !== null) {
    results.push({ year, totalContributions });
   }
  }
  return results;
 } catch (error) {
  console.error(`Error in getTotalContributionsForYears: ${error}`);
  return null;
 }
}
