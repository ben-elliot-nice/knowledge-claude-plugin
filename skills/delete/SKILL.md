---
name: knowledge:delete
description: Delete a CXone Expert page by path. This is irreversible — always confirm with the user before proceeding.
---

# Knowledge: Delete

Delete a page from CXone Expert. **Irreversible** — always confirm with the user before running.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts delete pages --path <full-page-path>
```

## Before Running

Always confirm: "This will permanently delete `<path>` from Expert. Are you sure?"

## Exit Codes

- **0** — Success. Output is `{ deleted: true }`.
- **1** — Error. Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx <plugin-root>/cli/src/index.ts delete pages --path /home/MyCategory/MyGuide/old-page
```
