// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;



interface IQueryCaller {
    function getCaller(uint256 identifier) external view returns(address caller);
}


interface IQueryCallbackHash {
    function getCallbackHash(uint256 identifier) external view returns(bytes32 callbackHash);
}


interface IQueryCallbackData {
    function getCallbackData(uint256 identifier) external view returns(bytes memory callbackData);
}

interface IQueryDoubleVoting {
    function hasAlreadyVoted(uint256 identifier, address voter) external view returns(bool alreadyVoted);
}


