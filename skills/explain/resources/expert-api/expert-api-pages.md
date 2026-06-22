---
topic: expert-api-pages
description: Expert pages API — key endpoints, filtering, metadata fields, and include options
group: expert-api
---

## expert-api-pages — Expert Pages API

Base path: `https://{instance}/@api/deki/`

### Core page endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/pages/{pageid}` | GET | Page info. Use `?include=` for additional data. |
| `/pages/{pageid}/info` | GET | Extended page info. Same `?include=` options. |
| `/pages/{pageid}/find` | GET | Filter child pages by tag, classification, or date |
| `/pages/{pageid}/contents` | GET/POST | Page body (raw HTML/wiki markup) |
| `/pages/{pageid}/properties` | GET/POST | Custom key-value metadata per page |
| `/pages/{pageid}/properties/{key}` | GET/PUT/DELETE | Individual property operations |
| `/pages/{pageid}/tags` | GET/POST | Tags on a specific page |
| `/pages/{pageid}/health` | GET | Content quality inspection results |
| `/pages` | GET | Full sitemap — no filters |

### `?include=` options

Both `/pages/{pageid}` and `/pages/{pageid}/info` support:

```
?include=contents,draft,overview,schedule,scripts,related,prevnext
```

**`?include=schedule`** — returns scheduled publish/unpublish data for that page as a `<schedule>` XML element. The field names within that element are undocumented; an authenticated probe on a page with an active schedule is needed to inspect the schema. Expected fields: scheduled publish datetime, scheduled unpublish datetime, state.

### `/pages/{pageid}/find` — filtering

The most useful filtering endpoint for compliance/reporting use cases:

| Parameter | Type | Description |
|---|---|---|
| `tags` | string | Comma-separated tags to filter by (e.g., `stage:review,article:topic`) |
| `missingclassifications` | string | Return pages lacking this classification prefix |
| `since` | datetime | Modified after (`yyyyMMddHHmmss` or ISO 8601) |
| `upto` | datetime | Modified up to (`yyyyMMddHHmmss` or ISO 8601) |
| `include` | string | Additional fields: `tags`, `schedule`, etc. |

**Cannot filter by:** scheduled unpublish date, review status, author, or custom property values.

### Page metadata fields (from find/info response)

| Field | Type | Description |
|---|---|---|
| `@id` | int | Local page ID |
| `@guid` | string | Global page ID (stable across export/import) |
| `@draft.state` | enum | `active` (has draft), `inactive` (live, no draft), `unpublished` |
| `@deleted` | bool | True if in archive |
| `@revision` | int | Current revision number |
| `title` | string | Display title |
| `path` | string | URL path |
| `date.created` | ISO 8601 | Creation timestamp |
| `date.modified` | ISO 8601 | Last modified timestamp |
| `uri.ui` | uri | Browser-facing URL |
| `tags` | collection | Tag values (with `?include=tags`) |
| `language` | string | Page language code |

### Custom page properties

Per-page key-value store. Can be written by integrations and read back by DekiScript via `wiki.api()`.

```
PUT /@api/deki/pages/{pageid}/properties/review-status
GET /@api/deki/pages/{pageid}/properties/review-status
```

This is the primary mechanism for making non-native metadata (e.g., scheduled-unpublish grouping) queryable from a DekiScript dashboard — an external job writes the property, DekiScript reads it.

### Site-wide search (`/site/opensearch`)

| Parameter | Description |
|---|---|
| `q` | Full-text query |
| `limit`, `offset` | Pagination |
| `sortby` | `score`, `title`, `date`, `size`, `wordcount`, `rating` |
| `constraint` | Freeform constraint (e.g., `language:en-us AND type:wiki`) |
| `tags`, `classifications`, `types` | Filter dimensions |

No documented filter for scheduled date or review status.
