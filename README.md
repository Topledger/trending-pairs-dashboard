# Trending Pairs Dashboard 🚀

A real-time cryptocurrency trending pairs dashboard built with Next.js, React, and WebSocket integration. Monitor live token data from pump-fun and meteora-dbc DEXs with comprehensive metrics and interactive features.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC)

## ✨ Features

### 🔄 Real-Time Data
- **Live WebSocket Connection** - Real-time updates from trending pairs API
- **Dual DEX Support** - Switch between pump-fun and meteora-dbc
- **Auto-Reconnection** - Robust connection handling with automatic retry
- **Category Updates** - Handles incremental field updates efficiently

### 📊 Smart Filtering & Display
- **25 Tokens Per Category** - Shows top 25 newest tokens for each status
- **Dynamic Categories** - Filter by New, Migrating, and Migrated tokens
- **Newest First Sorting** - Tokens sorted by creation timestamp
- **Auto-Replacement** - New tokens replace oldest when limit exceeded

### 💎 Modern Card Design
- **Compact Layout** - 3 cards per row with optimized spacing
- **Token Information** - Symbol, name, mint address, and age
- **Price Display** - Smart formatting with subscript zeros (e.g., $0.0₅5)
- **Interactive Elements** - Clickable mint addresses and copy functionality

### 📈 Comprehensive Metrics
- **Holder Analytics** - Holder count, dev %, sniper %, top 10 holders %
- **Trading Data** - Volume, market cap, transaction counts
- **Visual Indicators** - Buy/sell ratio bars with color coding
- **SVG Icons** - Clean line icons for all metrics

### 🔗 External Integrations
- **Solscan Links** - Direct links to token pages on Solscan
- **Copy to Clipboard** - One-click mint address copying
- **New Tab Opening** - External links open in new tabs

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Real-time**: WebSocket API integration
- **State Management**: React hooks (useState, useEffect, useMemo)
- **Icons**: Heroicons SVG library
- **Build Tool**: Turbopack for fast development

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/trending-pairs.git
   cd trending-pairs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📱 Usage

### Basic Navigation
1. **Select DEX** - Choose between Pump Fun or Meteora DBC from dropdown
2. **Filter Tokens** - Click category buttons (New/Migrating/Migrated)
3. **View Details** - Each card shows comprehensive token information
4. **Interact** - Click mint addresses to open Solscan, copy with icon

### Data Understanding
- **Holders** 👥 - Total number of unique token holders
- **Dev %** 📊 - Percentage of supply held by developer
- **Sniper %** 🔥 - Percentage held by sniper wallets  
- **Top 10 %** ⭐ - Percentage held by top 10 holders
- **TX Bar** - Green (buys) vs Red (sells) ratio visualization

## 🔧 Configuration

### WebSocket Connection
The dashboard connects to: `ws://34.107.31.9/ws/trending-pairs`

### Supported DEXs
- **pump-fun** - Pump.fun DEX tokens
- **meteora-dbc** - Meteora DBC tokens

### Display Limits
- **25 tokens per category** - Maintains performance
- **Auto-refresh** - Real-time updates every few seconds
- **Smart caching** - Efficient data management

## 🏗️ Architecture

### Components Structure
```
app/
├── components/
│   ├── TrendingPairsDashboard.tsx    # Main dashboard
│   ├── TrendingPairCard.tsx          # Individual token cards
│   ├── StatusFilter.tsx              # Category filter buttons
│   └── WebSocketTester.tsx           # Debug component
├── hooks/
│   └── useWebSocket.tsx              # WebSocket management
└── utils/
    └── mockData.ts                   # Development utilities
```

### Key Features Implementation
- **Real-time Updates**: Custom useWebSocket hook with reconnection
- **Data Processing**: Transforms raw WebSocket data into typed interfaces
- **UI Components**: Modular, reusable React components
- **State Management**: Efficient React hooks with proper dependency arrays

## 🎨 Design System

### Colors
- **Background**: Dark theme (#0a0a0b, #111113)
- **Accent Colors**: Blue (#3b82f6), Green (#10b981), Yellow (#f59e0b)
- **Status Colors**: Green (New), Yellow (Migrating), Blue (Migrated)

### Typography
- **Font**: Inter from Google Fonts
- **Hierarchy**: Various text sizes from xs to 2xl
- **Weight**: Regular to bold based on importance

### Layout
- **Grid**: 3-column responsive grid
- **Spacing**: Consistent 12px, 16px, 24px increments
- **Cards**: Rounded corners, subtle borders, hover effects

## 🔍 Development

### Debug Features
- **Console Logging** - Detailed WebSocket message logging
- **Connection Status** - Visual connection indicators
- **Data Validation** - Warns about inconsistent data

### Testing Components
- **WebSocketTester** - Manual WebSocket testing interface
- **Mock Data** - Development data for offline testing

## 📦 Build & Deploy

### Production Build
```bash
npm run build
npm start
```

### Deploy Options
- **Vercel** - Recommended for Next.js projects
- **Netlify** - Static site deployment
- **Docker** - Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebSocket API** - Real-time data provider
- **Heroicons** - Beautiful SVG icon library
- **Tailwind CSS** - Utility-first CSS framework
- **Next.js Team** - Amazing React framework

---

**Built with ❤️ by the Trending Pairs Team**

For issues and feature requests, please [open an issue](https://github.com/yourusername/trending-pairs/issues).