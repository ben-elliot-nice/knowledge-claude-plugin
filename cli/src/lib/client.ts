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
    await this.parseResponse(res)
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
