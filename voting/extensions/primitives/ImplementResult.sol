// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IImplementResult} from "../interfaces/IImplementResult.sol";
import {IImplementingPermitted} from "../interfaces/IImplementingPermitted.sol";
import {CallerPrimitive} from "./Caller.sol";
import {CheckCalldataValidity} from "./CheckCalldataValidity.sol";
import {ImplementingPermitted} from "./ImplementingPermitted.sol";
import {ImplementResultPrimitive} from "./ImplementResultPrimitive.sol";

abstract contract ImplementResult is
IImplementResult,
CallerPrimitive,
ImplementingPermitted,
ImplementResultPrimitive
{

    /// @dev Checks whether the current voting instance permits voting. This is customizable.
    /// @param identifier the index for the voting instance in question
    /// @param callbackData data that is passed along with the function call.
    /// @return response information on whether the call was successful or unsuccessful.
    function implement(uint256 identifier, bytes memory callbackData) 
    external 
    override(IImplementResult)
    returns(IImplementResult.Response) {

        // check whether the current voting instance allows implementation
        if(!_implementingPermitted(identifier)) {
            revert IImplementingPermitted.ImplementingNotPermitted(identifier, _status[identifier]);
        }

        // check wether this is the correct calldata for the voting instance
        _requireValidCallbackData(identifier, callbackData);

        // retrieve calling contract from the identifier.
        address votingContract = CallerPrimitive._caller[identifier];
        
        // implement the result
        (
            IImplementResult.Response _responseStatus,
            bytes memory _responseData
        ) = ImplementResultPrimitive._implement(votingContract, callbackData);
        
        // check whether the response from the call was susccessful
        if (_responseStatus == IImplementResult.Response.successful) {
            // calling a non-contract address by accident can result in a successful response, when it shouldn't.
            // That's why the user is encouraged to implement a return value to the target function and pass to the 
            // votingParams a flag that a return value should be expected.
            _responseStatus = _handleNotFailedImplementation(identifier, _responseData);
        } else {
            // this can be implemented by the user.
            _responseStatus = _handleFailedImplementation(identifier, _responseData);
        } 

        _status[identifier] = _responseStatus == IImplementResult.Response.successful? 
            uint256(IImplementResult.VotingStatusImplement.completed): 
            uint256(IImplementResult.VotingStatusImplement.failed);

        return _responseStatus;
    } 

    function _requireValidCallbackData(uint256 identifier, bytes memory callbackData) internal virtual view {}


    /// @dev This is a hook for logic that handles failed implementations.
    /// @dev This function should be overridden if a failed implementation should be recorded on-chain or wrapped in a try and except construction.
    /// @param responseData the bytes response data
    function _handleFailedImplementation(uint256 identifier, bytes memory responseData) internal virtual returns(IImplementResult.Response responseStatus){}

    function _handleNotFailedImplementation(uint256 identifier, bytes memory responseData) internal virtual returns(IImplementResult.Response responseStatus){}

        
}



        