// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;


interface IGetQuorum {
    function getQuorum(uint256 identifier) external view returns(uint256 quorum, uint256 inUnitsOf);
}