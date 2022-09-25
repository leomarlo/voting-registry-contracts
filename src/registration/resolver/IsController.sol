// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;

import {IRegistrar} from "../registrar/IRegistrar.sol";
    
error IsNotController(address sender, address votingContract);
error IsNotRegistrar(address sender, address registrar);


abstract contract IsController {
    IRegistrar internal registrar;

    constructor(address _registrar){
        registrar = IRegistrar(_registrar);
    }

    function setRegistrar(address _registrar)
    external
    OnlyRegistrar
    {
        registrar = IRegistrar(_registrar);
    }

    function _senderIsController(address votingContract) internal view returns (bool isRegistrarController){
        isRegistrarController = registrar.getController(votingContract)==msg.sender;
    } 

    modifier senderIsController(address votingContract) {
        if(!_senderIsController(votingContract)){
            revert IsNotController(msg.sender, votingContract);
        }
        _;
    }

    modifier OnlyRegistrar() {
        if(msg.sender!=address(registrar)){
            revert IsNotRegistrar(msg.sender, address(registrar));
        }
        _;
    }

}
