import assert from 'node:assert/strict'
import test from 'node:test'

import syncMetaAdsSpend from '../netlify/functions/sync-meta-ads-spend.js'

test('consulta Meta con un rango explícito que incluye el día actual', async () => {
  const originalFetch = globalThis.fetch
  const requestedUrls = []

  globalThis.Netlify = {
    env: {
      get(key) {
        const values = {
          META_AD_ACCOUNT_ID: '123',
          META_ACCESS_TOKEN: 'test-token',
          SUPABASE_URL: 'https://example.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        }
        return values[key]
      },
    },
  }
  globalThis.fetch = async (url) => {
    requestedUrls.push(String(url))
    return Response.json({ data: [] })
  }

  try {
    const response = await syncMetaAdsSpend()
    const body = await response.json()
    const metaUrl = new URL(requestedUrls[0])
    const timeRange = JSON.parse(metaUrl.searchParams.get('time_range'))

    assert.equal(response.status, 200)
    assert.equal(body.actualizados, 0)
    assert.equal(timeRange.until, body.hasta)
    assert.equal(timeRange.since, body.desde)
    assert.equal(metaUrl.searchParams.has('date_preset'), false)
  } finally {
    globalThis.fetch = originalFetch
    delete globalThis.Netlify
  }
})
