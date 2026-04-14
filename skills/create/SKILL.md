---
name: knowledge:create
description: Create a new CXone Expert page with content and a GCF type (topic-category, topic-guide, reference, topic, howto). Use when publishing a new page to Expert. Will skip silently if the page already exists — use knowledge:update to overwrite.
---

# Knowledge: Create

Create a new page in CXone Expert.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts create pages \
  --parent <parent-path> \
  --title <title> \
  --type <gcf-type> \
  [--body <path-to-markdown-file>]
```

## GCF Types

| Type | `--body` required? | Purpose |
|---|---|---|
| `topic-category` | No | Container for guides |
| `topic-guide` | No | Container for reference pages |
| `reference` | Yes | Leaf content page (default) |
| `topic` | Yes | Leaf content page |
| `howto` | Yes | Leaf content page |

## Exit Codes

- **0** — Success. Output includes `{ created: true, path, id, type }` or `{ skipped: true, reason, path, id }`.
- **1** — Error. Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx cli/src/index.ts create pages \
  --parent /home/MyCategory/MyGuide \
  --title "Getting Started" \
  --type reference \
  --body ./getting-started.md
```
