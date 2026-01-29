const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// ============================================================================
// BLOCKCHAIN CONFIGURATION
// ============================================================================

// Connect to local Hardhat node (or configured RPC)
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ============================================================================
// WALLET SETUP
// ============================================================================

// Backend private key from environment or use Hardhat default account
const BACKEND_PRIVATE_KEY = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadeee4c4b1067f9fbce1f62';
const backendWallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);

console.log('Backend Wallet Address:', backendWallet.address);

// ============================================================================
// CONTRACT CONFIGURATION
// ============================================================================

// Try to load from config file, fallback to environment variables
let factoryABI = null;
let escrowABI = null;
let FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || null;

try {
  const configPath = path.join(__dirname, 'config', 'contracts.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    factoryABI = config.factoryAbi;
    escrowABI = config.escrowAbi;
    FACTORY_ADDRESS = config.factoryAddress || FACTORY_ADDRESS;
  }
} catch (error) {
  console.warn('Could not load contract config from file:', error.message);
}

// Initialize Factory Contract
let factoryContract = null;

try {
  if (FACTORY_ADDRESS && factoryABI) {
    factoryContract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, backendWallet);
    console.log('Factory Contract initialized at:', FACTORY_ADDRESS);
  } else {
    console.warn('Factory contract not fully configured. Please deploy contracts and set FACTORY_ADDRESS.');
  }
} catch (error) {
  console.error('Error initializing factory contract:', error.message);
}

// ============================================================================
// ESCROW CONTRACT OPERATIONS
// ============================================================================

/**
 * Create a new escrow agreement
 * @param {string} farmerAddress - Address of the farmer
 * @param {string} totalPrice - Total price in wei
 * @param {number} quantity - Quantity of produce
 * @param {string} produceType - Type of produce
 * @param {number} deliveryDeadline - Unix timestamp for delivery deadline
 * @param {number} penaltyPercent - Penalty percentage (e.g., 5 for 5%)
 * @returns {Promise<{escrowAddress, txHash, status}>}
 */
async function createEscrow(farmerAddress, totalPrice, quantity, produceType, deliveryDeadline, penaltyPercent) {
  try {
    if (!factoryContract) {
      throw new Error('Factory contract not initialized. Deploy contracts first.');
    }

    // Validate inputs
    if (!ethers.isAddress(farmerAddress)) {
      throw new Error('Invalid farmer address');
    }
    if (BigInt(totalPrice) <= 0) {
      throw new Error('Total price must be greater than zero');
    }
    if (penaltyPercent > 50) {
      throw new Error('Penalty percent too high (max 50%)');
    }

    console.log('Creating escrow with params:', {
      farmerAddress,
      totalPrice: totalPrice.toString(),
      quantity,
      produceType,
      deliveryDeadline,
      penaltyPercent
    });

    // Call factory function
    const tx = await factoryContract.createEscrow(
      farmerAddress,
      totalPrice,
      quantity,
      produceType,
      deliveryDeadline,
      penaltyPercent
    );

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    // Extract escrow address from logs
    const escrowCreatedEvent = receipt.logs
      .map(log => {
        try {
          return factoryContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(event => event && event.name === 'EscrowCreated');

    if (!escrowCreatedEvent) {
      throw new Error('Could not find EscrowCreated event in transaction');
    }

    const escrowAddress = escrowCreatedEvent.args[0];

    return {
      escrowAddress,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: 'Created'
    };
  } catch (error) {
    console.error('Error creating escrow:', error.message);
    throw error;
  }
}

/**
 * Get a contract instance for a specific escrow
 * @param {string} escrowAddress - Address of the escrow contract
 * @returns {ethers.Contract} - Escrow contract instance
 */
function getEscrowContract(escrowAddress) {
  if (!ethers.isAddress(escrowAddress)) {
    throw new Error('Invalid escrow address');
  }

  if (!escrowABI) {
    throw new Error('Escrow ABI not loaded');
  }

  return new ethers.Contract(escrowAddress, escrowABI, backendWallet);
}

/**
 * Farmer accepts the escrow agreement
 * @param {string} escrowAddress - Address of the escrow contract
 * @returns {Promise<{txHash, status}>}
 */
async function acceptAgreement(escrowAddress) {
  try {
    const escrowContract = getEscrowContract(escrowAddress);
    const tx = await escrowContract.acceptAgreement();
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: 'Active'
    };
  } catch (error) {
    console.error('Error accepting agreement:', error.message);
    throw error;
  }
}

/**
 * Buyer deposits funds into escrow
 * @param {string} escrowAddress - Address of the escrow contract
 * @param {string} amount - Amount to deposit in wei
 * @returns {Promise<{txHash, status}>}
 */
async function depositFunds(escrowAddress, amount) {
  try {
    const escrowContract = getEscrowContract(escrowAddress);
    const tx = await escrowContract.depositFunds({ value: amount });
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: 'Funded'
    };
  } catch (error) {
    console.error('Error depositing funds:', error.message);
    throw error;
  }
}

/**
 * Farmer marks produce as delivered
 * @param {string} escrowAddress - Address of the escrow contract
 * @returns {Promise<{txHash, status}>}
 */
async function markAsDelivered(escrowAddress) {
  try {
    const escrowContract = getEscrowContract(escrowAddress);
    const tx = await escrowContract.markAsDelivered();
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: 'Delivered'
    };
  } catch (error) {
    console.error('Error marking as delivered:', error.message);
    throw error;
  }
}

