//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

struct Instance {
    uint256 identifier;
    address votingContract;
}

struct InstanceWithStatus {
    uint256 identifier;
    address votingContract;
    uint256 implementationStatus;
}

abstract contract InstanceInfoPrimitive {
    Instance[] public instances;
}

abstract contract InstanceInfoWithStatusPrimitive {
    InstanceWithStatus[] public instances;
}