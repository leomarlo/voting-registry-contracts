// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.13;

import {
    OnlyVoteImplementer,
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
SecurityThroughAssignmentPrimitive,
StartOnlyCallbackMinml {

    IResolverWithControl immutable public RESOLVER;

    constructor(
        address _initialVotingContract,
        address _registry,
        string memory name_,
        string memory _symbol,
        bytes32 resolverSalt, 
        bytes memory resolverBytecode
        ) 
    RegistrarWithDeployerPrimitive(_registry, name_, _symbol){
        assignedContract[bytes4(keccak256("changeRegistrarControlledKeys(bytes32,bool)"))] = _initialVotingContract;
        assignedContract[bytes4(keccak256("setInformation(bytes32,address,uint256)"))] = _initialVotingContract;
        RESOLVER = IResolverWithControl(
            deploy(resolverSalt, resolverBytecode)
        );
    }


    function deployAndRegister(bytes32 salt, bytes memory bytecode) 
    external 
    returns(address votingContract)
    {
        votingContract = _deployAndRegister(salt, bytecode, address(RESOLVER));
    }


    function setInformation(bytes32 key, address votingContract, uint256 amount)
    external 
    OnlyByVote
    {
        RESOLVER.setInformation(key, votingContract, amount);
    }
    

    function changeRegistrarControlledKeys(bytes32 key, bool onlyRegistrar) 
    external
    OnlyByVote
    {
        RESOLVER.changeRegistrarControlledKeys(key, onlyRegistrar);
    }


    modifier OnlyByVote {
        if(_isImplementer()){
            revert OnlyVoteImplementer(msg.sender);
        }
        _;
    }
}

