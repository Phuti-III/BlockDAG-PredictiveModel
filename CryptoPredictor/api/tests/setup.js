// Global test setup for all test suites

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
process.env.PRIVATE_KEY = '0x' + '1'.repeat(64);
process.env.RPC_URL = 'https://rpc.primordial.bdagscan.com';
process.env.ACCURACY_THRESHOLD = '7500';
process.env.ADMIN_API_KEY = 'test-admin-key';

// Mock blockchain service methods with realistic implementations
const mockBlockchainService = {
  initialize: jest.fn().mockResolvedValue(true),
  
  makePrediction: jest.fn().mockResolvedValue({
    receipt: {
      hash: '0xabc123',
      blockNumber: 12345,
      gasUsed: { toString: () => '150000' }
    },
    prediction: {
      id: 1,
      user: '0x1234567890123456789012345678901234567890',
      cryptocurrency: 'BTC',
      currentPrice: 45000,
      predictedPrice: 50000,
      targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
      modelType: 'TECHNICAL_ANALYSIS',
      resolved: false
    }
  }),
  
  resolvePrediction: jest.fn().mockResolvedValue({
    receipt: {
      hash: '0xdef456',
      blockNumber: 12346,
      gasUsed: { toString: () => '100000' }
    },
    correct: true,
    accuracyBasisPoints: 8500
  }),
  
  getPrediction: jest.fn().mockResolvedValue({
    id: 1,
    user: '0x1234567890123456789012345678901234567890',
    cryptocurrency: 'BTC',
    currentPrice: 45000,
    predictedPrice: 50000,
    targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
    modelType: 'TECHNICAL_ANALYSIS',
    resolved: false,
    correct: false,
    actualPrice: 0
  }),
  
  getUserPredictions: jest.fn().mockResolvedValue([
    {
      id: 1,
      user: '0x1234567890123456789012345678901234567890',
      cryptocurrency: 'BTC',
      currentPrice: 45000,
      predictedPrice: 50000,
      targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
      predictionTimestamp: Math.floor(Date.now() / 1000) - 3600,
      modelType: 'TECHNICAL_ANALYSIS',
      isResolved: false,
      resolved: false,
      correct: false,
      wasAccurate: false,
      actualPrice: 0,
      accuracyPercentage: '0'
    },
    {
      id: 2,
      user: '0x1234567890123456789012345678901234567890',
      cryptocurrency: 'ETH',
      currentPrice: 3000,
      predictedPrice: 3200,
      targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
      predictionTimestamp: Math.floor(Date.now() / 1000) - 7200,
      modelType: 'LSTM',
      isResolved: true,
      resolved: true,
      correct: true,
      wasAccurate: true,
      actualPrice: 3150,
      accuracyPercentage: '85'
    }
  ]),
  
  getCryptoPredictions: jest.fn().mockResolvedValue([
    {
      id: 1,
      user: '0x1234567890123456789012345678901234567890',
      predictor: '0x1234567890123456789012345678901234567890',
      cryptocurrency: 'BTC',
      currentPrice: 45000,
      predictedPrice: 50000,
      targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
      predictionTimestamp: Math.floor(Date.now() / 1000) - 3600,
      modelType: 'TECHNICAL_ANALYSIS',
      isResolved: false,
      resolved: false,
      correct: false,
      wasAccurate: false,
      actualPrice: 0,
      accuracyPercentage: '0'
    }
  ]),
  
  getModelTypePredictions: jest.fn().mockResolvedValue([
    {
      id: 1,
      user: '0x1234567890123456789012345678901234567890',
      predictor: '0x1234567890123456789012345678901234567890',
      modelType: 'TECHNICAL_ANALYSIS',
      cryptocurrency: 'BTC',
      currentPrice: 45000,
      predictedPrice: 50000,
      targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
      predictionTimestamp: Math.floor(Date.now() / 1000) - 3600,
      isResolved: false,
      resolved: false,
      correct: false,
      wasAccurate: false,
      actualPrice: 0,
      accuracyPercentage: '0'
    }
  ]),
  
  getUserStats: jest.fn().mockResolvedValue({
    user: '0x1234567890123456789012345678901234567890',
    totalPredictions: 10,
    correctPredictions: 7,
    accuratePredictions: 7,
    totalAccuracyScore: 75000,
    accuracyRate: 7000,
    averageAccuracy: 7500,
    totalReward: 100,
    isActive: true
  }),
  
  getUserModelTypeCount: jest.fn().mockResolvedValue(5),
  getUserCryptoCount: jest.fn().mockResolvedValue(3),
  
  getModelAccuracyRate: jest.fn().mockResolvedValue(7500),
  getModelAverageAccuracy: jest.fn().mockResolvedValue(7800),
  
  calculateAccuracy: jest.fn().mockImplementation((predicted, actual) => {
    const diff = Math.abs(predicted - actual);
    const accuracy = Math.max(0, 10000 - Math.floor((diff / predicted) * 10000));
    return {
      accuracyBasisPoints: accuracy,
      accuracyPercentage: (accuracy / 100).toFixed(2) + '%'
    };
  }),
  
  getPredictionCounter: jest.fn().mockResolvedValue(100),
  getAccuracyThreshold: jest.fn().mockResolvedValue(7500),
  
  setAccuracyThreshold: jest.fn().mockResolvedValue({
    receipt: {
      hash: '0xghi789',
      blockNumber: 12347,
      gasUsed: { toString: () => '50000' }
    }
  }),
  
  pauseContract: jest.fn().mockResolvedValue({
    receipt: {
      hash: '0xjkl012',
      blockNumber: 12348,
      gasUsed: { toString: () => '30000' }
    }
  }),
  
  unpauseContract: jest.fn().mockResolvedValue({
    receipt: {
      hash: '0xmno345',
      blockNumber: 12349,
      gasUsed: { toString: () => '30000' }
    }
  }),
  
  grantOracleRole: jest.fn().mockResolvedValue({
    receipt: {
      hash: '0xpqr678',
      blockNumber: 12350,
      gasUsed: { toString: () => '40000' }
    }
  }),
  
  revokeOracleRole: jest.fn().mockResolvedValue({
    receipt: {
      hash: '0xstu901',
      blockNumber: 12351,
      gasUsed: { toString: () => '40000' }
    }
  })
};

