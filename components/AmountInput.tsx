/**
 * Amount Input Component
 *
 * Validates user input with proper decimal handling and shows USD equivalent.
 * Enforces token decimal limits and provides error feedback.
 * Includes MAX button to use full balance (with gas reserve for HBAR).
 */

'use client';

import { useState } from 'react';
import { Token } from '@/types/token';
import Image from 'next/image';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { isValidNumericInput, limitDecimals, formatAmount } from '@/utils/amountValidation';

const GAS_RESERVE_HBAR = '100000000'; // 1 HBAR reserved for gas

interface AmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  token: Token | null;
  disabled?: boolean;
  balance?: string; // Raw balance in smallest units
}

export function AmountInput({
  amount,
  onAmountChange,
  token,
  disabled,
  balance
}: AmountInputProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty
    if (value === '') {
      setLocalError(null);
      onAmountChange(value);
      return;
    }

    // Validate format (only digits and decimal point)
    if (!isValidNumericInput(value)) {
      return; // Don't update if invalid format
    }

    // Limit decimal places based on token
    if (token && value.includes('.')) {
      const limited = limitDecimals(value, token.decimals);
      if (limited !== value) {
        setLocalError(`Maximum ${token.decimals} decimal places`);
        onAmountChange(limited);
        return;
      }
    }

    setLocalError(null);
    onAmountChange(value);
  };

  const handleMaxClick = () => {
    if (!token || !balance) return;

    let maxAmount = balance;

    // If HBAR, reserve some for gas fees
    if (token.id === 'HBAR') {
      const balanceBigInt = BigInt(balance);
      const reserve = BigInt(GAS_RESERVE_HBAR);

      if (balanceBigInt <= reserve) {
        setLocalError('Insufficient balance (reserve needed for gas)');
        return;
      }

      maxAmount = (balanceBigInt - reserve).toString();
    }

    const formatted = formatAmount(maxAmount, token.decimals);
    onAmountChange(formatted);
    setLocalError(null);
  };

  const currentPrice = useTokenPrice(token?.id || null, token?.priceUsd || 0);
  const usdValue = token && amount && parseFloat(amount) > 0
    ? (parseFloat(amount) * currentPrice).toFixed(2)
    : '0.00';

  const formattedBalance = balance && token
    ? formatAmount(balance, token.decimals)
    : null;

  return (
    <div className="bg-neutral-800 rounded-2xl px-4 py-3 group text-left">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold">Swap</h3>
        {formattedBalance && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">
              Balance: {parseFloat(formattedBalance).toFixed(4)}
            </span>
            <button
              onClick={handleMaxClick}
              disabled={disabled || !balance}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              MAX
            </button>
          </div>
        )}
      </div>
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
            maxLength={20}
            className="w-full bg-transparent text-2xl font-semibold text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <div className="text-white/50 text-xs">
              ${usdValue}
            </div>
            {localError && (
              <div className="text-red-400 text-xs">
                {localError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