/**
 * Buyer confirms delivery (releases funds to farmer)
 * @param {string} escrowAddress - Address of the escrow contract
 * @returns {Promise<{txHash, status}>}
 */
async function confirmDelivery(escrowAddress) {
  try {
    const escrowContract = getEscrowContract(escrowAddress);
    const tx = await escrowContract.confirmDelivery();
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: 'Completed'
    };
  } catch (error) {
    console.error('Error confirming delivery:', error.message);
    throw error;
  }
}

/**
 * Buyer rejects delivery and initiates refund with penalty
 * @param {string} escrowAddress - Address of the escrow contract
 * @param {string} reason - Reason for rejection
 * @returns {Promise<{txHash, status}>}
 */
async function rejectDelivery(escrowAddress, reason) {
  try {
    const escrowContract = getEscrowContract(escrowAddress);
    const tx = await escrowContract.rejectDelivery(reason);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: 'Rejected'
    };
  } catch (error) {
    console.error('Error rejecting delivery:', error.message);
    throw error;
  }
}

/**
 * Get escrow status and details
 * @param {string} escrowAddress - Address of the escrow contract
 * @returns {Promise<{status, totalPrice, quantity, produceType, deliveryDeadline, penaltyPercent, balance, remainingTime}>}
 */
async function getEscrowStatus(escrowAddress) {
  try {
    const escrowContract = getEscrowContract(escrowAddress);

    // Fetch all details in parallel
    const [status, totalPrice, quantity, produceType, deliveryDeadline, penaltyPercent, balance, remainingTime] = await Promise.all([
      escrowContract.getCurrentStatus(),
      escrowContract.totalPrice(),
      escrowContract.quantity(),
      escrowContract.produceType(),
      escrowContract.deliveryDeadline(),
      escrowContract.penaltyPercent(),
      escrowContract.getContractBalance(),
      escrowContract.getRemainingTime()
    ]);

    const statusNames = ['Created', 'Active', 'Delivered', 'Completed', 'Rejected', 'Refunded', 'Cancelled'];

    return {
      status: statusNames[status],
      totalPrice: totalPrice.toString(),
      quantity: quantity.toString(),
      produceType,
      deliveryDeadline: deliveryDeadline.toString(),
      penaltyPercent: penaltyPercent.toString(),
      balance: balance.toString(),
      remainingTime: remainingTime.toString()
    };
  } catch (error) {
    console.error('Error fetching escrow status:', error.message);
    throw error;
  }
}

/**
 * Check backend wallet balance
 * @returns {Promise<string>} - Balance in wei
 */
async function getBackendBalance() {
  try {
    const balance = await provider.getBalance(backendWallet.address);
    return balance.toString();
  } catch (error) {
    console.error('Error fetching balance:', error.message);
    throw error;
  }
}

/**
 * Convert wei to ether
 * @param {string} wei - Amount in wei
 * @returns {string} - Amount in ether
 */
function weiToEther(wei) {
  return ethers.formatEther(wei);
}

/**
 * Convert ether to wei
 * @param {string} ether - Amount in ether
 * @returns {string} - Amount in wei
 */
function etherToWei(ether) {
  return ethers.parseEther(ether).toString();
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Blockchain setup
  provider,
  backendWallet,
  factoryContract,
  
  // Escrow operations
  createEscrow,
  acceptAgreement,
  depositFunds,
  markAsDelivered,
  confirmDelivery,
  rejectDelivery,
  getEscrowStatus,
  getEscrowContract,
  
  // Utility functions
  getBackendBalance,
  weiToEther,
  etherToWei
};
