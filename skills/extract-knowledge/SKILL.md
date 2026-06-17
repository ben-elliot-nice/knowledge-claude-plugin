---
name: extract-knowledge
description: Extract and structure knowledge from websites into hierarchical markdown knowledge bases organized as category to guide to article. Use when the user wants to: (1) Convert web content into organized articles, (2) Build a knowledge base from website documentation, (3) Structure unstructured web content into guides and articles, (4) Create hierarchical documentation from web sources. Requires a URL as input. Optionally supports: specifying categories or specializations to focus extraction, and choosing between strict extraction (only content from source) or hallucination mode (including likely relevant content beyond what's explicitly on the page).
---

# Extract Knowledge

Extract web content and transform it into a structured hierarchical knowledge base organized as **category → guide → article**.

## Required Input

**URL** (required): The website URL to extract knowledge from.

## Optional Parameters

Accept these via user request or ask if not specified:

- **Output directory** (default: `skill-output/extract-knowledge/<domain-name>/`): Where to save the knowledge base
- **Categories/Specializations** (optional): Focus extraction on specific topics (e.g., "fines", "penalties", "enforcement")
- **Extraction mode** (default: `strict`):
  - `strict`: Only extract content explicitly present on the website
  - `hallucinate`: Include likely relevant content beyond what's explicitly available
- **Include image references** (default: `yes`): Extract and include image URLs found in the source content
  - Adds an "Images & Resources" section to each article with relevant image references
  - Creates an `IMAGE_URLS.md` file with all extracted image URLs for manual download
  - Does NOT download actual image files - only extracts URLs as markdown references

## Core Workflow

### ⚠️ Rate Limiting Prevention (IMPORTANT)

**When using webReader MCP tool:**

1. **ALL webReader calls MUST be:**
   - Made in the MAIN process (never in subagents)
   - Made SEQUENTIALLY (one at a time, never parallel)
   - Spaced 2-3 seconds apart

2. **Subagents SHOULD be used for:**
   - Analyzing content (after it's fetched)
   - Writing articles
   - Organizing and processing
   - Any task that doesn't involve fetching

3. **NEVER:**
   - Spawn multiple subagents that each call webReader
   - Fetch pages in parallel
   - Make more than 10-15 webReader calls per session

**When using Puppeteer script:**
- ✅ No external rate limits (uses local Chrome)
- ✅ Still fetch sequentially for stability
- ✅ Built-in delay (default 2 seconds) between fetches
- ✅ Can fetch more pages per session

**Why?** The webReader tool has rate limits that trigger when multiple concurrent requests are made. Puppeteer uses a local browser and avoids these limits.

### Initial Validation

Before starting extraction, confirm parameters with the user:

```
I'll extract knowledge from the provided URL. Let me confirm a few parameters:

1. **Output directory**: Where should I save the knowledge base?
   - Default: skill-output/extract-knowledge/<domain-name>/

2. **Extraction mode**: Which mode should I use?
   - Strict (recommended): Only extract content explicitly present on the website
   - Hallucinate: Include likely relevant content beyond what's explicitly available

3. **Image references**: Should I extract image references from the content?
   - Yes (default): Extract image URLs and add them to articles
   - No: Skip image extraction

4. **Linked pages**: Should I explore linked pages from the main site?
   - Yes (recommended): Fetch and analyze linked sub-pages for comprehensive coverage
   - No: Only extract content from the main page URL
```

### Phase 1: Fetch Content (Sequential - Main Process)

**IMPORTANT**: All fetch calls must be made sequentially in the MAIN process to avoid rate limiting. Do NOT use subagents for fetching.

#### Fetch Method Selection

Choose the appropriate fetch method based on the website type:

| Method | Best For | Content Captured | Command |
|--------|----------|-----------------|---------|
| **webReader MCP** | Simple HTML sites, static content | Initial HTML only | `mcp__web_reader__webReader` |
| **Puppeteer script** | JavaScript-rendered sites, SPAs | Fully rendered content + images/links | `bash scripts/fetch-page.sh <url>` |

**Recommendation**: Try Puppeteer first for modern websites. Fall back to webReader if Puppeteer fails or isn't available.

#### Option A: Puppeteer Fetch (Recommended for JS Sites)

```bash
# Create output directory
mkdir -p <output-dir>

# Fetch main page using Puppeteer
SKILL_BASE=/home/belliot/projects/claude/cognigy-plugin/plugin/skills/extract-knowledge
bash "$SKILL_BASE/scripts/fetch-page.sh" "<URL>" "<output-dir>"

# The script creates fetched.md, rename to raw content
mv <output-dir>/fetched.md <output-dir>/01-raw-content.md
```

**Puppeteer Advantages**:
- ✅ Captures JavaScript-rendered content
- ✅ Extracts images and links automatically
- ✅ No rate limiting (local Chrome)
- ✅ Better for SPAs and modern sites

#### Option B: webReader MCP (For Simple Sites)

```bash
# Create output directory
mkdir -p <output-dir>

# Fetch main page
mcp__web_reader__webReader url="<URL>" return_format="markdown" retain_images="false" | \
  Write file:<output-dir>/01-raw-content.md
```

**Rate Limiting Prevention** (webReader only):
- ✅ Fetch pages sequentially (one at a time)
- ✅ Use main process for all webReader calls
- ✅ Add 2-3 second delay between fetches if fetching multiple pages
- ❌ Do NOT spawn subagents for webReader operations
- ❌ Do NOT fetch multiple pages in parallel

### Phase 2: Analyze for Article Extraction (Subagent)

Now use a subagent to analyze the raw content (subagents are fine for processing, just not fetching):

```markdown
Read the file at <output-dir>/01-raw-content.md

Analyze this content and identify distinct topics that could be extracted as individual knowledge articles.

For each potential article, provide:
1. A suggested title
2. A brief description of what this article should cover
3. Which other articles it relates to (for grouping into guides)

Write your analysis to: <output-dir>/02-analysis.md
Return ONLY the filename when complete.
```

**Analysis should identify**:
- Distinct topics requiring separate articles
- Natural groupings for guides
- Related articles for cross-referencing

### Phase 3: Write Articles

For each identified article, spawn a subagent:

```markdown
Read the raw content at <output-dir>/01-raw-content.md
(and optionally: 02-analysis.md for context)

Write a comprehensive knowledge article about: "<article-title>"

Your article should cover:
- <specific points from analysis>

Write this as a standalone educational article in fine-grained detail.
Use clear markdown formatting.

Save to: <output-dir>/articles/<article-slug>.md
Return ONLY the filename when complete.
```

**Parallelize**: Spawn multiple article writers concurrently to maximize throughput.

### Phase 4: Organize Hierarchy

Once all articles are complete, organize them into the **category → guide → article** structure:

```
<output-dir>/
├── README.md (index of all articles)
├── guide-one/
│   ├── article-one.md
│   └── article-two.md
├── guide-two/
│   ├── article-three.md
│   └── article-four.md
└── ...
```

Create the hierarchy yourself (not via subagent) to maintain control over the final structure.

### Phase 5: Explore Linked Content (Optional but Recommended)

**CRITICAL**: All fetching must be done sequentially in the MAIN process. Use subagents only for processing/analysis.

Many documentation sites have related sub-pages. To build comprehensive coverage:

1. **Extract all links** from the main page using subagent:

```markdown
Read <output-dir>/01-raw-content.md and extract all unique links.
Write to: <output-dir>/03-links-extracted.md
```

2. **Fetch linked pages SEQUENTIALLY in main process**:

**Using Puppeteer (Recommended)**:
```bash
# Create linked directory
mkdir -p <output-dir>/linked

SKILL_BASE=/home/belliot/projects/claude/cognigy-plugin/plugin/skills/extract-knowledge

# Fetch each important link sequentially
# Note: fetch-page.sh includes built-in delay (default 2 seconds)

bash "$SKILL_BASE/scripts/fetch-page.sh" "<link-1>" "<output-dir>/linked/"
mv <output-dir>/linked/fetched.md <output-dir>/linked/page-1.md

bash "$SKILL_BASE/scripts/fetch-page.sh" "<link-2>" "<output-dir>/linked/"
mv <output-dir>/linked/fetched.md <output-dir>/linked/page-2.md

# Continue for all important links...
```

**Using webReader MCP**:
```bash
# Create linked directory
mkdir -p <output-dir>/linked

# Fetch each important link sequentially (one at a time)
# Add delay between requests to avoid rate limiting

mcp__web_reader__webReader url="<link-1>" return_format="markdown" | \
  Write file:<output-dir>/linked/page-1.md

# Wait 2-3 seconds between fetches
sleep 2

mcp__web_reader__webReader url="<link-2>" return_format="markdown" | \
  Write file:<output-dir>/linked/page-2.md

# Continue for all important links...
```

**Fetching Guidelines**:
- ✅ Fetch pages sequentially (NEVER parallel)
- ✅ Use main process only for fetching
- ✅ Puppeteer includes built-in delays; webReader needs manual `sleep`
- ✅ Prioritize important content pages (product info, about, support)
- ❌ Do NOT use subagents for fetching
- ❌ Do NOT fetch more than 10-15 pages per session

3. **Analyze each** for new content or enhancements (subagents OK here)
4. **Create new articles** or enhance existing ones (subagents OK here)
5. **Reorganize hierarchy** if new categories emerge

### Phase 6: Create README

Generate an index (`README.md`) that shows:
- Source URL and fetch date
- Total article count
- Hierarchy structure with links
- What's new (enhanced articles, new categories)

### Phase 7: Extract Image References (Optional but Recommended)

If image references were requested (default: yes):

1. **Extract all image URLs** from raw content and linked pages using subagent:

```markdown
Read the following files and extract ALL image URLs/references:
1. <output-dir>/01-raw-content.md
2. All files in <output-dir>/linked/

For each image found, provide:
- The full image URL
- The context/section where it appears
- Alt text or description if available
- Which article category it relates to

Organize the results by category/article and write to: <output-dir>/04-image-refs.md
Return ONLY the filename when complete.
```

2. **Update articles with image references** using parallel subagents:
   - Group articles by category
   - Spawn subagents to add "Images & Resources" sections to relevant articles
   - Each article gets images appropriate to its category/topic

3. **Create quick reference file** (`IMAGE_URLS.md`) with:
   - All image URLs organized by category
   - Download commands (curl/wget examples)
   - Image types and usage notes

**Note**: This phase only extracts image URLs, not the actual image files. Images remain hosted on the source website. Users can download manually using the provided URLs.

## Extraction Modes

### Strict Mode (default)

Only extract content explicitly present on the source website.

**Use when**: Accuracy is critical, source is authoritative, user wants verbatim information.

**Behavior**:
- Articles contain only facts from source
- No inferences beyond what's stated
- Direct quotes and references to source

### Hallucinate Mode

Include likely relevant content beyond what's explicitly available.

**Use when**: User wants comprehensive coverage, source is incomplete, domain knowledge can fill gaps.

**Behavior**:
- Infer connections between concepts
- Include related domain knowledge
- Suggest likely processes/procedures not explicitly detailed
- Flag inferred vs. explicit content

**Implementation**: Add to article writer prompt:

```markdown
EXTRACTION MODE: Hallucinate

You may include:
- Likely related concepts not explicitly mentioned
- Inferred processes based on domain knowledge
- Connections between related topics

When adding non-source content:
- Clearly distinguish between explicit source content and inferred knowledge
- Use phrases like "typically involves" or "may include" for inferences
- Maintain clear sourcing transparency
```

## Categories and Specializations

When the user provides categories/specializations:

1. **Filter analysis**: Focus article identification on provided categories
2. **Prioritize**: Create articles in priority categories first
3. **Cross-reference**: Note relationships to non-priority topics without full articles

Example:
```
URL: https://justice.vic.gov.au/fines
Categories: ["fines", "penalties", "enforcement"]
→ Skip "courts", "legal-aid" topics even if mentioned
```

## Context Window Management

**Critical**: This workflow generates massive token volume. To stay within limits:

1. **Fetch content** in main process sequentially (Puppeteer script or webReader calls)
2. **Use subagents** for analyzing, processing, and writing
3. **Never read raw content** yourself - read only the analysis file
4. **Never read articles** during creation - filenames only
5. **Only read analysis** to identify what to create
6. **Batch article writers** in parallel (3-5 at a time) - AFTER all fetching is complete
7. **Let subagents handle** all token-heavy operations EXCEPT fetching

**Key Principle**: Fetch first (main process, sequential), then process (subagents, parallel)

**Note**: Puppeteer fetcher doesn't have rate limits like webReader, but sequential fetching is still recommended for stability.

## Output Structure

Final knowledge base structure:

```
<output-dir>/
├── README.md                    # Hierarchical index
├── 01-raw-content.md           # Source content (optional, can delete)
├── 02-analysis.md              # Article analysis (optional, can delete)
├── 03-links-extracted.md       # Extracted links (if Phase 5 run)
├── 04-image-refs.md            # Image extraction report (if Phase 7 run)
├── IMAGE_URLS.md               # Quick reference for all image URLs (if Phase 7 run)
├── IMAGE_UPDATE_SUMMARY.md     # Image update statistics (if Phase 7 run)
├── linked/                     # Fetched sub-pages (optional)
│   ├── page-one.md
│   └── analysis-page-one.md
├── guide-one/                  # Category/Guide
│   ├── article-one.md
│   └── article-two.md
├── guide-two/
│   └── article-three.md
└── ...
```

## Example Invocation

**User**: "Extract knowledge from https://www.justice.vic.gov.au/justice-system/fines-and-penalties into docs/fines-penalties/"

**Claude response**:
```
I'll extract and structure the knowledge from that URL.

Phase 1: Fetching content...
→ Subagent returns: 01-raw-content.md

Phase 2: Analyzing for articles...
→ Subagent returns: 02-analysis.md (20 articles identified)

Phase 3: Writing articles (parallel)...
→ 20 subagents return individual article filenames

Phase 4: Organizing hierarchy...
→ Created 6 guides with 27 articles total

Phase 5: Exploring linked content...
→ 4 sub-pages fetched, 9 new/enhanced articles

Phase 6: Creating README...
→ Generated index with hierarchy and statistics

Phase 7: Extracting image references...
→ Extracted 15 image URLs from content
→ Added image references to 18 articles
→ Created IMAGE_URLS.md quick reference

Done! Knowledge base at: docs/fines-penalties/
```

## Related Skills

- `create-skill`: For packaging this or other skills
- `git-commit`: For committing the knowledge base to version control
