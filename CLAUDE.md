# Knowledge Claude Plugin

## Rules

- **Shell commands:** if Claude is constructing the command, run each step as a separate Bash call. If a compound command is explicitly defined in this CLAUDE.md, run it as written.

## After every commit + push (knowledge update)

```bash
cd /Users/Ben.Elliot/repos/claude-marketplace/nice-claude-marketplace && git submodule update --remote && git add plugins && git commit -m "Knowledge plugin update" && git push
```
