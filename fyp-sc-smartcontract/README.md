The smart contract project is pushed to GitHub on branch smartcontract
Clone the repo: git clone <repo-url> and checkout the branch: git checkout smartcontract
To set up locally:
npm install
Run local Hardhat node in one terminal: npx hardhat node
Deploy contracts in another terminal: npx hardhat run scripts/deploy.js
This deploys the FarmerEscrowFactory — note down the factory address from the console output

To run tests: npx hardhat test
(Currently 2 basic tests are passing for acceptance and deposit)
Important contracts:
FarmerEscrowFactory.sol → main entry point (deploy once)
FarmerEscrow.sol → individual agreement contract (deployed via factory's createEscrow)

Key function to call from frontend (on Factory):
createEscrow(address _farmer, uint256 _totalPrice, uint256 _quantity, string _produceType, uint256 _deliveryDeadline, uint8 _penaltyPercent)
→ returns the new escrow contract address

On the returned escrow address (interact via ethers.js):
acceptAgreement() → farmer calls
depositFunds() → company calls (payable, send exactly _totalPrice)
markAsDelivered() → farmer calls
confirmDelivery() → company calls (releases funds to farmer)
rejectDelivery(string reason) → company calls (refunds with penalty deduction)
claimFundsAfterTimeout() → anyone can call after deadline (handles refund or release)
cancelAgreement() → early cancel if no funds deposited

ABIs are available in:
artifacts/contracts/FarmerEscrowFactory.sol/FarmerEscrowFactory.json → "abi" field
artifacts/contracts/FarmerEscrow.sol/FarmerEscrow.json → "abi" field

Local RPC for testing: http://127.0.0.1:8545
(use one of the Hardhat node accounts as company/farmer for testing)
No testnet deployment yet — you can do it later by adding network config to hardhat.config.js
