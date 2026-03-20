const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const YAHOO_ITEM_SEARCH_URL = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch'

export async function requestExpirationEstimate({ barcode, purchaseDate }) {
  const response = await fetch(`${API_BASE}/api/estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barcode,
      purchase_date: purchaseDate,
      request_url: YAHOO_ITEM_SEARCH_URL,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || '接続失敗')
  }

  return response.json()
}
