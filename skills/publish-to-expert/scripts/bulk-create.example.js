/**
 * bulk-create.example.js — EXEMPLAR, NOT FOR DIRECT USE
 *
 * This file demonstrates the pattern for bulk-creating a page hierarchy in
 * CXone Expert from a structured markdown directory (e.g. extract-knowledge output).
 *
 * When asked to bulk-publish a directory:
 * 1. Copy this file to the project as bulk-create.js
 * 2. Replace the MANIFEST with the actual structure (see instructions below)
 * 3. Run: node bulk-create.js
 *
 * ─── HOW TO BUILD THE MANIFEST ───────────────────────────────────────────────
 *
 * Inspect the source directory. Ignore files matching:
 *   - /^\d+-/          (numbered prefixes: 01-raw-content.md, 02-analysis.md etc.)
 *   - /^README\.md$/i
 *   - *.txt, *.html    (non-markdown content)
 *
 * Publishable structure:
 *   source-dir/                        → top-level category (or may already exist)
 *     guide-dir/                       → topic-guide
 *       article.md                     → reference page (title from H1)
 *     nested-category/                 → topic-category (if contains guide dirs)
 *       guide-dir/                     → topic-guide
 *         article.md                   → reference page
 *
 * Guide/category names: derive from directory name using kebabToTitle()
 * Page titles: extracted from the H1 of each markdown file
 *
 * Hierarchy rules:
 *   - Directories containing only .md files → guides
 *   - Directories containing subdirectories → categories
 *   - cat → cat → ... → guide → page is valid (arbitrary category nesting)
 *   - guide → guide is NOT valid
 *
 * ─── MANIFEST SCHEMA ─────────────────────────────────────────────────────────
 *
 * Each entry:
 * {
 *   name: string,           // Display name (use kebabToTitle or override)
 *   parent: string,         // Expert path of parent page (e.g. "MUFG")
 *   type: 'category'|'guide',
 *   pages: string[],        // Relative paths to .md files (for guides only)
 *   children: []            // Nested categories (for categories only)
 * }
 */

const crypto     = require('crypto');
const fs         = require('fs');
const { marked } = require('marked');

// ─── Load .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const content = fs.readFileSync('.env', 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* .env not found */ }
}
loadEnv();

const BASE_URL = process.env.EXPERT_BASE_URL;
const KEY      = process.env.EXPERT_KEY;
const SECRET   = process.env.EXPERT_SECRET;

if (!BASE_URL || !KEY || !SECRET) {
  console.error('Missing required env vars: EXPERT_BASE_URL, EXPERT_KEY, EXPERT_SECRET');
  process.exit(1);
}

