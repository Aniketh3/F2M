# Farm2Market — System Architecture & Flow

## High-Level Architecture

```mermaid
graph TB
    subgraph CLIENT["📱 React Native Client (Expo)"]
        direction TB
        HS["Home Screen"]
        BHS["Buyer Home Screen"]
        SHS["Seller Home Screen"]
        OS["Orders Screen"]
        PS["Profile Screen"]
        BS["blockchainService.js"]
    end

    subgraph SERVER["⚙️ Node.js / Express Backend"]
        direction TB
        IDX["index.js (REST API)"]
        ER["routes/escrow.js"]
        BC["blockchain.js"]
        CFG["config/contracts.json"]
    end

    subgraph DB["🗄️ MongoDB Atlas"]
        direction TB
        BuyerCol["Buyers Collection"]
        SellerCol["Sellers Collection"]
        MsgCol["Messages Collection"]
    end

    subgraph CHAIN["⛓️ Ethereum Blockchain (Hardhat Local Node)"]
        direction TB
        FC["FarmerEscrowFactory.sol"]
        EC1["FarmerEscrow #1"]
        EC2["FarmerEscrow #2"]
        ECN["FarmerEscrow #N"]
    end

    CLIENT -->|"HTTP REST API"| SERVER
    SERVER -->|"Mongoose ODM"| DB
    SERVER -->|"ethers.js JSON-RPC"| CHAIN
    FC --> EC1
    FC --> EC2
    FC --> ECN

    style CLIENT fill:#1e293b,stroke:#3b82f6,color:#e2e8f0
    style SERVER fill:#1e293b,stroke:#10b981,color:#e2e8f0
    style DB fill:#1e293b,stroke:#f59e0b,color:#e2e8f0
    style CHAIN fill:#1e293b,stroke:#8b5cf6,color:#e2e8f0
```

---

## Escrow Transaction Lifecycle Flow

```mermaid
sequenceDiagram
    participant B as 👤 Buyer (Mobile App)
    participant S as 🌾 Seller (Mobile App)
    participant API as ⚙️ Express Backend
    participant DB as 🗄️ MongoDB
    participant BC as ⛓️ Blockchain

    Note over B,BC: ── STEP 1: Buyer Creates Escrow ──

    B->>API: POST /escrow/create<br/>{farmerAddress, price, quantity, ...}
    API->>BC: Factory.createEscrow(...)
    BC-->>API: New Escrow Contract Address
    API->>DB: Update Seller.MySellList (isEscrow=true)<br/>Push to Buyer.MyOrders
    API-->>B: ✅ Escrow Created<br/>Status: Created

    Note over B,BC: ── STEP 2: Farmer Accepts Agreement ──

    S->>API: POST /escrow/:addr/accept
    API->>BC: Impersonate farmer address<br/>Escrow.acceptAgreement()
    BC-->>API: TX confirmed
    API->>DB: escrowStatus → Active
    API-->>S: ✅ Agreement Accepted

    Note over B,BC: ── STEP 3: Buyer Deposits Funds ──

    B->>API: POST /escrow/:addr/deposit<br/>{amountInEther}
    API->>BC: Escrow.depositFunds{value: amount}
    BC-->>API: TX confirmed, funds locked
    API->>DB: escrowStatus → Funded
    API-->>B: ✅ Funds Deposited

    Note over B,BC: ── STEP 4: Farmer Marks Delivered ──

    S->>API: POST /escrow/:addr/mark-delivered
    API->>BC: Impersonate farmer<br/>Escrow.markAsDelivered()
    BC-->>API: TX confirmed
    API->>DB: escrowStatus → Delivered
    API-->>S: ✅ Marked as Delivered

    Note over B,BC: ── STEP 5: Buyer Confirms or Rejects ──

    alt Buyer Confirms Quality
        B->>API: POST /escrow/:addr/confirm-delivery
        API->>BC: Escrow.confirmDelivery()<br/>Funds released to farmer
        BC-->>API: TX confirmed
        API->>DB: escrowStatus → Completed<br/>isTransactionComplete = true
        API-->>B: ✅ Funds Released to Farmer
    else Buyer Rejects Quality
        B->>API: POST /escrow/:addr/reject-delivery
        API->>BC: Escrow.rejectDelivery(reason)<br/>Refund minus penalty
        BC-->>API: TX confirmed
        API->>DB: escrowStatus → Rejected
        API-->>B: ⚠️ Refund Processed
    end
```

