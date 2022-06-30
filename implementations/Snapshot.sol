// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {IVotingContract} from "../votingContract/IVotingContract.sol";
import {BareVotingContract} from "../extensions/abstracts/BareVotingContract.sol";
import {NoDoubleVoting} from "../extensions/primitives/NoDoubleVoting.sol";
import {Deadline} from "../extensions/primitives/Deadline.sol";
import {CastSimpleVote} from "../extensions/primitives/CastSimpleVote.sol";
import {StatusGetter, StatusError} from "../extensions/primitives/Status.sol";
import {CallerGetter} from "../extensions/primitives/Caller.sol";


/// @dev This implementation of a snapshot vote is not sybill-proof.
contract Snapshot is 
NoDoubleVoting,
CastSimpleVote,
Deadline,
StatusGetter,
CallerGetter,
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
    returns (uint256)
    {

        if(_status[identifier]!=uint256(IVotingContract.VotingStatus.active)) {
            revert StatusError(identifier, _status[identifier]);
        }
        
        // check whether voting is closed. If yes, then update the status, if no then cast a vote.
        if (_checkCondition(identifier)) {
            _setStatus(identifier);
            return _status[identifier]; 
        } 

        if(NoDoubleVoting._alreadyVoted[identifier][msg.sender]){
            revert NoDoubleVoting.AlreadyVoted(identifier, msg.sender);
        }
        
        NoDoubleVoting._alreadyVoted[identifier][msg.sender] = true;
        
        bool approve = abi.decode(votingData, (bool));
        CastSimpleVote._castVote(identifier, approve ? int256(1) : int256(-1));

        return _status[identifier]; 
                 
    }

    /// @dev We must implement a result function 
    function result(uint256 identifier) external view override(BareVotingContract) returns(bytes memory resultData) {
        return abi.encode(CastSimpleVote._getVotes(identifier));   
    }

    function conclude(uint256 identifier) external {
        if(_status[identifier]!=uint256(IVotingContract.VotingStatus.active)) {
            revert StatusError(identifier, _status[identifier]);
        }
        if(!_checkCondition(identifier)) {
            revert Deadline.DeadlineHasNotPast(identifier, _deadline[identifier]);
        }

        _setStatus(identifier);
    }

    function _setStatus(uint256 identifier) internal {
        _status[identifier] = (CastSimpleVote._getVotes(identifier)==0) ?
                     uint256(IVotingContract.VotingStatus.failed) :
                     uint256(IVotingContract.VotingStatus.completed); 
    }

    /// @dev Use the convenient helper function to determine whether the voting has ended or not
    function _checkCondition(uint256 identifier) internal view override(BareVotingContract) returns(bool condition) {
        condition = Deadline._deadlineHasPast(identifier);
    }


}
