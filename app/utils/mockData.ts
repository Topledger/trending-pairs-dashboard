import { TrendingPair } from '../hooks/useWebSocket'

export const generateMockData = (): TrendingPair[] => {
  const mockTokens = [
    {
      symbol: 'GREEDY',
      name: 'He Just Greedy',
      price: 4.39,
      priceChangePercentage24h: 15.2,
      marketCap: 6200000,
      volume24h: 850000,
      age: '0s',
      status: 'New' as const,
      image: undefined,
      social: {
        twitter: 'https://twitter.com/greedycoinpf',
      },
      metrics: {
        holders: 308,
        transactions: 1247,
        liquidity: 420000
      }
    },
    {
      symbol: 'AGENTCOIN',
      name: 'Agentic Economy',
      price: 37.24,
      priceChangePercentage24h: 72.4,
      marketCap: 72400000,
      volume24h: 2200000,
      age: '10h',
      status: 'Migrating' as const,
      metrics: {
        holders: 1542,
        transactions: 5680,
        liquidity: 1200000
      }
    },
    {
      symbol: 'DANK',
      name: 'DANK',
      price: 14.6,
      priceChangePercentage24h: 49.8,
      marketCap: 14600000,
      volume24h: 980000,
      age: '16s',
      status: 'New' as const,
      social: {
        twitter: 'https://twitter.com/sinclaimrory22',
      },
      metrics: {
        holders: 892,
        transactions: 3210,
        liquidity: 650000
      }
    },
    {
      symbol: 'STALLION',
      name: 'Stallion Coin',
      price: 900.1,
      priceChangePercentage24h: -6.3,
      marketCap: 63600000,
      volume24h: 4200000,
      age: '7s',
      status: 'Migrated' as const,
      social: {
        twitter: 'https://twitter.com/StallionCoinPmp',
        website: 'https://stallion.com'
      },
      metrics: {
        holders: 2105,
        transactions: 8950,
        liquidity: 2800000
      }
    },
    {
      symbol: 'NEWBIEFROG',
      name: 'PUMP NEWBIE',
      price: 129.6,
      priceChangePercentage24h: 64.2,
      marketCap: 64200000,
      volume24h: 1800000,
      age: '6h',
      status: 'Migrating' as const,
      social: {
        telegram: 'https://t.me/newbiefrog',
      },
      metrics: {
        holders: 1687,
        transactions: 6420,
        liquidity: 1500000
      }
    },
    {
      symbol: 'CARDS',
      name: 'Collector Crypt',
      price: 133.3,
      priceChangePercentage24h: -52.4,
      marketCap: 52400000,
      volume24h: 1100000,
      age: '27s',
      status: 'New' as const,
      metrics: {
        holders: 756,
        transactions: 2890,
        liquidity: 780000
      }
    }
  ]

  return mockTokens.map(token => ({
    ...token,
    mintAddress: `${token.symbol}mint${Math.random().toString(36).substr(2, 8)}`,
    creationTimestamp: Date.now() - Math.random() * 86400000, // Random timestamp within last day
    priceChange24h: (token.price * token.priceChangePercentage24h) / 100
  }))
}

// Function to simulate real-time updates
export const updateMockData = (data: TrendingPair[]): TrendingPair[] => {
  return data.map(pair => {
    // Randomly update some values to simulate real-time changes
    const shouldUpdate = Math.random() > 0.7 // 30% chance to update
    
    if (!shouldUpdate) return pair
    
    const priceChange = (Math.random() - 0.5) * 0.1 // ±5% change
    const newPrice = Math.max(0.001, pair.price * (1 + priceChange))
    const newPriceChangePercentage = pair.priceChangePercentage24h + (Math.random() - 0.5) * 10
    
    return {
      ...pair,
      price: newPrice,
      priceChangePercentage24h: newPriceChangePercentage,
      priceChange24h: (newPrice * newPriceChangePercentage) / 100,
      volume24h: pair.volume24h * (1 + (Math.random() - 0.5) * 0.2)
    }
  })
}
