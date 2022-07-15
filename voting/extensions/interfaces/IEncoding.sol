// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

interface IEncodeDuration {

    function encodeVotingParams(uint256 duration) external returns(bytes memory votingParams);

    function decodeVotingParams(bytes memory votingParams) external returns(uint256 duration);
}

interface IEncodeDurationAndTokenweighting {

    function encodeVotingParams(uint256 duration, address tokenAddress) external returns(bytes memory votingParams);

    function decodeVotingParams(bytes memory votingParams) external returns(uint256 duration, address tokenAddress);
}

interface IEncodeDurationTokenweightingAndQuorum {

    function encodeVotingParams(uint256 duration, address tokenAddress, uint256 quorum) external returns(bytes memory votingParams);

    function decodeVotingParams(bytes memory votingParams) external returns(uint256 duration, address tokenAddress, uint256 quorum);

}

