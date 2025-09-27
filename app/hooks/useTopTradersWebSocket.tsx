'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface TopTrader {
  wallet_address: string
  total_volume_usd?: number
  total_trades?: number
  buy_volume_usd?: number
  sell_volume_usd?: number
  net_volume_usd?: number
  first_trade_timestamp?: string
  last_trade_timestamp?: string
  pnl_usd?: number
  win_rate?: number
  // Additional fields from the actual data
  bought_tokens?: number
  bought_usd?: number
  sold_tokens?: number
  sold_usd?: number
  buy_count?: number
  sell_count?: number
  realized_pnl_usd?: number
  realized_pnl_pct?: number
  current_token_balance?: number
  current_sol_balance?: number
  [key: string]: unknown // Allow any additional fields
}

interface UseTopTradersWebSocketReturn {
  traders: TopTrader[]
  isConnected: boolean
  error: string | null
  subscribe: (mintAddress: string) => void
  unsubscribe: () => void
  reconnect: () => void
}

export const useTopTradersWebSocket = (): UseTopTradersWebSocketReturn => {
  const [traders, setTraders] = useState<TopTrader[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const currentMintRef = useRef<string | null>(null)

  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return
      }

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close()
      }

      wsRef.current = new WebSocket('ws://34.107.31.9/ws/top-traders')

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setError(null)
        
        // Connection established, subscription will be handled externally
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle different message types - be more flexible with the response format
          if (data.type === 'server_message' && data.data && data.data.type === 'top_traders_update' && data.data.data && data.data.data.traders) {
            setTraders(data.data.data.traders)
          } else if (data.type === 'top_traders_update' && data.data && data.data.traders) {
            setTraders(data.data.traders)
          } else if (data.type === 'server_message' && data.data) {
            // Check if data contains traders array
            if (Array.isArray(data.data)) {
              setTraders(data.data)
            } else if (data.data.traders && Array.isArray(data.data.traders)) {
              setTraders(data.data.traders)
            }
          } else if (data.type === 'top_traders' && data.data) {
            setTraders(data.data)
          } else if (data.traders) {
            // Alternative format - direct traders array
            setTraders(data.traders)
          } else if (Array.isArray(data)) {
            // Direct array format
            setTraders(data)
          }
        } catch (err) {
          // Silent error handling
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
      }

      wsRef.current.onerror = () => {
        setError('WebSocket connection error')
        setIsConnected(false)
      }
    } catch (err) {
      setError('Failed to create WebSocket connection')
    }
  }, [])

  const subscribe = useCallback((mintAddress: string) => {
    currentMintRef.current = mintAddress
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        type: "client_message",
        data: {
          action: "subscribe",
          mints: [mintAddress]
        },
        timestamp: new Date().toISOString()
      }
      
      wsRef.current.send(JSON.stringify(subscribeMessage))
    }
  }, [])

  const unsubscribe = useCallback(() => {
    currentMintRef.current = null
    setTraders([])
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const unsubscribeMessage = {
        type: "client_message", 
        data: {
          action: "unsubscribe"
        },
        timestamp: new Date().toISOString()
      }
      
      wsRef.current.send(JSON.stringify(unsubscribeMessage))
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      unsubscribe()
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect, unsubscribe])

  const reconnect = useCallback(() => {
    connect()
  }, [connect])

  return {
    traders,
    isConnected,
    error,
    subscribe,
    unsubscribe,
    reconnect
  }
}
