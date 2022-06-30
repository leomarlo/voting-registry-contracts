// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {IVotingContract} from "../votingContract/IVotingContract.sol";
import {NoDoubleVoting} from "../extensions/primitives/NoDoubleVoting.sol";
import {Deadline} from "../extensions/primitives/Deadline.sol";
import {CastSimpleVote} from "../extensions/primitives/CastSimpleVote.sol";
import {CallbackHashPrimitive} from "../extensions/primitives/CallbackHash.sol";
import {CallerPrimitive} from "../extensions/primitives/Caller.sol";
import {BareVotingContract} from "../extensions/abstracts/BareVotingContract.sol";
import {VotingWithImplementing} from "../extensions/abstracts/VotingWithImplementing.sol";
import {ImplementingPermitted} from "../extensions/primitives/ImplementingPermitted.sol";
import {IImplementResult} from "../extensions/interfaces/IImplementResult.sol";

/// @dev This implementation of a snapshot vote is not sybill-proof.
contract ImplementMajorityVote is 
CallbackHashPrimitive,
CallerPrimitive,
NoDoubleVoting,
CastSimpleVote,
Deadline,
ImplementingPermitted,
BareVotingContract
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
    override(BareVotingContract) 
    {
        Deadline._setDeadline(identifier, VOTING_DURATION);
    }

    function _beforeStart(uint256 identifier, bytes memory votingParams, bytes memory callback) internal virtual override(BareVotingContract){
        CallbackHashPrimitive._callbackHash[identifier] = keccak256(callback);
        CallerPrimitive._caller[identifier] = _retrieveCaller(votingParams);
    }

    /// We retrieve the caller from the votingParams' only argument.
    function _retrieveCaller(bytes memory votingParams) internal pure returns(address caller) {
        (caller) = abi.decode(votingParams, (address)); 
    }


    /// @dev We must implement a vote function 
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    virtual 
    override(BareVotingContract)
    NoDoubleVoting.doubleVotingGuard(identifier, msg.sender) 
    returns (uint256 status)
    {
        require(_status[identifier]==uint256(IImplementResult.VotingStatusImplement.active), "Voting Status!");
        
        // check whether voting is closed. If yes, then update the status, if no then cast a vote.
        status = _status[identifier];
        if (_checkCondition(identifier)) {
            status = (CastSimpleVote._getVotes(identifier)<=0) ?
                     uint256(IImplementResult.VotingStatusImplement.failed) :
                     uint256(IImplementResult.VotingStatusImplement.awaitcall);
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
