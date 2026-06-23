---
name: publish-to-expert
description: Publish structured markdown content to a CXone Expert (MindTouch) instance via the Deki API. Use when creating page hierarchies in Expert from directory-structured markdown — typically following extract-knowledge output. Handles topic-category, topic-guide, and reference page creation with correct GCF tagging. Use when: (1) Publishing an extract-knowledge knowledge base to Expert, (2) Creating individual Expert categories or guides programmatically, (3) Bulk-creating page hierarchies from markdown directory structures, (4) Anything involving the Expert/MindTouch Deki API for page creation.
---

# Publish to Expert

Publishes markdown content to CXone Expert (MindTouch) via the Deki REST API.

## Setup

Copy `references/env.example` to `.env` in the project root and populate:

```
EXPERT_BASE_URL=https://your-instance.mindtouch.us
EXPERT_KEY=your_key
EXPERT_SECRET=your_secret
EXPERT_ROOT_PATH=home   # default parent for categories
```

Add `.env` to `.gitignore`. Install the one dependency: `npm install marked`.

## Authentication

Tokens are HMAC-SHA256 signed and generated per request using the key/secret pair:

```js
const epoch = Math.floor(Date.now() / 1000);
const hash  = crypto.createHmac('sha256', SECRET).update(`${KEY}_${epoch}_=admin`).digest('hex');
const token = `tkn_${KEY}_${epoch}_=admin_${hash}`;
// Header: X-Deki-Token: <token>
```

## Page Hierarchy (GCF)

Expert uses the Guided Content Framework. Page type is set via a tag after creation:

| Type | Tag | Role |
|------|-----|------|
| `topic-category` | `article:topic-category` | Container. Can nest: cat → cat → guide |
| `topic-guide` | `article:topic-guide` | Groups reference pages |
| `reference` | `article:reference` | Leaf content page |
| `topic` | `article:topic` | Leaf content page (alternative) |
| `howto` | `article:howto` | Leaf content page (alternative) |

**Valid nesting:** `cat → [cat →]* guide → page`. Guides cannot contain guides.

## Page Creation — Two Steps

Every page requires two API calls:

**1. POST contents** (creates the page):
```
POST /@api/deki/pages/={encoded-path}/contents
  ?edittime=now&allow=deleteredirects,idferrors&title={title}
Content-Type: application/xml; charset=utf-8

<content type="text/html" title="{xmlTitle}"><body>{html}</body></content>
```

**XML-escape titles before interpolation.** Titles containing `&`, `"`, `<`, or `>` (common in enterprise content: "Sales & New Business", "Q&A") cause a 400 PageInvalidDocumentException if not escaped:

```js
const xmlTitle = title
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
```

**2. PUT tags** (sets GCF type):
```
PUT /@api/deki/pages/{id}/tags?allow=idferrors
Content-Type: application/xml; charset=utf-8

<tags><tag value="article:{type}" /></tags>
```

Note: PUT tags **replaces all tags** in a single call. For pages needing both a GCF type tag and a classification tag (e.g. `article:howto` + `claims:process`), include all tags in one PUT — a second PUT call wipes the first:

```
<tags>
  <tag value="article:howto" />
  <tag value="claims:process" />
</tags>
```

## Page ID Encoding

Page IDs use `=` prefix + URI-encoded full path:
```js
`=${encodeURIComponent(`${parentPath}/${pageName}`)}`
// e.g. =MUFG%2FHostplus%2FGetting%20Started
```

## Body Content

- **Categories and guides**: use the MindTouch template body (not empty HTML):
  ```html
  <pre class="script" style="display: none;">template('MindTouch/Controls/PageOverview');</pre>
  <pre class="script">wiki.idfTemplate();</pre>
  ```
- **Reference pages**: convert markdown to HTML via `marked`, then fix void elements:
  ```js
  marked.parse(bodyMd).replace(/<(hr|br|img|input)(\s[^>]*)?\s*\/?>/gi, '<$1$2 />')
  ```
  Expert's XML parser requires self-closing void elements. Missing this causes 400 errors.

## Existence Check

Before creating, GET the page with `?include=revisions` and check for both `virtual="true"` and `revision count="0"`:

```js
async function pageExists(pageId, token) {
  const r = await fetch(`${BASE_URL}/@api/deki/pages/${pageId}?include=revisions`, {
    headers: { 'X-Deki-Token': token }
  });
  if (!r.ok) return false;
  const text = await r.text();
  if (text.includes('virtual="true"')) return false;   // page doesn't exist
  if (text.includes('revision count="0"')) return false; // auto-created path stub
  return true;
}
```

**Why check revision count:** when a child page is published to a path whose parent doesn't exist, Expert auto-creates the parent as a structural stub. These stubs do **not** contain `virtual="true"` — they appear as real pages in the API — but they have `revision count="0"`, no template body, and no GCF tag. Without the revision check, a re-run treats broken stubs as "already exists" and skips them silently, leaving the hierarchy broken.

If page exists: **warn and skip**. Do not overwrite.

## Scripts

All scripts read credentials from `.env` automatically.

| Script | Usage |
|--------|-------|
| `scripts/create-category.js` | `node create-category.js <name> [parent-path]` |
| `scripts/create-guide.js` | `node create-guide.js <name> <parent-path>` |
| `scripts/create-page.js` | `node create-page.js <md-file> <parent-path> [article-type]` |
| `scripts/bulk-create.example.js` | Exemplar — copy and adapt the MANIFEST for bulk runs |

## Bulk Creation from extract-knowledge Output

When publishing a full extract-knowledge output directory, write a `bulk-create.js` for the project using `scripts/bulk-create.example.js` as the template.

**Identifying publishable files** — skip:
- Files matching `/^\d+-/` (e.g. `01-raw-content.md`, `02-analysis.md`)
- `README.md`, `*.txt`, `*.html`, `linked/` directories
- Any file not containing an H1 heading

**Directory → Expert mapping:**
- Directories containing only `.md` files → **guides**
- Directories containing subdirectories → **categories**
- `.md` files inside a guide directory → **reference pages** (title from H1)

**Guide/category display names:** derive from directory name using kebab-to-title-case:
```js
str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
// "getting-started-with-super" → "Getting Started with Super"
```

**Before writing the manifest**, inspect the directory tree and confirm with the user:
- Which top-level path in Expert to publish under (the `parent`)
- Whether a category already exists (skip category creation if so)
- Any guide/category name overrides needed

### Multi-level hierarchies and multiple article types

The example manifest (`category → guide → pages[]`, all `reference`) covers the simplest case. Real GCF hierarchies often require:

**Sub-categories (4+ levels):** `brand category → product category → guide → article`. Add intermediate category levels to the manifest or tree-walker before creating guides.

**Multiple article types:** articles can be `reference`, `topic`, or `howto`. Use descriptor files or frontmatter (`GCF type: howto`) to determine per-article type rather than hardcoding `reference` for all.

**Topic nesting:** a `topic` article can parent `howto`/`reference` children within a guide (`guide → topic → howto`). The existence check and path-encoding logic must handle this depth.

**Directory-walker approach for large hierarchies:** for hierarchies too large to hand-manifest, write a tree-walker that reads `_category.md`, `_guide.md`, `_topic.md` descriptor files to determine page type and title, reads `GCF type:` frontmatter from article files, and builds the full publish queue. This is more reliable than a hand-authored manifest for 50+ page hierarchies.
