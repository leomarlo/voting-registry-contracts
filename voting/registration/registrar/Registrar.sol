// SPDX-License-Identifier: GPL-2.0

pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IVotingRegistry} from "../registry/IVotingRegistry.sol";

abstract contract RegistrarPrimitive is ERC721 {

    address constant internal REGISTRY = 0x0123456789012345678901234567890123456789;

    function _register(address votingContract, address resolver) internal {
        IVotingRegistry(REGISTRY).register(votingContract, resolver);
    }

    function _setController(address votingContract, address controller) internal {
        uint256 tokenId = uint256(uint160(votingContract));
        ERC721._mint(controller, tokenId);
    }

    function getController(address votingContract) public view returns(address controller) {
        uint256 tokenId = uint256(uint160(votingContract));
        controller = ERC721.ownerOf(tokenId);
    }

    function register(address votingContract, address resolver, address controller) external {
        _register(votingContract, resolver);
        _setController(votingContract, controller);
    }
}

abstract contract Registrar is RegistrarPrimitive {

    function changeResolver(address votingContract, address newResolver) external {
        require(msg.sender==RegistrarPrimitive.getController(votingContract));
        IVotingRegistry(REGISTRY).changeResolver(votingContract, newResolver);
    }
}