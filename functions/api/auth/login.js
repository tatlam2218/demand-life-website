import { createAuthCookie, json, readJson } from '../_utils.js'

// Credentials are stored in env secrets. Supports 3 roles:
//   admin       (legacy super-admin: sees both Stay and Shop)
//   admin_stay  (酒店运营: only sees Stay data)
//   admin_shop  (文创运营: only sees Shop data)
//
// Env vars expected:
//   ADMIN_USERNAME / ADMIN_PASSWORD               (super admin)
//   ADMIN_STAY_USERNAME / ADMIN_STAY_PASSWORD     (stay)
//   ADMIN_SHOP_USERNAME / ADMIN_SHOP_PASSWORD     (shop)

function buildCredentials(env) {
  const list = []
  if (env.ADMIN_USERNAME && env.ADMIN_PASSWORD) {
    list.push({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD, role: 'admin' })
  }
  if (env.ADMIN_STAY_USERNAME && env.ADMIN_STAY_PASSWORD) {
    list.push({ username: env.ADMIN_STAY_USERNAME, password: env.ADMIN_STAY_PASSWORD, role: 'stay' })
  }
  if (env.ADMIN_SHOP_USERNAME && env.ADMIN_SHOP_PASSWORD) {
    list.push({ username: env.ADMIN_SHOP_USERNAME, password: env.ADMIN_SHOP_PASSWORD, role: 'shop' })
  }
  return list
}

export async function onRequestPost(context) {
  const body = await readJson(context.request)
  const username = body?.username?.trim()
  const password = body?.password

  if (!username || !password) {
    return json({ success: false, error: 'Missing username or password' }, { status: 400 })
  }

  const credentials = buildCredentials(context.env)
  const matched = credentials.find((c) => c.username === username && c.password === password)
  if (!matched) {
    return json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  }

  // Determine where to redirect after login
  const redirect = matched.role === 'shop' ? '/admin/shop' : '/admin/stay'

  return json(
    { success: true, role: matched.role, redirect },
    { headers: { 'Set-Cookie': await createAuthCookie(matched.username, context.env) } }
  )
}
