import { exec } from 'child_process';
import fs from 'fs';
import hre from 'hardhat';
import { deploymentInfoPath, verificationPath } from "../utils/paths"


function execShellCommand(cmd: string) {
    return new Promise((resolve, reject) => {
      exec(cmd, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        } else if (stdout) {
          console.log(stdout); 
        } else {
          console.log(stderr);
        }
        resolve(stdout ? true : false);
      });
    });
  }

interface Deployment {
  address: string,
  path: string,
  arguments: Array<string>
}

function saveDeploymentArgumentsToFile(network: string){

    let exportFile = ''

    let rawdata = fs.readFileSync(deploymentInfoPath);
    let deploymentVariables : { [key: string]: { [key: string]: Deployment  }  } =
      (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())
    if (!(network in deploymentVariables)) return;
    let deploymentVariablesList: Array<string> = Object.keys(deploymentVariables[network])

    for (let i=0; i<deploymentVariablesList.length; i++){
        let contractName = deploymentVariablesList[i]
        let argumentList = deploymentVariables[network][contractName]["arguments"];
        exportFile = 'module.exports = [\n'
        for (let j=0; j<argumentList.length; j++ ){
            exportFile += "\t" + argumentList[j] + ",\n"
        }
        exportFile += ']'
        // console.log(exportFile)
        let fileName : string = "deploy-args-" + contractName + ".js"
        fs.writeFileSync(verificationPath + network + `/` + fileName, exportFile)
    }

}


// verify on Etherscan
function getVerificationCommand(name: string, network: string) : string {

    let rawdata = fs.readFileSync(deploymentInfoPath);
    let deploymentVariables : { [key: string]: { [key: string]: Deployment  }  } =
      (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())
    if (!(network in deploymentVariables)) return ""
    if (!(name in deploymentVariables[network])) return ""

    // deploymentVariablesList = Object.keys(deploymentVariables)
    let fileName = "deploy-args-" + name + ".js"
    let filePath = verificationPath + network + `/` + fileName
    let fullyQualifiedContractName = deploymentVariables[network][name]["path"] + ':' + name
    let address = deploymentVariables[network][name]["address"]

    let argumentString = ` --network ${network} --contract ${fullyQualifiedContractName} --constructor-args ${filePath} ${address}`  
    let cmd = "npx hardhat verify " + argumentString;
    console.log(cmd) 
    return cmd
    // await execShellCommand(cmd);
}

// async function verifyAllContracts() {
//     let rawdata = fs.readFileSync(`info/${hre.network.name}/deployment-variables.json`);
//     let deploymentVariables = JSON.parse(rawdata);
//     deploymentVariablesList = Object.keys(deploymentVariables)
//     for (let i=0; i<deploymentVariablesList.length; i++){
//         let deploymentAddress = deploymentVariablesList[i]
//         let fileName = "deploy-vars-" + deploymentVariables[deploymentAddress]["name"] + ".js"
//         let filePath = `scripts/verification/${hre.network.name}/${fileName}`
//         let fullyQualifiedContractName = deploymentVariables[deploymentAddress]["contract-path"] + ':' + deploymentVariables[deploymentAddress]["name"]
//         let arguments = ` --network ${hre.network.name} --contract ${fullyQualifiedContractName} --constructor-args ${filePath} ${deploymentAddress}` 
//         cmd = "npx hardhat verify " + arguments;
//         console.log(cmd) 
//         // await execShellCommand(cmd);
//     }

// }


export {
  saveDeploymentArgumentsToFile,
  getVerificationCommand, 
  execShellCommand
}
