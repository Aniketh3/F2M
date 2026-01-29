# Quick Reference - Blockchain Integration

## 🚀 5-Minute Setup

```bash
# Terminal 1: Hardhat Node
cd F2M/fyp-sc-smartcontract
npx hardhat node

# Terminal 2: Deploy (copy factory address)
npx hardhat run scripts/deploy.js

# Terminal 3: Backend
cd F2M/server
npm start
```

Update `server/config/contracts.json` with factory address from Terminal 2.

Test: `curl http://localhost:3000/escrow/status`

---

## 📱 Using in Components

### Import Service
```javascript
import blockchainService from '../services/blockchainService';
```

### Create Escrow
```javascript
const result = await blockchainService.createEscrow({
  farmerAddress: '0x70997970C51812e339D9B73b0245ad59cc793a05',
  quantity: 100,
  produceType: 'Tomato',
  priceInEther: 5.5,
  deliveryDeadlineDays: 7,
  penaltyPercent: 10
});
console.log('Escrow at:', result.escrowAddress);
```

### Accept Agreement
```javascript
const result = await blockchainService.acceptAgreement(escrowAddress);
```

### Deposit Funds
```javascript
const result = await blockchainService.depositFunds(escrowAddress, 5.5);
```

### Mark Delivered
```javascript
const result = await blockchainService.markAsDelivered(escrowAddress);
```

### Confirm Delivery (Release Funds)
```javascript
const result = await blockchainService.confirmDelivery(escrowAddress);
```

### Reject Delivery (Refund)
```javascript
const result = await blockchainService.rejectDelivery(
  escrowAddress, 
  'Poor quality'
);
```

### Get Status
```javascript
const status = await blockchainService.getEscrowStatus(escrowAddress);
console.log(status.status);    // "Active", "Delivered", etc
console.log(status.balanceEther); // "5.5"
```

---

## 🧪 Test Flow

```javascript
// 1. Create escrow (buyer initiates)
const escrow = await blockchainService.createEscrow({...});
// Status: "Created"

// 2. Farmer accepts
await blockchainService.acceptAgreement(escrow.escrowAddress);
// Status: "Active"

// 3. Buyer deposits funds
await blockchainService.depositFunds(escrow.escrowAddress, 5.5);
// Status: "Active" (now funded)

// 4. Farmer delivers
await blockchainService.markAsDelivered(escrow.escrowAddress);
// Status: "Delivered"

// 5. Buyer confirms
await blockchainService.confirmDelivery(escrow.escrowAddress);
// Status: "Completed" ✅ (funds released to farmer)
```

---

## 🔧 Hardhat Test Accounts

```
Acc 0 (Backend): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Acc 1 (Farmer):  0x70997970C51812e339D9B73b0245ad59cc793a05
Acc 2 (Buyer):   0x3C44CdDdB6a900c6671B73F3d36ade6d1fF63Af7
```

Each has 10,000 ETH for testing.

---

## ⚡ Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Factory not initialized" | Update FACTORY_ADDRESS in config |
| "Invalid farmer address" | Use valid Ethereum address (0x...) |
| "Only Farmer can call" | Use farmer's account for farmer operations |
| "Insufficient funds" | Check account balance with `/escrow/status` |
| "Deadline passed" | Use future timestamp for deliveryDeadline |
| CORS error | Update CORS origins in server/index.js |

---

## 📂 Files Reference

| File | Purpose |
|------|---------|
| `server/blockchain.js` | Core blockchain functions |
| `server/routes/escrow.js` | API endpoints |
| `server/config/contracts.json` | Contract ABIs & addresses |
| `client/services/blockchainService.js` | Frontend API wrapper |
| `client/components/BuyerHomeScreenWithBlockchain.js` | Example screen |
| `client/components/OrdersScreenWithBlockchain.js` | Example screen |

---

## 📊 Escrow States

```
Created → Accepted → Funded → Delivered → Confirmed (Completed)
                               ↓
                            Rejected → Refunded
```

---

## 🎯 Next Steps

1. Replace test account addresses with real user addresses from auth
2. Store escrow addresses in MongoDB for user reference
3. Add real-time status polling
4. Deploy to testnet (Sepolia/Mumbai)
5. Add user wallet integration (MetaMask)

---

## 📚 Full Documentation

- See `BLOCKCHAIN_INTEGRATION_GUIDE.md` for complete details
- See `IMPLEMENTATION_SUMMARY.md` for architecture overview
