---
topic: expert-html-regions
description: HTML injection regions in Expert — DekiScript fields, template paths, and what each region supports
group: branding
---

## expert-html-regions — HTML Injection Regions

### How HTML is added

HTML must be added via **DekiScript fields**, not Source View. DekiScript is Expert's template language — it supports formatted HTML, inline CSS, JavaScript, template calls, and API integration. Adding HTML via Source View injects unwanted wrapper elements.

Requires Admin role.

### Global regions and their paths

| Region | Template path | Notes |
|---|---|---|
| Site Header | `/Template:Custom/Views/Header` | Edit via Site Tools > Dashboard > Site Administration > Template Directory |
| Site Footer | `/Template:Custom/Views/Footer` | Same path as header |
| Sign-In Page | `/Template:Custom/Views/Login` | Fully overridable |
| 404 Page | `/Template:Custom/Views/404` | Fully overridable |
| Welcome Page | `/Template:Custom/Views/Welcome` | Pro Member and Community Member variants exist |
| PDF Header | `/Template:Custom/Views/PDF` | Separate table-of-contents variant available |
| Page Content Header | Account Manager enablement required | Positioned above content area on every page |
| Page Content Footer | Account Manager enablement required | Positioned below content area on every page |
| Page Head / Meta tags | Site Tools > Control Panel > Custom HTML > Page Head | Use for font imports, analytics scripts |
| Page Tail | Same Control Panel section | End-of-page elements, deferred scripts |

### DekiScript syntax constraints

DekiScript wraps HTML in a scripting context — syntax differs from plain HTML:

```dekiscript
// Text must be quoted
<h1>'Page Title'</h1>

// Escaped single quotes
<p>'John\'s Car'</p>

// Self-closing tags required
<img src="logo.png"/><br/>

// Semicolons separate sibling elements
<p>'Do '; <strong>'NOT '</strong>; 'forget semicolons'</p>
```

Inline CSS and JavaScript work inside DekiScript blocks. Best practice: use **one block** for all custom code per region — do the same for CSS and JavaScript separately.

### Template reference pattern

To reference another template inside a DekiScript field:
```
template('NiCE KM/IDF3/Views/Guide')
```

Acceptable formats: `template:Custom/template_URL` or `Custom/template_URL`.

### Template management rules

- **Do not edit** templates under `/Template:NiCE KM/` except `/IDF3/Pages/`, `/IDF2/Pages/`, or `/IDF/Pages/`. Changes there are unsupported and may break on platform updates.
- Copy out-of-box templates into `/Template:Custom/` before modifying. Changes in `Custom/` survive platform updates.
- Create a parent template (e.g., `/Template:<Company Name>/`) as an organisational namespace.

### Content branding regions (non-template)

Expert supports five additional region types added to page layouts:

- **Page Content Header** — above the content container
- **Page Content Footer** — below the content container
- **Page Content Side** — alongside the content container
- **Author Bars** — per-article author/avatar display
- **Custom Site Messaging** — page-property-driven conditional messaging

These appear on every page throughout the site when configured; they are not page-specific.
