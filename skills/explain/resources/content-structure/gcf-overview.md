---
topic: gcf-overview
description: What the Guided Content Framework is, why it exists, and how it enforces hierarchy during page creation
group: content-structure
---

## gcf-overview — Guided Content Framework

The Guided Content Framework (GCF) is a structural enforcement layer built into CXone Expert. It restricts available page type options based on where a page is being created, preventing structurally invalid hierarchies before they happen.

### What it does

- The "New Page" dialog only shows page types that are valid children of the current parent
- The page type dropdown limits switching to compatible types only
- Move/copy operations trigger a warning when the page type conflicts with the new parent
- "See all templates" is unavailable when GCF is enabled — only compatible templates display

### What it is not

GCF is not a search or tagging feature. It is purely a structural guardrail applied during authoring. Classification and tagging are separate systems that operate alongside GCF (see `gcf-classifications`).

### Enabled by default

Sites created or upgraded after November 2017 have GCF enabled by default.

### Removed features when GCF is on

- Import/Export option from the Options menu
- Template-recommended tags no longer display
- DekiScript navigation widget replaced by the Navigation widget

### Structural model

GCF combines two complementary structures:
- **Hierarchical** — expanding downward and outward (parent → child nesting)
- **Taxonomical** — relationship mapping via classifications and tags

The five page types and their valid parent/child relationships are defined in `gcf-page-types` and `gcf-nesting-rules`.
