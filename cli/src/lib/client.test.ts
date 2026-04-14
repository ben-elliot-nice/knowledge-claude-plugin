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

  it('preserves XML attributes with @_ prefix', async () => {
    vi.stubGlobal('fetch', mockFetch('<page id="42"><title>Hello</title></page>'))
    const client = makeClient(env)
    const result = await client.get('/pages/=home') as any
    expect(result.page['@_id']).toBe('42')
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
  it('sends PUT with body and correct content-type', async () => {
    const fetchMock = mockFetch('<tags />')
    vi.stubGlobal('fetch', fetchMock)
    const client = makeClient(env)
    await client.put('/pages/1/tags', '<tags><tag value="article:reference" /></tags>')
    const [, opts] = fetchMock.mock.calls[0]
    expect(opts.method).toBe('PUT')
    expect(opts.headers['Content-Type']).toBe('application/xml; charset=utf-8')
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