jest.mock('../services/blockchain', () => mockBlockchainService);

// Mock axios for external API calls (conditionally)
try {
  jest.mock('axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    }))
  }));
} catch (error) {
  // Axios mock optional for now
}

// Console suppress for cleaner test output
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console logs during tests
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console
  Object.assign(console, originalConsole);
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Generate mock user address
  generateMockAddress: () => {
    return '0x' + Math.random().toString(16).substr(2, 40).padStart(40, '0');
  },

  // Generate mock prediction data
  generateMockPrediction: () => ({
    id: Math.floor(Math.random() * 1000000),
    user: global.testUtils.generateMockAddress(),
    cryptocurrency: 'BTC',
    currentPrice: Math.floor(Math.random() * 50000) + 20000,
    predictedPrice: Math.floor(Math.random() * 50000) + 20000,
    timestamp: Math.floor(Date.now() / 1000),
    targetTimestamp: Math.floor(Date.now() / 1000) + 86400,
    modelType: 'TECHNICAL_ANALYSIS',
    resolved: false,
    correct: false,
    actualPrice: 0,
    additionalData: JSON.stringify({ confidence: 0.85 })
  }),

  // Generate mock user stats
  generateMockUserStats: () => ({
    user: global.testUtils.generateMockAddress(),
    totalPredictions: Math.floor(Math.random() * 100),
    correctPredictions: Math.floor(Math.random() * 50),
    accuratePredictions: Math.floor(Math.random() * 50),
    accuracyRate: Math.floor(Math.random() * 10000),
    totalAccuracyScore: Math.floor(Math.random() * 100000),
    averageAccuracy: Math.floor(Math.random() * 10000),
    totalReward: Math.floor(Math.random() * 1000),
    isActive: true
  }),

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock blockchain transaction receipt
  generateMockTxReceipt: () => ({
    hash: '0x' + Math.random().toString(16).substr(2, 64),
    blockNumber: Math.floor(Math.random() * 1000000),
    gasUsed: { toString: () => '150000' },
    status: 1
  }),

  // Mock prediction event
  generateMockPredictionEvent: () => ({
    args: {
      predictionId: Math.floor(Math.random() * 1000000),
      user: global.testUtils.generateMockAddress(),
      cryptocurrency: 'ETH',
      predictedPrice: Math.floor(Math.random() * 5000) + 1000,
      targetTimestamp: Math.floor(Date.now() / 1000) + 86400
    }
  })
};

// Global test constants
global.testConstants = {
  CRYPTOCURRENCIES: ['BTC', 'ETH', 'BDAG', 'ADA', 'DOT'],
  MODEL_TYPES: ['TECHNICAL_ANALYSIS', 'SENTIMENT_ANALYSIS', 'MACHINE_LEARNING', 'FUNDAMENTAL_ANALYSIS'],
  SAMPLE_ADDRESSES: [
    '0x1234567890123456789012345678901234567890',
    '0x0987654321098765432109876543210987654321',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  ],
  DEFAULT_ACCURACY_THRESHOLD: 7500,
  DEFAULT_GAS_LIMIT: 300000,
  TEST_TIMEOUT: 30000
};