# B4X Forum Search Tool

A command-line tool for searching the B4X community forums directly from your terminal. Perfect for developers working with B4A, B4i, B4J, and B4R who need quick access to forum solutions without leaving their workflow.

## Installation

1. Ensure Node.js is installed (v14+)
2. No dependencies required - uses native Node.js modules

```bash
cd b4x-search
```

## Usage

### Basic Search

```bash
node b4x-search.js "search query"
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--limit N` | `-l N` | Maximum number of results (default: 10) |
| `--json` | `-j` | Output raw JSON instead of formatted text |
| `--help` | `-h` | Show help message |

### Examples

```bash
# Find CustomListView examples
node b4x-search.js "CustomListView example"

# Search with limited results
node b4x-search.js "httpjob post json" --limit 5

# Get JSON output for scripting
node b4x-search.js "Firebase Analytics B4A" --json

# Database examples
node b4x-search.js "SQL database insert"
```

## Output Format

Each result includes:
- **Title**: Thread title
- **URL**: Direct link to the thread
- **Author**: Post author
- **Date**: Post date (when available)
- **Forum**: Forum category (when available)
- **Preview**: Snippet of the content

## Fallback

If the direct search fails, the tool provides a Google site-search URL:

```
https://www.google.com/search?q=site:b4x.com/android/forum+query
```

## Use Cases

- Debugging B4X/B4A/B4i/B4J issues
- Looking up library documentation
- Finding code examples and tutorials
- Researching platform-specific solutions

## License

MIT
