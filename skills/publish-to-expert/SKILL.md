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

<content type="text/html" title="{title}"><body>{html}</body></content>
```

**2. PUT tags** (sets GCF type):
```
PUT /@api/deki/pages/{id}/tags?allow=idferrors
Content-Type: application/xml; charset=utf-8

<tags><tag value="article:{type}" /></tags>
```

Note: PUT tags **replaces** all tags. Safe on new pages; use caution on existing ones.

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

Before creating, GET the page and check for `virtual="true"`. Virtual = doesn't exist yet.
```js
async function pageExists(pageId, token) {
  const r = await fetch(`${BASE_URL}/@api/deki/pages/${pageId}`, { headers: { 'X-Deki-Token': token } });
  if (!r.ok) return false;
  return !(await r.text()).includes('virtual="true"');
}
```
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
