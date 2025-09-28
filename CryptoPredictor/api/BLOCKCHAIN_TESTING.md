# Blockchain Integration Testing Guide

## Overview
This guide explains how to run **real blockchain integration tests** that interact with the actual BlockDAG Primordial network. These tests create real transactions and cost real gas.

## ⚠️ Important Warnings
- **REAL GAS COSTS**: These tests consume actual BDAG tokens
- **PERMANENT DATA**: Transactions are permanently recorded on blockchain
- **BALANCE REQUIRED**: Ensure sufficient BDAG balance before testing
- **NETWORK DEPENDENCY**: Tests require stable network connection

## Prerequisites

### 1. Environment Setup
Ensure your `.env` file has all required variables:
```env
RPC_URL=https://rpc.primordial.bdagscan.com
CONTRACT_ADDRESS=0x3614a4da0Afa761CBC88ac55FCF8cA5B5435a9c7
PRIVATE_KEY=your_private_key_here
DEFAULT_PREDICTOR_ADDRESS=your_address_here
ADMIN_API_KEY=your_admin_key_here
CHAIN_ID=1043
```

### 2. BDAG Balance
- **Minimum**: 0.01 BDAG (for basic tests)
- **Recommended**: 0.1 BDAG (for comprehensive testing)

### 3. Readiness Check
Always run the readiness check first:
```bash
node check-blockchain-readiness.js
```

## Test Commands

### 1. Check Readiness (Always run first)
```bash
node check-blockchain-readiness.js
```

### 2. Dry Run (Mocked - Free)
```bash
npm run test:blockchain-dry
```

### 3. Real Blockchain Tests (Costs Gas)
```bash
npm run test:blockchain-integration
```

### 4. Alternative Real Blockchain Command
```bash
npm run test:real-blockchain
```

## Test Scenarios

### 1. Real Prediction Lifecycle
- ✅ Create real prediction on blockchain
- ✅ Retrieve prediction from blockchain
- ✅ Get user predictions
- ✅ Get user statistics

### 2. Contract Information
- ✅ Get real contract info
- ✅ Validate contract deployment
- ✅ Check prediction counter

### 3. Network Validation
- ✅ Test network connectivity
- ✅ Validate chain ID
- ✅ Check gas prices
- ✅ Validate contract deployment

## Expected Output

### Successful Test Run
```
🚀 Starting Real Blockchain Tests
💰 Initial Balance: 0.15432 BDAG
📍 Contract: 0x3614a4da0Afa761CBC88ac55FCF8cA5B5435a9c7
👤 Predictor: 0x8732F4d3F2f91BbB19F061F119F397d5cbC17d3c

📝 Creating real prediction...
✅ Real prediction created!
   Prediction ID: 123
   Transaction: 0xabc123def456...
   Block: 98765

🔍 Retrieving prediction 123...
✅ Successfully retrieved real prediction from blockchain

🏁 Real Blockchain Tests Complete
💰 Final Balance: 0.15234 BDAG
⛽ Gas Used: 0.00198 BDAG
💸 Total Cost: 0.00198 BDAG
```

## Test Structure

### Files Created
- `tests/blockchain-integration.test.js` - Main integration tests
- `tests/blockchain-setup.js` - Setup without mocks
- `jest.blockchain.config.json` - Jest config for blockchain tests
- `check-blockchain-readiness.js` - Readiness validation

### Key Features
- **Real Transaction Creation**: Creates actual blockchain transactions
- **Gas Cost Tracking**: Monitors BDAG consumption
- **Balance Validation**: Ensures sufficient funds
- **Network Verification**: Validates blockchain connectivity
- **Contract Validation**: Confirms contract deployment

## Troubleshooting

### Insufficient Balance
```
Error: Insufficient balance: 0.005 BDAG (minimum: 0.01 BDAG required)
```
**Solution**: Add more BDAG to your predictor address

### Network Connection Issues
```
Error: could not detect network
```
**Solution**: Check RPC URL and network connectivity

### Contract Not Found
```
Error: Contract not deployed at 0x...
```
**Solution**: Verify CONTRACT_ADDRESS in .env file

### Private Key Mismatch
```
Error: Private key doesn't match predictor address
```
**Solution**: Ensure PRIVATE_KEY corresponds to DEFAULT_PREDICTOR_ADDRESS

## Cost Estimation

### Typical Gas Costs
- **Create Prediction**: ~0.002 BDAG
- **Get User Stats**: ~0.0001 BDAG
- **Full Test Suite**: ~0.01 BDAG

### Balance Recommendations
- **Development**: 0.1 BDAG
- **CI/CD Pipeline**: 0.5 BDAG
- **Comprehensive Testing**: 1.0 BDAG

## Best Practices

1. **Always run readiness check first**
2. **Start with dry run tests**
3. **Monitor gas costs**
4. **Use separate test addresses**
5. **Keep test data identifiable**
6. **Clean up test predictions when possible**

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Check Blockchain Readiness
  run: node check-blockchain-readiness.js
  
- name: Run Blockchain Integration Tests
  run: npm run test:blockchain-integration
  env:
    TEST_WITH_BLOCKCHAIN: true
```

### Environment Variables for CI
Set these in your CI/CD secrets:
- `PRIVATE_KEY`
- `DEFAULT_PREDICTOR_ADDRESS`
- `ADMIN_API_KEY`

## Monitoring

Track your test costs and blockchain interactions:
- Monitor BDAG balance before/after tests
- Log transaction hashes for debugging
- Track gas usage trends
- Set up alerts for balance thresholds

## Support

If you encounter issues:
1. Check the readiness script output
2. Verify all environment variables
3. Ensure sufficient BDAG balance
4. Check BlockDAG network status
5. Review transaction logs on bdagscan.com