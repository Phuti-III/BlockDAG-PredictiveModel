const express = require('express');
const blockchainService = require('../services/blockchain');

const router = express.Router();

// GET /api/crypto - Get all cryptocurrencies with prediction data
router.get('/', async (req, res, next) => {
  try {
    // Common cryptocurrencies - in a real app, this would come from a database or API
    const commonCryptos = ['BTC', 'ETH', 'BLOCKDAG', 'ADA', 'SOL', 'DOT', 'LINK', 'UNI'];
    
    const cryptoStats = await Promise.all(
      commonCryptos.map(async (crypto) => {
        try {
          const predictions = await blockchainService.getCryptoPredictions(crypto);
          const resolved = predictions.filter(p => p.isResolved);
          const accurate = resolved.filter(p => p.wasAccurate);
          
          return {
            symbol: crypto,
            totalPredictions: predictions.length,
            resolvedPredictions: resolved.length,
            accuratePredictions: accurate.length,
            accuracyRate: resolved.length > 0 ? (accurate.length / resolved.length) * 100 : 0,
            hasData: predictions.length > 0
          };
        } catch (error) {
          return {
            symbol: crypto,
            totalPredictions: 0,
            resolvedPredictions: 0,
            accuratePredictions: 0,
            accuracyRate: 0,
            hasData: false
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: cryptoStats.filter(crypto => crypto.hasData),
      meta: {
        totalCryptocurrencies: cryptoStats.length,
        cryptosWithData: cryptoStats.filter(crypto => crypto.hasData).length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crypto/:symbol/predictions - Get predictions for specific cryptocurrency
router.get('/:symbol/predictions', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { resolved, modelType, user } = req.query;
    
    let predictions = await blockchainService.getCryptoPredictions(symbol.toUpperCase());
    
    // Apply filters
    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      predictions = predictions.filter(p => p.isResolved === isResolved);
    }
    
    if (modelType) {
      predictions = predictions.filter(p => p.modelType.toLowerCase() === modelType.toLowerCase());
    }
    
    if (user) {
      predictions = predictions.filter(p => p.predictor.toLowerCase() === user.toLowerCase());
    }
    
    res.json({
      success: true,
      data: predictions,
      meta: {
        cryptocurrency: symbol.toUpperCase(),
        total: predictions.length,
        filters: { resolved, modelType, user }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crypto/:symbol/stats - Get statistics for specific cryptocurrency
router.get('/:symbol/stats', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const predictions = await blockchainService.getCryptoPredictions(symbol.toUpperCase());
    
    const resolved = predictions.filter(p => p.isResolved);
    const accurate = resolved.filter(p => p.wasAccurate);
    const totalAccuracy = resolved.reduce((sum, p) => sum + parseFloat(p.accuracyPercentage), 0);
    
    // Model performance for this crypto
    const modelPerformance = {};
    predictions.forEach(prediction => {
      if (!modelPerformance[prediction.modelType]) {
        modelPerformance[prediction.modelType] = {
          total: 0,
          resolved: 0,
          accurate: 0,
          totalAccuracy: 0
        };
      }
      
      modelPerformance[prediction.modelType].total++;
      if (prediction.isResolved) {
        modelPerformance[prediction.modelType].resolved++;
        modelPerformance[prediction.modelType].totalAccuracy += parseFloat(prediction.accuracyPercentage);
        if (prediction.wasAccurate) {
          modelPerformance[prediction.modelType].accurate++;
        }
      }
    });
    
    // Calculate model performance percentages
    Object.keys(modelPerformance).forEach(model => {
      const perf = modelPerformance[model];
      perf.accuracyRate = perf.resolved > 0 ? (perf.accurate / perf.resolved) * 100 : 0;
      perf.averageAccuracy = perf.resolved > 0 ? perf.totalAccuracy / perf.resolved / 100 : 0;
    });
    
    res.json({
      success: true,
      data: {
        cryptocurrency: symbol.toUpperCase(),
        overallStats: {
          totalPredictions: predictions.length,
          resolvedPredictions: resolved.length,
          accuratePredictions: accurate.length,
          accuracyRate: resolved.length > 0 ? (accurate.length / resolved.length) * 100 : 0,
          averageAccuracy: resolved.length > 0 ? totalAccuracy / resolved.length / 100 : 0
        },
        modelPerformance,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crypto/:symbol/analysis - Get detailed analysis for cryptocurrency
router.get('/:symbol/analysis', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '7d' } = req.query;
    
    const predictions = await blockchainService.getCryptoPredictions(symbol.toUpperCase());
    
    // Filter by timeframe
    const now = Date.now();
    let timefilterMs;
    switch (timeframe) {
      case '1d': timefilterMs = 24 * 60 * 60 * 1000; break;
      case '7d': timefilterMs = 7 * 24 * 60 * 60 * 1000; break;
      case '30d': timefilterMs = 30 * 24 * 60 * 60 * 1000; break;
      case '90d': timefilterMs = 90 * 24 * 60 * 60 * 1000; break;
      default: timefilterMs = 7 * 24 * 60 * 60 * 1000;
    }
    
    const filteredPredictions = predictions.filter(p => {
      const predictionTime = parseInt(p.predictionTimestamp) * 1000;
      return (now - predictionTime) <= timefilterMs;
    });
    
    // Price trend analysis
    const priceData = filteredPredictions
      .filter(p => p.isResolved)
      .map(p => ({
        timestamp: parseInt(p.predictionTimestamp) * 1000,
        currentPrice: parseFloat(p.currentPrice),
        predictedPrice: parseFloat(p.predictedPrice),
        actualPrice: parseFloat(p.actualPrice),
        accuracy: parseFloat(p.accuracyPercentage) / 100
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Sentiment analysis (bullish vs bearish predictions)
    let bullishCount = 0;
    let bearishCount = 0;
    
    filteredPredictions.forEach(p => {
      if (parseFloat(p.predictedPrice) > parseFloat(p.currentPrice)) {
        bullishCount++;
      } else {
        bearishCount++;
      }
    });
    
    const sentiment = {
      bullish: bullishCount,
      bearish: bearishCount,
      neutral: filteredPredictions.length - bullishCount - bearishCount,
      sentiment: bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral'
    };
    
    // Best and worst predictions
    const resolvedPredictions = filteredPredictions.filter(p => p.isResolved);
    const sortedByAccuracy = resolvedPredictions.sort((a, b) => 
      parseFloat(b.accuracyPercentage) - parseFloat(a.accuracyPercentage)
    );
    
    res.json({
      success: true,
      data: {
        cryptocurrency: symbol.toUpperCase(),
        timeframe,
        summary: {
          totalPredictions: filteredPredictions.length,
          resolvedPredictions: resolvedPredictions.length,
          averageAccuracy: resolvedPredictions.length > 0 
            ? resolvedPredictions.reduce((sum, p) => sum + parseFloat(p.accuracyPercentage), 0) / resolvedPredictions.length / 100
            : 0
        },
        sentiment,
        priceData,
        topPredictions: {
          mostAccurate: sortedByAccuracy.slice(0, 5),
          leastAccurate: sortedByAccuracy.slice(-5).reverse()
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crypto/trending - Get trending cryptocurrencies based on prediction activity
router.get('/trending', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get all cryptos and their recent activity
    const commonCryptos = ['BTC', 'ETH', 'BLOCKDAG', 'ADA', 'SOL', 'DOT', 'LINK', 'UNI', 'AVAX', 'MATIC'];
    
    const cryptoActivity = await Promise.all(
      commonCryptos.map(async (crypto) => {
        try {
          const predictions = await blockchainService.getCryptoPredictions(crypto);
          
          // Filter recent predictions (last 24 hours)
          const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
          const recentPredictions = predictions.filter(p => {
            const predictionTime = parseInt(p.predictionTimestamp) * 1000;
            return predictionTime > oneDayAgo;
          });
          
          return {
            symbol: crypto,
            totalPredictions: predictions.length,
            recentPredictions: recentPredictions.length,
            trendScore: recentPredictions.length * 2 + predictions.length
          };
        } catch (error) {
          return {
            symbol: crypto,
            totalPredictions: 0,
            recentPredictions: 0,
            trendScore: 0
          };
        }
      })
    );
    
    const trending = cryptoActivity
      .filter(crypto => crypto.trendScore > 0)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: trending,
      meta: {
        timeframe: '24h',
        totalCryptosAnalyzed: commonCryptos.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;