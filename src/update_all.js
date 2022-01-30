// WIP

const posts = require("./blog/update");

(async () => {
console.log(await posts("https://igorkowalczyk.github.io/blog/feeds/feed.xml"))
})()