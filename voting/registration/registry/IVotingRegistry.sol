// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.13;

interface IVotingRegistry {
    
    function register(address contractAddress, address resolver) external;

    function changeResolver(address contractAddress, address resolver) external;

    function getRegistrar(address votingContract) external view returns (address registrar);

    function getResolver(address votingContract) external view returns(address resolver);

}