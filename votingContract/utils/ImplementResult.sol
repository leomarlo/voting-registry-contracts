// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {VotingContract} from "../VotingContract.sol";
import {IImplementResult} from "./IImplementResult.sol";

import {IQueryCallingContract} from "./IQueryIdentifier.sol";
import {QueryCallingContract} from "./QueryIdentifier.sol";

abstract contract ImplementResult is IImplementResult, IQueryCallingContract, QueryCallingContract {

    /// @dev a generic internal helper function that calls a function with a given selector in a given contract with some calldata.
    /// @param _contract the address of the contract, whose function ought to be called.
    /// @param callbackData the calldata for the function call.
    /// @return _response a response flag that can be either successful (1) or failed (2).
    /// @return errorMessage error message.
    function _implement(address _contract, bytes memory callbackData) 
    internal 
    virtual
    returns(Response, bytes memory)
    {
        (bool success, bytes memory errorMessage) = _contract.call(callbackData);
        Response response = success ? Response.successful : Response.failed; 
        return (response, errorMessage);
    }

    /// @dev Checks whether the current voting instance permits voting. This is customizable.
    /// @param identifier the index for the voting instance in question
    /// @param callbackData data that is passed along with the function call.
    /// @return response information on whether the call was successful or unsuccessful.
    function implement(uint256 identifier, bytes memory callbackData) external returns(Response) {
        address votingContract = getCallingContract(identifier);
        (Response _response, bytes memory errorMessage) = _implement(votingContract, callbackData);
        
        if (_response==IImplementResult.Response.successful) {
            emit IImplementResult.Implemented(identifier, callbackData);
        } else {
            _handleFailedImplementation(errorMessage);
        } 
        return _response;
    } 

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
