const showdown = require("showdown");
const fs = require("fs");

function readMD(path) {
  const converter = new showdown.Converter({
    smartIndentationFix: true,
    openLinksInNewWindow: true,
    moreStyling: true,
    customizedHeaderId: true,
  });
  const mdText = fs.readFileSync(path, "utf-8");
  const html = converter.makeHtml(mdText);
  return html;
}

module.exports = readMD;
