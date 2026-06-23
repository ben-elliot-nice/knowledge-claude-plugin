---
topic: expert-versioning-navigation
description: Pattern for cross-article version navigation in Expert — ISO date tags, webhook-driven metadata, DekiScript sidebar, and search scoping
group: expert-api
---

## expert-versioning-navigation — Article Versioning Navigation

Pattern for regulated content estates where discrete published articles represent distinct content versions (rather than using Expert's native revision history). Provides reader navigation between versions, scoped search, and zero ongoing author maintenance after initial setup.

### Why Expert provides no native solution

- No `page.Version` property — the `page` object exposes 12 properties, none version-related
- No built-in "Related Versions" sidebar or version index template
- `Structure_your_site_for_product_versioning` addresses *product-level* site hierarchy (category → guide → article nesting), not cross-article version navigation
- Version_indicator template exists but requires hand-authored hrefs per version — does not scale

### Data model

| Element | Format | Set by | Purpose |
|---|---|---|---|
| Classification: `versioning` | — | Author once (via template) | Feature flag — opts article into versioning behaviour |
| Tag: `version-set` | `version-set:[topic-slug]` | Author once (via template) | Groups all version articles for the same topic |
| Tag: `version` | `version:YYYY-MM` | Webhook receiver on publish | Effective date — drives ordering and search filter |

**No `version-current` marker needed.** Current version is derived at render time: the published article in the set with the highest `version:YYYY-MM` value. ISO date strings sort lexicographically — `2025-06` > `2024-11` > `2024-03`. The DekiScript query sorted descending gives current first, historical after.

### Webhook receiver

Triggered by `PageContent_Update` (see `expert-webhooks`).

1. Respond HTTP 200 within 1 second, enqueue
2. Fetch article metadata via Expert API
3. If `versioning` classification absent → no-op
4. If present → write `version:YYYY-MM` tag using the publish event timestamp
5. Use `X-Nexus-Delivery-Id` for idempotency

New draft article carrying `version:2025-06` does not appear in published search results or DekiScript sidebar queries until published. The previous version remains current throughout the draft period.

### DekiScript sidebar template

Included on any article with the `versioning` classification. Queries the full version set and renders ordered navigation:

```dekiscript
{{
  if (map.contains(page.tags, 'versioning')) {
    // page.tags values are lazy — use string.join to get real strings
    var tagStr = string.join(map.keys(page.tags), "|");
    var tags = string.split(tagStr, "|");
    foreach (var tag in tags) {
      if (string.contains(tag, "version-set:")) {
        // do all work inside the foreach — outer variable mutation does not work
        var slug = string.join(["", string.replace(tag, "version-set:", "")], "");
        var versions = wiki.getsearch("tag:version-set:" & slug, 50, "-version");
        // first result = current (highest date), remainder = historical
        foreach (var v in versions) {
          <li><a href=(v.uri)>v.title</a></li>;
        }
      }
    }
  }
}}
```

**Why the string.join wrapper:** `page.tags` values and `string.replace` return values are lazy-typed — concatenating them with `&` produces empty string. `string.join(["", value], "")` forces serialisation to a real string. See `dekiscript-gotchas` for full details.

**Performance note:** `wiki.getsearch()` is slow — place this template only on versioned article pages, never in site-wide templates.

### Search scoping

- `version:YYYY-MM` tags appear as classification filters in Expert search
- GenSearch respects the classification filter — RAG scope is limited to articles matching the selected version tag
- A reader can answer "what was the procedure in Q3 2024?" by selecting `version:2024-09` (or nearest prior month) as a search filter

### Date slider search UI (custom)

A custom search widget reads all available `version:YYYY-MM` tag values from the search index and renders a date slider. Under the hood, dragging the slider applies the nearest `version:YYYY-MM` tag as a classification filter. Requires Expert search API to support tag faceting (unconfirmed — needs test).

### Author flow

1. Create article from versioned template — `versioning` and `version-set:[slug]` pre-applied
2. Publish → webhook fires → receiver writes `version:YYYY-MM`
3. When a new version is needed: duplicate article, edit draft, publish
4. New publish → receiver writes `version:YYYY-MM` on new article
5. Sidebar on both articles now reflects two versions; newest is current — no author action required

### Open questions (pending test)

- Confirm Expert search API supports tag faceting for date slider population
- Confirm `wiki.getsearch()` sorts correctly on `version:YYYY-MM` tag values

### Related topics

- `expert-webhooks` — webhook system, 1s timeout, retry, idempotency
- `expert-compliance-dashboard` — shares the same webhook receiver and classification-flag pattern
- `dekiscript-wiki-functions` — `wiki.getsearch()` reference
- `dekiscript-page-object` — `page.tags` reference
