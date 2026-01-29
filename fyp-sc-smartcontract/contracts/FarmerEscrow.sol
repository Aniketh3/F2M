// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // optional, add later if needed

contract FarmerEscrow {
    // ────────────────────────────────────────────────────────────────
    // Enums
    // ────────────────────────────────────────────────────────────────
    enum AgreementStatus {
        Created,           // just created, not yet accepted/funded
        Active,            // accepted and funded
        Delivered,         // farmer marked as delivered
        Completed,         // buyer confirmed good quality & on time
        Rejected,          // buyer rejected quality
        Refunded,          // funds returned to buyer (timeout/reject/cancel)
        Cancelled          // mutual cancellation
    }

    // ────────────────────────────────────────────────────────────────
    // State Variables
    // ────────────────────────────────────────────────────────────────
    address public immutable farmer;
    address public immutable company;
    uint256 public immutable totalPrice;
    uint256 public immutable quantity;
    string public produceType;                // removed immutable (not allowed for strings)
    uint256 public immutable deliveryDeadline;
    uint8 public immutable penaltyPercent;    // 5 = 5%, max usually 20-30

    AgreementStatus public status;
    uint256 public deliveredTimestamp;        // when farmer marked delivered

    // ────────────────────────────────────────────────────────────────
    // Events
    // ────────────────────────────────────────────────────────────────
    event AgreementCreated(address indexed farmer, address indexed company, uint256 totalPrice);
    event AgreementAccepted();
    event FundsDeposited(uint256 amount);
    event MarkedAsDelivered(uint256 timestamp);
    event ConfirmedByBuyer();
    event RejectedByBuyer(string reason);
    event FundsReleasedToFarmer(uint256 amount);
    event RefundedToCompany(uint256 amount);
    event AgreementCancelled();

    // ────────────────────────────────────────────────────────────────
    // Errors (custom errors - cheaper than strings)
    // ────────────────────────────────────────────────────────────────
    error OnlyFarmer();
    error OnlyCompany();
    error InvalidStatus();
    error NotYetFunded();
    error DeadlinePassed();
    error AlreadyDelivered();
    error NoFundsToRelease();
    error InsufficientPenaltyCalculation();

    // ────────────────────────────────────────────────────────────────
    // Constructor
    // ────────────────────────────────────────────────────────────────
    constructor(
        address _farmer,
        address _company,
        uint256 _totalPrice,
        uint256 _quantity,
        string memory _produceType,
        uint256 _deliveryDeadline,
        uint8 _penaltyPercent
    ) {
        farmer = _farmer;
        company = _company; // company creates & funds
        totalPrice = _totalPrice;
        quantity = _quantity;
        produceType = _produceType;
        deliveryDeadline = _deliveryDeadline;
        penaltyPercent = _penaltyPercent;

        status = AgreementStatus.Created;

        emit AgreementCreated(_farmer, msg.sender, _totalPrice);
    }

    // ---------------------------------------------------------------------
    // MODIFIERS
    // ---------------------------------------------------------------------
    modifier onlyFarmer() {
        if (msg.sender != farmer) revert OnlyFarmer();
        _;
    }

    modifier onlyCompany() {
        if (msg.sender != company) revert OnlyCompany();
        _;
    }

    modifier inStatus(AgreementStatus requiredStatus) {
        if (status != requiredStatus) revert InvalidStatus();
        _;
    }

    modifier notInStatus(AgreementStatus forbiddenStatus) {
        if (status == forbiddenStatus) revert InvalidStatus();
        _;
    }

    // ---------------------------------------------------------------------
    // RECEIVE FUNCTION - allow direct ETH send (optional but useful)
    // ---------------------------------------------------------------------
    receive() external payable {
        // Optional: we can restrict who can send ETH directly
        // For now we allow anyone (but only company should fund)
        // You can tighten it later
    }

    // ---------------------------------------------------------------------
    // ACCEPT AGREEMENT - called by farmer
    // ---------------------------------------------------------------------
    function acceptAgreement()
        external
        onlyFarmer
        inStatus(AgreementStatus.Created)
    {
        status = AgreementStatus.Active;
        emit AgreementAccepted();
    }

    // ---------------------------------------------------------------------
    // DEPOSIT FUNDS - called by company to lock the payment
    // ---------------------------------------------------------------------
    function depositFunds()
        external
        payable
        onlyCompany
        inStatus(AgreementStatus.Active)
    {
        if (msg.value != totalPrice) revert("Incorrect amount");
        emit FundsDeposited(msg.value);
    }

    // ---------------------------------------------------------------------
    // MARK AS DELIVERED - called by farmer after delivery
    // ---------------------------------------------------------------------
    function markAsDelivered()
        external
        onlyFarmer
        inStatus(AgreementStatus.Active)
    {
        if (block.timestamp > deliveryDeadline) revert DeadlinePassed();
        status = AgreementStatus.Delivered;
        deliveredTimestamp = block.timestamp;
        emit MarkedAsDelivered(block.timestamp);
    }

    // ---------------------------------------------------------------------
    // CONFIRM DELIVERY - called by company after checking produce
    // ---------------------------------------------------------------------
    function confirmDelivery()
        external
        onlyCompany
        inStatus(AgreementStatus.Delivered)
    {
        status = AgreementStatus.Completed;

        uint256 amount = address(this).balance;
        (bool success, ) = farmer.call{value: amount}("");
        require(success, "Transfer to farmer failed");

        emit ConfirmedByBuyer();
        emit FundsReleasedToFarmer(amount);
    }

    // ---------------------------------------------------------------------
    // REJECT DELIVERY - called by company if quality is bad
    // ---------------------------------------------------------------------
    function rejectDelivery(string calldata reason)
        external
        onlyCompany
        inStatus(AgreementStatus.Delivered)
    {
        status = AgreementStatus.Rejected;

        uint256 penalty = (totalPrice * penaltyPercent) / 100;
        uint256 refundAmount = address(this).balance - penalty;

        (bool success, ) = company.call{value: refundAmount}("");
        require(success, "Refund to company failed");

        emit RejectedByBuyer(reason);
        emit RefundedToCompany(refundAmount);
    }

    // ---------------------------------------------------------------------
    // CLAIM FUNDS AFTER TIMEOUT - safety net for unresolved cases
    // ---------------------------------------------------------------------
    function claimFundsAfterTimeout()
        external
    {
        if (status != AgreementStatus.Active && status != AgreementStatus.Delivered) revert InvalidStatus();

        uint256 currentBalance = address(this).balance;
        if (currentBalance == 0) revert NoFundsToRelease();

        if (block.timestamp <= deliveryDeadline) revert("Deadline not passed");

        // Case 1: Active but deadline passed (no delivery marked)
        if (status == AgreementStatus.Active) {
            uint256 penalty = (totalPrice * penaltyPercent) / 100;
            uint256 refundAmount = currentBalance - penalty;

            status = AgreementStatus.Refunded;

            (bool success, ) = company.call{value: refundAmount}("");
            require(success, "Refund failed");

            emit RefundedToCompany(refundAmount);
        }
        // Case 2: Delivered but company never confirmed/rejected
        else if (status == AgreementStatus.Delivered) {
            status = AgreementStatus.Completed;

            (bool success, ) = farmer.call{value: currentBalance}("");
            require(success, "Transfer to farmer failed");

            emit FundsReleasedToFarmer(currentBalance);
        }
    }

    // ---------------------------------------------------------------------
    // CANCEL AGREEMENT - early stage mutual cancel (only when not funded yet)
    // ---------------------------------------------------------------------
    function cancelAgreement()
        external
    {
        if (status != AgreementStatus.Created && status != AgreementStatus.Active) revert InvalidStatus();

        if (address(this).balance > 0) revert("Funds already deposited");

        status = AgreementStatus.Cancelled;
        emit AgreementCancelled();
    }

    // ---------------------------------------------------------------------
    // VIEW / HELPER FUNCTIONS
    // ---------------------------------------------------------------------
    function getCurrentStatus()
        external
        view
        returns (AgreementStatus)
    {
        return status;
    }

    function getRemainingTime()
        external
        view
        returns (uint256)
    {
        if (block.timestamp >= deliveryDeadline) {
            return 0;
        }
        return deliveryDeadline - block.timestamp;
    }

    function calculatePenaltyAmount()
        external
        view
        returns (uint256)
    {
        return (totalPrice * penaltyPercent) / 100;
    }

    function getContractBalance()
        external
        view
        returns (uint256)
    {
        return address(this).balance;
    }
}