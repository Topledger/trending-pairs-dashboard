'use client'

import React from 'react'
import { TopTrader } from '../hooks/useTopTradersWebSocket'

interface TopTradersProps {
  traders: TopTrader[]
  isConnected: boolean
  error: string | null
  onReconnect: () => void
}

const TopTraders: React.FC<TopTradersProps> = ({ traders, isConnected, error, onReconnect }) => {
  const formatAddress = (address: string) => {
    if (!address) return 'Unknown'
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


  return (
    <div className="bg-gray-950 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">Top Traders</h3>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 bg-green-500/20 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-red-500/20 px-2 py-1 rounded">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-xs text-red-400 font-medium">Error</span>
              </div>
              <button
                onClick={onReconnect}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors"
                title="Retry connection"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/20 px-2 py-1 rounded">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-yellow-400 font-medium">Connecting</span>
            </div>
          )}
        </div>
      </div>

      {traders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm mb-2">
            {isConnected ? 'No trader data available' : 'Connecting to traders feed...'}
          </div>
          <div className="text-gray-500 text-xs">
            {isConnected 
              ? 'Waiting for trading activity...' 
              : 'Loading top traders data'
            }
          </div>
          <div className="text-gray-600 text-xs mt-2">
            Debug: {traders.length} traders | Connected: {isConnected ? 'Yes' : 'No'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 mb-2">
            Showing {Math.min(traders.length, 10)} of {traders.length} traders
          </div>
          {traders.slice(0, 10).map((trader, index) => {
            return (
              <div 
                key={trader.wallet_address || `trader-${index}`}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-gray-700 rounded-full text-xs font-medium text-gray-300">
                    {index + 1}
                  </div>
                  <div>
                    <button
                      onClick={() => window.open(`https://solscan.io/account/${trader.wallet_address}`, '_blank')}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      {formatAddress(trader.wallet_address)}
                    </button>
                    <div className="text-xs text-gray-500">
                      {(trader.buy_count || 0) + (trader.sell_count || 0)} trades
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    (trader.realized_pnl_usd || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(trader.realized_pnl_usd || 0) >= 0 ? '+' : ''}{formatVolume(Math.abs(trader.realized_pnl_usd || 0))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatVolume((trader.bought_usd || 0) + (trader.sold_usd || 0))} vol
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TopTraders
