const fs = require("fs");
const fetch = require("node-fetch");

const date = new Date();
const open = `<!-- STATS-START -->`;
const close = `<!-- STATS-END -->`;
try {
 const fetchData = async () => {
  const user = await fetch("https://api.github.com/users/igorkowalczyk").then((res) => res.json());
  const name = user.name;
  const age = user.created_at;
  return `${name} ${age}
   <i>Last updated on ${date.getDate()}${date.getDate()===1?"st":date.getDate()===2?"nd":date.getDate()===3?"rd":"th"} ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()]} ${date.getFullYear()} using Github Actions</i>
  `
 };

 (async () => {
  const readme = fs.readFileSync("./README.md", "utf8");
  const indexBefore = readme.indexOf(open) + open.length;
  const indexAfter = readme.indexOf(close);
  const readmeContentChunkBreakBefore = readme.substring(0, indexBefore);
  const readmeContentChunkBreakAfter = readme.substring(indexAfter);
  const data = await fetchData();
  const readmeNew = `
   ${readmeContentChunkBreakBefore}
   ${data}
   ${readmeContentChunkBreakAfter}
  `;
  fs.writeFileSync("./README.md", readmeNew.trim());
 })();
} catch (err) {
 return console.error(err);
}
