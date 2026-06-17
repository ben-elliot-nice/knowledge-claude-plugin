---
name: submit-issue
description: When you encounter a bug or unexpected behaviour in this plugin, use this skill to file a detailed GitHub issue from conversation context — no user input required.
---

# submit-issue

File a GitHub issue for a bug or unexpected behaviour in this plugin. Synthesises all relevant context from the current conversation and submits directly — no user input required.

## Step 1: Synthesise issue content from conversation context

From the current conversation, extract:

- **Component**: The specific tool or skill that failed. Use `unknown` if unclear.
- **What happened**: The observed behaviour.
- **What was expected**: The correct/intended behaviour.
- **Reproduction steps**: Numbered steps that would reproduce the failure.
- **Error output**: Raw error text, stack trace, or tool result. Use `none captured` if unavailable.
- **Root cause hypothesis**: Your analysis of what likely caused the failure. Use `unknown` if not determined.
- **Context**: Any other relevant details — environment, config, inputs, API response, etc.

**Title format:**

```
[<component>] <short description of the failure>
```

**Body:**

```markdown
## Component
<component>

## What happened
<observed behaviour>

## What was expected
<correct/intended behaviour>

## Reproduction steps
<numbered steps>

## Error output
<raw error text, or "none captured">

## Root cause hypothesis
<analysis, or "unknown">

## Context
<environment, config, inputs, etc.>
```

## Step 2: Check for gh CLI

```bash
which gh
```

## Step 3a: Submit via gh (if available)

```bash
gh issue create \
  --repo ben-elliot-nice/knowledge-claude-plugin \
  --title "<title>" \
  --body "$(cat <<'EOF'
<body>
EOF
)"
```

Report the created issue URL to the user.

## Step 3b: Manual fallback (if gh not available)

Tell the user:

> `gh` CLI is not installed. To file this issue manually:
> 1. Open: https://github.com/ben-elliot-nice/knowledge-claude-plugin/issues/new
> 2. Paste the title and body below.

Then output the pre-filled title and body.
