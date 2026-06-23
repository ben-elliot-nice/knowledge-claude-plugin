---
topic: dekiscript-page-object
description: The DekiScript page object — available properties and what is NOT accessible
group: dekiscript
---

## dekiscript-page-object — Page Object Properties

The `page` object provides metadata about the current page. When using `wiki.getpage()` or iterating search results, the same fields are available on each result object.

### Available properties

| Property | Type | Description |
|---|---|---|
| `page.api` | uri | API URI for the page — use with `wiki.api()` |
| `page.author` | map | User object for most recent editor (`page.author.displayname`, etc.) |
| `page.date` | string | Last modified date |
| `page.files` | map | Attached files |
| `page.id` | number | Unique numeric page ID |
| `page.name` | string | Page name (URL slug) |
| `page.parent` | map | Immediate parent page details |
| `page.path` | string | Full path |
| `page.subpages` | map | Immediate child pages (one level deep) |
| `page.tags` | map | Tags map — tag classification:value pairs |
| `page.title` | string | Display title |
| `page.viewcount` | number | Total view count |
| `page.uri` | uri | Browser-facing URL |

### What is NOT exposed on the page object

These fields exist in the system but are **not accessible** as DekiScript page properties:

| Missing field | How to access instead |
|---|---|
| Scheduled publish date | `wiki.api(page.api & '?include=schedule')` — XML response, schema undocumented |
| Scheduled unpublish date | Same as above |
| Content creation date | `wiki.api(page.api & '/info')` — `date.created` field in XML |
| Draft state (`active`/`inactive`/`unpublished`) | `wiki.api(page.api & '/info')` — `draft.state` attribute in XML |
| Review Manager status | Not accessible — Review Manager has no API surface |
| Custom page properties | `wiki.api(page.api & '/properties/{key}')` — returns the property value |

### Accessing additional fields via wiki.api()

For fields not on the page object, call the API directly:

```dekiscript
var info = wiki.api(page.api & '/info?include=schedule');
var created = info / 'date.created';
var draftState = xml.attr(info, 'draft.state');
```

Note: `wiki.api()` runs as the current user. If the current user lacks permission for an endpoint, the call returns nothing or an error XML node.

### Tags map

`page.tags` is a map of tag values. Tags use classification prefixes:

```dekiscript
// Check if a page has a specific tag
if (map.contains(page.tags, 'lifecycle:expiring-30d')) {
  <span>Expiring soon</span>;
}
```

Tag classification format: `classification:value` (e.g., `stage:review`, `article:topic`, `lifecycle:expiring-30d`).

**Warning — lazy types.** `map.keys(page.tags)` and `map.values(page.tags)` return lazy-typed objects. They render correctly as XML content but silently fail with all string operations (`string.startswith`, `string.substr`, `&` concatenation). The only reliable way to get real strings from tags is `string.join`:

```dekiscript
// Realise tags as a list of plain strings
var tagStr = string.join(map.keys(page.tags), "|");
var tags = string.split(tagStr, "|");
// tags is now a list of real strings — string.contains and string.replace work
foreach (var tag in tags) {
  if (string.contains(tag, "version-set:")) {
    var slug = string.replace(tag, "version-set:", "");
    // use slug here — do all work inside this block (foreach scoping prevents outer mutation)
  }
}
```

See `dekiscript-gotchas` for the full set of lazy-type and foreach-scoping gotchas.
