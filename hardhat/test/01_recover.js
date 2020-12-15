const { expect } = require("chai");
const c = require("../constants");
const abi = require("../abi");
const { impersonateAccount } = require("../utils");
const { ethers } = require("hardhat");

let multiSigSigner, timelockSigner, vfatSigner, comptroller, chainlinkPriceOracle

before(async function () {
  multiSigSigner = await impersonateAccount(c.MULTISIG_ADDRESS);
  timelockSigner = await impersonateAccount(c.TIMELOCK_ADDRESS);
  vfatSigner     = await impersonateAccount(c.VFAT_ADDRESS);

  comptroller = await ethers.getContractAt("Comptroller", c.UNITROLLER_ADDRESS, vfatSigner); 

  chainlinkPriceOracle = await ethers.getContractAt("ChainlinkPriceOracleProxy", c.CHAINLINK_PRICE_ORACLE_PROXY_ADDRESS);

});

describe('Deployment', function () {
  it('Can set comp rate to 0', async function () {
    await comptroller._setCompRate(0);
  });
});