# Example Agent Usage for B4X Search Tool

This document shows how AI agents can effectively use the B4X search tool.

## Agent Integration Examples

### Example 1: Debugging a Crash

**User Query:** "My app crashes with ClassNotFoundException for java.time.Duration"

**Agent Action:**
```bash
node b4x-search.js "java.time.Duration ClassNotFoundException" --limit 10
```

**Agent Follow-up:** Parse results, identify that this is a known issue with Google Play Services on older Android versions, and recommend raising minSdkVersion to 26.

---

### Example 2: Learning a Library

**User Query:** "How do I use CustomListView in B4A?"

**Agent Action:**
```bash
node b4x-search.js "CustomListView tutorial example" --limit 5
```

**Agent Follow-up:** Provide links to relevant tutorials and summarize key patterns found in results.

---

### Example 3: Error Message Research

**User Query:** "What does 'Failed resolution of Landroidx/work/impl/WorkDatabase' mean?"

**Agent Action:**
```bash
node b4x-search.js "WorkDatabase Failed resolution" --limit 10
```

**Agent Follow-up:** Identify required #AdditionalJar directives from forum solutions.

---

## Multi-Search Pattern

For complex issues, run multiple searches:

```bash
# Search for the specific error
node b4x-search.js "specific error message" --limit 5

# Search for the general topic
node b4x-search.js "general topic area" --limit 5

# Search for official guidance
node b4x-search.js "Erel official recommendation topic" --limit 5
```

---

## JSON Output for Programmatic Use

When agents need to parse results programmatically:

```bash
node b4x-search.js "query" --json
```

Returns:
```json
{
  "query": "query",
  "result_count": 5,
  "results": [
    {
      "title": "Thread Title",
      "url": "https://www.b4x.com/android/forum/threads/...",
      "snippet": "Preview text...",
      "author": "Username",
      "date": "2024-01-15",
      "forum": "Android Questions"
    }
  ]
}
```

---

## Best Practices for Agents

1. **Start broad, then narrow** - If initial search yields no results, try simpler queries
2. **Check the author** - Responses from "Erel" are authoritative
3. **Check the date** - Older solutions may be outdated for current SDK requirements
4. **Use fallback** - If search fails, use the provided Google fallback URL
5. **Cross-reference** - For critical issues, verify with multiple search queries
