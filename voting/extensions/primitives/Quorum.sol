// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

abstract contract QuorumPrimitive {
    mapping(uint256=>uint256) internal _quorum;
}