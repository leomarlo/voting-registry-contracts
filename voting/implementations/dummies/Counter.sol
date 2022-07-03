// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

contract Counter {
    uint256 public i;

    function increment() external {
        i += 1;
    }
}