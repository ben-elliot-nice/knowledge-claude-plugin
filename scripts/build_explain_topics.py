#!/usr/bin/env python3
"""Build skills/explain/SKILL.md from template + resource markdown files."""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
RESOURCES_DIR = REPO_ROOT / "skills/explain/resources"
TEMPLATE_FILE = REPO_ROOT / "skills/explain/SKILL.md.template"
OUTPUT_FILE = REPO_ROOT / "skills/explain/SKILL.md"

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_frontmatter(text: str) -> dict:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    fields = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            fields[key.strip()] = value.strip()
    return fields


def collect_topics() -> list[dict]:
    topics = []
    seen_slugs: set[str] = set()

    for path in sorted(RESOURCES_DIR.rglob("*.md")):
        if path.name.startswith("."):
            continue
        text = path.read_text()
        fm = parse_frontmatter(text)

        for required in ("topic", "description"):
            if not fm.get(required):
                print(f"ERROR: {path} missing required frontmatter field '{required}'", file=sys.stderr)
                sys.exit(1)

        slug = fm["topic"]
        if slug in seen_slugs:
            print(f"ERROR: duplicate topic slug '{slug}' in {path}", file=sys.stderr)
            sys.exit(1)
        seen_slugs.add(slug)

        topics.append({
            "topic": slug,
            "description": fm["description"],
            "group": fm.get("group", ""),
        })

    return topics


def build_registry(topics: list[dict]) -> str:
    if not topics:
        return "_No topics defined yet. Add markdown files to `skills/explain/resources/`._"

    ungrouped = sorted([t for t in topics if not t["group"]], key=lambda t: t["topic"])
    grouped: dict[str, list] = {}
    for t in topics:
        if t["group"]:
            grouped.setdefault(t["group"], []).append(t)
    for g in grouped:
        grouped[g].sort(key=lambda t: t["topic"])

    lines = []

    for t in ungrouped:
        lines.append(f"- **{t['topic']}** — {t['description']}")

    for group in sorted(grouped):
        lines.append(f"\n**{group}**")
        for t in grouped[group]:
            lines.append(f"- **{t['topic']}** — {t['description']}")

    return "\n".join(lines)


def main() -> None:
    topics = collect_topics()
    registry = build_registry(topics)

    template = TEMPLATE_FILE.read_text()
    if "{{TOPIC_REGISTRY}}" not in template:
        print("ERROR: SKILL.md.template missing {{TOPIC_REGISTRY}} placeholder", file=sys.stderr)
        sys.exit(1)

    output = template.replace("{{TOPIC_REGISTRY}}", registry)
    OUTPUT_FILE.write_text(output)
    print(f"Built {OUTPUT_FILE.relative_to(REPO_ROOT)} ({len(topics)} topic(s))")


if __name__ == "__main__":
    main()
