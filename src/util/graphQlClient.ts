import { graphql } from "@octokit/graphql";

export const client = graphql.defaults({
 headers: {
  authorization: `token ${process.env.GITHUB_TOKEN}`,
 },
});
