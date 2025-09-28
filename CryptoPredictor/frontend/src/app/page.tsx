// CryptoPredictor Dashboard - Main Page
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@heroui/react";
import CryptoSelector from '@/components/CryptoSelector';
import PriceChart from '@/components/PriceChart';
import PredictionDisplay from '@/components/PredictionDisplay';
import PredictionCard from '@/components/PredictionCard';
import Loading from '@/components/Loading';
import { fetchPrediction, PredictionData } from '@/lib/api';

export default function Home() {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch prediction data
  const loadPrediction = async (crypto: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching prediction for ${crypto}...`);
      const data = await fetchPrediction(crypto);
      setPredictionData(data);
      setLastUpdated(new Date());
      console.log('Prediction data loaded successfully:', data);
    } catch (err) {
      console.error('Failed to load prediction:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prediction');
      setPredictionData(null);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadPrediction(selectedCrypto);
  }, [selectedCrypto]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        loadPrediction(selectedCrypto);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedCrypto, loading]);

  const handleCryptoChange = (crypto: string) => {
    console.log(`Crypto changed to: ${crypto}`);
    setSelectedCrypto(crypto);
  };

  const handleRefresh = () => {
    loadPrediction(selectedCrypto);
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 CryptoPredictor Dashboard
          </h1>
          <p className="text-lg text-gray-700 font-medium">
            AI-powered cryptocurrency price predictions using advanced moving average models
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <CryptoSelector
            selectedCrypto={selectedCrypto}
            onSelectionChange={handleCryptoChange}
            isDisabled={loading}
          />
          
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <Button
              color="primary"
              variant="solid"
              onClick={handleRefresh}
              isDisabled={loading}
              className="bg-blue-600 text-white font-semibold hover:bg-blue-700 border-2 border-blue-600"
            >
              {loading ? '🔄 Updating...' : '🔄 Refresh'}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && !predictionData && (
          <PredictionCard title="Loading Prediction...">
            <div className="flex justify-center py-8">
              <Loading />
            </div>
            <p className="text-center text-gray-600 mt-4">
              Analyzing {selectedCrypto} price data and generating predictions...
            </p>
          </PredictionCard>
        )}

        {/* Error State */}
        {error && !loading && (
          <PredictionCard title="⚠️ Error" className="bg-red-50 border-2 border-red-300">
            <div className="text-center py-6">
              <p className="text-red-800 font-semibold mb-6 text-lg">{error}</p>
              <Button 
                color="danger" 
                variant="solid"
                onClick={handleRefresh}
                className="bg-red-600 text-white font-semibold hover:bg-red-700 border-2 border-red-600"
              >
                🔄 Try Again
              </Button>
            </div>
          </PredictionCard>
        )}

        {/* Main Dashboard Content */}
        {predictionData && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              <PredictionCard title={`${selectedCrypto} Price Chart & Prediction`}>
                <PriceChart
                  priceHistory={predictionData.priceHistory}
                  predictedPrice={predictionData.predictedPrice}
                  cryptocurrency={selectedCrypto}
                />
                <div className="mt-4 text-sm text-gray-600 text-center">
                  <p>Blue line: Actual prices | Red dashed line: Predicted price</p>
                  <p>Prediction horizon: Next 5 minutes</p>
                </div>
              </PredictionCard>
            </div>

            {/* Prediction Details - Takes up 1 column */}
            <div className="space-y-6">
              <PredictionDisplay
                cryptocurrency={predictionData.cryptocurrency}
                currentPrice={predictionData.currentPrice}
                predictedPrice={predictionData.predictedPrice}
                trend={predictionData.trend}
                confidence={predictionData.confidence}
                percentageChange={predictionData.percentageChange}
                prediction={predictionData.prediction}
                modelInfo={predictionData.modelInfo}
              />
            </div>
          </div>
        )}

        {/* Demo Notice */}
        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-300 rounded-xl">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">📢 Hackathon Demo Notice</h3>
          <p className="text-blue-800 font-medium">
            This is a <strong>hackathon demonstration</strong> using a moving average prediction model. 
            For production use, consider more sophisticated ML models and real-time data feeds.
            <br /><br />
            ⚠️ <strong>The predictions are for demonstration purposes only</strong> and should not be used for actual trading decisions.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-700 border-t-2 border-gray-200 pt-6">
          <p className="font-semibold text-base">
            🚀 CryptoPredictor - Built with Next.js, TypeScript, and HeroUI
          </p>
          <p className="mt-2 text-gray-600 font-medium">
            🤖 Powered by Moving Average ML Model | 🔄 Auto-refresh every 30 seconds
          </p>
        </footer>
      </div>
    </div>
  );
}
