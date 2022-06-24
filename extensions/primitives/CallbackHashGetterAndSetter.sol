// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {IGetCallbackHash} from "../interfaces/IGetCallbackHash.sol";


contract CallbackHashGetterAndSetter is IGetCallbackHash{

    mapping(uint256=>bytes32) internal _callbackHash;

    function getCallbackHash(uint256 identifier) public view virtual override(IGetCallbackHash) returns(bytes32) {
        return _callbackHash[identifier];
    }

    function _setCallbackHash(uint256 identifier, bytes32 callbackHash) internal virtual {
        _callbackHash[identifier] = callbackHash;
    }
}