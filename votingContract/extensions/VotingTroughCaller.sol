// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {VotingContract} from "../VotingContract.sol";

enum Response {none, successful, failed}


contract VotingWithCallbackFingerprint is VotingContract {
    
    mapping(uint256=>bytes32) private _callbackHash;
    
    function _beforeStart(uint256 index, bytes memory votingParams, bytes memory callback)
    internal 
    virtual 
    override(VotingContract)
    {
        _setCallbackHash(index, callback);
    }

    function _setCallbackHash(uint256 index, bytes memory callback) internal {
        _callbackHash[index] = keccak256(callback);
    }

    function _getCallbackHash(uint256 index) internal view returns(bytes32 callbackHash) {
        callbackHash = _callbackHash[index];
    }
}


contract VotingAndImplement is VotingContract {

    /// @dev a generic internal helper function that calls a function with a given selector in a given contract with some calldata.
    /// @param _contract the address of the contract, whose function ought to be called.
    /// @param callbackData the calldata for the function call.
    /// @return _response a response flag that can be either successful (1) or failed (2).
    function _implement(address _contract, bytes memory callbackData) 
    internal 
    virtual
    returns(Response _response)
    {
        (bool success, bytes memory errorMessage) = _contract.call(callbackData);
        _response = success ? Response.successful : Response.failed; 
    }

}

/// @notice Through Caller with options
contract Voting_11 is VotingContract {

    // the voteData contains the 


}

/// @notice Throught Caller without options
contract Voting_10 is VotingContract {

    // the voteData contains the 

}



 