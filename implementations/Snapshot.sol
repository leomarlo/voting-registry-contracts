// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {IVotingContract} from "../votingContract/IVotingContract.sol";
import {BareVotingContract} from "../extensions/abstracts/BareVotingContract.sol";
import {NoDoubleVoting} from "../extensions/primitives/NoDoubleVoting.sol";
import {Deadline} from "../extensions/primitives/Deadline.sol";
import {CastSimpleVote} from "../extensions/primitives/CastSimpleVote.sol";

/// @dev This implementation of a snapshot vote is not sybill-proof.
contract Snapshot is 
NoDoubleVoting,
CastSimpleVote,
Deadline,
BareVotingContract
{

    // GLOBAL DURATION
    uint256 public constant VOTING_DURATION = 5 days;

    // We must implement a start function. 
    // We choose the start function from VotingContract, which handles 
    // the iteration and identification of instances via a progressing index. 
    // The VotingContract demands an implementation of an internal _start function.
    // We implement a trivial _start function for the snapshot vote.
    function _start(uint256 identifier, bytes memory votingParams)
    virtual
    internal
    override(BareVotingContract) 
    {
        Deadline._setDeadline(identifier, VOTING_DURATION);
    }


    /// @dev We must implement a vote function 
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    virtual 
    override(BareVotingContract)
    NoDoubleVoting.doubleVotingGuard(identifier, msg.sender) 
    returns (uint256 status)
    {
        require(status==uint256(IVotingContract.VotingStatus.active), "Voting Status!");
        
        // check whether voting is closed. If yes, then update the status, if no then cast a vote.
        status = _status[identifier];
        if (_checkCondition(identifier)) {
            status = (CastSimpleVote._getVotes(identifier)==0) ?
                     uint256(IVotingContract.VotingStatus.failed) :
                     uint256(IVotingContract.VotingStatus.completed); 
        } else {
            CastSimpleVote._castVote(identifier, 1);
        }
                 
    }

    /// @dev We must implement a result function 
    function result(uint256 identifier) external view override(BareVotingContract) returns(bytes memory resultData) {
        return abi.encode(CastSimpleVote._getVotes(identifier));   
    }

    /// @dev Use the convenient helper function to determine whether the voting has ended or not
    function _checkCondition(uint256 identifier) internal view override(BareVotingContract) returns(bool condition) {
        condition = Deadline._deadlineHasPast(identifier);
    }


}
