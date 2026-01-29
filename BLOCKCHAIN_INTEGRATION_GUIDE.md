# Blockchain-Frontend Integration Guide

## 🎯 Overview

This guide explains the blockchain integration for the F2M (Farm2Market) project using Option B: **Backend as Intermediary**. The frontend communicates with the backend, which handles all blockchain interactions via ethers.js.

---

## 📁 File Structure

### Backend Files Created/Modified:

```
server/
├── blockchain.js                    (NEW - Core blockchain utilities)
├── routes/
│   └── escrow.js                   (NEW - Escrow API endpoints)
├── config/
│   └── contracts.json              (NEW - Contract ABIs & addresses)
└── index.js                        (MODIFIED - Added escrow routes)
```

### Frontend Files Created:

```
client/
├── services/
│   └── blockchainService.js        (NEW - API wrapper for blockchain calls)
└── components/
    ├── BuyerHomeScreenWithBlockchain.js     (NEW - Example integration)
    └── OrdersScreenWithBlockchain.js        (NEW - Example integration)
```

---

## 🚀 Getting Started

### Step 1: Start Hardhat Node

In terminal 1:
```bash
cd F2M/fyp-sc-smartcontract
npx hardhat node
```

This starts a local blockchain at `http://127.0.0.1:8545` with 20 pre-funded test accounts.

### Step 2: Deploy Smart Contracts

In terminal 2:
```bash
cd F2M/fyp-sc-smartcontract
npx hardhat run scripts/deploy.js
```

**Note the output:** Save the **Factory Contract Address** - you'll need this.

### Step 3: Update Configuration

In `server/config/contracts.json`, update:
```json
{
  "factoryAddress": "0x5FbDB2315678afccb333f8a9c36c69b0ff5ff1ac"  // Replace with your address from Step 2
}
```

Or set environment variable:
```bash
# In server/.env
FACTORY_ADDRESS=0x5FbDB2315678afccb333f8a9c36c69b0ff5ff1ac
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadeee4c4b1067f9fbce1f62
```

### Step 4: Start Backend Server

In terminal 3:
```bash
cd F2M/server
npm install  # if not already installed
npm start
```

Server runs on `http://localhost:3000`

### Step 5: Test Blockchain Connection

Test the blockchain status endpoint:
```bash
curl http://localhost:3000/escrow/status
```

Expected response:
```json
{
  "message": "Blockchain connection active",
  "backendAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "balanceWei": "10000000000000000000",
  "balanceEther": "10.0",
  "factoryAddress": "0x5FbDB2315678afccb333f8a9c36c69b0ff5ff1ac"
}
```

---

## 📱 Frontend Integration

### Method 1: Use Provided Example Screens

Replace your existing screens with the blockchain-integrated versions:

**For Buyers:**
```javascript
// In App.js
import BuyerHomeScreenWithBlockchain from './components/BuyerHomeScreenWithBlockchain';

// Use instead of BuyerHomeScreen
<Tab.Screen name="Home" component={BuyerHomeScreenWithBlockchain} />
```

**For Orders:**
```javascript
import OrdersScreenWithBlockchain from './components/OrdersScreenWithBlockchain';

<Tab.Screen name="Orders" component={OrdersScreenWithBlockchain} />
```

### Method 2: Manual Integration

Add blockchain calls to your existing screens:

```javascript
import blockchainService from '../services/blockchainService';

// Check blockchain status on mount
useEffect(() => {
  const checkStatus = async () => {
    const status = await blockchainService.getBlockchainStatus();
    console.log('Blockchain ready:', status);
  };
  checkStatus();
}, []);

// Create escrow
const handleCreateEscrow = async () => {
  try {
    const result = await blockchainService.createEscrow({
      farmerAddress: '0x70997970C51812e339D9B73b0245ad59cc793a05',
      quantity: 100,
      produceType: 'Tomato',
      priceInEther: 5.5,
      deliveryDeadlineDays: 7,
      penaltyPercent: 10
    });
    console.log('Escrow created:', result.escrowAddress);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

## 🔌 API Endpoints

### 1. Get Blockchain Status
```
GET /escrow/status
```
Response:
```json
{
  "message": "Blockchain connection active",
  "backendAddress": "0xf39...",
  "balanceWei": "10000000000000000000",
  "balanceEther": "10.0",
  "factoryAddress": "0x5FbDB..."
}
```

### 2. Create Escrow Agreement
```
POST /escrow/create

Body:
{
  "farmerAddress": "0x70997970...",
  "quantity": 100,
  "produceType": "Tomato",
  "priceInEther": 5.5,
  "deliveryDeadlineDays": 7,
  "penaltyPercent": 10
}

Response:
{
  "message": "Escrow created successfully",
  "escrowAddress": "0x2279B...",
  "txHash": "0x8f5...",
  "status": "Created"
}
```

### 3. Get Escrow Status
```
GET /escrow/:escrowAddress/status

Response:
{
  "message": "Escrow status retrieved",
  "escrowAddress": "0x2279B...",
  "status": "Active",
  "totalPrice": "5500000000000000000",
  "totalPriceEther": "5.5",
  "quantity": "100",
  "produceType": "Tomato",
  "balance": "5500000000000000000",
  "balanceEther": "5.5"
}
```

### 4. Accept Agreement (Farmer)
```
POST /escrow/:escrowAddress/accept

