// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;


import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVotingContract} from "../../../votingContractStandard/IVotingContract.sol";
import {BaseVotingContract} from "../../../extensions/abstracts/BaseVotingContract.sol";
import {
    NoDoubleVoting,
    HandleDoubleVotingGuard
} from "../../../extensions/primitives/NoDoubleVoting.sol";
import {Deadline} from "../../../extensions/primitives/Deadline.sol";
import {CastYesNoAbstainVote} from "../../../extensions/primitives/CastYesNoAbstainVote.sol";
import {StatusGetter, StatusError} from "../../../extensions/primitives/Status.sol";
import {CallerGetter} from "../../../extensions/primitives/Caller.sol";
import {TokenPrimitive} from "../../../extensions/primitives/TokenPrimitive.sol";


/// @dev This implementation of a snapshot vote is not sybill-proof.
contract YesNoAbstainSnapshotWithToken is 
NoDoubleVoting,
HandleDoubleVotingGuard,
CastYesNoAbstainVote,
Deadline,
TokenPrimitive,
StatusGetter,
CallerGetter,
BaseVotingContract
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
    override(BaseVotingContract) 
    {
        (_token[identifier], _handleDoubleVotingGuard[identifier]) = decodeParameters(votingParams);
        Deadline._setDeadline(identifier, VOTING_DURATION);
    }


    /// @dev We must implement a vote function 
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    virtual 
    override(BaseVotingContract)
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
        if (_handleDoubleVotingGuard[identifier]){
            NoDoubleVoting._alreadyVoted[identifier][msg.sender] = true;
        }
        
        
        uint256 option = abi.decode(votingData, (uint256));
        uint256 weight = IERC20(_token[identifier]).balanceOf(msg.sender);
        CastYesNoAbstainVote.VoteOptions voteOption = CastYesNoAbstainVote.VoteOptions(option>2 ? 2 : option);
        CastYesNoAbstainVote._castVote(identifier, voteOption, weight);

        return _status[identifier]; 
                 
    }

    /// @dev We must implement a result function 
    function result(uint256 identifier) external view override(BaseVotingContract) returns(bytes memory resultData) {
        return abi.encode(CastYesNoAbstainVote._getVotes(identifier));   
    }

    function conclude(uint256 identifier) external {
        if(_status[identifier]!=uint256(IVotingContract.VotingStatus.active)) {
            revert StatusError(identifier, _status[identifier]);
        }
        if(!_checkCondition(identifier)) {
            revert Deadline.DeadlineHasNotPassed(identifier, _deadline[identifier]);
        }

        _setStatus(identifier);
    }

    /// We obtain the caller and a flag (whether the target function returns a value) from the votingParams' only argument.
    function decodeParameters(bytes memory votingParams) 
    public
    pure 
    returns(address token, bool handleDoubleVotingGuard) {
        (token, handleDoubleVotingGuard) = abi.decode(votingParams, (address, bool));
    }

    /// We obtain the caller and a flag (whether the target function returns a value) from the votingParams' only argument.
    function encodeParameters(address token, bool handleDoubleVotingGuard) 
    public 
    pure 
    returns(bytes memory votingParams) 
    {
        votingParams = abi.encode(token, handleDoubleVotingGuard); 
    }

    function _setStatus(uint256 identifier) internal {
        uint256[3] memory votes = CastYesNoAbstainVote._getVotes(identifier);
        _status[identifier] = (votes[1]>votes[0]) ?
            uint256(IVotingContract.VotingStatus.completed) :
            uint256(IVotingContract.VotingStatus.failed); 
    }

    /// @dev Use the convenient helper function to determine whether the voting has ended or not
    function _checkCondition(uint256 identifier) internal view override(BaseVotingContract) returns(bool condition) {
        condition = Deadline._deadlineHasPassed(identifier);
    }


}
