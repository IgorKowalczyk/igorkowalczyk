import type { GraphQlQueryResponseData } from "@octokit/graphql";
import { client } from "@/util/graphQlClient";
import { Logger } from "./functions";

interface RepositoryNode {
 name: string;
 diskUsage: number;
}

interface QueryResponse extends GraphQlQueryResponseData {
 user: {
  id: string;
  repositories: {
   nodes: RepositoryNode[];
  };
 };
}

export async function getRepositories(username: string): Promise<{ publicRepositories: RepositoryNode[]; id: string; size: number } | null> {
 const time = performance.now();
 Logger("event", `Fetching repositories for ${username}`);

 const query = `
    query ($username: String!) {
      user(login: $username) {
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
  const variables = { username };
  const publicRepositories = (await client(query, variables)) as QueryResponse;

  if (!publicRepositories?.user?.repositories?.nodes) {
   console.error("Invalid response received [getRepositories]");
   return null;
  }

  const publicRepositoriesSize = publicRepositories.user.repositories.nodes.reduce((acc, repo) => acc + repo.diskUsage, 0);

  Logger("done", `Fetched repositories for ${username}`);
  Logger("event", `Time taken to fetch repositories: ${Math.round(performance.now() - time)}ms`);

  const result = {
   publicRepositories: publicRepositories.user.repositories.nodes,
   id: publicRepositories.user.id,
   size: publicRepositoriesSize,
  };

  return result;
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}
