---
name: knowledge:update
description: Update an existing CXone Expert page's content and/or GCF type. Use when overwriting an existing page. Use knowledge:create for new pages.
---

# Knowledge: Update

Update an existing page in CXone Expert.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts update pages \
  --path <full-page-path> \
  [--body <path-to-markdown-file>] \
  [--type <gcf-type>]
```

At least one of `--body` or `--type` is required.

## Exit Codes

- **0** — Success. Output includes `{ updated: true, path, id }`.
- **1** — Error (page not found, missing args, etc.). Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx <plugin-root>/cli/src/index.ts update pages \
  --path /home/MyCategory/MyGuide/getting-started \
  --body ./getting-started-v2.md
```
