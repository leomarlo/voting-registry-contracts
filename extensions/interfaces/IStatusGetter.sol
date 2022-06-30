// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


interface IStatusGetter {
    function getStatus(uint256 identifier) external view returns(uint256 status);
}