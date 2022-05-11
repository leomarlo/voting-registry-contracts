////////////////////////////////////////////////////////////////////////////
//                                                                        //
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ //
// ░░░░░░░░░░░██╗░░░██╗░█████╗░████████╗██╗███╗░░██╗░██████╗░░░░░░░░░░░░░ //
// ░░░░░░░░░░░██║░░░██║██╔══██╗╚══██╔══╝██║████╗░██║██╔════╝░░░░░░░░░░░░░ //
// ░░░░░░░░░░░╚██╗░██╔╝██║░░██║░░░██║░░░██║██╔██╗██║██║░░██╗░░░░░░░░░░░░░ //
// ░░░░░░░░░░░░╚████╔╝░██║░░██║░░░██║░░░██║██║╚████║██║░░╚██╗░░░░░░░░░░░░ //
// ░░░░░░░░░░░░░╚██╔╝░░╚█████╔╝░░░██║░░░██║██║░╚███║╚██████╔╝░░░░░░░░░░░░ //
// ░░░░░░░░░░░░░░╚═╝░░░░╚════╝░░░░╚═╝░░░╚═╝╚═╝░░╚══╝░╚═════╝░░░░░░░░░░░░░ //
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ //    
// ░░░█████╗░░█████╗░███╗░░██╗████████╗██████╗░░█████╗░░█████╗░████████╗░ //
// ░░██╔══██╗██╔══██╗████╗░██║╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝░ //
// ░░██║░░╚═╝██║░░██║██╔██╗██║░░░██║░░░██████╔╝███████║██║░░╚═╝░░░██║░░░░ //
// ░░██║░░██╗██║░░██║██║╚████║░░░██║░░░██╔══██╗██╔══██║██║░░██╗░░░██║░░░░ //
// ░░╚█████╔╝╚█████╔╝██║░╚███║░░░██║░░░██║░░██║██║░░██║╚█████╔╝░░░██║░░░░ //
// ░░░╚════╝░░╚════╝░╚═╝░░╚══╝░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝░╚════╝░░░░╚═╝░░░░ //
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ //
//                                                                        //
////////////////////////////////////////////////////////////////////////////
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY without even the implied warranty of MERCHANTABILITY 
// or FITNESS FOR A PARTICULAR PURPOSE. See the 
// GNU Affero General Public License for more details.
//
//
// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {REGISTRY} from "../registry/RegistryAddress.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";
import {IVoteContract, IVoteAndImplementContract, Callback, Response} from "./IVoteContract.sol";

enum VotingStatus {inactive, completed, failed, active}

error StatusPermitsVoting(address caller, uint256 voteIndex);
error MayOnlyRegisterOnce(address caller, bytes8 categoryId);

