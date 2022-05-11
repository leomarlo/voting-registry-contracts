////////////////////////////////////////////////////////////////////////////
//                                                                        //
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ //
// ░░░░░░░░░░██╗░░░██╗░█████╗░████████╗██╗███╗░░██╗░██████╗░░░░░░░░░░░░░░ //
// ░░░░░░░░░░██║░░░██║██╔══██╗╚══██╔══╝██║████╗░██║██╔════╝░░░░░░░░░░░░░░ //
// ░░░░░░░░░░╚██╗░██╔╝██║░░██║░░░██║░░░██║██╔██╗██║██║░░██╗░░░░░░░░░░░░░░ //
// ░░░░░░░░░░░╚████╔╝░██║░░██║░░░██║░░░██║██║╚████║██║░░╚██╗░░░░░░░░░░░░░ //
// ░░░░░░░░░░░░╚██╔╝░░╚█████╔╝░░░██║░░░██║██║░╚███║╚██████╔╝░░░░░░░░░░░░░ //
// ░░░░░░░░░░░░░╚═╝░░░░╚════╝░░░░╚═╝░░░╚═╝╚═╝░░╚══╝░╚═════╝░░░░░░░░░░░░░░ //
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ //
// ░░░░██████╗░███████╗░██████╗░██╗░██████╗████████╗██████╗░██╗░░░██╗░░░░ //
// ░░░░██╔══██╗██╔════╝██╔════╝░██║██╔════╝╚══██╔══╝██╔══██╗╚██╗░██╔╝░░░░ //
// ░░░░██████╔╝█████╗░░██║░░██╗░██║╚█████╗░░░░██║░░░██████╔╝░╚████╔╝░░░░░ //
// ░░░░██╔══██╗██╔══╝░░██║░░╚██╗██║░╚═══██╗░░░██║░░░██╔══██╗░░╚██╔╝░░░░░░ //
// ░░░░██║░░██║███████╗╚██████╔╝██║██████╔╝░░░██║░░░██║░░██║░░░██║░░░░░░░ //
// ░░░░╚═╝░░╚═╝╚══════╝░╚═════╝░╚═╝╚═════╝░░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░░░░░ // 
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

/// @title Voting Contract Registration
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

    /// @dev returns the current total number of registrations
    function numberOfRegistrations()
    external 
    view
    returns(uint256)
    {
        return _numberOfRegistrations;
    }

    /// @dev returns the index of the given contract registration.
    /// @param votingContract address of the registered voting Contract.
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


/// @title Category Registration 
/// @notice Handles only the category registration
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

    /// @dev get the registered category from the registration index
    /// @param index a uint256 index of the category.
    function getRegisteredCategoryFromIndex(uint256 index) 
    external 
    view 
    returns(bytes8)
    {
        return _registeredCategories[index];
    }

    /// @dev queries the registry, whether a given category has been registered yet.
    /// @param categoryId the category Id whose registration status is requested.
    function isRegisteredCategory(bytes8 categoryId) 
    public 
    view 
    returns(bool)
    {
        return _reverseCategoryLookup[categoryId] > 0;
    }

    /// @dev Get the total number of registered categories
    function getNumberOfRegisteredCategories() 
    public 
    view 
    returns(uint256)
    {
        return _numberOfRegisteredCategories;
    }

}

/// @title Vote Contract Implementer
/// @notice An abstract helper contract that provides functions to check 
///         whether a registering contract implements a given interface
abstract contract VoteContractImplementer {

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////

    /// @dev An auxilliary internal function that checks whether the sending contract supports an ERC165-interface
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


    //////////////////////////////////////////////////
    // WRITE FUNCTIONS                              //
    //////////////////////////////////////////////////

    /// @dev registration of a new contract. It checks whether the contract satisfies the interface
    ///      requirements and whether it has already been registered. Then it registers it to the
    ///      registry and adds the category, updating the category registry if necessary.
    /// @param _categoryId the categoryId that the contract seeks registration to.
    /// @return registrationIndex the registration index for this voting contract registration.
    function register(bytes8 _categoryId)
    external
    notYetRegistered
    isInterfaceImplementer
    returns(uint256 registrationIndex)
    {
        registrationIndex = _registerVotingContract();
        _addCategoryToRegistrationAndUpdateCategoryRegistry(_categoryId);     
        
    }

    /// @dev add another category to the registration
    /// @param categoryid the category id that the contract seeks to register.
    function addCategoryToRegistration(bytes8 categoryId)
    external
    onlyRegistered
    {
        _addCategoryToRegistrationAndUpdateCategoryRegistry(categoryId);
    }

    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////    

    /// @dev this auxiliary function helps to add a category to the registration and if its not already
    ///      in the registry it will be added. The function body is only executed when the category does not
    ///      exist. In any case the code in the addCategoryToRegistrationWrapper-wrapper are executed.
    /// @param categoryId the categoryId that the contract seeks to add to the registration.
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

    /// @dev this wrapper updates the category registry and adds a new category if it is not already there.
    /// @param categoryId the category id that the contract seeks to add.
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

  