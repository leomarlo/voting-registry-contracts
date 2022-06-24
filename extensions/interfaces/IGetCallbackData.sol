// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

interface IGetCallbackData {
    function getCallbackData(uint256 identifier) external view returns(bytes memory callbackData);
}