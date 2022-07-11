//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;


import {IStartVoteAndImplement} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {SecurityPrimitive} from "../primitives/SecurityPrimitive.sol";
import {
    InstanceWithCallback,
    InstanceInfoWithCallback
} from "../primitives/InstanceInfoPrimitive.sol";
import {IImplementResult} from "../../extensions/interfaces/IImplementResult.sol";
import { Instance, InstanceInfoPrimitive } from "../primitives/InstanceInfoPrimitive.sol";

import {ImplementingPermitted} from "../../extensions/primitives/ImplementingPermitted.sol";
import {IImplementingPermitted} from "../../extensions/interfaces/IImplementingPermitted.sol";
import {StatusPrimitive} from "../../extensions/primitives/Status.sol";



abstract contract StartVoteAndImplementOnlyCallbackImplCallerMinml {}
abstract contract StartVoteAndImplementOnlyCallbackImplCallerHooks {}



abstract contract StartVoteAndImplementHybridVotingImplCallerMinml {}
abstract contract StartVoteAndImplementHybridVotingImplCallerHooks {}


