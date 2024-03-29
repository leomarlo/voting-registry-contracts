// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IImplementResult} from "../interfaces/IImplementResult.sol";
import {IImplementingPermitted} from "../interfaces/IImplementingPermitted.sol";
import {TargetPrimitive} from "./Target.sol";
import {CheckCalldataValidity} from "./CheckCalldataValidity.sol";
import {ImplementingPermitted} from "./ImplementingPermitted.sol";
import {ImplementResultPrimitive, HandleImplementationResponse} from "./ImplementResultPrimitive.sol";

abstract contract ImplementResult is
IImplementResult,
TargetPrimitive,
ImplementingPermitted,
HandleImplementationResponse,
ImplementResultPrimitive
{
    
    /// @dev Checks whether the current voting instance permits voting. This is customizable.
    /// @param identifier the index for the voting instance in question
    /// @param callback data that is passed along with the function call.
    /// @return response information on whether the call was successful or unsuccessful.
    function implement(uint256 identifier, bytes calldata callback) 
    external 
    payable
    override(IImplementResult)
    returns(IImplementResult.Response) {

        // check whether the current voting instance allows implementation
        if(!_implementingPermitted(identifier)) {
            revert IImplementingPermitted.ImplementingNotPermitted(identifier, _status[identifier]);
        }

        // check wether this is the correct calldata for the voting instance
        _requireValidCallbackData(identifier, callback);

        // retrieve calling contract from the identifier.
        address callingContract = TargetPrimitive._target[identifier];
        
        // implement the result
        (
            IImplementResult.Response _responseStatus,
            bytes memory _responseData
        ) = ImplementResultPrimitive._implement(
                callingContract, 
                abi.encodePacked(callback, identifier)  // add the identifier to the calldata for good measure (added security!)
            );
        
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

    function _requireValidCallbackData(uint256 identifier, bytes calldata callback) internal virtual view {}

        
}




abstract contract ImplementResultWithInsertion is
IImplementResult,
TargetPrimitive,
ImplementingPermitted,
HandleImplementationResponse,
ImplementResultPrimitive
{
    // stores the number of bytes where the bytes32 should be inserted
    mapping(uint256=>uint48) internal _insertAtByte;

    /// @dev Checks whether the current voting instance permits voting. This is customizable.
    /// @param identifier the index for the voting instance in question
    /// @param callback data that is passed along with the function call.
    /// @return response information on whether the call was successful or unsuccessful.
    function implement(uint256 identifier, bytes calldata callback) 
    external 
    payable
    override(IImplementResult)
    returns(IImplementResult.Response) {

        // check whether the current voting instance allows implementation
        if(!_implementingPermitted(identifier)) revert IImplementingPermitted.ImplementingNotPermitted(identifier, _status[identifier]);

        // check wether this is the correct calldata for the voting instance
        _requireValidCallbackData(identifier, callback);

        // retrieve calling contract from the identifier
        // modify the callback and
        // implement the result
        (
            IImplementResult.Response _responseStatus,
            bytes memory _responseData
        ) = ImplementResultPrimitive._implement(
            TargetPrimitive._target[identifier],
            abi.encodePacked(
                _modifyCallback(identifier, callback),
                identifier
            ));
        


        // check whether the response from the call was susccessful
        // calling a non-contract address by accident can result in a successful response, when it shouldn't.
        // That's why the user is encouraged to implement a return value to the target function and pass to the 
        // votingParams a flag that a return value should be expected. 
        // this can be implemented by the user.
        

        _responseStatus = (_responseStatus == IImplementResult.Response.successful) ? 
                          _handleNotFailedImplementation(identifier, _responseData) :
                          _handleFailedImplementation(identifier, _responseData);


        _status[identifier] = _responseStatus == IImplementResult.Response.successful? 
            uint256(IImplementResult.VotingStatusImplement.completed): 
            uint256(IImplementResult.VotingStatusImplement.failed);

        return _responseStatus;
    } 

    function _modifyCallback(uint256 identifier, bytes calldata callback) virtual internal view returns(bytes memory modifiedCallback){modifiedCallback = callback;}

    function _requireValidCallbackData(uint256 identifier, bytes calldata callback) internal virtual view {}

        
}





        