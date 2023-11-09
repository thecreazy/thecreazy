const showdown = require("showdown");
const fs = require("fs");

function readMD(path) {
  const converter = new showdown.Converter({
    smartIndentationFix: true,
    openLinksInNewWindow: true,
    moreStyling: true,
    noHeaderId: true,
  });
  converter.setFlavor("github");

  const mdText = fs.readFileSync(path, "utf-8");

  const html = converter.makeHtml(mdText);

  let x = 0;
  const htmlWithSections = html.replace(
    /<h2[^>]*>([^<]+)<\/h2>/g,
    (_, p1) =>
      `${x++ > 0 ? "</section>" : ""}` +
      `<section id="${p1
        .toLowerCase()
        .replace(/ /g, "")
        .replace(":", "")}"><h2>${p1}</h2>`,
  );

  return htmlWithSections;
}

module.exports = readMD;
