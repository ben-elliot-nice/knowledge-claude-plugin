# Expert CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript CLI for CXone Expert (Deki API) with 7 atomic skills wrapping each verb, plus a private skill for generating new resource modules.

**Architecture:** Single-source-of-truth TypeScript CLI handles all Deki API calls including HMAC auth and XML→JSON normalisation. Seven atomic skills (init, get, list, create, update, delete, invoke) wrap each CLI verb and are resource-agnostic. Pages is the initial resource module; additional resources are added via the private generate-resource skill.

**Tech Stack:** TypeScript, tsx (execution), Node.js built-in crypto (HMAC), fast-xml-parser (XML→JSON), marked (markdown→HTML), vitest (tests), dotenv-style manual .env parsing

---

## File Map

**Create:**
- `cli/package.json` — dependencies + test script
- `cli/tsconfig.json` — TypeScript config
- `cli/openapi/expert.json` — copy of root `openapi.json`
- `cli/src/lib/auth.ts` — HMAC-SHA256 token generation
- `cli/src/lib/auth.test.ts`
- `cli/src/lib/env.ts` — .env discovery and validation
- `cli/src/lib/env.test.ts`
- `cli/src/lib/types.ts` — ResourceHandlers contract (types only, no tests)
- `cli/src/lib/client.ts` — HTTP client: auth injection, XML→JSON
- `cli/src/lib/client.test.ts`
- `cli/src/resources/pages.ts` — pages resource module
- `cli/src/resources/pages.test.ts`
- `cli/src/index.ts` — entry point: parses args, routes to handler
- `skills/init/SKILL.md`
- `skills/get/SKILL.md`
- `skills/list/SKILL.md`
- `skills/create/SKILL.md`
- `skills/update/SKILL.md`
- `skills/delete/SKILL.md`
- `skills/invoke/SKILL.md`
- `../claude-private-skills/skills/knowledge-generate-resource/SKILL.md`

**Modify:**
- `CLAUDE.md` — update version sync rule to include `cli/package.json`
- `.claude-plugin/plugin.json` — bump version 1.0.0 → 1.0.1

**Delete:**
- `skills/get-public-content/` — replaced by atomic skills
- `skills/extract-articles/` — replaced by atomic skills
- `skills/scaffold-hierarchy/` — replaced by atomic skills
- `skills/publish-article/` — replaced by atomic skills

---

## Task 1: Scaffold CLI project

**Files:**
- Create: `cli/package.json`
- Create: `cli/tsconfig.json`
- Create: `cli/openapi/expert.json`

- [ ] **Step 1: Create `cli/package.json`**

```json
{
  "name": "@nice/knowledge-cli",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "fast-xml-parser": "^4.5.0",
    "marked": "^15.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `cli/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Copy the openapi spec**

```bash
mkdir -p cli/openapi
cp openapi.json cli/openapi/expert.json
```

- [ ] **Step 4: Install dependencies**

```bash
cd cli && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Commit**

```bash
git add cli/
git commit -m "feat: scaffold CLI project"
```

---

## Task 2: Auth module (TDD)

**Files:**
- Create: `cli/src/lib/auth.ts`
- Create: `cli/src/lib/auth.test.ts`

- [ ] **Step 1: Create `cli/src/lib/auth.test.ts`**

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateToken } from './auth.js'

afterEach(() => vi.useRealTimers())

describe('generateToken', () => {
  it('returns token with correct structure', () => {
    const token = generateToken('mykey', 'mysecret')
    expect(token).toMatch(/^tkn_mykey_\d+_=admin_[a-f0-9]{64}$/)
  })

  it('embeds the correct epoch', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const token = generateToken('key', 'secret')
    expect(token).toContain('_1704067200_')
  })

  it('produces different tokens at different times', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const t1 = generateToken('key', 'secret')
    vi.setSystemTime(new Date('2024-01-01T00:00:01Z'))
    const t2 = generateToken('key', 'secret')
    expect(t1).not.toEqual(t2)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd cli && npm test -- auth
```

Expected: FAIL with "Cannot find module './auth.js'"

- [ ] **Step 3: Create `cli/src/lib/auth.ts`**

```typescript
import crypto from 'node:crypto'

export function generateToken(key: string, secret: string): string {
  const epoch = Math.floor(Date.now() / 1000)
  const hash = crypto
    .createHmac('sha256', secret)
    .update(`${key}_${epoch}_=admin`)
    .digest('hex')
  return `tkn_${key}_${epoch}_=admin_${hash}`
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd cli && npm test -- auth
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/lib/auth.ts cli/src/lib/auth.test.ts
git commit -m "feat: add HMAC auth token generation"
```

---

## Task 3: Env module (TDD)

**Files:**
- Create: `cli/src/lib/env.ts`
- Create: `cli/src/lib/env.test.ts`

- [ ] **Step 1: Create `cli/src/lib/env.test.ts`**

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnv, EnvMissingError } from './env.js'
import os from 'node:os'

const tmpDir = join(os.tmpdir(), 'knowledge-cli-test-' + Date.now())

afterEach(() => {
  try { rmSync(tmpDir, { recursive: true }) } catch {}
})

function writeEnv(dir: string, content: string) {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, '.env'), content)
}

