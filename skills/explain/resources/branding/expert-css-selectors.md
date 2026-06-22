---
topic: expert-css-selectors
description: Expert DOM structure, elm-* component classes, and columbia-* body targeting hooks — sourced from live HTML captures
group: branding
---

## expert-css-selectors — DOM Structure and CSS Targeting

Source: rendered HTML captures from article, guide, and home/category page types.

---

### Body classes — the primary targeting system

Expert injects a set of classes onto `<body>` on every page load. These are the canonical hooks for conditional CSS — target these, not internal element classes.

#### User state classes (on `<body>`)

| Class | User type |
|---|---|
| `.elm-user-anonymous` | Unauthenticated visitor |
| `.elm-user-community` | Authenticated Community Member |
| `.elm-user-pro-member` | Authenticated Seated/Pro Member |
| `.elm-user-pro-edit` | Seated Member with Author/Editor role (also gets `elm-user-pro-member`) |

Use these for audience-specific CSS without needing separate role CSS fields:

```css
/* Hide agent-only UI from all non-agents */
.elm-user-anonymous .agent-only,
.elm-user-community .agent-only {
    display: none;
}
```

#### Group membership class (on `<body>`)

Expert injects `columbia-group-<groupname>` for each group the current user belongs to. Example from live HTML:

```
columbia-group-agent
```

This is the most precise audience hook: target `body.columbia-group-agent` to style content for users in a specific named group, regardless of their seat type.

#### Page type classes (on `<body>`)

| Class | When applied |
|---|---|
| `columbia-page-main` | Standard article/guide page |
| `columbia-page-home` | Home page or category landing |
| `columbia-page-special` | Special/admin pages |
| `columbia-page-template` | Template editing pages |
| `columbia-page-user` | User profile pages |

#### Article type classes (on `<body>`)

| Class | Article type |
|---|---|
| `columbia-article-howto` | How-to |
| `columbia-article-reference` | Reference |
| `columbia-article-topic` | Generic topic |
| `columbia-article-topic-guide` | Topic guide |
| `columbia-article-topic-category` | Category/hub page |
| `columbia-article-topic-portfolio` | Portfolio |
| `columbia-learning-path` | Learning path |

#### Content state classes (on `<body>`)

| Class | Meaning |
|---|---|
| `columbia-live` | Page is published |
| `columbia-draft` | Page is in draft |
| `columbia-skin-elm` | Current theme skin (always present in ELM skin) |
| `columbia-rtl` | Right-to-left language direction |

#### Breadcrumb path class (on `<body>`)

Expert encodes the full breadcrumb path as a single body class:

```
columbia-breadcrumb-home-utilities-youraccount-manageaccount-cannotsignin
```

Use this for targeting CSS at specific sections of the hierarchy without relying on URL patterns.

#### Platform and language classes (on `<body>`)

`columbia-browser-chrome`, `columbia-browser-firefox`, `columbia-browser-safari`, `columbia-browser-msie10`, `columbia-browser-msie11`, `columbia-browser-iemobile`, `columbia-browser-blackberry`

`columbia-platform-macintosh`, `columbia-platform-windows`, `columbia-platform-ipad`, `columbia-platform-iphone`

`columbia-lang-en-us`, `columbia-lang-de-de`, `columbia-lang-ar-sa`, `columbia-lang-ja-jp`, `columbia-lang-pl-pl`, `columbia-lang-ru-ru`, `columbia-lang-zh-cn`, `columbia-lang-zh-tw`

`no-touch` — applied on non-touch devices; always guard hover rules with this:
```css
.no-touch .elm-header a:hover { ... }
```

---

### DOM structure — `elm-*` component classes

This is the structural skeleton, consistent across all page types. Elements appear in document order.

