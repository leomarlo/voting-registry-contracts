// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {IVotingContract} from "../votingContract/IVotingContract.sol";
import {VotingContract} from "../extensions/abstracts/BareVotingContract.sol";
import {DoubleVoting} from "../extensions/primitives/DoubleVoting.sol";
import {Deadline} from "../extensions/primitives/Deadline.sol";
import {CastSimpleVote} from "../extensions/primitives/CastVotes.sol";

/// @dev This implementation of a snapshot vote is not sybill-proof.
contract Snapshot is 
DoubleVoting,
CastSimpleVote,
Deadline,
VotingContract
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
    override(VotingContract) 
    {
        Deadline._setDeadline(identifier, VOTING_DURATION);

    }


    /// @dev We must implement a vote function 
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    virtual 
    override(VotingContract)
    DoubleVoting.doubleVotingGuard(identifier, msg.sender) 
    returns (uint256 status)
    {
        require(status==uint256(IVotingContract.VotingStatus.active), "Voting Status!");
        
        // update status and check whether voting finality condition is reached
        status = _getStatus(identifier);
        if (_checkCondition(identifier)) {
            status = (CastSimpleVote._getVotes(identifier)==0) ?
                     uint256(IVotingContract.VotingStatus.failed) :
                     uint256(IVotingContract.VotingStatus.completed); 
        } else {
            CastSimpleVote._castVote(identifier, 1);
        }
                 
        
    }

    /// @dev We must implement a result function 
    function result(uint256 identifier) external view override(VotingContract) returns(bytes memory resultData) {
        return abi.encode(CastSimpleVote._getVotes(identifier));   
    }

    /// @dev Use the convenient helper function to determine whether the voting has ended or not
    function _checkCondition(uint256 identifier) internal view override(VotingContract) returns(bool condition) {
        condition = Deadline._deadlineHasPast(identifier);
    }


}
