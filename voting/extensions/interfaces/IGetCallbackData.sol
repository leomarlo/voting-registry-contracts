// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;

interface IGetCallbackData {
    function getCallbackData(uint256 identifier) external view returns(bytes calldata callback);
}