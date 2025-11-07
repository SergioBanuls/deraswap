// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * Contrato de prueba SIMPLE para validar encoding
 */
contract TestSimple {
    address public feeWallet;
    address public router;
    uint16 public fee;
    address public token;

    constructor(
        address payable _feeWallet,
        address _router,
        uint16 _fee,
        address _token
    ) {
        feeWallet = _feeWallet;
        router = _router;
        fee = _fee;
        token = _token;
    }

    function getFee() external view returns (uint16) {
        return fee;
    }
}
