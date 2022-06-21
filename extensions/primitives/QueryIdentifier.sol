// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import { AQueryCaller } from "../interfaces/AQueryCaller.sol";
import { AQueryStatus } from "../interfaces/AQueryStatus.sol";
import {
    IQueryCaller,
    IQueryCallbackHash,
    IQueryCallbackData
} from "../interfaces/IQueryIdentifier.sol";



abstract contract QueryStatus is AQueryStatus {
    
    mapping (uint256=>uint256) internal _status;

    function _getStatus(uint256 identifier) public view virtual override(AQueryStatus) returns(uint256 status) {
        status = _status[identifier];
    } 

    function _setStatus(uint256 identifier, uint256 status) internal virtual override(AQueryStatus) {
        _status[identifier] = status;
    }
}


abstract contract QueryCaller is AQueryCaller {
    
    mapping (uint256=>address) internal _caller;

    function _getCaller(uint256 identifier) public view virtual override(AQueryCaller) returns(address caller) {
        caller = _caller[identifier];
    } 

    function _setCaller(uint256 identifier, address caller) internal virtual override(AQueryCaller) {
        _caller[identifier] = caller;
    }
}


abstract contract QueryCallerPublicly is QueryCaller, IQueryCaller {
    function getCaller(uint256 identifier) public view virtual override(IQueryCaller) returns(address caller) {
        caller = _getCaller(identifier);
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

