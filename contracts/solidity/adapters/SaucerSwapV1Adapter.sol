// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

/**
 * @title SaucerSwapV1Adapter
 * @notice Adapter for SaucerSwap V1 (Uniswap V2-style router)
 * @dev Adapted from SaucerSwapV2Adapter for V1 compatibility
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IUniswapV2Router.sol";
import "../interfaces/IAdapter.sol";
import "../interfaces/IWHBAR.sol";
import "../libraries/Path.sol";

contract SaucerSwapV1Adapter is Ownable, IAdapter {
    using SafeERC20 for IERC20;
    using Address for address;
    using Address for address payable;

    IUniswapV2Router public immutable router;
    address payable public immutable feeWallet;
    uint8 public feePromille;
    IERC20 public whbarToken;
    IWHBAR public whbarContract;

    constructor(
        address payable _feeWallet,
        IUniswapV2Router _router,
        uint8 _feePromille,
        IERC20 _whbarToken,
        IWHBAR _whbarContract
    ) public {
        feeWallet = _feeWallet;
        router = _router;
        feePromille = _feePromille;
        whbarToken = _whbarToken;
        whbarContract = _whbarContract;
    }

    function setFeePromille(uint8 _feePromille) external onlyOwner {
        feePromille = _feePromille;
    }

    /**
     * @dev Performs a swap using Uniswap V2-style router
     * @param recipient The original msg.sender performing the swap
     * @param path Tokens to be swapped - concatenated addresses (20 bytes each)
     *             For V1, path is concatenated token addresses [tokenFrom|tokenIntermediate|...|tokenTo]
     * @param amountFrom Amount of tokenFrom to swap
     * @param amountTo Minimum amount of tokenTo to receive
     * @param deadline Timestamp at which the swap becomes invalid
     * @param feeOnTransfer Whether this is an exact output swap (true) or exact input swap (false)
     */
    function swap(
        address payable recipient,
        bytes calldata path,
        uint256 amountFrom,
        uint256 amountTo,
        uint256 deadline,
        bool feeOnTransfer
    ) external payable {
        // Decode path using Path library (concatenated addresses)
        address[] memory pathArray = Path.getAllAddresses(path, feeOnTransfer);
        require(pathArray.length >= 2, "EtaSwap: INVALID_PATH");

        address tokenFromAddr = feeOnTransfer ? pathArray[pathArray.length - 1] : pathArray[0];
        address tokenToAddr = feeOnTransfer ? pathArray[0] : pathArray[pathArray.length - 1];

        IERC20 tokenFrom = IERC20(tokenFromAddr);
        IERC20 tokenTo = IERC20(tokenToAddr);

        require(tokenFromAddr != tokenToAddr, "EtaSwap: TOKEN_PAIR_INVALID");

        // Calculate and transfer fee
        uint256 fee = (tokenFrom == whbarToken ? msg.value : amountFrom) * feePromille / 1000;
        _transfer(tokenFrom, fee, feeWallet);

        uint256 amountFromWithoutFee = (tokenFrom == whbarToken ? msg.value : amountFrom) - fee;

        if (feeOnTransfer) {
            // Exact output swap
            uint256[] memory amounts;

            if (tokenFrom == whbarToken) {
                // HBAR → Token (exact output)
                amounts = router.swapETHForExactTokens{value: amountFromWithoutFee}(
                    amountTo,
                    pathArray,
                    address(this),
                    deadline
                );
                uint256 refund = amountFromWithoutFee - amounts[0];
                if (refund > 0) {
                    _transfer(tokenFrom, refund, recipient);
                }
            } else if (tokenTo == whbarToken) {
                // Token → HBAR (exact output)
                _approveSpender(tokenFrom, address(router), amountFromWithoutFee);
                amounts = router.swapTokensForExactETH(
                    amountTo,
                    amountFromWithoutFee,
                    pathArray,
                    address(this),
                    deadline
                );
                uint256 refund = amountFromWithoutFee - amounts[0];
                if (refund > 0) {
                    _transfer(tokenFrom, refund, recipient);
                }
            } else {
                // Token → Token (exact output)
                _approveSpender(tokenFrom, address(router), amountFromWithoutFee);
                amounts = router.swapTokensForExactTokens(
                    amountTo,
                    amountFromWithoutFee,
                    pathArray,
                    address(this),
                    deadline
                );
                uint256 refund = amountFromWithoutFee - amounts[0];
                if (refund > 0) {
                    _transfer(tokenFrom, refund, recipient);
                }
            }

            _transfer(tokenTo, amountTo, recipient);
        } else {
            // Exact input swap
            uint256[] memory amounts;

            if (tokenFrom == whbarToken) {
                // HBAR → Token (exact input)
                amounts = router.swapExactETHForTokens{value: amountFromWithoutFee}(
                    amountTo,
                    pathArray,
                    address(this),
                    deadline
                );
            } else if (tokenTo == whbarToken) {
                // Token → HBAR (exact input)
                _approveSpender(tokenFrom, address(router), amountFromWithoutFee);
                amounts = router.swapExactTokensForETH(
                    amountFromWithoutFee,
                    amountTo,
                    pathArray,
                    address(this),
                    deadline
                );
            } else {
                // Token → Token (exact input)
                _approveSpender(tokenFrom, address(router), amountFromWithoutFee);
                amounts = router.swapExactTokensForTokens(
                    amountFromWithoutFee,
                    amountTo,
                    pathArray,
                    address(this),
                    deadline
                );
            }

            uint256 amountToReturn = amounts[amounts.length - 1];
            require(amountToReturn >= amountTo, "EtaSwap: INSUFFICIENT_OUTPUT_AMOUNT");
            _transfer(tokenTo, amountToReturn, recipient);
        }
    }

    /**
     * @dev Transfers token to sender if amount > 0
     * @param token IERC20 token to transfer to sender
     * @param amount Amount of token to transfer
     * @param recipient Address that will receive the tokens
     */
    function _transfer(
        IERC20 token,
        uint256 amount,
        address payable recipient
    ) internal {
        if (amount > 0) {
            if (token == whbarToken) {
                (bool success,) = recipient.call{value:amount}(new bytes(0));
                require(success, 'EtaSwap: HBAR_TRANSFER_FAILED');
            } else {
                token.safeTransfer(recipient, amount);
            }
        }
    }

    /**
     * @dev Approves max amount of token to the spender if the allowance is lower than amount
     * @param token The ERC20 token to approve
     * @param spender Address to which funds will be approved
     * @param amount Amount used to compare current allowance
     */
    function _approveSpender(
        IERC20 token,
        address spender,
        uint256 amount
    ) internal {
        uint256 allowance = token.allowance(address(this), spender);
        if (allowance < amount) {
            token.approve(spender, amount);
        }
    }

    receive() external payable {}

    fallback() external payable {}
}
