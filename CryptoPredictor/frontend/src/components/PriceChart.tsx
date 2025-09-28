// Price Chart Component using Recharts
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PriceData, formatTimestamp, formatPrice } from '@/lib/api';

interface PriceChartProps {
  priceHistory: PriceData[];
  predictedPrice: number;
  cryptocurrency: string;
  className?: string;
}

export default function PriceChart({ priceHistory, predictedPrice, cryptocurrency, className = "" }: PriceChartProps) {
  // Prepare chart data
  const chartData = priceHistory.map((point, index) => ({
    time: formatTimestamp(point.timestamp),
    timestamp: point.timestamp,
    actualPrice: point.price,
    // Add predicted price only to the last point
    predictedPrice: index === priceHistory.length - 1 ? predictedPrice : null,
  }));

  // Add a future point for prediction visualization
  const lastPoint = priceHistory[priceHistory.length - 1];
  if (lastPoint) {
    const futureTime = lastPoint.timestamp + (5 * 60 * 1000); // 5 minutes ahead
    chartData.push({
      time: formatTimestamp(futureTime),
      timestamp: futureTime,
      actualPrice: null,
      predictedPrice: predictedPrice,
    });
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-gray-600 rounded-lg shadow-xl">
          <p className="font-bold text-gray-900 text-base mb-2">{`Time: ${label}`}</p>
          {payload.map((entry: { dataKey: string; value: number; color: string }, index: number) => (
            <p key={index} className="font-semibold text-gray-900 text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey === 'actualPrice' ? 'Actual' : 'Predicted'}: ${formatPrice(entry.value, cryptocurrency)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full h-80 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#666666" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 13, fill: '#333333', fontWeight: 'bold' }}
            interval="preserveStartEnd"
            stroke="#333333"
          />
          <YAxis 
            tick={{ fontSize: 13, fill: '#333333', fontWeight: 'bold' }}
            tickFormatter={(value) => formatPrice(value, cryptocurrency)}
            stroke="#333333"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="actualPrice"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
            name="Actual Price"
          />
          <Line
            type="monotone"
            dataKey="predictedPrice"
            stroke="#dc2626"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: "#dc2626" }}
            connectNulls={false}
            name="Predicted Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}