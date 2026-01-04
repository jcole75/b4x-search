#!/usr/bin/env node
/**
 * B4X Forum Search Tool
 * Searches the B4X community forums and returns parsed results.
 *
 * Usage:
 *   node b4x-search.js "search query" [--limit N] [--json]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'https://www.b4x.com/android/forum';

/**
 * Make an HTTP/HTTPS request with redirect following
 */
function fetchUrl(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const maxRedirects = options.maxRedirects || 5;
    let redirectCount = 0;

    function doRequest(currentUrl) {
      const parsedUrl = new URL(currentUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const lib = isHttps ? https : http;

      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...options.headers
        }
      };

      if (options.cookies) {
        reqOptions.headers['Cookie'] = options.cookies;
      }

      const req = lib.request(reqOptions, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectCount >= maxRedirects) {
            reject(new Error('Too many redirects'));
            return;
          }
          redirectCount++;
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith('http')) {
            redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
          }
          // Capture cookies from redirect
          const setCookies = res.headers['set-cookie'];
          if (setCookies) {
            options.cookies = (options.cookies || '') + '; ' +
              setCookies.map(c => c.split(';')[0]).join('; ');
          }
          doRequest(redirectUrl);
          return;
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            finalUrl: currentUrl
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    }

    doRequest(url);
  });
}

/**
 * Extract text content from HTML, stripping tags
 */
function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse search results from HTML
 */
function parseSearchResults(html, limit) {
  const results = [];

  // Pattern 1: XenForo 2.x search results (block-row items)
  const blockRowPattern = /<li[^>]*class="[^"]*block-row[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = blockRowPattern.exec(html)) !== null && results.length < limit) {
    const itemHtml = match[1];
    const result = extractResultFromItem(itemHtml);
    if (result && result.title) {
      results.push(result);
    }
  }

  // Pattern 2: Thread links with content (fallback)
  if (results.length === 0) {
    const threadPattern = /<a[^>]*href="([^"]*\/threads\/[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    const seenUrls = new Set();

    while ((match = threadPattern.exec(html)) !== null && results.length < limit) {
      const href = match[1];
      const title = stripHtml(match[2]).trim();

      if (seenUrls.has(href) || title.length < 5) continue;
      seenUrls.add(href);

      const fullUrl = href.startsWith('http') ? href : BASE_URL + href;
      results.push({
        title,
        url: fullUrl,
        snippet: '',
        author: '',
        date: ''
      });
    }
  }

  return results;
}

/**
 * Extract data from a single result item
 */
function extractResultFromItem(itemHtml) {
  const result = {};

  // Title and URL - look for contentRow-title or thread links
  let titleMatch = itemHtml.match(/<a[^>]*class="[^"]*contentRow-title[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
  if (!titleMatch) {
    titleMatch = itemHtml.match(/<h3[^>]*class="[^"]*contentRow-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
  }
  if (!titleMatch) {
    titleMatch = itemHtml.match(/<a[^>]*href="([^"]*\/threads\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
  }

  if (titleMatch) {
    result.url = titleMatch[1].startsWith('http') ? titleMatch[1] : BASE_URL + titleMatch[1];
    result.title = stripHtml(titleMatch[2]);
  }

  if (!result.title || result.title.length < 3) return null;

  // Snippet
  const snippetMatch = itemHtml.match(/<div[^>]*class="[^"]*contentRow-snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (snippetMatch) {
    result.snippet = stripHtml(snippetMatch[1]).substring(0, 300);
  } else {
    result.snippet = '';
  }

  // Author
  const authorMatch = itemHtml.match(/<a[^>]*data-user-id="[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                      itemHtml.match(/<a[^>]*class="[^"]*username[^"]*"[^>]*>([^<]+)<\/a>/i);
  result.author = authorMatch ? stripHtml(authorMatch[1]) : '';

  // Date
  const timeMatch = itemHtml.match(/<time[^>]*datetime="([^"]*)"[^>]*>/i) ||
                    itemHtml.match(/<time[^>]*>([^<]*)<\/time>/i);
  result.date = timeMatch ? timeMatch[1] : '';

  // Forum category
  const forumMatch = itemHtml.match(/<a[^>]*href="[^"]*\/forums\/[^"]*"[^>]*>([^<]+)<\/a>/i);
  if (forumMatch) {
    result.forum = stripHtml(forumMatch[1]);
  }

  return result;
}

/**
 * Search the B4X forum
 */
async function searchB4xForum(query, limit = 10) {
  try {
    // First, get the search page to obtain CSRF token
    const searchPageRes = await fetchUrl(`${BASE_URL}/search/`);

    // Extract CSRF token
    const tokenMatch = searchPageRes.body.match(/<input[^>]*name="_xfToken"[^>]*value="([^"]*)"/i);
    const xfToken = tokenMatch ? tokenMatch[1] : '';

    // Extract cookies
    const cookies = searchPageRes.headers['set-cookie']
      ? searchPageRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ')
      : '';

    // Build search form data
    const formData = new URLSearchParams({
      keywords: query,
      order: 'relevance',
      search_type: 'thread',
      _xfToken: xfToken
    }).toString();

    // Submit search
    const searchRes = await fetchUrl(`${BASE_URL}/search/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData)
      },
      cookies: cookies
    }, formData);

    // Parse results
    const results = parseSearchResults(searchRes.body, limit);

    return {
      query,
      result_count: results.length,
      results
    };
  } catch (error) {
    return {
      error: error.message,
      query,
      results: [],
      google_fallback: `https://www.google.com/search?q=site:b4x.com/android/forum+${encodeURIComponent(query)}`
    };
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
B4X Forum Search Tool

Usage:
  node b4x-search.js "search query" [options]

Options:
  --limit N, -l N    Maximum results (default: 10)
  --json, -j         Output raw JSON
  --help, -h         Show this help

Examples:
  node b4x-search.js "CustomListView tutorial"
  node b4x-search.js "httpjob example" --limit 5
  node b4x-search.js "SQL database" --json
`);
    process.exit(0);
  }

  // Parse arguments
  let query = '';
  let limit = 10;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' || args[i] === '-l') {
      limit = parseInt(args[++i], 10) || 10;
    } else if (args[i] === '--json' || args[i] === '-j') {
      jsonOutput = true;
    } else if (!args[i].startsWith('-')) {
      query = args[i];
    }
  }

  if (!query) {
    console.error('Error: No search query provided');
    process.exit(1);
  }

  const results = await searchB4xForum(query, limit);

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    if (results.error) {
      console.log(`\nError: ${results.error}`);
      if (results.google_fallback) {
        console.log(`\nGoogle fallback: ${results.google_fallback}`);
      }
      process.exit(1);
    }

    console.log(`\n=== B4X Forum Search: '${query}' ===`);
    console.log(`Found ${results.result_count} results\n`);

    results.results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   URL: ${r.url}`);
      if (r.author) {
        console.log(`   Author: ${r.author}${r.date ? ' | Date: ' + r.date : ''}`);
      }
      if (r.forum) {
        console.log(`   Forum: ${r.forum}`);
      }
      if (r.snippet) {
        console.log(`   Preview: ${r.snippet.substring(0, 150)}...`);
      }
      console.log('');
    });

    if (results.results.length === 0) {
      console.log(`No results found. Try Google:\nhttps://www.google.com/search?q=site:b4x.com/android/forum+${encodeURIComponent(query)}`);
    }
  }
}

main().catch(console.error);
