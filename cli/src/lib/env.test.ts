import { describe, it, expect, afterEach } from 'vitest'
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
