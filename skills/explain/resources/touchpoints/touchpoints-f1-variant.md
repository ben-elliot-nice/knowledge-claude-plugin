---
topic: touchpoints-f1-variant
description: The Contextual Help (F1) Touchpoint — CSS class triggers, widget.open() API, and lifecycle events
group: touchpoints
---

## touchpoints-f1-variant — Contextual Help (F1) Touchpoint

The F1 variant is distinct from the Embedded Contextual Help Touchpoint. It opens an Expert article in a dialog, triggered either by user-clicked anchor links or programmatically.

### Mechanism 1: CSS class selector trigger

Add the class `._F1_` (default — configurable in the admin UI) to any anchor tag. When clicked, the widget intercepts the link and opens the `href` in an Expert dialog instead of navigating away.

```html
<a href="https://your-expert-site.com/Help/Article-Path" class="_F1_">Get help</a>
```

The CSS class name is configurable per-Touchpoint in the Expert admin UI. `_F1_` is the documented default.

### Mechanism 2: programmatic widget.open()

After the `mindtouch-web-widget:f1:loaded` event fires, the widget exposes a `widget.open(href)` method. Call it with any Expert article URL to open the dialog without a user click:

```js
document.addEventListener('mindtouch-web-widget:f1:loaded', function(e) {
  const widget = e.data.widget;
  // open a specific article programmatically
  widget.open('https://your-expert-site.com/Help/Article-Path');
});
```

### Lifecycle events

The F1 widget fires five document-level events. Listen with `document.addEventListener`:

| Event | Fires when |
|---|---|
| `mindtouch-web-widget:f1:ready` | Widget script has initialised |
| `mindtouch-web-widget:f1:loaded` | Widget is ready — `widget.open()` is available from this point |
| `mindtouch-web-widget:f1:modal-rendered` | Modal container has rendered in the DOM |
| `mindtouch-web-widget:f1:dialog-rendered` | Dialog content has rendered |
| `mindtouch-web-widget:f1:clicked` | User clicked an `._F1_` anchor |

**Use `f1:loaded` as the hook for programmatic `widget.open()` calls.** The widget is not ready before this event.

### Choosing between the two mechanisms

| | CSS class trigger | `widget.open()` |
|---|---|---|
| Requires user click | Yes | No |
| Works with dynamic content | If class is present at render time | Yes — call on any event |
| Requires JS | No | Yes |

### See also

- `touchpoints-embed-install` — installing the widget script
- `touchpoints-contextual-surfacing` — the Embedded Contextual Help variant (articlePath pattern)
- `touchpoints-content-ids` — stable article references using Content IDs
