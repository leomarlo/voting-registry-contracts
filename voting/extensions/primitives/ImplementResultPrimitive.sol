// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IImplementResult} from "../interfaces/IImplementResult.sol";

abstract contract ImplementResultPrimitive {

    /// @dev a generic internal helper function that calls a function with a given selector in a given contract with some calldata.
    /// @param _contract the address of the contract, whose function ought to be called.
    /// @param callbackData the calldata for the function call.
    /// @return _response a response flag that can be either successful (1) or failed (2).
    /// @return errorMessage error message.
    function _implement(address _contract, bytes calldata callbackData) 
    internal 
    virtual
    returns(IImplementResult.Response, bytes memory)
    {
        (bool success, bytes memory errorMessage) = _contract.call(callbackData);
        IImplementResult.Response response = success ? IImplementResult.Response.successful : IImplementResult.Response.failed; 
        return (response, errorMessage);
    }
}