---

## Data Flow Between Layers

```mermaid
flowchart LR
    subgraph MOBILE["📱 Mobile App"]
        UI["React Native UI"]
        SVC["blockchainService.js"]
        ENV[".env<br/>EXPO_PUBLIC_API_URL"]
    end

    subgraph BACKEND["⚙️ Express Server"]
        REST["REST Routes<br/>/escrow/*<br/>/profile<br/>/market-view"]
        BLK["blockchain.js<br/>ethers.js Wallet"]
        MODELS["Mongoose Models<br/>Buyer.js / Seller.js"]
    end

    subgraph STORAGE["💾 Persistence"]
        MONGO[("MongoDB Atlas<br/>Cloud Database")]
        HARDHAT[("Hardhat Node<br/>Local Blockchain<br/>127.0.0.1:8545")]
    end

    UI -->|"User taps Buy / Accept / Deposit"| SVC
    SVC -->|"axios HTTP"| REST
    ENV -.->|"API_URL config"| SVC
    REST -->|"CRUD operations"| MODELS
    REST -->|"Escrow actions"| BLK
    MODELS -->|"read/write"| MONGO
    BLK -->|"JSON-RPC<br/>eth_sendRawTransaction"| HARDHAT

    style MOBILE fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
    style BACKEND fill:#0f172a,stroke:#10b981,color:#e2e8f0
    style STORAGE fill:#0f172a,stroke:#f59e0b,color:#e2e8f0
```

---

## Smart Contract Hierarchy

```mermaid
classDiagram
    class FarmerEscrowFactory {
        +address[] allEscrows
        +createEscrow(farmer, totalPrice, quantity, produceType, deadline, penalty) address
        +getEscrowCount() uint256
        +getEscrowAtIndex(index) address
        +getAllEscrows() address[]
        &lt;&lt;event&gt;&gt; EscrowCreated(escrowAddress, company, farmer, totalPrice)
    }

    class FarmerEscrow {
        +address farmer
        +address company
        +uint256 totalPrice
        +uint256 quantity
        +string produceType
        +uint256 deliveryDeadline
        +uint8 penaltyPercent
        +AgreementStatus status
        +acceptAgreement()
        +depositFunds()
        +markAsDelivered()
        +confirmDelivery()
        +rejectDelivery(reason)
        +cancelAgreement()
        +claimFundsAfterTimeout()
        +getCurrentStatus() AgreementStatus
        +getContractBalance() uint256
        +getRemainingTime() uint256
    }

    class AgreementStatus {
        &lt;&lt;enum&gt;&gt;
        Created
        Active
        Delivered
        Completed
        Rejected
        Refunded
        Cancelled
    }

    FarmerEscrowFactory "1" --> "*" FarmerEscrow : deploys
    FarmerEscrow --> AgreementStatus : uses
```

---

## Escrow State Machine

```mermaid
stateDiagram-v2
    [*] --> Created: Factory.createEscrow()

    Created --> Active: Farmer calls<br/>acceptAgreement()
    Created --> Cancelled: cancelAgreement()<br/>(no funds deposited)

    Active --> Active: Buyer calls<br/>depositFunds()<br/>(funds locked)
    Active --> Delivered: Farmer calls<br/>markAsDelivered()
    Active --> Refunded: claimFundsAfterTimeout()<br/>(deadline passed)
    Active --> Cancelled: cancelAgreement()<br/>(no funds deposited)

    Delivered --> Completed: Buyer calls<br/>confirmDelivery()<br/>💰 Funds → Farmer
    Delivered --> Rejected: Buyer calls<br/>rejectDelivery(reason)<br/>💸 Refund − Penalty

    Completed --> [*]
    Rejected --> [*]
    Refunded --> [*]
    Cancelled --> [*]
```
