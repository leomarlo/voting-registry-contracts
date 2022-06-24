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
import {IVotingContract} from "../../votingContract/IVotingContract.sol";

import {CallerGetterAndSetter} from "../primitives/CallerGetterAndSetter.sol";
import {StatusGetterAndSetter} from "../primitives/StatusGetterAndSetter.sol";

/// @title Vote Contract - Main implementation of the inheritable vote contract.
/// @author Leonhard Horstmeyer  <leonhard.horstmeyer@gmail.com>
/// @dev This contract implements the necessary functions that a simple Vote Contract should implement.
abstract contract VotingContract is StatusGetterAndSetter, CallerGetterAndSetter, IERC165, IVotingContract {
    

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    uint256 private _currentIndex; 

    //////////////////////////////////////////////////
    // WRITE FUNCTIONS                              //
    //////////////////////////////////////////////////

    /// @dev This function exposes the initiation of a new voting instance to an external caller.
    /// @param votingParams these are the bytes-encoded voting parameters that allow the inheriting contract to decide about the specifics of this vote.
    function start(bytes memory votingParams, bytes memory callback)
    public
    virtual
    override(IVotingContract) 
    returns(uint256 identifier) {
        
        // This hook may be used to store the calldata or its hash
        _beforeStart(_currentIndex, votingParams, callback);

        // Start the voting Instance
        _start(_currentIndex, votingParams);

        // Store the caller and status in storage.
        _setCaller(_currentIndex, msg.sender);
        _setStatus(_currentIndex, uint256(IVotingContract.VotingStatus.active));

        // emit event
        emit VotingInstanceStarted(_currentIndex, msg.sender);
        
        // increment currentIndex
        _currentIndex += 1;

        // return the identifier of this voting instance
        identifier = _currentIndex;
    }


    /// @dev The vote function needs to be implemented by the inheriting contract. There is quite a bit of liberty in the choice of implementation here.
    /// @param identifier the index for the voting instance in question
    /// @param votingData some extra data passed into the function call, like proxy or delegate votes or options.
    function vote(uint256 identifier, bytes memory votingData) 
    external 
    virtual 
    override(IVotingContract) 
    returns (uint256 status);
    

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev A helper function that handles the initiation of a new voting instance. It needs to be implemented by the creator of the inheriting contract.
    /// @param identifier the index for the voting instance in question
    /// @param votingParams these are the bytes-encoded voting parameters that allow the inheriting contract to decide about the specifics of this vote.
    function _start(uint256 identifier, bytes memory votingParams) virtual internal;


    /// @dev This function checks whether the conditions are met for the vote instance transition out of the active status. It still needs to be checked then whether it will fail or be complete
    /// @param identifier the index for the voting instance in question
    function _checkCondition(uint256 identifier) internal view virtual returns(bool condition) {}

    /// @dev This function is a hook for developers to include some customized functions.
    /// @param votingParams these are the bytes-encoded voting parameters that allow the inheriting contract to decide about the specifics of this vote.
    function _beforeStart(uint256 identifier, bytes memory votingParams, bytes memory callback) internal virtual {}



    //////////////////////////////////////////////////
    // GETTER FUNCTIONS                             //
    //////////////////////////////////////////////////

    /// @dev This function needs to be implemented so that the contract that calls this voting instance can also query its result. One may of course also allow anyone to query the result. It is up to the creator of the inheriting contract to choose.
    /// @param identifier the index for the voting instance in question
    function result(uint256 identifier) external view virtual override(IVotingContract) returns(bytes memory resultData);


    function getCurrentIndex() external view returns(uint256 currentIndex) {
        currentIndex = _currentIndex;
    }


    function supportsInterface(bytes4 interfaceId) public pure virtual override(IERC165) returns (bool) {
        return 
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IVotingContract).interfaceId;
    }
}
