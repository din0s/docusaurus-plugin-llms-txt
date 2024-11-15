const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

module.exports = function (context, options = {}) {
  const isDev = process.env.NODE_ENV === "development";
  const docsDir = path.join(context.siteDir, "docs");
  const staticDir = path.join(context.siteDir, "static");
  const outputFile = path.join(staticDir, options.outputFile || "llms.txt");

  function getCategoryPosition(dir) {
    const categoryFile = path.join(dir, "_category_.yml");
    if (fs.existsSync(categoryFile)) {
      const categoryData = yaml.load(fs.readFileSync(categoryFile, "utf8"));
      return categoryData.position || null;
    }
    return null;
  }

  function getSortedFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const items = [];

    files.forEach((file) => {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        const categoryPosition = getCategoryPosition(fullPath);
        items.push({
          type: "category",
          path: fullPath,
          position: categoryPosition,
        });
      } else if (file.name.endsWith(".md") || file.name.endsWith(".mdx")) {
        const content = fs.readFileSync(fullPath, "utf8");
        const sidebarPositionMatch = content.match(/sidebar_position:\s*(\d+)/);
        const position = sidebarPositionMatch
          ? parseInt(sidebarPositionMatch[1], 10)
          : null;
        items.push({ type: "file", path: fullPath, position });
      }
    });

    return items.sort(
      (a, b) => (a.position ?? Infinity) - (b.position ?? Infinity),
    );
  }

  function shouldIncludePage(content) {
    const metadataMatch = content.match(/^---([\s\S]*?)---/);
    if (metadataMatch) {
      const metadata = metadataMatch[1];
      const isDraft = /draft:\s*true/.test(metadata);
      const isHidden =
        /hidden:\s*true/.test(metadata) || /unlisted:\s*true/.test(metadata);

      if (isHidden) return false;
      if (isDraft) return isDev;
      return true;
    }
    return true;
  }

  function cleanContent(content) {
    return content.replace(/^---[\s\S]*?---\s*/, "").trim();
  }

  async function generateContent() {
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true });
    }

    const contentArray = [];

    function processDir(dir) {
      const sortedItems = getSortedFiles(dir);

      sortedItems.forEach((item) => {
        if (item.type === "file") {
          const content = fs.readFileSync(item.path, "utf8");
          if (shouldIncludePage(content)) {
            const relativePath = path.relative(docsDir, item.path);
            const fileNameWithPath = relativePath.slice(
              0,
              -path.extname(relativePath).length,
            );
            contentArray.push(
              `// File: ${fileNameWithPath}\n\n${cleanContent(content)}`,
            );
          }
        } else if (item.type === "category") {
          processDir(item.path);
        }
      });
    }

    processDir(docsDir);
    fs.writeFileSync(outputFile, contentArray.join("\n\n---\n\n"));
    console.log(
      `Generated: ${outputFile} (${isDev ? "development" : "production"} mode)`,
    );
  }

  return {
    name: "generate-llms-txt-plugin",

    // Expose the generate function through the plugin instance
    generateContent,

    async loadContent() {
      await generateContent();
    },

    async contentLoaded({ content, actions }) {},

    // Add a CLI command to invoke the generation
    extendCli(cli) {
      cli
        .command("generate-llms-txt")
        .description("Generate the LLMs text file")
        .action(async () => {
          await generateContent();
        });
    },
  };
};
