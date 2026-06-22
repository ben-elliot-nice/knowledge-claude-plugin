---
topic: expert-css-admin
description: Where and how to apply custom CSS in Expert — the six role-scoped fields, LESS vs CSS3, and key warnings
group: branding
---

## expert-css-admin — Custom CSS in the Expert Control Panel

### Admin path

**Site Tools > Control Panel > Branding > Custom Site CSS**

CSS is pasted into text fields in the UI. There is no file-based system, no git integration, and **no revision history — changes go live immediately and cannot be reverted via the Control Panel.** Always maintain an external backup before editing.

### Six role-scoped CSS fields

Expert compiles different CSS for each user type. Each field is independent:

| Field | Applied to |
|---|---|
| All Roles CSS | Every visitor, every page load |
| Anonymous CSS | Unauthenticated visitors only |
| Authenticated Viewer CSS | Logged-in standard (community) users |
| Seated User CSS | Logged-in Seated/Pro users (excludes Admins) |
| Admin CSS | Admin users only |
| Legacy Browser CSS | Legacy browser fallback |

Use **Anonymous CSS** for customer-facing styling and **Seated User CSS** for internal agent styling to deliver different visual identities from a single tenant.

### Supported languages

- **CSS3** — supported everywhere: site-wide fields and per-page inline blocks
- **LESS** — supported in site-wide Control Panel fields only. LESS does **not** compile at the individual page level (CSS3 only there). Limit LESS nesting to 2 levels.

### Rendering order (later overrides earlier)

1. Browser defaults
2. Individual page CSS (CSS3 only)
3. Default NiCE/MindTouch base styling
4. Control Panel CSS

### Per-page CSS

Individual pages support CSS3 via the editor. Target them from site-wide CSS using body classes — Expert injects contextual body classes on each page (e.g., `.columbia-special-search` on special pages). Do not rely on template element selectors directly from per-page CSS; apply custom body classes and target those instead.

### Code style conventions (from docs)

- Hex: lowercase, 3-char where possible (`#fff` not `#ffffff`)
- Spacing: 4 spaces, not tabs; prefer `em`/`rem`/`%` over `px`/`pt`
- Alphabetise attributes within each selector
- Hover states: use `.no-touch` body class guard (`.no-touch .elm-header div:hover`) to avoid sticky hover on touch devices
