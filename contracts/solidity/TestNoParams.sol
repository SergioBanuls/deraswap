// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * Contrato SIN constructor params para test
 */
contract TestNoParams {
    address public owner;
    uint256 public value;

    constructor() {
        owner = msg.sender;
        value = 42;
    }

    function getValue() external view returns (uint256) {
        return value;
    }
}
