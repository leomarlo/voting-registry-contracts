// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

abstract contract ACheckCalldataValidity {

    error InvalidCalldata();

    function _isValidCalldata(uint256 identifier, bytes memory callbackData) virtual internal view returns(bool isValid);
}