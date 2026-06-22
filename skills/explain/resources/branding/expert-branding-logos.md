---
topic: expert-branding-logos
description: Logo and icon upload in Expert — types, formats, size constraints, and upload path
group: branding
---

## expert-branding-logos — Logos and Icons

### Admin path

**Site Tools > Control Panel > Branding > Logo & Icons**

Requires Pro Member (Seated) role or higher.

### Logo types

| Type | Placement | Max size | Notes |
|---|---|---|---|
| Site Logo | Upper-left of site header | 300px width/height | Larger sizes require Account Manager approval. File size affects mobile load times. |
| Favicon | Browser tab, URL bar, bookmarks | — | If PNG appears discoloured, convert to `.ico` format. Default favicon provided if not set. |
| Apple Touch Icon | iOS bookmark / home screen | — | Also used by some third-party search results |
| Social Share Logo | Open Graph / social previews | 600px × 315px | Social platforms prefer square dimensions |

### Accepted formats

`.gif`, `.jpg`, `.png`, `.svg`

SVG logos have no intrinsic dimensions and will render at zero size without explicit CSS. Always pair SVG logo uploads with a CSS rule:

```css
.elm-header-logo-container img {
    max-width: 20em;
}
```

### Best practices

- Remove excess white space in an image editor before upload
- Save as PNG with transparent background for cleanest rendering against custom header colours
- Small images are not stretched — they render at their natural size
