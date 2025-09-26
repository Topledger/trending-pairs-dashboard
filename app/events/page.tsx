'use client'

import React, { useState } from 'react'
import { useKafkaConsumer } from '../hooks/useKafkaConsumer'
import TradeEventCard from '../components/TradeEventCard'

const EventsPage: React.FC = () => {
  const { events, isConnected, error, stats, connect, disconnect, clearEvents } = useKafkaConsumer()
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'pump-fun' | 'raydium-amm-v4' | 'meteora-dbc' | 'meteora-damm-v2'>('all')
  const [mintFilter, setMintFilter] = useState<string>('')
  const [copiedMints, setCopiedMints] = useState<Set<string>>(new Set())
  const [copiedWallets, setCopiedWallets] = useState<Set<string>>(new Set())

  const filteredEvents = events.filter(event => {
    const typeMatch = filter === 'all' || 
      (filter === 'buy' && event.tradeType === 1) ||
      (filter === 'sell' && event.tradeType === 2)
    
    const platformMatch = platformFilter === 'all' || event.platform === platformFilter
    
    const mintMatch = !mintFilter || event.baseMint.toLowerCase().includes(mintFilter.toLowerCase())
    
    return typeMatch && platformMatch && mintMatch
  })

  const handleCopyMint = async (mintAddress: string) => {
    try {
      // Try modern clipboard API first (requires HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(mintAddress)
      } else {
        // Fallback for HTTP environments
        const textArea = document.createElement('textarea')
        textArea.value = mintAddress
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      setCopiedMints(prev => new Set(prev).add(mintAddress))
      console.log('Copied mint address:', mintAddress)
      
      // Remove the mint from copied set after 1 second
      setTimeout(() => {
        setCopiedMints(prev => {
          const newSet = new Set(prev)
          newSet.delete(mintAddress)
          return newSet
        })
      }, 1000)
    } catch (err) {
      console.error('Failed to copy mint address:', err)
    }
  }

  const handleCopyWallet = async (walletAddress: string, walletId: string) => {
    try {
      // Try modern clipboard API first (requires HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(walletAddress)
      } else {
        // Fallback for HTTP environments
        const textArea = document.createElement('textarea')
        textArea.value = walletAddress
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      setCopiedWallets(prev => new Set(prev).add(walletId))
      console.log('Copied wallet address:', walletAddress)
      
      // Remove the wallet from copied set after 1 second
      setTimeout(() => {
        setCopiedWallets(prev => {
          const newSet = new Set(prev)
          newSet.delete(walletId)
          return newSet
        })
      }, 1000)
    } catch (err) {
      console.error('Failed to copy wallet address:', err)
    }
  }

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
            <h1 className="text-md font-medium">Bonding Curve Events</h1>
            <p className="text-gray-500 text-xs">Real-time trade events from Kafka</p>
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

        {/* Centered Filters */}
        <div className="mb-8">
          {/* Big Mint Search Bar */}
          <div className="flex justify-center mb-4">
            <div className="w-full max-w-2xl">
              <div className="relative">
                <input
                  id="mintFilter"
                  type="text"
                  value={mintFilter}
                  onChange={(e) => setMintFilter(e.target.value)}
                  placeholder="Paste mint address to filter events..."
                  className="w-full px-6 py-2 bg-gray-950 border border-gray-800 rounded-xs text-gray-400 placeholder-gray-600 focus:outline-none focus:border-gray-600 text-md"
                />
                {mintFilter && (
                  <button
                    onClick={() => setMintFilter('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    title="Clear filter"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
            </div>
          </div>

          {/* Compact Platform Filters */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              
              <button
                onClick={() => setPlatformFilter('all')}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  platformFilter === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPlatformFilter('pump-fun')}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  platformFilter === 'pump-fun' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Pump
              </button>
              <button
                onClick={() => setPlatformFilter('raydium-amm-v4')}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  platformFilter === 'raydium-amm-v4' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Raydium
              </button>
              <button
                onClick={() => setPlatformFilter('meteora-dbc')}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  platformFilter === 'meteora-dbc' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Meteora DBC
              </button>
              <button
                onClick={() => setPlatformFilter('meteora-damm-v2')}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  platformFilter === 'meteora-damm-v2' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Meteora DAMM
              </button>
              <div className="w-px h-4 bg-gray-600 mx-2"></div>
              <button
                onClick={clearEvents}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
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
                  All
                </button>
                <button
                  onClick={() => setFilter('buy')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    filter === 'buy' 
                      ? 'border-green-400 text-green-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Buys
                </button>
                <button
                  onClick={() => setFilter('sell')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    filter === 'sell' 
                      ? 'border-red-400 text-red-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Sells
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
                        onClick={() => handleCopyMint(event.baseMint)}
                        className={`transition-colors ${
                          copiedMints.has(event.baseMint) 
                            ? 'text-green-400' 
                            : 'text-gray-500 hover:text-green-400'
                        }`}
                        title="Copy mint address"
                      >
                        {copiedMints.has(event.baseMint) ? (
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
                            onClick={() => handleCopyWallet(event.walletAddress, `wallet-${event.walletAddress}-${event.timestamp}`)}
                            className={`transition-colors ${
                              copiedWallets.has(`wallet-${event.walletAddress}-${event.timestamp}`) 
                                ? 'text-green-400' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                            title="Copy wallet address"
                          >
                            {copiedWallets.has(`wallet-${event.walletAddress}-${event.timestamp}`) ? (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
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
                  Live Trading Feed
                </span>
                <div className="flex items-center gap-4">
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
