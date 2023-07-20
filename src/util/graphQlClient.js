import { GraphQLClient } from "npm:graphql-request";
import { load } from "https://deno.land/std@0.195.0/dotenv/mod.ts";
const env = await load();

export const client = new GraphQLClient("https://api.github.com/graphql", {
 headers: {
  Authorization: `Bearer ${env["GITHUB_TOKEN"]}`,
 },
});
