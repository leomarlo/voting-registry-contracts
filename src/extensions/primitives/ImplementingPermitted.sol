// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IImplementResult} from "../interfaces/IImplementResult.sol";
import { IImplementingPermitted } from "../interfaces/IImplementingPermitted.sol";
import { StatusPrimitive } from "../primitives/Status.sol";


abstract contract ImplementingPermitted is StatusPrimitive {
    
    function _implementingPermitted(uint256 identifier) virtual internal view returns(bool permitted) {
        permitted = _status[identifier] == uint256(IImplementResult.VotingStatusImplement.awaitcall);
    }

}

abstract contract ImplementingPermittedPublicly is IImplementingPermitted, ImplementingPermitted {
    function implementingPermitted(uint256 identifier) external view override(IImplementingPermitted) returns(bool permitted) {
        permitted = _implementingPermitted(identifier);
    }
}