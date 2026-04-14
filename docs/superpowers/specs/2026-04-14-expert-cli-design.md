# Expert CLI — Design Spec

**Date:** 2026-04-14
**Status:** Approved

## Overview

A reusable TypeScript CLI providing modular resource access for remote operations against a CXone Expert (MindTouch) instance via the Deki REST API. Follows the same atomic/composite layering pattern as `cognigy-claude-plugin`.

Initial scope: **pages resource only**. Additional resources added via the private `knowledge-generate-resource` skill as needed.

---

## Architecture

Three layers:

```
Layer 1: TypeScript CLI        (cli/src/)
  └── Single source of truth for all Deki API calls
  └── Handles HMAC auth, .env discovery, routing, JSON output
  └── Invoked: npx tsx cli/src/index.ts <verb> <resource> [id] [--flag value ...]
  └── Exit codes: 0 (success), 1 (error), 2 (.env confirmation needed)

Layer 2: Atomic Skills         (skills/get, list, create, update, delete, invoke, init)
  └── One skill per CLI verb, resource-agnostic
  └── Handle all three exit codes uniformly
  └── Derive plugin root from injected "Base directory for this skill:" path
  └── Never hardcode CLI paths

Layer 3: Composite Skills      (deferred)
  └── Call atomic skills only — never CLI directly
  └── Higher-level workflows (publish-article, scaffold-hierarchy, etc.)
  └── Existing stub skills will be revisited once atomics are stable
```

---

## CLI Structure

```
cli/
├── package.json              versioned, kept in sync with .claude-plugin/plugin.json
├── src/
│   ├── index.ts              entry point — parses verb/resource/flags, routes to handler
│   ├── lib/
│   │   ├── auth.ts           HMAC-SHA256 token generation
│   │   ├── client.ts         HTTP client — prepends base URL, injects X-Deki-Token header
│   │   ├── env.ts            .env discovery and validation
│   │   └── types.ts          ResourceHandlers contract
│   └── resources/
│       └── pages.ts          initial resource module
└── openapi/
    └── expert.json           API spec reference (copy of repo-root openapi.json)
```

### Authentication

HMAC-SHA256 signed token, generated per request:

```
epoch = Math.floor(Date.now() / 1000)
hash  = HMAC-SHA256(SECRET, `${KEY}_${epoch}_=admin`)
token = `tkn_${KEY}_${epoch}_=admin_${hash}`
Header: X-Deki-Token: <token>
```

Credentials read from `.env`:
```
EXPERT_BASE_URL=https://your-instance.mindtouch.us
EXPERT_KEY=your_key
EXPERT_SECRET=your_secret
```

### Page ID Encoding

Pages are addressed using `=` + double-URI-encoded full path:
```js
`=${encodeURIComponent(fullPath)}`
// e.g. =home%2FMyCategory%2FMyGuide%2FMyPage
```

### XML Handling

The Deki API returns XML. The client parses XML responses and normalises them to plain JSON before returning to the skills layer. Skills never handle XML directly.

---

## Pages Resource

### Verbs and Deki API Mappings

| Verb | Deki call(s) | Key flags |
|---|---|---|
| `list` | `GET /pages/{id}/subpages` | `--parent <path>` |
| `get` | `GET /pages/{id}/contents` + `/info` | `--path <path>` |
| `create` | `POST /pages/{id}/contents` → `PUT /pages/{id}/tags` | `--parent <path>` `--title` `--type` `--body <file>` |
| `update` | `POST /pages/{id}/contents` → `PUT /pages/{id}/tags` | `--path <path>` `--body <file>` `--type` |
| `delete` | `DELETE /pages/{id}` | `--path <path>` |
| `invoke` | `POST /pages/{id}/move\|copy\|revert` | `--path <path>` `--op <operation>` |

**GCF types** (`--type` flag): `topic-category`, `topic-guide`, `reference`, `topic`, `howto`. Defaults to `reference`.

**Two-step create/update:** `create` and `update` POST content then PUT tags in sequence. This is an internal implementation detail — from the skill layer it is a single atomic operation.

**Existence check on create:** GET the page first and check for `virtual="true"`. If page already exists, warn and skip rather than overwrite. Callers who want to overwrite use `update`.

### CLI Examples

```bash
npx tsx cli/src/index.ts list   pages --parent /home/MyCategory
npx tsx cli/src/index.ts get    pages --path /home/MyCategory/MyGuide/MyPage
npx tsx cli/src/index.ts create pages --parent /home/MyCategory/MyGuide --title "My Page" --type reference --body ./page.md
npx tsx cli/src/index.ts update pages --path /home/MyCategory/MyGuide/MyPage --body ./page.md
npx tsx cli/src/index.ts delete pages --path /home/MyCategory/MyGuide/MyPage
npx tsx cli/src/index.ts invoke pages --path /home/MyCategory/MyGuide/MyPage --op move --to /home/OtherCategory
```

---

## Atomic Skills

Seven skills in `skills/`:

| Skill | Verb | Purpose |
|---|---|---|
| `knowledge:init` | — | Set up `.env` for this project |
| `knowledge:get` | `get` | Fetch a page by path |
| `knowledge:list` | `list` | List child pages under a path |
| `knowledge:create` | `create` | Create a page with content and GCF type |
| `knowledge:update` | `update` | Update page content and/or type |
| `knowledge:delete` | `delete` | Delete a page (irreversible — always confirm first) |
| `knowledge:invoke` | `invoke` | Run a named operation (move, copy, revert) |

All atomic skills:
- Are resource-agnostic (same skill works for any resource added to the CLI later)
- Derive the plugin root two directories up from the injected base dir
- Handle exit codes 0, 1, and 2 uniformly
- Surface errors clearly without swallowing them

---

## Private Skill: knowledge-generate-resource

Lives in `claude-private-skills` (not this repo). Used when adding a new resource type to the CLI.

**Canonical reference:** `cli/src/resources/pages.ts` — new modules mirror this exactly.

**Steps:**
1. Extract relevant paths from `cli/openapi/expert.json`
2. Write `cli/src/resources/<resource>.ts` mirroring `pages.ts` structure
3. Write types inline or in `<resource>.types.ts` (no auto-generation script — Expert spec is XML-based)
4. Wire into `cli/src/index.ts` registry with singular key
5. Write and pass tests before wiring
6. Commit and push, then run knowledge update

---

## Version Sync Rule

`cli/package.json` and `.claude-plugin/plugin.json` must stay in sync. Always patch increment unless directed otherwise.

> **Note:** Once `cli/package.json` exists, update `CLAUDE.md` to reference both files in the version bump rule (currently only mentions `plugin.json`).

---

## Out of Scope (Initial)

- Composite skills (publish-article, scaffold-hierarchy, extract-articles, get-public-content) — deferred until atomics are stable
- Resources beyond pages
- Auto-type generation from spec
