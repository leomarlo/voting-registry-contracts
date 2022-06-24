// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IImplementResult} from "../interfaces/IImplementResult.sol";
import { IImplementingPermitted } from "../interfaces/IImplementingPermitted.sol";
import { StatusGetterAndSetter } from "../primitives/StatusGetterAndSetter.sol";


abstract contract ImplementingPermitted is StatusGetterAndSetter {

    

    function _implementingPermitted(uint256 identifier) virtual internal view returns(bool permitted) {
        permitted = _getStatus(identifier) == uint256(IImplementResult.VotingStatus.awaitcall);
    }

}

abstract contract ImplementingPermittedPublicly is IImplementingPermitted, ImplementingPermitted {
    function implementingPermitted(uint256 identifier) external view override(IImplementingPermitted) returns(bool permitted) {
        permitted = _implementingPermitted(identifier);
    }
}