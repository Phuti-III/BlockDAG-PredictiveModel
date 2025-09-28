const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PredictionLogger", function () {
  let predictionLogger;
  let owner, user1, user2, oracle;
  
  beforeEach(async function () {
    [owner, user1, user2, oracle] = await ethers.getSigners();
    
    const PredictionLogger = await ethers.getContractFactory("PredictionLogger");
    predictionLogger = await PredictionLogger.deploy();
    
    // Grant oracle role to oracle address
    await predictionLogger.grantOracleRole(oracle.address);
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await predictionLogger.hasRole(await predictionLogger.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });
    
    it("Should initialize with zero predictions", async function () {
      expect(await predictionLogger.predictionCounter()).to.equal(0);
    });
    
    it("Should set default accuracy threshold", async function () {
      expect(await predictionLogger.accuracyThreshold()).to.equal(500); // 5%
    });
  });
  
  describe("Making Predictions", function () {
    it("Should allow users to make predictions", async function () {
      const currentTime = await time.latest();
      const targetTime = currentTime + 3600; // 1 hour from now
      
      await expect(
        predictionLogger.connect(user1).makePrediction(
          "BTC",
          50000000000, // $50,000 in wei equivalent
          55000000000, // $55,000 predicted
          targetTime,
          "LSTM",
          '{"confidence": 0.85}'
        )
      ).to.emit(predictionLogger, "PredictionMade")
       .withArgs(1, user1.address, "BTC", 50000000000, 55000000000, targetTime, "LSTM");
      
      expect(await predictionLogger.predictionCounter()).to.equal(1);
    });
    
    it("Should reject predictions with invalid parameters", async function () {
      const currentTime = await time.latest();
      const targetTime = currentTime + 3600;
      
      // Empty cryptocurrency
      await expect(
        predictionLogger.connect(user1).makePrediction(
          "",
          50000000000,
          55000000000,
          targetTime,
          "LSTM",
          "{}"
        )
      ).to.be.revertedWith("Cryptocurrency cannot be empty");
      
      // Zero current price
      await expect(
        predictionLogger.connect(user1).makePrediction(
          "BTC",
          0,
          55000000000,
          targetTime,
          "LSTM",
          "{}"
        )
      ).to.be.revertedWith("Current price must be greater than 0");
      
      // Past target timestamp
      await expect(
        predictionLogger.connect(user1).makePrediction(
          "BTC",
          50000000000,
          55000000000,
          currentTime - 1000,
          "LSTM",
          "{}"
        )
      ).to.be.revertedWith("Target timestamp must be in the future");
    });
    
    it("Should update user stats when making predictions", async function () {
      const currentTime = await time.latest();
      const targetTime = currentTime + 3600;
      
      await predictionLogger.connect(user1).makePrediction(
        "BTC",
        50000000000,
        55000000000,
        targetTime,
        "LSTM",
        "{}"
      );
      
      const userStats = await predictionLogger.userStats(user1.address);
      expect(userStats.totalPredictions).to.equal(1);
      expect(await predictionLogger.getUserModelTypeCount(user1.address, "LSTM")).to.equal(1);
      expect(await predictionLogger.getUserCryptoCount(user1.address, "BTC")).to.equal(1);
    });
  });
  
  describe("Resolving Predictions", function () {
    let predictionId;
    let targetTime;
    
    beforeEach(async function () {
      const currentTime = await time.latest();
      targetTime = currentTime + 3600;
      
      await predictionLogger.connect(user1).makePrediction(
        "BTC",
        50000000000,
        55000000000,
        targetTime,
        "LSTM",
        "{}"
      );
      predictionId = 1;
    });
    
    it("Should allow oracle to resolve predictions", async function () {
      // Fast forward time to target timestamp
      await time.increaseTo(targetTime);
      
      await expect(
        predictionLogger.connect(oracle).resolvePrediction(predictionId, 54000000000)
      ).to.emit(predictionLogger, "PredictionResolved");
      
      const prediction = await predictionLogger.predictions(predictionId);
      expect(prediction.isResolved).to.be.true;
      expect(prediction.actualPrice).to.equal(54000000000);
    });
    
    it("Should allow predictor to resolve their own predictions", async function () {
      await time.increaseTo(targetTime);
      
      await expect(
        predictionLogger.connect(user1).resolvePrediction(predictionId, 54000000000)
      ).to.emit(predictionLogger, "PredictionResolved");
    });
    
    it("Should reject resolution before target timestamp", async function () {
      await expect(
        predictionLogger.connect(oracle).resolvePrediction(predictionId, 54000000000)
      ).to.be.revertedWith("Cannot resolve before target timestamp");
    });
    
    it("Should reject unauthorized resolution", async function () {
      await time.increaseTo(targetTime);
      
      await expect(
        predictionLogger.connect(user2).resolvePrediction(predictionId, 54000000000)
      ).to.be.revertedWith("Not authorized to resolve prediction");
    });
    
    it("Should calculate accuracy correctly", async function () {
      // Test perfect accuracy
      expect(await predictionLogger.calculateAccuracy(50000, 50000)).to.equal(10000); // 100%
      
      // Test 10% difference (90% accuracy)
      expect(await predictionLogger.calculateAccuracy(50000, 45000)).to.equal(9000); // 90%
      
      // Test 50% difference (50% accuracy)
      expect(await predictionLogger.calculateAccuracy(50000, 25000)).to.equal(5000); // 50%
    });
    
    it("Should update user stats when resolving accurate predictions", async function () {
      await time.increaseTo(targetTime);
      
      // Resolve with price close to prediction (within 5% threshold)
      await predictionLogger.connect(oracle).resolvePrediction(predictionId, 54000000000);
      
      const userStats = await predictionLogger.userStats(user1.address);
      expect(userStats.accuratePredictions).to.equal(1);
      
      const accuracyRate = await predictionLogger.getUserAccuracyRate(user1.address);
      expect(accuracyRate).to.equal(10000); // 100% accuracy rate (1/1 accurate)
    });
  });
  
  describe("Data Retrieval", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const targetTime = currentTime + 3600;
      
      // Make multiple predictions
      await predictionLogger.connect(user1).makePrediction(
        "BTC", 50000000000, 55000000000, targetTime, "LSTM", "{}"
      );
      await predictionLogger.connect(user1).makePrediction(
        "ETH", 3000000000, 3500000000, targetTime, "Random Forest", "{}"
      );
      await predictionLogger.connect(user2).makePrediction(
        "BTC", 50000000000, 52000000000, targetTime, "LSTM", "{}"
      );
    });
    
    it("Should return user predictions", async function () {
      const user1Predictions = await predictionLogger.getUserPredictions(user1.address);
      expect(user1Predictions.length).to.equal(2);
      expect(user1Predictions[0]).to.equal(1);
      expect(user1Predictions[1]).to.equal(2);
    });
    
    it("Should return crypto predictions", async function () {
      const btcPredictions = await predictionLogger.getCryptoPredictions("BTC");
      expect(btcPredictions.length).to.equal(2);
      expect(btcPredictions[0]).to.equal(1);
      expect(btcPredictions[1]).to.equal(3);
    });
    
    it("Should return model type predictions", async function () {
      const lstmPredictions = await predictionLogger.getModelTypePredictions("LSTM");
      expect(lstmPredictions.length).to.equal(2);
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow admin to set accuracy threshold", async function () {
      await expect(
        predictionLogger.connect(owner).setAccuracyThreshold(1000)
      ).to.emit(predictionLogger, "AccuracyThresholdUpdated")
       .withArgs(500, 1000);
      
      expect(await predictionLogger.accuracyThreshold()).to.equal(1000);
    });
    
    it("Should reject setting threshold above 100%", async function () {
      await expect(
        predictionLogger.connect(owner).setAccuracyThreshold(10001)
      ).to.be.revertedWith("Threshold cannot exceed 100%");
    });
    
    it("Should allow admin to pause and unpause", async function () {
      await predictionLogger.connect(owner).pause();
      
      const currentTime = await time.latest();
      const targetTime = currentTime + 3600;
      
      await expect(
        predictionLogger.connect(user1).makePrediction(
          "BTC", 50000000000, 55000000000, targetTime, "LSTM", "{}"
        )
      ).to.be.revertedWith("Pausable: paused");
      
      await predictionLogger.connect(owner).unpause();
      
      await expect(
        predictionLogger.connect(user1).makePrediction(
          "BTC", 50000000000, 55000000000, targetTime, "LSTM", "{}"
        )
      ).to.not.be.reverted;
    });
    
    it("Should allow admin to grant and revoke oracle role", async function () {
      await predictionLogger.connect(owner).grantOracleRole(user2.address);
      expect(await predictionLogger.hasRole(await predictionLogger.ORACLE_ROLE(), user2.address)).to.be.true;
      
      await predictionLogger.connect(owner).revokeOracleRole(user2.address);
      expect(await predictionLogger.hasRole(await predictionLogger.ORACLE_ROLE(), user2.address)).to.be.false;
    });
  });
});