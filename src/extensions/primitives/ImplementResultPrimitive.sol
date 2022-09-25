// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IImplementResult} from "../interfaces/IImplementResult.sol";


abstract contract ExpectReturnValue {
    // Expected Return
    mapping(uint256 => bool) internal _expectReturnValue;

    // Corresponding Error Message
    error ExpectedReturnError(uint256 identifier);
}


abstract contract ImplementResultPrimitive {

    
    /// @dev a generic internal helper function that calls a function with a given selector in a given contract with some calldata.
    /// @param _contract the address of the contract, whose function ought to be called.
    /// @param callback the calldata for the function call.
    /// @return _response a response flag that can be either successful (1) or failed (2).
    /// @return errorMessage error message.
    function _implement(address _contract, bytes memory callback) 
    internal 
    virtual
    returns(IImplementResult.Response, bytes memory)
    {
        (bool success, bytes memory errorMessage) = _contract.call{value: msg.value}(callback);
        IImplementResult.Response response = success ? IImplementResult.Response.successful : IImplementResult.Response.failed; 
        return (response, errorMessage);
    }
}


    
abstract contract HandleFailedImplementationResponse {
    
    event NotImplemented(uint256 identifier);

    /// @dev This is a hook for logic that handles failed implementations.
    /// @dev This function should be overridden if a failed implementation should be recorded on-chain or wrapped in a try and except construction.
    /// @param responseData the bytes response data
    function _handleFailedImplementation(uint256 identifier, bytes memory responseData) 
    virtual
    internal
    returns(IImplementResult.Response responseStatus)
    {}

}

abstract contract HandleImplementationResponse {

    event Implemented(uint256 identifier);
    
    event NotImplemented(uint256 identifier);

    /// @dev This is a hook for logic that handles failed implementations.
    /// @dev This function should be overridden if a failed implementation should be recorded on-chain or wrapped in a try and except construction.
    /// @param responseData the bytes response data
    function _handleFailedImplementation(uint256 identifier, bytes memory responseData) 
    virtual
    internal 
    returns(IImplementResult.Response responseStatus)
    {}

    function _handleNotFailedImplementation(uint256 identifier, bytes memory responseData)
    virtual
    internal
    returns(IImplementResult.Response responseStatus)
    {}

}




abstract contract HandleImplementationResponseWithErrorsAndEvents is 
ExpectReturnValue, 
HandleImplementationResponse 
{

    function _handleFailedImplementation(uint256 identifier, bytes memory responseData) 
    virtual
    internal 
    override(HandleImplementationResponse) 
    returns(IImplementResult.Response responseStatus)
    {
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
    virtual
    internal 
    override(HandleImplementationResponse) 
    returns(IImplementResult.Response responseStatus){
        // could still be non-successful
        // calling a non-contract address by accident can result in a successful response, when it shouldn't.
        // That's why the user is encouraged to implement a return value to the target function and pass to the 
        // votingParams a flag that a return value should be expected.
        if (_expectReturnValue[identifier] && responseData.length==0) {
            // responseStatus = IImplementResult.Response.failed;
            // emit IImplementResult.NotImplemented(identifier);
            revert ExpectedReturnError(identifier);
        } else {
            responseStatus = IImplementResult.Response.successful;
            emit HandleImplementationResponse.Implemented(identifier);
        }

    }
}




abstract contract HandleImplementationResponseWithoutExpectingResponse is 
HandleImplementationResponse {

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
        responseStatus = IImplementResult.Response.successful;
        emit HandleImplementationResponse.Implemented(identifier);
    }
}



