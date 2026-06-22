---
topic: expert-review-manager
description: Expert Review Manager — what it is, its UI-only nature, and what is not accessible via API
group: expert-api
---

## expert-review-manager — Review Manager

Review Manager is an Expert (MindTouch) feature for editorial review workflows. It allows assigning review tasks to users or groups and tracking their completion.

### Feature capabilities (UI)

- Create a review request for any page, assigned to a user or group
- Review states: open, pending edits, reassigned, accepted, archived
- Review Queue dashboard: shows open reviews assigned to the current user
- CSV exports available: All Reviews, My Reviews, All Reviews History
- Notifications sent to assigned reviewers

### API surface

**Review Manager has no documented REST API endpoints.**

There is no endpoint to:
- List open reviews
- Query review status for a specific page
- Get the assigned reviewer or due date
- Create or close a review via API
- Filter pages by review state

### Where review data may be stored

If Review Manager persists state programmatically, it is likely stored as custom page properties under a `urn:custom.mindtouch.com#` namespace prefix, accessible via `GET /@api/deki/pages/{pageid}/properties`. This is unconfirmed — an inspection of actual property payloads on a reviewed article would be needed to verify.

### Workarounds for programmatic review tracking

Since Review Manager is UI-only, compliance workflows that need review dates accessible programmatically must implement their own tracking:

1. **Manual tagging:** Authors apply a machine tag when a review is due (e.g., `tag:review:due-2026-Q1`). A DekiScript dashboard queries by tag. Requires process discipline — tags don't self-update.

2. **Custom page properties:** An external integration writes a `review-due-date` property to articles via `PUT /@api/deki/pages/{pageid}/properties/review-due-date`. DekiScript reads these via `wiki.api()`. Requires a process or integration to set and maintain the values.

3. **Product request:** If Review Manager API access is needed at scale, raise a feature request with NICE to expose review queue data via a REST endpoint.

### Impact on compliance dashboard feasibility

Any dashboard requirement that includes Review Manager state (who needs to review, when, approval status) **cannot be met using the current API surface.** The scheduled-unpublish use case and the review-obligation use case require separate approaches:

- Scheduled unpublish → accessible via `publicationschedules.csv` (Admin, CSV) with external write-back
- Review obligations → not accessible via API; requires custom property/tag convention or a NICE product request
