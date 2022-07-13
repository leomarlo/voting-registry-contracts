// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;


import {IVotingContract} from "../../../votingContractStandard/IVotingContract.sol";
import {NoDoubleVoting} from "../../../extensions/primitives/NoDoubleVoting.sol";
import {Deadline} from "../../../extensions/primitives/Deadline.sol";
import {CastSimpleVote} from "../../../extensions/primitives/CastSimpleVote.sol";
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

// WARNING: THIS IS AN EXAMPLE IMPLEMENTATION. It should not be used for production. This voting contract allows the user to choose and vote on any desired target contract. This could cause problems if that target contract is known to integrate with this voting contract. Otherwise it is a convenient way to trigger a function by popular vote.

/// @dev This implementation of a snapshot vote is not sybill-proof.
contract PlainMajorityVote is 
CallbackHashPrimitive,
CallerGetter,
StatusGetter,
CheckCalldataValidity,
NoDoubleVoting,
CastSimpleVote,
Deadline,
ImplementingPermitted,
BaseVotingContract,
ExpectReturnValue,
HandleImplementationResponse,
ImplementResult
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
    internal
    override(BaseVotingContract) 
    {
        (_caller[identifier], _expectReturnValue[identifier]) = decodeParameters(votingParams);
        Deadline._setDeadline(identifier, VOTING_DURATION);
    }

    function _beforeStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) internal override(BaseVotingContract){
        _callbackHash[identifier] = keccak256(callback);
    }

    /// We obtain the caller and a flag (whether the target function returns a value) from the votingParams' only argument.
    function decodeParameters(bytes memory votingParams) public pure returns(address caller, bool expectReturnValue) {
        (caller, expectReturnValue) = abi.decode(votingParams, (address, bool)); 
    }

    /// We obtain the caller and a flag (whether the target function returns a value) from the votingParams' only argument.
    function encodeParameters(address caller, bool expectReturnValue) public pure returns(bytes memory votingParams) {
        votingParams = abi.encode(caller, expectReturnValue); 
    }




    /// @dev We must implement a vote function 
    function vote(uint256 identifier, bytes memory votingData) 
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
        
        if(NoDoubleVoting._alreadyVoted[identifier][msg.sender]){
            revert NoDoubleVoting.AlreadyVoted(identifier, msg.sender);
        }
        
        NoDoubleVoting._alreadyVoted[identifier][msg.sender] = true;

        bool approve = abi.decode(votingData, (bool));
        CastSimpleVote._castVote(identifier, approve ? int256(1) : int256(-1));
        
        return _status[identifier];
    }


    /// @dev We must implement a result function 
    function result(uint256 identifier) external view override(BaseVotingContract) returns(bytes memory resultData) {
        return abi.encode(CastSimpleVote._getVotes(identifier));   
    }

    function _implementingPermitted(uint256 identifier) internal view override(ImplementingPermitted) returns(bool permitted) {
        bool awaitCall = _status[identifier] == uint256(IImplementResult.VotingStatusImplement.awaitcall); 
        bool finishedVoting = _checkCondition(identifier) && _status[identifier]==uint256(IImplementResult.VotingStatusImplement.active);
        permitted = awaitCall || (finishedVoting && _getVotes(identifier)>0);
    }


    function _setStatus(uint256 identifier) internal {
        _status[identifier] = (_getVotes(identifier)>0) ?
            uint256(IImplementResult.VotingStatusImplement.awaitcall):
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

}
