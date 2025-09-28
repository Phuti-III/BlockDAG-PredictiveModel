// API utilities for fetching data
export interface PriceData {
  timestamp: number;
  price: number;
  cryptocurrency?: string;
}

export interface PredictionData {
  cryptocurrency: string;
  currentPrice: number;
  predictedPrice: number;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
  percentageChange: number;
  prediction: string;
  priceHistory: PriceData[];
  modelInfo: {
    type: string;
    shortPeriod: number;
    longPeriod: number;
    dataPoints: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

/**
 * Fetch prediction data for a given cryptocurrency
 */
export async function fetchPrediction(cryptocurrency: string): Promise<PredictionData> {
  const response = await fetch(`/api/predictions?crypto=${cryptocurrency.toUpperCase()}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to fetch prediction for ${cryptocurrency}`);
  }
  
  const result: ApiResponse<PredictionData> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Prediction failed');
  }
  
  return result.data;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, cryptocurrency: string): string {
  const decimals = cryptocurrency === 'BTC' ? 0 : cryptocurrency === 'ETH' ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);
}

/**
 * Format percentage change
 */
export function formatPercentage(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Get color for trend
 */
export function getTrendColor(trend: 'UP' | 'DOWN' | 'NEUTRAL'): string {
  switch (trend) {
    case 'UP':
      return 'text-green-500';
    case 'DOWN':
      return 'text-red-500';
    case 'NEUTRAL':
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Get background color for trend
 */
export function getTrendBgColor(trend: 'UP' | 'DOWN' | 'NEUTRAL'): string {
  switch (trend) {
    case 'UP':
      return 'bg-green-100 border-green-200';
    case 'DOWN':
      return 'bg-red-100 border-red-200';
    case 'NEUTRAL':
      return 'bg-yellow-100 border-yellow-200';
    default:
      return 'bg-gray-100 border-gray-200';
  }
}

/**
 * Supported cryptocurrencies
 */
export const SUPPORTED_CRYPTOS = [
  { value: 'BTC', label: 'Bitcoin (BTC)', symbol: '₿' },
  { value: 'ETH', label: 'Ethereum (ETH)', symbol: 'Ξ' },
  { value: 'SOL', label: 'Solana (SOL)', symbol: '◎' },
  { value: 'ADA', label: 'Cardano (ADA)', symbol: '₳' },
  { value: 'DOT', label: 'Polkadot (DOT)', symbol: '●' },
] as const;

/**
 * Get cryptocurrency info
 */
export function getCryptoInfo(crypto: string) {
  return SUPPORTED_CRYPTOS.find(c => c.value === crypto.toUpperCase()) || SUPPORTED_CRYPTOS[0];
}

/**
 * Format timestamp for chart
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}