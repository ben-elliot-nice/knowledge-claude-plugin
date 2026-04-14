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
