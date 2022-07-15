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
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;


// import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IVotingRegistry} from "./IVotingRegistry.sol";




/// @title Voting Registry
/// @notice This abstract contract handles just the registration and needs to be inherited by the registry
contract VotingRegistry is IVotingRegistry{

    //////////////////////////////////////////////////
    // TYPE, ERROR AND EVENT DECLARATIONS           //
    //////////////////////////////////////////////////

    // types
    struct Record {
        address registrar;
        address resolver;
    }

    // events
    event Registered(address contractAddress, address registrar, address resolver);
    event ResolverUpdated(address newResolver);

    // errors
    error AlreadyRegistered(address contractAddress, address registrar);
    error DoesNotSatisfyInterface(address contractAddress);
    error OnlyRegistrar(address sender, address registrar);

    //////////////////////////////////////////////////
    // STATE VARIABLES                              //
    //////////////////////////////////////////////////

    mapping(address=>Record) private records;
    bytes4 immutable private VOTING_CONTRACT_STANDARD_ID;
    
    constructor(bytes4 _VOTING_CONTRACT_STANDARD_ID){
        VOTING_CONTRACT_STANDARD_ID = _VOTING_CONTRACT_STANDARD_ID;
    }

    //////////////////////////////////////////////////
    // WRITE FUNCTIONS                              //
    //////////////////////////////////////////////////

    function register(
        address contractAddress,
        address resolver)
    external
    override(IVotingRegistry)
    {
        if (records[contractAddress].registrar!=address(0)){
            revert AlreadyRegistered(contractAddress, records[contractAddress].registrar);
        }
        if (! checkInterface(contractAddress)){
            revert DoesNotSatisfyInterface(contractAddress);
        }
        records[contractAddress] = Record({
            registrar: msg.sender,
            resolver: resolver
        });
        emit Registered(contractAddress, msg.sender, resolver);
    }

    function changeResolver(
        address contractAddress,
        address resolver)
    external
    override(IVotingRegistry)
    {
        if (msg.sender!=records[contractAddress].registrar){
            revert OnlyRegistrar(msg.sender, records[contractAddress].registrar);
        }
        records[contractAddress].resolver = resolver;
        emit ResolverUpdated(resolver);
    }


    //////////////////////////////////////////////////
    // GETTER FUNCTIONS                             //
    //////////////////////////////////////////////////
    

    /// @dev Checks the registrar address
    /// @param votingContract The address of the contract
    /// @return registrar The registrar address
    function getRegistrar(address votingContract) 
    public
    view
    override(IVotingRegistry)
    returns (address registrar)
    {
        registrar = records[votingContract].registrar;
    }

    /// @dev returns the current total number of registrations
    function getResolver(address votingContract)
    external 
    view
    override(IVotingRegistry)
    returns(address resolver)
    {
        resolver = records[votingContract].resolver;
    }


    //////////////////////////////////////////////////
    // INTERNAL HELPER FUNCTIONS                    //
    //////////////////////////////////////////////////


    function checkInterface(address contractAddress) internal view returns(bool) {
        return IERC165(contractAddress).supportsInterface(VOTING_CONTRACT_STANDARD_ID);
    }
    

}

