import { useEffect, useRef, useState, useCallback } from 'react'
export function useWebSocket() {
  const ws = useRef(null)
  const [connected, setConnected] = useState(false)
  const [liveEvents, setLiveEvents] = useState([])
  const pingRef = useRef(null)
  const connect = useCallback(() => {
    const base = import.meta.env.VITE_WS_URL || (window.location.protocol==='https:' ? 'wss' : 'ws') + '://' + window.location.host
    ws.current = new WebSocket(`${base}/ws/live`)
    ws.current.onopen = () => { setConnected(true); pingRef.current = setInterval(() => { if (ws.current?.readyState===1) ws.current.send('ping') }, 20000) }
    ws.current.onmessage = e => { if (e.data==='pong') return; try { const ev=JSON.parse(e.data); setLiveEvents(p=>[{...ev,id:Date.now()},...p].slice(0,50)) } catch{} }
    ws.current.onclose = () => { setConnected(false); clearInterval(pingRef.current); setTimeout(connect, 3000) }
    ws.current.onerror = () => ws.current?.close()
  }, [])
  useEffect(() => { connect(); return () => { clearInterval(pingRef.current); ws.current?.close() } }, [connect])
  return { connected, liveEvents }
}
