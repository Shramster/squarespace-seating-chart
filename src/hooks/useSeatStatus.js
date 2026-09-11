import { useEffect, useState } from 'react'

const POLL_INTERVAL_MS = 15000

/**
 * Fetches sold-seat codes for one show from the Django seat-status
 * endpoint, then polls every 15s so a seat someone else just bought shows
 * as sold without the buyer needing to reload. Re-fetches immediately
 * whenever apiBase/sku changes (e.g. switching day tabs), restarting the
 * poll cycle for the new show.
 */
export function useSeatStatus(apiBase, sku) {
  const [soldSeats, setSoldSeats] = useState([])
  const [heldSeats, setHeldSeats] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false

    function fetchStatus(isInitial) {
      if (isInitial) setStatus('loading')

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
          if (isInitial) {
            // Only the first load surfaces an error banner — a background
            // poll failing is likely a transient blip, so keep showing
            // the last known-good sold-seat list instead of flashing an
            // error every 15s.
            setSoldSeats([])
            setHeldSeats([])
            setStatus('error')
          }
        })
    }

    fetchStatus(true)
    const intervalId = setInterval(() => fetchStatus(false), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [apiBase, sku])

  return { soldSeats, heldSeats, status }
}
