'use client'

import React, { useState } from 'react'
import { useKafkaConsumer } from '../hooks/useKafkaConsumer'
import TradeEventCard from '../components/TradeEventCard'

const EventsPage: React.FC = () => {
  const { events, isConnected, error, stats, clearEvents } = useKafkaConsumer()
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'pump-fun' | 'raydium-amm-v4' | 'meteora-dbc' | 'meteora-damm-v2'>('all')

  const filteredEvents = events.filter(event => {
    const typeMatch = filter === 'all' || 
      (filter === 'buy' && event.tradeType === 1) ||
      (filter === 'sell' && event.tradeType === 2)
    
    const platformMatch = platformFilter === 'all' || event.platform === platformFilter
    
    return typeMatch && platformMatch
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

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
            {/* Trade Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('buy')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Buy ({stats.buyEvents})
              </button>
              <button
                onClick={() => setFilter('sell')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Sell ({stats.sellEvents})
              </button>
            </div>

            {/* Platform Filter */}
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
            <div className="text-red-300 text-xs mt-2">Attempting to reconnect automatically...</div>
          </div>
        )}

        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-lg mb-2">
                {isConnected ? 'No events yet' : 'Not connected'}
              </div>
              <div className="text-gray-500 text-sm">
                {isConnected 
                  ? 'Waiting for bonding curve trade events...' 
                  : 'Click connect to start receiving events'
                }
              </div>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <TradeEventCard 
                key={`${event.transactionId}-${index}`} 
                event={event} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default EventsPage
