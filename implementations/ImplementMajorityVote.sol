// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {IVotingContract} from "../votingContract/IVotingContract.sol";
import {VotingContract} from "../extensions/abstracts/BareVotingContract.sol";
import {DoubleVoting} from "../extensions/primitives/DoubleVoting.sol";
import {Deadline} from "../extensions/primitives/Deadline.sol";
import {CastSimpleVote} from "../extensions/primitives/CastVotes.sol";
import {VotingWithImplementing} from "../extensions/abstracts/VotingAndImplement.sol";
import {ImplementingPermitted} from "../extensions/primitives/Implementing.sol";
import {IImplementResult} from "../extensions/interfaces/IImplementResult.sol";

/// @dev This implementation of a snapshot vote is not sybill-proof.
contract ImplementMajorityVote is 
DoubleVoting,
CastSimpleVote,
Deadline,
ImplementingPermitted,
VotingWithImplementing
{

    // GLOBAL DURATION
    uint256 public constant VOTING_DURATION = 5 days;


    /// @dev We must implement a start function. 
    // We choose the start function from VotingWithImplementing, which handles 
    // the iteration and identification of instances via a progressing index (VotingContract)
    // and it handles the implementation retrieving first the calling contract and upon
    // a successful vote it calls that contract with the calldata.
    // The VotingContract demands an implementation of an internal _start function.
    // The Implementation demands an implementation of the internal _retrieveCaller function. 
    // We implement a trivial _start function for the snapshot vote.
    function _start(uint256 identifier, bytes memory votingParams)
    virtual
    internal
    override(VotingWithImplementing) 
    {
        Deadline._setDeadline(identifier, VOTING_DURATION);

    }

    /// We retrieve the caller from the votingParams' only argument.
    function _retrieveCaller(bytes memory votingParams) internal override(VotingWithImplementing) pure returns(address caller) {
        (caller) = abi.decode(votingParams, (address)); 
    }


    /// @dev We must implement a vote function 
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    virtual 
    override(VotingWithImplementing)
    DoubleVoting.doubleVotingGuard(identifier, msg.sender) 
    returns (uint256 status)
    {
        require(status==uint256(IImplementResult.VotingStatus.active), "Voting Status!");
        
        // check whether voting is closed. If yes, then update the status, if no then cast a vote.
        status = _getStatus(identifier);
        if (_checkCondition(identifier)) {
            status = (CastSimpleVote._getVotes(identifier)<=0) ?
                     uint256(IImplementResult.VotingStatus.failed) :
                     uint256(IImplementResult.VotingStatus.awaitcall);
        } else {
            CastSimpleVote._castVote(identifier, 1);
        }
       
    }


    /// @dev We must implement a result function 
    function result(uint256 identifier) external view override(VotingWithImplementing) returns(bytes memory resultData) {
        return abi.encode(CastSimpleVote._getVotes(identifier));   
    }


    /// @dev Use the convenient helper function to determine whether the voting has ended or not
    function _checkCondition(uint256 identifier) internal view override(VotingWithImplementing) returns(bool condition) {
        condition = Deadline._deadlineHasPast(identifier);
    }

}
