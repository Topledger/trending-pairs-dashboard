'use client'

import React from 'react'
import { TrendingPair } from '../hooks/useWebSocket'

interface TrendingPairCardProps {
  pair: TrendingPair
  rank?: number
}

const TrendingPairCard: React.FC<TrendingPairCardProps> = ({ pair }) => {
  const renderPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`
    } else {
      // For very small numbers, format with subscript zeros
      const priceStr = price.toString()
      if (priceStr.includes('e-')) {
        // Handle scientific notation
        const [base, exp] = priceStr.split('e-')
        const zeros = parseInt(exp) - 1
        const digits = base.replace('.', '')
        const firstDigit = digits.charAt(0)
        return (
          <span>
            $0.0<sub className="text-xs">{zeros}</sub>{firstDigit}
          </span>
        )
      } else {
        // Handle decimal format like 0.00005
        const match = priceStr.match(/^0\.0*([1-9].*)$/)
        if (match) {
          const zerosCount = priceStr.indexOf(match[1]) - 2 // -2 for "0."
          const firstDigit = match[1].charAt(0)
          return (
            <span>
              $0.0<sub className="text-xs">{zerosCount}</sub>{firstDigit}
            </span>
          )
        }
      }
      return `$${price.toFixed(8)}`
    }
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`
    } else if (marketCap >= 1000) {
      return `$${(marketCap / 1000).toFixed(1)}K`
    } else {
      return `$${marketCap.toFixed(0)}`
    }
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

  const formatTransactions = (tx: number) => {
    if (tx >= 1000) return `${(tx / 1000).toFixed(1)}K`
    return tx.toString()
  }

  // Use real data from WebSocket with validation
  const holdersCount = pair.metrics?.holders || 0
  let sniperPercentage = pair.metrics?.sniperWalletsPct || 0
  let top10HoldersPercentage = pair.metrics?.top10HoldersPct || 0
  let devHoldingPercentage = pair.metrics?.devHoldingPct || 0
  
  // Cap percentages at 100% and apply logic validation
  sniperPercentage = Math.min(sniperPercentage, 100)
  top10HoldersPercentage = Math.min(top10HoldersPercentage, 100)
  devHoldingPercentage = Math.min(devHoldingPercentage, 100)
  
  // If we have very few holders, top 10 holders % should be reasonable
  // This suggests the data might be mock/placeholder
  if (holdersCount > 0 && holdersCount < 10 && top10HoldersPercentage > 90) {
    console.warn(`⚠️ Token ${pair.symbol}: ${holdersCount} holders but top 10 hold ${top10HoldersPercentage}% - likely mock data`)
  }
  
  // Debug logging to see actual values
  console.log(`Token ${pair.symbol}:`, {
    holders: holdersCount,
    sniper: sniperPercentage.toFixed(1),
    top10: top10HoldersPercentage.toFixed(1),
    dev: devHoldingPercentage.toFixed(1),
    rawMetrics: pair.metrics
  })
  
  // Buy/Sell data for the bar
  const buyCount = pair.metrics?.buyCount || 0
  const sellCount = pair.metrics?.sellCount || 0
  const totalTrades = buyCount + sellCount
  
  // Calculate percentages for the bar
  const buyPercentage = totalTrades > 0 ? (buyCount / totalTrades) * 100 : 50
  const sellPercentage = totalTrades > 0 ? (sellCount / totalTrades) * 100 : 50
  
  // Format mint address 
  const formatMintAddress = (address: string) => {
    if (address.length > 8) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }
    return address
  }

  return (
    <div className="bg-gray-950 border border-gray-800 p-2 rounded-xs hover:bg-gray-900 transition-colors">
      <div className="flex gap-4">
        {/* Left: Large Icon */}
        <div className="w-20 h-20 rounded-xs bg-gray-800 flex items-center justify-center text-white font-regular text-xl overflow-hidden flex-shrink-0 border-1 border-gray-800">
          {pair.image ? (
            <>
              {/* Using regular img tag for external URLs - Next.js Image optimization not needed for dynamic crypto token images */}
              <img src={pair.image} alt={pair.symbol} className="w-full h-full object-cover rounded-xl" />
            </>
          ) : (
            pair.symbol.charAt(0).toUpperCase()
          )}
        </div>

        {/* Right Side Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Symbol, Name, and Top Right Stats */}
          <div className="flex justify-between items-start mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white text-md">
                  {pair.symbol}
                </h3>
                <span className="text-gray-300 text-sm">
                  {pair.name.length > 15 ? `${pair.name.slice(0, 10)}...` : pair.name}
                </span>
              </div>
             
              <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                <button
                  onClick={() => window.open(`https://solscan.io/token/${pair.mintAddress}`, '_blank')}
                  className="hover:text-gray-300 transition-colors"
                >
                  {formatMintAddress(pair.mintAddress)}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(pair.mintAddress)}
                  className="hover:text-gray-300 transition-colors"
                  title="Copy mint address"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Top Right Stats */}
            <div className="text-right flex-shrink-0 text-sm">
              <div className="text-green-400 text-xs">
                V {formatVolume(pair.volume24h)}
              </div>
              <div className="text-yellow-400 text-xs">
                MC {formatMarketCap(pair.marketCap)}
              </div>
                <div className="text-blue-400 text-xs flex items-center gap-1">
                  <span>TX {formatTransactions(pair.metrics?.transactions || totalTrades)}</span>
                  <div className="flex w-8 h-1 rounded overflow-hidden">
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${buyPercentage}%` }}
                    ></div>
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${sellPercentage}%` }}
                    ></div>
                  </div>
                </div>
            </div>
          </div>

         

          {/* Bottom Row: Metrics with Icons */}
          <div className="flex items-center justify-between"> 
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-white font-medium text-[12px]">{holdersCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-white text-[12px]">{devHoldingPercentage.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
                <span className="text-white text-[12px]">{sniperPercentage.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-white text-[12px]">{top10HoldersPercentage.toFixed(0)}%</span>
              </div>
            
          </div>
          <div className="flex items-center justify-end">
            <span className="text-md font-normal text-white">
              {renderPrice(pair.price)}
            </span>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrendingPairCard