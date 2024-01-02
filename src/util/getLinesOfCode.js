import { client } from "./graphQlClient.js";

async function Query(username, cursor) {
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
  return await client.request(query);
 } catch (error) {
  console.error(`Error executing query: ${error}`);
  return null;
 }
}

export async function getLinesOfCode(username, cursor = null, linesOfCode = 0) {
 try {
  const response = await Query(username, cursor);
  if (!response || !response.user || !response.user.repositories) {
   console.error("Invalid response received");
   return linesOfCode;
  }
  const nodes = response.user.repositories.edges;
  for (const node of nodes) {
   if (!node.node?.defaultBranchRef?.target?.history?.nodes) continue;
   const additions = node.node.defaultBranchRef.target.history.nodes.reduce((acc, node) => {
    acc += node.additions;
    return acc;
   }, 0);
   const deletions = node.node.defaultBranchRef.target.history.nodes.reduce((acc, node) => {
    acc += node.deletions;
    return acc;
   }, 0);
   linesOfCode += additions + deletions;
  }
  if (response.user.repositories.pageInfo.hasNextPage) {
   return getLinesOfCode(username, response.user.repositories.pageInfo.endCursor, linesOfCode);
  } else {
   return linesOfCode;
  }
 } catch (error) {
  console.error(`Error in getLinesOfCode: ${error}`);
  return linesOfCode;
 }
}
