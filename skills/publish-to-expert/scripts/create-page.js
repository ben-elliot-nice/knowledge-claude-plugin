/**
 * create-page.js
 * Creates a reference page in CXone Expert from a markdown file.
 * Extracts the H1 as the page title; remainder becomes the body.
 *
 * Usage: node create-page.js <markdown-file> <parent-path> [article-type]
 *   article-type defaults to "reference". Options: reference, topic, howto
 *
 * Requires .env with: EXPERT_BASE_URL, EXPERT_KEY, EXPERT_SECRET
 * Requires: marked (npm install marked)
 */

const crypto          = require('crypto');
const fs              = require('fs');
const path            = require('path');
const { marked }      = require('marked');

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

// ─── Args ─────────────────────────────────────────────────────────────────────
const [,, mdFile, parentPath, articleType = 'reference'] = process.argv;

if (!mdFile || !parentPath) {
  console.error('Usage: node create-page.js <markdown-file> <parent-path> [article-type]');
  process.exit(1);
}

// ─── Token ───────────────────────────────────────────────────────────────────
function generateToken(username = '=admin') {
  const epoch   = Math.floor(Date.now() / 1000);
  const message = `${KEY}_${epoch}_${username}`;
  const hash    = crypto.createHmac('sha256', SECRET).update(message).digest('hex');
  return `tkn_${KEY}_${epoch}_${username}_${hash}`;
}

// ─── Markdown → HTML ──────────────────────────────────────────────────────────
function parseMarkdown(filePath) {
  const raw     = fs.readFileSync(filePath, 'utf8');
  const lines   = raw.split('\n');
  const h1Index = lines.findIndex(l => l.startsWith('# '));

  const title  = h1Index !== -1
    ? lines[h1Index].replace(/^#\s+/, '').trim()
    : path.basename(filePath, '.md').replace(/-/g, ' ');
  const bodyMd = h1Index !== -1 ? lines.slice(h1Index + 1).join('\n').trim() : raw;

  // Void elements must be self-closing for Expert's XML parser
  const html = marked.parse(bodyMd).replace(/<(hr|br|img|input)(\s[^>]*)?\s*\/?>/gi, '<$1$2 />');

  return { title, html };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildPageId(parent, title) {
  return `=${encodeURIComponent(`${parent}/${title}`)}`;
}

async function pageExists(pageId, token) {
  const url      = `${BASE_URL}/@api/deki/pages/${pageId}`;
  const response = await fetch(url, { headers: { 'X-Deki-Token': token } });
  if (!response.ok) return false;
  const body = await response.text();
  return !body.includes('virtual="true"');
}

async function postContents(pageId, title, bodyHtml, token) {
  const content = `<content type="text/html" title="${title}"><body>${bodyHtml}</body></content>`;
  const params  = new URLSearchParams({ edittime: 'now', allow: 'deleteredirects,idferrors', title });
  const url     = `${BASE_URL}/@api/deki/pages/${pageId}/contents?${params}`;

  const response = await fetch(url, {
    method  : 'POST',
    headers : { 'X-Deki-Token': token, 'Content-Type': 'application/xml; charset=utf-8' },
    body    : content,
  });

  const body = await response.text();
  if (!response.ok) throw new Error(`POST contents failed (${response.status}): ${body}`);

  const match = body.match(/<page id="(\d+)"/);
  return match ? match[1] : pageId;
}

async function putTags(numericId, type, token) {
  const url = `${BASE_URL}/@api/deki/pages/${numericId}/tags?${new URLSearchParams({ allow: 'idferrors' })}`;
  const response = await fetch(url, {
    method  : 'PUT',
    headers : { 'X-Deki-Token': token, 'Content-Type': 'application/xml; charset=utf-8' },
    body    : `<tags><tag value="article:${type}" /></tags>`,
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`PUT tags failed (${response.status}): ${body}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const { title, html } = parseMarkdown(mdFile);
  console.log(`[page] "${title}" under ${parentPath}`);

  const token  = generateToken();
  const pageId = buildPageId(parentPath, title);

  if (await pageExists(pageId, token)) {
    console.warn(`[page] ⚠ Already exists — skipping "${title}"`);
    return;
  }

  const numericId = await postContents(pageId, title, html, token);
  await putTags(numericId, articleType, token);
  console.log(`[page] ✓ Created id=${numericId}`);
}

run().catch(err => { console.error('[page] ✗', err.message); process.exit(1); });
