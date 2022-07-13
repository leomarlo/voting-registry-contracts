// SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;

import {CounterPrimitive, Counter} from "./Counter.sol";
import {StartHybridVotingMinmlExample} from "../integrations/StartHybridVoting.sol";

error CounterError();

contract DummyIntegrator is CounterPrimitive, StartHybridVotingMinmlExample, Counter {

    constructor(address _votingContract)
    StartHybridVotingMinmlExample(_votingContract, _votingContract){}

    function increment() 
    external 
    override(StartHybridVotingMinmlExample, CounterPrimitive) 
    OnlyByVote
    {
        i = i + 1;
    }

}