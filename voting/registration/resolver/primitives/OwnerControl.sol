// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.13;

import {IRegistrar} from "../../registrar/IRegistrar.sol";
    

abstract contract OwnerControl {
    IRegistrar internal registrar;

    function _senderIsOwner(address votingContract) internal view returns (bool isRegistrarController){
        isRegistrarController = registrar.getController(votingContract)==msg.sender;
    } 

    modifier senderIsOwner(address votingContract) {
        require( _senderIsOwner(votingContract));
        _;
    }

}
