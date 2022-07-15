// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {CounterPrimitive, Counter} from "./Counter.sol";
import {StartHybridVotingMinmlExample} from "../integrations/StartHybridVoting.sol";

error CounterError();

contract DummyIntegrator is CounterPrimitive, StartHybridVotingMinmlExample, Counter {

    constructor(address _votingContract)
    StartHybridVotingMinmlExample(_votingContract, _votingContract){
        // This function does not exist ... hihi ... sshhht
        assignedContract[bytes4(0x12345678)] = _votingContract;
        // But these function do exists and are made votable
        assignedContract[bytes4(keccak256("incrementWithReturn()"))] = _votingContract;
        assignedContract[bytes4(keccak256("fail()"))] = _votingContract;
    
    }

    function increment() 
    external 
    override(StartHybridVotingMinmlExample, CounterPrimitive)
    {
        i = i + 1;
    }

}