---
topic: ia-design
description: Information architecture design principles for Expert — how to plan a category/guide structure that serves users, not internal org charts
group: content-structure
---

## ia-design — Information Architecture Design

### Start with a North Star

Before creating any pages, decide what the top-level organisational paradigm is. Pick one and apply it consistently:

| Paradigm | Top-level Categories represent |
|----------|-------------------------------|
| Persona | Customer types or roles |
| Product/Service | Product lines or service offerings |
| Support issue | Problem categories from ticket data |
| Subject | Broad knowledge domains |
| Task | What users are trying to accomplish |

**Do not mix paradigms at the same hierarchical level.** A category list that combines persona-based and product-based entries creates navigation confusion.

### Structure for users, not for your org

- Base structure on how customers search and ask questions — not internal team or product divisions
- Inputs: ticket submissions, search logs, support team feedback
- Test on a sandbox before deploying to production

### Breadth and depth guidelines

- **Optimal breadth**: 2–5 options at each level
- **Depth limit**: No more than 3–4 clicks from homepage to article
- Shallow is better for discoverability — deeply nested URLs harm SEO and user navigation
- Balance between too many top-level categories (overwhelming) and too few (forces deep nesting)

### Naming conventions

- Use generic, future-proof titles — specific product names become stale
- Category and Guide names should reflect the user's mental model, not internal jargon
- Page titles must be **unique and specific** — keyword-forward, with the most important term first
- Summaries (the description shown in search results and category pages) must concisely describe the page content

### URL design

- URL structure is separate from page title — decouple them for categories that may have many sub-pages
- Shorter URLs improve discoverability and navigation
- Start custom ordering prefixes at `010` (not `001`) to leave insertion room without renumbering
- Expert auto-manages redirects when page names or URLs change; allow 5–10 minutes for pages with 10+ sub-pages

### Content audit before restructuring

- Eliminate redundant or duplicate content before designing a new structure
- Use the Page Classification Manager and XML Sitemap to analyse the existing estate
- Visual sitemaps help assess structural health before committing to a design

### Scalability

- Build flexibility for content expansion from the start
- Generic top-level categories accommodate new products/personas without restructuring
- Consider how classifications and tags will scale alongside the hierarchy (see `gcf-classifications`)
