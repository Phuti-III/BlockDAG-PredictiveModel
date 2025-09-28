# BlockDAG Predictive Model - Hackathon Demo

A comprehensive cryptocurrency prediction dashboard built with Next.js, featuring AI-powered price predictions, real-time charts, and BlockDAG blockchain integration.

## 🚀 Features

- **AI Price Predictions**: Advanced moving average prediction model for BTC, ETH, and SOL
- **Real-time Charts**: Interactive price visualization with Recharts
- **BlockDAG Integration**: Connected to BlockDAG Primordial network (Chain ID: 1043)
- **Web3 Wallet Support**: WagmiProvider and Web3Modal integration
- **Modern UI**: Built with Next.js 14, TypeScript, and HeroUI components
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **High Contrast Interface**: Accessible design with excellent visibility

## 🛠 Tech Stack

### Frontend
- **Next.js 14.2.6** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **HeroUI** - Modern React component library
- **Recharts** - Interactive charting library

### Blockchain
- **BlockDAG Primordial Network** - Layer-1 blockchain
- **Ethers.js** - Ethereum library for blockchain interaction
- **WagmiProvider** - React hooks for Ethereum
- **Web3Modal** - Wallet connection interface

### AI/ML
- **Moving Average Model** - Local prediction algorithm
- **Confidence Scoring** - Statistical confidence metrics
- **Real-time Analysis** - Live price data processing

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Phuti-III/BlockDAG-PredictiveModel.git
cd BlockDAG-PredictiveModel
```

2. **Install Frontend Dependencies**
```bash
cd CryptoPredictor/frontend
npm install
```

3. **Install API Dependencies**
```bash
cd ../api
npm install
```

4. **Environment Setup**
Create `.env.local` in the frontend directory:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_BLOCKDAG_RPC_URL=https://rpc-testnet.dag.network
```

## 🚀 Running the Application

### Development Mode

1. **Start the Frontend**
```bash
cd CryptoPredictor/frontend
npm run dev
```

2. **Start the API Server**
```bash
cd CryptoPredictor/api
npm start
```

3. **Access the Application**
- Frontend: http://localhost:3000 (or next available port)
- API: http://localhost:3001

## 🧪 Testing

### Frontend Tests
```bash
cd CryptoPredictor/frontend
npm test
```

### API Tests
```bash
cd CryptoPredictor/api
npm test
```

### Blockchain Integration Tests
```bash
cd CryptoPredictor/api
npm run test:blockchain
```

## 📊 Features Overview

### 1. Cryptocurrency Selection
- Support for Bitcoin (BTC), Ethereum (ETH), and Solana (SOL)
- Easy-to-use dropdown selector
- Real-time price updates

### 2. AI Predictions
- **Algorithm**: Moving Average-based prediction model
- **Accuracy**: Statistical confidence scoring
- **Timeline**: Short-term price movement predictions
- **Visualization**: Clear trend indicators (UP/DOWN/NEUTRAL)

### 3. Interactive Charts
- **Real-time Data**: Live price updates every 30 seconds
- **Dual Visualization**: Actual vs Predicted prices
- **Responsive Design**: Mobile-friendly charts
- **Detailed Tooltips**: Comprehensive price information

### 4. Blockchain Integration
- **Network**: BlockDAG Primordial (Chain ID: 1043)
- **RPC Endpoint**: https://rpc-testnet.dag.network
- **Wallet Support**: MetaMask and WalletConnect
- **Transaction History**: Real blockchain interaction logs

## 🏗 Project Structure

```
BlockDAG-PredictiveModel/
├── CryptoPredictor/
│   ├── frontend/                 # Next.js application
│   │   ├── src/
│   │   │   ├── app/             # App router pages
│   │   │   ├── components/      # React components
│   │   │   └── lib/            # Utilities and API functions
│   │   ├── public/             # Static assets
│   │   └── package.json
│   └── api/                     # Node.js API server
│       ├── src/                # API source code
│       ├── tests/              # Test files
│       └── package.json
├── tests/                      # Blockchain integration tests
├── package.json               # Root package configuration
└── README.md
```

## 🎯 Hackathon Demo Highlights

### Live Demonstration Features:
1. **Real-time Predictions**: Watch AI predictions update every 30 seconds
2. **Interactive Interface**: Switch between cryptocurrencies seamlessly  
3. **Blockchain Integration**: Live connection to BlockDAG network
4. **Professional UI**: High-contrast, accessible design
5. **Mobile Responsive**: Works perfectly on all devices

### Technical Achievements:
- ✅ **7/7 Blockchain Tests Passing** - Full integration with BlockDAG
- ✅ **Real Transaction History** - 5 confirmed blockchain transactions
- ✅ **AI Model Accuracy** - Statistical confidence scoring implemented
- ✅ **Production Ready** - Professional UI with accessibility features
- ✅ **Scalable Architecture** - Modular, maintainable codebase

## 🔧 Configuration

### BlockDAG Network Settings
```javascript
const BLOCKDAG_CONFIG = {
  chainId: 1043,
  rpcUrl: 'https://rpc-testnet.dag.network',
  networkName: 'BlockDAG Primordial',
  symbol: 'BDAG',
  blockExplorer: 'https://explorer-testnet.dag.network'
};
```

### API Endpoints
- **Predictions**: `/api/predictions`
- **Price History**: `/api/price-history`
- **Blockchain Status**: `/api/blockchain-status`

## 🧠 AI Model Details

### Moving Average Prediction Algorithm
```typescript
class MovingAverageModel {
  predict(priceHistory: number[], windowSize: number = 5): {
    prediction: number;
    confidence: number;
    trend: 'UP' | 'DOWN' | 'NEUTRAL';
  }
}
```

### Confidence Calculation
- **Statistical Variance**: Analysis of price volatility
- **Trend Consistency**: Historical trend reliability
- **Data Quality**: Completeness and accuracy metrics

## 🚀 Deployment

### Vercel Deployment (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Docker Deployment
```bash
docker build -t blockdag-predictor .
docker run -p 3000:3000 blockdag-predictor
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Success Metrics

- **Technical Innovation**: AI prediction model with blockchain integration
- **User Experience**: Professional, accessible interface design
- **Real-world Application**: Practical cryptocurrency analysis tool
- **Code Quality**: TypeScript, comprehensive testing, modular architecture
- **Demonstration Ready**: Live, interactive demo with real data

## 📞 Contact

**Developer**: Phuti-III  
**Repository**: https://github.com/Phuti-III/BlockDAG-PredictiveModel  
**Demo**: http://localhost:3000  

---

**Built for Hackathon Excellence** 🚀 **Powered by BlockDAG** ⛓️ **AI-Driven Predictions** 🤖

---

### 🎉 Latest Updates (Sept 28, 2025)
- ✅ Enhanced UI contrast for better accessibility
- ✅ Fixed Web3Modal integration issues  
- ✅ Optimized for hackathon demonstration
- ✅ Professional styling with high-contrast design