// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import {
    OnlyVoteImplementer,
    AssignedContractPrimitive,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";
import {
    StartOnlyCallbackMinml
} from "../../integration/abstracts/OnlyStart.sol";




contract DummyTournamentIntegrator is 
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
    }

    function proposeNewImperator(address _imperator) 
    external
    OnlyByVote
    returns(bool)
    {
        imperatorElect = _imperator;
    }

    function fail()
    external 
    pure
    {
        revert("Zong!");
    }


    function claimImperatorship() external {
        require(msg.sender==imperatorElect, "Please read the Constitution!");
        imperator = msg.sender;
        imperatorElect = address(0);
    }


    modifier OnlyByVote {
        if(!_isImplementer()){
            revert OnlyVoteImplementer(msg.sender);
        }
        _;
    }

}
