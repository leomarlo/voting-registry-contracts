// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {HandleDoubleVotingGuard} from "../primitives/NoDoubleVoting.sol";

interface IGetDoubleVotingGuard{
    function getDoubleVotingGuard(uint256 identifier) external view returns(HandleDoubleVotingGuard.VotingGuard);
}