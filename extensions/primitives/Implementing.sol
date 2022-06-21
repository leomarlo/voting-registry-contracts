// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IImplementResult} from "../interfaces/IImplementResult.sol";
import {IQueryCaller} from "../interfaces/IQueryIdentifier.sol";
import {AImplementingPermitted} from "../interfaces/AQueryStatus.sol";
import {QueryCaller} from "./QueryIdentifier.sol";
import {ACheckCalldataValidity} from "../interfaces/ACheckCalldataValidity.sol";
import {CheckCalldataValidity} from "./CheckCalldataValidity.sol";


import { IImplementingPermitted } from "../interfaces/IQueryStatus.sol";
import { QueryStatus } from "../primitives/QueryIdentifier.sol";


abstract contract ImplementingPermitted is QueryStatus, AImplementingPermitted {
    function _implementingPermitted(uint256 identifier) virtual internal view override(AImplementingPermitted) returns(bool permitted) {
        permitted = _getStatus(identifier) == uint256(IImplementResult.VotingStatus.awaitcall);
    }
}

abstract contract ImplementingPermittedPublicallyVisible is IImplementingPermitted, ImplementingPermitted {
    function implementingPermitted(uint256 identifier) external view override(IImplementingPermitted) returns(bool permitted) {
        permitted = _implementingPermitted(identifier);
    }
}

abstract contract ImplementResultPrimitive {

    /// @dev a generic internal helper function that calls a function with a given selector in a given contract with some calldata.
    /// @param _contract the address of the contract, whose function ought to be called.
    /// @param callbackData the calldata for the function call.
    /// @return _response a response flag that can be either successful (1) or failed (2).
    /// @return errorMessage error message.
    function _implement(address _contract, bytes memory callbackData) 
    internal 
    virtual
    returns(IImplementResult.Response, bytes memory)
    {
        (bool success, bytes memory errorMessage) = _contract.call(callbackData);
        IImplementResult.Response response = success ? IImplementResult.Response.successful : IImplementResult.Response.failed; 
        return (response, errorMessage);
    }
}



abstract contract ImplementResult is 
ImplementResultPrimitive, 
ImplementingPermitted,
ACheckCalldataValidity,
IImplementResult, 
QueryCaller
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
            revert AImplementingPermitted.ImplementingNotPermitted(identifier);
        }

        // check wether this is the correct calldata for the voting instance
        _requireValidCallbackData(identifier, callbackData);

        // retrieve calling contract from the identifier.
        address votingContract = _getCaller(identifier);
        
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
ACheckCalldataValidity,
CheckCalldataValidity,
ImplementResult 
{
    
    function _requireValidCallbackData(uint256 identifier, bytes memory callbackData) internal view override(ImplementResult) {
        if(!CheckCalldataValidity._isValidCalldata(identifier, callbackData)){
            revert ACheckCalldataValidity.InvalidCalldata();
        }
    }
}

        