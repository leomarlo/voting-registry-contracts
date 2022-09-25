// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import {
    OnlyVoteImplementer,
    AssignedContractPrimitive,
    LegitInstanceHash,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";
import {
    StartOnlyCallbackMinml
} from "../../integration/abstracts/OnlyStart.sol";




contract DummyTournamentIntegrator is
LegitInstanceHash, 
AssignedContractPrimitive,
SecurityThroughAssignmentPrimitive,
StartOnlyCallbackMinml
{

    address public imperator;
    address public imperatorElect;

    constructor(address _votingContract)
    {
        // But these function do exists and are made votable
        assignedContract[bytes4(keccak256("proposeNewImperator(address)"))] = _votingContract;
        assignedContract[bytes4(keccak256("fail(uint256)"))] = _votingContract;
    }

    function proposeNewImperator(address _imperator) 
    external
    OnlyByVote(true)
    returns(bool)
    {
        imperatorElect = _imperator;
    }

    function fail(uint256 badNumber)
    external 
    OnlyByVote(true)
    returns(bool)
    {
        revert("Zong!");
    }


    function claimImperatorship() external {
        require(msg.sender==imperatorElect, "Please read the Constitution!");
        imperator = msg.sender;
        imperatorElect = address(0);
    }


    modifier OnlyByVote(bool checkIdentifier) {
        if(!_isImplementer(checkIdentifier)) revert OnlyVoteImplementer(msg.sender);
        _;
    }

}
