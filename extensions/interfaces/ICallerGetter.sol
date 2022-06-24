// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


interface ICallerGetter {
    function getCaller(uint256 identifier) external view returns(address caller);
}