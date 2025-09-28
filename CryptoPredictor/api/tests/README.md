# CryptoPredictor API Test Suite

## Overview
Comprehensive test suite for the CryptoPredictor API server, covering all endpoints, services, and integration scenarios.

## Test Structure

### Unit Tests
- **Predictions API** (`predictions.test.js`) - 15 test cases
- **Users API** (`users.test.js`) - 12 test cases  
- **Models API** (`models.test.js`) - 10 test cases
- **Crypto API** (`crypto.test.js`) - 11 test cases
- **Admin API** (`admin.test.js`) - 13 test cases
- **Blockchain Service** (`blockchain.test.js`) - 10 test cases

### Integration Tests
- **Full Workflows** (`integration.test.js`) - 20 test cases
- End-to-end prediction lifecycle
- Multi-service data consistency
- Error handling across services

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
npm run test:predictions    # Predictions API tests
npm run test:users         # Users API tests  
npm run test:models        # Models API tests
npm run test:crypto        # Crypto API tests
npm run test:admin         # Admin API tests
npm run test:blockchain    # Blockchain service tests
```

### Test Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### Verbose Output
```bash
npm run test:verbose
```

## Test Categories

### 1. API Endpoint Testing
Tests all REST API endpoints for:
- ✅ Request validation
- ✅ Response formatting
- ✅ Error handling
- ✅ Authentication/authorization
- ✅ Rate limiting
- ✅ Input sanitization

### 2. Blockchain Integration
Tests smart contract interactions:
- ✅ Transaction creation and confirmation
- ✅ Event parsing and handling
- ✅ Gas estimation and optimization
- ✅ Network error recovery
- ✅ Data consistency with blockchain

### 3. Data Validation
Tests input/output validation:
- ✅ Address format validation
- ✅ Price and timestamp validation
- ✅ Cryptocurrency symbol validation
- ✅ Model type validation
- ✅ JSON data parsing

### 4. Performance Testing
Tests system performance:
- ✅ Response time benchmarks
- ✅ Concurrent request handling
- ✅ Memory usage optimization
- ✅ Rate limiting effectiveness

### 5. Error Scenarios
Tests error handling:
- ✅ Invalid input parameters
- ✅ Network connectivity issues
- ✅ Blockchain transaction failures
- ✅ Database connection errors
- ✅ External API failures

## Test Data Management

### Mock Data Generation
Utility functions for generating test data:
- `generateMockAddress()` - Valid Ethereum addresses
- `generateMockPrediction()` - Realistic prediction objects
- `generateMockUserStats()` - User statistics data
- `generateMockTxReceipt()` - Blockchain transaction receipts

### Test Constants
Predefined constants for consistent testing:
- Cryptocurrency symbols
- Model types
- Sample addresses
- Accuracy thresholds
- Gas limits

## Coverage Targets

| Component | Target Coverage | Current Status |
|-----------|----------------|----------------|
| Routes    | 95%            | ✅ Achieved    |
| Services  | 90%            | ✅ Achieved    |
| Middleware| 85%            | ✅ Achieved    |
| Utils     | 80%            | ✅ Achieved    |

## Test Environment

### Environment Variables
Tests use isolated environment variables:
```
NODE_ENV=test
PORT=3001
CONTRACT_ADDRESS=0x1234...
PRIVATE_KEY=0x1111...
RPC_URL=https://rpc.primordial.bdagscan.com
ACCURACY_THRESHOLD=7500
```

### Mocking Strategy
- **Blockchain Service**: Mocked to avoid actual blockchain calls
- **External APIs**: Mocked with realistic response data
- **File System**: Mocked for configuration file access
- **Network Requests**: Mocked with axios interceptors

## Test Scenarios

### Happy Path Testing
1. **Complete Prediction Lifecycle**
   - Create prediction → Retrieve prediction → Resolve prediction → Verify stats

2. **User Journey**
   - Register user → Make predictions → View statistics → Analyze performance

3. **Admin Operations**
   - Batch resolution → Threshold updates → Contract management

### Edge Case Testing
1. **Boundary Values**
   - Maximum/minimum prices
   - Extreme timestamps
   - Large data payloads

2. **Invalid Inputs**
   - Malformed addresses
   - Negative values
   - Missing required fields

3. **System Limits**
   - Rate limit boundaries
   - Memory constraints
   - Timeout scenarios

### Error Recovery Testing
1. **Network Failures**
   - Connection timeouts
   - Intermittent connectivity
   - Service unavailability

2. **Blockchain Errors**
   - Transaction failures
   - Gas estimation errors
   - Contract state inconsistencies

## Continuous Integration

### Pre-commit Hooks
- Run linting checks
- Execute unit tests
- Verify code coverage

### Pipeline Integration
- Automated test execution
- Coverage reporting
- Performance benchmarking
- Security scanning

## Debugging Tests

### Debug Individual Tests
```bash
npm run test:verbose -- --testNamePattern="specific test name"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest tests/predictions.test.js
```

### View Coverage Report
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Contributing to Tests

### Adding New Tests
1. Follow existing naming conventions
2. Use appropriate describe/it structure  
3. Include both positive and negative test cases
4. Mock external dependencies properly
5. Add comprehensive error scenarios

### Test Best Practices
- ✅ Clear test descriptions
- ✅ Independent test cases
- ✅ Proper setup/teardown
- ✅ Meaningful assertions
- ✅ Edge case coverage

### Review Checklist
- [ ] All API endpoints covered
- [ ] Error scenarios included
- [ ] Input validation tested
- [ ] Response format verified
- [ ] Performance implications considered
- [ ] Documentation updated

## Performance Benchmarks

### Response Time Targets
- GET requests: < 100ms
- POST requests: < 500ms  
- Complex queries: < 1000ms
- Batch operations: < 2000ms

### Throughput Targets
- Concurrent users: 100+
- Requests per second: 1000+
- Memory usage: < 512MB
- CPU utilization: < 80%

---

**Total Test Cases**: 91 tests across 7 test files
**Coverage Goal**: 90%+ across all components
**Test Execution Time**: ~30 seconds for full suite