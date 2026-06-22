---
topic: expert-compliance-dashboard
description: Architecture patterns for a compliance review dashboard in Expert — webhook-driven (recommended) and fallback options
group: expert-api
---

## expert-compliance-dashboard — Compliance Dashboard Architecture

This topic covers how to build a dashboard in Expert that surfaces articles with scheduled review obligations, grouped by status (current / approaching deadline / overdue). See also `expert-webhooks`, `expert-versioning-navigation`, `expert-scheduled-publication`, `expert-review-manager`, and `dekiscript-overview`.

### Recommended approach — Webhook-driven review tagging (Option E)

Shares infrastructure with `expert-versioning-navigation`. A `reviewable` classification opts an article into review tracking; the webhook receiver writes a `review-at:YYYY-MM` tag on each publish event; DekiScript computes status at render time. No scheduled-unpublish dependency, no Admin-only data access, no author discipline required beyond initial setup.

#### Data model

| Element | Format | Set by | Purpose |
|---|---|---|---|
| Classification: `reviewable` | — | Author once (via template) | Feature flag — opts article into review tracking |
| Tag: `review-cycle` | `review-cycle:6m` / `review-cycle:12m` / `review-cycle:24m` | Author once (via template) | Review interval |
| Tag: `review-at` | `review-at:YYYY-MM` | Webhook receiver on publish | Target review month — drives dashboard grouping |

#### Webhook receiver logic (same service as versioning)

On `PageContent_Update` event (see `expert-webhooks`):
1. Check for `reviewable` classification — if absent, no-op
2. Read `review-cycle` tag value from article metadata
3. Calculate target review month: publish month + cycle interval
4. Write `review-at:YYYY-MM` tag via Expert API

**Review reset flow:** Author drafts article (with or without content changes), publishes. Publish event fires. Receiver recalculates and overwrites `review-at`. Review clock resets automatically — no other action needed.

#### DekiScript review dashboard

Publisher-accessible page. Queries `reviewable` articles and groups by status computed at render time:

```dekiscript
{{
  var articles = wiki.getsearch('classification:reviewable', 200, 'title');
  foreach (var pg in articles) {
    // read review-at tag, compare to current month
    // group into: overdue / due-this-month / approaching (≤60 days) / current
    <tr><td><a href=(pg.uri)>pg.title</a></td><td>pg.path</td><td>/* days remaining */</td></tr>;
  }
}}
```

Dashboard columns: title (linked), hierarchy location (`page.path`), review cycle, review-at date, days remaining or overdue by.

**Note on `date.*` functions in DekiScript:** Confirm whether DekiScript exposes a current-date function for status calculation. If not, the receiver can pre-compute a `review-status` tag (`overdue` / `approaching` / `current`) — but this requires a scheduled job to keep status current rather than computing at render time.

#### Open questions (pending webhook test)

- Confirm `wiki.getsearch("classification:reviewable", ...)` is valid syntax (classification filter vs tag filter)
- Confirm `wiki.getsearch()` offset/pagination for large content estates
- Confirm DekiScript has access to current date for render-time status calculation
- Confirm Expert API write-back for tags is available with service credentials

---

### Why pure DekiScript cannot power this dashboard (context for legacy options below)

### Why pure DekiScript cannot power this dashboard

Three blockers prevent a fully self-contained DekiScript implementation:

1. **No schedule field on the page object.** Scheduled unpublish dates are not exposed as DekiScript properties — `page.date` is last-modified only.
2. **Bulk schedule data is CSV, not XML.** The `publicationschedules.csv` endpoint returns CSV; `wiki.api()` expects XML and cannot parse CSV.
3. **Bulk schedule data is Admin-only.** Publisher-role users cannot call `publicationschedules.csv` at render time.

### Option A — Tag-based proxy (lowest infrastructure)

Authors apply a machine tag when scheduling an unpublish (e.g., `tag:lifecycle:expiring-30d`). The DekiScript dashboard queries by that tag.

```dekiscript
var pages = wiki.getsearch("tag:lifecycle:expiring-30d", 50, "-date");
foreach (var pg in pages) {
  <li><a href=(pg.uri)>pg.title</a> — date.format(pg.date, "MMM dd, yyyy")</li>;
}
```

**Pros:** No external infrastructure. Works today.  
**Cons:** Tags don't self-update — authors must manually apply and remove them. Groupings (`overdue`, `approaching`, `current`) are static snapshots, not computed from actual schedule dates.

### Option B — External job + custom page properties (recommended)

A scheduled external job bridges the Admin/publisher gap and makes schedule data queryable from DekiScript.

**Architecture:**

1. **Nightly job (Python, runs with Admin credentials):**
   - Fetches `GET /@api/deki/schedules/reports/publicationschedules.csv`
   - Parses CSV, computes grouping for each page (days until unpublish → overdue / approaching / current)
   - Writes grouping as a custom page property: `PUT /@api/deki/pages/{pageid}/properties/review-status`
   - Value: `overdue` | `approaching-30d` | `approaching-7d` | `current`

2. **DekiScript dashboard (publisher-accessible page):**
   - Calls `wiki.api()` to query articles by their `review-status` property, or uses `wiki.getsearch("tag:review-status:overdue", ...)` if a tag write-back is preferred

```dekiscript
// If using tags written by the external job:
var overdue = wiki.getsearch("tag:review-status:overdue", 50, "title");
var approaching = wiki.getsearch("tag:review-status:approaching-30d", 50, "title");

<h2>Overdue</h2>;
foreach (var pg in overdue) { <li><a href=(pg.uri)>pg.title</a></li>; }

<h2>Approaching (30 days)</h2>;
foreach (var pg in approaching) { <li><a href=(pg.uri)>pg.title</a></li>; }
```

**Pros:** Automatic grouping, no manual tagging, publisher users need no Admin access.  
**Cons:** Requires external infrastructure (scheduled job, Admin API credentials stored securely, hosting).

### Option C — Standalone external service

An external service (hosted outside Expert) reads the schedules API, builds its own index, and serves a dashboard UI — either as a standalone web app or embedded via iframe in an Expert page.

**Pros:** Real-time data, richer filtering, independent of DekiScript constraints, no 100-job-cap pressure.  
**Cons:** Most infrastructure; highest maintenance burden.

### Option D — Native admin report (no build required)

Point publishers at the Publication Queue CSV download in the admin Dashboard. This is the native compliance view — it lists all scheduled jobs with dates and status.

**Pros:** Zero implementation.  
**Cons:** Admin UI only, not a published page, not grouped by status, not accessible to publisher-role users.

### Review obligations (separate concern)

If the compliance requirement includes Review Manager state (reviewer assigned, review due date, approval status), none of the above options apply — Review Manager has no API surface. Options:

- Manual tag/property convention maintained by authors or a separate integration
- NICE product request to expose Review Manager via API

See `expert-review-manager`.

### Decision guide

| If... | Use option |
|---|---|
| Webhooks are enabled and you can run an external service | **E (recommended)** — webhook-driven, automatic, no Admin dependency |
| You need something working today with zero infrastructure | A (tags) — manual discipline required |
| You need automatic grouping and can run a nightly job but webhooks aren't available | B — nightly job against publicationschedules.csv |
| The dataset is large or needs real-time accuracy | C (external service) |
| Publishers are admins or can tolerate a CSV download | D (native report) |
| Review Manager state is required | Blocked — raise NICE product request |
