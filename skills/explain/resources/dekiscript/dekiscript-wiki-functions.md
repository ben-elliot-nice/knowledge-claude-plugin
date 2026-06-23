---
topic: dekiscript-wiki-functions
description: The wiki.* and web.* function namespaces — page queries, API access, HTTP fetch
group: dekiscript
---

## dekiscript-wiki-functions — wiki.* and web.* Functions

### wiki.* — Core page/site operations

#### wiki.getsearch(query, max, sortBy)

Full-text search returning a list of page objects. Supports tag filtering.

```dekiscript
var pages = wiki.getsearch("tag:stage:pending-review", 50, "-date");
```

- `sortBy` values: `"date"`, `"-date"`, `"title"`, `"-title"`, `"score"`
- Tag filter syntax: `"tag:classification:value"` (e.g., `"tag:lifecycle:expiring-30d"`)
- **Performance warning:** Must not be placed in site-wide templates. Internal/low-traffic pages only.

#### wiki.getpagestrendstats(path, count, recursive)

High-performance endpoint for recently modified or recently added pages.

```dekiscript
var stats = wiki.getpagestrendstats('', 10, true);
var recent = stats.recentlyupdated;  // or .recentlyadded
```

Each result exposes: `pg.uri`, `pg.title`, `pg.date`. That is the full set — no tags, no IDs.

#### wiki.getpage(path)

Returns a page object for the given path. Use `.subpages` for one-level child traversal.

```dekiscript
var children = map.values(wiki.getpage("./Category/Path").subpages);
var sorted = list.sort(children, 'title', false);
```

#### wiki.api(uri)

Makes an authenticated GET call against any `/@api/deki/` endpoint using the current user's credentials. Returns XML.

```dekiscript
var uri = site.api & 'pages/popular' & { limit: 10 };
var result = wiki.api(uri);
foreach (var pg in result['page']) {
  web.link(pg / 'uri.ui', pg / 'title');
}
```

- `/` operator traverses XML nodes: `node / 'child'`
- Only GET calls — no POST/PUT
- Runs as the current user — publisher users cannot access Admin-only endpoints
- Can call any documented `/@api/deki/` endpoint including `/pages/{id}/info`, `/pages/{id}/properties/{key}`

**URI type requirement.** `wiki.api()` requires a URI type, not a plain string. Build URIs by starting with `site.api` (which is already a URI) — concatenating a string onto a URI produces a URI:

```dekiscript
// WRONG — TypeError: cannot convert from STR to URI
wiki.api("/pages/" & page.id & "/tags")

// CORRECT — site.api is a URI; URI & string → URI
wiki.api(site.api & "pages/" & page.id & "/tags")
```

**`string.join` as lazy-type realiser.** When iterating XML node results or `page.tags` values, string operations silently fail on the lazy-typed objects returned. Use `string.join` to force them to real strings before string processing:

```dekiscript
var tagStr = string.join(map.keys(page.tags), "|");
var tags = string.split(tagStr, "|");  // now plain strings
```

See `dekiscript-gotchas` for the full set of lazy-type gotchas.

### web.* — HTTP fetch functions

All `web.*` functions are **GET-only**. No POST capability.

| Function | Returns | Use |
|---|---|---|
| `web.json(url)` | Parsed object | Fetch JSON from any URL |
| `web.xml(url)` | XML document | Fetch XML from any URL |
| `web.text(url)` | Raw string | Fetch plain text or CSV from any URL |
| `web.link(uri, label)` | HTML anchor | Render a hyperlink |
| `web.html(str)` | HTML | Render a raw HTML string |

`web.text()` can technically fetch a CSV response, but DekiScript has no built-in CSV parser — you would need to split on newlines and commas manually.

### Function namespace summary

| Namespace | Functions | Purpose |
|---|---|---|
| `wiki.*` | 27 functions | Page/site operations, search, API access |
| `web.*` | 14 functions | HTTP fetch, HTML rendering |
| `user.*` | — | Current user properties |
| `page.*` | — | Current page properties (see `dekiscript-page-object`) |
| `site.*` | — | Site-level info (`site.api`, `site.uri`) |
| `date.*` | — | Date formatting and parsing |
| `xml.*`, `uri.*`, `num.*`, `string.*`, `list.*`, `map.*` | — | Utility functions |
