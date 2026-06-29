import { clearAuthCookie, json } from '../_utils.js'

export async function onRequestPost() {
  return json({ success: true }, { headers: { 'Set-Cookie': clearAuthCookie() } })
}
