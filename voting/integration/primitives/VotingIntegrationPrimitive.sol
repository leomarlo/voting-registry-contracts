//SPDX-License-Identifier: GPL-2.0
pragma solidity ^0.8.4;

import {IVotingIntegration} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {SecurityPrimitive} from "./SecurityPrimitive.sol";

abstract contract VotingIntegrationPrimitive is IVotingIntegration, SecurityPrimitive {

    function start(bytes memory votingParams, bytes memory callback) external {
        _beforeStart(votingParams, callback);
        bytes4 selector = bytes4(callback);
        if (!SecurityPrimitive._isVotableFunction(selector)){
            revert SecurityPrimitive.IsNotVotableFunction(selector);
        }
        uint256 identifier = IVotingContract(assignedContract[selector]).start(votingParams, callback);
        _afterStart(identifier, votingParams, callback);
    }

    function vote(uint256 identifier, bytes memory votingData) external {
        _beforeVote(identifier, votingData);
        uint256 status = IVotingContract(getVotingContract(identifier)).vote(identifier, votingData);
        _afterVote(status);
    }

    function _beforeStart(bytes memory votingParams, bytes memory callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes memory callback) virtual internal {}

    function getVotingContract(uint256 identifier) virtual public view returns(address votingContract) {}

    function _beforeVote(uint256 identifier, bytes memory votingData) virtual internal {}

    function _afterVote(uint256 status) virtual internal {}


}