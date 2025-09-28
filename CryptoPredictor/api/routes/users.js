const express = require('express');
const blockchainService = require('../services/blockchain');

const router = express.Router();

// GET /api/users/:address/stats - Get user statistics
router.get('/:address/stats', async (req, res, next) => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }
    
    const stats = await blockchainService.getUserStats(address);
    
    // Calculate additional metrics
    const accuracyRate = parseFloat(stats.accuracyRate) / 100;
    const averageAccuracy = parseFloat(stats.averageAccuracy) / 100;
    
    res.json({
      success: true,
      data: {
        address,
        totalPredictions: stats.totalPredictions,
        accuratePredictions: stats.accuratePredictions,
        totalAccuracyScore: stats.totalAccuracyScore,
        accuracyRate: `${accuracyRate}%`,
        averageAccuracy: `${averageAccuracy}%`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:address/predictions - Get user predictions
router.get('/:address/predictions', async (req, res, next) => {
  try {
    const { address } = req.params;
    const { resolved, crypto, modelType } = req.query;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }
    
    let predictions = await blockchainService.getUserPredictions(address);
    
    // Apply filters
    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      predictions = predictions.filter(p => p.isResolved === isResolved);
    }
    
    if (crypto) {
      predictions = predictions.filter(p => p.cryptocurrency.toLowerCase() === crypto.toLowerCase());
    }
    
    if (modelType) {
      predictions = predictions.filter(p => p.modelType.toLowerCase() === modelType.toLowerCase());
    }
    
    res.json({
      success: true,
      data: predictions,
      meta: {
        address,
        total: predictions.length,
        filters: { resolved, crypto, modelType }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:address/model-stats/:modelType - Get user stats for specific model
router.get('/:address/model-stats/:modelType', async (req, res, next) => {
  try {
    const { address, modelType } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }
    
    const count = await blockchainService.getUserModelTypeCount(address, modelType);
    
    res.json({
      success: true,
      data: {
        address,
        modelType,
        predictionCount: count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:address/crypto-stats/:crypto - Get user stats for specific cryptocurrency
router.get('/:address/crypto-stats/:crypto', async (req, res, next) => {
  try {
    const { address, crypto } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }
    
    const count = await blockchainService.getUserCryptoCount(address, crypto.toUpperCase());
    
    res.json({
      success: true,
      data: {
        address,
        cryptocurrency: crypto.toUpperCase(),
        predictionCount: count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:address/performance - Get comprehensive user performance
router.get('/:address/performance', async (req, res, next) => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }
    
    const [stats, predictions] = await Promise.all([
      blockchainService.getUserStats(address),
      blockchainService.getUserPredictions(address)
    ]);
    
    // Analyze predictions by crypto and model
    const cryptoPerformance = {};
    const modelPerformance = {};
    const timelineData = [];
    
    predictions.forEach(prediction => {
      // Crypto performance
      if (!cryptoPerformance[prediction.cryptocurrency]) {
        cryptoPerformance[prediction.cryptocurrency] = {
          total: 0,
          accurate: 0,
          totalAccuracy: 0
        };
      }
      cryptoPerformance[prediction.cryptocurrency].total++;
      if (prediction.isResolved) {
        if (prediction.wasAccurate) {
          cryptoPerformance[prediction.cryptocurrency].accurate++;
        }
        cryptoPerformance[prediction.cryptocurrency].totalAccuracy += parseFloat(prediction.accuracyPercentage);
      }
      
      // Model performance
      if (!modelPerformance[prediction.modelType]) {
        modelPerformance[prediction.modelType] = {
          total: 0,
          accurate: 0,
          totalAccuracy: 0
        };
      }
      modelPerformance[prediction.modelType].total++;
      if (prediction.isResolved) {
        if (prediction.wasAccurate) {
          modelPerformance[prediction.modelType].accurate++;
        }
        modelPerformance[prediction.modelType].totalAccuracy += parseFloat(prediction.accuracyPercentage);
      }
      
      // Timeline data
      if (prediction.isResolved) {
        timelineData.push({
          date: new Date(parseInt(prediction.predictionTimestamp) * 1000).toISOString(),
          accuracy: parseFloat(prediction.accuracyPercentage) / 100,
          crypto: prediction.cryptocurrency,
          model: prediction.modelType
        });
      }
    });
    
    // Calculate percentages
    Object.keys(cryptoPerformance).forEach(crypto => {
      const perf = cryptoPerformance[crypto];
      perf.accuracyRate = perf.total > 0 ? (perf.accurate / perf.total) * 100 : 0;
      perf.averageAccuracy = perf.total > 0 ? perf.totalAccuracy / perf.total / 100 : 0;
    });
    
    Object.keys(modelPerformance).forEach(model => {
      const perf = modelPerformance[model];
      perf.accuracyRate = perf.total > 0 ? (perf.accurate / perf.total) * 100 : 0;
      perf.averageAccuracy = perf.total > 0 ? perf.totalAccuracy / perf.total / 100 : 0;
    });
    
    res.json({
      success: true,
      data: {
        address,
        overallStats: {
          totalPredictions: stats.totalPredictions,
          accuratePredictions: stats.accuratePredictions,
          accuracyRate: `${parseFloat(stats.accuracyRate) / 100}%`,
          averageAccuracy: `${parseFloat(stats.averageAccuracy) / 100}%`
        },
        cryptoPerformance,
        modelPerformance,
        timeline: timelineData.sort((a, b) => new Date(a.date) - new Date(b.date)),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;