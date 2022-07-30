import { expect } from "chai";
import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IVOTINGCONTRACT_ID, IERC165_ID } from "../../scripts/interfaceIds";
import { getEventArgs } from "../../scripts/getEventArgs";

import {
    Tournament
} from "../../typechain"


interface Contracts {
    test: Tournament
}

interface IdentifierAndTimestamp {
    identifier: number,
    timestamp: number
}


