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
