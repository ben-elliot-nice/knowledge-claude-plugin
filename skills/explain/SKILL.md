---
name: explain
description: Retrieve reference content for knowledge plugin topics before writing code or making API calls. Use when: (1) working with the Expert/Deki API, (2) building DekiScript components, (3) creating content structures or page hierarchies, (4) anything requiring platform-specific field names, endpoints, or patterns. Call with no topic for the full index.
---

# explain

Retrieve reference content before writing code, making API calls, or building content structures for the knowledge plugin.

## When to use

Call `explain` before brute-forcing or web-searching:
- Working with Expert (MindTouch / Deki REST API)
- Building DekiScript components or custom views
- Creating content structures, page hierarchies, or GCF taxonomy
- Any implementation where exact field names, endpoints, or patterns matter

## Available topics


**branding**
- **expert-branding-logos** — Logo and icon upload in Expert — types, formats, size constraints, and upload path
- **expert-css-admin** — Where and how to apply custom CSS in Expert — the six role-scoped fields, LESS vs CSS3, and key warnings
- **expert-css-selectors** — Expert DOM structure, elm-* component classes, and columbia-* body targeting hooks — sourced from live HTML captures
- **expert-css-variables** — LESS variables and known CSS class names available for Expert site customisation
- **expert-html-regions** — HTML injection regions in Expert — DekiScript fields, template paths, and what each region supports
- **expert-portal-audiences** — Multi-audience portal strategy in Expert — how to serve agents and customers from one tenant, and when a second tenant is required
- **expert-touchpoint-css** — Per-Touchpoint CSS customisation in Expert — where to apply it, scope, reuse, and known limitations

**content-structure**
- **gcf-classifications** — Custom classifications and tags in Expert — how they work, how they differ, and how to use them for Guide tabs, search filtering, and content management
- **gcf-nesting-rules** — Exact allowed and prohibited nesting combinations in GCF — the rules that determine what can live under what
- **gcf-overview** — What the Guided Content Framework is, why it exists, and how it enforces hierarchy during page creation
- **gcf-page-ordering** — How Expert orders pages within a category or guide, and how to control sequence using URL prefixes or drag-and-drop
- **gcf-page-types** — The five GCF page types — Category, Guide, Topic, How-To, Reference — their purpose, display options, and valid positions
- **gcf-search** — How content hierarchy and metadata affect search discoverability in Expert — URL depth, titles, summaries, tags, and classifications
- **ia-design** — Information architecture design principles for Expert — how to plan a category/guide structure that serves users, not internal org charts

**dekiscript**
- **dekiscript-gotchas** — DekiScript runtime gotchas — lazy types, foreach scoping, missing functions, and XML literal restrictions
- **dekiscript-overview** — What DekiScript is, its execution model, and what it can and cannot do
- **dekiscript-page-object** — The DekiScript page object — available properties and what is NOT accessible
- **dekiscript-wiki-functions** — The wiki.* and web.* function namespaces — page queries, API access, HTTP fetch

**editorai**
- **tinymce-ai-injection** — Inject custom AI shortcuts into Expert's TinyMCE editor via template script — confirmed working, supports site-managed guidelines

**expert-api**
- **expert-api-auth** — Expert REST API authentication — Server API Token, HMAC-SHA256 signing, token format
- **expert-api-draft-authoring** — Expert draft page authoring via API — two-call creation pattern, draft-only endpoints, and tag routing for unpublished pages
- **expert-api-pages** — Expert pages API — key endpoints, filtering, metadata fields, and include options
- **expert-api-xml-gotchas** — Expert API XML formatting gotchas — GET /tags response format, HTML entity encoding, and script-jem editor stripping
- **expert-compliance-dashboard** — Architecture patterns for a compliance review dashboard in Expert — webhook-driven (recommended) and fallback options
- **expert-review-manager** — Expert Review Manager — what it is, its UI-only nature, and what is not accessible via API
- **expert-scheduled-publication** — Expert scheduled publish/unpublish feature — how it works, API endpoints, and constraints
- **expert-versioning-navigation** — Pattern for cross-article version navigation in Expert — ISO date tags, webhook-driven metadata, DekiScript sidebar, and search scoping
- **expert-webhooks** — Expert webhook system — supported events, payload headers, auth, retry, and idempotency

**touchpoints**
- **touchpoints-article-tagging** — What article tags and custom classifications do in Expert — and what they do NOT do for Touchpoints contextual surfacing
- **touchpoints-content-ids** — Content ID indirection pattern for maintainable Touchpoints links — stable references that survive article relocations
- **touchpoints-contextual-surfacing** — How contextual article surfacing works in the Embedded Contextual Help Touchpoint — always explicit JS, never automatic
- **touchpoints-embed-install** — How to generate and install a Touchpoints embed script on a third-party web page
- **touchpoints-f1-variant** — The Contextual Help (F1) Touchpoint — CSS class triggers, widget.open() API, and lifecycle events

## Usage

```
/explain              → this index
/explain <topic>      → full reference for that topic
```
