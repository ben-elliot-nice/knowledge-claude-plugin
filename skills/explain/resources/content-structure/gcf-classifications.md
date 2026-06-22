---
topic: gcf-classifications
description: Custom classifications and tags in Expert — how they work, how they differ, and how to use them for Guide tabs, search filtering, and content management
group: content-structure
---

## gcf-classifications — Classifications and Tags

Expert has two related but distinct systems for labelling content: **custom classifications** and **tags**. Both influence search and discoverability but serve different purposes.

---

### Custom Classifications

**Purpose**: Organise pages by product, version, workflow stage, or persona. Power Guide tabs and search filters.

**Configuration**: Admin role required — Site Tools > Control Panel > Systems Settings > Classifications

**Structure**:
- Each classification type has a **Prefix** + **Label**
- Each option within a type has a **Tag** + **Label**
- Types and options are ordered in the dropdown in the order they were added

**Recursive option**: When enabled, a classification applied to a page automatically applies to all sub-pages created under it.

**Guide Tabs**: When a Guide is set to Tabbed display, each tab surfaces articles that share a classification. Up to 10 classifications per tab. Articles can belong to multiple classifications simultaneously. Tab order is set by creation date by default; can be reordered via drag-and-drop.

**Batch application**: Page Classification Manager → filter pages → "Change classification to"

**Search**: Classifications appear as filter options in search results by default. They work with Expert's search algorithm to improve result ordering.

---

### Tags

**Purpose**: Enhance SEO and content recommendations. Tags on related pages strengthen article-to-article relationships.

**Best practices**:
- Limit to **5 tags per page** for optimal performance
- Use **singular forms** (except terms like "analytics" that are primarily plural)
- **Avoid colons** in tag values — they interfere with site structure
- Apply **identical tags** to related pages to strengthen the relationship
- Choose tags representing search terms NOT already prominent in titles, summaries, or body text — tags add discoverability, not redundancy

**Application methods**:
- Individual page: Page Settings > enter tag name (autocomplete available)
- Batch: Page Classification Manager > filter > "Change classification to"

**Benefits**:
- Powers the "Recommended Articles" feature
- Appears as filter options in search results
- Contributes to SEO and positions content as authoritative on a subject

---

### Classifications vs Tags — when to use which

| Use case | Use |
|----------|-----|
| Populating Guide tabs | Custom Classification |
| Filtering search results by product/persona | Custom Classification |
| Grouping content for workflow stage management | Custom Classification |
| Boosting related-article recommendations | Tags |
| Adding SEO-relevant search terms | Tags |
| Surfacing content not discoverable from title alone | Tags |
