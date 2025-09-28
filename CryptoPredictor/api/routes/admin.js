const express = require('express');
const Joi = require('joi');
const blockchainService = require('../services/blockchain');

const router = express.Router();

// Middleware to check if user has admin privileges
// In a production environment, this would verify JWT tokens or API keys
const requireAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Admin privileges required'
    });
  }
  next();
};

// Validation schemas
const setThresholdSchema = Joi.object({
  threshold: Joi.number().integer().min(0).max(10000).required(),
  adminAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional()
});

const oracleRoleSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

// GET /api/admin/contract-info - Get contract information
router.get('/contract-info', requireAdmin, async (req, res, next) => {
  try {
    const [predictionCounter, accuracyThreshold] = await Promise.all([
      blockchainService.getPredictionCounter(),
      blockchainService.getAccuracyThreshold()
    ]);
    
    res.json({
      success: true,
      data: {
        contractAddress: process.env.CONTRACT_ADDRESS,
        network: process.env.NETWORK_NAME || 'localhost',
        predictionCounter,
        accuracyThreshold: `${parseInt(accuracyThreshold) / 100}%`,
        basisPoints: accuracyThreshold,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/accuracy-threshold - Set accuracy threshold
router.put('/accuracy-threshold', requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = setThresholdSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details
      });
    }
    
    const result = await blockchainService.setAccuracyThreshold(value.threshold);
    
    res.json({
      success: true,
      data: {
        txHash: result.receipt?.hash,
        blockNumber: result.receipt?.blockNumber,
        gasUsed: result.receipt?.gasUsed?.toString(),
        threshold: value.threshold
      },
      message: `Accuracy threshold updated to ${value.threshold / 100}%`
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/pause - Pause the contract
router.post('/pause', requireAdmin, async (req, res, next) => {
  try {
    const result = await blockchainService.pauseContract();
    
    res.json({
      success: true,
      data: {
        txHash: result.receipt.hash,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed.toString()
      },
      message: 'Contract paused successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/unpause - Unpause the contract
router.post('/unpause', requireAdmin, async (req, res, next) => {
  try {
    const result = await blockchainService.unpauseContract();
    
    res.json({
      success: true,
      data: {
        txHash: result.receipt.hash,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed.toString()
      },
      message: 'Contract unpaused successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/oracle/grant - Grant oracle role to address
router.post('/oracle/grant', requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = oracleRoleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details
      });
    }
    
    const result = await blockchainService.grantOracleRole(value.address);
    
    res.json({
      success: true,
      data: {
        txHash: result.receipt.hash,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed.toString()
      },
      message: `Oracle role granted to ${value.address}`
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/oracle/revoke - Revoke oracle role from address
router.post('/oracle/revoke', requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = oracleRoleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details
      });
    }
    
    const result = await blockchainService.revokeOracleRole(value.address);
    
    res.json({
      success: true,
      data: {
        txHash: result.receipt.hash,
        blockNumber: result.receipt.blockNumber,
        gasUsed: result.receipt.gasUsed.toString()
      },
      message: `Oracle role revoked from ${value.address}`
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/stats - Get comprehensive system statistics
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const predictionCounter = await blockchainService.getPredictionCounter();
    const accuracyThreshold = await blockchainService.getAccuracyThreshold();
    
    // Get recent predictions for analysis
    const recentPredictions = [];
    const totalCount = parseInt(predictionCounter);
    const recentCount = Math.min(100, totalCount); // Last 100 predictions
    
    for (let i = Math.max(1, totalCount - recentCount + 1); i <= totalCount; i++) {
      try {
        const prediction = await blockchainService.getPrediction(i);
        recentPredictions.push(prediction);
      } catch (error) {
        // Skip if prediction doesn't exist
        continue;
      }
    }
    
    // Analyze recent predictions
    const resolved = recentPredictions.filter(p => p.isResolved);
    const accurate = resolved.filter(p => p.wasAccurate);
    
    // Model usage statistics
    const modelUsage = {};
    recentPredictions.forEach(p => {
      modelUsage[p.modelType] = (modelUsage[p.modelType] || 0) + 1;
    });
    
    // Crypto usage statistics
    const cryptoUsage = {};
    recentPredictions.forEach(p => {
      cryptoUsage[p.cryptocurrency] = (cryptoUsage[p.cryptocurrency] || 0) + 1;
    });
    
    // Daily activity (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentActivity = recentPredictions.filter(p => {
      const predictionTime = parseInt(p.predictionTimestamp) * 1000;
      return predictionTime > sevenDaysAgo;
    });
    
    res.json({
      success: true,
      data: {
        contractInfo: {
          totalPredictions: predictionCounter,
          accuracyThreshold: `${parseInt(accuracyThreshold) / 100}%`,
          network: process.env.NETWORK_NAME || 'localhost'
        },
        recentStats: {
          sampleSize: recentPredictions.length,
          resolvedPredictions: resolved.length,
          accuratePredictions: accurate.length,
          overallAccuracyRate: resolved.length > 0 ? (accurate.length / resolved.length) * 100 : 0,
          averageAccuracy: resolved.length > 0 
            ? resolved.reduce((sum, p) => sum + parseFloat(p.accuracyPercentage), 0) / resolved.length / 100
            : 0
        },
        usage: {
          modelUsage: Object.entries(modelUsage)
            .sort(([,a], [,b]) => b - a)
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
          cryptoUsage: Object.entries(cryptoUsage)
            .sort(([,a], [,b]) => b - a)
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
        },
        activity: {
          last7Days: recentActivity.length,
          dailyAverage: recentActivity.length / 7
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/bulk-resolve - Bulk resolve predictions (for oracle operations)
router.post('/bulk-resolve', requireAdmin, async (req, res, next) => {
  try {
    const { predictions } = req.body;
    
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Predictions array is required and must not be empty'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const pred of predictions) {
      try {
        const { predictionId, id, actualPrice } = pred;
        const resolveId = predictionId || id;
        
        if (!resolveId || !actualPrice || actualPrice <= 0) {
          errors.push({ predictionId: resolveId, error: 'Invalid prediction data' });
          continue;
        }
        
        const result = await blockchainService.resolvePrediction(resolveId, actualPrice);
        results.push({ predictionId: resolveId, ...result });
      } catch (error) {
        errors.push({ predictionId: pred.predictionId || pred.id, error: error.message });
      }
    }
    
    res.json({
      success: true,
      data: {
        resolved: results.length,
        failed: errors.length,
        details: results,
        errors,
        summary: {
          total: predictions.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;