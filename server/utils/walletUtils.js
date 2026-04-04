const { ethers } = require('ethers');
const crypto = require('crypto');

// ============================================================================
// WALLET ENCRYPTION - Secure storage of private keys
// ============================================================================

// Encryption key from environment or use default (change for production!)
// IMPORTANT: Must be exactly 32 bytes (64 hex characters) for AES-256-CBC
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/**
 * Encrypt private key before storing in database
 * @param {string} privateKey - The private key to encrypt (0x format)
 * @returns {string} - Encrypted private key (hex format)
 */
function encryptPrivateKey(privateKey) {
  try {
    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(16);
    
    // Create cipher using AES-256-CBC
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    // Encrypt the private key
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted key (IV needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error(`Failed to encrypt private key: ${error.message}`);
  }
}

/**
 * Decrypt private key from database
 * @param {string} encryptedData - Encrypted private key with IV (format: iv:encrypted)
 * @returns {string} - Decrypted private key (0x format)
 */
function decryptPrivateKey(encryptedData) {
  try {
    // Split IV and encrypted data
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt private key: ${error.message}`);
  }
}

// ============================================================================
// WALLET GENERATION
// ============================================================================

/**
 * Generate a new Ethereum wallet for a user
 * @returns {Object} - { address, privateKey }
 */
function generateUserWallet() {
  try {
    // Create random wallet
    const wallet = ethers.Wallet.createRandom();
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    throw new Error(`Failed to generate wallet: ${error.message}`);
  }
}

/**
 * Create a wallet instance from encrypted private key
 * @param {string} encryptedPrivateKey - Encrypted private key from DB
 * @param {object} provider - Ethers provider
 * @returns {object} - Wallet instance
 */
function loadUserWallet(encryptedPrivateKey, provider) {
  try {
    const privateKey = decryptPrivateKey(encryptedPrivateKey);
    return new ethers.Wallet(privateKey, provider);
  } catch (error) {
    throw new Error(`Failed to load user wallet: ${error.message}`);
  }
}

/**
 * Get wallet balance
 * @param {string} walletAddress - Address to check balance
 * @param {object} provider - Ethers provider
 * @returns {Promise<string>} - Balance in ether
 */
async function getWalletBalance(walletAddress, provider) {
  try {
    const balanceWei = await provider.getBalance(walletAddress);
    return ethers.formatEther(balanceWei);
  } catch (error) {
    throw new Error(`Failed to get wallet balance: ${error.message}`);
  }
}

/**
 * Get wallet balance in wei
 * @param {string} walletAddress - Address to check balance
 * @param {object} provider - Ethers provider
 * @returns {Promise<BigInt>} - Balance in wei
 */
async function getWalletBalanceWei(walletAddress, provider) {
  try {
    return await provider.getBalance(walletAddress);
  } catch (error) {
    throw new Error(`Failed to get wallet balance: ${error.message}`);
  }
}

// ============================================================================
// UTILITY CONVERSIONS
// ============================================================================

function weiToEther(wei) {
  return ethers.formatEther(wei);
}

function etherToWei(ether) {
  return ethers.parseEther(ether.toString());
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Encryption/Decryption
  encryptPrivateKey,
  decryptPrivateKey,
  
  // Wallet Generation & Loading
  generateUserWallet,
  loadUserWallet,
  
  // Balance Queries
  getWalletBalance,
  getWalletBalanceWei,
  
  // Conversions
  weiToEther,
  etherToWei,
};