```
<body class="elm-user-[TYPE] columbia-[PAGE] columbia-[ARTICLE] ...">
  <a class="elm-skip-link">                     ← skip nav link
  <main class="elm-skin-container">             ← outermost page wrapper

    <header class="elm-header">
      <div class="elm-header-custom">           ← custom logo / header HTML injection point
      <div class="elm-nav">                     ← translation module (hidden by default)
        <div class="elm-nav-container">
      <div class="elm-header-logo-container">   ← platform logo
      <nav class="elm-header-user-nav elm-nav"> ← search + user menu bar
        <div class="elm-nav-container">
          <div class="elm-global-search">       ← search field
          <div class="elm-search-back">         ← back navigation
          <div class="elm-user-menu">           ← user avatar / sign-in
      <nav class="elm-header-global-nav elm-nav"> ← main site navigation
        <div class="elm-nav-container">
      <nav class="elm-nav elm-header-hierarchy"> ← breadcrumb trail
        <div class="elm-nav-container">
          <div class="elm-hierarchy">
      <nav class="elm-nav elm-header-notice elm-live-notice"> ← banners/notices
        <div class="elm-nav-container">

    <div class="elm-content-container">         ← article body

      [article / guide pages only]
      <div class="elm-meta-data elm-meta-top">  ← metadata row above content
        <div class="elm-last-modified">
        <div class="elm-page-restriction">
        <div class="elm-meta-icons">
          <div class="elm-page-notifications">
          <div class="elm-pdf-export">
          <div class="elm-social-share">

      <div class="elm-content-footer">          ← below article body

      <div class="elm-meta-data elm-meta-article-navigation">
        <div class="elm-back-to-top">
        <div class="elm-article-pagination">    ← prev/next nav
        <div class="elm-article-feedback">      ← helpful/not helpful

      <div class="elm-related-articles-container">

      <div class="elm-meta-data elm-meta-bottom">
        <div class="elm-classifications">
        <div class="elm-tags">
        <div class="elm-attachments">

      [home / category pages only]
      <footer class="elm-footer">
        <nav class="elm-footer-siteinfo-nav elm-nav">
        <div class="elm-footer-copyright">
        <div class="elm-footer-powered-by">
        <div class="elm-footer-custom">         ← custom footer HTML injection point
```

---

### Navigation components

Homepage/category nav panel (expanded side navigation):

```
.elm-homepage-nav-container
  .elm-homepage-nav-list-root
    .elm-homepage-nav-list
      .elm-homepage-nav-item
        .elm-homepage-nav-detail
        .elm-homepage-nav-expand
        .elm-homepage-nav-sublist
          .elm-homepage-nav-subitem
            .elm-homepage-nav-sublist-style
.elm-homepage-nav-back
```

Control classes toggled by JS: `.elm-homepage-nav-show`, `.elm-homepage-nav-hide`, `.elm-homepage-nav-selected`, `.elm-header-homepage-nav-open`

Fixed header (injected on scroll): `.elm-fixed-header`

---

### Custom injection points

| Element | Purpose |
|---|---|
| `.elm-header-custom` | Header region — logo, custom HTML, scripts |
| `.elm-footer-custom` | Footer region — custom HTML, scripts |
| `.custom-header-logo-container` | Tenant logo container inside header-custom |

The tenant logo rendered by the template system uses `.custom-header-logo-container` and `#custom-logo`, distinct from the platform default logo at `.elm-header-logo-container`.

---

### Special page selectors

| Class | Page |
|---|---|
| `.columbia-special-search` | Site search results |
| `.columbia-special-revisionhistory` | Page revision history |
| `.columbia-special-revisiondiff` | Revision diff view |
| `.columbia-special-draftmanager` | Draft manager |
| `.columbia-special-pathmanager` | Learning path manager |
| `.columbia-special-reports` | Analytics reports |
| `.columbia-special-preferences` | User preferences |
| `.columbia-special-userlogin` | Login page |
| `.columbia-special-userpassword` | Password reset |
| `.columbia-special-classificationmanager` | Classification manager |
| `.columbia-special-importexport` | Import/export |
| `.columbia-special-sitehealth` | Site health |
| `.columbia-special-sitemap` | Sitemap |
| `.columbia-special-popularpages` | Popular pages |
| `.columbia-special-pagerestrictions` | Page restriction settings |
