// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PredictionLogger is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // Prediction information structure
    struct Prediction {
        uint256 id;
        address predictor;
        string cryptocurrency; // e.g., "BTC", "ETH", "BLOCKDAG"
        uint256 currentPrice; // Price at time of prediction (in wei/smallest unit)
        uint256 predictedPrice; // Predicted future price
        uint256 predictionTimestamp;
        uint256 targetTimestamp; // When prediction should be evaluated
        string modelType; // e.g., "LSTM", "Random Forest", "Technical Analysis"
        bool isResolved;
        uint256 actualPrice; // Actual price at target timestamp
        bool wasAccurate; // Whether prediction was within acceptable range
        uint256 accuracyPercentage; // How accurate the prediction was (0-10000 basis points)
        string additionalData; // JSON string for extra prediction metadata
    }
    
    // User statistics structure
    struct UserStats {
        uint256 totalPredictions;
        uint256 accuratePredictions;
        uint256 totalAccuracyScore; // Sum of all accuracy percentages
        mapping(string => uint256) modelTypeCount; // Count per model type
        mapping(string => uint256) cryptoCount; // Count per cryptocurrency
    }
    
    // Model performance structure
    struct ModelPerformance {
        uint256 totalPredictions;
        uint256 accuratePredictions;
        uint256 totalAccuracyScore;
        mapping(string => uint256) cryptoPerformance; // Accuracy per crypto
    }
    
    // Storage mappings
    mapping(uint256 => Prediction) public predictions;
    mapping(address => UserStats) public userStats;
    mapping(address => uint256[]) public userPredictions;
    mapping(string => ModelPerformance) public modelPerformance;
    mapping(string => uint256[]) public cryptoPredictions;
    mapping(string => uint256[]) public modelTypePredictions;
    
    // Counters and settings
    uint256 public predictionCounter;
    uint256 public accuracyThreshold = 500; // 5% threshold (500 basis points)
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    
    // Events
    event PredictionMade(
        uint256 indexed predictionId,
        address indexed predictor,
        string cryptocurrency,
        uint256 currentPrice,
        uint256 predictedPrice,
        uint256 targetTimestamp,
        string modelType
    );
    
    event PredictionResolved(
        uint256 indexed predictionId,
        address indexed predictor,
        uint256 actualPrice,
        bool wasAccurate,
        uint256 accuracyPercentage
    );
    
    event AccuracyThresholdUpdated(
        uint256 oldThreshold,
        uint256 newThreshold
    );
    
    event UserStatsUpdated(
        address indexed user,
        uint256 totalPredictions,
        uint256 accuratePredictions
    );
    
    // Modifiers
    modifier predictionExists(uint256 predictionId) {
        require(predictionId > 0 && predictionId <= predictionCounter, "Prediction does not exist");
        _;
    }
    
    modifier onlyPredictor(uint256 predictionId) {
        require(predictions[predictionId].predictor == msg.sender, "Not the predictor");
        _;
    }
    
    modifier notResolved(uint256 predictionId) {
        require(!predictions[predictionId].isResolved, "Prediction already resolved");
        _;
    }
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }
    
    /**
     * @dev Make a new prediction
     * @param cryptocurrency The cryptocurrency symbol
     * @param currentPrice Current price of the cryptocurrency
     * @param predictedPrice Predicted future price
     * @param targetTimestamp When the prediction should be evaluated
     * @param modelType The AI/ML model used for prediction
     * @param additionalData Additional metadata as JSON string
     */
    function makePrediction(
        string memory cryptocurrency,
        uint256 currentPrice,
        uint256 predictedPrice,
        uint256 targetTimestamp,
        string memory modelType,
        string memory additionalData
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(bytes(cryptocurrency).length > 0, "Cryptocurrency cannot be empty");
        require(currentPrice > 0, "Current price must be greater than 0");
        require(predictedPrice > 0, "Predicted price must be greater than 0");
        require(targetTimestamp > block.timestamp, "Target timestamp must be in the future");
        require(bytes(modelType).length > 0, "Model type cannot be empty");
        
        predictionCounter++;
        uint256 predictionId = predictionCounter;
        
        predictions[predictionId] = Prediction({
            id: predictionId,
            predictor: msg.sender,
            cryptocurrency: cryptocurrency,
            currentPrice: currentPrice,
            predictedPrice: predictedPrice,
            predictionTimestamp: block.timestamp,
            targetTimestamp: targetTimestamp,
            modelType: modelType,
            isResolved: false,
            actualPrice: 0,
            wasAccurate: false,
            accuracyPercentage: 0,
            additionalData: additionalData
        });
        
        // Update user stats
        userStats[msg.sender].totalPredictions++;
        userStats[msg.sender].modelTypeCount[modelType]++;
        userStats[msg.sender].cryptoCount[cryptocurrency]++;
        
        // Update tracking arrays
        userPredictions[msg.sender].push(predictionId);
        cryptoPredictions[cryptocurrency].push(predictionId);
        modelTypePredictions[modelType].push(predictionId);
        
        // Update model performance
        modelPerformance[modelType].totalPredictions++;
        
        emit PredictionMade(
            predictionId,
            msg.sender,
            cryptocurrency,
            currentPrice,
            predictedPrice,
            targetTimestamp,
            modelType
        );
        
        return predictionId;
    }
    
    /**
     * @dev Resolve a prediction with actual price data
     * @param predictionId ID of the prediction to resolve
     * @param actualPrice The actual price at target timestamp
     */
    function resolvePrediction(
        uint256 predictionId,
        uint256 actualPrice
    ) external predictionExists(predictionId) notResolved(predictionId) {
        require(
            hasRole(ORACLE_ROLE, msg.sender) || 
            predictions[predictionId].predictor == msg.sender,
            "Not authorized to resolve prediction"
        );
        require(actualPrice > 0, "Actual price must be greater than 0");
        require(
            block.timestamp >= predictions[predictionId].targetTimestamp,
            "Cannot resolve before target timestamp"
        );
        
        Prediction storage prediction = predictions[predictionId];
        prediction.actualPrice = actualPrice;
        prediction.isResolved = true;
        
        // Calculate accuracy
        uint256 accuracyPercentage = calculateAccuracy(
            prediction.predictedPrice,
            actualPrice
        );
        prediction.accuracyPercentage = accuracyPercentage;
        
        // Determine if prediction was accurate based on threshold
        bool wasAccurate = accuracyPercentage >= (BASIS_POINTS - accuracyThreshold);
        prediction.wasAccurate = wasAccurate;
        
        // Update user stats
        UserStats storage stats = userStats[prediction.predictor];
        if (wasAccurate) {
            stats.accuratePredictions++;
        }
        stats.totalAccuracyScore += accuracyPercentage;
        
        // Update model performance
        ModelPerformance storage modelPerf = modelPerformance[prediction.modelType];
        if (wasAccurate) {
            modelPerf.accuratePredictions++;
        }
        modelPerf.totalAccuracyScore += accuracyPercentage;
        
        emit PredictionResolved(
            predictionId,
            prediction.predictor,
            actualPrice,
            wasAccurate,
            accuracyPercentage
        );
        
        emit UserStatsUpdated(
            prediction.predictor,
            stats.totalPredictions,
            stats.accuratePredictions
        );
    }
    
    /**
     * @dev Calculate accuracy percentage between predicted and actual price
     * @param predictedPrice The predicted price
     * @param actualPrice The actual price
     * @return accuracy percentage in basis points (10000 = 100%)
     */
    function calculateAccuracy(
        uint256 predictedPrice,
        uint256 actualPrice
    ) public pure returns (uint256) {
        if (predictedPrice == actualPrice) {
            return BASIS_POINTS; // 100% accurate
        }
        
        uint256 difference;
        if (predictedPrice > actualPrice) {
            difference = predictedPrice - actualPrice;
        } else {
            difference = actualPrice - predictedPrice;
        }
        
        // Calculate percentage difference
        uint256 percentageDifference = (difference * BASIS_POINTS) / actualPrice;
        
        // Return accuracy (100% - percentage difference)
        if (percentageDifference >= BASIS_POINTS) {
            return 0; // 0% accurate if difference is 100% or more
        }
        
        return BASIS_POINTS - percentageDifference;
    }
    
    /**
     * @dev Get user's prediction history
     * @param user Address of the user
     * @return Array of prediction IDs
     */
    function getUserPredictions(address user) external view returns (uint256[] memory) {
        return userPredictions[user];
    }
    
    /**
     * @dev Get predictions for a specific cryptocurrency
     * @param cryptocurrency The cryptocurrency symbol
     * @return Array of prediction IDs
     */
    function getCryptoPredictions(string memory cryptocurrency) external view returns (uint256[] memory) {
        return cryptoPredictions[cryptocurrency];
    }
    
    /**
     * @dev Get predictions for a specific model type
     * @param modelType The model type
     * @return Array of prediction IDs
     */
    function getModelTypePredictions(string memory modelType) external view returns (uint256[] memory) {
        return modelTypePredictions[modelType];
    }
    
    /**
     * @dev Get user's accuracy rate
     * @param user Address of the user
     * @return accuracy rate in basis points
     */
    function getUserAccuracyRate(address user) external view returns (uint256) {
        UserStats storage stats = userStats[user];
        if (stats.totalPredictions == 0) {
            return 0;
        }
        return (stats.accuratePredictions * BASIS_POINTS) / stats.totalPredictions;
    }
    
    /**
     * @dev Get user's average accuracy score
     * @param user Address of the user
     * @return average accuracy score in basis points
     */
    function getUserAverageAccuracy(address user) external view returns (uint256) {
        UserStats storage stats = userStats[user];
        if (stats.totalPredictions == 0) {
            return 0;
        }
        return stats.totalAccuracyScore / stats.totalPredictions;
    }
    
    /**
     * @dev Get model's accuracy rate
     * @param modelType The model type
     * @return accuracy rate in basis points
     */
    function getModelAccuracyRate(string memory modelType) external view returns (uint256) {
        ModelPerformance storage performance = modelPerformance[modelType];
        if (performance.totalPredictions == 0) {
            return 0;
        }
        return (performance.accuratePredictions * BASIS_POINTS) / performance.totalPredictions;
    }
    
    /**
     * @dev Get model's average accuracy score
     * @param modelType The model type
     * @return average accuracy score in basis points
     */
    function getModelAverageAccuracy(string memory modelType) external view returns (uint256) {
        ModelPerformance storage performance = modelPerformance[modelType];
        if (performance.totalPredictions == 0) {
            return 0;
        }
        return performance.totalAccuracyScore / performance.totalPredictions;
    }
    
    /**
     * @dev Get user's prediction count for a specific model type
     * @param user Address of the user
     * @param modelType The model type
     * @return count of predictions
     */
    function getUserModelTypeCount(address user, string memory modelType) external view returns (uint256) {
        return userStats[user].modelTypeCount[modelType];
    }
    
    /**
     * @dev Get user's prediction count for a specific cryptocurrency
     * @param user Address of the user
     * @param cryptocurrency The cryptocurrency symbol
     * @return count of predictions
     */
    function getUserCryptoCount(address user, string memory cryptocurrency) external view returns (uint256) {
        return userStats[user].cryptoCount[cryptocurrency];
    }
    
    // Admin functions
    
    /**
     * @dev Set the accuracy threshold for determining if a prediction is accurate
     * @param newThreshold New threshold in basis points
     */
    function setAccuracyThreshold(uint256 newThreshold) external onlyRole(ADMIN_ROLE) {
        require(newThreshold <= BASIS_POINTS, "Threshold cannot exceed 100%");
        uint256 oldThreshold = accuracyThreshold;
        accuracyThreshold = newThreshold;
        emit AccuracyThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Grant oracle role to an address
     * @param oracle Address to grant oracle role
     */
    function grantOracleRole(address oracle) external onlyRole(ADMIN_ROLE) {
        _grantRole(ORACLE_ROLE, oracle);
    }
    
    /**
     * @dev Revoke oracle role from an address
     * @param oracle Address to revoke oracle role
     */
    function revokeOracleRole(address oracle) external onlyRole(ADMIN_ROLE) {
        _revokeRole(ORACLE_ROLE, oracle);
    }
}