// ─── Manifest — REPLACE THIS ─────────────────────────────────────────────────
const MANIFEST = [
  {
    name   : 'Example Category',       // Display name in Expert
    parent : 'MUFG',                   // Parent Expert path
    type   : 'category',
    guides : [
      {
        name  : 'Example Guide',
        pages : [
          'source-dir/guide-dir/article-one.md',
          'source-dir/guide-dir/article-two.md',
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function kebabToTitle(str) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateToken(username = '=admin') {
  const epoch   = Math.floor(Date.now() / 1000);
  const message = `${KEY}_${epoch}_${username}`;
  const hash    = crypto.createHmac('sha256', SECRET).update(message).digest('hex');
  return `tkn_${KEY}_${epoch}_${username}_${hash}`;
}

function buildPageId(parent, name) {
  return `=${encodeURIComponent(`${parent}/${name}`)}`;
}

async function pageExists(pageId, token) {
  const response = await fetch(`${BASE_URL}/@api/deki/pages/${pageId}`, {
    headers: { 'X-Deki-Token': token },
  });
  if (!response.ok) return false;
  return !(await response.text()).includes('virtual="true"');
}

async function postContents(pageId, title, bodyHtml, token) {
  const content  = `<content type="text/html" title="${title}"><body>${bodyHtml}</body></content>`;
  const params   = new URLSearchParams({ edittime: 'now', allow: 'deleteredirects,idferrors', title });
  const response = await fetch(`${BASE_URL}/@api/deki/pages/${pageId}/contents?${params}`, {
    method  : 'POST',
    headers : { 'X-Deki-Token': token, 'Content-Type': 'application/xml; charset=utf-8' },
    body    : content,
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`POST contents failed (${response.status}): ${body}`);
  const match = body.match(/<page id="(\d+)"/);
  return match ? match[1] : pageId;
}

async function putTags(numericId, articleType, token) {
  const response = await fetch(
    `${BASE_URL}/@api/deki/pages/${numericId}/tags?${new URLSearchParams({ allow: 'idferrors' })}`,
    {
      method  : 'PUT',
      headers : { 'X-Deki-Token': token, 'Content-Type': 'application/xml; charset=utf-8' },
      body    : `<tags><tag value="article:${articleType}" /></tags>`,
    }
  );
  const body = await response.text();
  if (!response.ok) throw new Error(`PUT tags failed (${response.status}): ${body}`);
}

const TEMPLATE_BODY = [
  `<pre class="script" style="display: none;">template('MindTouch/Controls/PageOverview');</pre>`,
  `<pre class="script">wiki.idfTemplate();</pre>`,
].join('\n');

function parseMarkdown(filePath) {
  const raw     = fs.readFileSync(filePath, 'utf8');
  const lines   = raw.split('\n');
  const h1Index = lines.findIndex(l => l.startsWith('# '));
  const title   = h1Index !== -1 ? lines[h1Index].replace(/^#\s+/, '').trim() : filePath;
  const bodyMd  = h1Index !== -1 ? lines.slice(h1Index + 1).join('\n').trim() : raw;
  const html    = marked.parse(bodyMd).replace(/<(hr|br|img|input)(\s[^>]*)?\s*\/?>/gi, '<$1$2 />');
  return { title, html };
}

// ─── Creators ─────────────────────────────────────────────────────────────────
async function createStructuralPage(name, parent, articleType) {
  const token  = generateToken();
  const pageId = buildPageId(parent, name);
  if (await pageExists(pageId, token)) {
    console.warn(`  ⚠ Already exists — skipping [${articleType}] "${name}"`);
    return null;
  }
  const id = await postContents(pageId, name, TEMPLATE_BODY, token);
  await putTags(id, articleType, token);
  return id;
}

async function createPageFromMarkdown(mdFile, parentPath) {
  const { title, html } = parseMarkdown(mdFile);
  const token           = generateToken();
  const pageId          = buildPageId(parentPath, title);
  if (await pageExists(pageId, token)) {
    console.warn(`    ⚠ Already exists — skipping "${title}"`);
    return null;
  }
  const id = await postContents(pageId, title, html, token);
  await putTags(id, 'reference', token);
  return id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const results = { created: 0, skipped: 0, failed: 0, errors: [] };

  const totalPages  = MANIFEST.reduce((s, c) => s + c.guides.reduce((g, gg) => g + gg.pages.length, 0), 0);
  const totalGuides = MANIFEST.reduce((s, c) => s + c.guides.length, 0);
  console.log(`\n Bulk create — ${MANIFEST.length} categories, ${totalGuides} guides, ${totalPages} pages\n`);

  for (const { name: catName, parent, guides } of MANIFEST) {
    console.log(`▶ Category: ${catName}`);
    try {
      const id = await createStructuralPage(catName, parent, 'topic-category');
      id ? (console.log(`  ✓ id=${id}`), results.created++) : results.skipped++;
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
      results.failed++;
      results.errors.push(`Category "${catName}": ${err.message}`);
      continue;
    }

    const catPath = `${parent}/${catName}`;

    for (const { name: guideName, pages } of guides) {
      console.log(`  ▶ Guide: ${guideName}`);
      try {
        const id = await createStructuralPage(guideName, catPath, 'topic-guide');
        id ? (console.log(`    ✓ id=${id}`), results.created++) : results.skipped++;
      } catch (err) {
        console.error(`    ✗ ${err.message}`);
        results.failed++;
        results.errors.push(`Guide "${guideName}": ${err.message}`);
        continue;
      }

      const guidePath = `${catPath}/${guideName}`;

      for (const mdFile of pages) {
        try {
          const id = await createPageFromMarkdown(mdFile, guidePath);
          if (id) { console.log(`      ✓ id=${id}`); results.created++; }
          else results.skipped++;
        } catch (err) {
          console.error(`      ✗ ${mdFile}: ${err.message}`);
          results.failed++;
          results.errors.push(`Page "${mdFile}": ${err.message}`);
        }
      }
    }
  }

  console.log(`\n Done — Created: ${results.created}  Skipped: ${results.skipped}  Failed: ${results.failed}`);
  if (results.errors.length) {
    console.log('\n Errors:');
    results.errors.forEach(e => console.log(`  • ${e}`));
  }
}

run();
