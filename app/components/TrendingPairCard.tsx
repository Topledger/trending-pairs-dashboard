'use client'

import React from 'react'
import { TrendingPair } from '../hooks/useWebSocket'
import { useImageFromUri } from '../hooks/useImageFromUri'

interface TrendingPairCardProps {
  pair: TrendingPair
  rank?: number
}

const TrendingPairCard: React.FC<TrendingPairCardProps> = ({ pair }) => {
  // Use the image hook to fetch image and social links from URI if needed
  const { imageUrl, loading, socialLinks } = useImageFromUri(pair.uri, pair.image)

  // Get bonding curve percentage
  const bondingCurvePercentage = Math.min(pair.metrics?.bondingCurvePct || 0, 100)

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

  // Get formatted time since token creation
  const getFormattedTime = () => {
    if (!pair.creationTimestamp) return '0s'
    
    const now = Date.now()
    const diffMs = now - pair.creationTimestamp
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    // Show the largest meaningful unit
    if (diffDays > 0) {
      return `${diffDays}d`
    } else if (diffHours > 0) {
      return `${diffHours}h`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m`
    } else {
      return `${diffSeconds}s`
    }
  }

  return (
    <div className="bg-gray-950 border border-gray-800 p-2 rounded-xs transition-colors group">
      <div className="flex gap-4">
        {/* Left: Large Icon */}
        <div className="w-20 h-20 rounded-xs bg-gray-800 flex items-center justify-center text-white font-regular text-xl overflow-hidden flex-shrink-0 relative">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={pair.symbol} 
              className="w-full h-full object-cover rounded-xs transition-all duration-300 group-hover:blur-xs"
              onError={(e) => {
                // Hide image and show fallback
                const target = e.currentTarget
                const parent = target.parentElement
                if (parent) {
                  target.style.display = 'none'
                  const fallback = parent.querySelector('.fallback-text')
                  if (fallback) {
                    fallback.classList.remove('hidden')
                  }
                }
              }}
            />
          ) : loading ? (
            <div className="w-full h-full bg-gray-700 animate-pulse rounded-xs flex items-center justify-center transition-all duration-300 group-hover:blur-sm">
              <span className="text-xs text-gray-400">...</span>
            </div>
          ) : null}
          
          {/* Fallback text - hidden by default, shown when image fails or no image */}
          <span className={`fallback-text absolute inset-0 flex items-center justify-center text-xl font-bold transition-all duration-300 group-hover:blur-sm ${imageUrl ? 'hidden' : ''}`}>
            {pair.symbol.charAt(0).toUpperCase()}
          </span>
          
          {/* Bonding Curve Percentage Overlay - shown on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-black/50 px-1 py-1 rounded-xs text-center border border-gray-600/30">
              <div className="text-green-400 font-bold text-sm drop-shadow-lg">
                {bondingCurvePercentage.toFixed(1)}%
              </div>
              
            </div>
          </div>
          
          {/* Bonding Curve Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-xs" title="Bonding Curve Progress">
            <div 
              className="h-full bg-green-500 rounded-b-xs transition-all duration-300"
              style={{ width: `${bondingCurvePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Right Side Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Symbol, Name, and Top Right Stats */}
          <div className="flex justify-between items-start mb-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white text-sm">
                  {pair.symbol}
                </h3>
                <span className="text-gray-300 text-xs">
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
              
              {/* Time and Social Links Row */}
              <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
                <span title="Token Age">{getFormattedTime()}</span>
                
                {/* Twitter/X Link - prioritize URI metadata over WebSocket data */}
                {(socialLinks.twitter || pair.social?.twitter) && (
                  <button
                    onClick={() => window.open(socialLinks.twitter || pair.social?.twitter, '_blank')}
                    className="hover:text-gray-300 transition-colors"
                    title="Twitter/X"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                    </svg>
                  </button>
                )}
                
                {/* Website Link - prioritize URI metadata over WebSocket data */}
                {(socialLinks.website || pair.social?.website) && (
                  <button
                    onClick={() => window.open(socialLinks.website || pair.social?.website, '_blank')}
                    className="hover:text-gray-300 transition-colors"
                    title="Website"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Top Right Stats */}
            <div className="text-right flex-shrink-0 text-sm">
              <div className="text-green-400 text-xs" title="24h Volume">
                V {formatVolume(pair.volume24h)}
              </div>
              <div className="text-yellow-400 text-xs" title="Market Cap">
                MC {formatMarketCap(pair.marketCap)}
              </div>
                <div className="text-blue-400 text-xs flex items-center gap-1" title="Total Transactions">
                  <span>TX {formatTransactions(pair.metrics?.transactions || totalTrades)}</span>
                  <div className="flex w-8 h-1 rounded overflow-hidden" title="Buy/Sell Ratio">
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
              <div className="flex items-center gap-1" title="Holder Count">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-white font-medium text-[11px]">{holdersCount}</span>
              </div>
              <div className="flex items-center gap-1" title="Dev Holdings">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-white text-[11px]">{devHoldingPercentage.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1" title="Sniper Wallets">
                <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
                <span className="text-white text-[11px]">{sniperPercentage.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1" title="Top 10 Holders">
                <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-white text-[11px]">{top10HoldersPercentage.toFixed(0)}%</span>
              </div>
            
          </div>
          <div className="flex items-center justify-end">
            <span className="text-md font-normal text-white" title="Current Price">
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