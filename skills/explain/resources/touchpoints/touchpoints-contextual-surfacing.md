---
topic: touchpoints-contextual-surfacing
description: How contextual article surfacing works in the Embedded Contextual Help Touchpoint — always explicit JS, never automatic
group: touchpoints
---

## touchpoints-contextual-surfacing — Contextual Article Surfacing (Embedded Variant)

### There is no automatic context detection

The widget does not infer the relevant article from the host page URL, page metadata, or any passive signal. Contextual surfacing is always explicitly programmed by the integrator.

### The mechanism: articlePath via DOM event listener

The Embedded Contextual Help Touchpoint surfaces an article by setting `data.widget.articlePath` inside a callback for the `mindtouch-web-widget:view-article:loaded` event.

```js
document.addEventListener('mindtouch-web-widget:view-article:loaded', function(e) {
  e.data.widget.articlePath = 'Integrations/Touchpoints';
});
```

`articlePath` is a path relative to the root of the Expert site. The integrator maps each host page (or route) to a specific Expert article path in this listener.

### Per-page mapping

Because there is no routing table or wildcard matching in the admin UI, the integrator is responsible for routing logic. For a multi-page or SPA application, this typically means reading the current URL inside the listener and branching:

```js
document.addEventListener('mindtouch-web-widget:view-article:loaded', function(e) {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) {
    e.data.widget.articlePath = 'Admin/Overview';
  } else if (path.startsWith('/reports')) {
    e.data.widget.articlePath = 'Reports/Getting-Started';
  }
  // etc.
});
```

### CSM-gated advanced path

The docs mention "programmatically display dynamically chosen content — contact your CSM" on the Embedded Contextual Help page with no further technical detail. This may indicate an enterprise-tier capability (rule-based URL mapping, server-side context injection) not covered in the public docs. Contact a NICE CSM to explore.

### SPA navigation caveat

It is not documented whether the `view-article:loaded` event re-fires on client-side route changes (pushState / hash navigation). For SPAs, test whether a new event fires on navigation or whether a manual re-trigger is needed.

### See also

- `touchpoints-embed-install` — installing the widget script
- `touchpoints-f1-variant` — the CSS-class / `widget.open()` variant
- `touchpoints-content-ids` — stable article references that survive article moves
