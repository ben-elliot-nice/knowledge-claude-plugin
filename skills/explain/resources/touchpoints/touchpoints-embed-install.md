---
topic: touchpoints-embed-install
description: How to generate and install a Touchpoints embed script on a third-party web page
group: touchpoints
---

## touchpoints-embed-install — Embedding the Touchpoints Widget

### Generate the embed code

Navigate in the Expert admin UI:

**Site Tools > Dashboard > Integrations > Touchpoints Management**

Select or create a Touchpoint, then copy the generated embed snippet to clipboard.

### Install on the host page

Paste the snippet into the **`<body>`** of the target HTML — not the `<head>`. This is a hard requirement documented by NICE.

```html
<body>
  <!-- page content -->

  <!-- paste Touchpoints embed here, not in <head> -->
  <script>...</script>
</body>
```

The embed alone gives you a widget shell. Without additional JavaScript configuration, contextual article surfacing does not activate. See `touchpoints-contextual-surfacing` for the JS layer.

### Domain scoping

The Touchpoint is configured in the Expert admin UI with the domains it is permitted to load on. Ensure the host page's domain matches the configured allowlist.

### What "some basic programming" means

The docs note that installation requires "some basic programming" beyond the paste step. That programming is:

- For the Embedded Contextual Help variant: a JS event listener that sets `articlePath` (see `touchpoints-contextual-surfacing`)
- For the F1 / Contextual Help variant: anchor tags with a CSS class trigger, or a `widget.open()` call (see `touchpoints-f1-variant`)