Response:
{
  "message": "Agreement accepted successfully",
  "escrowAddress": "0x2279B...",
  "txHash": "0x8f5...",
  "status": "Active"
}
```

### 5. Deposit Funds (Buyer)
```
POST /escrow/:escrowAddress/deposit

Body:
{
  "amountInEther": 5.5
}

Response:
{
  "message": "Funds deposited successfully",
  "escrowAddress": "0x2279B...",
  "amountEther": 5.5,
  "txHash": "0x8f5...",
  "status": "Funded"
}
```

### 6. Mark as Delivered (Farmer)
```
POST /escrow/:escrowAddress/mark-delivered

Response:
{
  "message": "Marked as delivered successfully",
  "escrowAddress": "0x2279B...",
  "txHash": "0x8f5...",
  "status": "Delivered"
}
```

### 7. Confirm Delivery (Buyer)
```
POST /escrow/:escrowAddress/confirm-delivery

Response:
{
  "message": "Delivery confirmed and funds released to farmer",
  "escrowAddress": "0x2279B...",
  "txHash": "0x8f5...",
  "status": "Completed"
}
```

### 8. Reject Delivery (Buyer)
```
POST /escrow/:escrowAddress/reject-delivery

Body:
{
  "reason": "Quality is poor"
}

Response:
{
  "message": "Delivery rejected and refund initiated with penalty",
  "escrowAddress": "0x2279B...",
  "rejectionReason": "Quality is poor",
  "txHash": "0x8f5...",
  "status": "Rejected"
}
```

---

## 🔐 Key Concepts

### Escrow Status Flow

```
Created → Active → Delivered → Completed
          (buyer funds)      (buyer confirms)

                  ↓ (buyer rejects)
                  Rejected → Refunded

            ↓ (timeout after deadline)
            Refunded
```

### Amount Handling

- Backend converts **Ether to Wei** for blockchain
- Frontend receives **both** Wei and Ether values
- Always use Wei for blockchain transactions
- Display Ether to users

Example:
```javascript
// Input from user
const priceInEther = 5.5;

// Convert to Wei
const priceInWei = blockchainService.etherToWei(priceInEther);  // "5500000000000000000"

// Send to backend
const result = await blockchainService.createEscrow({
  priceInEther: 5.5  // Backend will convert
});

// Response has both
console.log(result.totalPriceEther);  // "5.5"
```

---

## 🧪 Testing with Hardhat Accounts

Hardhat provides 20 pre-funded accounts. Use these for testing:

```javascript
// Account 0 (Backend wallet)
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cadeee4c4b1067f9fbce1f62
Balance: 10000 ETH

// Account 1 (Use as Farmer)
Address: 0x70997970C51812e339D9B73b0245ad59cc793a05
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

// Account 2 (Use as Buyer)
Address: 0x3C44CdDdB6a900c6671B73F3d36ade6d1fF63Af7
Private Key: 0x5de4111afa1a4b94908f83103db48b3706174a5c7a295c75e6742f842a631df5
```

---

## 🐛 Troubleshooting

### Issue: "Blockchain not initialized"
**Solution:** Make sure `FACTORY_ADDRESS` is set in config and contract is deployed.

### Issue: "Cannot read property 'interface' of null"
**Solution:** Factory ABI not loaded. Check `server/config/contracts.json`.

### Issue: Hardhat node not responding
**Solution:** 
```bash
# Kill old process and restart
npx hardhat node --reset
```

### Issue: "Insufficient funds"
**Solution:** Check account balance at `/escrow/status`. Use pre-funded Hardhat accounts.

### Issue: CORS errors from frontend
**Solution:** Make sure backend has correct CORS origins in `index.js`.

---

## 📝 Next Steps

1. **Replace Test Accounts:** Replace hardcoded addresses with actual user addresses from auth system
2. **Store Escrow Data:** Save escrow addresses to MongoDB for user reference
3. **Add UI Indicators:** Show blockchain transaction status (pending, confirmed, etc.)
4. **Implement Polling:** Refresh escrow status periodically or on-demand
5. **Testnet Deployment:** Deploy to Sepolia/Mumbai testnet for real testing
6. **User Wallet Integration:** Consider integrating MetaMask or WalletConnect for user-controlled wallets

---

## 📚 File Documentation

### blockchain.js
Core utilities for blockchain interaction. Exports:
- `createEscrow()` - Create new escrow
- `acceptAgreement()` - Accept agreement
- `depositFunds()` - Deposit payment
- `markAsDelivered()` - Mark delivered
- `confirmDelivery()` - Release funds
- `rejectDelivery()` - Reject & refund
- `getEscrowStatus()` - Get status
- `weiToEther()` / `etherToWei()` - Unit conversion

### blockchainService.js (Frontend)
API wrapper service. Exports methods matching backend endpoints.

### escrow.js (Routes)
Express routes for all escrow operations. All endpoints return consistent JSON format with error handling.

---

## 🎉 You're All Set!

Your blockchain integration is ready to use. Start with the example screens and customize as needed for your app's specific requirements.
