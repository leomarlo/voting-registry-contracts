// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;

import {RegistrarPrimitive, ChangeResolver} from "../../registration/registrar/Registrar.sol";
import {Deployer} from "../../registration/registrar/Deployer.sol";


contract SimpleRegistrar is RegistrarPrimitive, ChangeResolver {
    constructor(address _registry, string memory name_, string memory symbol_) 
    RegistrarPrimitive(_registry, name_, symbol_){}
}

abstract contract RegistrarWithDeployerPrimitive is RegistrarPrimitive, Deployer {
    constructor(address _registry, string memory name_, string memory symbol_)
    RegistrarPrimitive(_registry, name_, symbol_){}

    function _deployAndRegister(bytes32 salt, bytes memory bytecode, address resolver) 
    internal 
    returns(address votingContract)
    {
        votingContract = deploy(salt, bytecode);
        // how does it look if it reverts?
        _register(votingContract, resolver);
        _setController(votingContract, msg.sender);
    }

}

contract RegistrarWithDeployer is RegistrarPrimitive, RegistrarWithDeployerPrimitive, ChangeResolver {
    constructor(address _registry, string memory name_, string memory symbol_)
    RegistrarWithDeployerPrimitive(_registry, name_, symbol_){}

    function deployAndRegister(bytes32 salt, bytes memory bytecode, address resolver) 
    external 
    returns(address votingContract)
    {
        votingContract = _deployAndRegister(salt, bytecode, resolver);
    }
}