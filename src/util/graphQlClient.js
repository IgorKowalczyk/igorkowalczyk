import { GraphQLClient } from "npm:graphql-request";

export const client = new GraphQLClient("https://api.github.com/graphql", {
 headers: {
  Authorization: `Bearer ${Deno.env.get("GITHUB_TOKEN")}`,
 },
});
