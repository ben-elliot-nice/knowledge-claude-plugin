---
topic: expert-api-xml-gotchas
description: Expert API XML formatting gotchas — GET /tags response format, HTML entity encoding, and script-jem editor stripping
group: expert-api
---

## expert-api-xml-gotchas — XML and Content Formatting Gotchas

Three distinct formatting issues cause silent failures or 400 errors when reading tags, POSTing content, or editing templates.

---

### GET /pages/{id}/tags — non-self-closing XML

The tags GET response returns full tag objects with child elements, **not** self-closing elements:

```xml
<!-- Actual GET response -->
<tag value="article:reference" id="4" href="...">
  <uri>https://...</uri>
  <type>text</type>
  <title>article:reference</title>
</tag>
```

Regex patterns expecting the self-closing write format match nothing:

```js
// WRONG — matches nothing against the GET response
/<tag[^>]+value="[^"]+"[^>]*\/>/g

// CORRECT — matches on the opening tag, ignores child elements
/<tag\s[^>]*value="([^"]+)"/g
```

The self-closing form (`<tag value="..." />`) is the **write** format used in PUT requests. Read and write formats differ.

---

### HTML entities in dekicode content are invalid XML

`GET /pages/{id}/contents?format=dekicode&mode=edit` returns raw TinyMCE editor HTML containing named HTML entities (`&mdash;`, `&ndash;`, `&nbsp;`, `&copy;`, etc.). These are **not valid XML** — only `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&apos;` are defined in XML.

Wrapping dekicode content in `<content><body>...</body></content>` and POSTing to any content endpoint returns 400:

```
400 Bad Request: No document posted or document was not valid page content XML.
```

**Workaround — convert named entities to numeric XML character references before POSTing:**

```js
function htmlEntitiesToXml(html) {
  return html
    .replace(/&mdash;/g, '&#8212;')
    .replace(/&ndash;/g, '&#8211;')
    .replace(/&nbsp;/g, '&#160;')
    .replace(/&copy;/g, '&#169;')
    .replace(/&reg;/g, '&#174;')
    .replace(/&trade;/g, '&#8482;')
    .replace(/&laquo;/g, '&#171;')
    .replace(/&raquo;/g, '&#187;')
    .replace(/&hellip;/g, '&#8230;')
    .replace(/&amp;/g, '&amp;');  // preserve — already valid XML
}
```

`format=xhtml` returns numeric character references directly but is rendered output, not the editor source. Use `format=dekicode` + the entity conversion above when round-tripping editable content.

---

### script-jem — TinyMCE strips HTML/XML tags from JS string literals

When pasting JS into a `<pre class="script-jem">` block via the Expert HTML source editor, TinyMCE parses and strips any XML/HTML element tags inside string literals on save:

```js
// Paste this:
body: '<tags><tag value="versioning:enabled"/></tags>'

// Saved as:
body: ''
```

Any `<element>...</element>` inside a JS string is silently removed. No error is thrown.

**Workaround — use JS hex escapes for all angle brackets in string literals:**

```js
// Use \x3c for < and \x3e for > inside string literals
body: '\x3ctags\x3e\x3ctag value="versioning:enabled"/\x3e\x3c/tags\x3e'
```

These survive the TinyMCE editor round-trip and evaluate to the correct characters at runtime. This is required for any script-jem block that builds XML request bodies (tag PUT payloads, content POST bodies, etc.).

---

### XML escaping in page title attributes

When constructing the content POST body, page titles must be XML-escaped before interpolation into the XML attribute:

```js
// WRONG — titles with & cause 400 PageInvalidDocumentException
const body = `<content type="text/html" title="${title}">...</content>`;

// CORRECT
const xmlTitle = title
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
const body = `<content type="text/html" title="${xmlTitle}">...</content>`;
```

Common in enterprise content: "Sales & New Business", "Q&A", "Products & Coverage" all fail without escaping.

---

### Related topics

- `expert-api-pages` — page content endpoints
- `expert-api-draft-authoring` — draft-specific endpoints
