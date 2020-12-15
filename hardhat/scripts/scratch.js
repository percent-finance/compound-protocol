const hre = require("hardhat");
const ethers = hre.ethers;
const { BigNumber } = ethers;
const { MAX_INT, INITIAL_EXCHANGE_RATE_MANTISSA, TIMELOCK_ADDRESS, UNITROLLER_ADDRESS, USDC_ADDRESS, INTEREST_RATE_MODEL_ADDRESS, CERC20_DELEGATE_ADDRESS, CHAINLINK_PRICE_ORACLE_PROXY_ADDRESS, USDC_CHAINLINE_AGGREGATOR_ADDRESS, BRICKED_PUSDC_ADDRESS, BRICKED_PUSDC_HOLDERS, BRICKED_PUSDC_BORROWERS } = require("../constants")

let tx
const exampleLockedUSDCBorrower = "0xda248cC10b477C1144219183EC87b0621DAC37b3"

async function main() {
  const [account1, account2] = await ethers.getSigners()
  tx = await account1.sendTransaction({to: TIMELOCK_ADDRESS, value: ethers.utils.parseEther("1.0")})
  tx.wait()

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [TIMELOCK_ADDRESS]
  })
  const timelockSigner = await ethers.provider.getSigner(TIMELOCK_ADDRESS)

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [exampleLockedUSDCBorrower]
  })
  const exampleLockedUSDCSigner = await ethers.provider.getSigner(exampleLockedUSDCBorrower)

  const InsolventCErc20Delegate = await hre.ethers.getContractFactory("InsolventCErc20Delegate", timelockSigner);
  let insolventCErc20Delegate = await InsolventCErc20Delegate.deploy();
  await insolventCErc20Delegate.deployed();

  const InsolventCErc20Delegator = await hre.ethers.getContractFactory("CErc20Delegator", timelockSigner);
  let pUsdc = await InsolventCErc20Delegator.deploy(
    USDC_ADDRESS,                        // underlying_
    UNITROLLER_ADDRESS,                  // comptroller_
    INTEREST_RATE_MODEL_ADDRESS,           // interestRateModel_
    INITIAL_EXCHANGE_RATE_MANTISSA,        // initialExchangeRateMantissa_
    "Percent USDC",                     // name_
    "pUSDC",                            // symbol_
    8,                                  // decimals_
    TIMELOCK_ADDRESS,                    // admin_
    insolventCErc20Delegate.address,    // implementation_ (insolvent version)
    0x0                                 // becomeImplementationData,
  );

  await pUsdc.deployed();
  pUsdc = await hre.ethers.getContractAt("InsolventCErc20", pUsdc.address, timelockSigner);
  tx = await pUsdc._specialInitState(BRICKED_PUSDC_ADDRESS, BRICKED_PUSDC_HOLDERS, BRICKED_PUSDC_BORROWERS);
  await tx.wait()

  // const chainlinkPriceOracle = await hre.ethers.getContractAt("ChainlinkPriceOracleProxy", CHAINLINK_PRICE_ORACLE_PROXY_ADDRESS);

  // let tx
  // tx = await chainlinkPriceOracle.setTokenConfigs([pUsdc.address], [USDC_CHAINLINE_AGGREGATOR_ADDRESS], [1], [6])
  // await tx.wait()

  const comptroller = await hre.ethers.getContractAt("Comptroller", UNITROLLER_ADDRESS, timelockSigner);
  tx = await comptroller._supportMarket(pUsdc.address)
  await tx.wait()

  tx = await pUsdc._setReserveFactor(BigNumber.from("800000000000000000"))
  await tx.wait()

  console.log(exampleLockedUSDCBorrower)
  console.log("balanceOf exampleLockedUSDCSigner", await pUsdc.balanceOf(exampleLockedUSDCBorrower))
  console.log("totalSupply", await pUsdc.totalSupply())
  console.log("borrowBalanceStored exampleLockedUSDCSigner", await pUsdc.borrowBalanceStored(exampleLockedUSDCBorrower))
  console.log("totalBorrows", await pUsdc.totalBorrows())

  tx = await pUsdc.accrueInterest()
  await tx.wait()

  const exampleUsdc = await hre.ethers.getContractAt("EIP20Interface", USDC_ADDRESS, exampleLockedUSDCSigner);
  tx = await exampleUsdc.approve(pUsdc.address, MAX_INT)
  await tx.wait()
  const examplePUsdc = await hre.ethers.getContractAt("CErc20Interface", pUsdc.address, exampleLockedUSDCSigner);
  tx = await examplePUsdc.repayBorrow(await pUsdc.borrowBalanceStored(exampleLockedUSDCBorrower))
  await tx.wait()
  console.log("borrowBalanceStored exampleLockedUSDCSigner", await pUsdc.borrowBalanceStored(exampleLockedUSDCBorrower))

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
