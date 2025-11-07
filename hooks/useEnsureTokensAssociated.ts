import { useState } from 'react';
import axios from 'axios';

interface TokenAssociationResult {
  tokenId: string;
  alreadyAssociatedToExchange: boolean;
  alreadyAssociatedToAdapter: boolean;
  associatedToExchange: boolean;
  associatedToAdapter: boolean;
  error?: string;
}

interface EnsureTokensResponse {
  success: boolean;
  results: TokenAssociationResult[];
  summary: {
    total: number;
    alreadyAssociatedToBoth: number;
    newlyAssociatedToExchange: number;
    newlyAssociatedToAdapter: number;
    failed: number;
  };
}

// Cache of tokens that are already confirmed associated
const associatedTokensCache = new Set<string>();

export function useEnsureTokensAssociated() {
  const [isEnsuring, setIsEnsuring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ensures tokens are associated to BOTH Exchange and Adapter before swap
   * Returns true if all tokens are successfully associated to both contracts
   */
  const ensureTokensAssociated = async (tokenIds: string[]): Promise<boolean> => {
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
        { tokenIds: tokensToCheck },
        { timeout: 120000 } // 2 minute timeout (allows up to 12 tokens @ 10s each)
      );

      const { success, summary, results } = response.data;

      // Log results for debugging
      console.log('Token association results:', {
        total: summary.total,
        alreadyAssociatedToBoth: summary.alreadyAssociatedToBoth,
        newlyAssociatedToExchange: summary.newlyAssociatedToExchange,
        newlyAssociatedToAdapter: summary.newlyAssociatedToAdapter,
        failed: summary.failed,
      });

      if (summary.newlyAssociatedToExchange > 0) {
        console.log(`✅ Associated ${summary.newlyAssociatedToExchange} token(s) to Exchange`);
      }

      if (summary.newlyAssociatedToAdapter > 0) {
        console.log(`✅ Associated ${summary.newlyAssociatedToAdapter} token(s) to Adapter`);
      }

      if (summary.alreadyAssociatedToBoth > 0) {
        console.log(`ℹ️ ${summary.alreadyAssociatedToBoth} token(s) already associated to both contracts`);
      }

      if (!success) {
        const failedTokens = results.filter(r => !r.associatedToExchange || !r.associatedToAdapter);
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
