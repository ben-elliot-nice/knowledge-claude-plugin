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

  it('produces the correct HMAC hash for known inputs (golden test)', () => {
    // epoch 1704067200 = 2024-01-01T00:00:00Z
    // message = 'testkey_1704067200_=admin'
    // expected hash = HMAC-SHA256('testsecret', message) as hex
    const expectedHash = '6709ae6a4a96ff786a6e591cb75c1f2c6051789ed2ba66bcc2e76564282d5d4b'
    const expectedToken = `tkn_testkey_1704067200_=admin_${expectedHash}`

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    const token = generateToken('testkey', 'testsecret')
    expect(token).toBe(expectedToken)
  })
})
