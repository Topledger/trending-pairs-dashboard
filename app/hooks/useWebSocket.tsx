'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

export interface TrendingPair {
  symbol: string
  name: string
  mintAddress: string
  image?: string
  price: number
  priceChange24h: number
  priceChangePercentage24h: number
  marketCap: number
  volume24h: number
  age: string
  status: 'New' | 'Migrating' | 'Migrated'
  creationTimestamp: number
  social?: {
    twitter?: string
    telegram?: string
    website?: string
  }
  metrics?: {
    holders?: number
    transactions?: number
    buyCount?: number
    sellCount?: number
    liquidity?: number
    devHoldingPct?: number
    bundledWalletsPct?: number
    sniperWalletsPct?: number
    top10HoldersPct?: number
  }
}

interface UseWebSocketReturn {
  data: TrendingPair[]
  isConnected: boolean
  error: string | null
  reconnect: () => void
}

// Helper function to process pump-fun WebSocket data into our TrendingPair format
const processRawPair = (rawData: Record<string, unknown>): TrendingPair => {
  // Handle the exact format from your WebSocket
  const symbol = String(rawData.symbol || 'UNKNOWN')
  const name = String(rawData.name || rawData.symbol || 'Unknown Token')
  const price = parseFloat(String(rawData.price_usd || '0'))
  const marketCap = parseFloat(String(rawData.market_cap || '0'))
  const volume24h = parseFloat(String(rawData.total_volume_24h || rawData.buy_volume_24h || '0'))
  
  // Calculate price change percentage if we have buy/sell counts
  const buyCount = parseInt(String(rawData.buy_count || '0'))
  const sellCount = parseInt(String(rawData.sell_count || '0'))
  const totalTrades = buyCount + sellCount
  let priceChangePercentage24h = 0
  
  if (totalTrades > 0) {
    // Rough estimation: more buys = positive change
    priceChangePercentage24h = ((buyCount - sellCount) / totalTrades) * 100
  }
  
  // Handle creation timestamp for age
  const creationTimestamp = Number(rawData.creation_timestamp) || Date.now()
  let age = 'unknown'
  if (rawData.creation_timestamp) {
    const creationTime = new Date(Number(rawData.creation_timestamp))
    const now = new Date()
    const diffMs = now.getTime() - creationTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) age = `${diffDays}d`
    else if (diffHours > 0) age = `${diffHours}h`
    else age = '< 1h'
  }
  
  // Determine status based on category field (from WebSocket) or migration fields
  let status: 'New' | 'Migrating' | 'Migrated' = 'New'
  
  if (rawData.category) {
    // Use the category field directly from WebSocket message
    const category = String(rawData.category).toLowerCase()
    if (category === 'new') status = 'New'
    else if (category === 'migrating') status = 'Migrating' 
    else if (category === 'migrated') status = 'Migrated'
  } else {
    // Fallback to migration fields
    if (rawData.is_migrated === true) {
      status = 'Migrated'
    } else if (rawData.migration_timestamp && Number(rawData.migration_timestamp) > 0) {
      status = 'Migrating'
    }
  }
  
  return {
    symbol,
    name,
    mintAddress: String(rawData.mint || rawData.mint_address || symbol),
    price,
    marketCap,
    volume24h,
    priceChange24h: (price * priceChangePercentage24h) / 100,
    priceChangePercentage24h,
    age,
    status,
    creationTimestamp,
    image: rawData.image_uri ? String(rawData.image_uri) : undefined,
    social: {
      website: rawData.website ? String(rawData.website) : undefined,
      twitter: rawData.twitter ? String(rawData.twitter) : undefined,
      telegram: rawData.telegram ? String(rawData.telegram) : undefined
    },
    metrics: {
      holders: parseInt(String(rawData.holder_count || '0')),
      transactions: buyCount + sellCount,
      buyCount: buyCount,
      sellCount: sellCount,
      liquidity: parseFloat(String(rawData.liquidity_usd || '0')),
      devHoldingPct: parseFloat(String(rawData.dev_holding_pct || '0')),
      bundledWalletsPct: parseFloat(String(rawData.bundled_wallets_pct || '0')),
      sniperWalletsPct: parseFloat(String(rawData.sniper_wallets_pct || '0')),
      top10HoldersPct: parseFloat(String(rawData.top10_holders_pct || '0'))
    }
  }
}

