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

  it('updates type only (no --body) using pre-fetched pageId', async () => {
    const client = makeClient({ get: vi.fn().mockResolvedValue(REAL_PAGE) })
    const result = await pages.update!('', { path: '/home/Cat/Page', type: 'topic-guide' }, client, env) as any
    expect(client.post).not.toHaveBeenCalled()
    expect(client.put).toHaveBeenCalledTimes(1)
    const putCall = (client.put as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(putCall[1]).toContain('article:topic-guide')
    expect(result.updated).toBe(true)
    expect(result.id).toBe('42')
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
