// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;


import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IVotingContract} from "../../../votingContractStandard/IVotingContract.sol";
import {
    NoDoubleVoting,
    HandleDoubleVotingGuard
} from "../../../extensions/primitives/NoDoubleVoting.sol";
import {Deadline} from "../../../extensions/primitives/Deadline.sol";
import {CastYesNoAbstainVote} from "../../../extensions/primitives/CastYesNoAbstainVote.sol";
import {CallbackHashPrimitive} from "../../../extensions/primitives/CallbackHash.sol";
import {CheckCalldataValidity} from "../../../extensions/primitives/CheckCalldataValidity.sol";
import {CallerPrimitive, CallerGetter} from "../../../extensions/primitives/Caller.sol";
import {BaseVotingContract} from "../../../extensions/abstracts/BaseVotingContract.sol";
import {ImplementingPermitted} from "../../../extensions/primitives/ImplementingPermitted.sol";
import {IImplementResult} from "../../../extensions/interfaces/IImplementResult.sol";
import {StatusGetter, StatusError} from "../../../extensions/primitives/Status.sol";
import {
    ExpectReturnValue,
    HandleImplementationResponse
} from "../../../extensions/primitives/ImplementResultPrimitive.sol";
import {ImplementResult} from "../../../extensions/primitives/ImplementResult.sol";
import {TokenPrimitive} from "../../../extensions/primitives/TokenPrimitive.sol";
import {QuorumPrimitive} from "../../../extensions/primitives/Quorum.sol";

import {IGetDeadline} from "../../../extensions/interfaces/IGetDeadline.sol";
import {IGetQuorum} from "../../../extensions/interfaces/IGetQuorum.sol";
import {IGetDoubleVotingGuard} from "../../../extensions/interfaces/IGetDoubleVotingGuard.sol";
import {IGetToken} from "../../../extensions/interfaces/IGetToken.sol";


error QuorumExceeded(uint256 quorum);

