// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.13;

contract RequiredDirectCallResolver {
    mapping(address=>bool) public requiredDirectCall;
}