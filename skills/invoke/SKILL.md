---
name: knowledge:invoke
description: Run a named non-CRUD operation on a CXone Expert page — move, copy, or revert. Use when you need to restructure the Expert hierarchy or roll back a page.
---

# Knowledge: Invoke

Run a named operation on an Expert page.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts invoke pages \
  --path <full-page-path> \
  --op <operation> \
  [--to <destination-path>] \
  [--revision <revision-number>]
```

## Operations

| `--op` | Additional flags | Effect |
|---|---|---|
| `move` | `--to <path>` | Move page to a new path |
| `copy` | `--to <path>` | Copy page to a new path |
| `revert` | `--revision <n>` (optional, default: previous) | Revert page to a prior revision |

## Exit Codes

- **0** — Success. Output is the API response.
- **1** — Error. Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Examples

```bash
# Move a page
npx tsx <plugin-root>/cli/src/index.ts invoke pages --path /home/OldCat/Page --op move --to /home/NewCat

# Copy a page
npx tsx <plugin-root>/cli/src/index.ts invoke pages --path /home/Cat/Page --op copy --to /home/Cat/Page-backup

# Revert to previous revision
npx tsx <plugin-root>/cli/src/index.ts invoke pages --path /home/Cat/Page --op revert
```
