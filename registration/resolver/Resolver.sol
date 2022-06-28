// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.4;

import { OwnerControl } from "./primitives/OwnerControl.sol";
import { GovernanceControl } from "./primitives/GovernanceControl.sol";

import {RequiredDirectCallResolver} from "./resolvers/RequiredDirectCall.sol";
import {IsImplementerResolver} from "./resolvers/IsImplementer.sol";
import {IsProxyResolver} from "./resolvers/IsProxy.sol";
import {MethodsResolver} from "./resolvers/Methods.sol";
import {UsageResolver} from "./resolvers/Usage.sol";


contract OwnerControlledResolver is 
OwnerControl,
RequiredDirectCallResolver,
IsImplementerResolver,
IsProxyResolver,
MethodsResolver,
UsageResolver
{

    function setIsImplementer( address votingContract, bool _isImplementer)
    external 
    OwnerControl.senderIsOwner(votingContract)
    {
        _setIsImplementer(votingContract, _isImplementer);
    }

    // other setters can also be wrapped around Owner control.

}

contract GovernanceControlledResolver {
    
}
