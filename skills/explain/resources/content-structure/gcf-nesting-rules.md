---
topic: gcf-nesting-rules
description: Exact allowed and prohibited nesting combinations in GCF — the rules that determine what can live under what
group: content-structure
---

## gcf-nesting-rules — GCF Nesting Rules

These rules are enforced by the Guided Content Framework. Violating them prevents content from being visible in the knowledge base.

### Allowed nesting

```
Homepage (Category)
└── Category
    └── Category          ← categories can nest recursively
        └── Guide
            ├── Topic
            │   ├── How-To    ← sub-articles under Topic
            │   └── Reference ← sub-articles under Topic
            ├── How-To
            └── Reference
```

### Prohibited combinations

| Attempt | Why it fails |
|---------|--------------|
| Article directly under Category | Articles must live inside a Guide |
| Guide under Guide | Guides are siblings, not parents of other Guides |
| Category under Guide | Only articles belong under Guides |
| Topic under Topic | Topics cannot nest inside other Topics |
| How-To under How-To | How-Tos cannot contain sub-articles |
| Reference under Reference | References cannot contain sub-articles |
| How-To under Reference (or vice versa) | Neither can contain sub-articles |
| Guide directly under Homepage without a Category | Guides must sit inside a Category |

### Key rules in plain language

1. **Categories contain Categories or Guides** — never direct articles.
2. **Guides contain articles** — Topic, How-To, Reference. Never another Guide or Category.
3. **Topics are the only articles that can have children** — and only How-To or Reference, not another Topic.
4. **How-To and Reference are always leaf nodes.**
5. **Depth for articles is capped at two levels inside a Guide**: Guide → Topic → {How-To | Reference}.

### Move/copy behaviour

When a page is moved or copied to an invalid parent, Expert shows a conflict warning. The operation is not silently permitted — the structural constraint is enforced at the UI and API level.
