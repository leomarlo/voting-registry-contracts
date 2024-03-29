//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {IStart} from "../interface/IVotingIntegration.sol";
import {IVotingContract} from "../../votingContractStandard/IVotingContract.sol";
import {LegitInstanceHash, AssignedContractPrimitive} from "../primitives/AssignedContractPrimitive.sol";
// import {IndexedVotingContracts} from "../primitives/IndexedVotingContractsMapping.sol";


abstract contract StartOnlyCallbackHooks is IStart, LegitInstanceHash, AssignedContractPrimitive {

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStart){
        _beforeStart(votingParams, callback);
        bytes4 selector = bytes4(callback[0:4]);
        if (!AssignedContractPrimitive._isVotableFunction(selector)){
            revert AssignedContractPrimitive.IsNotVotableFunction(selector);
        }
        uint256 identifier = IVotingContract(assignedContract[selector]).start(votingParams, callback);
        bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
        LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;
        _afterStart(identifier, votingParams, callback);
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}

}

abstract contract StartOnlyCallbackMinml is IStart, LegitInstanceHash, AssignedContractPrimitive {
    
    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStart){
        _beforeStart(votingParams);
        bytes4 selector = bytes4(callback[0:4]);
        if (!AssignedContractPrimitive._isVotableFunction(selector)){
            revert AssignedContractPrimitive.IsNotVotableFunction(selector);
        }
        uint256 identifier = IVotingContract(assignedContract[selector]).start(votingParams, callback);
        bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
        LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;    
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}
}



abstract contract StartHybridVotingHooks is 
IStart, 
LegitInstanceHash,
AssignedContractPrimitive {
    
    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStart){
        _beforeStart(votingParams, callback);
        uint256 identifier;
        if (callback.length<4){
            identifier = IVotingContract(_getSimpleVotingContract(callback)).start(votingParams, callback);
        } else {
            bytes4 selector = bytes4(callback[0:4]);
            if (!AssignedContractPrimitive._isVotableFunction(selector)){
                revert AssignedContractPrimitive.IsNotVotableFunction(selector);
            }
            identifier = IVotingContract(assignedContract[selector]).start(votingParams, callback);
            bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
            LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;
        }
        
        _afterStart(identifier, votingParams, callback);
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _getSimpleVotingContract(bytes calldata callback) virtual internal view returns(address) {}
}

abstract contract StartHybridVotingMinml is 
IStart, 
LegitInstanceHash,
AssignedContractPrimitive {

    address public votingContract;

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStart){
        
        _beforeStart(votingParams);
        if (callback.length<4){
            IVotingContract(votingContract).start(votingParams, callback);
        } else {
            bytes4 selector = bytes4(callback[0:4]);
            if (!AssignedContractPrimitive._isVotableFunction(selector)){
                revert AssignedContractPrimitive.IsNotVotableFunction(selector);
            }
            uint256 identifier = IVotingContract(assignedContract[selector]).start(votingParams, callback);
            bytes32 instanceHash = LegitInstanceHash._getInstanceHash(assignedContract[selector], identifier);
            LegitInstanceHash._isLegitInstanceHash[instanceHash] = true;
        }
        
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}
}




abstract contract StartSimpleVotingHooks is IStart {
    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStart){
        _beforeStart(votingParams, callback);
        uint256 identifier = IVotingContract(_getSimpleVotingContract(callback)).start(votingParams, callback);
        _afterStart(identifier, votingParams, callback);
    }

    function _beforeStart(bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _afterStart(uint256 identifier, bytes memory votingParams, bytes calldata callback) virtual internal {}

    function _getSimpleVotingContract(bytes calldata callback) virtual internal view returns(address) {}
}


abstract contract StartSimpleVotingMinml is IStart {

    address public votingContract;

    function start(bytes memory votingParams, bytes calldata callback) 
    external 
    override(IStart){
        _beforeStart(votingParams);
        IVotingContract(votingContract).start(votingParams, callback);
    }

    function _beforeStart(bytes memory votingParams) virtual internal {}
}
