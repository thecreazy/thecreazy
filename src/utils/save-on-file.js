const fs = require("fs");
const path = require("path");

function saveOnFile({name, folder, text}){
    if (!fs.existsSync(folder)){
        fs.mkdirSync(folder);
    }
    fs.writeFileSync( path.join(folder, name), text, "utf8")
}

module.exports = saveOnFile;