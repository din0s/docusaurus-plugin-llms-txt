# Docusaurus llms.txt Generator

A Docusaurus plugin that generates a concatenated markdown file from your documentation under `/llms.txt`. This plugin helps make your documentation AI-friendly by following the [llms.txt specification](https://llmstxt.org/), allowing AI models to better understand and process your documentation.

[![npm version](https://badge.fury.io/js/docusaurus-plugin-generate-llms-txt.svg)](https://www.npmjs.com/package/docusaurus-plugin-generate-llms-txt)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is llms.txt?

llms.txt is a standard that helps AI models better understand your documentation by providing it in a single, concatenated file. This can improve the quality of AI responses when users ask questions about your project.

## Installation

```bash
npm install docusaurus-plugin-generate-llms-txt
# or
yarn add docusaurus-plugin-generate-llms-txt
```

## Usage

Add the plugin to your `docusaurus.config.js`:

```js
// docusaurus.config.js
module.exports = {
  plugins: [
    [
      "docusaurus-plugin-generate-llms-txt",
      {
        outputFile: "llms.txt", // defaults to llms.txt if not specified
      },
    ],
    // other plugins...
  ],
};
```

The plugin will generate the llms.txt file in the following scenarios:

- When running `yarn start` (development mode)
- When running `yarn build` (production build)

You can also manually generate the file by running:

```bash
yarn docusaurus generate-llms-txt
```

### Configuration Options

| Option       | Type     | Default      | Description                 |
| ------------ | -------- | ------------ | --------------------------- |
| `outputFile` | `string` | `'llms.txt'` | The name of the output file |

## Documentation Structure

⚠️ **Note:** This plugin makes some assumptions about the structure of your docs:

- The `docs` directory contains your documentation
- Each category has a `_category_.yml` file that contains the category metadata
- Each page has frontmatter metadata
- For top-level Markdown pages, there is a `sidebar_position` field in the metadata

Example structure:

```
docs/
├── my-first-category/
│   ├── _category_.yml
│   ├── ...
│   ├── some-sub-page.md
├── my-second-category/
│   ├── _category_.yml
│   ├── ...
│   ├── some-sub-page.md
├── some-top-level-page.md
└── ...
```

## Development

To test the plugin locally:

1. Clone the repository
2. Install dependencies: `yarn install`
3. Run tests: `yarn test`
4. Link the package: `yarn link`
5. In your Docusaurus project: `yarn link docusaurus-plugin-generate-llms-txt`

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to:

- Open issues for bug reports or feature requests
- Submit pull requests
- Improve documentation
- Share feedback

Before contributing, please:

1. Check existing issues and PRs
2. For major changes, open an issue first
3. Add tests for new features
4. Ensure tests pass: `yarn test`
