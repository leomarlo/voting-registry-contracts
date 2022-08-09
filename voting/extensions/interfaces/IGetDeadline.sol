// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;


interface IGetDeadline {
    function getDeadline(uint256 identifier) external view returns(uint256);
}