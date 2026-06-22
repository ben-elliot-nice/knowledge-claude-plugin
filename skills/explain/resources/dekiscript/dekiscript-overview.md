---
topic: dekiscript-overview
description: What DekiScript is, its execution model, and what it can and cannot do
group: dekiscript
---

## dekiscript-overview — DekiScript Language Overview

DekiScript is a **server-side templating language** embedded in Expert (MindTouch) wiki pages. It executes at page render time and its output is HTML. It is not a general-purpose scripting runtime.

### Execution model

Code is embedded in wiki pages using double curly braces:

```dekiscript
{{
  var pages = wiki.getsearch("tag:stage:review", 10);
  foreach (var pg in pages) {
    <li><a href=(pg.uri)>pg.title</a></li>;
  }
}}
```

DekiScript runs as the **current user** — `wiki.api()` calls inherit that user's permissions. A dashboard page rendered by a publisher-role user can only access data that publisher role can access.

### What DekiScript can do

- Read page metadata via the page object (`page.title`, `page.tags`, `page.date`, etc.)
- Query articles by tag using `wiki.getsearch()`
- Traverse page hierarchies using `wiki.getpage().subpages`
- Make authenticated GET calls against any `/@api/deki/` endpoint via `wiki.api()` — returns XML
- Fetch any HTTP URL via `web.json()`, `web.xml()`, `web.text()` — GET only
- Render HTML output, tables, links, conditional blocks

### What DekiScript cannot do

- **No write path.** There is no documented POST/PUT/DELETE function. `wiki.create()` and `wiki.edit()` generate UI buttons for a user to click — they do not programmatically write data.
- **No CSV parsing.** `wiki.api()` expects XML responses. Endpoints that return CSV (e.g., `publicationschedules.csv`) cannot be parsed inline.
- **No scheduled execution.** DekiScript runs at render time only — it cannot run on a cron schedule or trigger async jobs.

### Syntax essentials

- Semicolons required at line endings
- Single quotes for strings inside `{{ }}` blocks (avoids HTML attribute collision)
- `//` for inline comments
- `var` / `let` for variable declaration
- `foreach (var x in collection) { ... }` for iteration
- XML node traversal with `/` operator: `node / 'child-element'`
- String concatenation with `&`

### Performance constraints

`wiki.getsearch()` can significantly slow page load. Avoid it in site-wide templates. `wiki.getpage()` and `wiki.api()` do not carry this documented warning.
