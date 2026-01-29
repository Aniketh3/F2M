require("dotenv").config();
const { ethers } = require("ethers");

// RPC Provider (Hardhat / Alchemy / Infura)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Company Wallet (Backend Wallet)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract ABI + Address
const factoryABI = require("./abi/FarmerEscrowFactory.json");
const factoryAddress = process.env.FACTORY_ADDRESS;

const factoryContract = new ethers.Contract(
  factoryAddress,
  factoryABI,
  wallet
);

module.exports = { factoryContract, provider, wallet };
