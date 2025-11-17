import { useState } from 'react';
import axios from 'axios';

interface TokenAssociationResult {
  tokenId: string;
  alreadyAssociatedToExchange: boolean;
  alreadyAssociatedToAdapterV2: boolean;
  alreadyAssociatedToAdapterV1: boolean;
  alreadyAssociatedToFeeWallet: boolean;
  associatedToExchange: boolean;
  associatedToAdapterV2: boolean;
  associatedToAdapterV1: boolean;
  associatedToFeeWallet: boolean;
  error?: string;
}

interface EnsureTokensResponse {
  success: boolean;
  results: TokenAssociationResult[];
  summary: {
    total: number;
    alreadyAssociatedToAll: number;
    newlyAssociatedToExchange: number;
    newlyAssociatedToAdapterV2: number;
    newlyAssociatedToAdapterV1: number;
    newlyAssociatedToFeeWallet: number;
    failed: number;
  };
}

// Cache of tokens that are already confirmed associated
const associatedTokensCache = new Set<string>();

export function useEnsureTokensAssociated() {
  const [isEnsuring, setIsEnsuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ensures tokens are associated to Exchange, Adapters, and Fee Wallet before swap
   * Returns true if all tokens are successfully associated to all contracts
   * @param tokenIds - All tokens in the swap route
   * @param tokenFrom - The input token (only this needs fee wallet association)
   */
  const ensureTokensAssociated = async (tokenIds: string[], tokenFrom?: string): Promise<boolean> => {
    if (!tokenIds || tokenIds.length === 0) {
      return true; // No tokens to check
    }

    // Filter out tokens we've already verified
    const tokensToCheck = tokenIds.filter(id => !associatedTokensCache.has(id));
    
    if (tokensToCheck.length === 0) {
      console.log('✅ All tokens already verified as associated (cached)');
      return true;
    }

    console.log(`🔍 Checking ${tokensToCheck.length} token(s) for association (${tokenIds.length - tokensToCheck.length} cached)`);

    setIsEnsuring(true);
    setError(null);

    try {
      const response = await axios.post<EnsureTokensResponse>(
        '/api/ensure-tokens-associated',
        {
          tokenIds: tokensToCheck,
          tokenFrom: tokenFrom // Pass tokenFrom for fee wallet association
        },
        { timeout: 120000 } // 2 minute timeout (allows up to 12 tokens @ 10s each)
      );

      const { success, summary, results } = response.data;

      // Log results for debugging
      console.log('Token association results:', {
        total: summary.total,
        alreadyAssociatedToAll: summary.alreadyAssociatedToAll,
        newlyAssociatedToExchange: summary.newlyAssociatedToExchange,
        newlyAssociatedToAdapterV2: summary.newlyAssociatedToAdapterV2,
        newlyAssociatedToAdapterV1: summary.newlyAssociatedToAdapterV1,
        failed: summary.failed,
      });

      if (summary.newlyAssociatedToExchange > 0) {
        console.log(`✅ Associated ${summary.newlyAssociatedToExchange} token(s) to Exchange`);
      }

      if (summary.newlyAssociatedToAdapterV2 > 0) {
        console.log(`✅ Associated ${summary.newlyAssociatedToAdapterV2} token(s) to Adapter V2`);
      }

      if (summary.newlyAssociatedToAdapterV1 > 0) {
        console.log(`✅ Associated ${summary.newlyAssociatedToAdapterV1} token(s) to Adapter V1`);
      }

      if (summary.newlyAssociatedToFeeWallet > 0) {
        console.log(`✅ Associated ${summary.newlyAssociatedToFeeWallet} token(s) to Fee Wallet`);
      }

      if (summary.alreadyAssociatedToAll > 0) {
        console.log(`ℹ️ ${summary.alreadyAssociatedToAll} token(s) already associated to all contracts`);
      }

      if (!success) {
        const failedTokens = results.filter(r =>
          !r.associatedToExchange || !r.associatedToAdapterV2 || !r.associatedToAdapterV1 || !r.associatedToFeeWallet
        );
        const errorMsg = `Failed to associate tokens: ${failedTokens.map(t => t.tokenId).join(', ')}`;
        setError(errorMsg);
        console.error(errorMsg, failedTokens);
        console.error('Full API response:', response.data);
        return false;
      }

      // Cache successfully associated tokens
      tokensToCheck.forEach(tokenId => {
        associatedTokensCache.add(tokenId);
      });

      return true;

    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to ensure token associations';
      setError(errorMsg);
      console.error('Error ensuring tokens associated:', err);
      return false;

    } finally {
      setIsEnsuring(false);
    }
  };

  return {
    ensureTokensAssociated,
    isEnsuring,
    error,
  };
}
