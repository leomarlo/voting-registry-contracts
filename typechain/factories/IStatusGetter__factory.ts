/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IStatusGetter, IStatusGetterInterface } from "../IStatusGetter";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "identifier",
        type: "uint256",
      },
    ],
    name: "getStatus",
    outputs: [
      {
        internalType: "uint256",
        name: "status",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class IStatusGetter__factory {
  static readonly abi = _abi;
  static createInterface(): IStatusGetterInterface {
    return new utils.Interface(_abi) as IStatusGetterInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IStatusGetter {
    return new Contract(address, _abi, signerOrProvider) as IStatusGetter;
  }
}
