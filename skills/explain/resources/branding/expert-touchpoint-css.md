---
topic: expert-touchpoint-css
description: Per-Touchpoint CSS customisation in Expert — where to apply it, scope, reuse, and known limitations
group: branding
---

## expert-touchpoint-css — Touchpoint CSS Customisation

### What Touchpoints are

Touchpoints are embeddable widgets that extend Expert content into any external web property (host website, CRM, app). Each Touchpoint renders Expert content in an isolated context on the host page, separate from the core Expert portal domain.

Available Touchpoint types with CSS customisation: Search, Search-In-Place, Contextual Help, Contextual Help Button, Customer Insights, Embedded Contextual Help, Sign-In.

### Applying CSS to a Touchpoint

**Admin path:** Site Tools > Dashboard > Integrations > Touchpoints Management → select Touchpoint → **Custom CSS field** (optional)

Steps:
1. Create a test Touchpoint before modifying a deployed one
2. Write CSS targeting Touchpoint elements in an external editor
3. Paste into the Custom CSS field and save
4. Verify in the embedded test environment and iterate

CSS written here is **scoped to that Touchpoint only**. Once refined, the same CSS can be reused across multiple Touchpoints of the same type.

### Sizing configuration

Some Touchpoints accept dimension values directly in the configuration (separate from the CSS field):

- **Customer Insights**: height and width as CSS property values (`%`, `em`, `px`, etc.)
- **Search-In-Place**: height and width as CSS property values

### CSS selector targeting

Expert injects a configurable CSS class name to identify contextual help triggers:

```
Default: .F1
Custom:  any class name set in the Touchpoint configuration
```

This class is placed on host-page elements that should trigger the Contextual Help Touchpoint.

### Known gap — targetable element classes

The docs reference a "targetable elements of Touchpoints" article and a "Touchpoint variables" reference, but these were not publicly accessible. The full list of CSS class names and DOM structure **inside** Touchpoint renders is not documented publicly.

To build a reliable selector map: embed a Touchpoint on a test page and inspect the rendered HTML in browser DevTools. Touchpoints may render inside an `<iframe>` or shadow DOM — check whether standard CSS from the host page can reach inside, or whether only the Custom CSS field applies.

### Sign-In Touchpoint labels (non-CSS customisation)

The Sign-In Touchpoint also supports text label customisation (not CSS):
- **Sign in label** — text shown to unauthenticated users
- **Authenticated user label** — text shown post-login (default: `Signed into CXone Mpower Expert as [username]`)

### Relationship to site-wide CSS

Touchpoint CSS (via the Custom CSS field) and site-wide CSS (Control Panel > Branding) are independent. Touchpoints embedded on a third-party domain do not inherit the host site's stylesheet; only the Touchpoint Custom CSS field applies.
