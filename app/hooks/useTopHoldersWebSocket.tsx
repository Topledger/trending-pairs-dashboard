'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface TopHolder {
  wallet_address: string
  current_token_balance?: number
  token_balance_usd?: number
  holder_rank?: number
  percentage_of_supply?: number
  unrealized_pnl_usd?: number
  unrealized_pnl_pct?: number
  realized_pnl_usd?: number
  realized_pnl_pct?: number
  first_buy_timestamp?: number
  last_activity_timestamp?: number
  last_global_activity_timestamp?: number
  buy_count?: number
  sell_count?: number
  bought_usd?: number
  sold_usd?: number
  bought_tokens?: number
  sold_tokens?: number
  current_sol_balance?: number
  transferred_amount?: number
  [key: string]: unknown // Allow any additional fields
}

interface UseTopHoldersWebSocketReturn {
  holders: TopHolder[]
  isConnected: boolean
  error: string | null
  subscribe: (mintAddress: string) => void
  unsubscribe: () => void
  reconnect: () => void
}

export const useTopHoldersWebSocket = (): UseTopHoldersWebSocketReturn => {
  const [holders, setHolders] = useState<TopHolder[]>([])
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

      wsRef.current = new WebSocket('ws://34.107.31.9/ws/top-holders')

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setError(null)
        
        // Connection established, subscription will be handled externally
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle different message types - be more flexible with the response format
          if (data.type === 'server_message' && data.data && data.data.type === 'top_holders_update' && data.data.data && data.data.data.holders) {
            setHolders(data.data.data.holders)
          } else if (data.type === 'top_holders_update' && data.data && data.data.holders) {
            setHolders(data.data.holders)
          } else if (data.type === 'server_message' && data.data) {
            // Check if data contains holders array
            if (Array.isArray(data.data)) {
              setHolders(data.data)
            } else if (data.data.holders && Array.isArray(data.data.holders)) {
              setHolders(data.data.holders)
            }
          } else if (data.type === 'top_holders' && data.data) {
            setHolders(data.data)
          } else if (data.holders) {
            // Alternative format - direct holders array
            setHolders(data.holders)
          } else if (Array.isArray(data)) {
            // Direct array format
            setHolders(data)
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
    setHolders([])
    
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
    holders,
    isConnected,
    error,
    subscribe,
    unsubscribe,
    reconnect
  }
}
