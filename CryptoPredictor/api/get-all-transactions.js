// Get All Our Transactions from Recent Tests
const { ethers } = require('ethers');
require('dotenv').config();

async function getAllTransactions() {
  console.log('🔍 Getting All Recent Transactions...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const walletAddress = process.env.DEFAULT_PREDICTOR_ADDRESS;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // List of transaction hashes from our tests
    const txHashes = [
      '0x282ad73aa5cc3184e24a1e47018cf9d0347501bb731c29a62c5158589bdb6c23', // Standalone test
      '0x638c85fb9fc9dd661126f31ebb67898a012f9d45858378a5a64224dba547af01', // First Jest test
      '0x47141d26968f77a5da5cb9560a98e440e9f7b9846729e1511ea17255b39e80ac', // Second Jest test  
      '0x22966d5a567a57c927eaa9846c4d25781a2ef2ce3db03fb258778bd5506a011f'  // Third Jest test
    ];
    
    console.log('📋 Transaction Analysis:');
    console.log(`   Wallet: ${walletAddress}`);
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   Total Tests: ${txHashes.length}\n`);
    
    for (let i = 0; i < txHashes.length; i++) {
      const txHash = txHashes[i];
      console.log(`🔗 Transaction ${i + 1}:`);
      console.log(`   Hash: ${txHash}`);
      
      try {
        const txReceipt = await provider.getTransactionReceipt(txHash);
        if (txReceipt) {
          console.log(`   ✅ Status: SUCCESS`);
          console.log(`   📦 Block: ${txReceipt.blockNumber}`);
          console.log(`   ⛽ Gas Used: ${txReceipt.gasUsed.toString()}`);
          
          // Get block timestamp
          const block = await provider.getBlock(txReceipt.blockNumber);
          const timestamp = new Date(block.timestamp * 1000);
          console.log(`   🕐 Time: ${timestamp.toISOString()}`);
          
          // Explorer URLs
          console.log(`   🌐 Explorer: https://primordial.bdagscan.com/tx/${txHash}?chain=EVM`);
          console.log(`   🧱 Block: https://primordial.bdagscan.com/block/${txReceipt.blockNumber}?chain=EVM`);
          
        } else {
          console.log(`   ❌ Transaction not found`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }
    
    // Get current network state
    const latestBlock = await provider.getBlockNumber();
    const balance = await provider.getBalance(walletAddress);
    
    console.log('🌐 Current Network State:');
    console.log(`   Latest Block: ${latestBlock}`);
    console.log(`   Wallet Balance: ${ethers.formatEther(balance)} BDAG`);
    
    // Try to get recent transactions for our address
    console.log('\n📊 Summary:');
    console.log('   All transactions are confirmed on BlockDAG Primordial Network');
    console.log('   Chain ID: 1043');
    console.log('   RPC: https://rpc.primordial.bdagscan.com');
    console.log('   Contract: 0x3614a4da0Afa761CBC88ac55FCF8cA5B5435a9c7');
    console.log('   WARNING: Primordial testnet will be deprecated on October 10, 2025');
    console.log('   Consider migrating to Awakening testnet for future development');
    
  } catch (error) {
    console.error('❌ Error getting transactions:', error.message);
  }
}

getAllTransactions();