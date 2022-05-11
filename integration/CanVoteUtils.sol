//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import {REGISTRY} from "../registry/RegistryAddress.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";
import {IVoteContract} from "../voteContract/IVoteContract.sol";

error NotRegisteredVoteContract(address voteContract);
error IsNotWhitelistedVoteContract(address voteContract);
error FunctionDoesntPermitVoting(bytes4 selector);
// error NotPermissibleVoteContractOrSelector(bytes4 selector, address voteContract);
error DoesNotPermitVoting(uint256 voteIndex);
error MayNotCallFunction(address caller);


struct VoteInfo {
    address voteContract;
    uint256 index;
}

/// @title Function Guard 
/// @dev This abstract contract contains both customizable and non-customizable internal functions
///      that help protect against unwanted calls of functions leading to bad manipulations of the contract.
///      They are used in a guard modifier.
abstract contract FunctionGuard {
    
    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev customizable function guard. 
    /// @param selector the selector for the function to be guarded. 
    function _customFunctionGuard(bytes4 selector) 
    internal 
    view 
    virtual
    returns(bool)
    {
        selector;  // silence warnings
        return false;
    }

    /// @dev fixed function guard that is always in place.
    /// @param selector the selector for the function to be guarded. 
    function _functionGuard(bytes4 selector) 
    internal 
    view 
    virtual
    returns(bool)
    {
        selector;  // silence warnings
        return true;
    }

    //////////////////////////////////////////////////
    // GUARD MODIFIERS                              //
    //////////////////////////////////////////////////

    modifier votingGuard(bytes4 selector) {

        bool mayCallFunction = _functionGuard(selector) || _customFunctionGuard(selector);
        if (!mayCallFunction) {
            revert MayNotCallFunction(msg.sender);
        }
        _;
    }

}

abstract contract Whitelisting {

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    mapping(bytes4 => bool) internal votable;
    mapping(address => bool) internal whitelistedVoteContract;
    mapping(bytes4 => address) internal voteContract;
    
    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev approves or disapproves a given function for voting. This allows control, especially to emergency withdraw all voting interactions with this function. 
    function _selectorApproval(bytes4 selector, bool approval) internal {
        votable[selector] = approval;
    }


    /// @dev checks whether a given vote contract satisfies the additional ERC165-interfac for implementing contracts.
    /// @param _voteContract the vote contract whose interface condition is queried.
    function _supportsAdditionalInterfaces(address _voteContract)
    internal 
    virtual 
    view 
    returns(bool)
    {
        _voteContract;  // silence warnings
        return true;
    }

    /// @dev sets the vote contract for this function selector. Both the selector and the contract need to be approved.
    /// @param selector the bytes4 selector of the function
    /// @param _voteContract the vote contract that should handle voting for this function.
    function _setVoteContractForSelector(bytes4 selector, address _voteContract) 
    internal 
    isWhitelisted(_voteContract)
    isVotable(selector)
    {
        voteContract[selector] = _voteContract;
    }

    /// @dev whitelists a vote contact and hooks it up to the function selector.
    /// @param selector the bytes4 selector of the function
    /// @param _voteContract the vote contract that should handle voting for this function
    function _whitelistContractAndSetSelector(bytes4 selector, address _voteContract) 
    internal 
    {
        _whitelistVoteContract(_voteContract, true);
        _setVoteContractForSelector(selector, _voteContract);
    }

    /// @dev approves or disapproves a vote contract
    /// @param _voteContract the vote contract
    function _whitelistVoteContract(address _voteContract, bool approve) 
    internal
    isLegitimateVoteContract(_voteContract)
    {
        whitelistedVoteContract[_voteContract] = approve;
    }

    //////////////////////////////////////////////////
    // GUARD FUNCTIONS                              //
    //////////////////////////////////////////////////

    /// @dev checks whether the votecontract supports all the interfaces that we would like it to support.
    /// @param _voteContract the vote contract that we wish to query.
    modifier isLegitimateVoteContract(address _voteContract) {
        bool legitimate = _supportsAdditionalInterfaces(_voteContract) && IVotingRegistry(REGISTRY).isRegistered(_voteContract);
        if (!legitimate) {
            revert NotRegisteredVoteContract(_voteContract);
        }
        _;
    }

    /// @dev checks whether the contract is whitelisted
    /// @param _voteContract the vote contract that we wish to query.
    modifier isWhitelisted(address _voteContract) {
        if (!whitelistedVoteContract[_voteContract]) {
            revert IsNotWhitelistedVoteContract(_voteContract);
        }
        _;
    }

    /// @dev checks whether this function is allowed to be voted on.
    /// @param selector the bytes4 selector of the function
    modifier isVotable(bytes4 selector) {
        if (!votable[selector]) {
            revert FunctionDoesntPermitVoting(selector);
        }
        _;
    }
    
}


