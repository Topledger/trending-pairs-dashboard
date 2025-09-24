'use client'

import React, { useState, useMemo } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import TrendingPairCard from './TrendingPairCard'
import StatusFilter from './StatusFilter'

const TrendingPairsDashboardTest: React.FC = () => {
  const [useMockData, setUseMockData] = useState(true)
  const { data, isConnected, error, reconnect } = useWebSocket('ws://34.107.31.9/ws/trending-pairs')
  const [selectedFilter, setSelectedFilter] = useState<'New' | 'Migrating' | 'Migrated'>('New')

  // Filter and sort the data
  const filteredData = useMemo(() => {
    let filtered = data
    
    filtered = data.filter(pair => pair.status === selectedFilter)
    
    // Sort by market cap descending by default
    return filtered.sort((a, b) => b.marketCap - a.marketCap)
  }, [data, selectedFilter])

  // Calculate counts for each status
  const statusCounts = useMemo(() => {
    const counts = {
      all: data.length,
      new: 0,
      migrating: 0,
      migrated: 0
    }
    
    data.forEach(pair => {
      switch (pair.status) {
        case 'New':
          counts.new++
          break
        case 'Migrating':
          counts.migrating++
          break
        case 'Migrated':
          counts.migrated++
          break
      }
    })
    
    return counts
  }, [data])

  const getConnectionStatus = () => {
    if (useMockData) {
      return (
        <div className="flex items-center gap-2 text-blue-400">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Demo Mode</span>
        </div>
      )
    }
    
    if (isConnected) {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Live</span>
        </div>
      )
    } else if (error) {
      return (
        <div className="flex items-center gap-2 text-red-400">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span className="text-sm">Error: {error}</span>
          <button 
            onClick={reconnect}
            className="text-xs px-2 py-1 bg-red-500/20 border border-red-500 rounded hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-2 text-yellow-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Connecting...</span>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🔥 Trending Pairs
            </h1>
            <p className="text-gray-400">
              Real-time cryptocurrency trending pairs dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseMockData(!useMockData)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  useMockData 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500' 
                    : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                }`}
              >
                {useMockData ? 'Demo Mode' : 'Live Mode'}
              </button>
            </div>
            {getConnectionStatus()}
            <div className="text-gray-400 text-sm">
              {data.length} pairs total
            </div>
          </div>
        </div>

        {/* Info Banner */}
        {useMockData && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <span>ℹ️</span>
              <span>
                Currently showing demo data with simulated updates. 
                Toggle to &ldquo;Live Mode&rdquo; to connect to your WebSocket at ws://34.107.31.9/ws/trending-pairs
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <StatusFilter
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          counts={statusCounts}
        />

        {/* Content */}
        {!isConnected && !error && !useMockData && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Connecting to WebSocket...</p>
            </div>
          </div>
        )}

        {error && !useMockData && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-4">⚠️</div>
              <p className="text-gray-400 mb-4">Failed to connect to WebSocket</p>
              <p className="text-gray-500 text-sm mb-4">ws://34.107.31.9/ws/trending-pairs</p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={reconnect}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => setUseMockData(true)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Use Demo Data
                </button>
              </div>
            </div>
          </div>
        )}

        {((isConnected && !error) || useMockData) && filteredData.length === 0 && data.length > 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-gray-400 text-xl mb-4">🔍</div>
              <p className="text-gray-400">No pairs found for &ldquo;{selectedFilter}&rdquo; status</p>
              <button 
                onClick={() => setSelectedFilter('New')}
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Show All
              </button>
            </div>
          </div>
        )}

        {((isConnected && !error) || useMockData) && data.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-gray-400 text-xl mb-4">📊</div>
              <p className="text-gray-400">Waiting for trending pairs data...</p>
            </div>
          </div>
        )}

        {/* Trending Pairs Grid */}
        {filteredData.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredData.map((pair, index) => (
                <TrendingPairCard
                  key={`${pair.symbol}-${index}`}
                  pair={pair}
                  rank={index + 1}
                />
              ))}
            </div>

            {/* Footer info */}
            <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
              <p>
                Showing {filteredData.length} of {data.length} trending pairs
                {` (${selectedFilter} only)`}
              </p>
              <p className="mt-2">
                Last updated: {new Date().toLocaleTimeString()}
                {useMockData && ' (Demo data with simulated updates)'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TrendingPairsDashboardTest
