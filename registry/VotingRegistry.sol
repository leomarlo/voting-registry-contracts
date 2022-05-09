////////////////////////////////////////////////////////////////////////////
//                                                                        //
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  //
// ░░░░░░░░░░██╗░░░██╗░█████╗░████████╗██╗███╗░░██╗░██████╗░░░░░░░░░░░░░  //
// ░░░░░░░░░░██║░░░██║██╔══██╗╚══██╔══╝██║████╗░██║██╔════╝░░░░░░░░░░░░░  //
// ░░░░░░░░░░╚██╗░██╔╝██║░░██║░░░██║░░░██║██╔██╗██║██║░░██╗░░░░░░░░░░░░░  //
// ░░░░░░░░░░░╚████╔╝░██║░░██║░░░██║░░░██║██║╚████║██║░░╚██╗░░░░░░░░░░░░  //
// ░░░░░░░░░░░░╚██╔╝░░╚█████╔╝░░░██║░░░██║██║░╚███║╚██████╔╝░░░░░░░░░░░░  //
// ░░░░░░░░░░░░░╚═╝░░░░╚════╝░░░░╚═╝░░░╚═╝╚═╝░░╚══╝░╚═════╝░░░░░░░░░░░░░  //
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  //
// ░░░░██████╗░███████╗░██████╗░██╗░██████╗████████╗██████╗░██╗░░░██╗░░░  //
// ░░░░██╔══██╗██╔════╝██╔════╝░██║██╔════╝╚══██╔══╝██╔══██╗╚██╗░██╔╝░░░  //
// ░░░░██████╔╝█████╗░░██║░░██╗░██║╚█████╗░░░░██║░░░██████╔╝░╚████╔╝░░░░  //
// ░░░░██╔══██╗██╔══╝░░██║░░╚██╗██║░╚═══██╗░░░██║░░░██╔══██╗░░╚██╔╝░░░░░  //
// ░░░░██║░░██║███████╗╚██████╔╝██║██████╔╝░░░██║░░░██║░░██║░░░██║░░░░░░  //
// ░░░░╚═╝░░╚═╝╚══════╝░╚═════╝░╚═╝╚═════╝░░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░░░░  // 
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  //
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

///@author Leonhard Horstmeyer  <leonhard.horstmeyer@gmail.com>
///@notice This contract adds liquidity to Curve pools with ETH or ERC tokens.
// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.4;


import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IVoteContract} from "../voteContract/IVoteContract.sol";
import {IVotingRegistry} from "./IVotingRegistry.sol";


error AlreadyRegistered(address contractSeekingRegistration);
error notInterfaceImplementer(address contractSeekingRegistration);
error NotRegistered(address notRegisteredContract);


/// @notice This abstract contract handles just the registration and needs to be inherited by the registry
abstract contract VotingContractRegistration {

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    mapping(address=>uint256) internal _registrationIndex;
    uint256 internal _numberOfRegistrations;

    //////////////////////////////////////////////////
    // GETTER FUNCTIONS                             //
    //////////////////////////////////////////////////
    
    /// @dev Checks whether contract is registered
    /// @param votingContract The address of the contract
    /// @return _isRegistered The boolean flag that is raised when 
    ///         the contract is registered
    function isRegistered(address votingContract) 
    public
    view
    returns (bool _isRegistered)
    {
        _isRegistered = _registrationIndex[votingContract] > 0;
    }

    function numberOfRegistrations()
    external 
    view
    returns(uint256)
    {
        return _numberOfRegistrations;
    }

    function getRegistrationIndex(address votingContract)
    external
    view 
    returns(uint256)
    {
        return _registrationIndex[votingContract];
    }

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev An internal function that handles the registration. 
    ///      The first registration has index 1 not 0. 
    ///      This way we can easily check whether a contract is registered 
    ///      by querying for a non-zero registration index. 
    ///      We do not require an extra boolean storage variable.
    /// @return registrationIndex The index at which this contract is registered
    function _registerVotingContract()
    internal
    returns (uint256 registrationIndex)
    {
        _numberOfRegistrations += 1;
        _registrationIndex[msg.sender] = _numberOfRegistrations;
        registrationIndex = _numberOfRegistrations;
    }
    

    //////////////////////////////////////////////////
    // GUARD MODIFIERS                              //
    //////////////////////////////////////////////////

    modifier onlyRegistered {
        if (!isRegistered(msg.sender)){
            revert NotRegistered(msg.sender);
        }
        _;
    }

    modifier notYetRegistered {
        if (isRegistered(msg.sender)){
            revert AlreadyRegistered(msg.sender);
        }
        _;
    }
}



