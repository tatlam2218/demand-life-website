// Cloudflare Browser Rendering — HTML to PDF
// Requires:
//   - CF_ACCOUNT_ID
//   - CF_BROWSER_RENDERING_TOKEN (API token with "Browser Rendering: Edit" permission)

export async function htmlToPdf(env, html, options = {}) {
  const accountId = env.CF_ACCOUNT_ID
  const token = env.CF_BROWSER_RENDERING_TOKEN
  if (!accountId || !token) {
    throw new Error('Browser Rendering not configured (missing CF_ACCOUNT_ID or CF_BROWSER_RENDERING_TOKEN)')
  }
  const body = {
    html,
    pdfOptions: {
      format: options.format || 'a4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: options.margin || { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
      displayHeaderFooter: !!options.displayHeaderFooter,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || ''
    },
    gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 }
  }
  const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/pdf`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Browser Rendering failed: ${resp.status} ${text.slice(0, 300)}`)
  }
  const buf = await resp.arrayBuffer()
  return new Uint8Array(buf)
}

export function isPdfConfigured(env) {
  return !!(env.CF_ACCOUNT_ID && env.CF_BROWSER_RENDERING_TOKEN)
}
