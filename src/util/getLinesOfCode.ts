import type { GraphQlQueryResponseData } from "@octokit/graphql";
import { client } from "@/util/graphQlClient";
import { Logger } from "./functions";

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
    query ($username: String!, $cursor: String) {
      user(login: $username) {
        repositories(first: 10, after: $cursor, isFork: false) {
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
  const variables = { username, cursor };
  return (await client(query, variables)) as QueryResponse;
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}

export async function getLinesOfCode(username: string, cursor: string | null = null, initialLinesOfCode = 0): Promise<number> {
 try {
  Logger("event", `Getting lines of code for ${username}`);
  const response = await Query(username, cursor);
  let totalLinesOfCode = initialLinesOfCode;

  if (!response?.user?.repositories) {
   console.error("Invalid response received [getLinesOfCode]");
   return totalLinesOfCode;
  }

  const nodes = response.user.repositories.edges;
  for (const node of nodes) {
   const historyNodes = node.node?.defaultBranchRef?.target?.history?.nodes;
   if (!historyNodes) continue;

   const netLinesOfCode = historyNodes.reduce((total, currentNode) => {
    return total + currentNode.additions - currentNode.deletions;
   }, 0);

   totalLinesOfCode += netLinesOfCode;
  }

  if (response.user.repositories.pageInfo.hasNextPage) {
   return getLinesOfCode(username, response.user.repositories.pageInfo.endCursor, totalLinesOfCode);
  }

  Logger("done", `Got lines of code for ${username} - ${totalLinesOfCode}`);
  return totalLinesOfCode;
 } catch (error) {
  console.error(`Error in getLinesOfCode for user "${username}": ${error}`);
  return initialLinesOfCode;
 }
}
