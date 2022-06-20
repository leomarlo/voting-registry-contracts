// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {ACheckCalldataValidity} from "../interfaces/ACheckCalldataValidity.sol";
import {QueryCallbackData, QueryCallbackHash} from "./QueryIdentifier.sol";


abstract contract CheckCalldataValidity is ACheckCalldataValidity, QueryCallbackHash {
    
    function _isValidCalldata(uint256 identifier, bytes memory callbackData)
    override(ACheckCalldataValidity) 
    internal 
    view
    returns(bool isValid)
    {
        isValid = QueryCallbackHash._callbackHash[identifier] == keccak256(callbackData);
    }
}
