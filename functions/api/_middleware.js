// _middleware.js — runs before every /api/* Pages Function.
// Patches env.DEMAIN_DATA with the D1-backed KV adapter automatically,
// so all existing functions that call env.DEMAIN_DATA.get/put/delete/list
// work without any code changes.

import { patchEnv } from './_kv_adapter.js'

export async function onRequest(context) {
  // Patch the env object in place before passing to the next handler
  patchEnv(context.env)
  return context.next()
}
