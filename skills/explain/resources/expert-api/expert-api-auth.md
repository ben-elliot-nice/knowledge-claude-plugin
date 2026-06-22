---
topic: expert-api-auth
description: Expert REST API authentication — Server API Token, HMAC-SHA256 signing, token format
group: expert-api
---

## expert-api-auth — Expert API Authentication

### Authentication methods

| Method | Use case |
|---|---|
| **Server API Token** | Server-side integrations, scheduled jobs, external scripts |
| OAuth API Token | Delegated access with limited permissions |
| Browser API Token | JavaScript/CORS calls from the browser |
| Auth Token (session cookie) | Browser sessions — not suitable for server-side use |

### Server API Token (primary for integrations)

Generate a key/secret pair in the Expert admin dashboard. Tokens are **time-sensitive: 5-minute validity window** — generate a fresh token per request.

**Signing algorithm:** HMAC-SHA256

**Message to sign:**
```
{key}_{unix_epoch}_{user}
```

Where `user` is a username prefixed with `=` (e.g., `=admin`) or a numeric user ID.

**Token format:**
```
tkn_{key}_{epoch}_{user}_{hmac_sha256_hash}
```

**HTTP header:**
```
X-Deki-Token: tkn_{key}_{epoch}_{user}_{hmac_sha256_hash}
```

Official SDKs available in Java, PHP, C#, Node.js, Python 3, and Postman.

### Response format

Default: `application/xml`

Append `?dream.out.format=json` to any request for JSON:
```
GET /@api/deki/pages/123?dream.out.format=json
```

### Rate limits

No rate limits currently enforced ("we do not throttle the API under normal usage"). However, some endpoints count as HelpRequests against your license.

### License requirement

Enterprise license required for API access.

### Role-based access

All API calls are scoped to the authenticated user's role. Key restrictions relevant to compliance/dashboard use cases:

- `/@api/deki/schedules/reports/publicationschedules.csv` — **Admin only**
- `/@api/deki/pages/{pageid}?include=schedule` — requires Editor or Admin role to set schedules; read access not fully documented
- `/@api/deki/pages/{pageid}/properties` — read/write available to authenticated users (role-dependent on specific property namespaces)
