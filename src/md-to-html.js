const path = require("path");
const readMD = require("./utils/read-md");
const saveOnFile = require("./utils/save-on-file");
const getHeadTags = require("./utils/get-head-tags");

(function main() {
  const mdInfos = readMD(path.join(__dirname, "..", "README.md"));
  const headTags = getHeadTags();
  const htmlStructure = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                ${headTags}
            </head>
            <body>
                <button id="theme-switch" aria-label="switch theme"></button>
                ${mdInfos}
                <script>
                  document.getElementById("theme-switch").addEventListener('click', function(){
                    const body = document.querySelector("body")
                    if(body.getAttribute('data-theme') !== "dark") body.setAttribute("data-theme", "dark");
                    else body.setAttribute("data-theme", 'default');
                  }, false);
                </script>
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
