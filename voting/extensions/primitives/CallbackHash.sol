// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {IGetCallbackHash} from "../interfaces/IGetCallbackHash.sol";

abstract contract CallbackHashPrimitive {
    mapping(uint256=>bytes32) internal _callbackHash;
}

abstract contract CallbackHashGetter is IGetCallbackHash, CallbackHashPrimitive{

    function getCallbackHash(uint256 identifier) public view virtual override(IGetCallbackHash) returns(bytes32) {
        return _callbackHash[identifier];
    }

}