// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


abstract contract StatusPrimitive {
    mapping (uint256=>uint256) internal _status;
}
