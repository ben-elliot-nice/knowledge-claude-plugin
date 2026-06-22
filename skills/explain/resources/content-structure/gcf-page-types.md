---
topic: gcf-page-types
description: The five GCF page types — Category, Guide, Topic, How-To, Reference — their purpose, display options, and valid positions
group: content-structure
---

## gcf-page-types — GCF Page Types

CXone Expert's Guided Content Framework defines exactly five page types. Each has a fixed role in the hierarchy and a set of valid parent/child relationships (see `gcf-nesting-rules`).

---

### Category

- **Role**: Highest organisational level. Organises content by division — persona, product, service, department.
- **Valid parents**: Homepage (itself a Category) or another Category
- **Valid children**: Categories or Guides (never direct articles)
- **Display options**: Simple (list) or Detailed (list with child summaries)
- **GCF tag value**: `article:topic-category`

---

### Guide

- **Role**: Mid-level container for a specific subject, product, or functional area
- **Valid parents**: Category only
- **Valid children**: Articles (Topic, How-To, Reference) only — never other Guides or Categories
- **Display options**: Single (all articles in one view) or Tabbed (classification-based tabs)
- **Guide Tabs**: When set to Tabbed, each tab surfaces articles by classification; up to 10 classifications per tab; articles can belong to multiple classifications
- **GCF tag value**: `article:topic-guide`

---

### Topic

- **Role**: Explanatory, conceptual, or overview article
- **Valid parents**: Guide
- **Valid children**: How-Tos or References may be nested under a Topic (sub-articles)
- **Cannot contain**: other Topics
- **TOC**: Auto-generated from H1–H3 headings
- **GCF tag value**: `article:topic`

---

### How-To

- **Role**: Step-by-step procedural, task-oriented content
- **Valid parents**: Guide, or a Topic within a Guide
- **Valid children**: None — cannot contain any sub-articles
- **TOC**: Auto-generated from H1–H3 headings
- **GCF tag value**: `article:howto`

---

### Reference

- **Role**: Lookup information — technical specs, configuration lists, glossaries, API docs
- **Valid parents**: Guide, or a Topic within a Guide
- **Valid children**: None — cannot contain any sub-articles
- **TOC**: Auto-generated from H1–H3 headings
- **GCF tag value**: `article:reference`

---

### Summary table

| Type | GCF tag | Valid parent | Can contain |
|------|---------|--------------|-------------|
| Category | `article:topic-category` | Homepage / Category | Category, Guide |
| Guide | `article:topic-guide` | Category | Topic, How-To, Reference |
| Topic | `article:topic` | Guide | How-To, Reference |
| How-To | `article:howto` | Guide or Topic | — |
| Reference | `article:reference` | Guide or Topic | — |

The GCF tag is set via a PUT to `/@api/deki/pages/{id}/tags` after page creation. See `expert-api-pages` for the two-step create + tag pattern.
