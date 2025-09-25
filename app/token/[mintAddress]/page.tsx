'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useKafkaConsumer } from '../../hooks/useKafkaConsumer'

const TokenDetailPage: React.FC = () => {
  const params = useParams()
  const router = useRouter()
  const mintAddress = params.mintAddress as string
  
  const { events, isConnected, error, stats, connect, disconnect } = useKafkaConsumer()
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')
  

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
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Trending
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {latestTokenInfo ? (
                  <>
                    <span className="text-blue-400">{latestTokenInfo.baseMintSymbol}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-white">{latestTokenInfo.baseMintName}</span>
                  </>
                ) : (
                  <span>Token Details</span>
                )}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                <span className="flex items-center gap-2">
                  <span>Mint:</span>
                  <code className="bg-gray-800 px-2 py-1 rounded text-xs">{formatAddress(mintAddress)}</code>
                </span>
                <button
                  onClick={() => window.open(`https://solscan.io/token/${mintAddress}`, '_blank')}
                  className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                >
                  <span>View on Solscan</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(mintAddress)}
                  className="flex items-center gap-1 hover:text-green-400 transition-colors"
                  title="Copy mint address"
                >
                  <span>Copy Address</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
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

       

        {/* Navigation Tabs */}
        <div className="border-b border-gray-800 mb-6">
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
            </div>
            
            <div className="flex items-center gap-4">
              {latestTokenInfo && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">Platform:</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                    {latestTokenInfo.platform.toUpperCase()}
                  </span>
                  <span className="text-gray-400">Current Price:</span>
                  <span className="text-white font-medium">
                    ${parseFloat(latestTokenInfo.priceUsd || '0').toFixed(6)}
                  </span>
                </div>
              )}
              
             
            </div>
          </div>
        </div>


        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <div className="text-red-400 font-medium">Connection Error</div>
            <div className="text-red-300 text-sm">{error}</div>
          </div>
        )}

        {/* Trading Feed Table */}
        <div className="bg-gray-950 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-gray-800 bg-gray-900/50">
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
          </div>

          {/* Table Body */}
          <div className="max-h-[600px] overflow-y-auto">
            {allTokenEvents.length === 0 ? (
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
                            onClick={() => navigator.clipboard.writeText(event.walletAddress)}
                            className="text-gray-500 hover:text-gray-300 transition-colors"
                            title="Copy wallet address"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
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
            )}
          </div>

          {/* Table Footer with Live Indicator */}
          {filteredTokenEvents.length > 0 && (
            <div className="border-t border-gray-800 bg-gray-900/50 px-6 py-3">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                  Showing {filteredTokenEvents.length} of last 50 trade{filteredTokenEvents.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-xs">Total global events: {events.length}</span>
                  {isConnected ? (
                    <div className="flex items-center gap-2 bg-green-500/20 px-2 py-1 rounded">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-yellow-500/20 px-2 py-1 rounded">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-xs text-yellow-400 font-medium">⏸ Paused</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TokenDetailPage
