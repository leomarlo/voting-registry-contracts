import { deploymentInfoPath, basePath } from "../../utils/paths";
import { 
  Deployment, 
  AlreadyDeployed,
  DeploymentAddressAndBooleanPerContract,
  DeploymentAddressesAndBoolean 
} from "../../interfaces/deployment"

import fs from 'fs'

function alreadyDeployed(network: string, contracts: Array<string>): AlreadyDeployed {
  let rawdata = fs.readFileSync(deploymentInfoPath);
  let deploymentVariables : { [key: string]: { [key: string]: Deployment  }  } =
    (rawdata.length==0) ? {} : JSON.parse(rawdata.toString())
    // console.log('deployment Variables', deploymentVariables)
  if (!(network in deploymentVariables)) return {flag: false, contracts:{}};
  let alreadyDeployedFlag : boolean = true
  let addressesAndBoolean : DeploymentAddressesAndBoolean = {}
  for (let i=0; i<contracts.length; i++){
    let isDeployed = (contracts[i] in deploymentVariables[network])
    addressesAndBoolean[contracts[i]] = {
      isDeployed: isDeployed, 
      address: (!isDeployed? '' : deploymentVariables[network][contracts[i]].address)
    }
    alreadyDeployedFlag = alreadyDeployedFlag && (contracts[i] in deploymentVariables[network])
  }
  return {
    flag: alreadyDeployedFlag, 
    contracts: addressesAndBoolean
  };
}

export{
  alreadyDeployed
}
