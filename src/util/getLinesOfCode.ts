import { client } from "@/util/graphQlClient";
import type { GraphQlQueryResponseData } from "@octokit/graphql";

interface RepositoryNode {
 node: {
  defaultBranchRef: {
   target: {
    history: {
     nodes: Array<{
      additions: number;
      deletions: number;
     }>;
    };
   };
  };
 };
}

interface QueryResponse extends GraphQlQueryResponseData {
 user: {
  repositories: {
   edges: RepositoryNode[];
   pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
   };
  };
 };
}

async function Query(username: string, cursor: string | null): Promise<QueryResponse | null> {
 const query = `
    query {
      user(login: "${username}") {
        repositories(first: 10, ${cursor ? `after: "${cursor}",` : ""} isFork: false) {
          edges {
            node {
              defaultBranchRef {
                target {
                  ... on Commit {
                    history {
                      nodes {
                        additions
                        deletions
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `;
 try {
  return (await client(query)) as QueryResponse;
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}

export async function getLinesOfCode(username: string, cursor: string | null = null, initialLinesOfCode = 0): Promise<number> {
 try {
  const response = await Query(username, cursor);
  let totalLinesOfCode: number = initialLinesOfCode;
  if (!response || !response.user || !response.user.repositories) {
   console.error("Invalid response received [getLinesOfCode]");
   return totalLinesOfCode;
  }
  const nodes = response.user.repositories.edges;
  for (const node of nodes) {
   if (!node.node?.defaultBranchRef?.target?.history?.nodes) continue;
   const additions = node.node.defaultBranchRef.target.history.nodes.reduce((total, currentNode) => {
    return total + currentNode.additions;
   }, 0);
   const deletions = node.node.defaultBranchRef.target.history.nodes.reduce((total, currentNode) => {
    return total + currentNode.deletions;
   }, 0);
   totalLinesOfCode += additions - deletions;
  }
  if (response.user.repositories.pageInfo.hasNextPage) {
   return getLinesOfCode(username, response.user.repositories.pageInfo.endCursor, totalLinesOfCode);
  }
  return totalLinesOfCode;
 } catch (error) {
  console.error(`Error in getLinesOfCode: ${error}`);
  return initialLinesOfCode;
 }
}
