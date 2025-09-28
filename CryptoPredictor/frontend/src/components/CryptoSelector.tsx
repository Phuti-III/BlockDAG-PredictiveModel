// Cryptocurrency Selector Component
"use client";

import { Select, SelectItem } from "@heroui/react";
import { SUPPORTED_CRYPTOS } from '@/lib/api';

interface CryptoSelectorProps {
  selectedCrypto: string;
  onSelectionChange: (crypto: string) => void;
  isDisabled?: boolean;
}

export default function CryptoSelector({ selectedCrypto, onSelectionChange, isDisabled = false }: CryptoSelectorProps) {
  return (
    <Select
      label="Select Cryptocurrency"
      placeholder="Choose a crypto to analyze"
      selectedKeys={[selectedCrypto]}
      className="max-w-xs"
      classNames={{
        trigger: "bg-white border-2 border-gray-500 text-gray-900 font-semibold hover:border-blue-600",
        value: "text-gray-900 font-bold",
        label: "text-gray-800 font-bold text-base",
        popoverContent: "bg-white border-2 border-gray-400",
        innerWrapper: "text-gray-900",
      }}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0] as string;
        if (selected) {
          onSelectionChange(selected);
        }
      }}
      isDisabled={isDisabled}
    >
      {SUPPORTED_CRYPTOS.map((crypto) => (
        <SelectItem 
          key={crypto.value}
          classNames={{
            base: "hover:bg-blue-100 data-[selected=true]:bg-blue-200",
            title: "text-gray-900 font-bold",
            description: "text-gray-700 font-semibold"
          }}
        >
          <div className="flex items-center gap-3 py-1">
            <span className="text-xl font-bold text-gray-900">{crypto.symbol}</span>
            <span className="text-gray-900 font-semibold">{crypto.label}</span>
          </div>
        </SelectItem>
      ))}
    </Select>
  );
}