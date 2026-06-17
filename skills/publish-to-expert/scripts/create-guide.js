/**
 * create-guide.js
 * Creates a topic-guide page in CXone Expert.
 *
 * Usage: node create-guide.js <name> <parent-path>
 *
 * Requires .env with: EXPERT_BASE_URL, EXPERT_KEY, EXPERT_SECRET
 */

const crypto = require('crypto');
const fs     = require('fs');

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
const [,, PAGE_NAME, PARENT_PATH] = process.argv;

if (!PAGE_NAME || !PARENT_PATH) {
  console.error('Usage: node create-guide.js <name> <parent-path>');
  process.exit(1);
}

const ARTICLE_TYPE = 'topic-guide';

// ─── Token ───────────────────────────────────────────────────────────────────
function generateToken(username = '=admin') {
  const epoch   = Math.floor(Date.now() / 1000);
  const message = `${KEY}_${epoch}_${username}`;
  const hash    = crypto.createHmac('sha256', SECRET).update(message).digest('hex');
  return `tkn_${KEY}_${epoch}_${username}_${hash}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildPageId(parentPath, pageName) {
  return `=${encodeURIComponent(`${parentPath}/${pageName}`)}`;
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

async function putTags(numericId, articleType, token) {
  const url = `${BASE_URL}/@api/deki/pages/${numericId}/tags?${new URLSearchParams({ allow: 'idferrors' })}`;
  const response = await fetch(url, {
    method  : 'PUT',
    headers : { 'X-Deki-Token': token, 'Content-Type': 'application/xml; charset=utf-8' },
    body    : `<tags><tag value="article:${articleType}" /></tags>`,
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`PUT tags failed (${response.status}): ${body}`);
}

const TEMPLATE_BODY = [
  `<pre class="script" style="display: none;">template('MindTouch/Controls/PageOverview');</pre>`,
  `<pre class="script">wiki.idfTemplate();</pre>`,
].join('\n');

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`[guide] "${PAGE_NAME}" under ${PARENT_PATH}`);

  const token  = generateToken();
  const pageId = buildPageId(PARENT_PATH, PAGE_NAME);

  if (await pageExists(pageId, token)) {
    console.warn(`[guide] ⚠ Already exists — skipping "${PAGE_NAME}"`);
    return;
  }

  const numericId = await postContents(pageId, PAGE_NAME, TEMPLATE_BODY, token);
  await putTags(numericId, ARTICLE_TYPE, token);
  console.log(`[guide] ✓ Created id=${numericId}`);
}

run().catch(err => { console.error('[guide] ✗', err.message); process.exit(1); });
