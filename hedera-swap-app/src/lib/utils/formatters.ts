import { AccountId } from '@hashgraph/sdk';

/**
 * Convierte un Hedera Account ID (0.0.xxxxx) a dirección EVM
 */
export function accountIdToEvmAddress(accountId: string): string {
  const account = AccountId.fromString(accountId);
  return account.toSolidityAddress();
}

/**
 * Convierte dirección EVM a Hedera Account ID
 */
export function evmAddressToAccountId(evmAddress: string, shard = 0, realm = 0): string {
  // Remover '0x' si existe
  const cleanAddress = evmAddress.replace('0x', '');

  // Los últimos 20 bytes (40 caracteres hex) son el account num
  const accountNum = parseInt(cleanAddress.slice(-40), 16);

  return `${shard}.${realm}.${accountNum}`;
}

/**
 * Formatea HBAR (de tinybars a HBAR)
 */
export function formatHbar(tinybars: string | number): string {
  const hbar = Number(tinybars) / 100_000_000;
  return hbar.toFixed(4);
}

/**
 * Formatea cantidad de token según decimales
 */
export function formatTokenAmount(amount: string | number, decimals: number): string {
  const value = Number(amount) / Math.pow(10, decimals);
  return value.toFixed(4);
}

/**
 * Parsea cantidad de HBAR a tinybars
 */
export function parseHbar(hbar: string | number): string {
  const tinybars = Number(hbar) * 100_000_000;
  return Math.floor(tinybars).toString();
}

/**
 * Parsea cantidad de token según decimales
 */
export function parseTokenAmount(amount: string | number, decimals: number): string {
  const value = Number(amount) * Math.pow(10, decimals);
  return Math.floor(value).toString();
}

/**
 * Trunca dirección para mostrar
 */
export function truncateAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
