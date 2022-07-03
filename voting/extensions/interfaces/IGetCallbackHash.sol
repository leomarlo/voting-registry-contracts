// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


interface IGetCallbackHash {
    function getCallbackHash(uint256 identifier) external view returns(bytes32 callbackHash);
}