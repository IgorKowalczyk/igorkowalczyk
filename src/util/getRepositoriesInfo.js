import { client } from "./graphQlClient.js";

export async function getRepositories(username) {
 const publicQuery = `
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

 const privateQuery = `
    query {
      user(login: "${username}") {
        repositories(first: 100, orderBy: {field: NAME, direction: ASC}, privacy: PRIVATE, ownerAffiliations: OWNER) {
          nodes {
            name
            diskUsage
          }
        }
      }
    }
  `;

 try {
  const [publicRepositories, privateRepositories] = await Promise.all([client.request(publicQuery), client.request(privateQuery)]);
  if (
   !publicRepositories || !publicRepositories.user || !publicRepositories.user.repositories || !publicRepositories.user.repositories.nodes ||
   !privateRepositories || !privateRepositories.user || !privateRepositories.user.repositories || !privateRepositories.user.repositories.nodes
  ) {
   console.error("Invalid response received");
   return null;
  }
  return {
   publicRepositories: publicRepositories.user.repositories.nodes,
   privateRepositories: privateRepositories.user.repositories.nodes,
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
  if (!repositories || !repositories.publicRepositories || !repositories.privateRepositories) {
   console.error("Invalid repositories data");
   return null;
  }
  const publicRepositoriesSize = repositories.publicRepositories.reduce((acc, repo) => {
   acc += repo.diskUsage;
   return acc;
  }, 0);

  const privateRepositoriesSize = repositories.privateRepositories.reduce((acc, repo) => {
   acc += repo.diskUsage;
   return acc;
  }, 0);

  return {
   publicRepositories: repositories.publicRepositories.length,
   privateRepositories: repositories.privateRepositories.length,
   size: publicRepositoriesSize + privateRepositoriesSize,
   id: repositories.id,
  };
 } catch (error) {
  console.error(`Error in getRepositoriesInfo: ${error}`);
  return null;
 }
}
