// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { BareVotingContract } from "./BareVotingContract.sol";

import { CallbackHashPrimitive } from "../primitives/CallbackHash.sol";
import { CallerPrimitive } from "../primitives/Caller.sol";
import { StatusPrimitive } from "../primitives/Status.sol";
import { ImplementResultFromFingerprint } from "../primitives/ImplementResult.sol";

// IQueryCallingContract, QueryCallingContract

abstract contract VotingWithImplementing is CallerPrimitive, CallbackHashPrimitive, ImplementResultFromFingerprint, BareVotingContract {
    

    function _beforeStart(uint256 identifier, bytes memory votingParams, bytes memory callback) internal virtual override(BareVotingContract){
        CallbackHashPrimitive._callbackHash[identifier] = keccak256(callback);
        CallerPrimitive._caller[identifier] = _retrieveCaller(votingParams);
    }

    function _retrieveCaller(bytes memory votingParams) internal virtual returns(address caller) {
        votingParams;  // silence warnings.
        return msg.sender;
    }

}
