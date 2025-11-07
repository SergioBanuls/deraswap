/**
 * Swap Execution Hook
 *
 * Orchestrates the complete swap flow:
 * 1. Validate swap parameters
 * 2. Check/request token association (destination token)
 * 3. Check/request token allowance (source token)
 * 4. Build swap transaction
 * 5. Sign transaction via wallet
 * 6. Send transaction to network
 * 7. Monitor transaction status
 * 8. Handle success/failure
 *
 * This hook is router-agnostic and works with both ETASwap and custom routers.
 */

'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useReownContext } from '@/contexts/ReownProvider';
import { SwapRoute } from '@/types/route';
import { Token } from '@/types/token';
import { SwapSettings } from '@/types/swap';
import {
  buildSwapTransaction,
  validateSwapParams,
  SwapTransactionParams,
} from '@/utils/transactionBuilder';
import {
  requestApproval,
  calculateAllowanceWithBuffer,
  ApprovalParams,
} from '@/utils/allowanceManager';
import {
  requestTokenAssociation,
  AssociateTokenParams,
} from '@/utils/tokenAssociation';
import { getActiveRouter } from '@/config/contracts';
import { monitorTransaction, getTransactionExplorerUrl } from '@/utils/transactionMonitor';
import { parseHederaError, formatErrorMessage } from '@/utils/errorMessages';
import { useEnsureTokensAssociated } from '@/hooks/useEnsureTokensAssociated';
import { extractTokensFromPath, evmAddressToTokenId } from '@/utils/pathUtils';

export interface SwapExecutionParams {
  route: SwapRoute;
  fromToken: Token;
  toToken: Token;
  inputAmount: string; // Raw amount in smallest units
  settings: SwapSettings;
}

export interface SwapExecutionState {
  isExecuting: boolean;
  currentStep: SwapStep;
  error: string | null;
  txHash: string | null;
  explorerUrl: string | null;
  monitoringProgress?: { current: number; max: number };
}

export type SwapStep =
  | 'idle'
  | 'validating'
  | 'ensuring_adapter_tokens'
  | 'checking_association'
  | 'requesting_association'
  | 'checking_allowance'
  | 'requesting_approval'
  | 'building_transaction'
  | 'awaiting_signature'
  | 'sending_transaction'
  | 'monitoring'
  | 'success'
  | 'error';

const STEP_MESSAGES: Record<SwapStep, string> = {
  idle: 'Ready to swap',
  validating: 'Validating swap parameters...',
  ensuring_adapter_tokens: 'Ensuring adapter supports tokens...',
  checking_association: 'Checking token association...',
  requesting_association: 'Requesting token association...',
  checking_allowance: 'Checking token allowance...',
  requesting_approval: 'Requesting token approval...',
  building_transaction: 'Building swap transaction...',
  awaiting_signature: 'Please sign the transaction in your wallet...',
  sending_transaction: 'Sending transaction to network...',
  monitoring: 'Monitoring transaction...',
  success: 'Swap completed successfully!',
  error: 'Swap failed',
};

