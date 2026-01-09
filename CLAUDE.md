# Claude Code Instructions for B4X Search Tool

## Overview

This tool searches the B4X community forums (b4x.com) for solutions related to B4A (Android), B4i (iOS), B4J (Java), and B4R (Arduino/ESP) development.

## When to Use This Tool

Use this tool when:
- Debugging B4X platform issues
- Looking for library documentation or examples
- Researching error messages specific to B4X
- Finding code patterns and best practices
- Investigating compatibility issues (like desugaring, SDK versions)

## Usage

```bash
# Basic search
node b4x-search.js "search query"

# Limit results
node b4x-search.js "CustomListView tutorial" --limit 5

# JSON output (for parsing)
node b4x-search.js "httpjob example" --json
```

## Recommended Search Patterns

### Error Investigation
```bash
node b4x-search.js "ClassNotFoundException java.time" --limit 10
node b4x-search.js "Failed resolution Landroidx" --limit 10
```

### Library Usage
```bash
node b4x-search.js "OkHttpUtils2 POST JSON example"
node b4x-search.js "CustomListView lazy loading"
```

### Platform-Specific
```bash
node b4x-search.js "B4A targetSdkVersion 34"
node b4x-search.js "B4i iOS permissions"
```

## Interpreting Results

- **Forum category** indicates which platform (Android Questions, iOS Questions, etc.)
- **Author "Erel"** indicates official responses from the B4X creator
- **Date** helps determine if the solution is current or outdated

## Fallback Behavior

If the search fails, the tool provides a Google fallback URL. Use WebFetch or browser to access it.

## Important B4X Context

- B4X does NOT use Gradle - it has its own build system
- Manifest settings are in the `.b4a` project file, not `AndroidManifest.xml`
- B4X does not support Java library desugaring
- The official source of truth is always the B4X forums
