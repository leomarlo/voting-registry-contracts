// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


interface IQueryCallingContract {
    function getCallingContract(uint256 identifier) external view returns(address callingContract);
}


interface IQueryCallbackHash {
    function getCallbackHash(uint256 identifier) external view returns(bytes32 callbackHash);
}


interface IQueryCallbackData {
    function getCallbackData(uint256 identifier) external view returns(bytes memory callbackData);
}


