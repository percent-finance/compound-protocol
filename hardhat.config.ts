require('hardhat-deploy');
require('hardhat-deploy-ethers');
require("@nomiclabs/hardhat-etherscan");
const {NODE_URL,ETHERSCAN_API_KEY,VFAT_MULTISIG_PK,PERCENT_ALCHEMY_URL} = require("./secret")

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.5.16",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: {
        url: PERCENT_ALCHEMY_URL,
        blockNumber: 11424770
      }
    },
    mainnet: {
      url: PERCENT_ALCHEMY_URL,
      accounts: [VFAT_MULTISIG_PK]
    }
  },
  paths: {
    tests: "./hardhat/test"
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    }
  },
  mocha: {
    timeout: 60000
  },
  etherscan : {
    apiKey : ETHERSCAN_API_KEY
  }
};
