import { client } from "@/util/graphQlClient";
import type { GraphQlQueryResponseData } from "@octokit/graphql";

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
  const publicRepositories = (await client(query)) as QueryResponse;
  if (!publicRepositories || !publicRepositories.user || !publicRepositories.user.repositories || !publicRepositories.user.repositories.nodes) {
   console.error("Invalid response received [getRepositories]");
   return null;
  }

  const publicRepositoriesSize = publicRepositories.user.repositories.nodes.reduce((acc, repo) => acc + repo.diskUsage, 0);

  return {
   publicRepositories: publicRepositories.user.repositories.nodes,
   id: publicRepositories.user.id,
   size: publicRepositoriesSize,
  };
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}
