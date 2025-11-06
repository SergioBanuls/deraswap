'use client';

import { Token } from '@/types/token';
import Image from 'next/image';
import { useTokenPrice } from '@/hooks/useTokenPrice';

interface AmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  token: Token | null;
  disabled?: boolean;
}

export function AmountInput({ amount, onAmountChange, token, disabled }: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  const currentPrice = useTokenPrice(token?.id || null, token?.priceUsd || 0);
  const usdValue = token && amount ? (parseFloat(amount) * currentPrice).toFixed(2) : '0.00';

  return (
    <div className="bg-neutral-800 rounded-2xl px-4 h-26 group text-left flex flex-col justify-center">
      <h3 className="text-sm font-bold mb-2">Swap</h3>
      <div className="flex items-center gap-3">
        {token ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0">
            <Image
              src={token.icon}
              alt={token.symbol}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 shrink-0"/>
        )}
        <div className="flex-1">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={handleChange}
            disabled={disabled}
            className="w-full bg-transparent text-2xl font-semibold text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
          />
          <div className="text-white/50 text-xs">
            ${usdValue}
          </div>
        </div>
      </div>
    </div>
  );
}

