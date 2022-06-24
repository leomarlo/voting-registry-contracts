// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {CallbackHashGetterAndSetter} from "./CallbackHashGetterAndSetter.sol";


abstract contract CheckCalldataValidity is CallbackHashGetterAndSetter {
    
    error InvalidCalldata();
    
    function _isValidCalldata(uint256 identifier, bytes memory callbackData)
    internal 
    view
    returns(bool isValid)
    {
        isValid = CallbackHashGetterAndSetter._callbackHash[identifier] == keccak256(callbackData);
    }
}
