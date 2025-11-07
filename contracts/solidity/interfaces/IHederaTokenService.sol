// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IHederaTokenService
 * @notice Interface for Hedera Token Service precompiled contract
 * @dev HTS is located at address 0x167
 */
interface IHederaTokenService {
    /// Approves spender to spend amount of tokens on behalf of owner
    /// @param token The Hedera token address
    /// @param spender The spender address
    /// @param amount The amount to approve
    /// @return responseCode The response code (22 = SUCCESS)
    function approve(address token, address spender, uint256 amount) 
        external 
        returns (int64 responseCode);
        
    /// Associates tokens to an account
    /// @param account The account to associate
    /// @param tokens Array of token addresses to associate
    /// @return responseCode The response code (22 = SUCCESS)
    function associateTokens(address account, address[] memory tokens)
        external
        returns (int64 responseCode);
}
