import * as dotenv from "dotenv";

dotenv.config();

function getGanacheCommand () {
    let gasLimit = "80000000"
    let port = process.env["LOCALPORT"]
    let pks = [process.env["ALICE"], process.env["BOB"], process.env["CHARLIE"]]
    // let addresses = new Array()
    let accounts = ''
    let alotta = '100000000000000000000'  // 100 Eth
    for (let i=0; i<pks.length; i++) {
        // let wl = new hre.ethers.Wallet(pks[i])
        // addresses.push(wl.address)
        accounts += `--account="0x${pks[i]},${alotta}" `
    }
    return `ganache-cli -l ${gasLimit} -p ${port} ${accounts}`
}

// console.log(getGanacheCommand())

export {
    getGanacheCommand
}