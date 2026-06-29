// GET /api/auth/me — Returns current user info
import { json, getCurrentUser } from '../_utils.js'

export async function onRequestGet({ request, env }) {
  const user = await getCurrentUser(request, env)
  if (!user) return json({ authenticated: false }, 401)
  return json({ authenticated: true, ...user })
}
