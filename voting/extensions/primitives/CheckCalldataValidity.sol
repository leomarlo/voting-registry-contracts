// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {CallbackHashPrimitive} from "./CallbackHash.sol";


abstract contract CheckCalldataValidity is CallbackHashPrimitive {
    
    error InvalidCalldata();
    
    function _isValidCalldata(uint256 identifier, bytes calldata callbackData)
    internal 
    view
    returns(bool isValid)
    {
        isValid = CallbackHashPrimitive._callbackHash[identifier] == keccak256(callbackData);
    }
}
