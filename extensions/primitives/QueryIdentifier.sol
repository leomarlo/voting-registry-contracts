// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {
    IQueryCallingContract,
    IQueryCallbackHash,
    IQueryCallbackData
} from "../interfaces/IQueryIdentifier.sol";

abstract contract QueryCallingContract is IQueryCallingContract {
    
    mapping (uint256=>address) internal _callingContract;

    function getCallingContract(uint256 identifier) public view virtual override(IQueryCallingContract) returns(address callingContract) {
        return _callingContract[identifier];
    } 

    function _setCallingContract(uint256 identifier, address callingContract) internal virtual {
        _callingContract[identifier] = callingContract;
    }
}


contract QueryCallbackHash is IQueryCallbackHash{

    mapping(uint256=>bytes32) internal _callbackHash;

    function getCallbackHash(uint256 identifier) public view virtual override(IQueryCallbackHash) returns(bytes32) {
        return _callbackHash[identifier];
    }

    function _setCallbackHash(uint256 identifier, bytes32 callbackHash) internal virtual {
        _callbackHash[identifier] = callbackHash;
    }
}


abstract contract QueryCallbackData is IQueryCallbackData{

    mapping(uint256=>bytes) internal _callbackData;

    function getCallbackData(uint256 identifier) public view virtual override(IQueryCallbackData) returns(bytes memory) {
        return _callbackData[identifier];
    }

    function _setCallbackData(uint256 identifier, bytes memory callbackData) internal virtual {
        _callbackData[identifier] = callbackData;
    }
}

