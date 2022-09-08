interface Deployment {
    address: string,
    path: string,
    arguments: Array<string>
}

type ContractDeploymentInfo = { [key: string]: Deployment  }  

type NetworkToContractDeploymentInfo = { [key: string]: ContractDeploymentInfo }


export {
    Deployment,
    ContractDeploymentInfo,
    NetworkToContractDeploymentInfo
}
