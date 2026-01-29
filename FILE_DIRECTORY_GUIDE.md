# F2M Blockchain Integration - File Directory Guide

## 📁 Project Structure

```
F2M/
│
├── 📄 BLOCKCHAIN_INTEGRATION_GUIDE.md ⭐
│   └─ Complete setup and API documentation
│
├── 📄 IMPLEMENTATION_SUMMARY.md ⭐
│   └─ Overview of what was implemented
│
├── 📄 QUICK_REFERENCE.md ⭐
│   └─ Quick code examples and commands
│
├── 📄 IMPLEMENTATION_CHECKLIST.md ⭐
│   └─ Checklist of what's done and next steps
│
├── 📄 README.md (original project)
│
├── fyp-sc-smartcontract/
│   ├── contracts/
│   │   ├── FarmerEscrow.sol
│   │   └── FarmerEscrowFactory.sol
│   ├── scripts/
│   │   ├── deploy.js (RUN THIS: npx hardhat run scripts/deploy.js)
│   │   └── deployFactory.js
│   ├── test/
│   │   ├── FarmerEscrow.test.js
│   │   └── FarmerEscrowFactory.test.js
│   ├── hardhat.config.js
│   └── package.json
│
├── server/
│   │
│   ├── 📄 blockchain.js ⭐ (NEW)
│   │   └─ Core blockchain utilities using ethers.js
│   │   └─ Exports: createEscrow, acceptAgreement, depositFunds, etc.
│   │
│   ├── 📁 routes/
│   │   └── 📄 escrow.js ⭐ (NEW)
│   │       └─ 8 REST API endpoints for escrow operations
│   │       └─ GET /status, POST /create, /deposit, etc.
│   │
│   ├── 📁 config/
│   │   └── 📄 contracts.json ⭐ (NEW)
│   │       └─ Factory ABI, Escrow ABI, contract addresses
│   │
│   ├── 📄 index.js (MODIFIED)
│   │   └─ Added escrow routes import and mounting
│   │
│   ├── blockchain.js (REPLACED - see above)
│   │
│   ├── 📁 modals/
│   │   ├── Buyer.js
│   │   └── Seller.js
│   │
│   ├── .env (CREATE THIS)
│   │   ├─ FACTORY_ADDRESS=0x5FbDB... (from deploy output)
│   │   ├─ RPC_URL=http://127.0.0.1:8545
│   │   └─ PRIVATE_KEY=0xac0974... (or keep default)
│   │
│   └── package.json
│
└── client/
    │
    ├── 📁 services/
    │   └── 📄 blockchainService.js ⭐ (NEW)
    │       └─ Axios-based API wrapper for blockchain calls
    │       └─ Methods: createEscrow, deposit, confirmDelivery, etc.
    │
    ├── 📁 components/
    │   ├── 📄 BuyerHomeScreenWithBlockchain.js ⭐ (NEW EXAMPLE)
    │   │   └─ Enhanced buyer home with escrow creation
    │   │   └─ Can replace BuyerHomeScreen.js
    │   │
    │   ├── 📄 OrdersScreenWithBlockchain.js ⭐ (NEW EXAMPLE)
    │   │   └─ Enhanced orders screen with escrow management
    │   │   └─ Can replace OrdersScreen.js
    │   │
    │   ├── BuyerHomeScreen.js (original)
    │   ├── OrdersScreen.js (original)
    │   ├── BidsScreen.js
    │   ├── ProfileScreen.js
    │   ├── SellerHomeScreen.js
    │   ├── BuyerLoginScreen.js
    │   ├── SellerLoginScreen.js
    │   ├── BuyerRegisterScreen.js
    │   └── SellerRegisterScreen.js
    │
    ├── App.js
    │   └─ Update Tab.Screen components to use WithBlockchain versions
    │
    ├── app.json
    ├── babel.config.js
    ├── package.json
    │
    └── 📁 assets/
        └── logo.jpeg, etc.
```

---

## 🎯 Key Files Explained

### ⭐ Backend Files

#### `server/blockchain.js`
**What:** Core module for all blockchain interactions
**Exports:** 
- `createEscrow()` - Deploy new escrow
- `acceptAgreement()` - Farmer accepts
- `depositFunds()` - Buyer deposits
- `markAsDelivered()` - Farmer delivers
- `confirmDelivery()` - Buyer confirms
- `rejectDelivery()` - Buyer rejects
- `getEscrowStatus()` - Get status
- `getBackendBalance()` - Check balance
- `weiToEther()` / `etherToWei()` - Unit conversion

**Usage:**
```javascript
const blockchain = require('./blockchain');
const escrow = await blockchain.createEscrow(...);
```

---

#### `server/routes/escrow.js`
**What:** Express routes that handle blockchain requests
**Endpoints:**
```
GET    /escrow/status
POST   /escrow/create
GET    /escrow/:addr/status
POST   /escrow/:addr/accept
POST   /escrow/:addr/deposit
POST   /escrow/:addr/mark-delivered
POST   /escrow/:addr/confirm-delivery
POST   /escrow/:addr/reject-delivery
```