abstract contract CategoryRegistration {

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////
    
    mapping(uint256=>bytes8) internal _registeredCategories;
    mapping(bytes8=>uint256) internal _reverseCategoryLookup;
    uint256 internal _numberOfRegisteredCategories;


    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////
    
    /// @dev This function handles the registration of a new category.
    ///      The first registration has index 1 not 0. 
    ///      (see VotingContractRegistration._registerVoteContract)
    /// @param categoryId A bytes8 Id for the category.
    function _registerCategory(bytes8 categoryId)
    internal
    {
        _numberOfRegisteredCategories += 1;
        _registeredCategories[_numberOfRegisteredCategories] = categoryId;
        _reverseCategoryLookup[categoryId] = _numberOfRegisteredCategories;
    }

    //////////////////////////////////////////////////
    // GETTER FUNCTIONS                             //
    //////////////////////////////////////////////////

    function getRegisteredCategoryFromIndex(uint256 index) 
    external 
    view 
    returns(bytes8)
    {
        return _registeredCategories[index];
    }


    function isRegisteredCategory(bytes8 category) 
    public 
    view 
    returns(bool)
    {
        return _reverseCategoryLookup[category] > 0;
    }

    function getNumberOfRegisteredCategories() 
    public 
    view 
    returns(uint256)
    {
        return _numberOfRegisteredCategories;
    }

}

/// @dev An abstract helper contract that provides functions to check 
///      whether a registering contract implements a given interface
abstract contract VoteContractImplementer {

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    function _implementsInterface()
    internal 
    view 
    returns(bool) {
        return IERC165(msg.sender).supportsInterface(type(IVoteContract).interfaceId);
    }

    //////////////////////////////////////////////////
    // GUARD MODIFIERS                              //
    //////////////////////////////////////////////////
    
    modifier isInterfaceImplementer {
        require(_implementsInterface(), "does not implement interface");
        _;
    }
}


/// @title Voting Registry - An on-chain regitry for voting contracts that fulfil interface conditions
/// @author Leonhard Horstmeyer <leonhard.horstmeyer@gmail.com>
contract Registry is VoteContractImplementer, CategoryRegistration, VotingContractRegistration {

    mapping(address=>mapping(uint256=>bytes8)) internal _categoriesOfRegistration;
    mapping(address=>uint256) internal _numberOfCategoriesOfRegistration;


    /*
    * MUTATIVE FUNCTIONS
    */


    function register(bytes8 _categoryId)
    external
    notYetRegistered
    isInterfaceImplementer
    returns(uint256 registrationIndex)
    {
        registrationIndex = _registerVotingContract();
        _addCategoryToRegistrationAndUpdateCategoryRegistry(_categoryId);     
        
    }

    function addCategoryToRegistration(bytes8 categoryId)
    external
    onlyRegistered
    {
        _addCategoryToRegistrationAndUpdateCategoryRegistry(categoryId);
    }

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////    

    function _addCategoryToRegistrationAndUpdateCategoryRegistry(bytes8 categoryId) 
    internal
    addCategoryToRegistrationWrapper(categoryId)
    {
        // update category registry
        _registerCategory(categoryId);
    }


    //////////////////////////////////////////////////
    // WRAPPER MODIFIERS                            //
    //////////////////////////////////////////////////

    modifier addCategoryToRegistrationWrapper(bytes8 categoryId)
    {
        if (!isRegisteredCategory(categoryId)){
            // update category registry
            _;
        }
        _numberOfCategoriesOfRegistration[msg.sender] += 1;
        _categoriesOfRegistration[msg.sender][_numberOfCategoriesOfRegistration[msg.sender]] = categoryId;
    }

}

  