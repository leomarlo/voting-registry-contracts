/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface IsImplementerResolverInterface extends ethers.utils.Interface {
  functions: {
    "getIsImplementer(address)": FunctionFragment;
    "isImplementer(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "getIsImplementer",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "isImplementer",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "getIsImplementer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isImplementer",
    data: BytesLike
  ): Result;

  events: {};
}

export class IsImplementerResolver extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: IsImplementerResolverInterface;

  functions: {
    getIsImplementer(
      votingContract: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    isImplementer(arg0: string, overrides?: CallOverrides): Promise<[boolean]>;
  };

  getIsImplementer(
    votingContract: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  isImplementer(arg0: string, overrides?: CallOverrides): Promise<boolean>;

  callStatic: {
    getIsImplementer(
      votingContract: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    isImplementer(arg0: string, overrides?: CallOverrides): Promise<boolean>;
  };

  filters: {};

  estimateGas: {
    getIsImplementer(
      votingContract: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isImplementer(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    getIsImplementer(
      votingContract: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isImplementer(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
