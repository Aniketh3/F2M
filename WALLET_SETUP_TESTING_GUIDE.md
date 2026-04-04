# Approach 3: Hybrid Wallet Implementation - Testing Guide

## 🎯 Implementation Complete!

Your F2M project now has **Approach 3 (Hybrid)** wallet implementation. Here's what was added:

---

## ✅ What Was Implemented

### 1. **Wallet Utility Module** (`server/utils/walletUtils.js`)
- ✅ Generate random Ethereum wallets
- ✅ Encrypt/decrypt private keys (AES-256-CBC)
- ✅ Load wallets from encrypted keys
- ✅ Get wallet balances
- ✅ Wei ↔ Ether conversions

### 2. **Database Schema Updates**
- ✅ Added `walletAddress` to Seller schema
- ✅ Added `encryptedPrivateKey` to Seller schema
- ✅ Added `walletCreatedAt` to Seller schema
- ✅ Same fields added to Buyer schema

### 3. **Registration Routes Enhanced**
- ✅ `POST /seller/register` - Auto-generates & funds wallet
- ✅ `POST /buyer/register` - Auto-generates & funds wallet
- ✅ Wallet funded with 1.0 test ETH automatically

### 4. **Blockchain.js Enhanced**
- ✅ `fundUserWallet(address, amount)` - Fund wallet from backend
- ✅ `getWalletBalance(address)` - Get any wallet's balance
- ✅ `loadUserWalletContext(encryptedKey)` - Load user's wallet
- ✅ `createEscrowWithUserWallet(...)` - Create escrow with user's wallet

### 5. **New API Endpoints**
- ✅ `GET /wallet/info/:username` - Get wallet info & balance
- ✅ `POST /wallet/fund/:username` - Manually fund wallet (testing)

---

## 🚀 How to Test

### **Prerequisites**
1. **Start Hardhat Local Network**
   ```bash
   cd F2M/fyp-sc-smartcontract
   npx hardhat node
   ```
   This will:
   - Start local testnet at `http://127.0.0.1:8545`
   - Provide 20 accounts with unlimited test ETH
   - Display account addresses and private keys

2. **Start MongoDB**
   - Already configured in your `server/index.js`
   - Connection string: `mongodb+srv://aravind:aravind@cluster0.pjj53wk.mongodb.net/`

3. **Start Backend Server**
   ```bash
   cd F2M/server
   npm install  # if not already done
   npm start
   ```
   Should see:
   ```
   Connected to Mongo DB
   Backend Wallet Address: 0x...
   Factory Contract initialized at: 0x...
   ```

---

## 📝 Testing Steps

### **Step 1: Register a Farmer (Seller)**

**Request:**
```bash
POST http://localhost:3000/seller/register
Content-Type: application/json

{
  "Name": "Rajesh Kumar",
  "PIN": 1234,
  "PhoneNumber": "9876543210",
  "AadharNumber": "123456789012",
  "Address": "Village ABC, State XYZ",
  "FruitsID": "FRUIT001"
}
```

**Expected Response:**
```json
{
  "message": "Registered successfully with blockchain wallet",
  "walletAddress": "0x1234567890abcdef...",
  "seller": {
    "name": "Rajesh Kumar",
    "walletCreated": true
  }
}
```

**Backend Console Output:**
```
📝 Registering seller: Rajesh Kumar
✓ Wallet generated: 0x1234567890abcdef...
✓ Private key encrypted
✓ Wallet funded with 1.0 ETH. TxHash: 0x...
```

### **Step 2: Get Wallet Information**

**Request:**
```bash
GET http://localhost:3000/wallet/info/Rajesh Kumar
```

**Expected Response:**
```json
{
  "success": true,
  "userType": "seller",
  "username": "Rajesh Kumar",
  "walletAddress": "0x1234567890abcdef...",
  "walletCreatedAt": "2025-04-04T12:00:00.000Z",
  "balance": {
    "ether": "1.0",
    "wei": "1000000000000000000"
  }
}
```

### **Step 3: Register a Buyer**

**Request:**
```bash
POST http://localhost:3000/buyer/register
Content-Type: application/json

{
  "Name": "Priya Verma",
  "PIN": 5678,
  "PhoneNumber": "9123456789",
  "Email": "priya@example.com",
  "AadharNumber": "987654321098",
  "GSTNumber": "29ABCDE1234F0Z5",
  "Address": "City ABC, State XYZ"
}
```

**Expected Response:** (Similar to seller registration)

### **Step 4: Login (No Changes)**

Login continues to work normally - no blockchain involved:

```bash
POST http://localhost:3000/seller/login
Content-Type: application/json

{
  "Name": "Rajesh Kumar",
  "PIN": 1234
}
```

