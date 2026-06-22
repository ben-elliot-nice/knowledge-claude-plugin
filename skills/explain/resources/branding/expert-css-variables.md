---
topic: expert-css-variables
description: LESS variables and known CSS class names available for Expert site customisation
group: branding
---

## expert-css-variables — LESS Variables and Known CSS Classes

### LESS variables (site-wide CSS only)

These are confirmed to exist from the official docs. Apply in site-wide Control Panel fields — not per-page CSS (LESS does not compile there).

```less
@highlight-color        // primary accent / highlight colour
@default-font-family    // base font stack
@primary-font-color     // main body text colour
@heading-color          // heading elements colour
```

These are the only variables explicitly documented. The full variable set is not published — additional variables may exist; inspect the compiled stylesheet to discover them.

### Known CSS class names

Only a small set is documented publicly:

| Selector | Context | Notes |
|---|---|---|
| `.elm-header-logo-container img` | Site header | Used to size SVG logos (SVGs have no intrinsic dimensions, must set `max-width`) |
| `.no-touch` | Body class | Applied on non-touch devices. Use as a guard on hover rules: `.no-touch .elm-header div:hover {}` |
| `.columbia-special-search` | Body class | Example pattern; Expert injects contextual body classes on specific page types |

### CSS class inventory gap

The docs reference a "targetable elements of Touchpoints" article but it was not publicly accessible. The full class/element hierarchy for:
- Touchpoint shadow DOM or container classes
- Article page structure
- Navigation chrome
- Search results layout

...is **not documented publicly**. To build a reliable selector map, inspect a rendered Expert page in browser DevTools and capture the DOM structure. See `expert-touchpoint-css` for Touchpoint-specific context.

### SVG logo sizing example

```css
.elm-header-logo-container img {
    max-width: 20em;
}
```

### Hover state pattern

```css
.no-touch .elm-header div:hover {
    background-color: @highlight-color;
}
```
