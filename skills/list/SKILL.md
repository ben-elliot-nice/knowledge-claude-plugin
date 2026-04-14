---
name: knowledge:list
description: List child pages under a CXone Expert path. Use when you need to enumerate the pages inside a category or guide in Expert.
---

# Knowledge: List

List direct child pages under a given Expert path.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts list pages --parent <path>
```

## Exit Codes

- **0** — Success. Output is JSON array of child pages.
- **1** — Error. Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx <plugin-root>/cli/src/index.ts list pages --parent /home/MyCategory
```