export function useSwapExecution() {
  const { callNativeMethod, executeTransactionWithSigner, signer, account, isConnected } = useReownContext();
  const { ensureTokensAssociated, isEnsuring } = useEnsureTokensAssociated();
  const [state, setState] = useState<SwapExecutionState>({
    isExecuting: false,
    currentStep: 'idle',
    error: null,
    txHash: null,
    explorerUrl: null,
    monitoringProgress: undefined,
  });

  /**
   * Update execution state and show toast notification
   */
  const updateState = useCallback(
    (
      step: SwapStep,
      error: string | null = null,
      txHash: string | null = null,
      explorerUrl: string | null = null,
      monitoringProgress?: { current: number; max: number }
    ) => {
      setState({
        isExecuting: step !== 'idle' && step !== 'success' && step !== 'error',
        currentStep: step,
        error,
        txHash,
        explorerUrl,
        monitoringProgress,
      });

      // Show toast for important steps
      if (step === 'awaiting_signature') {
        toast.info(STEP_MESSAGES[step]);
      } else if (step === 'success') {
        toast.success(STEP_MESSAGES[step]);
      } else if (step === 'error' && error) {
        toast.error(error);
      }
    },
    []
  );

  /**
   * Execute swap
   *
   * Main function that orchestrates the entire swap flow
   */
  const executeSwap = useCallback(
    async (params: SwapExecutionParams): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      if (!isConnected || !account) {
        const error = 'Please connect your wallet first';
        toast.error(error);
        return { success: false, error };
      }

      try {
        // Step 1: Validate parameters
        updateState('validating');
        const txParams: SwapTransactionParams = {
          ...params,
          userAccountId: account,
        };

        const validation = validateSwapParams(txParams);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid swap parameters');
        }

        // Step 2: Ensure adapter has ALL path tokens associated (backend check)
        updateState('ensuring_adapter_tokens');
        
        const tokensToCheck: string[] = [];
        if (params.fromToken.id !== 'HBAR') tokensToCheck.push(params.fromToken.id);
        if (params.toToken.id !== 'HBAR') tokensToCheck.push(params.toToken.id);
        
        // Extract intermediate tokens from path (for SaucerSwapV2)
        const aggregatorId = Array.isArray(params.route.aggregatorId) 
          ? params.route.aggregatorId[0] 
          : params.route.aggregatorId;
          
        if (aggregatorId.startsWith('SaucerSwapV2') && params.route.path) {
          console.log('🔍 Extracting tokens from path:', params.route.path);
          
          // Handle path (can be string or array)
          const pathStr = Array.isArray(params.route.path) 
            ? params.route.path[0] 
            : params.route.path;
            
          const pathTokens = extractTokensFromPath(pathStr);
          console.log('📍 Path tokens found:', pathTokens);
          
          // Convert EVM addresses to Hedera token IDs
          for (const evmAddress of pathTokens) {
            const tokenId = evmAddressToTokenId(evmAddress);
            // Skip HBAR/WHBAR and already included tokens
            if (tokenId !== '0.0.1456986' && !tokensToCheck.includes(tokenId)) {
              tokensToCheck.push(tokenId);
            }
          }
          
          console.log('🔍 All tokens to check (including path):', tokensToCheck);
        }
        
        if (tokensToCheck.length > 0) {
          console.log('🔍 Checking adapter token associations:', tokensToCheck);
          const adapterReady = await ensureTokensAssociated(tokensToCheck);
          
          if (!adapterReady) {
            throw new Error('Failed to ensure adapter supports these tokens. Please try again.');
          }
          console.log('✅ Adapter tokens verified');
        }

        // Step 3: Check token association for destination token (skip for HBAR)
        if (params.toToken.id !== 'HBAR') {
          updateState('checking_association');

          const associationParams: AssociateTokenParams = {
            tokenId: params.toToken.id,
            accountId: account,
          };

          const associationResult = await requestTokenAssociation(associationParams);

          // Step 3b: Request association if needed
          if (associationResult.needed && associationResult.transaction) {
            updateState('requesting_association');
            toast.info('Please associate the token in your wallet to receive it');

            try {
              // Sign and send association transaction
              const associationTx = await callNativeMethod('hedera_signAndExecuteTransaction', {
                transaction: associationResult.transaction,
              });

              console.log('Association transaction:', associationTx);
              toast.success('Token associated successfully');

              // Wait a bit for association to be processed
              await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch (associationError) {
              console.error('Association error:', associationError);

              // Parse error and show descriptive message
              const parsedError = parseHederaError(associationError);
              const errorMsg = formatErrorMessage(associationError);

              // Show detailed error to user
              toast.error(errorMsg, {
                duration: 8000,
                style: {
                  whiteSpace: 'pre-line',
                },
              });

              throw new Error(parsedError.userMessage);
            }
          }
        }

        // Step 3: Check allowance (skip for HBAR)
        if (params.fromToken.id !== 'HBAR') {
          updateState('checking_allowance');

          const router = getActiveRouter();
          const requiredAmount = calculateAllowanceWithBuffer(params.inputAmount);

          const approvalParams: ApprovalParams = {
            tokenId: params.fromToken.id,
            amount: requiredAmount,
            ownerAccountId: account,
            spenderAddress: router.address,
          };

          const approvalResult = await requestApproval(approvalParams);

          // Step 4: Request approval if needed
          if (approvalResult.needed && approvalResult.transaction) {
            updateState('requesting_approval');
            toast.info('Please approve token spending in your wallet');

            try {
              // Sign and send approval transaction (already in bytes format)
              const approvalTx = await callNativeMethod('hedera_signAndExecuteTransaction', {
                transaction: approvalResult.transaction,
              });

              console.log('Approval transaction:', approvalTx);
              toast.success('Token approval confirmed');

              // Wait a bit for approval to be processed
              await new Promise((resolve) => setTimeout(resolve, 2000));
            } catch (approvalError) {
              console.error('Approval error:', approvalError);

              // Parse error and show descriptive message
              const parsedError = parseHederaError(approvalError);
              const errorMsg = formatErrorMessage(approvalError);

              toast.error(errorMsg, {
                duration: 8000,
                style: {
                  whiteSpace: 'pre-line',
                },
              });

              throw new Error(parsedError.userMessage);
            }
          }
        }

        // Step 5: Build swap transaction
        updateState('building_transaction');

        // CRITICAL: When swapping FROM HBAR, we MUST use signer
        // to properly serialize the payableAmount field
        const isHbarSwap = params.fromToken.id === 'HBAR';
        const txParamsWithSigner = isHbarSwap
          ? { ...txParams, signer }
          : txParams;

        const swapTx = await buildSwapTransaction(txParamsWithSigner);

        // Step 6: Request signature and execute
        updateState('awaiting_signature');

        let result: any;

        // Use different execution method based on whether we're swapping HBAR
        if (isHbarSwap && swapTx instanceof Object && 'executeWithSigner' in swapTx) {
          console.log('🪙 HBAR swap detected - using executeTransactionWithSigner');
          result = await executeTransactionWithSigner(swapTx);
        } else {
          console.log('🪙 Token swap - using callNativeMethod');
          result = await callNativeMethod('hedera_signAndExecuteTransaction', {
            transaction: swapTx as Uint8Array,
          });
        }

        console.log('Swap transaction result:', result);

        // Extract transaction ID from result
        const txHash = result?.transactionId || result?.txId || 'unknown';

        // Step 7: Monitor transaction using Mirror Node
        updateState('monitoring', null, txHash);

        // Get network for explorer URL
        const network = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet') as 'mainnet' | 'testnet';
        const explorerUrl = getTransactionExplorerUrl(txHash, network);

        // Monitor transaction with progress updates
        const txStatus = await monitorTransaction(txHash, (current, max) => {
          updateState('monitoring', null, txHash, explorerUrl, { current, max });
        });

        // Step 8: Check final status
        if (txStatus.success) {
          updateState('success', null, txHash, explorerUrl);
          toast.success('Swap completed successfully!');
          return { success: true, txHash };
        } else {
          throw new Error(txStatus.errorMessage || 'Transaction failed');
        }
      } catch (error) {
        console.error('Swap execution error:', error);

        // Parse error and show descriptive message
        const parsedError = parseHederaError(error);
        const errorMessage = error instanceof Error ? error.message : parsedError.userMessage;

        updateState('error', errorMessage);

        // Show detailed error if not already shown
        if (!errorMessage.includes('association') && !errorMessage.includes('approval')) {
          const errorMsg = formatErrorMessage(error);
          toast.error(errorMsg, {
            duration: 8000,
            style: {
              whiteSpace: 'pre-line',
            },
          });
        }

        return { success: false, error: errorMessage };
      }
    },
    [isConnected, account, callNativeMethod, updateState]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isExecuting: false,
      currentStep: 'idle',
      error: null,
      txHash: null,
      explorerUrl: null,
      monitoringProgress: undefined,
    });
  }, []);

  return {
    executeSwap,
    reset,
    state,
    isExecuting: state.isExecuting,
    currentStep: state.currentStep,
    stepMessage: STEP_MESSAGES[state.currentStep],
    error: state.error,
    txHash: state.txHash,
    explorerUrl: state.explorerUrl,
    monitoringProgress: state.monitoringProgress,
  };
}
