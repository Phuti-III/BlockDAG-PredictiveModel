// Enhanced Card component for predictions
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ReactNode } from "react";

interface PredictionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function PredictionCard({ title, children, className = "" }: PredictionCardProps) {
  return (
    <Card className={`w-full border-2 border-gray-200 shadow-lg ${className}`}>
      <CardHeader className="pb-2 pt-6 px-6 flex-col items-start bg-gray-50 border-b border-gray-200">
        <h4 className="font-bold text-xl text-gray-900">{title}</h4>
      </CardHeader>
      <CardBody className="overflow-visible py-6 px-6 bg-white">
        {children}
      </CardBody>
    </Card>
  );
}