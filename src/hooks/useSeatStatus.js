import { useEffect, useState } from 'react'

/**
 * Fetches sold-seat codes for one show from the Django seat-status
 * endpoint. Re-fetches whenever the sku changes (e.g. switching day tabs).
 */
export function useSeatStatus(apiBase, sku) {
  const [soldSeats, setSoldSeats] = useState([])
  const [heldSeats, setHeldSeats] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    fetch(`${apiBase}/api/shows/${sku}/seats/`)
      .then((res) => {
        if (!res.ok) throw new Error(`bad response: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setSoldSeats(data.soldSeats || [])
        setHeldSeats(data.heldSeats || [])
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setSoldSeats([])
        setHeldSeats([])
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [apiBase, sku])

  return { soldSeats, heldSeats, status }
}
