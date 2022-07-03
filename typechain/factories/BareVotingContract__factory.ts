/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  BareVotingContract,
  BareVotingContractInterface,
} from "../BareVotingContract";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "VotingInstanceStarted",
    type: "event",
  },
  {
    inputs: [],
    name: "getCurrentIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "currentIndex",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    name: "result",
    outputs: [
      {
        internalType: "bytes",
        name: "resultData",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "votingParams",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "callback",
        type: "bytes",
      },
    ],
    name: "start",
    outputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "votingData",
        type: "bytes",
      },
    ],
    name: "vote",
    outputs: [
      {
        internalType: "uint256",
        name: "status",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class BareVotingContract__factory {
  static readonly abi = _abi;
  static createInterface(): BareVotingContractInterface {
    return new utils.Interface(_abi) as BareVotingContractInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BareVotingContract {
    return new Contract(address, _abi, signerOrProvider) as BareVotingContract;
  }
}
