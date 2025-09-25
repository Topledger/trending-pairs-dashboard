'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// TypeScript interfaces based on our protobuf schema
export interface PnlMetrics {
  unrealized_pnl_usd: number
  unrealized_pnl_pct: number
  realized_pnl_usd: number
  realized_pnl_pct: number
}

export interface TradeEvent {
  platform: string
  priceNative: string
  solAmount: number
  timestamp: string
  tokenAmount: number
  transactionId: string
  tradeType: number  // 1=BUY, 2=SELL, 0=UNSPECIFIED
  walletAddress: string
  processingTimeUs: string
  slot: string
  priceUsd: string
  baseMint: string
  baseMintSymbol: string
  baseMintName: string
  quoteMint: string
  quoteMintSymbol: string
  quoteMintName: string
  totalNetworkFee: number
  pnlMint7d?: string  // Binary data, will ignore for now
  currentSolBalance: number
  currentTokenBalance: number
  poolAddress: string
  currentSupply?: number
}

export const useKafkaConsumer = () => {
  const [events, setEvents] = useState<TradeEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<WebSocket | null>(null)
  const [stats, setStats] = useState({
    totalEvents: 0,
    buyEvents: 0,
    sellEvents: 0,
    totalVolume: 0,
    avgProcessingTime: 0
  })

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    disconnect()
    setError(null)
    
    // Connect to our WebSocket server
    const ws = new WebSocket('ws://localhost:8080')
    eventSourceRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Skip connection messages
        if (data.type === 'connected') {
          return
        }
        
        const tradeEvent: TradeEvent = data
        
        setEvents(prev => {
          // Check if this event already exists to prevent duplicates
          const exists = prev.some(e => e.transactionId === tradeEvent.transactionId)
          if (exists) return prev
          
          // Add new event without global slicing - let each token page handle its own limits
          return [tradeEvent, ...prev]
        })

        // Update stats
        setStats(prev => {
          const processingTime = typeof tradeEvent.processingTimeUs === 'string' 
            ? parseInt(tradeEvent.processingTimeUs)
            : tradeEvent.processingTimeUs
          
          return {
            totalEvents: prev.totalEvents + 1,
            buyEvents: prev.buyEvents + (tradeEvent.tradeType === 1 ? 1 : 0),
            sellEvents: prev.sellEvents + (tradeEvent.tradeType === 2 ? 1 : 0),
            totalVolume: prev.totalVolume + (parseFloat(tradeEvent.priceUsd || '0') * tradeEvent.tokenAmount),
            avgProcessingTime: (prev.avgProcessingTime + processingTime) / 2
          }
        })
      } catch (err) {
        console.error('Failed to parse trade event:', err)
      }
    }

    ws.onerror = () => {
      setError('Connection lost to Kafka stream')
      setIsConnected(false)
    }
    
    ws.onclose = () => {
      setIsConnected(false)
    }
  }, [disconnect])

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  const clearEvents = useCallback(() => {
    setEvents([])
    setStats({
      totalEvents: 0,
      buyEvents: 0,
      sellEvents: 0,
      totalVolume: 0,
      avgProcessingTime: 0
    })
  }, [])

  return {
    events,
    isConnected,
    error,
    stats,
    connect,
    disconnect,
    clearEvents
  }
}
