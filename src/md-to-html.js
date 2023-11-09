const path = require("path");
const readMD = require("./utils/read-md");
const saveOnFile = require("./utils/save-on-file");

(function(){
    const mdInfos = readMD(path.join(__dirname, "..", "README.md"));
    const success = saveOnFile({
        text: mdInfos,
        name: "index.html",
        folder: path.join(__dirname, "..", "dist")
    })
    console.log(success);
})();

