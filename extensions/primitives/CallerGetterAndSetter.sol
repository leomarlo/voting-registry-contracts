// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

abstract contract CallerGetterAndSetter {
    
    mapping (uint256=>address) internal _caller;

    function _getCaller(uint256 identifier) public view virtual returns(address caller) {
        caller = _caller[identifier];
    } 

    function _setCaller(uint256 identifier, address caller) internal virtual {
        _caller[identifier] = caller;
    }
}



import {ICallerGetter} from "../interfaces/ICallerGetter.sol";

abstract contract CallerGetterAndSetterPublic is CallerGetterAndSetter, ICallerGetter {
    
    function getCaller(uint256 identifier) public view virtual override(ICallerGetter) returns(address caller) {
        caller = _getCaller(identifier);
    } 
}
