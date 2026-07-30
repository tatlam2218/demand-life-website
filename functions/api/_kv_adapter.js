// _kv_adapter.js
// D1-backed KV compatibility shim for Cloudflare Pages Functions.
//
// Wraps a D1Database so it presents the same interface as a KV namespace:
//   .get(key)              → value string | null
//   .get(key, 'json')      → parsed object | null
//   .put(key, value)       → void
//   .delete(key)           → void
//   .list({ prefix, cursor, limit })  → { keys: [{name}], list_complete, cursor }
//
// The underlying D1 table is:
//   CREATE TABLE kv_store (key TEXT PRIMARY KEY, value TEXT NOT NULL);
//
// Usage in any Pages Function:
//   import { makeKVAdapter } from '../_kv_adapter.js'
//   const kv = makeKVAdapter(env.DB)   // DB = D1 binding name
//
// But we expose it transparently: in _kv_compat.js we patch env.DEMAIN_DATA
// automatically so no other file needs to be changed.

export function makeKVAdapter(db) {
  return {
    // get(key) → string | null
    // get(key, 'json') → object | null
    async get(key, type) {
      const result = await db
        .prepare('SELECT value FROM kv_store WHERE key = ?')
        .bind(key)
        .first()
      if (!result) return null
      const raw = result.value
      if (type === 'json') {
        try { return JSON.parse(raw) } catch { return null }
      }
      return raw
    },

    // put(key, value) — value must be string or stringifiable
    async put(key, value) {
      const str = typeof value === 'string' ? value : JSON.stringify(value)
      await db
        .prepare('INSERT INTO kv_store (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
        .bind(key, str)
        .run()
    },

    // delete(key)
    async delete(key) {
      await db
        .prepare('DELETE FROM kv_store WHERE key = ?')
        .bind(key)
        .run()
    },

    // list({ prefix?, cursor?, limit? })
    // Returns { keys: [{name: string}], list_complete: boolean, cursor: string | undefined }
    async list({ prefix = '', cursor, limit = 1000 } = {}) {
      // cursor encodes an offset integer for simplicity
      const offset = cursor ? parseInt(cursor, 10) : 0
      const cap = Math.min(limit, 1000)

      // Fetch one extra to know if there's a next page
      const rows = await db
        .prepare(
          'SELECT key FROM kv_store WHERE key LIKE ? ORDER BY key LIMIT ? OFFSET ?'
        )
        .bind(prefix + '%', cap + 1, offset)
        .all()

      const allKeys = rows.results || []
      const hasMore = allKeys.length > cap
      const page = hasMore ? allKeys.slice(0, cap) : allKeys

      return {
        keys: page.map((r) => ({ name: r.key })),
        list_complete: !hasMore,
        cursor: hasMore ? String(offset + cap) : undefined
      }
    }
  }
}

// Patch env in-place: replace env.DEMAIN_DATA with the D1 adapter.
// Call this at the top of any function that uses env.DEMAIN_DATA.
// If env.DB is not set (local dev without D1), env.DEMAIN_DATA is left as-is.
export function patchEnv(env) {
  if (env.DB && !env._kvPatched) {
    env.DEMAIN_DATA = makeKVAdapter(env.DB)
    env._kvPatched = true
  }
  return env
}
