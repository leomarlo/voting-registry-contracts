/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  VotingRegistry,
  VotingRegistryInterface,
} from "../VotingRegistry";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "registrar",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "resolver",
        type: "address",
      },
    ],
    name: "Registered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "newResolver",
        type: "address",
      },
    ],
    name: "ResolverUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "resolver",
        type: "address",
      },
    ],
    name: "changeResolver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "votingContract",
        type: "address",
      },
    ],
    name: "getRegistrar",
    outputs: [
      {
        internalType: "address",
        name: "registrar",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "votingContract",
        type: "address",
      },
    ],
    name: "getResolver",
    outputs: [
      {
        internalType: "address",
        name: "resolver",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "resolver",
        type: "address",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class VotingRegistry__factory {
  static readonly abi = _abi;
  static createInterface(): VotingRegistryInterface {
    return new utils.Interface(_abi) as VotingRegistryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): VotingRegistry {
    return new Contract(address, _abi, signerOrProvider) as VotingRegistry;
  }
}