/// @author Leonhard Horstmeyer  <leonhard.horstmeyer@gmail.com>
/// @title Register Vote Contact
/// @dev This abstract contract handles the basic registration steps, including the support of the vote contract interface that allows it to be registered. 
abstract contract RegisterVoteContract is IERC165 {

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    bytes8[] public categories;


    //////////////////////////////////////////////////
    // WRITE FUNCTIONS                              //
    //////////////////////////////////////////////////

    /// @dev registers this vote contract to the registry. Reverts if it is called more than once
    /// @param categoryId the category that this contract wishes to register.
    function register(bytes8 categoryId)
    external 
    {
        if (categories.length>0){revert MayOnlyRegisterOnce(msg.sender, categoryId);}
        IVotingRegistry(REGISTRY).register(categoryId);
        categories.push(categoryId);
    }


    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev interfaces the addCategoryToRegistration function of the registry. Also adds a reverse lookup locally on this contract.
    /// @param categoryId the category id that ought to be added to this contract
    function _addCategoryToRegistration(bytes8 categoryId)
    internal 
    {
        IVotingRegistry(REGISTRY).addCategoryToRegistration(categoryId);
        categories.push(categoryId);
    }

    /// @dev the ERC165 function that allows other contracts to check whether the relevant interfaces are present.
    function supportsInterface(bytes4 interfaceId) public pure virtual override(IERC165) returns (bool) {
        return 
            interfaceId == type(IVoteContract).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
}

/// @title Voting Status Handling - Abstract Contract.
/// @dev This contract handles just the voting status, its getter functions and its modifiers.
///      The basic states that should be respected by every vote contract are 
///      0 = inactive, 1 = completed, 2 = failed, 3 = active
///      There is an enum called VotingStatus that can be inherited to enforce those fixed alocations. 
///      However we deliberately want to leave it open to the implementation to add further states, depending on the needs of the logic.
abstract contract VotingStatusHandling{
    
    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    mapping(address=>mapping(uint256=>uint256)) internal votingStatus; 


    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    function _statusPermitsVoting(uint256 voteIndex) internal view returns(bool) {
        return votingStatus[msg.sender][voteIndex] >= 3;
    }


    //////////////////////////////////////////////////
    // GETTER FUNCTIONS                             //
    //////////////////////////////////////////////////

    function getCurrentVotingStatus(uint256 voteIndex) public view returns(uint256) {
        return votingStatus[msg.sender][voteIndex];
    }


    //////////////////////////////////////////////////
    // GUARD MODIFIERS                              //
    //////////////////////////////////////////////////

    modifier permitsVoting(uint256 voteIndex) {
        if (!_statusPermitsVoting(voteIndex)) {
            revert StatusPermitsVoting(msg.sender, voteIndex);
        }
        _;
    }
}

/// @title Vote Contract Primitive 
/// @author Leonhard Horstmeyer  <leonhard.horstmeyer@gmail.com>
/// @dev These is the basic ingredients that any vote contract should have or implement.
abstract contract VoteContractPrimitive is IERC165, RegisterVoteContract, VotingStatusHandling, IVoteContract {

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    mapping(address=>uint256) internal _registeredVotes;


    //////////////////////////////////////////////////
    // WRITE FUNCTIONS                              //
    //////////////////////////////////////////////////

    function vote(uint256 voteIndex, address voter, uint256 option) external virtual override(IVoteContract) returns(uint256 status);


    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    function _start(bytes memory votingParams) 
    internal
    virtual
    returns(uint256 voteIndex)
    {
        votingParams;  // silence compiler warnings.
        return 0;
    }

    /// @dev This function checks whether the conditions are met for the vote instance transition out of the active status. It still needs to be checked then whether it will fail or be complete
    /// @param voteIndex the index for the voting instance in question
    function condition(uint voteIndex) internal view virtual returns(bool);    


    //////////////////////////////////////////////////
    // GETTER FUNCTIONS                             //
    //////////////////////////////////////////////////
    
    /// @dev This function needs to be implemented so that the contract that calls this voting instance can also query its result. One may of course also allow anyone to query the result. It is up to the creator of the inheriting contract to choose.
    /// @param voteIndex the index for the voting instance in question
    function result(uint256 voteIndex) external view virtual override(IVoteContract) returns(bytes32 votingResult);

    /// @dev Checks whether the current voting instance permits voting. This is customizable.
    /// @param voteIndex the index for the voting instance in question
    function statusPermitsVoting(uint256 voteIndex) external view virtual override(IVoteContract) returns(bool);

    /// @dev get the number of vote instances that this caller has already initiated.
    /// @param caller The address of the calling contract, whose number of vote instances is queried.
    function getCurrentVoteIndex(address caller) public view returns(uint256){
        return _registeredVotes[caller];
    }

    /// @dev the ERC165 function that allows other contracts to check whether the relevant interfaces are present.
    function supportsInterface(bytes4 interfaceId) public pure virtual override(IERC165, RegisterVoteContract) returns (bool) {
        return 
            super.supportsInterface(interfaceId) ||
            interfaceId == type(VoteContract).interfaceId;
    }

    modifier activateNewVote {
        _registeredVotes[msg.sender] += 1;
        _;
        votingStatus[msg.sender][getCurrentVoteIndex(msg.sender)] = uint256(uint8(VotingStatus.active));
    }
    
}


/// @title Vote Contract - Main implementation of the inheritable vote contract.
/// @author Leonhard Horstmeyer  <leonhard.horstmeyer@gmail.com>
/// @dev This contract implements the necessary functions that a simple Vote Contract should implement.
abstract contract VoteContract is IVoteContract, VoteContractPrimitive {
    
    //////////////////////////////////////////////////
    // WRITE FUNCTIONS                              //
    //////////////////////////////////////////////////

    /// @dev This function exposes the initiation of a new voting instance to an external caller.
    /// @param votingParams these are the bytes-encoded voting parameters that allow the inheriting contract to decide about the specifics of this vote.
    function start(bytes memory votingParams)
    public
    override(IVoteContract) 
    activateNewVote
    returns(uint256 voteIndex) {
        voteIndex = _start(votingParams);
    }

    /// @dev The vote function needs to be implemented by the inheriting contract. There is quite a bit of liberty in the choice of implementation here.
    /// @param voteIndex the index for the voting instance in question
    function vote(uint256 voteIndex, address voter, uint256 option) external virtual override(IVoteContract, VoteContractPrimitive) returns (uint256 status);
    

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev A helper function that handles the initiation of a new voting instance. It needs to be implemented by the creator of the inheriting contract.
    /// @param votingParams these are the bytes-encoded voting parameters that allow the inheriting contract to decide about the specifics of this vote.
    /// @return voteIndex the index of the vote instance on this vote Contract.
    function _start(bytes memory votingParams) 
    virtual
    internal
    override(VoteContractPrimitive)
    returns(uint256 voteIndex)
    {
        votingParams;  // silence compiler warnings.
        return 0;
    }

    /// @dev This function checks whether the conditions are met for the vote instance transition out of the active status. It still needs to be checked then whether it will fail or be complete
    /// @param voteIndex the index for the voting instance in question
    function condition(uint voteIndex) internal view virtual override(VoteContractPrimitive) returns(bool);


    //////////////////////////////////////////////////
    // GETTER FUNCTIONS                             //
    //////////////////////////////////////////////////

    /// @dev This function needs to be implemented so that the contract that calls this voting instance can also query its result. One may of course also allow anyone to query the result. It is up to the creator of the inheriting contract to choose.
    /// @param voteIndex the index for the voting instance in question
    function result(uint256 voteIndex) external view virtual override(IVoteContract, VoteContractPrimitive) returns(bytes32 votingResult);

    /// @dev Checks whether the current voting instance permits voting. This is customizable.
    /// @param voteIndex the index for the voting instance in question
    function statusPermitsVoting(uint256 voteIndex) external view virtual override(IVoteContract, VoteContractPrimitive) returns(bool);

}


/// @title Implement Callback
/// @dev A generic abstract contract that can call functions on a target contract.
abstract contract ImplementCallback {

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev a generic internal helper function that calls a function with a given selector in a given contract with some calldata.
    /// @param _contract the address of the contract, whose function ought to be called.
    /// @param selector the bytes4-encoding of the function that ought to be called.
    /// @param callback the calldata for the function call.
    /// @return _response a response flag that can be either successful (1) or failed (2).
    function _implement(address _contract, bytes4 selector, Callback memory callback) 
    internal 
    returns(Response _response)
    {
        (bool success, ) = _contract.call(
            abi.encodePacked(
                selector,
                callback));
        _response = success ? Response.successful : Response.failed; 
    }
}

abstract contract VoteAndImplementContract is IVoteContract, VoteContractPrimitive, ImplementCallback, IVoteAndImplementContract {

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    mapping(address=>mapping(uint256=>Callback)) internal callback;


    //////////////////////////////////////////////////
    // WRITE FUNCTIONS                              //
    //////////////////////////////////////////////////

    /// @dev This function exposes the initiation of a new voting instance to an external caller.
    /// @param votingParams these are the bytes-encoded voting parameters that allow the inheriting contract to decide about the specifics of this vote.
    function start(bytes memory votingParams)
    public
    override(IVoteContract) 
    activateNewVote
    returns(uint256 voteIndex) {
        voteIndex = _start(votingParams);
    }

    /// @dev The vote function needs to be implemented by the inheriting contract. There is quite a bit of liberty in the choice of implementation here.
    /// @param voteIndex the index for the voting instance in question
    function vote(uint256 voteIndex, address voter, uint256 option) external virtual override(IVoteContract, VoteContractPrimitive) returns (uint256 status);
    

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    function _implement(uint256 voteIndex) 
    internal
    {
        callback[msg.sender][voteIndex].response = _implement(msg.sender, callback[msg.sender][voteIndex].selector, callback[msg.sender][voteIndex].arguments);
    }

    function _start(bytes memory votingParams) 
    virtual
    internal
    override(VoteContractPrimitive)
    returns(uint256 voteIndex)
    {
        votingParams;  // silence compiler warnings.
        return 0;
    }

    
    function result(uint256 voteIndex) external view virtual override(IVoteContract, VoteContractPrimitive) returns(bytes32 votingResult);

    function condition(uint voteIndex) internal view virtual override(VoteContractPrimitive) returns(bool);

    function statusPermitsVoting(uint256 voteIndex) external view virtual override(IVoteContract, VoteContractPrimitive) returns(bool);

    function start(
        bytes memory votingParams,
        bytes4 _callbackSelector,
        bytes memory _callbackArgs)
    external
    override(IVoteAndImplementContract) 
    activateNewVote
    returns(uint256 index) {
        index = _start(votingParams);
        callback[msg.sender][index] = Callback({
            selector: _callbackSelector,
            arguments: _callbackArgs,
            response: Response.none});
    }

    function getCallbackResponse(uint256 voteIndex) external view override(IVoteAndImplementContract) returns(uint8) {
        return uint8(callback[msg.sender][voteIndex].response);
    }

    function getCallbackData(uint256 voteIndex) external view override(IVoteAndImplementContract) returns(bytes4 selector, bytes memory arguments) {
        selector = callback[msg.sender][voteIndex].selector;
        arguments = callback[msg.sender][voteIndex].arguments;
    }


    function supportsInterface(bytes4 interfaceId) public pure virtual override(IERC165, VoteContractPrimitive) returns (bool) {
        return 
            super.supportsInterface(interfaceId) ||
            interfaceId == type(IVoteAndImplementContract).interfaceId;
    }
}


    