
// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.4;

interface IRegistrarPrimitive {
    function register(address votingContract, address resolver, address controller) external;
    function getController(address votingContract) external view returns(address controller);
}

interface IRegistrar is IRegistrarPrimitive {
    function register(address votingContract, address resolver, address controller) external override(IRegistrarPrimitive);
    function getController(address votingContract) external view override(IRegistrarPrimitive) returns(address controller);
    function changeResolver(address votingContract, address newResolver) external;
}