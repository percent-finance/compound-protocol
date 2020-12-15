const { expect } = require("chai");
const c = require("../constants");
const abi = require("../abi");
const { impersonateAccount, deployComptroller } = require("../utils");
const { ethers, deployments } = require("hardhat");

let multiSigSigner, timelockSigner, vfatSigner, comptroller, unitroller, chainlinkPriceOracle,
    newImplementation, oldComptroller

before(async function () {
  multiSigSigner = await impersonateAccount(c.MULTISIG_ADDRESS);
  timelockSigner = await impersonateAccount(c.TIMELOCK_ADDRESS);
  vfatSigner     = await impersonateAccount(c.VFAT_ADDRESS);

  unitroller = await ethers.getContractAt("Unitroller", c.UNITROLLER_ADDRESS, vfatSigner); 
  oldComptroller = await ethers.getContractAt("Comptroller", c.UNITROLLER_ADDRESS, vfatSigner);
  chainlinkPriceOracle = await ethers.getContractAt("ChainlinkPriceOracleProxy", c.CHAINLINK_PRICE_ORACLE_PROXY_ADDRESS);

  await deployments.fixture();
  newImplementation = await ethers.getContract('Comptroller', vfatSigner);
  await unitroller._setPendingImplementation(newImplementation.address);
  await newImplementation._become(unitroller.address);
  comptroller = await ethers.getContractAt("Comptroller", c.UNITROLLER_ADDRESS, vfatSigner);
});

describe('Deployment', function () {
  it('Can deploy new Comptroller', async function () {
    expect(await unitroller.comptrollerImplementation()).to.equal(newImplementation.address);
    const markets = await comptroller.getAllMarkets();
    const oldMarkets = await oldComptroller.getAllMarkets();
    expect(markets).to.eql(oldMarkets);
    const m1 = await ethers.getContractAt("CToken", markets[0], timelockSigner);
    await m1.accrueInterest();
  });
});