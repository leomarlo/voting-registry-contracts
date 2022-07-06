// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

error CounterError();

contract Counter {
    uint256 public i;

    function increment() external {
        i = i + 1;
    }

    function incrementWithReturn() external returns(bool) {
        i = i + 1;
    }

    function fail() external {
        if(i==0) revert CounterError();

        i = i + 1;
    }

}