import { Result } from "ethers/lib/utils";
import { ContractReceipt, BigNumber } from "ethers";

function getEventArgs(receipt: ContractReceipt): Result {
    if (receipt.events !== undefined) {
        if (receipt.events[0].args !==undefined) {return receipt.events[0].args}
        throw("Args are undefined!")
    }
    throw("Events are undefined!")
}

export {
    getEventArgs
}