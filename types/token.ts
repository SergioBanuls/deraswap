export interface Token {
  id: string;
  icon: string;
  symbol: string;
  name: string;
  decimals: number;
  price: string;
  priceUsd: number;
  dueDiligenceComplete: boolean;
  isFeeOnTransferToken: boolean;
  description?: string;
  website?: string;
  twitterHandle?: string;
  sentinelReport?: string;
  timestampSecondsLastListingChange?: number;
  chain?: string;
  chainIcon?: string;
}

export interface TokenListResponse {
  tokens: Token[];
}

