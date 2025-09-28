// Prediction Display Component
"use client";

import { Chip } from "@heroui/react";
import PredictionCard from "./PredictionCard";
import { formatPrice, formatPercentage, getTrendColor, getTrendBgColor } from '@/lib/api';

interface PredictionDisplayProps {
  cryptocurrency: string;
  currentPrice: number;
  predictedPrice: number;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
  percentageChange: number;
  prediction: string;
  modelInfo: {
    type: string;
    shortPeriod: number;
    longPeriod: number;
    dataPoints: number;
  };
}

export default function PredictionDisplay({
  cryptocurrency,
  currentPrice,
  predictedPrice,
  trend,
  confidence,
  percentageChange,
  prediction,
  modelInfo
}: PredictionDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Main Prediction Card */}
      <PredictionCard title="Latest Prediction" className={getTrendBgColor(trend)}>
        <div className="space-y-4">
          {/* Prediction Text */}
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 bg-gray-100 p-4 rounded-lg border">{prediction}</p>
          </div>

          {/* Price Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm font-semibold text-gray-700 mb-2">Current Price</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(currentPrice, cryptocurrency)}</p>
            </div>
            <div className="text-center bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm font-semibold text-gray-700 mb-2">Predicted Price</p>
              <p className={`text-2xl font-bold ${getTrendColor(trend)}`}>
                {formatPrice(predictedPrice, cryptocurrency)}
              </p>
            </div>
          </div>

          {/* Trend and Change */}
          <div className="flex justify-center items-center gap-4">
            <Chip
              color={trend === 'UP' ? 'success' : trend === 'DOWN' ? 'danger' : 'warning'}
              variant="flat"
              size="lg"
            >
              {trend} {formatPercentage(percentageChange)}
            </Chip>
          </div>

          {/* Confidence */}
          <div className="text-center bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <p className="text-base font-semibold text-gray-800 mb-3">Confidence Level</p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-40 bg-gray-300 rounded-full h-4 border border-gray-400">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500 border-r border-blue-700"
                  style={{ width: `${confidence * 100}%` }}
                ></div>
              </div>
              <span className="text-lg font-bold text-gray-900">{Math.round(confidence * 100)}%</span>
            </div>
          </div>
        </div>
      </PredictionCard>

      {/* Model Information */}
      <PredictionCard title="Model Information">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Model Type:</span>
            <span className="font-medium">{modelInfo.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Short Period:</span>
            <span className="font-medium">{modelInfo.shortPeriod} points</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Long Period:</span>
            <span className="font-medium">{modelInfo.longPeriod} points</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data Points:</span>
            <span className="font-medium">{modelInfo.dataPoints}</span>
          </div>
        </div>
      </PredictionCard>
    </div>
  );
}