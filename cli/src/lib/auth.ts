import crypto from 'node:crypto'

export function generateToken(key: string, secret: string): string {
  const epoch = Math.floor(Date.now() / 1000)
  const hash = crypto
    .createHmac('sha256', secret)
    .update(`${key}_${epoch}_=admin`)
    .digest('hex')
  return `tkn_${key}_${epoch}_=admin_${hash}`
}
