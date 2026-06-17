# Knowledge Claude Plugin

## Git Worktrees

Worktrees live at `.claude/worktrees/` (gitignored). Do not use `.worktrees/`.

## Rules

- **After any change to `skills/`**, increment the version in `.claude-plugin/plugin.json`. Always patch increment unless directed otherwise (e.g. `1.0.0` → `1.0.1`).
- **Shell commands:** if Claude is constructing the command, run each step as a separate Bash call. If a compound command is explicitly defined in this CLAUDE.md, run it as written.

## Required Plugins

Install before working on this repo:

```bash
claude plugin install knowledge@private
```

## Local Development Setup

After cloning:

```bash
git config core.hooksPath .githooks   # register pre-commit hook
cp .env.example .env                  # fill in credentials
mise trust                            # allow mise to auto-source .env
```

## MCP Dev Loop

The proxy at `scripts/mcp-proxy.py` keeps Claude Code connected while you iterate on `server/`. After editing server source:

```bash
bash scripts/restart-mcp.sh
```

Then make any MCP tool call — the updated source is live.

## Development Workflow

1. **Feature arrives in chat** — capture requirements before touching code or branching
2. **Sync remote main** — `git pull` on a clean tree; `git fetch origin main` if uncommitted changes exist
3. **Branch from `origin/main`** — `git checkout -b feat/<name> origin/main`
4. **Implement** — bump version in `.claude-plugin/plugin.json` for any skills change
5. **Push and open a PR** — `gh pr create`; wait for `check-version-bump` CI to pass
6. **Merge via squash** — GitHub enforces squash-only on this repo
