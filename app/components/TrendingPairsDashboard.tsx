'use client'

import React, { useState, useMemo } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import TrendingPairCard from './TrendingPairCard'

const TrendingPairsDashboard: React.FC = () => {
  const [selectedDex, setSelectedDex] = useState<'pump-fun' | 'meteora-dbc'>('pump-fun')
  const { data, isConnected, error, reconnect } = useWebSocket('ws://34.107.31.9/ws/trending-pairs', selectedDex)
  const [selectedFilter, setSelectedFilter] = useState<'New' | 'Migrating' | 'Migrated'>('New')

  // Filter and sort the data - 25 tokens per status
  const filteredData = useMemo(() => {
    // Filter by selected status and limit to 25 for that specific status
    const filtered = data
      .filter(pair => pair.status === selectedFilter)
      .sort((a, b) => b.creationTimestamp - a.creationTimestamp)
      .slice(0, 25)
    
    return filtered
  }, [data, selectedFilter])

  // Calculate counts for each status (up to 25 each)
  const statusCounts = useMemo(() => {
    const newPairs = data.filter(pair => pair.status === 'New').slice(0, 25)
    const migratingPairs = data.filter(pair => pair.status === 'Migrating').slice(0, 25)
    const migratedPairs = data.filter(pair => pair.status === 'Migrated').slice(0, 25)
    
    return {
      new: newPairs.length,
      migrating: migratingPairs.length,
      migrated: migratedPairs.length
    }
  }, [data])

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
            <div className="flex items-center justify-between mb-6 w-full">
              <div className="flex items-center gap-4 w-full justify-between mx-1">
                <h1 className="text-lg font-medium text-gray-400">Trending Pairs</h1>
                <a 
                  href="/events" 
                  className=" text-gray-400 text-sm hover:text-gray-300 transition-colors"
                >
                  Live Trading Feed
                </a>
              </div>
            </div>

        {/* Status Tabs */}
        <div className="bg-gray-950 rounded-lg overflow-hidden mb-6">
          <div className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex">
                <button
                  onClick={() => setSelectedFilter('New')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedFilter === 'New' 
                      ? 'border-green-400 text-green-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  New ({statusCounts.new})
                </button>
                <button
                  onClick={() => setSelectedFilter('Migrating')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedFilter === 'Migrating' 
                      ? 'border-yellow-400 text-yellow-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Migrating ({statusCounts.migrating})
                </button>
                <button
                  onClick={() => setSelectedFilter('Migrated')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedFilter === 'Migrated' 
                      ? 'border-blue-400 text-blue-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Migrated ({statusCounts.migrated})
                </button>
              </div>
              
              <div className="flex items-center gap-4 pr-2">
                <select
                  value={selectedDex}
                  onChange={(e) => setSelectedDex(e.target.value as 'pump-fun' | 'meteora-dbc')}
                  className=" border border-gray-800 rounded px-3 py-1 text-sm text-gray-400 outline-none"
                >
                  <option value="pump-fun">Pump Fun</option>
                  <option value="meteora-dbc">Meteora DBC</option>
                </select>
                
               
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {!isConnected && !error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Connecting to {selectedDex}...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-red-400 text-xl mb-4">⚠️</div>
              <p className="text-gray-400 mb-4">Failed to connect to WebSocket</p>
              <button 
                onClick={reconnect}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty Filter State */}
        {isConnected && filteredData.length === 0 && data.length > 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              
              <p className="text-gray-400">No pairs found for &ldquo;{selectedFilter}&rdquo; status</p>
             
            </div>
          </div>
        )}

        {/* Waiting for Data */}
        {isConnected && data.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              
              <p className="text-gray-400">Waiting for trending pairs from {selectedDex}...</p>
            </div>
          </div>
        )}

        {/* Trending Pairs Grid */}
        {filteredData.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {filteredData.map((pair, index) => (
              <TrendingPairCard
                key={pair.mintAddress}
                pair={pair}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendingPairsDashboard