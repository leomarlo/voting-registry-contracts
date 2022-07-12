//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.13;

struct Instance {
    uint256 identifier;
    address votingContract;
}

struct InstanceWithStatus {
    uint256 identifier;
    address votingContract;
    uint256 implementationStatus;
}

struct InstanceWithCallback {
    uint256 identifier;
    address votingContract;
    bytes callback;
}

struct InstanceWithCallbackAndResponse {
    uint256 identifier;
    address votingContract;
    bytes callback;
    uint256 status;
}

abstract contract InstanceInfoPrimitive {
    Instance[] public instances;
}

abstract contract InstanceInfoWithCallback {
    InstanceWithCallback[] public instances;
}

abstract contract InstanceInfoWithCallbackAndResponse {
    InstanceWithCallbackAndResponse[] public instances;
}

abstract contract InstanceInfoWithStatusPrimitive {
    InstanceWithStatus[] public instances;
}