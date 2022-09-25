// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {ITargetGetter} from "../interfaces/ITargetGetter.sol";


abstract contract TargetPrimitive {    
    mapping (uint256=>address) internal _target;
}


abstract contract TargetGetter is TargetPrimitive, ITargetGetter {
    
    function getTarget(uint256 identifier) public view virtual override(ITargetGetter) returns(address target) {
        target = _target[identifier];
    } 
}
