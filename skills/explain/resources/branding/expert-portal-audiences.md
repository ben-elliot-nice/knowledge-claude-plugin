---
topic: expert-portal-audiences
description: Multi-audience portal strategy in Expert — how to serve agents and customers from one tenant, and when a second tenant is required
group: branding
---

## expert-portal-audiences — Multi-Audience Portal Strategy

### The core question

Expert does not have a "portal" as a distinct configurable surface within a tenant. There is one site, one URL, one template hierarchy. A customer-facing experience with different branding, navigation, and content scope is achieved through role-based configuration — not by provisioning a second portal object.

A second tenant is the only way to get a genuinely independent URL, independent admin control, and independent branding entirely outside the role-based system.

### Approach 1: Role-based CSS (single tenant, same URL)

Use the six role-scoped CSS fields to apply different visual identities to different audiences:

| Audience | CSS field to use |
|---|---|
| Unauthenticated customers (public) | Anonymous CSS |
| Authenticated customers (community members) | Authenticated Viewer CSS |
| Internal agents (Seated/Pro Members) | Seated User CSS |
| Admins | Admin CSS |

Each field compiles independently. An anonymous visitor can see a customer-branded header and colour scheme while an authenticated Seated agent sees a different one — all within the same tenant and URL.

**Limitations:** Navigation IA is the same URL structure for all roles. You can hide/show elements with CSS (`display: none`) but the underlying page tree is shared.

### Approach 2: Touchpoints on a separate customer domain (single tenant, different URL)

Embed Expert Touchpoints (Search, Contextual Help, Customer Insights) in a separately branded web property. The customer-facing site is built and owned externally; Expert supplies the knowledge content via Touchpoints styled with their own Custom CSS.

- Customer sees your corporate/product domain, not the Expert domain
- Expert handles content retrieval; you control the surrounding page entirely
- Each Touchpoint has its own Custom CSS field for scoping
- The Sign-In Touchpoint handles authenticated access, redirecting into permissioned content

**Best fit for:** Cases where the "customer portal" is a marketing or product site with knowledge embedded as a component, not as the primary experience.

### Approach 3: Second tenant (fully independent)

A separate Expert tenant gives a completely independent instance: different URL, different admin, different branding stack, different content tree. Content sharing between tenants is not a built-in feature — duplication or an API sync pipeline would be needed.

**Required when:** You need independent Content Header/Footer regions, an independent template hierarchy, independent SSO configuration, or want to prevent any possibility of content leakage between audience types.

### Content scoping within a single tenant

Page-level permissions gate content by user type. Pages can be set to:

- **Public** — visible to all (Anonymous CSS applies)
- **Semi-Public** — visible to logged-in users
- **Semi-Private** — visible to specific groups
- **Private** — Admin only

Agent-only content should be set to Semi-Private or Private, assigned to the relevant internal group. Community members (authenticated customers) and anonymous visitors will not see it. This is the mechanism to prevent customers accessing agent-only material in a single-tenant setup.

### Summary decision guide

| Requirement | Recommended approach |
|---|---|
| Different colour/logo per audience, same URL | Role-based CSS (Approach 1) |
| Customer portal on a separate branded domain | Touchpoints on external site (Approach 2) |
| Completely separate admin, URL, and content | Second tenant (Approach 3) |
| Agent content hidden from customers | Page-level permissions (any approach) |
| Different navigation IA per audience | Second tenant, or Touchpoint-based external site |