export const useWebSocket = (url: string, selectedDex: 'pump-fun' | 'meteora-dbc' = 'pump-fun'): UseWebSocketReturn => {
  const [data, setData] = useState<TrendingPair[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 10

  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return
      }

      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected to:', url)
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        
        // Subscribe to selected DEX to get real trending data - using correct format from HTML file
        try {
          const subscribeMessage = {
            action: 'subscribe',
            dex: [selectedDex],
            categories: ['NEW', 'MIGRATING', 'MIGRATED']
          }
          wsRef.current?.send(JSON.stringify(subscribeMessage))
          console.log(`Sent ${selectedDex} subscription message:`, subscribeMessage)
        } catch (err) {
          console.log('Could not send subscription message:', err)
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          console.log('Raw WebSocket message received:', event.data)
          const message = JSON.parse(event.data)
          console.log('Parsed WebSocket message:', message)
          
          // Handle category_update messages with changed_fields
          if (message.type === 'category_update' && message.data && message.changed_fields) {
            const action = message.action || 'add'
            const tokenData = message.data
            const changedFields = message.changed_fields
            
            console.log('🎯 Category update received:', {
              symbol: tokenData.symbol || tokenData.mint,
              action: action,
              category: message.category,
              changedFields: changedFields
            })
            
            // Add category to token data for processing
            const enhancedTokenData = { ...tokenData, category: message.category }
            
            setData(prevData => {
              // Find existing token by symbol or mint address
              const existingIndex = prevData.findIndex(pair => 
                pair.symbol === tokenData.symbol || 
                pair.symbol === tokenData.mint ||
                (tokenData.mint && pair.symbol === tokenData.mint)
              )
              
              if (action === 'update' && existingIndex !== -1) {
                // UPDATE: Only update changed fields for existing token
                console.log('✅ UPDATING existing token:', tokenData.symbol || tokenData.mint, 'Changed fields:', changedFields)
                const newData = [...prevData]
                const existingPair = newData[existingIndex]
                
                // Update only the changed fields
                const updatedPair = { ...existingPair }
                
                changedFields.forEach((field: string) => {
                  switch (field) {
                    case 'price_usd':
                      updatedPair.price = parseFloat(tokenData.price_usd || 0)
                      updatedPair.priceChange24h = (updatedPair.price * updatedPair.priceChangePercentage24h) / 100
                      break
                    case 'market_cap':
                      updatedPair.marketCap = parseFloat(tokenData.market_cap || 0)
                      break
                    case 'total_volume_24h':
                    case 'buy_volume_24h':
                      updatedPair.volume24h = parseFloat(tokenData.total_volume_24h || tokenData.buy_volume_24h || 0)
                      break
                    case 'liquidity_usd':
                      if (!updatedPair.metrics) updatedPair.metrics = { holders: 0, transactions: 0, liquidity: 0 }
                      updatedPair.metrics.liquidity = parseFloat(tokenData.liquidity_usd || 0)
                      break
                    case 'holder_count':
                      if (!updatedPair.metrics) updatedPair.metrics = { holders: 0, transactions: 0, liquidity: 0 }
                      updatedPair.metrics.holders = parseInt(tokenData.holder_count || 0)
                      break
                    case 'buy_count':
                    case 'sell_count':
                      if (!updatedPair.metrics) updatedPair.metrics = { holders: 0, transactions: 0, liquidity: 0 }
                      const buyCount = parseInt(tokenData.buy_count || 0)
                      const sellCount = parseInt(tokenData.sell_count || 0)
                      updatedPair.metrics.transactions = buyCount + sellCount
                      updatedPair.metrics.buyCount = buyCount
                      updatedPair.metrics.sellCount = sellCount
                      
                      // Recalculate price change percentage
                      const totalTrades = buyCount + sellCount
                      if (totalTrades > 0) {
                        updatedPair.priceChangePercentage24h = ((buyCount - sellCount) / totalTrades) * 100
                        updatedPair.priceChange24h = (updatedPair.price * updatedPair.priceChangePercentage24h) / 100
                      }
                      break
                    case 'is_migrated':
                      if (tokenData.is_migrated === true) updatedPair.status = 'Migrated'
                      break
                    case 'migration_timestamp':
                      if (tokenData.migration_timestamp && tokenData.migration_timestamp > 0 && !tokenData.is_migrated) {
                        updatedPair.status = 'Migrating'
                      }
                      break
                    case 'dev_holding_pct':
                      if (!updatedPair.metrics) updatedPair.metrics = { holders: 0, transactions: 0, liquidity: 0 }
                      updatedPair.metrics.devHoldingPct = parseFloat(tokenData.dev_holding_pct || 0)
                      break
                    case 'bundled_wallets_pct':
                      if (!updatedPair.metrics) updatedPair.metrics = { holders: 0, transactions: 0, liquidity: 0 }
                      updatedPair.metrics.bundledWalletsPct = parseFloat(tokenData.bundled_wallets_pct || 0)
                      break
                    case 'sniper_wallets_pct':
                      if (!updatedPair.metrics) updatedPair.metrics = { holders: 0, transactions: 0, liquidity: 0 }
                      updatedPair.metrics.sniperWalletsPct = parseFloat(tokenData.sniper_wallets_pct || 0)
                      break
                    case 'top10_holders_pct':
                      if (!updatedPair.metrics) updatedPair.metrics = { holders: 0, transactions: 0, liquidity: 0 }
                      updatedPair.metrics.top10HoldersPct = parseFloat(tokenData.top10_holders_pct || 0)
                      break
                  }
                })
                
                // Update category if it changed
                if (message.category) {
                  const category = message.category.toLowerCase()
                  if (category === 'new') updatedPair.status = 'New'
                  else if (category === 'migrating') updatedPair.status = 'Migrating'
                  else if (category === 'migrated') updatedPair.status = 'Migrated'
                }
                
                newData[existingIndex] = updatedPair
                return newData
              } else {
                // ADD: New token or token doesn't exist yet
                console.log('✅ ADDING new token:', tokenData.symbol || tokenData.mint, 'Category:', message.category)
                const processedPair = processRawPair(enhancedTokenData)
                console.log('✅ Token processed with status:', processedPair.status)
                
                if (existingIndex !== -1) {
                  // Replace existing (shouldn't happen but handle it)
                  const newData = [...prevData]
                  newData[existingIndex] = processedPair
                  return newData.sort((a: TrendingPair, b: TrendingPair) => b.creationTimestamp - a.creationTimestamp)
                } else {
                  // Add new token, sort by creation timestamp (newest first)
                  const newData = [processedPair, ...prevData]
                    .sort((a: TrendingPair, b: TrendingPair) => b.creationTimestamp - a.creationTimestamp)
                  return newData
                }
              }
            })
          }
          // Handle direct token data (fallback for other message formats)
          else if (message.symbol && message.name) {
            const processedPair = processRawPair(message)
            console.log('📦 Direct token data received:', processedPair.symbol)
            
            setData(prevData => {
              const existingIndex = prevData.findIndex(pair => pair.symbol === processedPair.symbol)
              if (existingIndex !== -1) {
                // Update existing pair
                const newData = [...prevData]
                newData[existingIndex] = processedPair
                return newData.sort((a: TrendingPair, b: TrendingPair) => b.creationTimestamp - a.creationTimestamp)
              } else {
                // Add new pair, sort by creation timestamp (newest first)
                const newData = [processedPair, ...prevData]
                  .sort((a: TrendingPair, b: TrendingPair) => b.creationTimestamp - a.creationTimestamp)
                return newData
              }
            })
          } 
          // Handle array of pairs
          else if (Array.isArray(message)) {
            console.log('📦 Array of tokens received:', message.length)
            const processedData = message.map(processRawPair)
              .sort((a: TrendingPair, b: TrendingPair) => b.creationTimestamp - a.creationTimestamp)
            setData(processedData)
          }
          // Handle other structured messages
          else if (message.type && message.data && !message.type.includes('category_update')) {
            if (Array.isArray(message.data)) {
              const processedData = message.data.map(processRawPair)
                .sort((a: TrendingPair, b: TrendingPair) => b.creationTimestamp - a.creationTimestamp)
              setData(processedData)
            } else if (message.data.symbol) {
              const processedPair = processRawPair(message.data)
              setData(prevData => {
                const newData = [processedPair, ...prevData]
                  .sort((a: TrendingPair, b: TrendingPair) => b.creationTimestamp - a.creationTimestamp)
                return newData
              })
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err, 'Raw data:', event.data)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        
        // Attempt to reconnect if it wasn't a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, timeout)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
        setIsConnected(false)
      }
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err)
      setError('Failed to create WebSocket connection')
    }
  }, [url, selectedDex])

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  useEffect(() => {
    // Clear data when DEX changes
    setData([])
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
      }
    }
  }, [connect])

  return {
    data,
    isConnected,
    error,
    reconnect
  }
}