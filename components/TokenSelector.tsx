'use client';

import { Token } from '@/types/token';
import Image from 'next/image';

interface TokenSelectorProps {
  label: string;
  selectedToken: Token | null;
  onClick: () => void;
}

export function TokenSelector({ label, selectedToken, onClick }: TokenSelectorProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-neutral-800 rounded-2xl px-4 py-2 h-26 group text-left"
    >
      <h3 className="text-sm font-bold mb-2">{label}</h3>
      <div className="flex items-center gap-3">
        {selectedToken ? (
          <>
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
              <Image
                src={selectedToken.icon || '/NotFound.png'}
                alt={selectedToken.symbol}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex flex-col items-start flex-1">
              <span className="text-white text-md font-semibold">{selectedToken.symbol}</span>
              <span className="text-white/50 text-xs">{selectedToken.name}</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
            <div className="flex flex-col items-start flex-1">
              <span className="text-white/40 text-sm font-medium">Select a Token</span>
            </div>
          </>
        )}
      </div>
    </button>
  );
}

