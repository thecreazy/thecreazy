const path = require("path");
const readMD = require("./utils/read-md");
const saveOnFile = require("./utils/save-on-file");
const getHeadTags = require("./utils/get-head-tags");

(function () {
  const mdInfos = readMD(path.join(__dirname, "..", "README.md"));
  const headTags = getHeadTags();
  const htmlStructure = `
        <html lang="en">
            <head>
                ${headTags}
            </head>
            <body>
                ${mdInfos}
            </body>
        </html>
    `;
  const success = saveOnFile({
    text: htmlStructure,
    name: "index.html",
    folder: path.join(__dirname, "..", "dist"),
  });
  console.log(success ? "build ok" : "build ko");
})();
