// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;

import {
    OnlyVoteImplementer,
    LegitInstanceHash,
    SecurityThroughAssignmentPrimitive
} from "../../integration/primitives/AssignedContractPrimitive.sol";
import {
    RegistrarPrimitive,
    RegistrarWithDeployerPrimitive
} from "./Registrars.sol";
import {
    StartOnlyCallbackMinml
} from "../../integration/abstracts/OnlyStart.sol";
import {
    IResolverWithControl
} from "./Resolver.sol";


contract ControllableRegistrar is 
RegistrarPrimitive,
RegistrarWithDeployerPrimitive,
LegitInstanceHash,
SecurityThroughAssignmentPrimitive,
StartOnlyCallbackMinml {

    IResolverWithControl immutable public RESOLVER;

    constructor(
        address _initialVotingContract,
        address _registry,
        address _resolver) 
    RegistrarWithDeployerPrimitive(_registry, "First Official Voting Contract Registrar", "REG1"){
        assignedContract[bytes4(keccak256("changeRegistrarControlledKeys(bytes32,bool)"))] = _initialVotingContract;
        assignedContract[bytes4(keccak256("setInformation(bytes32,address,uint256)"))] = _initialVotingContract;   
        RESOLVER = IResolverWithControl(_resolver);
    }

    // function _beforeStart(bytes memory votingParams) virtual internal {}

    function deployAndRegister(bytes32 salt, bytes memory bytecode) 
    external 
    returns(address votingContract)
    {
        votingContract = _deployAndRegister(salt, bytecode, address(RESOLVER));
    }


    function setInformation(bytes32 key, address votingContract, uint256 amount)
    external 
    OnlyByVote(true)
    returns(bool)
    {
        RESOLVER.setInformation(key, votingContract, amount);
    }
    
    // event Test(address sender, address assignedContract, bool isImplementer);
    function changeRegistrarControlledKeys(bytes32 key, bool onlyRegistrar) 
    external
    OnlyByVote(true)
    returns(bool)
    {
        // emit Test(msg.sender, assignedContract[msg.sig], _isImplementer(checkIdentifier));
        RESOLVER.changeRegistrarControlledKeys(key, onlyRegistrar);
    }


    modifier OnlyByVote(bool checkIdentifier) {
        if(!_isImplementer(checkIdentifier)) revert OnlyVoteImplementer(msg.sender);
        _;
    }
}

