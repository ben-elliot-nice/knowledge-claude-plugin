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
