# Knowledge Plugin — Manual Test Guide

Test the CLI directly and via skills. Each section pairs the raw CLI command with the equivalent skill invocation.

## Setup

```bash
# Set once per shell session
CLI="npx tsx ~/repos/claude-marketplace/knowledge-claude-plugin/cli/src/index.ts"

# Replace with your actual Expert instance values
EXPERT_BASE=https://help.benelliot-nice.com
TEST_ROOT=/home           # parent path for test pages — change to a safe sandbox path
```

Ensure a `.env` exists in your working directory (or run `knowledge:init` first):
```
EXPERT_BASE_URL=https://help.benelliot-nice.com
EXPERT_KEY=<your-key>
EXPERT_SECRET=<your-secret>
```

---

## T01 — Init (credential setup)

**Skill only** — no CLI equivalent (init writes the `.env` file interactively).

```
Skill: knowledge:init
```

Expected: prompts for base URL, key, secret → writes `.env` → confirms "Run knowledge:get --path /home to verify connectivity."

---

## T02 — Verify connectivity (get home page)

```bash
# CLI
$CLI get pages --path /home
echo "Exit: $?"
```

```
Skill: knowledge:get --path /home
```

Expected:
- Exit 0
- JSON output with `{ contents: {...}, info: {...} }`
- `info` contains the home page metadata

---

## T03 — List children of home

```bash
# CLI
$CLI list pages --parent /home
echo "Exit: $?"
```

```
Skill: knowledge:list --parent /home
```

Expected:
- Exit 0
- JSON array of pages directly under `/home`

---

## T04 — Create a category (no body required)

```bash
# CLI
$CLI create pages \
  --parent $TEST_ROOT \
  --title "Test Category" \
  --type topic-category
echo "Exit: $?"
```

```
Skill: knowledge:create --parent <TEST_ROOT> --title "Test Category" --type topic-category
```

Expected:
- Exit 0
- `{ "created": true, "path": "<TEST_ROOT>/test-category", "type": "topic-category", "id": "<page-id>" }`

---

## T05 — Create same category again (skip on duplicate)

```bash
# CLI — run the same command as T04
$CLI create pages \
  --parent $TEST_ROOT \
  --title "Test Category" \
  --type topic-category
echo "Exit: $?"
```

```
Skill: knowledge:create --parent <TEST_ROOT> --title "Test Category" --type topic-category
```

Expected:
- Exit 0
- `{ "skipped": true, "reason": "Page already exists", "path": "...", "id": "..." }`

---

## T06 — Create a guide under the category

```bash
# CLI
$CLI create pages \
  --parent $TEST_ROOT/test-category \
  --title "Test Guide" \
  --type topic-guide
echo "Exit: $?"
```

```
Skill: knowledge:create --parent <TEST_ROOT>/test-category --title "Test Guide" --type topic-guide
```

Expected:
- Exit 0
- `{ "created": true, "path": "...", "type": "topic-guide", "id": "..." }`

---

## T07 — Create a reference page with content

First, create a local markdown file:
```bash
echo "# Hello from Knowledge CLI\n\nThis is a test article created via the CLI." > /tmp/test-article.md
```

```bash
# CLI
$CLI create pages \
  --parent $TEST_ROOT/test-category/test-guide \
  --title "Test Article" \
  --type reference \
  --body /tmp/test-article.md
echo "Exit: $?"
```

```
Skill: knowledge:create --parent <TEST_ROOT>/test-category/test-guide --title "Test Article" --type reference --body /tmp/test-article.md
```

Expected:
- Exit 0
- `{ "created": true, "path": "...", "type": "reference", "id": "..." }`

---

## T08 — Get the article just created

```bash
# CLI
$CLI get pages --path $TEST_ROOT/test-category/test-guide/test-article
echo "Exit: $?"
```

```
Skill: knowledge:get --path <TEST_ROOT>/test-category/test-guide/test-article
```

Expected:
- Exit 0
- `{ contents: { ... }, info: { page: { title: "Test Article", ... } } }`

---

## T09 — Update the article's content

```bash
echo "# Hello from Knowledge CLI (updated)\n\nThis article was updated via the CLI." > /tmp/test-article-v2.md

# CLI
$CLI update pages \
  --path $TEST_ROOT/test-category/test-guide/test-article \
  --body /tmp/test-article-v2.md
echo "Exit: $?"
```

```
Skill: knowledge:update --path <TEST_ROOT>/test-category/test-guide/test-article --body /tmp/test-article-v2.md
```

Expected:
- Exit 0
- `{ "updated": true, "path": "...", "id": "..." }`

---

## T10 — Update the article's GCF type only (no content change)

```bash
# CLI
$CLI update pages \
  --path $TEST_ROOT/test-category/test-guide/test-article \
  --type topic
echo "Exit: $?"
```

```
Skill: knowledge:update --path <TEST_ROOT>/test-category/test-guide/test-article --type topic
```

Expected:
- Exit 0
- `{ "updated": true, "path": "...", "id": "..." }`
- Page GCF type changed from `reference` to `topic` (verify in Expert UI)

---

## T11 — Copy a page

```bash
# CLI
$CLI invoke pages \
  --path $TEST_ROOT/test-category/test-guide/test-article \
  --op copy \
  --to $TEST_ROOT/test-category/test-guide/test-article-copy
echo "Exit: $?"
```

```
Skill: knowledge:invoke --path <path> --op copy --to <destination>
```

Expected:
- Exit 0
- JSON response from Deki API confirming the copy

---

## T12 — Move a page

```bash
# CLI
$CLI invoke pages \
  --path $TEST_ROOT/test-category/test-guide/test-article-copy \
  --op move \
  --to $TEST_ROOT/test-category/test-article-copy
echo "Exit: $?"
```

```
Skill: knowledge:invoke --path <path> --op move --to <destination>
```

Expected:
- Exit 0
- Page now lives at `<TEST_ROOT>/test-category/test-article-copy`

---

## T13 — Delete pages (clean up)

Run in reverse order (leaf pages first):

```bash
# CLI
$CLI delete pages --path $TEST_ROOT/test-category/test-article-copy
$CLI delete pages --path $TEST_ROOT/test-category/test-guide/test-article
$CLI delete pages --path $TEST_ROOT/test-category/test-guide
$CLI delete pages --path $TEST_ROOT/test-category
```

```
Skill: knowledge:delete --path <path>
```

Expected: each call exits 0, output `{ "deleted": true }`.

---

## T14 — Error: missing .env (exit 2)

```bash
# Run from a directory with no .env
cd /tmp && $CLI list pages --parent /home
echo "Exit: $?"
```

Expected:
- Exit **2**
- stderr: `No .env file found from /private/tmp. Run knowledge:init to set up credentials.`

---

## T15 — Error: invalid path (exit 1)

```bash
# CLI
$CLI get pages --path /home/this-path-does-not-exist-xyz
echo "Exit: $?"
```

Expected:
- Exit **1**
- stderr: error message from the API (likely a 404 or "page not found")

---

## T16 — Error: missing required flag (exit 1)

```bash
# CLI — create without --title
$CLI create pages --parent /home
echo "Exit: $?"
```

Expected:
- Exit **1**
- stderr: `--title is required for create`

---

## Notes

- The CLI path slug is derived from `--title` by lowercasing and replacing spaces/special chars with `-`. `"Test Category"` → `test-category`.
- `knowledge:delete` should always prompt for confirmation before running.
- If a test leaves pages behind (e.g. due to a crash), clean up manually in the Expert UI or re-run the delete commands.
