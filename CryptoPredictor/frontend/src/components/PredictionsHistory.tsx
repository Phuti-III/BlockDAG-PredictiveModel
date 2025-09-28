// Predictions History Table Component (Optional Feature)
"use client";

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@heroui/react";
import PredictionCard from './PredictionCard';
import { formatPrice, formatPercentage } from '@/lib/api';

interface PredictionHistoryItem {
  id: string;
  timestamp: Date;
  cryptocurrency: string;
  predictedPrice: number;
  actualPrice?: number;
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  percentageChange: number;
  confidence: number;
  outcome?: 'CORRECT' | 'INCORRECT' | 'PENDING';
}

interface PredictionsHistoryProps {
  predictions: PredictionHistoryItem[];
  className?: string;
}

export default function PredictionsHistory({ predictions, className = "" }: PredictionsHistoryProps) {
  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'CORRECT':
        return 'success';
      case 'INCORRECT':
        return 'danger';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const columns = [
    { name: "TIME", uid: "time" },
    { name: "CRYPTO", uid: "crypto" },
    { name: "PREDICTION", uid: "prediction" },
    { name: "TREND", uid: "trend" },
    { name: "CONFIDENCE", uid: "confidence" },
    { name: "OUTCOME", uid: "outcome" },
  ];

  const renderCell = (prediction: PredictionHistoryItem, columnKey: React.Key) => {
    switch (columnKey) {
      case "time":
        return (
          <div className="text-small">
            {prediction.timestamp.toLocaleTimeString()}
          </div>
        );
      case "crypto":
        return (
          <div className="font-semibold">
            {prediction.cryptocurrency}
          </div>
        );
      case "prediction":
        return (
          <div>
            <div className="text-small">
              {formatPrice(prediction.predictedPrice, prediction.cryptocurrency)}
            </div>
            {prediction.actualPrice && (
              <div className="text-tiny text-gray-500">
                Actual: {formatPrice(prediction.actualPrice, prediction.cryptocurrency)}
              </div>
            )}
          </div>
        );
      case "trend":
        return (
          <Chip
            className="capitalize"
            color={prediction.trend === 'UP' ? 'success' : prediction.trend === 'DOWN' ? 'danger' : 'warning'}
            size="sm"
            variant="flat"
          >
            {prediction.trend} {formatPercentage(prediction.percentageChange)}
          </Chip>
        );
      case "confidence":
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full"
                style={{ width: `${prediction.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-tiny">{Math.round(prediction.confidence * 100)}%</span>
          </div>
        );
      case "outcome":
        return (
          <Chip
            className="capitalize"
            color={getOutcomeColor(prediction.outcome) as "success" | "danger" | "warning" | "default"}
            size="sm"
            variant="flat"
          >
            {prediction.outcome || 'PENDING'}
          </Chip>
        );
      default:
        return null;
    }
  };

  if (predictions.length === 0) {
    return (
      <PredictionCard title="Predictions History" className={className}>
        <div className="text-center py-8 text-gray-500">
          <p>No prediction history available yet.</p>
          <p className="text-small mt-2">
            Predictions will appear here as you use the dashboard.
          </p>
        </div>
      </PredictionCard>
    );
  }

  return (
    <PredictionCard title="Predictions History" className={className}>
      <Table 
        aria-label="Predictions history table"
        classNames={{
          table: "min-h-[200px]",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align={column.uid === "outcome" ? "center" : "start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={predictions}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="mt-4 text-small text-gray-600">
        <p>
          Showing {predictions.length} recent predictions. 
          Outcomes are determined by comparing predictions with actual prices after 5 minutes.
        </p>
      </div>
    </PredictionCard>
  );
}