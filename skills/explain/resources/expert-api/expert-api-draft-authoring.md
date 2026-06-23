---
topic: expert-api-draft-authoring
description: Expert draft page authoring via API — two-call creation pattern, draft-only endpoints, and tag routing for unpublished pages
group: expert-api
---

## expert-api-draft-authoring — Draft Page Authoring

Draft pages exist in a separate namespace from published pages. All operations on unpublished content must route through `/drafts/` endpoints — `/pages/` endpoints return 403 or operate on stale/published data for draft-state pages.

---

### Creating a draft page — two calls required

`POST /drafts/={path}/create` creates the page skeleton but **ignores any content body**. Content must be set in a separate second call.

**Call 1 — create the draft:**

```
POST /@api/deki/drafts/={encoded-path}/create?type={articleType}&title={title}
X-Deki-Token: {token}
```

- `type`: GCF article type (`reference`, `topic`, `howto`)
- `title`: display title
- Body is ignored — do not send content here

**Response** — flat JSON object at the top level (no `page` wrapper):

```json
{
  "@id": "12345",
  "uri.ui": "https://instance/path/to/page",
  ...
}
```

Access the ID as `response["@id"]`, not `response.page["@id"]`.

**Call 2 — set content on the draft:**

```
POST /@api/deki/drafts/{id}/contents?edittime=now
Content-Type: application/xml; charset=utf-8
X-Deki-Token: {token}

<content type="text/html"><body>{html}</body></content>
```

Use the numeric `@id` from call 1. `edittime=now` is required.

---

### Tags on draft pages — use /drafts/{id}/tags

`PUT /pages/{id}/tags` returns **403** when the page is in draft/unpublished state. Use the `/drafts/` path instead:

```
// WRONG — 403 for draft pages
PUT /@api/deki/pages/{id}/tags

// CORRECT
PUT /@api/deki/drafts/{id}/tags
Content-Type: application/xml; charset=utf-8

<tags><tag value="article:reference" /></tags>
```

This also applies to reading tags — `GET /pages/{id}/tags` may return empty or stale data for draft-only pages. Use `GET /drafts/{id}/tags` when in draft context.

**Detection in browser JS:** check `window.location.search.includes('mt-draft=true')` to determine whether the current page context is a draft view.

---

### Contrast with published page creation

The `/pages/` content endpoint also accepts a `draft=true` parameter, but it does **not** create a draft — it creates a published page and ignores the parameter:

```
// Creates a PUBLISHED page, not a draft — draft=true is silently ignored
POST /@api/deki/pages/={path}/contents?edittime=now&draft=true
```

To create a draft, always use `POST /drafts/={path}/create` followed by `POST /drafts/{id}/contents`.

---

### Related topics

- `expert-api-pages` — published page creation and update
- `expert-api-xml-gotchas` — XML formatting requirements for content POST bodies
