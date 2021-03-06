// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ICallerGetter} from "../interfaces/ICallerGetter.sol";


abstract contract CallerPrimitive {    
    mapping (uint256=>address) internal _caller;
}


abstract contract CallerGetter is CallerPrimitive, ICallerGetter {
    
    function getCaller(uint256 identifier) public view virtual override(ICallerGetter) returns(address caller) {
        caller = _caller[identifier];
    } 
}
