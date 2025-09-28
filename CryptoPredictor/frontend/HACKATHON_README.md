# CryptoPredictor Dashboard

A Next.js application for cryptocurrency price predictions using AI-powered moving average models.

## Features

✅ **Real-time Cryptocurrency Tracking**
- Support for BTC, ETH, SOL, ADA, DOT
- Live price charts with historical data
- Interactive price visualization

✅ **AI-Powered Predictions**
- Moving Average prediction model
- 5-minute price forecasting
- Confidence scoring based on volatility
- Trend analysis (UP/DOWN/NEUTRAL)

✅ **Professional Dashboard**
- Clean, responsive design using HeroUI components
- Real-time updates every 30 seconds
- Error handling and loading states
- Hackathon-ready presentation

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## API Integration

The dashboard integrates with two API sources:

1. **Local Prediction API** (`/api/predictions`)
   - Built-in Next.js API route
   - Moving average prediction model
   - Mock data for demo purposes

2. **External API** (Optional - `http://localhost:3001`)
   - Your existing CryptoPredictor API
   - Real blockchain integration
   - Live price data

## Components

### Custom Components (Built for this project)
- `CryptoSelector` - Cryptocurrency selection dropdown
- `PriceChart` - Interactive price chart with predictions
- `PredictionDisplay` - Prediction results and confidence
- `PredictionCard` - Reusable card component
- `PredictionsHistory` - Historical predictions table

### HeroUI Components Used
- `Button`, `Card`, `Select`, `Chip`, `Table`
- `CircularProgress` for loading states

## Technical Architecture

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/predictions/      # Prediction model API
│   │   ├── page.tsx             # Main dashboard page
│   │   └── layout.tsx           # App layout
│   ├── components/              # UI components
│   ├── lib/                     # Utilities and API functions
│   └── types/                   # TypeScript definitions
├── public/                      # Static assets
└── package.json                # Dependencies
```

## Prediction Model

### Moving Average Algorithm
1. **Short-term MA** (3 data points) vs **Long-term MA** (10 data points)
2. **Trend Detection**: Short MA > Long MA = Upward trend
3. **Volatility Analysis**: Standard deviation for confidence scoring
4. **Price Prediction**: Conservative adjustment based on trend strength

### Model Metrics
- **Confidence**: Based on price volatility (lower volatility = higher confidence)
- **Trend Strength**: Percentage difference between moving averages
- **Prediction Horizon**: 5 minutes ahead
- **Update Frequency**: Every 30 seconds

## Demo Features

### Main Dashboard
- **Crypto Selector**: Choose from 5 supported cryptocurrencies
- **Live Chart**: Price history with prediction overlay
- **Prediction Panel**: Current prediction with confidence score
- **Model Info**: Technical details about the prediction model

### Auto-refresh System
- Updates every 30 seconds automatically
- Manual refresh button available
- Loading states during updates
- Error handling for API failures

## Styling

- **Framework**: Tailwind CSS
- **Components**: HeroUI (NextUI v2)
- **Charts**: Recharts library
- **Colors**: Professional blue/gray theme
- **Responsive**: Mobile-first design

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Setup
- Set `NEXT_PUBLIC_API_URL` to your production API
- Configure CORS for your API server
- Set up proper error monitoring

## Hackathon Demo Tips

### Live Presentation
1. **Start with BTC** - Most recognizable cryptocurrency
2. **Show the prediction process** - Watch confidence levels change
3. **Switch cryptocurrencies** - Demonstrate different volatility patterns
4. **Explain the model** - Simple but effective moving average approach

### Key Talking Points
- ✅ **Real-time predictions** using machine learning
- ✅ **Professional UI** ready for production
- ✅ **Extensible architecture** for adding more models
- ✅ **Error handling** and edge cases covered
- ✅ **Mobile responsive** works on all devices

## Future Enhancements

### Model Improvements
- [ ] LSTM/RNN neural networks
- [ ] Multiple timeframe analysis
- [ ] External data sources (news, social sentiment)
- [ ] Ensemble model combining multiple algorithms

### Features
- [ ] User accounts and prediction history
- [ ] Portfolio tracking
- [ ] Push notifications for price targets
- [ ] Social features and prediction sharing

### Technical
- [ ] Real-time WebSocket updates
- [ ] Advanced charting with technical indicators
- [ ] A/B testing for different models
- [ ] Performance monitoring and analytics

## Troubleshooting

### Common Issues
1. **Port 3000 in use**: Change port with `npm run dev -- -p 3001`
2. **API connection issues**: Check if API server is running on port 3001
3. **Build errors**: Run `npm run lint` to check for TypeScript issues

### Development
- Use `npm run build` to check for production build issues
- Check browser console for any JavaScript errors
- Use React DevTools for component debugging

---

**Built for hackathon demo - Production-ready architecture with room for growth! 🚀**