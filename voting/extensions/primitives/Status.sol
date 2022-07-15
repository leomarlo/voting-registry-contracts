// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IStatusGetter} from "../interfaces/IStatusGetter.sol";

error StatusError(uint256 identifier, uint256 status);

abstract contract StatusPrimitive {
    mapping (uint256=>uint256) internal _status;
}


abstract contract StatusGetter is StatusPrimitive, IStatusGetter {
    
    function getStatus(uint256 identifier) public view virtual override(IStatusGetter) returns(uint256 status) {
        status = _status[identifier];
    } 
}