**Input/Output:** Converts between HTTP and blockchain format

---

#### `server/config/contracts.json`
**What:** Contract configuration file
**Contains:**
```json
{
  "factoryAddress": "0x5FbDB...",  // ← UPDATE THIS after deploy
  "factoryAbi": [...],              // Factory contract ABI
  "escrowAbi": [...]                // Escrow contract ABI
}
```

**Update after running:** `npx hardhat run scripts/deploy.js`

---

#### `server/index.js`
**Changes:**
```javascript
// Added at top:
const escrowRoutes = require('./routes/escrow')

// Added in app setup (before app.listen):
app.use('/escrow', escrowRoutes);
```

---

### ⭐ Frontend Files

#### `client/services/blockchainService.js`
**What:** API wrapper for blockchain calls
**Methods:**
```javascript
blockchainService.getBlockchainStatus()
blockchainService.createEscrow(data)
blockchainService.getEscrowStatus(addr)
blockchainService.acceptAgreement(addr)
blockchainService.depositFunds(addr, amount)
blockchainService.markAsDelivered(addr)
blockchainService.confirmDelivery(addr)
blockchainService.rejectDelivery(addr, reason)
```

**Usage:**
```javascript
import blockchainService from '../services/blockchainService';
const result = await blockchainService.createEscrow({...});
```

---

#### `client/components/BuyerHomeScreenWithBlockchain.js`
**What:** Example buyer home screen with blockchain integration
**Features:**
- Marketplace display (original)
- Blockchain status indicator
- Escrow creation form for each product
- Error handling and loading states

**To Use:**
Replace original `BuyerHomeScreen` in `App.js`

---

#### `client/components/OrdersScreenWithBlockchain.js`
**What:** Example orders screen with blockchain integration
**Features:**
- Original order form (preserved)
- Escrow agreements section
- Farmer & buyer actions
- Status checking

**To Use:**
Replace original `OrdersScreen` in `App.js`

---

## 📋 What Each File Does

### Smart Contracts (Solidity)
```
FarmerEscrow.sol         - Individual escrow contract for each agreement
FarmerEscrowFactory.sol  - Factory to deploy FarmerEscrow contracts
```

### Backend (Node.js)
```
blockchain.js      - Interface to smart contracts (ethers.js)
routes/escrow.js   - HTTP API endpoints
config/contracts.json - Contract ABIs and addresses
index.js           - Express app setup
```

### Frontend (React Native)
```
blockchainService.js - API client (calls backend)
[Screens]WithBlockchain.js - Example UI components
```

---

## 🔗 Data Flow

```
User Action (Frontend)
    ↓
blockchainService.METHOD()
    ↓ HTTP POST/GET
server/routes/escrow.js endpoint
    ↓
blockchain.js function
    ↓ ethers.js
Smart Contract on Hardhat Node
    ↓ JSON-RPC
Response with tx hash & status
    ↓ HTTP
Frontend displays success/error
```

---

## 📖 Documentation Files

| File | Purpose | Read When |
|------|---------|-----------|
| `QUICK_REFERENCE.md` | Code snippets & quick setup | Need quick answer |
| `BLOCKCHAIN_INTEGRATION_GUIDE.md` | Complete setup & API docs | Setting up for first time |
| `IMPLEMENTATION_SUMMARY.md` | What was implemented | Understanding architecture |
| `IMPLEMENTATION_CHECKLIST.md` | Checklist of what's done | Tracking progress |

---

## 🚀 Quick Navigation

**I want to...**

| Goal | Go To | File |
|------|-------|------|
| Set up everything | Start here → | QUICK_REFERENCE.md |
| Understand architecture | Read this → | IMPLEMENTATION_SUMMARY.md |
| See all API endpoints | Check → | BLOCKCHAIN_INTEGRATION_GUIDE.md |
| Use in my component | Copy code from → | QUICK_REFERENCE.md |
| Find a function | Look in → | server/blockchain.js |
| Check integration status | Review → | IMPLEMENTATION_CHECKLIST.md |
| Fix an error | Search → | BLOCKCHAIN_INTEGRATION_GUIDE.md |

---

## ✅ Before You Start

1. ✅ Read: `QUICK_REFERENCE.md` (5 min)
2. ✅ Read: `IMPLEMENTATION_SUMMARY.md` (10 min)
3. ✅ Read: This file (you're reading it now!)
4. ✅ Run: Deploy script + start servers
5. ✅ Test: API endpoints
6. ✅ Integrate: Use example screens or adapt code
7. ✅ Test: Frontend blockchain operations

---

## 💡 Tips

- **Hardhat addresses** - All accounts have 10,000 ETH for testing
- **Factory address** - Get from deploy script output, put in config
- **Wei values** - Always use wei for blockchain, display ether to users
- **Errors** - Check blockchain status first if something fails
- **Screens** - Use example screens as templates, customize as needed

---

## 🎯 Status

All files created ✅
All integrations implemented ✅
Ready for testing ✅
Documentation complete ✅

**Next step:** Run the Quick Start guide!
