import { useEffect, useState } from 'react'

/**
 * Fetches the SKUs still open for sale. Returns null until loaded, and
 * stays null if the request fails so the embed falls back to showing
 * every configured date rather than hiding them all.
 */
export function useOpenShows(apiBase) {
  const [openSkus, setOpenSkus] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${apiBase}/api/shows/`)
      .then((res) => {
        if (!res.ok) throw new Error(`bad response: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setOpenSkus(new Set(data.map((s) => s.sku)))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [apiBase])

  return openSkus
}
