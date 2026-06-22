---
topic: expert-scheduled-publication
description: Expert scheduled publish/unpublish feature — how it works, API endpoints, and constraints
group: expert-api
---

## expert-scheduled-publication — Scheduled Publication

Expert supports per-page scheduled publish and unpublish dates. Authors set these in the page editor UI; the platform executes the state change at the scheduled time.

### Feature behaviour

- **Scheduled publish:** A draft becomes live at the specified date/time
- **Scheduled unpublish:** A live page is taken offline at the specified date/time
- Scheduling can be cascaded to all sub-pages
- When an unpublish is scheduled, a notice appears in the page status bar
- Schedules must be set at least 15 minutes in advance
- Cannot modify or delete a schedule within 15 minutes of execution
- Maximum scheduling window: 365 days ahead
- Parent must be published before a child can be published; children must be unpublished before parent

**Platform limit: 100 active scheduled jobs per site.** One job may cover multiple pages via the sub-pages cascade option.

### Roles required

| Action | Minimum role |
|---|---|
| Schedule publish | Author, Editor, Admin |
| Schedule unpublish | Editor, Admin |

### API access

#### Site-wide bulk report (Admin only)

```
GET /@api/deki/schedules/reports/publicationschedules.csv
```

Returns a CSV of **all active scheduled jobs** across the site — both scheduled publishes (drafts) and scheduled unpublishes (live pages). No filter parameters; always returns the full dump.

Fields include: page ID, page title, path, scheduled date/time (GMT-UTC), sub-pages included, schedule type (publish/unpublish).

**Limitations:**
- Admin role required — publisher users cannot access this endpoint
- CSV format only — `wiki.api()` expects XML and cannot parse CSV responses
- No pagination; full dump every call (manageable given the 100-job limit)

#### Per-page schedule data

```
GET /@api/deki/pages/{pageid}?include=schedule
GET /@api/deki/pages/{pageid}/info?include=schedule
```

Returns a `<schedule>` XML element on that specific page. The field names within the element are not publicly documented — an authenticated call on a page with an active schedule is required to inspect the schema. Expected: scheduled publish datetime, scheduled unpublish datetime, state.

**No bulk equivalent exists.** There is no endpoint to list all pages that have a scheduled unpublish date in XML format suitable for `wiki.api()`.

### Using this data in a DekiScript dashboard

Direct DekiScript access to scheduled unpublish data is not possible because:
1. The bulk endpoint is CSV (not XML-parseable by `wiki.api()`)
2. The bulk endpoint is Admin-only (not accessible to publisher users at render time)
3. Per-page `?include=schedule` requires knowing the page IDs in advance — no discovery mechanism

**Recommended pattern:** An external scheduled job (e.g., nightly Python script) reads `publicationschedules.csv` using Admin credentials, computes groupings (overdue / approaching / current), and writes results as custom page properties or machine tags to each article. A DekiScript dashboard then queries those properties or tags. See `expert-compliance-dashboard` for the full architecture.
