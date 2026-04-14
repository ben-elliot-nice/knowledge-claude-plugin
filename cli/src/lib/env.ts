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
