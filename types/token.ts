export interface Token {
  name: string;
  symbol: string;
  decimals: number;
  address: string; // Empty string for HBAR, otherwise "0.0.XXXXX"
  solidityAddress: string;
  icon: string;
  providers: string[];
  // Optional fields for backwards compatibility
  priceUsd?: number;
}

export interface TokenListResponse {
  tokens: Token[];
}
