export type TransactionType = 'SWAP' | 'SPLIT_SWAP' | 'INDIRECT_SWAP';

export interface SwapRoute {
  transactionType: TransactionType;
  aggregatorId: string | string[];
  amountFrom: string | string[];
  amountTo: string | string[];
  path: string | string[];
  route: string[] | string[][];
  gasEstimate: number;
  outputAmountFormatted: string;
  priceImpact: number;
}

