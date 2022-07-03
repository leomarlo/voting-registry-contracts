// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.4;


contract MethodsResolver {
    mapping(address=>bytes32[]) public methods;
}