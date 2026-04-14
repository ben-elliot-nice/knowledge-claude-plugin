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