---

## 💡 How the Flow Works

```
┌─────────────────────────────────────────────────┐
│ 1. REGISTRATION FLOW                            │
└─────────────────────────────────────────────────┘

User submits registration data
     ↓
Backend generates random Ethereum wallet
     ↓
Private key is encrypted (AES-256-CBC)
     ↓
Encrypted key + address stored in MongoDB
     ↓
Backend's wallet sends 1.0 test ETH to user's wallet
     ↓
User account created with blockchain wallet
     ↓
Farmer can now use this wallet for transactions!

┌─────────────────────────────────────────────────┐
│ 2. TRANSACTION FLOW (Later)                    │
└─────────────────────────────────────────────────┘

User wants to create escrow
     ↓
Backend loads user's encrypted wallet
     ↓ 
Decrypts private key from DB
     ↓
Uses user's wallet to sign transaction
     ↓
User's wallet deploys/interacts with smart contract
     ↓
Funds held in escrow on blockchain
```

---

## 🔐 Security Notes

### Current Implementation (Prototype)
- ✅ Private keys are encrypted before storage
- ✅ Each user has their own wallet
- ✅ Backend doesn't need access to private keys for basic operations
- ⚠️ Encryption key is in environment (consider .env file)

### For Production
You should add:
1. **Hardware Security Module (HSM)** for key storage
2. **Key rotation** mechanisms
3. **Audit logging** for key access
4. **Multi-signature wallets** for large transactions
5. **Rate limiting** on wallet operations
6. **Two-factor authentication** for sensitive operations

---

## 🧪 Testing Scenarios

### Scenario 1: Check wallet balance after registration
```bash
# Register a user, get their wallet address
# Then check balance

GET http://localhost:3000/wallet/info/Rajesh Kumar
```

### Scenario 2: Manually fund a wallet (admin testing)
```bash
POST http://localhost:3000/wallet/fund/Rajesh Kumar
Content-Type: application/json

{
  "amountEther": "2.5"
}
```

### Scenario 3: Create escrow with farmer's wallet
```
# Future: Update /escrow/create endpoint to use farmer's wallet
# Instead of backend wallet
```

---

## 📊 Database Schema Changes

### Seller Schema
```javascript
walletAddress: {
    type: String,
    unique: true,
    sparse: true  // Allows null for non-blockchain users
},
encryptedPrivateKey: {
    type: String,
    sparse: true
},
walletCreatedAt: {
    type: Date,
    default: null
}
```

Same for Buyer schema.

---

## 🔧 Environment Variables to Create

Create `.env` file in `F2M/server/`:

```env
# Blockchain
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadeee4c4b1067f9fbce1f62
FACTORY_ADDRESS=0x...

# Wallet Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef

# Backend
NODE_ENV=development
PORT=3000
```

---

## 🐛 Troubleshooting

### Issue: "Could not fund wallet"
**Cause:** Hardhat node not running
**Solution:** 
```bash
cd F2M/fyp-sc-smartcontract
npx hardhat node
```

### Issue: Invalid address in registration response
**Cause:** Wallet generation failed
**Solution:** Check Node.js version (need v14+) and ethers.js installation

### Issue: Encryption key errors
**Cause:** ENCRYPTION_KEY not set or incorrect length
**Solution:** Use exactly 32 hex characters (16 bytes for AES-256)

### Issue: Private key decryption fails
**Cause:** Encrypted key corrupted or different encryption key
**Solution:** Check `.env` file has correct ENCRYPTION_KEY

---

## 📝 Next Steps

After testing basic registration:

1. **Update Escrow Creation** - Use farmer's wallet instead of backend
2. **Transaction Signing** - User wallets sign transactions on backend
3. **Frontend Integration** - Show wallet address in user profile
4. **Gas Management** - Handle gas fees from user's wallet
5. **Recovery Mechanism** - Backup/recovery for user wallets

---

## 📚 Files Modified

- ✅ `server/utils/walletUtils.js` - NEW
- ✅ `server/modals/Seller.js` - Added wallet fields
- ✅ `server/modals/Buyer.js` - Added wallet fields
- ✅ `server/blockchain.js` - Added user wallet functions
- ✅ `server/index.js` - Updated registration & added wallet endpoints
- ✅ `server/routes/escrow.js` - Ready for user wallet integration

---

## ✨ Summary

You now have:
- ✅ Each farmer/buyer gets unique wallet on registration
- ✅ Wallets funded with test ETH automatically
- ✅ Private keys encrypted and stored securely
- ✅ Wallet endpoints for checking balance & funding
- ✅ Foundation for user-wallet transactions
- ✅ Ready for blockchain transaction signing

**Status: READY FOR TESTING!** 🚀
