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
  Overrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./common";

interface ImplementMajorityVoteInterface extends ethers.utils.Interface {
  functions: {
    "VOTING_DURATION()": FunctionFragment;
    "conclude(uint256)": FunctionFragment;
    "getCurrentIndex()": FunctionFragment;
    "getStatus(uint256)": FunctionFragment;
    "result(uint256)": FunctionFragment;
    "start(bytes,bytes)": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
    "vote(uint256,bytes)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "VOTING_DURATION",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "conclude",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getCurrentIndex",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getStatus",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "result",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "start",
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "vote",
    values: [BigNumberish, BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "VOTING_DURATION",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "conclude", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getCurrentIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getStatus", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "result", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "start", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "vote", data: BytesLike): Result;

  events: {
    "VotingInstanceStarted(uint256,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "VotingInstanceStarted"): EventFragment;
}

export type VotingInstanceStartedEvent = TypedEvent<
  [BigNumber, string] & { identifier: BigNumber; caller: string }
>;

export class ImplementMajorityVote extends BaseContract {
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

  interface: ImplementMajorityVoteInterface;

  functions: {
    VOTING_DURATION(overrides?: CallOverrides): Promise<[BigNumber]>;

    conclude(
      identifier: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getCurrentIndex(
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { currentIndex: BigNumber }>;

    getStatus(
      identifier: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { status: BigNumber }>;

    result(
      identifier: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string] & { resultData: string }>;

    start(
      votingParams: BytesLike,
      callback: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    vote(
      identifier: BigNumberish,
      votingData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  VOTING_DURATION(overrides?: CallOverrides): Promise<BigNumber>;

  conclude(
    identifier: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getCurrentIndex(overrides?: CallOverrides): Promise<BigNumber>;

  getStatus(
    identifier: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  result(identifier: BigNumberish, overrides?: CallOverrides): Promise<string>;

  start(
    votingParams: BytesLike,
    callback: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  supportsInterface(
    interfaceId: BytesLike,
    overrides?: CallOverrides
  ): Promise<boolean>;

  vote(
    identifier: BigNumberish,
    votingData: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    VOTING_DURATION(overrides?: CallOverrides): Promise<BigNumber>;

    conclude(
      identifier: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    getCurrentIndex(overrides?: CallOverrides): Promise<BigNumber>;

    getStatus(
      identifier: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    result(
      identifier: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    start(
      votingParams: BytesLike,
      callback: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    vote(
      identifier: BigNumberish,
      votingData: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {
    "VotingInstanceStarted(uint256,address)"(
      identifier?: null,
      caller?: null
    ): TypedEventFilter<
      [BigNumber, string],
      { identifier: BigNumber; caller: string }
    >;

    VotingInstanceStarted(
      identifier?: null,
      caller?: null
    ): TypedEventFilter<
      [BigNumber, string],
      { identifier: BigNumber; caller: string }
    >;
  };

  estimateGas: {
    VOTING_DURATION(overrides?: CallOverrides): Promise<BigNumber>;

    conclude(
      identifier: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getCurrentIndex(overrides?: CallOverrides): Promise<BigNumber>;

    getStatus(
      identifier: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    result(
      identifier: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    start(
      votingParams: BytesLike,
      callback: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    vote(
      identifier: BigNumberish,
      votingData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    VOTING_DURATION(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    conclude(
      identifier: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getCurrentIndex(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getStatus(
      identifier: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    result(
      identifier: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    start(
      votingParams: BytesLike,
      callback: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    supportsInterface(
      interfaceId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    vote(
      identifier: BigNumberish,
      votingData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
