// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";

abstract contract Deployer {

    /// With the help of hackernoon (https://hackernoon.com/using-ethereums-create2-nw2137q7)
    function deploy(bytes32 salt, bytes memory bytecode) public returns(address votingContract){

        assembly {
            votingContract := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
  }
}
