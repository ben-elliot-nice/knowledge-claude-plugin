---
name: knowledge:init
description: Set up CXone Expert credentials for this project by creating a .env file. Use when starting work in a new project that doesn't have Expert credentials configured, or when the user gets an EnvMissingError.
---

# Knowledge: Init

Create a `.env` file in the current project with Expert credentials.

## Steps

1. Ask the user for:
   - **Base URL** — e.g. `https://your-instance.mindtouch.us`
   - **API Key** — from the Expert admin panel
   - **API Secret** — from the Expert admin panel

2. Write `.env` in the current working directory:

```
EXPERT_BASE_URL=<base-url>
EXPERT_KEY=<key>
EXPERT_SECRET=<secret>
```

3. Confirm `.env` is in `.gitignore`. If no `.gitignore` exists or it doesn't cover `.env`, add it.

4. Confirm success: "Credentials saved. Run `knowledge:get --path /home` to verify connectivity."
