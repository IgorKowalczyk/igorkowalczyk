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

 const [publicRepositories, privateRepositories] = await Promise.all([client.request(publicQuery), client.request(privateQuery)]);

 return {
  publicRepositories: publicRepositories.user.repositories.nodes,
  privateRepositories: privateRepositories.user.repositories.nodes,
  id: publicRepositories.user.id,
 };
}

export async function getRepositoriesInfo(username) {
 const repositories = await getRepositories(username);

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
}
