/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IVotingPermitted,
  IVotingPermittedInterface,
} from "../IVotingPermitted";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    name: "votingPermitted",
    outputs: [
      {
        internalType: "bool",
        name: "permitted",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class IVotingPermitted__factory {
  static readonly abi = _abi;
  static createInterface(): IVotingPermittedInterface {
    return new utils.Interface(_abi) as IVotingPermittedInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IVotingPermitted {
    return new Contract(address, _abi, signerOrProvider) as IVotingPermitted;
  }
}