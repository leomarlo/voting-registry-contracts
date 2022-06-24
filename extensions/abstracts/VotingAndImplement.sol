// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {VotingContract} from "./BareVotingContract.sol";

import {CallbackHashGetterAndSetter} from "../primitives/CallbackHashGetterAndSetter.sol";
import { CallerGetterAndSetter} from "../primitives/CallerGetterAndSetter.sol";
import {ImplementResultFromFingerprint} from "../primitives/ImplementResult.sol";

// IQueryCallingContract, QueryCallingContract

abstract contract VotingWithImplementing is CallerGetterAndSetter, CallbackHashGetterAndSetter, ImplementResultFromFingerprint, VotingContract {
    

    function _beforeStart(uint256 identifier, bytes memory votingParams, bytes memory callback) internal virtual override(VotingContract){
        QueryCallbackHash._setCallbackHash(identifier, keccak256(callback));
        CallerGetterAndSetter._setCaller(identifier, _retrieveCaller(votingParams));
    }

    function _retrieveCaller(bytes memory votingParams) internal virtual returns(address caller) {
        votingParams;  // silence warnings.
        return msg.sender;
    }

}
