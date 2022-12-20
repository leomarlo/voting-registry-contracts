
function getPlaygroundABI() {
    const path = require('path')
    const fs = require('fs');
    const file = path.resolve(__dirname, 'compiler-output','abis','src_examples_playground_Playground_sol_VotingPlayground.abi')
    const abi = JSON.parse(fs.readFileSync(file, 'utf8'));
    return abi
}

module.exports = {
    getPlaygroundABI
};