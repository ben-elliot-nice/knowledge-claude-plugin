---
topic: touchpoints-article-tagging
description: What article tags and custom classifications do in Expert — and what they do NOT do for Touchpoints contextual surfacing
group: touchpoints
---

## touchpoints-article-tagging — Article Tags and Classifications in Expert

### Tags

Tags are set per-article in Expert (via Page Settings). Their documented purpose is **recommended articles** — surfacing related content on the Expert site itself.

- Up to 5 tags per page is the recommended limit for best performance
- Tags help relate content and drive the recommended articles feature on Expert pages

**Tags have no effect on what a Touchpoints widget surfaces.** The widget does not read article tags to resolve contextual content.

### Custom Classifications

Custom classifications are labels assigned to articles via Page Settings (a dropdown). They serve as **search filter facets** in Expert search — users can filter search results by classification.

**Custom classifications have no documented integration with Touchpoints.** They cannot be passed as a context signal to the widget and do not affect which articles surface.

### What this means for Touchpoints implementations

There is no article-side metadata scheme that drives Touchpoints contextual resolution. The mapping between host page and Expert article is always defined in the integrator's JavaScript (via `articlePath` or `widget.open()`), not in article metadata.

If you want to change which article surfaces in a given context, update the JavaScript mapping — not the article's tags or classifications.

### Summary

| Feature | Tags | Custom Classifications |
|---|---|---|
| Drives recommended articles on Expert site | Yes | No |
| Filters Expert search results | No | Yes |
| Controls Touchpoints contextual surfacing | **No** | **No** |
| Affects widget.open() or articlePath | **No** | **No** |

### See also

- `touchpoints-contextual-surfacing` — how article surfacing is actually configured (JS-based)
- `touchpoints-f1-variant` — F1 widget mechanisms
