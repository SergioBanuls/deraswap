export interface HederaToken {
  id: string; // Token ID en formato 0.0.xxxxx
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
  evmAddress?: string; // Dirección EVM del token (si aplica)
}

export interface HederaAccount {
  accountId: string;
  evmAddress: string;
  balance: {
    hbar: string;
    tokens: HederaToken[];
  };
}

export interface HederaTransaction {
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  type: 'swap' | 'approval' | 'transfer';
}
