'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

type EventHandler = (data: any) => void

interface RealtimeOptions {
  url: string
  onMessage?: EventHandler
  onStatusChange?: (status: ConnectionStatus) => void
  reconnectInterval?: number
  maxReconnects?: number
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useRealtime(options: RealtimeOptions) {
  const { url, onMessage, onStatusChange, reconnectInterval = 5000, maxReconnects = 10 } = options
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectCount = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onMessageRef = useRef(onMessage)
  const onStatusChangeRef = useRef(onStatusChange)
  const urlRef = useRef(url)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  useEffect(() => {
    urlRef.current = url
  }, [url])

  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus)
    onStatusChangeRef.current?.(newStatus)
  }, [])

  useEffect(() => {
    let cancelled = false

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      updateStatus('connecting')
      const es = new EventSource(urlRef.current)
      eventSourceRef.current = es

      es.onopen = () => {
        if (cancelled) { es.close(); return }
        updateStatus('connected')
        reconnectCount.current = 0
      }

      es.onmessage = (event) => {
        if (cancelled) return
        try {
          const data = JSON.parse(event.data)
          onMessageRef.current?.(data)
        } catch {
          onMessageRef.current?.(event.data)
        }
      }

      es.onerror = () => {
        if (cancelled) return
        es.close()
        updateStatus('error')

        if (reconnectCount.current < maxReconnects) {
          reconnectCount.current++
          reconnectTimer.current = setTimeout(connect, reconnectInterval)
        } else {
          updateStatus('disconnected')
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      if (eventSourceRef.current) eventSourceRef.current.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [updateStatus, maxReconnects, reconnectInterval])

  const close = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
    }
    updateStatus('disconnected')
  }, [updateStatus])

  return { status, close }
}
