import { HederaToken } from './hedera';

export interface SwapRoute {
  tokenIn: HederaToken;
  tokenOut: HederaToken;
  fee: number; // Fee tier
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  minimumAmountOut: string;
}

export interface QuoteResult {
  amountOut: string;
  priceImpact: number;
  gasEstimate: string;
  route: SwapRoute;
}

export interface SwapParams {
  tokenIn: HederaToken;
  tokenOut: HederaToken;
  amountIn: string;
  slippageTolerance: number;
  deadline: number;
  recipient: string;
  fee?: number;
}

export interface SwapState {
  tokenIn: HederaToken | null;
  tokenOut: HederaToken | null;
  amountIn: string;
  amountOut: string;
  loading: boolean;
  error: string | null;
}