describe('loadEnv', () => {
  it('loads valid .env from start directory', () => {
    writeEnv(tmpDir, [
      'EXPERT_BASE_URL=https://test.mindtouch.us',
      'EXPERT_KEY=mykey',
      'EXPERT_SECRET=mysecret'
    ].join('\n'))
    const env = loadEnv(tmpDir)
    expect(env.baseUrl).toBe('https://test.mindtouch.us')
    expect(env.key).toBe('mykey')
    expect(env.secret).toBe('mysecret')
  })

  it('finds .env in parent directory', () => {
    const subDir = join(tmpDir, 'a', 'b', 'c')
    writeEnv(tmpDir, 'EXPERT_BASE_URL=https://x.mindtouch.us\nEXPERT_KEY=k\nEXPERT_SECRET=s')
    mkdirSync(subDir, { recursive: true })
    const env = loadEnv(subDir)
    expect(env.key).toBe('k')
  })

  it('throws EnvMissingError when no .env found', () => {
    mkdirSync(tmpDir, { recursive: true })
    expect(() => loadEnv(tmpDir)).toThrow(EnvMissingError)
  })

  it('throws when required vars are missing', () => {
    writeEnv(tmpDir, 'EXPERT_BASE_URL=https://test.mindtouch.us')
    expect(() => loadEnv(tmpDir)).toThrow('Missing required .env vars: EXPERT_KEY, EXPERT_SECRET')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd cli && npm test -- env
```

Expected: FAIL with "Cannot find module './env.js'"

- [ ] **Step 3: Create `cli/src/lib/env.ts`**

```typescript
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

export interface ExpertEnv {
  baseUrl: string
  key: string
  secret: string
}

export class EnvMissingError extends Error {
  constructor(startDir: string) {
    super(`No .env file found from ${startDir}. Run knowledge:init to set up credentials.`)
    this.name = 'EnvMissingError'
  }
}

export function loadEnv(startDir: string): ExpertEnv {
  const envPath = findEnvFile(resolve(startDir))
  if (!envPath) throw new EnvMissingError(startDir)

  const vars: Record<string, string> = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match) vars[match[1]] = match[2].trim()
  }

  const required = ['EXPERT_BASE_URL', 'EXPERT_KEY', 'EXPERT_SECRET']
  const missing = required.filter(k => !vars[k])
  if (missing.length > 0) throw new Error(`Missing required .env vars: ${missing.join(', ')}`)

  return {
    baseUrl: vars.EXPERT_BASE_URL,
    key: vars.EXPERT_KEY,
    secret: vars.EXPERT_SECRET
  }
}

function findEnvFile(dir: string): string | null {
  let current = dir
  while (true) {
    try {
      const candidate = resolve(current, '.env')
      readFileSync(candidate)
      return candidate
    } catch {
      const parent = dirname(current)
      if (parent === current) return null
      current = parent
    }
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd cli && npm test -- env
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/lib/env.ts cli/src/lib/env.test.ts
git commit -m "feat: add .env discovery and validation"
```

---

## Task 4: Types contract

**Files:**
- Create: `cli/src/lib/types.ts`

No tests — types only.

- [ ] **Step 1: Create `cli/src/lib/types.ts`**

```typescript
import type { ExpertClient } from './client.js'
import type { ExpertEnv } from './env.js'

export type Params = Record<string, string>

export type OperationHandler = (
  id: string,
  params: Params,
  client: ExpertClient,
  env: ExpertEnv
) => Promise<unknown>

export interface ResourceHandlers {
  requires?: string[]
  list?: (client: ExpertClient, env: ExpertEnv, params: Params) => Promise<unknown>
  get?: (id: string, client: ExpertClient, env: ExpertEnv, params: Params) => Promise<unknown>
  create?: (params: Params, client: ExpertClient, env: ExpertEnv) => Promise<unknown>
  update?: (id: string, params: Params, client: ExpertClient, env: ExpertEnv) => Promise<unknown>
  delete?: (id: string, client: ExpertClient, env: ExpertEnv, params: Params) => Promise<void>
  invoke?: Record<string, OperationHandler>
}

export type ResourceRegistry = Record<string, ResourceHandlers>
```

- [ ] **Step 2: Commit**

```bash
git add cli/src/lib/types.ts
git commit -m "feat: add ResourceHandlers contract types"
```

---

## Task 5: HTTP client (TDD)

**Files:**
- Create: `cli/src/lib/client.ts`
- Create: `cli/src/lib/client.test.ts`

- [ ] **Step 1: Create `cli/src/lib/client.test.ts`**

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import { makeClient } from './client.js'
import type { ExpertEnv } from './env.js'

const env: ExpertEnv = {
  baseUrl: 'https://test.mindtouch.us',
  key: 'testkey',
  secret: 'testsecret'
}

function mockFetch(body: string, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body)
  })
}

afterEach(() => vi.restoreAllMocks())

describe('ExpertClient.get', () => {
  it('sends GET to correct URL with auth header', async () => {
    const fetchMock = mockFetch('<page id="1" />')
    vi.stubGlobal('fetch', fetchMock)
    const client = makeClient(env)
    await client.get('/pages/=home')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('https://test.mindtouch.us/@api/deki/pages/=home')
    expect(opts.headers['X-Deki-Token']).toMatch(/^tkn_testkey_/)
  })

  it('parses XML response to object', async () => {
    vi.stubGlobal('fetch', mockFetch('<page id="42"><title>Hello</title></page>'))
    const client = makeClient(env)
    const result = await client.get('/pages/=home') as any
    expect(result.page.title).toBe('Hello')
  })

  it('throws on non-OK response', async () => {
    vi.stubGlobal('fetch', mockFetch('<error>Not found</error>', 404))
    const client = makeClient(env)
    await expect(client.get('/pages/=missing')).rejects.toThrow('404')
  })
})

describe('ExpertClient.post', () => {
  it('sends POST with body and content-type', async () => {
    const fetchMock = mockFetch('<edit><page id="1" /></edit>')
    vi.stubGlobal('fetch', fetchMock)
    const client = makeClient(env)
    await client.post('/pages/=home/contents', '<content />')
    const [, opts] = fetchMock.mock.calls[0]
    expect(opts.method).toBe('POST')
    expect(opts.body).toBe('<content />')
    expect(opts.headers['Content-Type']).toBe('application/xml; charset=utf-8')
  })
})

describe('ExpertClient.put', () => {
  it('sends PUT with body', async () => {
    const fetchMock = mockFetch('<tags />')
    vi.stubGlobal('fetch', fetchMock)
    const client = makeClient(env)
    await client.put('/pages/1/tags', '<tags><tag value="article:reference" /></tags>')
    const [, opts] = fetchMock.mock.calls[0]
    expect(opts.method).toBe('PUT')
  })
})

describe('ExpertClient.delete', () => {
  it('sends DELETE to correct URL', async () => {
    const fetchMock = mockFetch('', 200)
    vi.stubGlobal('fetch', fetchMock)
    const client = makeClient(env)
    await client.delete('/pages/=home%2FMyPage')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/pages/=home%2FMyPage')
    expect(opts.method).toBe('DELETE')
  })

  it('throws on error response', async () => {
    vi.stubGlobal('fetch', mockFetch('<error>Forbidden</error>', 403))
    const client = makeClient(env)
    await expect(client.delete('/pages/=locked')).rejects.toThrow('403')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd cli && npm test -- client
```

Expected: FAIL with "Cannot find module './client.js'"

- [ ] **Step 3: Create `cli/src/lib/client.ts`**

```typescript
import { XMLParser } from 'fast-xml-parser'
import { generateToken } from './auth.js'
import type { ExpertEnv } from './env.js'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })

export class ExpertClient {
  constructor(private readonly env: ExpertEnv) {}

  private get token(): string {
    return generateToken(this.env.key, this.env.secret)
  }

  private url(path: string): string {
    return `${this.env.baseUrl}/@api/deki${path}`
  }

  async get(path: string): Promise<unknown> {
    const res = await fetch(this.url(path), {
      headers: { 'X-Deki-Token': this.token }
    })
    return this.parseResponse(res)
  }

  async post(path: string, body: string, contentType = 'application/xml; charset=utf-8'): Promise<unknown> {
    const res = await fetch(this.url(path), {
      method: 'POST',
      headers: { 'X-Deki-Token': this.token, 'Content-Type': contentType },
      body
    })
    return this.parseResponse(res)
  }

  async put(path: string, body: string): Promise<unknown> {
    const res = await fetch(this.url(path), {
      method: 'PUT',
      headers: { 'X-Deki-Token': this.token, 'Content-Type': 'application/xml; charset=utf-8' },
      body
    })
    return this.parseResponse(res)
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(this.url(path), {
      method: 'DELETE',
      headers: { 'X-Deki-Token': this.token }
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`${res.status}: ${text}`)
    }
  }

  private async parseResponse(res: Response): Promise<unknown> {
    const text = await res.text()
    if (!res.ok) throw new Error(`${res.status}: ${text}`)
    if (!text.trim()) return {}
    return parser.parse(text)
  }
}

export function makeClient(env: ExpertEnv): ExpertClient {
  return new ExpertClient(env)
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd cli && npm test -- client
```

Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/lib/client.ts cli/src/lib/client.test.ts
git commit -m "feat: add HTTP client with XML parsing"
```

---

## Task 6: Pages resource module (TDD)

**Files:**
- Create: `cli/src/resources/pages.ts`
- Create: `cli/src/resources/pages.test.ts`

- [ ] **Step 1: Create `cli/src/resources/pages.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Must be at module level — Vitest hoists vi.mock() calls
vi.mock('node:fs', () => ({
  readFileSync: vi.fn().mockReturnValue('# Hello\nContent')
}))

import { readFileSync } from 'node:fs'
import { pages } from './pages.js'
import type { ExpertClient } from '../lib/client.js'
import type { ExpertEnv } from '../lib/env.js'

beforeEach(() => vi.mocked(readFileSync).mockReturnValue('# Hello\nContent'))

const env: ExpertEnv = { baseUrl: 'https://test.mindtouch.us', key: 'k', secret: 's' }

// Virtual page response = page doesn't exist yet
const VIRTUAL_PAGE = { page: { '@_virtual': 'true', '@_id': '' } }
// Real page response = page exists
const REAL_PAGE = { page: { '@_id': '42', '@_virtual': 'false', title: 'My Page' } }
// Post/edit response
const EDIT_RESPONSE = { edit: { page: { '@_id': '42' } } }

function makeClient(overrides: Partial<Record<keyof ExpertClient, unknown>> = {}): ExpertClient {
  return {
    get: vi.fn().mockResolvedValue(VIRTUAL_PAGE),
    post: vi.fn().mockResolvedValue(EDIT_RESPONSE),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides
  } as unknown as ExpertClient
}

describe('pages.list', () => {
  it('calls subpages endpoint with encoded parent path', async () => {
    const client = makeClient()
    await pages.list!(client, env, { parent: '/home/MyCategory' })
    expect(client.get).toHaveBeenCalledWith('/pages=%2Fhome%2FMyCategory/subpages')
  })

  it('accepts path param as alias for parent', async () => {
    const client = makeClient()
    await pages.list!(client, env, { path: '/home/Cat' })
    expect(client.get).toHaveBeenCalledWith('/pages=%2Fhome%2FCat/subpages')
  })

  it('throws when no parent or path provided', async () => {
    const client = makeClient()
    await expect(pages.list!(client, env, {})).rejects.toThrow('--parent is required')
  })
})

describe('pages.get', () => {
  it('fetches contents and info in parallel', async () => {
    const client = makeClient({ get: vi.fn().mockResolvedValue({}) })
    await pages.get!('', client, env, { path: '/home/Cat/Guide/Page' })
    expect(client.get).toHaveBeenCalledTimes(2)
    const calls = (client.get as ReturnType<typeof vi.fn>).mock.calls.map((c: string[]) => c[0])
    expect(calls.some((c: string) => c.includes('/contents'))).toBe(true)
    expect(calls.some((c: string) => c.includes('/info'))).toBe(true)
  })

  it('throws when no path provided', async () => {
    const client = makeClient()
    await expect(pages.get!('', client, env, {})).rejects.toThrow('--path is required')
  })
})

describe('pages.create', () => {
  it('creates a reference page with content and sets GCF tag', async () => {
    const client = makeClient()
    const result = await pages.create!({ parent: '/home/Cat/Guide', title: 'My Page', body: './page.md' }, client, env) as any
    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.put).toHaveBeenCalledTimes(1)
    const putCall = (client.put as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(putCall[1]).toContain('article:reference')
    expect(result.created).toBe(true)
  })

  it('skips creation if page already exists', async () => {
    const client = makeClient({ get: vi.fn().mockResolvedValue(REAL_PAGE) })
    const result = await pages.create!({ parent: '/home/Cat', title: 'Existing', body: './x.md' }, client, env) as any
    expect(result.skipped).toBe(true)
    expect(client.post).not.toHaveBeenCalled()
  })

  it('creates category with template body (no --body required)', async () => {
    const client = makeClient()
    await pages.create!({ parent: '/home', title: 'My Category', type: 'topic-category' }, client, env)
    const postCall = (client.post as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(postCall[1]).toContain('MindTouch/Controls/PageOverview')
  })

  it('throws when --parent missing', async () => {
    const client = makeClient()
    await expect(pages.create!({ title: 'X', body: './x.md' }, client, env)).rejects.toThrow('--parent is required')
  })

  it('throws when --title missing', async () => {
    const client = makeClient()
    await expect(pages.create!({ parent: '/home', body: './x.md' }, client, env)).rejects.toThrow('--title is required')
  })
})

describe('pages.update', () => {
  it('updates content and re-tags when both --body and --type provided', async () => {
    const client = makeClient({ get: vi.fn().mockResolvedValue(REAL_PAGE) })
    const result = await pages.update!('', { path: '/home/Cat/Page', body: './page.md', type: 'topic' }, client, env) as any
    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.put).toHaveBeenCalledTimes(1)
    expect(result.updated).toBe(true)
  })

  it('throws when neither --body nor --type provided', async () => {
    const client = makeClient({ get: vi.fn().mockResolvedValue(REAL_PAGE) })
    await expect(pages.update!('', { path: '/home/Cat/Page' }, client, env)).rejects.toThrow('--body or --type is required')
  })
})

describe('pages.delete', () => {
  it('calls DELETE with encoded path', async () => {
    const client = makeClient()
    await pages.delete!('', client, env, { path: '/home/Cat/Page' })
    expect(client.delete).toHaveBeenCalledWith('/pages=%2Fhome%2FCat%2FPage')
  })

  it('throws when no path provided', async () => {
    const client = makeClient()
    await expect(pages.delete!('', client, env, {})).rejects.toThrow('--path is required')
  })
})

describe('pages.invoke', () => {
  it('move: calls move endpoint with encoded paths', async () => {
    const client = makeClient()
    await pages.invoke!.move('', { path: '/home/Cat/Page', to: '/home/OtherCat' }, client, env)
    const call = (client.post as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[0]).toContain('/move')
    expect(call[0]).toContain(encodeURIComponent('/home/OtherCat'))
  })

  it('copy: calls copy endpoint', async () => {
    const client = makeClient()
    await pages.invoke!.copy('', { path: '/home/Cat/Page', to: '/home/OtherCat' }, client, env)
    expect(client.post).toHaveBeenCalledWith(expect.stringContaining('/copy'), '')
  })

  it('revert: calls revert endpoint', async () => {
    const client = makeClient()
    await pages.invoke!.revert('', { path: '/home/Cat/Page' }, client, env)
    expect(client.post).toHaveBeenCalledWith(expect.stringContaining('/revert'), '')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd cli && npm test -- pages
```

Expected: FAIL with "Cannot find module './pages.js'"

- [ ] **Step 3: Create `cli/src/resources/pages.ts`**

```typescript
import { readFileSync } from 'node:fs'
import { marked } from 'marked'
import type { ResourceHandlers, Params } from '../lib/types.js'
import type { ExpertClient } from '../lib/client.js'
import type { ExpertEnv } from '../lib/env.js'

type GcfType = 'topic-category' | 'topic-guide' | 'reference' | 'topic' | 'howto'
const CONTAINER_TYPES: GcfType[] = ['topic-category', 'topic-guide']
const CATEGORY_BODY = `<pre class="script" style="display: none;">template('MindTouch/Controls/PageOverview');</pre><pre class="script">wiki.idfTemplate();</pre>`

function encodePath(path: string): string {
  return `=${encodeURIComponent(path)}`
}

function pagePathFromParams(id: string, params: Params, label: string): string {
  const path = id || params.path
  if (!path) throw new Error(`--path is required for ${label}`)
  return path
}

function buildChildPath(parent: string, title: string): string {
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `${parent.replace(/\/$/, '')}/${slug}`
}

function markdownToHtml(md: string): string {
  const html = marked.parse(md) as string
  return html.replace(/<(hr|br|img|input)(\s[^>]*)?\s*\/?>/gi, '<$1$2 />')
}

async function pageExists(path: string, client: ExpertClient): Promise<{ exists: boolean; id: string }> {
  try {
    const result = await client.get(`/pages${encodePath(path)}/info`) as any
    const isVirtual = result?.page?.['@_virtual'] === 'true' || !result?.page?.['@_id']
    return { exists: !isVirtual, id: result?.page?.['@_id'] ?? '' }
  } catch {
    return { exists: false, id: '' }
  }
}

async function postContent(path: string, title: string, htmlBody: string, client: ExpertClient): Promise<string> {
  const xml = `<content type="text/html" title="${title}"><body>${htmlBody}</body></content>`
  const result = await client.post(
    `/pages${encodePath(path)}/contents?edittime=now&allow=deleteredirects,idferrors&title=${encodeURIComponent(title)}`,
    xml
  ) as any
  return result?.edit?.page?.['@_id'] ?? ''
}

async function setGcfType(pageId: string, type: GcfType, client: ExpertClient): Promise<void> {
  await client.put(`/pages/${pageId}/tags?allow=idferrors`, `<tags><tag value="article:${type}" /></tags>`)
}

export const pages: ResourceHandlers = {
  async list(client, env, params) {
    const parent = params.parent ?? params.path
    if (!parent) throw new Error('--parent is required for list')
    return client.get(`/pages${encodePath(parent)}/subpages`)
  },

  async get(id, client, env, params) {
    const path = pagePathFromParams(id, params, 'get')
    const encoded = encodePath(path)
    const [contents, info] = await Promise.all([
      client.get(`/pages${encoded}/contents`),
      client.get(`/pages${encoded}/info`)
    ])
    return { contents, info }
  },

  async create(params, client, env) {
    const { parent, title, type = 'reference', body: bodyFile } = params
    if (!parent) throw new Error('--parent is required for create')
    if (!title) throw new Error('--title is required for create')

    const path = buildChildPath(parent, title)
    const { exists, id: existingId } = await pageExists(path, client)
    if (exists) return { skipped: true, reason: 'Page already exists', path, id: existingId }

    const isContainer = CONTAINER_TYPES.includes(type as GcfType)
    let htmlBody: string
    if (isContainer) {
      htmlBody = CATEGORY_BODY
    } else {
      if (!bodyFile) throw new Error('--body is required for reference/topic/howto pages')
      htmlBody = markdownToHtml(readFileSync(bodyFile, 'utf8'))
    }

    const pageId = await postContent(path, title, htmlBody, client)
    await setGcfType(pageId, type as GcfType, client)
    return { created: true, path, id: pageId, type }
  },

  async update(id, params, client, env) {
    const path = pagePathFromParams(id, params, 'update')
    const { body: bodyFile, type } = params
    if (!bodyFile && !type) throw new Error('--body or --type is required for update')

    const info = await client.get(`/pages${encodePath(path)}/info`) as any
    const title = info?.page?.title ?? path.split('/').pop() ?? ''
    const pageId: string = info?.page?.['@_id'] ?? ''

    if (bodyFile) {
      const htmlBody = markdownToHtml(readFileSync(bodyFile, 'utf8'))
      const newId = await postContent(path, title, htmlBody, client)
      if (type) await setGcfType(newId, type as GcfType, client)
      return { updated: true, path, id: newId }
    } else {
      await setGcfType(pageId, type as GcfType, client)
      return { updated: true, path, id: pageId }
    }
  },

  async delete(id, client, env, params) {
    const path = pagePathFromParams(id, params, 'delete')
    await client.delete(`/pages${encodePath(path)}`)
  },

  invoke: {
    async move(id, params, client, env) {
      const path = pagePathFromParams(id, params, 'move')
      if (!params.to) throw new Error('--to is required for move')
      return client.post(`/pages${encodePath(path)}/move?to=${encodeURIComponent(params.to)}&allow=idferrors`, '')
    },
    async copy(id, params, client, env) {
      const path = pagePathFromParams(id, params, 'copy')
      if (!params.to) throw new Error('--to is required for copy')
      return client.post(`/pages${encodePath(path)}/copy?to=${encodeURIComponent(params.to)}&allow=idferrors`, '')
    },
    async revert(id, params, client, env) {
      const path = pagePathFromParams(id, params, 'revert')
      const revision = params.revision ?? 'previous'
      return client.post(`/pages${encodePath(path)}/revert?fromrevision=${revision}`, '')
    }
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd cli && npm test -- pages
```

Expected: all tests pass.

- [ ] **Step 5: Run full test suite**

```bash
cd cli && npm test
```

Expected: all tests across auth, env, client, pages pass.

- [ ] **Step 6: Commit**

```bash
git add cli/src/resources/pages.ts cli/src/resources/pages.test.ts
git commit -m "feat: add pages resource module with list/get/create/update/delete/invoke"
```

---

## Task 7: CLI entry point

**Files:**
- Create: `cli/src/index.ts`

No unit tests for the entry point — covered by integration (manual verification).

- [ ] **Step 1: Create `cli/src/index.ts`**

```typescript
import { loadEnv, EnvMissingError } from './lib/env.js'
import { makeClient } from './lib/client.js'
import type { ResourceRegistry, Params } from './lib/types.js'
import { pages } from './resources/pages.js'

const registry: ResourceRegistry = {
  page: pages,
  pages: pages
}

function parseArgs(argv: string[]): { verb: string; resource: string; id: string; params: Params } {
  const [,, verb, resource, maybeId, ...rest] = argv
  const hasPositionalId = maybeId && !maybeId.startsWith('--')
  const id = hasPositionalId ? maybeId : ''
  const flagTokens = hasPositionalId ? rest : [maybeId, ...rest].filter(Boolean) as string[]

  const params: Params = {}
  for (let i = 0; i < flagTokens.length; i++) {
    const token = flagTokens[i]
    if (token?.startsWith('--')) {
      params[token.slice(2)] = flagTokens[++i] ?? ''
    }
  }

  return { verb, resource, id, params }
}

async function main() {
  const { verb, resource, id, params } = parseArgs(process.argv)

  if (!verb || !resource) {
    console.error('Usage: knowledge <verb> <resource> [id] [--flag value ...]')
    console.error('Verbs: list, get, create, update, delete, invoke')
    console.error(`Resources: ${Object.keys(registry).filter(k => !k.endsWith('s')).join(', ')}`)
    process.exit(1)
  }

  const envDir = params['env-path'] ?? process.cwd()
  delete params['env-path']

  let env
  try {
    env = loadEnv(envDir)
  } catch (e) {
    if (e instanceof EnvMissingError) {
      console.error(e.message)
      process.exit(2)
    }
    throw e
  }

  const handler = registry[resource]
  if (!handler) {
    console.error(`Unknown resource: ${resource}. Available: ${Object.keys(registry).filter(k => !k.endsWith('s')).join(', ')}`)
    process.exit(1)
  }

  try {
    let result: unknown

    const client = makeClient(env)

    if (verb === 'invoke') {
      const op = params.op
      delete params.op
      if (!op) throw new Error('--op is required for invoke')
      const opHandler = handler.invoke?.[op]
      if (!opHandler) throw new Error(`Unknown operation: ${op}. Available: ${Object.keys(handler.invoke ?? {}).join(', ')}`)
      result = await opHandler(id, params, client, env)
    } else if (verb === 'list') {
      if (!handler.list) throw new Error(`Resource '${resource}' does not support list`)
      result = await handler.list(client, env, params)
    } else if (verb === 'get') {
      if (!handler.get) throw new Error(`Resource '${resource}' does not support get`)
      result = await handler.get(id, client, env, params)
    } else if (verb === 'create') {
      if (!handler.create) throw new Error(`Resource '${resource}' does not support create`)
      result = await handler.create(params, client, env)
    } else if (verb === 'update') {
      if (!handler.update) throw new Error(`Resource '${resource}' does not support update`)
      result = await handler.update(id, params, client, env)
    } else if (verb === 'delete') {
      if (!handler.delete) throw new Error(`Resource '${resource}' does not support delete`)
      await handler.delete(id, client, env, params)
      result = { deleted: true }
    } else {
      throw new Error(`Unknown verb: ${verb}. Available: list, get, create, update, delete, invoke`)
    }

    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
  } catch (e) {
    console.error((e as Error).message)
    process.exit(1)
  }
}

main()
```

- [ ] **Step 2: Run full test suite to confirm nothing broke**

```bash
cd cli && npm test
```

Expected: all tests pass.

- [ ] **Step 3: Smoke test (no .env — should exit 2)**

```bash
cd /tmp && npx tsx /Users/Ben.Elliot/repos/claude-marketplace/knowledge-claude-plugin/cli/src/index.ts list pages --parent /home
echo "Exit: $?"
```

Expected: error message about missing .env, exit code 2.

- [ ] **Step 4: Commit**

```bash
git add cli/src/index.ts
git commit -m "feat: add CLI entry point with arg parsing and routing"
```

---

## Task 8: Atomic skills

**Files:**
- Create: `skills/init/SKILL.md`
- Create: `skills/get/SKILL.md`
- Create: `skills/list/SKILL.md`
- Create: `skills/create/SKILL.md`
- Create: `skills/update/SKILL.md`
- Create: `skills/delete/SKILL.md`
- Create: `skills/invoke/SKILL.md`
- Delete: `skills/get-public-content/`, `skills/extract-articles/`, `skills/scaffold-hierarchy/`, `skills/publish-article/`

- [ ] **Step 1: Create `skills/init/SKILL.md`**

```markdown
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
```

- [ ] **Step 2: Create `skills/get/SKILL.md`**

```markdown
---
name: knowledge:get
description: Fetch a CXone Expert page by path, returning its contents and metadata. Use when you need to read an existing Expert page's content or check its properties.
---

# Knowledge: Get

Fetch a page from CXone Expert by its full path.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts get pages --path <full-page-path>
```

## Exit Codes

- **0** — Success. Output is JSON with `{ contents, info }`.
- **1** — Error (page not found, permission denied, etc.). Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx cli/src/index.ts get pages --path /home/MyCategory/MyGuide/MyPage
```
```

- [ ] **Step 3: Create `skills/list/SKILL.md`**

```markdown
---
name: knowledge:list
description: List child pages under a CXone Expert path. Use when you need to enumerate the pages inside a category or guide in Expert.
---

# Knowledge: List

List direct child pages under a given Expert path.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts list pages --parent <path>
```

## Exit Codes

- **0** — Success. Output is JSON array of child pages.
- **1** — Error. Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx cli/src/index.ts list pages --parent /home/MyCategory
```
```

- [ ] **Step 4: Create `skills/create/SKILL.md`**

```markdown
---
name: knowledge:create
description: Create a new CXone Expert page with content and a GCF type (topic-category, topic-guide, reference, topic, howto). Use when publishing a new page to Expert. Will skip silently if the page already exists — use knowledge:update to overwrite.
---

# Knowledge: Create

Create a new page in CXone Expert.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts create pages \
  --parent <parent-path> \
  --title <title> \
  --type <gcf-type> \
  [--body <path-to-markdown-file>]
```

## GCF Types

| Type | `--body` required? | Purpose |
|---|---|---|
| `topic-category` | No | Container for guides |
| `topic-guide` | No | Container for reference pages |
| `reference` | Yes | Leaf content page (default) |
| `topic` | Yes | Leaf content page |
| `howto` | Yes | Leaf content page |

## Exit Codes

- **0** — Success. Output includes `{ created: true, path, id, type }` or `{ skipped: true, reason, path, id }`.
- **1** — Error. Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx cli/src/index.ts create pages \
  --parent /home/MyCategory/MyGuide \
  --title "Getting Started" \
  --type reference \
  --body ./getting-started.md
```
```

- [ ] **Step 5: Create `skills/update/SKILL.md`**

```markdown
---
name: knowledge:update
description: Update an existing CXone Expert page's content and/or GCF type. Use when overwriting an existing page. Use knowledge:create for new pages.
---

# Knowledge: Update

Update an existing page in CXone Expert.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts update pages \
  --path <full-page-path> \
  [--body <path-to-markdown-file>] \
  [--type <gcf-type>]
```

At least one of `--body` or `--type` is required.

## Exit Codes

- **0** — Success. Output includes `{ updated: true, path, id }`.
- **1** — Error (page not found, missing args, etc.). Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx cli/src/index.ts update pages \
  --path /home/MyCategory/MyGuide/getting-started \
  --body ./getting-started-v2.md
```
```

- [ ] **Step 6: Create `skills/delete/SKILL.md`**

```markdown
---
name: knowledge:delete
description: Delete a CXone Expert page by path. This is irreversible — always confirm with the user before proceeding.
---

# Knowledge: Delete

Delete a page from CXone Expert. **Irreversible** — always confirm with the user before running.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts delete pages --path <full-page-path>
```

## Before Running

Always confirm: "This will permanently delete `<path>` from Expert. Are you sure?"

## Exit Codes

- **0** — Success. Output is `{ deleted: true }`.
- **1** — Error. Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Example

```bash
npx tsx cli/src/index.ts delete pages --path /home/MyCategory/MyGuide/old-page
```
```

- [ ] **Step 7: Create `skills/invoke/SKILL.md`**

```markdown
---
name: knowledge:invoke
description: Run a named non-CRUD operation on a CXone Expert page — move, copy, or revert. Use when you need to restructure the Expert hierarchy or roll back a page.
---

# Knowledge: Invoke

Run a named operation on an Expert page.

## Plugin Location

Derive the plugin root from the injected `Base directory for this skill:` — go two directories up.

## Usage

```bash
npx tsx <plugin-root>/cli/src/index.ts invoke pages \
  --path <full-page-path> \
  --op <operation> \
  [--to <destination-path>] \
  [--revision <revision-number>]
```

## Operations

| `--op` | Additional flags | Effect |
|---|---|---|
| `move` | `--to <path>` | Move page to a new path |
| `copy` | `--to <path>` | Copy page to a new path |
| `revert` | `--revision <n>` (optional, default: previous) | Revert page to a prior revision |

## Exit Codes

- **0** — Success. Output is the API response.
- **1** — Error. Surface the error message.
- **2** — No `.env` found. Tell the user to run `knowledge:init` first.

## Examples

```bash
# Move a page
npx tsx cli/src/index.ts invoke pages --path /home/OldCat/Page --op move --to /home/NewCat

# Copy a page
npx tsx cli/src/index.ts invoke pages --path /home/Cat/Page --op copy --to /home/Cat/Page-backup

# Revert to previous revision
npx tsx cli/src/index.ts invoke pages --path /home/Cat/Page --op revert
```
```

- [ ] **Step 8: Remove obsolete stub skills**

```bash
rm -rf skills/get-public-content skills/extract-articles skills/scaffold-hierarchy skills/publish-article
```

- [ ] **Step 9: Commit**

```bash
git add skills/
git commit -m "feat: add 7 atomic skills, remove obsolete stubs"
```

---

## Task 9: Version bump and CLAUDE.md update

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `.claude-plugin/plugin.json` to `1.0.1`**

Change `"version": "1.0.0"` to `"version": "1.0.1"`.

Also update `cli/package.json` to `"version": "1.0.1"` (these must stay in sync).

- [ ] **Step 2: Update version rule in `CLAUDE.md`**

Change the version bump rule from:

```
- **After any change to `skills/`**, increment the version in `.claude-plugin/plugin.json`.
```

To:

```
- **After any change to `cli/` or `skills/`**, increment the version in both `cli/package.json` and `.claude-plugin/plugin.json`. Always patch increment unless directed otherwise (e.g. `1.0.0` → `1.0.1`).
```

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/plugin.json cli/package.json CLAUDE.md
git commit -m "chore: bump version to 1.0.1, update CLAUDE.md version sync rule"
```

---

## Task 10: Push and knowledge update

- [ ] **Step 1: Push**

```bash
git push
```

- [ ] **Step 2: Knowledge update**

```bash
cd /Users/Ben.Elliot/repos/claude-marketplace/nice-claude-marketplace && git submodule update --remote && git add plugins && git commit -m "Knowledge plugin update" && git push
```

---

## Task 11: Private skill — knowledge-generate-resource

**Files:**
- Create: `../claude-private-skills/skills/knowledge-generate-resource/SKILL.md`

- [ ] **Step 1: Create the private skill**

```markdown
---
name: knowledge-generate-resource
description: Use when adding a new CXone Expert resource type to the knowledge-claude-plugin CLI — generates the TypeScript resource module and wires it into the registry.
---

# Knowledge: Generate Resource Module

Generate a new `cli/src/resources/<resource>.ts` module for the knowledge-claude-plugin, wired into the CLI registry.

## Plugin Location

```
~/repos/claude-marketplace/knowledge-claude-plugin
```

## Reference Files (read these first)

- `cli/src/resources/pages.ts` — canonical reference module. Match its structure exactly.
- `cli/src/lib/types.ts` — the `ResourceHandlers` contract your module must satisfy.
- `cli/src/lib/client.ts` — HTTP client. Does NOT prepend `/@api/deki` — full paths go in the client `.url()` call via the path arg.
- `cli/openapi/expert.json` — Expert API spec. Extract real paths from here. Do not guess.

## Steps

### 0. Plan the implementation

Invoke `superpowers:writing-plans` before touching any code. The plan should cover which API paths to implement, which verbs the resource supports, and any resource-specific quirks found in the spec or from `https://help.benelliot-nice.com/@api/deki/@about`.

### 1. Extract API paths from the spec

```bash
node -e "
const spec = JSON.parse(require('fs').readFileSync('cli/openapi/expert.json', 'utf8'));
const paths = Object.keys(spec.paths).filter(p => p.includes('<resource>'));
paths.forEach(p => {
  const methods = Object.keys(spec.paths[p]).filter(m => !['parameters','summary','description'].includes(m));
  console.log(p, '->', methods.join(', '));
});
"
```

If the resource isn't in the spec, check `https://help.benelliot-nice.com/@api/deki/@about` for the live API capabilities.

### 2. Write the module

Mirror `pages.ts` exactly:

- Export a `const <resource>: ResourceHandlers` object
- Only implement verbs the API actually supports
- Write types inline or in `<resource>.types.ts` — no auto-generation script (Expert API is XML-based)
- Use `encodePath()` pattern for path-based addressing where applicable

File: `cli/src/resources/<resource>.ts`

### 3. Write tests first (TDD)

Invoke `superpowers:test-driven-development` before writing any implementation code.

Mirror `pages.test.ts`. Use `vi.fn()` mocks for the client. Required test cases:
- At minimum: one test per implemented verb
- Error cases: missing required params
- Skip/guard logic if applicable

### 4. Run tests — all must pass

```bash
cd ~/repos/claude-marketplace/knowledge-claude-plugin/cli && npm test
```

Do not proceed if any test fails.

### 5. Wire into registry

In `cli/src/index.ts`, add import and register with **singular** resource name:
```typescript
import { <resource> } from './resources/<resource>.js'
const registry: ResourceRegistry = {
  page: pages,
  pages: pages,
  <resource>: <resource>s,
}
```

### 6. Run all tests again

```bash
cd ~/repos/claude-marketplace/knowledge-claude-plugin/cli && npm test
```

### 7. Verify, bump version, commit, and push

Invoke `superpowers:verification-before-completion` before committing.

Bump both `cli/package.json` and `.claude-plugin/plugin.json` (patch increment).

```bash
cd ~/repos/claude-marketplace/knowledge-claude-plugin
git add cli/src/resources/<resource>.ts cli/src/index.ts .claude-plugin/plugin.json cli/package.json
git commit -m "feat: add <resource> resource module"
git push
```

Then run the knowledge update compound command from CLAUDE.md.

## Known Constraints

- `params` is always `Record<string, string>` — all CLI flags are strings.
- Expert API returns XML. The client parses it to JSON — resource modules never handle XML directly.
- Page addressing uses `=${encodeURIComponent(path)}` format.
- Non-CRUD operations belong in the `invoke` map.
```

- [ ] **Step 2: Commit in claude-private-skills**

```bash
cd ~/repos/claude-marketplace/claude-private-skills
git add skills/knowledge-generate-resource/
git commit -m "feat: add knowledge-generate-resource skill"
git push
```

- [ ] **Step 3: Update private skills submodule reference in marketplace**

```bash
cd /Users/Ben.Elliot/repos/claude-marketplace/nice-claude-marketplace && git submodule update --remote && git add plugins && git commit -m "Knowledge plugin update" && git push
```
