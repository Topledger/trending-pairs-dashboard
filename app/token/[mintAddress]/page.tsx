'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useKafkaConsumer } from '../../hooks/useKafkaConsumer'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useTopTradersWebSocket } from '../../hooks/useTopTradersWebSocket'
import { useTopHoldersWebSocket } from '../../hooks/useTopHoldersWebSocket'

const TokenDetailPage: React.FC = () => {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mintAddress = params.mintAddress as string
  
  // Get token data from URL params (passed from trading pair card)
  const tokenData = useMemo(() => {
    const dataParam = searchParams.get('data')
    if (dataParam) {
      try {
        return JSON.parse(dataParam)
      } catch (e) {
        // Silent error handling
        return null
      }
    }
    return null
  }, [searchParams])
  
  const { events, isConnected, error, connect, disconnect } = useKafkaConsumer()
  const { data: trendingPairs } = useWebSocket('ws://34.107.31.9/ws/trending-pairs', 'pump-fun')
  const { traders: topTraders, isConnected: tradersConnected, subscribe: subscribeToTraders } = useTopTradersWebSocket()
  const { holders: topHolders, isConnected: holdersConnected, subscribe: subscribeToHolders } = useTopHoldersWebSocket()
  
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'traders' | 'holders'>('all')
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())
  
  // Get real-time token info from trending pairs (updates live)
  const liveTokenInfo = useMemo(() => {
    return trendingPairs.find(pair => pair.mintAddress === mintAddress) || null
  }, [trendingPairs, mintAddress])

  // Subscribe to top traders when mint address is available
  useEffect(() => {
    if (mintAddress && tradersConnected) {
      subscribeToTraders(mintAddress)
    }
  }, [mintAddress, tradersConnected, subscribeToTraders])

  // Subscribe to top holders when mint address is available
  useEffect(() => {
    if (mintAddress && holdersConnected) {
      subscribeToHolders(mintAddress)
    }
  }, [mintAddress, holdersConnected, subscribeToHolders])
  

  // Get last 50 events for this specific mint address (no type filter applied)
  const allTokenEvents = useMemo(() => {
    return events
      .filter(event => event.baseMint === mintAddress)
      .sort((a, b) => {
        // Sort by timestamp descending (newest first)
        const timestampA = parseInt(a.timestamp || '0')
        const timestampB = parseInt(b.timestamp || '0')
        return timestampB - timestampA
      })
      .slice(0, 50) // Keep only last 50 trades for this token
  }, [events, mintAddress])

  // Get token info from the latest event (from ALL events, not filtered)
  const latestTokenInfo = useMemo(() => {
    return allTokenEvents.length > 0 ? allTokenEvents[0] : null
  }, [allTokenEvents])

  // Calculate token-specific stats (from ALL events for this token, not filtered)
  const tokenStats = useMemo(() => {
    const buyEvents = allTokenEvents.filter(e => e.tradeType === 1)
    const sellEvents = allTokenEvents.filter(e => e.tradeType === 2)
    const totalVolume = allTokenEvents.reduce((sum, e) => 
      sum + (parseFloat(e.priceUsd || '0') * e.tokenAmount), 0
    )
    const totalTokenVolume = allTokenEvents.reduce((sum, e) => sum + e.tokenAmount, 0)
    const totalSolVolume = allTokenEvents.reduce((sum, e) => sum + e.solAmount, 0)
    
    return {
      totalTrades: allTokenEvents.length,
      buyTrades: buyEvents.length,
      sellTrades: sellEvents.length,
      totalVolume,
      totalTokenVolume,
      totalSolVolume,
      avgPrice: totalTokenVolume > 0 ? totalSolVolume / totalTokenVolume : 0
    }
  }, [allTokenEvents])

  // Filter events for display based on trade type filter
  const filteredTokenEvents = useMemo(() => {
    if (filter === 'all') return allTokenEvents
    if (filter === 'buy') return allTokenEvents.filter(event => event.tradeType === 1)
    if (filter === 'sell') return allTokenEvents.filter(event => event.tradeType === 2)
    return allTokenEvents
  }, [allTokenEvents, filter])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`
    } else {
      return `$${volume.toFixed(0)}`
    }
  }

  const formatTokenAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`
    } else {
      return amount.toFixed(2)
    }
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) {
      return `${(marketCap / 1000000).toFixed(1)}M`
    } else if (marketCap >= 1000) {
      return `${(marketCap / 1000).toFixed(1)}K`
    } else if (marketCap >= 1) {
      return marketCap.toFixed(0)
    } else {
      return marketCap.toFixed(3)
    }
  }

  const handleCopyItem = async (text: string, itemId: string) => {
    try {
      // Try modern clipboard API first (requires HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for HTTP environments
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      setCopiedItems(prev => new Set(prev).add(itemId))
      
      // Remove the item from copied set after 1 second
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      }, 1000)
    } catch (err) {
      // Silent error handling
    }
  }

  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>
      )
    } else if (error) {
      return (
        <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-lg">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span className="text-xs text-red-400 font-medium">Error</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-lg">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-yellow-400 font-medium">Connecting</span>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-none mx-auto px-12 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-2 text-gray-300 rounded-lg text-sm hover:bg-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              
            </button>
            <div>
              <h1 className="text-sm font-regular flex items-center gap-3">
                {(liveTokenInfo || tokenData || latestTokenInfo) ? (
                  <>
                    <span className="text-blue-400 font-medium">
                      {liveTokenInfo ? liveTokenInfo.symbol : 
                       tokenData ? tokenData.symbol : 
                       latestTokenInfo?.baseMintSymbol}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="text-gray-400">
                      {liveTokenInfo ? liveTokenInfo.name : 
                       tokenData ? tokenData.name : 
                       latestTokenInfo?.baseMintName}
                    </span>
                    <button
                      onClick={() => window.open(`https://solscan.io/token/${mintAddress}`, '_blank')}
                      className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      {formatAddress(mintAddress)}
                    </button>
                    <button
                      onClick={() => handleCopyItem(mintAddress, `mint-header-${mintAddress}`)}
                      className={`transition-colors ${
                        copiedItems.has(`mint-header-${mintAddress}`) 
                          ? 'text-green-400' 
                          : 'text-gray-500 hover:text-green-400'
                      }`}
                      title="Copy mint address"
                    >
                      {copiedItems.has(`mint-header-${mintAddress}`) ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </>
                ) : (
                  <span>Token Details</span>
                )}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getConnectionStatus()}
            <button
              onClick={isConnected ? disconnect : connect}
              className={`p-2 rounded-lg transition-colors ${
                isConnected 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
              title={isConnected ? 'Pause live updates' : 'Start live updates'}
            >
              {isConnected ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

       



        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <div className="text-red-400 font-medium">Connection Error</div>
            <div className="text-red-300 text-sm">{error}</div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Side - Chart and Feeds (3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Price Chart - Top Half */}
            <div className="bg-gray-950 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">Price Chart</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Simple Line Chart */}
                  <svg className="w-full h-full" viewBox="0 0 300 200">
                    {/* Chart Background */}
                    <defs>
                      <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                        <stop offset="100%" stopColor="rgba(34, 197, 94, 0.0)" />
                      </linearGradient>
                    </defs>
                    
                    {/* Generate simple price line based on events */}
                    {allTokenEvents.length > 1 && (
                      <>
                        {/* Price area fill */}
                        <path
                          d={`M 0 200 ${allTokenEvents.slice(-20).map((event, index) => {
                            const x = (index / 19) * 300
                            const price = parseFloat(event.priceUsd || '0')
                            const maxPrice = Math.max(...allTokenEvents.slice(-20).map(e => parseFloat(e.priceUsd || '0')))
                            const minPrice = Math.min(...allTokenEvents.slice(-20).map(e => parseFloat(e.priceUsd || '0')))
                            const y = 180 - ((price - minPrice) / (maxPrice - minPrice || 1)) * 160
                            return `L ${x} ${y}`
                          }).join(' ')} L 300 200 Z`}
                          fill="url(#priceGradient)"
                        />
                        {/* Price line */}
                        <path
                          d={`M ${allTokenEvents.slice(-20).map((event, index) => {
                            const x = (index / 19) * 300
                            const price = parseFloat(event.priceUsd || '0')
                            const maxPrice = Math.max(...allTokenEvents.slice(-20).map(e => parseFloat(e.priceUsd || '0')))
                            const minPrice = Math.min(...allTokenEvents.slice(-20).map(e => parseFloat(e.priceUsd || '0')))
                            const y = 180 - ((price - minPrice) / (maxPrice - minPrice || 1)) * 160
                            return `${index === 0 ? '' : 'L '}${x} ${y}`
                          }).join(' ')}`}
                          stroke="#22c55e"
                          strokeWidth="2"
                          fill="none"
                        />
                      </>
                    )}
                    
                    {/* No data state */}
                    {allTokenEvents.length <= 1 && (
                      <text x="150" y="100" textAnchor="middle" className="fill-gray-400 text-sm">
                        No price data available
                      </text>
                    )}
                  </svg>
                </div>
              </div>
            </div>

            {/* Trading Feed - Bottom Half */}
            <div className="bg-gray-950 rounded-lg overflow-hidden">
              {/* Navigation Tabs */}
              <div className="border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        filter === 'all' 
                          ? 'border-white text-white' 
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      All ({tokenStats.totalTrades})
                    </button>
                    <button
                      onClick={() => setFilter('buy')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        filter === 'buy' 
                          ? 'border-green-400 text-green-400' 
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Buys ({tokenStats.buyTrades})
                    </button>
                    <button
                      onClick={() => setFilter('sell')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        filter === 'sell' 
                          ? 'border-red-400 text-red-400' 
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Sells ({tokenStats.sellTrades})
                    </button>
                    <button
                      onClick={() => setFilter('traders')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        filter === 'traders' 
                          ? 'border-purple-400 text-purple-400' 
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Top Traders ({topTraders.length})
                    </button>
                    <button
                      onClick={() => setFilter('holders')}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        filter === 'holders' 
                          ? 'border-orange-400 text-orange-400' 
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Top Holders ({topHolders.length})
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 pr-4">
                    <div className="text-sm text-gray-400">
                      Live Trading Feed
                    </div>
                  </div>
                </div>
              </div>
          {/* Scrollable Table Container */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Table Header */}
              <div className="border-b border-gray-800 bg-gray-900/50">
                {filter === 'traders' ? (
                  <div className="grid grid-cols-5 gap-4 px-6 py-3 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Rank
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Trader
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Trades
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      PnL
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Volume
                    </div>
                  </div>
                ) : filter === 'holders' ? (
                  <div className="min-w-[1800px] grid grid-cols-12 gap-3 px-6 py-3 text-sm font-medium text-gray-400">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Rank
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Holder
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Token Balance
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Value USD
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        % Supply
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Unrealized PnL
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Realized PnL
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Trading Stats
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Bought/Sold
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Activity
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Transfers
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        SOL Balance
                      </div>
                    </div>
                ) : (
                  <div className="grid grid-cols-6 gap-4 px-6 py-3 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Age
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Type
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      MC
                    </div>
                    <div>Amount</div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Total USD
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Trader
                    </div>
                  </div>
                )}
              </div>

              {/* Table Body */}
              <div className="max-h-[600px] overflow-y-auto">
            {filter === 'traders' ? (
              // Top Traders Tab Content
              topTraders.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-gray-400 text-lg mb-2">
                    {tradersConnected ? 'No trader data available' : 'Connecting to traders feed...'}
                  </div>
                  <div className="text-gray-500 text-sm mb-6">
                    {tradersConnected 
                      ? 'Waiting for trading activity...' 
                      : 'Loading top traders data'
                    }
                  </div>
                  <div className="text-gray-600 text-xs">
                    Status: {tradersConnected ? 'Connected' : 'Connecting'} | Traders: {topTraders.length}
                  </div>
                </div>
              ) : (
                topTraders.slice(0, 50).map((trader, index) => (
                  <div 
                    key={trader.wallet_address || `trader-${index}`}
                    className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full text-sm font-medium text-gray-300">
                      {index + 1}
                    </div>

                    {/* Trader */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🧑‍💻</span>
                      <button
                        onClick={() => window.open(`https://solscan.io/account/${trader.wallet_address}`, '_blank')}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                      >
                        {formatAddress(trader.wallet_address)}
                      </button>
                      <button
                        onClick={() => handleCopyItem(trader.wallet_address, `trader-${trader.wallet_address}`)}
                        className={`transition-colors ${
                          copiedItems.has(`trader-${trader.wallet_address}`) 
                            ? 'text-green-400' 
                            : 'text-gray-500 hover:text-green-400'
                        }`}
                        title="Copy wallet address"
                      >
                        {copiedItems.has(`trader-${trader.wallet_address}`) ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Trades */}
                    <div className="text-white text-sm">
                      {(trader.buy_count || 0) + (trader.sell_count || 0)}
                      <div className="text-xs text-gray-500">
                        <span className="text-green-400">{trader.buy_count || 0}B</span> / <span className="text-red-400">{trader.sell_count || 0}S</span>
                      </div>
                    </div>

                    {/* PnL */}
                    <div className={`text-sm font-medium ${
                      (trader.realized_pnl_usd || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(trader.realized_pnl_usd || 0) >= 0 ? '+' : ''}{formatVolume(Math.abs(trader.realized_pnl_usd || 0))}
                      <div className="text-xs text-gray-500">
                        {((trader.realized_pnl_pct || 0) >= 0 ? '+' : '')}{(trader.realized_pnl_pct || 0).toFixed(1)}%
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="text-white text-sm">
                      {formatVolume((trader.bought_usd || 0) + (trader.sold_usd || 0))}
                      <div className="text-xs text-gray-500">
                        B: {formatVolume(trader.bought_usd || 0)} | S: {formatVolume(trader.sold_usd || 0)}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : filter === 'holders' ? (
              // Top Holders Tab Content
              topHolders.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-gray-400 text-lg mb-2">
                    {holdersConnected ? 'No holder data available' : 'Connecting to holders feed...'}
                  </div>
                  <div className="text-gray-500 text-sm mb-6">
                    {holdersConnected 
                      ? 'Waiting for holder activity...' 
                      : 'Loading top holders data'
                    }
                  </div>
                  <div className="text-gray-600 text-xs">
                    Status: {holdersConnected ? 'Connected' : 'Connecting'} | Holders: {topHolders.length}
                  </div>
                </div>
              ) : (
                <div className="min-w-[1800px]">
                  {topHolders.slice(0, 50).map((holder, index) => {
                    const timeAgo = (timestamp: number | undefined) => {
                      if (!timestamp) return 'N/A'
                      const diff = Date.now() - (timestamp * 1000)
                      const minutes = Math.floor(diff / 60000)
                      const hours = Math.floor(minutes / 60)
                      const days = Math.floor(hours / 24)
                      
                      if (days > 0) return `${days}d ago`
                      if (hours > 0) return `${hours}h ago`
                      if (minutes > 0) return `${minutes}m ago`
                      return 'Just now'
                    }
                    
                    return (
                      <div 
                        key={holder.wallet_address || `holder-${index}`}
                        className="grid grid-cols-12 gap-3 px-6 py-4 border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors"
                      >
                        {/* Rank */}
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full text-sm font-medium text-gray-300">
                          {(holder.holder_rank as number) || index + 1}
                        </div>

                        {/* Holder */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm">💰</span>
                          <button
                            onClick={() => window.open(`https://solscan.io/account/${holder.wallet_address}`, '_blank')}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                          >
                            {formatAddress(holder.wallet_address)}
                          </button>
                          <button
                            onClick={() => handleCopyItem(holder.wallet_address, `holder-${holder.wallet_address}`)}
                            className={`transition-colors ${
                              copiedItems.has(`holder-${holder.wallet_address}`) 
                                ? 'text-green-400' 
                                : 'text-gray-500 hover:text-green-400'
                            }`}
                            title="Copy wallet address"
                          >
                            {copiedItems.has(`holder-${holder.wallet_address}`) ? (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Token Balance */}
                        <div className="text-white text-sm">
                          {formatTokenAmount((holder.current_token_balance as number) || 0)}
                          <div className="text-xs text-gray-500">
                            tokens
                          </div>
                        </div>

                        {/* Value USD */}
                        <div className="text-white text-sm">
                          {formatVolume((holder.token_balance_usd as number) || 0)}
                          <div className="text-xs text-gray-500">
                            current value
                          </div>
                        </div>

                        {/* % Supply */}
                        <div className="text-orange-400 text-sm font-medium">
                          {(((holder.percentage_of_supply as number) || 0)).toFixed(2)}%
                          <div className="text-xs text-gray-500">
                            of supply
                          </div>
                        </div>

                        {/* Unrealized PnL */}
                        <div className={`text-sm font-medium ${
                          ((holder.unrealized_pnl_usd as number) || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {holder.unrealized_pnl_usd ? (
                            <>
                              {((holder.unrealized_pnl_usd as number) >= 0) ? '+' : ''}{formatVolume(Math.abs(holder.unrealized_pnl_usd as number))}
                              <div className="text-xs text-gray-500">
                                {holder.unrealized_pnl_pct ? `${((holder.unrealized_pnl_pct as number) >= 0) ? '+' : ''}${(holder.unrealized_pnl_pct as number).toFixed(1)}%` : 'N/A'}
                              </div>
                            </>
                          ) : (
                            <>
                              N/A
                              <div className="text-xs text-gray-500">unrealized</div>
                            </>
                          )}
                        </div>

                        {/* Realized PnL */}
                        <div className={`text-sm font-medium ${
                          ((holder.realized_pnl_usd as number) || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {holder.realized_pnl_usd ? (
                            <>
                              {((holder.realized_pnl_usd as number) >= 0) ? '+' : ''}{formatVolume(Math.abs(holder.realized_pnl_usd as number))}
                              <div className="text-xs text-gray-500">
                                {holder.realized_pnl_pct ? `${((holder.realized_pnl_pct as number) >= 0) ? '+' : ''}${(holder.realized_pnl_pct as number).toFixed(1)}%` : 'N/A'}
                              </div>
                            </>
                          ) : (
                            <>
                              N/A
                              <div className="text-xs text-gray-500">realized</div>
                            </>
                          )}
                        </div>

                        {/* Trading Stats */}
                        <div className="text-white text-sm">
                          {((holder.buy_count as number) || 0) + ((holder.sell_count as number) || 0)} trades
                          <div className="text-xs text-gray-500">
                            <span className="text-green-400">{(holder.buy_count as number) || 0}B</span> / <span className="text-red-400">{(holder.sell_count as number) || 0}S</span>
                          </div>
                        </div>

                        {/* Bought/Sold */}
                        <div className="text-white text-sm">
                          <div className="text-xs text-green-400">
                            Bought: {formatVolume((holder.bought_usd as number) || 0)}
                          </div>
                          <div className="text-xs text-red-400">
                            Sold: {formatVolume((holder.sold_usd as number) || 0)}
                          </div>
                        </div>

                        {/* Activity */}
                        <div className="text-gray-300 text-sm">
                          <div className="text-xs text-gray-500 mb-1">
                            Last: {timeAgo(holder.last_activity_timestamp as number)}
                          </div>
                          <div className="text-xs text-gray-500">
                            First: {timeAgo(holder.first_buy_timestamp as number)}
                          </div>
                        </div>

                        {/* Transfers */}
                        <div className="text-white text-sm">
                          {formatTokenAmount((holder.transferred_amount as number) || 0)}
                          <div className="text-xs text-gray-500">
                            transferred
                          </div>
                        </div>

                        {/* SOL Balance */}
                        <div className="text-purple-400 text-sm">
                          {holder.current_sol_balance ? (holder.current_sol_balance as number).toFixed(4) : '0'} SOL
                          <div className="text-xs text-gray-500">
                            current balance
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            ) : (
              // Trading Events Tab Content
              allTokenEvents.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-gray-400 text-lg mb-2">
                    {isConnected ? 'No trades for this token yet' : 'Not connected'}
                  </div>
                  <div className="text-gray-500 text-sm mb-6">
                    {isConnected 
                      ? 'Waiting for bonding curve trades for this token...' 
                      : 'Connect to start receiving live events'
                    }
                  </div>
                </div>
              ) : filteredTokenEvents.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-gray-400 text-lg mb-2">
                    No {filter} trades for this token
                  </div>
                  <div className="text-gray-500 text-sm">
                    Try changing the filter to see more trades
                  </div>
                </div>
              ) : (
                filteredTokenEvents.map((event, index) => {
                  const age = Math.floor((Date.now() - parseInt(event.timestamp) * 1000) / 1000 / 60) // minutes ago
                  const isBuy = event.tradeType === 1
                  const marketCap = parseFloat(event.priceUsd || '0') * (event.currentSupply || 1000000000) // Approximate MC
                  const totalUSD = parseFloat(event.priceUsd || '0') * event.tokenAmount
                  
                  return (
                    <div 
                      key={`${event.transactionId}-${event.baseMint}-${event.timestamp}`}
                      className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors"
                    >
                      {/* Age */}
                      <div className="text-gray-400 text-sm">
                        {age}m
                      </div>

                      {/* Type */}
                      <div className={`text-sm font-medium ${
                        isBuy ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isBuy ? 'Buy' : 'Sell'}
                      </div>

                      {/* Market Cap */}
                      <div className={`text-sm font-medium ${
                        isBuy ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${formatMarketCap(marketCap)}
                      </div>

                      {/* Amount */}
                      <div className="text-white text-sm">
                        {formatTokenAmount(event.tokenAmount)}
                      </div>

                      {/* Total USD */}
                      <div className={`text-sm font-medium ${
                        isBuy ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${totalUSD < 1 ? totalUSD.toFixed(3) : totalUSD.toFixed(0)}
                      </div>

                      {/* Trader */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {/* Trader emoji/icon */}
                          <span className="text-sm">🧑‍💻</span>
                          <button
                            onClick={() => window.open(`https://solscan.io/account/${event.walletAddress}`, '_blank')}
                            className="text-sm text-gray-300 hover:text-blue-400 transition-colors"
                          >
                            {event.walletAddress.slice(0, 4)}...{event.walletAddress.slice(-4)}
                          </button>
                          {/* Copy/Link icons */}
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleCopyItem(event.walletAddress, `wallet-${event.walletAddress}-${event.timestamp}`)}
                              className={`transition-colors ${
                                copiedItems.has(`wallet-${event.walletAddress}-${event.timestamp}`) 
                                  ? 'text-green-400' 
                                  : 'text-gray-500 hover:text-gray-300'
                              }`}
                              title="Copy wallet address"
                            >
                              {copiedItems.has(`wallet-${event.walletAddress}-${event.timestamp}`) ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                            <span className="text-gray-600 text-xs">1</span>
                            <button
                              onClick={() => window.open(`https://solscan.io/tx/${event.transactionId}`, '_blank')}
                              className="text-gray-500 hover:text-gray-300 transition-colors"
                              title="View transaction"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )
            )}
          </div>
            </div>
          </div>

          {/* Table Footer with Live Indicator */}
          {((filter === 'traders' && topTraders.length > 0) || (filter === 'holders' && topHolders.length > 0) || (filter !== 'traders' && filter !== 'holders' && filteredTokenEvents.length > 0)) && (
            <div className="border-t border-gray-800 bg-gray-900/50 px-6 py-3">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                  {filter === 'traders' ? (
                    `Showing ${Math.min(topTraders.length, 50)} of ${topTraders.length} top trader${topTraders.length !== 1 ? 's' : ''}`
                  ) : filter === 'holders' ? (
                    `Showing ${Math.min(topHolders.length, 50)} of ${topHolders.length} top holder${topHolders.length !== 1 ? 's' : ''}`
                  ) : (
                    `Showing ${filteredTokenEvents.length} of last 50 trade${filteredTokenEvents.length !== 1 ? 's' : ''}`
                  )}
                </span>
                <div className="flex items-center gap-4">
                  {filter === 'traders' ? (
                    <span className="text-xs">Total traders found: {topTraders.length}</span>
                  ) : filter === 'holders' ? (
                    <span className="text-xs">Total holders found: {topHolders.length}</span>
                  ) : (
                    <span className="text-xs">Total global events: {events.length}</span>
                  )}
                  {filter === 'traders' ? (
                    tradersConnected ? (
                      <div className="flex items-center gap-2 bg-green-500/20 px-2 py-1 rounded">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-yellow-500/20 px-2 py-1 rounded">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-xs text-yellow-400 font-medium">⏸ Connecting</span>
                      </div>
                    )
                  ) : filter === 'holders' ? (
                    holdersConnected ? (
                      <div className="flex items-center gap-2 bg-green-500/20 px-2 py-1 rounded">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-yellow-500/20 px-2 py-1 rounded">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-xs text-yellow-400 font-medium">⏸ Connecting</span>
                      </div>
                    )
                  ) : (
                    isConnected ? (
                      <div className="flex items-center gap-2 bg-green-500/20 px-2 py-1 rounded">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-yellow-500/20 px-2 py-1 rounded">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-xs text-yellow-400 font-medium">⏸ Paused</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
            </div>
          </div>

          {/* Right Side - Token Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-950 rounded-lg p-6 sticky top-6">
              <div className="space-y-4">
                {/* Token Header */}
                <div className="flex items-center gap-3">
                  {/* Token Image Placeholder */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {(liveTokenInfo?.image || tokenData?.image) ? (
                      <img 
                        src={liveTokenInfo?.image || tokenData?.image} 
                        alt={liveTokenInfo?.symbol || tokenData?.symbol} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `<span class="text-xl font-bold">${(liveTokenInfo?.symbol || tokenData?.symbol || latestTokenInfo?.baseMintSymbol || mintAddress).charAt(0).toUpperCase()}</span>`
                          }
                        }}
                      />
                    ) : (
                      <span className="text-xl font-bold">
                        {liveTokenInfo ? liveTokenInfo.symbol.charAt(0).toUpperCase() : 
                         tokenData ? tokenData.symbol.charAt(0).toUpperCase() : 
                         latestTokenInfo ? latestTokenInfo.baseMintSymbol.charAt(0) : 
                         mintAddress.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {liveTokenInfo ? liveTokenInfo.symbol : 
                       tokenData ? tokenData.symbol : 
                       latestTokenInfo ? latestTokenInfo.baseMintSymbol : 
                       'Unknown Token'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {liveTokenInfo ? liveTokenInfo.name : 
                       tokenData ? tokenData.name : 
                       latestTokenInfo ? latestTokenInfo.baseMintName : 
                       'Token Details'}
                    </p>
                  </div>
                </div>
                
                {/* Mint Address */}
                <div className="border-t border-gray-800 pt-4">
                  <div className="text-gray-400 text-sm mb-2">Mint Address</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`https://solscan.io/token/${mintAddress}`, '_blank')}
                      className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      {formatAddress(mintAddress)}
                    </button>
                    <button
                      onClick={() => handleCopyItem(mintAddress, `mint-sidebar-${mintAddress}`)}
                      className={`transition-colors ${
                        copiedItems.has(`mint-sidebar-${mintAddress}`) 
                          ? 'text-green-400' 
                          : 'text-gray-500 hover:text-green-400'
                      }`}
                      title="Copy mint address"
                    >
                      {copiedItems.has(`mint-sidebar-${mintAddress}`) ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {(liveTokenInfo || tokenData || latestTokenInfo) ? (
                  <>
                    {/* Price */}
                    <div className="border-t border-gray-800 pt-4">
                      <div className="text-gray-400 text-sm mb-1">Current Price</div>
                      <div className="text-white text-xl font-bold">
                        ${liveTokenInfo ? liveTokenInfo.price.toFixed(6) : 
                          tokenData ? tokenData.price.toFixed(6) : 
                          parseFloat(latestTokenInfo?.priceUsd || '0').toFixed(6)}
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Market Cap</span>
                        <span className="text-white font-medium text-sm">
                          ${liveTokenInfo ? formatMarketCap(liveTokenInfo.marketCap) : 
                            tokenData ? formatMarketCap(tokenData.marketCap) : 
                            formatMarketCap(parseFloat(latestTokenInfo?.priceUsd || '0') * (latestTokenInfo?.currentSupply || 1000000000))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Volume 24h</span>
                        <span className="text-white font-medium text-sm">
                          ${liveTokenInfo ? formatVolume(liveTokenInfo.volume24h) : 
                            tokenData ? formatVolume(tokenData.volume24h) : 
                            formatVolume(tokenStats.totalVolume)}
                        </span>
                      </div>
                      
                      {/* Show rich metrics from trending pairs if available */}
                      {(liveTokenInfo?.metrics || tokenData?.metrics) ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Holders</span>
                            <span className="text-white font-medium text-sm">
                              {(liveTokenInfo?.metrics?.holders || tokenData?.metrics?.holders || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Dev Holdings</span>
                            <span className="text-white font-medium text-sm">
                              {((liveTokenInfo?.metrics?.devHoldingPct || tokenData?.metrics?.devHoldingPct || 0).toFixed(0))}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Bonding Curve</span>
                            <span className="text-white font-medium text-sm">
                              {((liveTokenInfo?.metrics?.bondingCurvePct || tokenData?.metrics?.bondingCurvePct || 0).toFixed(1))}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Sniper %</span>
                            <span className="text-white font-medium text-sm">
                              {((liveTokenInfo?.metrics?.sniperWalletsPct || tokenData?.metrics?.sniperWalletsPct || 0).toFixed(0))}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Total Trades</span>
                            <span className="text-white font-medium text-sm">
                              {tokenStats.totalTrades}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Buys / Sells</span>
                            <span className="text-white font-medium text-sm">
                              <span className="text-green-400">{tokenStats.buyTrades}</span> / <span className="text-red-400">{tokenStats.sellTrades}</span>
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Platform Badge */}
                    <div className="border-t border-gray-800 pt-4">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                        {latestTokenInfo ? latestTokenInfo.platform.toUpperCase() : 'PUMP.FUN'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* No Data State */}
                    <div className="border-t border-gray-800 pt-4">
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-sm mb-2">No trading data available</div>
                        <div className="text-gray-500 text-xs">
                          {isConnected 
                            ? 'Waiting for first trade to load token information...' 
                            : 'Connect to start receiving live events'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Basic Stats - Even without trades */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Status</span>
                        <span className="text-white font-medium text-sm">
                          {isConnected ? 'Monitoring' : 'Offline'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Total Events</span>
                        <span className="text-white font-medium text-sm">
                          {events.length}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenDetailPage
