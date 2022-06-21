// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {VotingContract} from "./BareVotingContract.sol";

import {
    QueryCaller,
    QueryCallbackHash,
    QueryCallbackData
} from "../primitives/QueryIdentifier.sol";

import {ImplementResultFromFingerprint} from "../primitives/Implementing.sol";

// IQueryCallingContract, QueryCallingContract

abstract contract VotingWithImplementing is QueryCallbackHash, QueryCaller, VotingContract, ImplementResultFromFingerprint {

    

    function _beforeStart(uint256 identifier, bytes memory votingParams, bytes memory callback) internal virtual override(VotingContract){
        QueryCallbackHash._setCallbackHash(identifier, keccak256(callback));
        _setCaller(identifier, _retrieveCaller(votingParams));
    }

    function _retrieveCaller(bytes memory votingParams) internal virtual returns(address caller) {
        votingParams;  // silence warnings.
        return msg.sender;
    }

}
