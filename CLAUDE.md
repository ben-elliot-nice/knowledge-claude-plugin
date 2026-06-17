# Knowledge Claude Plugin

## Rules

- **After any change to `skills/`**, increment the version in `.claude-plugin/plugin.json`. Always patch increment unless directed otherwise (e.g. `1.0.0` → `1.0.1`).
- **Shell commands:** if Claude is constructing the command, run each step as a separate Bash call. If a compound command is explicitly defined in this CLAUDE.md, run it as written.
