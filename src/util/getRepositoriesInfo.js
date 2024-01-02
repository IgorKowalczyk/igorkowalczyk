import { client } from "./graphQlClient.js";

export async function getRepositories(username) {
 const query = `
    query {
      user(login: "${username}") {
        repositories(first: 100, orderBy: {field: NAME, direction: ASC}, privacy: PUBLIC, ownerAffiliations: OWNER) {
          nodes {
            name
            diskUsage
          }
        }
        id
      }
    }
  `;

 try {
  const publicRepositories = await client.request(query);
  if (!publicRepositories || !publicRepositories.user || !publicRepositories.user.repositories || !publicRepositories.user.repositories.nodes) {
   console.error("Invalid response received");
   return null;
  }
  return {
   publicRepositories: publicRepositories.user.repositories.nodes,
   id: publicRepositories.user.id,
  };
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}

export async function getRepositoriesInfo(username) {
 try {
  const repositories = await getRepositories(username);

  if (!repositories || !repositories.publicRepositories) {
   console.error("Invalid repositories data");
   return null;
  }

  const publicRepositoriesSize = repositories.publicRepositories.reduce((acc, repo) => acc + repo.diskUsage, 0);

  return {
   publicRepositories: repositories.publicRepositories.length,
   size: publicRepositoriesSize,
   id: repositories.id,
  };
 } catch (error) {
  console.error(`Error in getRepositoriesInfo: ${error}`);
  return null;
 }
}
