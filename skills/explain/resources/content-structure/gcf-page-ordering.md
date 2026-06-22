---
topic: gcf-page-ordering
description: How Expert orders pages within a category or guide, and how to control sequence using URL prefixes or drag-and-drop
group: content-structure
---

## gcf-page-ordering — Page Ordering

### Default ordering

Pages are ordered **alphanumerically by URL** within their parent container. This applies automatically to all new pages.

### Drag-and-drop reordering

Category pages support drag-and-drop reordering of sub-pages.

- Once drag-and-drop reordering is applied to a container, alphanumeric ordering no longer applies to that container
- Newly created sub-pages under a reordered container appear at the **bottom** by default
- Must be manually repositioned after creation

### URL prefix method

To control order without drag-and-drop, add numeric prefixes to page URLs:

```
010-getting-started   → appears first
020-configuration     → appears second
030-advanced          → appears third
```

**Start at `010`**, not `001` — this leaves room to insert pages between existing ones without renumbering. For example, inserting `015-quick-start` between `010` and `020` is possible; inserting between `001` and `002` is not.

### Redirect handling

When a page URL changes (including when a numeric prefix is added or changed), Expert automatically manages the redirect. Allow **5–10 minutes** before modifying a page with 10 or more sub-pages.

### Practical guidance

- Use URL prefixes for stable, predictable ordering (works in API-created content too)
- Use drag-and-drop for ad-hoc reordering when URL naming doesn't matter
- Do not mix both methods on the same container — once drag-and-drop is used, URL-based ordering is overridden
