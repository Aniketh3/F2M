# How to Start the Farm2Market Local Ecosystem

Follow these steps to spin up all the required services for local development and testing. Open a separate terminal for each service:

---

## 1. Local Hardhat Node
Spins up the local Ethereum blockchain emulator.
* **Directory**: `fyp-sc-smartcontract`
* **Command**:
  ```bash
  npx hardhat node
  ```

## 2. Deploy Smart Contracts
Deploys the factory contract to the local Hardhat node. Run this once after starting the Hardhat node.
* **Directory**: `fyp-sc-smartcontract`
* **Command**:
  ```bash
  npx hardhat run scripts/deploy.js --network localhost
  ```
  *Note: Make sure the output deployment address matches the `factoryAddress` inside `server/config/contracts.json`.*

## 3. Backend Express Server
Starts the Node.js backend.
* **Directory**: `server`
* **Command**:
  ```bash
  npm start
  ```
  *Note: Uses `nodemon` to automatically restart on backend code changes.*

## 4. Mobile Client Application (Expo)
Starts the React Native development server and clears the cache.
* **Directory**: `client`
* **Command**:
  ```bash
  npx expo start --clear
  ```

---

## 💡 System Funding Utility (Run After Node Restart)
Since local Hardhat node balances are reset on restart, run this script to assign and fund all database users and the backend transaction wallet with **1,000 ETH**:
* **Directory**: `server`
* **Command**:
  ```bash
  node fund_system.js
  ```
