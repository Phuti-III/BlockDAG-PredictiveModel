// Prediction model API route for Next.js
import { NextRequest, NextResponse } from 'next/server';

interface PriceData {
  timestamp: number;
  price: number;
}

interface PredictionResult {
  cryptocurrency: string;
  currentPrice: number;
  predictedPrice: number;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
  percentageChange: number;
  prediction: string;
}

// Simple Moving Average Model
class MovingAverageModel {
  private shortPeriod: number;
  private longPeriod: number;

  constructor(shortPeriod = 3, longPeriod = 10) {
    this.shortPeriod = shortPeriod;
    this.longPeriod = longPeriod;
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const relevantPrices = prices.slice(-period);
    const sum = relevantPrices.reduce((acc, price) => acc + price, 0);
    return sum / period;
  }

  /**
   * Calculate standard deviation for confidence scoring
   */
  private calculateStandardDeviation(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((acc, price) => acc + price, 0) / prices.length;
    const squaredDifferences = prices.map(price => Math.pow(price - mean, 2));
    const variance = squaredDifferences.reduce((acc, diff) => acc + diff, 0) / prices.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate prediction based on moving averages
   */
  predict(priceData: PriceData[]): PredictionResult {
    if (priceData.length < this.longPeriod) {
      throw new Error(`Need at least ${this.longPeriod} data points for prediction`);
    }

    const prices = priceData.map(d => d.price);
    const currentPrice = prices[prices.length - 1];
    
    // Calculate moving averages
    const shortMA = this.calculateSMA(prices, this.shortPeriod);
    const longMA = this.calculateSMA(prices, this.longPeriod);
    
    // Calculate price volatility for confidence
    const recentPrices = prices.slice(-this.longPeriod);
    const volatility = this.calculateStandardDeviation(recentPrices);
    const avgPrice = recentPrices.reduce((acc, p) => acc + p, 0) / recentPrices.length;
    const volatilityRatio = volatility / avgPrice;
    
    // Confidence: lower volatility = higher confidence
    const confidence = Math.max(0.1, Math.min(0.95, 1 - (volatilityRatio * 2)));
    
    // Prediction logic: if short MA > long MA, trend is up
    const trendStrength = (shortMA - longMA) / longMA;
    const predictedPrice = currentPrice * (1 + (trendStrength * 0.5)); // Conservative prediction
    
    const percentageChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
    
    let trend: 'UP' | 'DOWN' | 'NEUTRAL';
    let prediction: string;
    
    if (Math.abs(percentageChange) < 0.5) {
      trend = 'NEUTRAL';
      prediction = `Next 5 min trend: NEUTRAL (${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}%)`;
    } else if (percentageChange > 0) {
      trend = 'UP';
      prediction = `Next 5 min trend: UP (+${percentageChange.toFixed(2)}%)`;
    } else {
      trend = 'DOWN';
      prediction = `Next 5 min trend: DOWN (${percentageChange.toFixed(2)}%)`;
    }

    return {
      cryptocurrency: priceData[0]?.cryptocurrency || 'UNKNOWN',
      currentPrice,
      predictedPrice,
      trend,
      confidence: Math.round(confidence * 100) / 100,
      percentageChange,
      prediction
    };
  }
}

// Fetch price data from your existing API
async function fetchPriceData(cryptocurrency: string): Promise<PriceData[]> {
  try {
    // Try to fetch from your existing API first
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/crypto/price/${cryptocurrency}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data.priceHistory) {
        return data.data.priceHistory.map((item: { timestamp: string; price: string | number }) => ({
          timestamp: new Date(item.timestamp).getTime(),
          price: parseFloat(item.price.toString()),
          cryptocurrency
        }));
      }
    }
  } catch (error) {
    console.warn('Failed to fetch from local API, generating mock data:', error);
  }

  // Fallback: Generate realistic mock data for demo
  return generateMockPriceData(cryptocurrency);
}

// Generate mock price data for demo purposes
function generateMockPriceData(cryptocurrency: string): PriceData[] {
  const basePrice = {
    'BTC': 45000,
    'ETH': 2800,
    'SOL': 150,
    'ADA': 0.5,
    'DOT': 8,
  }[cryptocurrency] || 100;

  const data: PriceData[] = [];
  const now = Date.now();
  let currentPrice = basePrice;

  // Generate 20 data points over the last 100 minutes
  for (let i = 19; i >= 0; i--) {
    const timestamp = now - (i * 5 * 60 * 1000); // 5-minute intervals
    
    // Add some realistic price movement
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * 2 * volatility;
    currentPrice = currentPrice * (1 + change);
    
    data.push({
      timestamp,
      price: Math.round(currentPrice * 100) / 100,
    });
  }

  return data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cryptocurrency = searchParams.get('crypto') || 'BTC';

    // Validate cryptocurrency
    const supportedCryptos = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
    if (!supportedCryptos.includes(cryptocurrency.toUpperCase())) {
      return NextResponse.json(
        { error: `Unsupported cryptocurrency: ${cryptocurrency}` },
        { status: 400 }
      );
    }

    // Fetch recent price data
    const priceData = await fetchPriceData(cryptocurrency.toUpperCase());
    
    if (priceData.length === 0) {
      return NextResponse.json(
        { error: 'No price data available' },
        { status: 500 }
      );
    }

    // Initialize and run the prediction model
    const model = new MovingAverageModel(3, 10);
    const prediction = model.predict(priceData);

    return NextResponse.json({
      success: true,
      data: {
        ...prediction,
        priceHistory: priceData,
        modelInfo: {
          type: 'Moving Average',
          shortPeriod: 3,
          longPeriod: 10,
          dataPoints: priceData.length
        }
      }
    });

  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate prediction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}