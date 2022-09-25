interface Deployment {
    address: string,
    path: string,
    gasLimit: number,
    date: string,
    arguments: Array<string>
}

type ContractDeploymentInfo = { [key: string]: Deployment  }  

type NetworkToContractDeploymentInfo = { [key: string]: ContractDeploymentInfo }

interface DeploymentAddressAndBooleanPerContract {
    isDeployed: boolean,
    address: string
}
type DeploymentAddressesAndBoolean = { [key: string]: DeploymentAddressAndBooleanPerContract } 

interface AlreadyDeployed {
    flag: boolean,
    contracts: DeploymentAddressesAndBoolean
}

export {
    Deployment,
    ContractDeploymentInfo,
    NetworkToContractDeploymentInfo,
    AlreadyDeployed,
    DeploymentAddressAndBooleanPerContract,
    DeploymentAddressesAndBoolean
}
