const fs = require("fs-extra");
const path = require("path");
const plugin = require("../index");

describe("docusaurus-plugin-generate-llms-txt", () => {
  const siteDir = path.join(__dirname, "__fixtures__");
  const docsDir = path.join(siteDir, "docs");
  const staticDir = path.join(siteDir, "static");
  const outputFile = path.join(staticDir, "llms.txt");

  beforeEach(async () => {
    try {
      // Create test directories and files
      await fs.ensureDir(docsDir);
      await fs.ensureDir(staticDir);

      // Create test markdown files
      await fs.writeFile(
        path.join(docsDir, "test1.md"),
        `---
sidebar_position: 1
---
# Test 1
Content 1`,
      );

      await fs.writeFile(
        path.join(docsDir, "test2.md"),
        `---
sidebar_position: 2
draft: true
---
# Test 2
Content 2`,
      );

      await fs.writeFile(
        path.join(docsDir, "test3.md"),
        `---
sidebar_position: 3
hidden: true
---
# Test 3
Content 3`,
      );
    } catch (error) {
      // Clean up if setup fails
      await fs.remove(siteDir);
      throw error;
    }
  });

  afterEach(async () => {
    // Clean up test files
    await fs.remove(siteDir);
  });

  it("generates output file in development mode", async () => {
    process.env.NODE_ENV = "development";

    const pluginInstance = plugin({ siteDir }, {});

    await pluginInstance.loadContent();

    const outputContent = await fs.readFile(outputFile, "utf8");

    // In dev mode, should include regular and draft pages, but not hidden
    expect(outputContent).toContain("Content 1");
    expect(outputContent).toContain("Content 2");
    expect(outputContent).not.toContain("Content 3");
  });

  it("generates output file in production mode", async () => {
    process.env.NODE_ENV = "production";

    const pluginInstance = plugin({ siteDir }, {});

    await pluginInstance.loadContent();

    const outputContent = await fs.readFile(outputFile, "utf8");

    // In prod mode, should include only regular pages
    expect(outputContent).toContain("Content 1");
    expect(outputContent).not.toContain("Content 2");
    expect(outputContent).not.toContain("Content 3");
  });

  it("respects sidebar position ordering", async () => {
    process.env.NODE_ENV = "development";

    const pluginInstance = plugin({ siteDir }, {});

    await pluginInstance.loadContent();

    const outputContent = await fs.readFile(outputFile, "utf8");
    const test1Index = outputContent.indexOf("Content 1");
    const test2Index = outputContent.indexOf("Content 2");

    expect(test1Index).toBeLessThan(test2Index);
  });

  it("handles category positions", async () => {
    // Create category with nested docs
    await fs.ensureDir(path.join(docsDir, "category1"));
    await fs.writeFile(
      path.join(docsDir, "category1", "_category_.yml"),
      "position: 1",
    );
    await fs.writeFile(
      path.join(docsDir, "category1", "doc1.md"),
      `---
sidebar_position: 1
---
# Category Doc 1
Category Content 1`,
    );

    process.env.NODE_ENV = "development";
    const pluginInstance = plugin({ siteDir }, {});
    await pluginInstance.loadContent();

    const outputContent = await fs.readFile(outputFile, "utf8");

    // Actually test the category content and position
    expect(outputContent).toContain("Category Content 1");
    const categoryDocIndex = outputContent.indexOf("Category Content 1");
    const regularDocIndex = outputContent.indexOf("Content 1");
    expect(categoryDocIndex).toBeLessThan(regularDocIndex);
  });

  it("handles errors gracefully", async () => {
    // Remove read permissions from docs directory
    await fs.chmod(docsDir, 0o000);

    const pluginInstance = plugin({ siteDir }, {});

    await expect(pluginInstance.loadContent()).rejects.toThrow();

    // Restore permissions for cleanup
    await fs.chmod(docsDir, 0o777);
  });

  it("handles files without frontmatter", async () => {
    await fs.writeFile(
      path.join(docsDir, "no-frontmatter.md"),
      `# No Frontmatter
Simple content without frontmatter`,
    );

    const pluginInstance = plugin({ siteDir }, {});
    await pluginInstance.loadContent();

    const outputContent = await fs.readFile(outputFile, "utf8");
    expect(outputContent).toContain("Simple content without frontmatter");
  });

  it("handles files with invalid frontmatter", async () => {
    await fs.writeFile(
      path.join(docsDir, "invalid-frontmatter.md"),
      `---
sidebar_position: "not a number"
---
# Invalid Frontmatter
Content with invalid frontmatter`,
    );

    const pluginInstance = plugin({ siteDir }, {});
    await pluginInstance.loadContent();

    const outputContent = await fs.readFile(outputFile, "utf8");
    expect(outputContent).toContain("Content with invalid frontmatter");
  });

  it("handles empty directories", async () => {
    await fs.ensureDir(path.join(docsDir, "empty-dir"));

    const pluginInstance = plugin({ siteDir }, {});
    await pluginInstance.loadContent();

    // Should not throw and should still contain other content
    const outputContent = await fs.readFile(outputFile, "utf8");
    expect(outputContent).toContain("Content 1");
  });

  it("handles missing docs directory gracefully", async () => {
    // Remove the docs directory
    await fs.remove(docsDir);

    const pluginInstance = plugin({ siteDir }, {});
    await expect(pluginInstance.loadContent()).rejects.toThrow(
      /no such file or directory/,
    );
  });

  it("handles file read errors gracefully", async () => {
    // Create an unreadable file
    const unreadableFile = path.join(docsDir, "unreadable.md");
    await fs.writeFile(unreadableFile, "Some content");
    await fs.chmod(unreadableFile, 0o000);

    const pluginInstance = plugin({ siteDir }, {});
    await expect(pluginInstance.loadContent()).rejects.toThrow(
      /permission denied/,
    );

    // Restore permissions for cleanup
    await fs.chmod(unreadableFile, 0o777);
  });

  it("handles custom outputFile option", async () => {
    const customOptions = {
      outputFile: "custom-llms.txt",
    };

    const pluginInstance = plugin({ siteDir }, customOptions);
    await pluginInstance.loadContent();

    const customOutputPath = path.join(staticDir, customOptions.outputFile);
    const outputContent = await fs.readFile(customOutputPath, "utf8");

    // Verify the content is written to the custom file path
    expect(outputContent).toContain("Content 1");

    // Verify the default output file wasn't created
    await expect(fs.access(outputFile)).rejects.toThrow();
  });
});
