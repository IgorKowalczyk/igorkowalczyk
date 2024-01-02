import { client } from "./graphQlClient.js";

async function getTotalYears(username) {
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
  const data = await client.request(query);
  if (!data || !data.user || !data.user.contributionsCollection || !data.user.contributionsCollection.contributionYears) {
   console.error("Invalid response received");
   return null;
  }
  return data.user.contributionsCollection.contributionYears;
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}

async function getTotalContributionsForYear(username, year) {
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
  const data = await client.request(query);
  if (!data || !data.user || !data.user.contributionsCollection || !data.user.contributionsCollection.contributionCalendar || !data.user.contributionsCollection.contributionCalendar.totalContributions) {
   console.error("Invalid response received");
   return null;
  }
  return data.user.contributionsCollection.contributionCalendar.totalContributions;
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}

export async function getTotalContributionsForYears(username) {
 try {
  const results = [];
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
