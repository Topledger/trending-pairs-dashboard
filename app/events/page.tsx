'use client'

import React, { useState } from 'react'
import { useKafkaConsumer } from '../hooks/useKafkaConsumer'
import TradeEventCard from '../components/TradeEventCard'

const EventsPage: React.FC = () => {
  const { events, isConnected, error, stats, connect, disconnect, clearEvents } = useKafkaConsumer()
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'pump-fun' | 'raydium-amm-v4' | 'meteora-dbc' | 'meteora-damm-v2'>('all')
  const [mintFilter, setMintFilter] = useState<string>('')

  const filteredEvents = events.filter(event => {
    const typeMatch = filter === 'all' || 
      (filter === 'buy' && event.tradeType === 1) ||
      (filter === 'sell' && event.tradeType === 2)
    
    const platformMatch = platformFilter === 'all' || event.platform === platformFilter
    
    const mintMatch = !mintFilter || event.baseMint.toLowerCase().includes(mintFilter.toLowerCase())
    
    return typeMatch && platformMatch && mintMatch
  })

  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400 font-medium">Connected</span>
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
          <div>
            <h1 className="text-2xl font-bold">Bonding Curve Events</h1>
            <p className="text-gray-400 text-sm">Real-time trade events from Kafka</p>
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

        {/* Mint Address Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <label htmlFor="mintFilter" className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Mint Address
              </label>
              <div className="relative">
                <input
                  id="mintFilter"
                  type="text"
                  value={mintFilter}
                  onChange={(e) => setMintFilter(e.target.value)}
                  placeholder="Paste mint address to filter events..."
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {mintFilter && (
                  <button
                    onClick={() => setMintFilter('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    title="Clear filter"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {mintFilter && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filtering: {mintFilter.slice(0, 8)}...{mintFilter.slice(-6)}</span>
                <span className="bg-blue-500/30 px-2 py-1 rounded text-xs">
                  {filteredEvents.length} events
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="text-xs text-gray-400">Total Events</div>
            <div className="text-xl font-bold text-white">{stats.totalEvents.toLocaleString()}</div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="text-xs text-gray-400">Buy Events</div>
            <div className="text-xl font-bold text-green-400">{stats.buyEvents.toLocaleString()}</div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="text-xs text-gray-400">Sell Events</div>
            <div className="text-xl font-bold text-red-400">{stats.sellEvents.toLocaleString()}</div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="text-xs text-gray-400">Total Volume</div>
            <div className="text-xl font-bold text-blue-400">
              ${stats.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="text-xs text-gray-400">Avg Processing</div>
            <div className="text-xl font-bold text-yellow-400">
              {(stats.avgProcessingTime / 1000).toFixed(1)}ms
            </div>
          </div>
        </div>

        {/* Platform Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                platformFilter === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Platforms
            </button>
            <button
              onClick={() => setPlatformFilter('pump-fun')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                platformFilter === 'pump-fun' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Pump Fun
            </button>
            <button
              onClick={() => setPlatformFilter('raydium-amm-v4')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                platformFilter === 'raydium-amm-v4' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Raydium AMM
            </button>
            <button
              onClick={() => setPlatformFilter('meteora-dbc')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                platformFilter === 'meteora-dbc' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Meteora DBC
            </button>
            <button
              onClick={() => setPlatformFilter('meteora-damm-v2')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                platformFilter === 'meteora-damm-v2' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Meteora DAMM
            </button>
          </div>

          <button
            onClick={clearEvents}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors"
          >
            Clear Events
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <div className="text-red-400 font-medium">Connection Error</div>
            <div className="text-red-300 text-sm">{error}</div>
            <button
              onClick={connect}
              className="mt-2 px-3 py-1 bg-red-500/20 border border-red-500 rounded text-red-400 hover:bg-red-500/30 transition-colors text-sm"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Events Table */}
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
                  All ({stats.totalEvents})
                </button>
                <button
                  onClick={() => setFilter('buy')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    filter === 'buy' 
                      ? 'border-green-400 text-green-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Buys ({stats.buyEvents})
                </button>
                <button
                  onClick={() => setFilter('sell')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    filter === 'sell' 
                      ? 'border-red-400 text-red-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Sells ({stats.sellEvents})
                </button>
              </div>
              
              <div className="flex items-center gap-4 pr-4">
                <div className="text-sm text-gray-400">
                  Live Trading Feed
                </div>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="border-b border-gray-800 bg-gray-900/50">
            <div className="grid grid-cols-7 gap-4 px-6 py-3 text-sm font-medium text-gray-400">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Token
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Price
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
            {filteredEvents.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-400 text-lg mb-2">
                  {isConnected ? 'No events yet' : 'Not connected'}
                </div>
                <div className="text-gray-500 text-sm mb-6">
                  {isConnected 
                    ? 'Waiting for bonding curve trade events...' 
                    : 'Click connect to start receiving events'
                  }
                </div>
              </div>
            ) : (
              filteredEvents.map((event, index) => {
                const age = Math.floor((Date.now() - parseInt(event.timestamp) * 1000) / 1000 / 60) // minutes ago
                const isBuy = event.tradeType === 1
                const totalUSD = parseFloat(event.priceUsd || '0') * event.tokenAmount
                
                const formatAddress = (address: string) => {
                  return `${address.slice(0, 6)}...${address.slice(-6)}`
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
                
                return (
                  <div 
                    key={`${event.transactionId}-${event.baseMint}-${event.timestamp}`}
                    className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors"
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

                    {/* Token */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`/token/${event.baseMint}`, '_blank')}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                      >
                        {event.baseMintSymbol || 'Unknown'}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(event.baseMint)}
                        className="text-gray-500 hover:text-green-400 transition-colors"
                        title="Copy mint address"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>

                    {/* Price */}
                    <div className={`text-sm font-medium ${
                      isBuy ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${parseFloat(event.priceUsd || '0').toFixed(6)}
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
          {filteredEvents.length > 0 && (
            <div className="border-t border-gray-800 bg-gray-900/50 px-6 py-3">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                  Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-xs">Total volume: ${stats.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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

export default EventsPage
