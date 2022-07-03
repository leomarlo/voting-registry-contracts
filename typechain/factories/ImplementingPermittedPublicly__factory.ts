/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  ImplementingPermittedPublicly,
  ImplementingPermittedPubliclyInterface,
} from "../ImplementingPermittedPublicly";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    name: "ImplementingNotPermitted",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    name: "implementingPermitted",
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

export class ImplementingPermittedPublicly__factory {
  static readonly abi = _abi;
  static createInterface(): ImplementingPermittedPubliclyInterface {
    return new utils.Interface(_abi) as ImplementingPermittedPubliclyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ImplementingPermittedPublicly {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as ImplementingPermittedPublicly;
  }
}
