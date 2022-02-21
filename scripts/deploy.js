// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  const [deployer, addr1, addr2, addr3] = await hre.ethers.getSigners();

  const Wallet = await ethers.getContractFactory("Wallet");
  const wallet = await Wallet.deploy(
    [addr1.address, addr2.address, addr3.address],
    2
  );

  await wallet.deployed();

  console.log("Wallet deployed to:", wallet.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
