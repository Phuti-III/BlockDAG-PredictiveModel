const { ethers } = require('ethers');
const PREDICTION_LOGGER_ABI = require('../contracts/PredictionLogger.abi.json');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize provider
      const rpcUrl = process.env.RPC_URL || 'https://rpc.primordial.bdagscan.com';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize contract
      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (!contractAddress) {
        console.warn('CONTRACT_ADDRESS not found in environment variables');
        return;
      }

      this.contract = new ethers.Contract(
        contractAddress,
        PREDICTION_LOGGER_ABI,
        this.provider
      );

      // Initialize signer if private key is provided
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
        this.contract = this.contract.connect(this.signer);
      }

      console.log('✅ Blockchain service initialized');
      console.log(`📍 Contract Address: ${contractAddress}`);
      console.log(`🌐 RPC URL: ${rpcUrl}`);
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
    }
  }

  // Prediction Management
  async makePrediction(predictorAddress, predictionData) {
    try {
      const { cryptocurrency, currentPrice, predictedPrice, targetTimestamp, modelType, additionalData } = predictionData;
      
      const tx = await this.contract.makePrediction(
        cryptocurrency,
        ethers.parseUnits(currentPrice.toString(), 18),
        ethers.parseUnits(predictedPrice.toString(), 18),
        targetTimestamp,
        modelType,
        additionalData || '{}'
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          return this.contract.interface.parseLog(log).name === 'PredictionMade';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = this.contract.interface.parseLog(event);
        return {
          predictionId: parsedEvent.args[0].toString(),
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };
      }

      throw new Error('PredictionMade event not found');
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  }

  async resolvePrediction(predictionId, actualPrice) {
    try {
      const tx = await this.contract.resolvePrediction(
        predictionId,
        ethers.parseUnits(actualPrice.toString(), 18)
      );

      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error resolving prediction:', error);
      throw error;
    }
  }

  // Data Retrieval
  async getPrediction(predictionId) {
    try {
      const prediction = await this.contract.predictions(predictionId);
      return {
        id: prediction.id.toString(),
        predictor: prediction.predictor,
        cryptocurrency: prediction.cryptocurrency,
        currentPrice: ethers.formatUnits(prediction.currentPrice, 18),
        predictedPrice: ethers.formatUnits(prediction.predictedPrice, 18),
        predictionTimestamp: prediction.predictionTimestamp.toString(),
        targetTimestamp: prediction.targetTimestamp.toString(),
        modelType: prediction.modelType,
        isResolved: prediction.isResolved,
        actualPrice: prediction.actualPrice ? ethers.formatUnits(prediction.actualPrice, 18) : null,
        wasAccurate: prediction.wasAccurate,
        accuracyPercentage: prediction.accuracyPercentage.toString(),
        additionalData: prediction.additionalData
      };
    } catch (error) {
      console.error('Error getting prediction:', error);
      throw error;
    }
  }

  async getUserPredictions(userAddress) {
    try {
      const predictionIds = await this.contract.getUserPredictions(userAddress);
      const predictions = await Promise.all(
        predictionIds.map(id => this.getPrediction(id.toString()))
      );
      return predictions;
    } catch (error) {
      console.error('Error getting user predictions:', error);
      throw error;
    }
  }

  async getCryptoPredictions(cryptocurrency) {
    try {
      const predictionIds = await this.contract.getCryptoPredictions(cryptocurrency);
      const predictions = await Promise.all(
        predictionIds.map(id => this.getPrediction(id.toString()))
      );
      return predictions;
    } catch (error) {
      console.error('Error getting crypto predictions:', error);
      throw error;
    }
  }

  async getModelTypePredictions(modelType) {
    try {
      const predictionIds = await this.contract.getModelTypePredictions(modelType);
      const predictions = await Promise.all(
        predictionIds.map(id => this.getPrediction(id.toString()))
      );
      return predictions;
    } catch (error) {
      console.error('Error getting model type predictions:', error);
      throw error;
    }
  }

  // User Statistics
  async getUserStats(userAddress) {
    try {
      const stats = await this.contract.userStats(userAddress);
      const accuracyRate = await this.contract.getUserAccuracyRate(userAddress);
      const averageAccuracy = await this.contract.getUserAverageAccuracy(userAddress);

      return {
        totalPredictions: stats.totalPredictions.toString(),
        accuratePredictions: stats.accuratePredictions.toString(),
        totalAccuracyScore: stats.totalAccuracyScore.toString(),
        accuracyRate: accuracyRate.toString(),
        averageAccuracy: averageAccuracy.toString()
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getUserModelTypeCount(userAddress, modelType) {
    try {
      const count = await this.contract.getUserModelTypeCount(userAddress, modelType);
      return count.toString();
    } catch (error) {
      console.error('Error getting user model type count:', error);
      throw error;
    }
  }

  async getUserCryptoCount(userAddress, cryptocurrency) {
    try {
      const count = await this.contract.getUserCryptoCount(userAddress, cryptocurrency);
      return count.toString();
    } catch (error) {
      console.error('Error getting user crypto count:', error);
      throw error;
    }
  }

  // Model Performance
  async getModelAccuracyRate(modelType) {
    try {
      const rate = await this.contract.getModelAccuracyRate(modelType);
      return rate.toString();
    } catch (error) {
      console.error('Error getting model accuracy rate:', error);
      throw error;
    }
  }

  async getModelAverageAccuracy(modelType) {
    try {
      const accuracy = await this.contract.getModelAverageAccuracy(modelType);
      return accuracy.toString();
    } catch (error) {
      console.error('Error getting model average accuracy:', error);
      throw error;
    }
  }

  // Utility functions
  async calculateAccuracy(predictedPrice, actualPrice) {
    try {
      const accuracy = await this.contract.calculateAccuracy(
        ethers.parseUnits(predictedPrice.toString(), 18),
        ethers.parseUnits(actualPrice.toString(), 18)
      );
      return accuracy.toString();
    } catch (error) {
      console.error('Error calculating accuracy:', error);
      throw error;
    }
  }

  async getPredictionCounter() {
    try {
      const counter = await this.contract.predictionCounter();
      return counter.toString();
    } catch (error) {
      console.error('Error getting prediction counter:', error);
      throw error;
    }
  }

  async getAccuracyThreshold() {
    try {
      const threshold = await this.contract.accuracyThreshold();
      return threshold.toString();
    } catch (error) {
      console.error('Error getting accuracy threshold:', error);
      throw error;
    }
  }

  // Admin functions
  async setAccuracyThreshold(newThreshold) {
    try {
      const tx = await this.contract.setAccuracyThreshold(newThreshold);
      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error setting accuracy threshold:', error);
      throw error;
    }
  }

  async pauseContract() {
    try {
      const tx = await this.contract.pause();
      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error pausing contract:', error);
      throw error;
    }
  }

  async unpauseContract() {
    try {
      const tx = await this.contract.unpause();
      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error unpausing contract:', error);
      throw error;
    }
  }

  async grantOracleRole(oracleAddress) {
    try {
      const tx = await this.contract.grantOracleRole(oracleAddress);
      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error granting oracle role:', error);
      throw error;
    }
  }

  async revokeOracleRole(oracleAddress) {
    try {
      const tx = await this.contract.revokeOracleRole(oracleAddress);
      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Error revoking oracle role:', error);
      throw error;
    }
  }
}

module.exports = new BlockchainService();