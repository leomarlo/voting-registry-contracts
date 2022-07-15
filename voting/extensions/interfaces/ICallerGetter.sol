// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;


interface ICallerGetter {
    function getCaller(uint256 identifier) external view returns(address caller);
}