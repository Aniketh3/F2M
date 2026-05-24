const mongoose = require('mongoose');
const { ethers } = require('ethers');
const Buyer = require('./modals/Buyer');
const Seller = require('./modals/Seller');

const MONGO_URI = "mongodb+srv://aravind:aravind@cluster0.pjj53wk.mongodb.net/";
const RPC_URL = 'http://127.0.0.1:8545';

// 1000 ETH in hex: 1000 * 10^18 = 10^21 = 0x3635c9adc5dea00000
const FUND_AMOUNT_HEX = "0x3635c9adc5dea00000"; 

async function main() {
  let provider;
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    // Test connection
    await provider.getNetwork();
    console.log(`Connected to Hardhat node at ${RPC_URL}`);
  } catch (error) {
    console.error(`Could not connect to Hardhat node at ${RPC_URL}. Make sure it is running!`);
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Fund Backend Wallet (lowercased)
    const backendAddress = "0xbff48E1190495e9BC6d3f7786a2F05C14BdEA759".toLowerCase();
    console.log(`Funding Backend Wallet (${backendAddress})...`);
    await provider.send("hardhat_setBalance", [backendAddress, FUND_AMOUNT_HEX]);
    const backendBal = await provider.getBalance(backendAddress);
    console.log(`Backend Wallet Balance: ${ethers.formatEther(backendBal)} ETH`);

    // 2. Fund Hardhat Accounts (lowercased)
    const hardhatAccounts = [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account 0
      "0x70997970C51812e339D9B73b0245ad59cc793a05", // Account 1
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account 2
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account 3
      "0x15d34AAf54a6b7d1281C8e053d269aadFec664f3", // Account 4
      "0x976EA74026E726554dB657fA54763abd0C3a0aa9"  // Account 5
    ].map(a => a.toLowerCase());

    for (const acc of hardhatAccounts) {
      await provider.send("hardhat_setBalance", [acc, FUND_AMOUNT_HEX]);
    }
    console.log("Pre-funded default Hardhat accounts.");

    // 3. Process Buyers
    const buyers = await Buyer.find({});
    console.log(`Processing ${buyers.length} buyers...`);
    let buyerAccountIdx = 1; // Start assigning Hardhat Account 1 onwards for buyers
    for (const buyer of buyers) {
      let addr = buyer.WalletAddress;
      let updated = false;

      if (!addr || addr.toLowerCase() === 'none' || addr.toLowerCase() === 'null' || addr.trim() === '') {
        // Assign a pre-funded Hardhat account deterministic wallet
        // Account 1-5 for buyers
        const assignedAcc = hardhatAccounts[buyerAccountIdx % hardhatAccounts.length];
        buyer.WalletAddress = assignedAcc;
        addr = assignedAcc;
        buyerAccountIdx++;
        updated = true;
        console.log(`Assigning new WalletAddress to Buyer ${buyer.Name}: ${addr}`);
      }

      addr = addr.toLowerCase();
      // Fund the address on Hardhat
      await provider.send("hardhat_setBalance", [addr, FUND_AMOUNT_HEX]);
      
      if (updated) {
        await buyer.save({ validateBeforeSave: false });
      }
      
      const bal = await provider.getBalance(addr);
      console.log(`Buyer ${buyer.Name} (${addr}): ${ethers.formatEther(bal)} ETH`);
    }

    // 4. Process Sellers
    const sellers = await Seller.find({});
    console.log(`Processing ${sellers.length} sellers...`);
    let sellerAccountIdx = 3; // Start assigning Hardhat Account 3 onwards for sellers
    for (const seller of sellers) {
      let addr = seller.WalletAddress;
      let updated = false;

      if (!addr || addr.toLowerCase() === 'none' || addr.toLowerCase() === 'null' || addr.trim() === '') {
        const assignedAcc = hardhatAccounts[sellerAccountIdx % hardhatAccounts.length];
        seller.WalletAddress = assignedAcc;
        addr = assignedAcc;
        sellerAccountIdx++;
        updated = true;
        console.log(`Assigning new WalletAddress to Seller ${seller.Name}: ${addr}`);
      }

      addr = addr.toLowerCase();
      // Fund the address on Hardhat
      await provider.send("hardhat_setBalance", [addr, FUND_AMOUNT_HEX]);
      
      if (updated) {
        await seller.save({ validateBeforeSave: false });
      }

      const bal = await provider.getBalance(addr);
      console.log(`Seller ${seller.Name} (${addr}): ${ethers.formatEther(bal)} ETH`);
    }

    console.log("Successfully funded all wallets!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error during execution:", error);
  }
}

main();

