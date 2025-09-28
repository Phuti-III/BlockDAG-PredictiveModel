// Test the prediction API directly
async function testPredictionAPI() {
  console.log('🧪 Testing CryptoPredictor API...\n');
  
  const cryptos = ['BTC', 'ETH', 'SOL'];
  
  for (const crypto of cryptos) {
    try {
      console.log(`📊 Testing ${crypto} prediction...`);
      
      const response = await fetch(`http://localhost:3000/api/predictions?crypto=${crypto}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${crypto} Success:`);
        console.log(`   Current Price: $${data.data.currentPrice.toLocaleString()}`);
        console.log(`   Predicted Price: $${data.data.predictedPrice.toLocaleString()}`);
        console.log(`   Trend: ${data.data.trend} (${data.data.percentageChange.toFixed(2)}%)`);
        console.log(`   Confidence: ${Math.round(data.data.confidence * 100)}%`);
        console.log(`   Prediction: "${data.data.prediction}"`);
        console.log(`   Data Points: ${data.data.priceHistory.length}`);
      } else {
        console.log(`❌ ${crypto} Failed: ${data.error}`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ ${crypto} Error: ${error.message}\n`);
    }
  }
  
  console.log('🎯 Test complete! If you see predictions above, the API is working correctly.');
  console.log('🌐 Visit http://localhost:3000 to see the full dashboard.');
}

testPredictionAPI();