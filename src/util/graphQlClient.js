import { GraphQLClient } from "graphql-request";

export const client = new GraphQLClient("https://api.github.com/graphql", {
 headers: {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
 },
});
