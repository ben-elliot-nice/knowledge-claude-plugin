---
topic: expert-webhooks
description: Expert webhook system — supported events, payload headers, auth, retry, and idempotency
group: expert-api
---

## expert-webhooks — Expert Webhook System

Expert (MindTouch) supports outbound webhooks that POST to an external HTTPS endpoint when content events occur. This is the primary event-driven integration surface — use it instead of polling the events API wherever possible.

### Supported events

**Page events:**
- `Page_Create` — new page created
- `Page_Copy` — page duplicated
- `Page_Move` — page relocated
- `Page_Restore` — page recovered from deletion
- `Page_Delete` — page removed
- `PageContent_Update` — page content modified (primary trigger for content lifecycle automation)

**Attachment events:** `Attachment_Create`, `Attachment_Copy`, `Attachment_Move`, `Attachment_Restore`, `Attachment_Delete`, `Attachment_Update`

**User events:** `User_Create`, `User_Update`

### Request format

Delivery is an HTTP POST to your HTTPS endpoint with the following headers:

```
Authorization: Bearer <your-jwt-token>
X-Nexus-Signature-256: sha256=<hmac-sha256-hash>
X-Nexus-Timestamp: <unix-timestamp>
X-Nexus-Event-Type: PageContent_Update
X-Nexus-Delivery-Id: <unique-uuid>
Content-Type: text/xml
```

Signature verification: `HMAC-SHA256(secret, "${timestamp}.${payload}")`. Validate before processing.

### Critical constraint: 1-second timeout

Expert waits a maximum of **1 second** for your endpoint to respond. After that it retries with exponential backoff on 5xx responses. After multiple consecutive failures, Expert automatically **disables** the webhook — manual re-enablement via Dashboard is required.

**Pattern:** Acknowledge with HTTP 200 immediately, enqueue event, process asynchronously. Never do real work in the handler path.

### Retry and delivery behaviour

- `2xx` → success, no retry
- `4xx` → permanent failure, no retry
- `5xx` or timeout → temporary, retries with exponential backoff
- Bulk operations may pause webhook delivery
- Concurrent delivery limits apply

### Idempotency

Use `X-Nexus-Delivery-Id` to deduplicate events. Store processed delivery IDs — retries will carry the same ID.

### Draft vs published events

Whether `PageContent_Update` fires on draft saves or only on publish is unconfirmed from public documentation. Conservative assumption: treat all events as potentially draft-origin and check page published state via a follow-up API call before processing lifecycle logic. If the payload includes a state field, use that instead.

### Events API (backfill and recovery)

The events log endpoint provides a pull-based alternative for catching up after downtime or bootstrapping existing articles:

```
GET /@api/deki/events/draft-hierarchy/logs/file
```

Use this as a recovery path, not the primary mechanism. It also helps distinguish draft vs published events during initial testing.

### Webhook configuration

Managed via the Expert Admin Dashboard or the API (DELETE / GET / POST / PUT). Requires Dashboard access with webhook management permissions. Endpoint must use HTTPS. JWT auth is recommended over basic auth for long-term use.

### Monitoring

Dashboard provides delivery status, failure rates, response times, and CSV log exports.
