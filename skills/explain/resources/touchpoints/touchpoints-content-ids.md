---
topic: touchpoints-content-ids
description: Content ID indirection pattern for maintainable Touchpoints links — stable references that survive article relocations
group: touchpoints
---

## touchpoints-content-ids — Content IDs for Stable Article References

### The problem Content IDs solve

If a Touchpoints link uses a direct Expert article URL and the article is later moved or renamed, every embedded link on every third-party page breaks. Content IDs introduce an indirection layer managed centrally in Expert.

### How it works

Instead of linking directly to an article URL, use the Content ID URL format:

```
https://your-expert-site.com/@go/cid/{contentid}
```

Expert resolves the Content ID to the current article location at request time. If the article moves, update only the Content ID Manager entry — not the embedded links.

### Content ID Manager

Content IDs are managed in the Expert admin UI at:

**Site Tools > Content ID Manager**

Each entry maps a stable ID (a short string or number) to the current article path.

### Using Content IDs in anchor tags (F1 variant)

```html
<a href="https://your-expert-site.com/@go/cid/1234" class="_F1_">Get help</a>
```

### Using Content IDs with widget.open()

```js
widget.open('https://your-expert-site.com/@go/cid/1234');
```

### Using Content IDs with articlePath (Embedded variant)

Pass the `/@go/cid/{contentid}` path as the `articlePath` value:

```js
document.addEventListener('mindtouch-web-widget:view-article:loaded', function(e) {
  e.data.widget.articlePath = '@go/cid/1234';
});
```

### When to use

Use Content IDs when:
- The article library is actively curated and articles may be reorganised
- Embeds span multiple applications or teams who cannot easily update links
- You want to decouple content structure from embedded link maintenance

Direct URLs are fine for small, stable article sets where the overhead of managing a Content ID registry is not justified.

### See also

- `touchpoints-contextual-surfacing` — articlePath pattern for the Embedded variant
- `touchpoints-f1-variant` — CSS class and widget.open() for the F1 variant
