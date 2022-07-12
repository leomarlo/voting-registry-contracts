// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;

import {CallbackHashPrimitive} from "./CallbackHash.sol";


abstract contract CheckCalldataValidity is CallbackHashPrimitive {
    
    error InvalidCalldata();
    
    function _isValidCalldata(uint256 identifier, bytes calldata callback)
    internal 
    view
    returns(bool isValid)
    {
        isValid = CallbackHashPrimitive._callbackHash[identifier] == keccak256(callback);
    }
}
