---
name: knowledge:get
description: Fetch a CXone Expert page by path, returning its contents and metadata. Use when you need to read an existing Expert page's content or check its properties.
---

# Knowledge: Get

Fetch a page from CXone Expert by its full path.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts get pages --path <full-page-path>
```

## Exit Codes

- **0** — Success. Output is JSON with `{ contents, info }`.
- **1** — Error (page not found, permission denied, etc.). Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx cli/src/index.ts get pages --path /home/MyCategory/MyGuide/MyPage
```
