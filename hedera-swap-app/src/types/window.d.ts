/**
 * Extensiones de tipos para el objeto window
 * Incluye tipos para las extensiones de wallets de Hedera
 */

interface Window {
  // HashPack wallet extension
  hashpack?: {
    connect: () => Promise<any>;
    disconnect: () => Promise<void>;
    pairing?: any;
  };

  // Kabila wallet extension
  kabila?: {
    connect: () => Promise<any>;
    disconnect: () => Promise<void>;
  };

  // Blade wallet extension
  blade?: {
    connect: () => Promise<any>;
    disconnect: () => Promise<void>;
  };

  // Ethereum provider (para wallets compatibles con EVM)
  ethereum?: {
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    providers?: any[];
    request: (request: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
  };
}
