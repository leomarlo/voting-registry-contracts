//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IVoteContract} from "../voteContract/IVoteContract.sol";
import {IVotingRegistry} from "./IVotingRegistry.sol";

error AlreadyRegistered(address contractSeekingRegistration);
error notInterfaceImplementer(address contractSeekingRegistration);
error NotRegistered(address notRegisteredContract);




abstract contract VotingContractRegistration {

    /*
    * STATE VARIABLES
    */
    mapping(address=>uint256) internal _registrationIndex;
    uint256 internal _numberOfRegistrations;


    /*
    * MUTATIVE FUNCTIONS
    */

    function _registerVotingContract()
    internal
    returns (uint256)
    {
        _numberOfRegistrations += 1;
        _registrationIndex[msg.sender] = _numberOfRegistrations;
        return _numberOfRegistrations;
    }


    /*
    * GETTER FUNCTIONS
    */

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

    function isRegistered(address votingContract) 
    public
    view
    returns (bool)
    {
        return _registrationIndex[votingContract] > 0;
    }

    /*
    * MODIFIERS
    */

    modifier onlyRegistered {
        // if (!isRegistered(msg.sender)){
        //     revert NotRegistered(msg.sender);
        // }
        require(isRegistered(msg.sender), "is not registered");
        _;
    }

    modifier notYetRegistered {
        // if (isRegistered(msg.sender)){
        //     revert AlreadyRegistered(msg.sender);
        // }
        require(!isRegistered(msg.sender), "is not yet registered");
        _;
    }
}



abstract contract CategoryRegistration {

    /*
    * STATE VARIABLES
    */
    
    mapping(uint256=>bytes8) internal _registeredCategories;
    mapping(bytes8=>uint256) internal _reverseCategoryLookup;
    uint256 internal _numberOfRegisteredCategories;

    /*
    * MUTATIVE FUNCTIONS
    */

    function _registerCategory(bytes8 categoryId)
    internal
    {
        _numberOfRegisteredCategories += 1;
        _registeredCategories[_numberOfRegisteredCategories] = categoryId;
        _reverseCategoryLookup[categoryId] = _numberOfRegisteredCategories;
    }

    /*
    * GETTER FUNCTIONS
    */

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


abstract contract VoteContractImplementer {

    function _implementsInterface()
    internal 
    view 
    returns(bool) {
        return IERC165(msg.sender).supportsInterface(type(IVoteContract).interfaceId);
    }

    modifier isInterfaceImplementer {
        // if (!_implementsInterface()){
        //     revert notInterfaceImplementer(msg.sender);
        // }
        require(_implementsInterface(), "does not implement interface");
        _;
    }
}

// abstract contract RegistryToken is ERC721 {

// }

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

    // helper functions    

    function _addCategoryToRegistrationAndUpdateCategoryRegistry(bytes8 categoryId) 
    internal
    addCategoryToRegistrationWrapper(categoryId)
    {
        // update category registry
        _registerCategory(categoryId);
    }


    /*
    * MODIFIERS
    */

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

  