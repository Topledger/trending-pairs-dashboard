'use client'

import React from 'react'
import { TradeEvent } from '../hooks/useKafkaConsumer'

interface TradeEventCardProps {
  event: TradeEvent
}

const TradeEventCard: React.FC<TradeEventCardProps> = ({ event }) => {
  const isBuy = event.tradeType === 1
  const isSell = event.tradeType === 2
  
  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return 'Unknown'
    const ts = parseInt(timestamp)
    return new Date(ts * 1000).toLocaleTimeString()
  }
  
  const formatAddress = (address: string | undefined) => {
    if (!address) return 'Unknown'
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`
    } else {
      return amount.toFixed(2)
    }
  }
  
  const formatPrice = (price: string | undefined) => {
    if (!price) return '$0.00'
    const num = parseFloat(price)
    if (isNaN(num)) return '$0.00'
    if (num < 0.01) {
      return `$${num.toFixed(6)}`
    } else {
      return `$${num.toFixed(4)}`
    }
  }

  return (
    <div className="bg-gray-950 border border-gray-800 p-3 rounded-lg transition-colors hover:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Trade Type Badge */}
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isBuy ? 'bg-green-500/20 text-green-400' :
            isSell ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {isBuy ? 'BUY' : isSell ? 'SELL' : 'UNKNOWN'}
          </span>
          
          {/* Platform Badge */}
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
            {event.platform?.toUpperCase() || 'UNKNOWN'}
          </span>
          
          {/* Time */}
          <span className="text-xs text-gray-500">
            {formatTime(event.timestamp)}
          </span>
        </div>
        
        {/* Transaction Link */}
        {event.transactionId && (
          <button
            onClick={() => window.open(`https://solscan.io/tx/${event.transactionId}`, '_blank')}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {formatAddress(event.transactionId)}
          </button>
        )}
      </div>
      
      {/* Token Info */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white text-sm">
              {event.baseMintSymbol || 'UNKNOWN'}
            </span>
            <span className="text-xs text-gray-400">
              {event.baseMintName || 'Unknown Token'}
            </span>
          </div>
          {event.baseMint && (
            <button
              onClick={() => window.open(`https://solscan.io/token/${event.baseMint}`, '_blank')}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {formatAddress(event.baseMint)}
            </button>
          )}
        </div>
        
        {/* Price */}
        <div className="text-right">
          <div className="text-sm font-medium text-white">
            {event.priceUsd ? formatPrice(event.priceUsd) : '$0.00'}
          </div>
          <div className="text-xs text-gray-400">
            {(event.solAmount || 0).toFixed(4)} SOL
          </div>
        </div>
      </div>
      
      {/* Trade Details */}
      <div className="grid grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-gray-400">Amount</div>
          <div className="text-white font-medium">
            {formatAmount(event.tokenAmount || 0)}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">Trader</div>
          {event.walletAddress ? (
            <button
              onClick={() => window.open(`https://solscan.io/account/${event.walletAddress}`, '_blank')}
              className="text-white font-medium hover:text-blue-400 transition-colors"
            >
              {formatAddress(event.walletAddress)}
            </button>
          ) : (
            <div className="text-white font-medium">Unknown</div>
          )}
        </div>
        
        <div>
          <div className="text-gray-400">SOL Balance</div>
          <div className="text-white font-medium">
            {(event.currentSolBalance || 0).toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Additional Metrics */}
      <div className="mt-2 pt-2 border-t border-gray-800 grid grid-cols-4 gap-2 text-xs">
        <div>
          <div className="text-gray-400">Fee</div>
          <div className="text-white">
            {(event.totalNetworkFee || 0).toFixed(4)}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">Slot</div>
          <div className="text-white">
            {parseInt(event.slot || '0').toLocaleString()}
          </div>
        </div>
        
        <div>
          <div className="text-gray-400">Processing</div>
          <div className="text-white">
            {(parseInt(event.processingTimeUs || '0') / 1000).toFixed(1)}ms
          </div>
        </div>
        
        {event.currentSupply && (
          <div>
            <div className="text-gray-400">Supply</div>
            <div className="text-white">
              {formatAmount(event.currentSupply)}
            </div>
          </div>
        )}
      </div>
      
    </div>
  )
}

export default TradeEventCard
