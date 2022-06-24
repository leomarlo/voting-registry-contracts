// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IImplementResult} from "../interfaces/IImplementResult.sol";
import {IImplementingPermitted} from "../interfaces/IImplementingPermitted.sol";
import {CallerGetterAndSetter} from "./CallerGetterAndSetter.sol";
import {CheckCalldataValidity} from "./CheckCalldataValidity.sol";
import {ImplementingPermitted} from "./ImplementingPermitted.sol";
import {ImplementResultPrimitive} from "./ImplementResultPrimitive.sol";


abstract contract ImplementResult is
CallerGetterAndSetter,
IImplementResult,
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
            revert IImplementingPermitted.ImplementingNotPermitted(identifier);
        }

        // check wether this is the correct calldata for the voting instance
        _requireValidCallbackData(identifier, callbackData);

        // retrieve calling contract from the identifier.
        address votingContract = CallerGetterAndSetter._getCaller(identifier);
        
        // implement the result
        (
            IImplementResult.Response _response,
            bytes memory errorMessage
        ) = ImplementResultPrimitive._implement(votingContract, callbackData);
        
        // check whether the response from the call was susccessful
        if (_response==IImplementResult.Response.successful) {
            // TODO: Maybe implementation callback Data is expensive to store on-chain?
            emit IImplementResult.Implemented(identifier, callbackData);
        } else {
            // this can be implemented by the user.
            _handleFailedImplementation(errorMessage);
        } 

        return _response;
    } 


    function _requireValidCallbackData(uint256 identifier, bytes memory callbackData) internal virtual view {}


    /// @dev This is a hook for logic that handles failed implementations.
    /// @dev This function should be overridden if a failed implementation should be recorded on-chain or wrapped in a try and except construction.
    /// @param errorMessage the bytes error message
    function _handleFailedImplementation(bytes memory errorMessage) internal virtual {
        if (errorMessage.length > 0) {
            // bubble up the error
            revert(string(errorMessage));
        } else {
            revert("ImplementResult: implementation failed");
        }
    }

}


abstract contract ImplementResultFromFingerprint is 
CheckCalldataValidity,
ImplementResult 
{
    
    function _requireValidCallbackData(uint256 identifier, bytes memory callbackData) internal view override(ImplementResult) {
        if(!CheckCalldataValidity._isValidCalldata(identifier, callbackData)){
            revert CheckCalldataValidity.InvalidCalldata();
        }
    }
}

        