/// @dev This implementation of a snapshot vote is not sybill-proof.
contract MajorityVoteWithTokenQuorumAndOptionalDVGuard is 
CallbackHashPrimitive,
CallerGetter,
StatusGetter,
CheckCalldataValidity,
TokenPrimitive,
NoDoubleVoting,
IGetDoubleVotingGuard,
IGetToken,
HandleDoubleVotingGuard,
CastYesNoAbstainVote,
IGetDeadline,
Deadline,
IGetQuorum,
QuorumPrimitive,
ImplementingPermitted,
BaseVotingContract,
ExpectReturnValue,
HandleImplementationResponse,
ImplementResult
{

    /// @dev We must implement a start function. 
    function _start(uint256 identifier, bytes memory votingParams, bytes calldata callback)
    virtual
    internal
    override(BaseVotingContract) 
    {
        // Store the status in storage.
        _status[identifier] = uint256(IVotingContract.VotingStatus.active);
        
        address tokenAddress;
        uint256 duration;
        uint256 quorum;
        bool expectReturnValue;
        HandleDoubleVotingGuard.VotingGuard guardOnSenderVotingDataOrNone;
    
        (tokenAddress, 
         duration,
         quorum,
         expectReturnValue, 
         guardOnSenderVotingDataOrNone
        ) = decodeParameters(votingParams);
        
        if (quorum > 1e5){
            revert QuorumExceeded(quorum);
        }

        _caller[identifier] = msg.sender;
        _token[identifier] = tokenAddress;
        _expectReturnValue[identifier] = expectReturnValue;
        _guardOnSenderVotingDataOrNone[identifier] = guardOnSenderVotingDataOrNone;
        _quorum[identifier] = quorum;

        Deadline._setDeadline(identifier, duration);

        // hash the callback
        _callbackHash[identifier] = keccak256(callback);
    }


    /// We obtain the caller and a flag (whether the target function returns a value) from the votingParams' only argument.
    function decodeParameters(bytes memory votingParams)
    public 
    pure
    returns(
        address token,
        uint256 duration,
        uint256 quorumInPercentmilleOfSupply,
        bool expectReturnValue,
        HandleDoubleVotingGuard.VotingGuard guardOnSenderVotingDataOrNone)
    {
        (
            token, 
            duration,
            quorumInPercentmilleOfSupply,
            expectReturnValue, 
            guardOnSenderVotingDataOrNone
        ) = abi.decode(votingParams, (address, uint256, uint256, bool, HandleDoubleVotingGuard.VotingGuard)); 
    }

    /// We obtain the caller and a flag (whether the target function returns a value) from the votingParams' only argument.
    function encodeParameters(
        address token,
        uint256 duration,
        uint256 quorumInPercentmilleOfSupply,
        bool expectReturnValue,
        HandleDoubleVotingGuard.VotingGuard guardOnSenderVotingDataOrNone) 
    public
    pure
    returns(bytes memory votingParams) 
    {
        votingParams = abi.encode(
            token,
            duration,
            quorumInPercentmilleOfSupply,
            expectReturnValue,
            guardOnSenderVotingDataOrNone); 
    }




    /// @dev We must implement a vote function 
    function vote(uint256 identifier, bytes calldata votingData) 
    external 
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
        
        
        uint256 option;
        if (_guardOnSenderVotingDataOrNone[identifier] != HandleDoubleVotingGuard.VotingGuard.none){
            address voter;
            if (_guardOnSenderVotingDataOrNone[identifier] == HandleDoubleVotingGuard.VotingGuard.onSender){
                voter = msg.sender;
                option = abi.decode(votingData, (uint256));
            } else {
                voter = address(bytes20(votingData[0:20]));
                option = abi.decode(votingData[20:votingData.length], (uint256));
            }
            if(NoDoubleVoting._alreadyVoted[identifier][voter]){
                revert NoDoubleVoting.AlreadyVoted(identifier, voter);
            }
            NoDoubleVoting._alreadyVoted[identifier][voter] = true;
        } else {
            option = abi.decode(votingData, (uint256));
        }

        uint256 weight = IERC20(_token[identifier]).balanceOf(msg.sender);
        CastYesNoAbstainVote.VoteOptions voteOption = CastYesNoAbstainVote.VoteOptions(option>2 ? 2 : option);
        CastYesNoAbstainVote._castVote(identifier, voteOption, weight);

        return _status[identifier];
    }


    /// @dev We must implement a result function 
    function result(uint256 identifier) public view override(BaseVotingContract) returns(bytes memory resultData) {
        return abi.encode(CastYesNoAbstainVote._getVotes(identifier));   
    }

    function _implementingPermitted(uint256 identifier) internal view override(ImplementingPermitted) returns(bool permitted) {
        bool awaitCall = _status[identifier] == uint256(IImplementResult.VotingStatusImplement.awaitcall); 
        bool finishedVoting = _checkCondition(identifier) && _status[identifier]==uint256(IImplementResult.VotingStatusImplement.active);
        permitted = awaitCall || (finishedVoting && _outcomeSuccessful(identifier));
    }

    function _outcomeSuccessful(uint256 identifier) internal view returns(bool successFlag){
        uint256[3] memory votes = CastYesNoAbstainVote._getVotes(identifier);
        bool quorum = (votes[0]+votes[1]+votes[2]) * 1e5 >= (IERC20(_token[identifier]).totalSupply() * _quorum[identifier]); 
        return votes[1]>votes[0] && quorum;   
    }


    function _setStatus(uint256 identifier) internal {
        _status[identifier] = _outcomeSuccessful(identifier) ?
            uint256(IImplementResult.VotingStatusImplement.awaitcall) :
            uint256(IImplementResult.VotingStatusImplement.failed); 
    }

    /// @dev Use the convenient helper function to determine whether the voting has ended or not
    function _checkCondition(uint256 identifier) internal view override(BaseVotingContract) returns(bool condition) {
        condition = Deadline._deadlineHasPassed(identifier);
    }

    function _requireValidCallbackData(uint256 identifier, bytes calldata callback) internal view override(ImplementResult) {
        if(!CheckCalldataValidity._isValidCalldata(identifier, callback)){
            revert CheckCalldataValidity.InvalidCalldata();
        }
    }

    function _handleFailedImplementation(uint256 identifier, bytes memory responseData) internal 
    override(HandleImplementationResponse) 
    returns(IImplementResult.Response responseStatus){
        if (responseData.length > 0) {
            assembly {
                revert(add(responseData,32),mload(responseData))
            }
        } else {
            emit HandleImplementationResponse.NotImplemented(identifier);
            return IImplementResult.Response.failed;
        }
    }


    function _handleNotFailedImplementation(uint256 identifier, bytes memory responseData) 
    internal 
    override(HandleImplementationResponse) 
    returns(IImplementResult.Response responseStatus){
        // could still be non-successful
        // calling a non-contract address by accident can result in a successful response, when it shouldn't.
        // That's why the user is encouraged to implement a return value to the target function and pass to the 
        // votingParams a flag that a return value should be expected.
        if (_expectReturnValue[identifier] && responseData.length==0) {
            revert ExpectedReturnError(identifier);
        } else {
            responseStatus = IImplementResult.Response.successful;
            emit HandleImplementationResponse.Implemented(identifier);
        }

    }


    function getDeadline(uint256 identifier) 
    external view
    override(IGetDeadline) 
    returns(uint256) {
        return _deadline[identifier];
    }

    function getQuorum(uint256 identifier) 
    external view
    override(IGetQuorum) 
    returns(uint256 quorum, uint256 inUnitsOf) {
        return (_quorum[identifier], 1e5);
    }
    
    function getToken(uint256 identifier) 
    external view
    override(IGetToken) 
    returns(address) {
        return _token[identifier];
    }

    function getDoubleVotingGuard(uint256 identifier)
    external view
    override(IGetDoubleVotingGuard)
    returns(HandleDoubleVotingGuard.VotingGuard) {
        // by default any vote that is not inactive has this guard enabled
        return _guardOnSenderVotingDataOrNone[identifier];
    } 

    function supportsInterface(bytes4 interfaceId) public pure virtual override(BaseVotingContract) returns (bool) {
        return 
            super.supportsInterface(interfaceId) ||
            interfaceId == type(IGetDeadline).interfaceId ||
            interfaceId == type(IGetDoubleVotingGuard).interfaceId ||
            interfaceId == type(IGetQuorum).interfaceId ||
            interfaceId == type(IGetToken).interfaceId;
    }

}
