// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.13;


contract MethodsResolver {
    mapping(address=>bytes32[]) public methods;
}