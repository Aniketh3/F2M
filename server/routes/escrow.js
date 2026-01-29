const express = require('express');
const router = express.Router();
const blockchain = require('../blockchain');

// ============================================================================
// HELPER FUNCTION - Error Response
// ============================================================================

const sendError = (res, statusCode, message) => {
  console.error(`[Error ${statusCode}] ${message}`);
  res.status(statusCode).json({ error: message });
};

// ============================================================================
// BLOCKCHAIN STATUS ENDPOINT
// ============================================================================

/**
 * GET /escrow/status
 * Get overall blockchain status and backend balance
 */
router.get('/status', async (req, res) => {
  try {
    const balance = await blockchain.getBackendBalance();
    const balanceInEther = blockchain.weiToEther(balance);

    res.status(200).json({
      message: 'Blockchain connection active',
      backendAddress: blockchain.backendWallet.address,
      balanceWei: balance,
      balanceEther: balanceInEther,
      rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
      factoryAddress: process.env.FACTORY_ADDRESS || 'Not configured'
    });
  } catch (error) {
    sendError(res, 500, `Failed to fetch blockchain status: ${error.message}`);
  }
});

// ============================================================================
// CREATE ESCROW
// ============================================================================

/**
 * POST /escrow/create
 * Create a new escrow agreement
 * 
 * Body:
 * {
 *   "farmerAddress": "0x...",
 *   "quantity": 100,
 *   "produceType": "Tomato",
 *   "priceInEther": 5.5,
 *   "deliveryDeadlineDays": 7,
 *   "penaltyPercent": 10
 * }
 */
router.post('/create', async (req, res) => {
  try {
    const { farmerAddress, quantity, produceType, priceInEther, deliveryDeadlineDays, penaltyPercent } = req.body;

    // Validate required fields
    if (!farmerAddress || !quantity || !produceType || !priceInEther || !deliveryDeadlineDays || penaltyPercent === undefined) {
      return sendError(res, 400, 'Missing required fields: farmerAddress, quantity, produceType, priceInEther, deliveryDeadlineDays, penaltyPercent');
    }

    // Convert ether to wei
    const totalPriceInWei = blockchain.etherToWei(priceInEther.toString());

    // Calculate delivery deadline (current time + days in seconds)
    const deliveryDeadline = Math.floor(Date.now() / 1000) + (deliveryDeadlineDays * 24 * 60 * 60);

    // Call blockchain function
    const escrowData = await blockchain.createEscrow(
      farmerAddress,
      totalPriceInWei,
      quantity,
      produceType,
      deliveryDeadline,
      penaltyPercent
    );

    res.status(201).json({
      message: 'Escrow created successfully',
      ...escrowData,
      totalPriceEther: priceInEther,
      deliveryDeadline,
      deliveryDeadlineDate: new Date(deliveryDeadline * 1000).toISOString()
    });
  } catch (error) {
    sendError(res, 500, `Failed to create escrow: ${error.message}`);
  }
});

// ============================================================================
// GET ESCROW STATUS
// ============================================================================

/**
 * GET /escrow/:escrowAddress/status
 * Get status and details of a specific escrow
 */
router.get('/:escrowAddress/status', async (req, res) => {
  try {
    const { escrowAddress } = req.params;

    const escrowStatus = await blockchain.getEscrowStatus(escrowAddress);

    // Convert wei values to ether for readability
    res.status(200).json({
      message: 'Escrow status retrieved',
      escrowAddress,
      ...escrowStatus,
      totalPriceEther: blockchain.weiToEther(escrowStatus.totalPrice),
      balanceEther: blockchain.weiToEther(escrowStatus.balance)
    });
  } catch (error) {
    sendError(res, 400, `Failed to fetch escrow status: ${error.message}`);
  }
});

// ============================================================================
// ACCEPT AGREEMENT
// ============================================================================

/**
 * POST /escrow/:escrowAddress/accept
 * Farmer accepts the escrow agreement
 */
router.post('/:escrowAddress/accept', async (req, res) => {
  try {
    const { escrowAddress } = req.params;

    const result = await blockchain.acceptAgreement(escrowAddress);

    res.status(200).json({
      message: 'Agreement accepted successfully',
      escrowAddress,
      ...result
    });
  } catch (error) {
    sendError(res, 400, `Failed to accept agreement: ${error.message}`);
  }
});

// ============================================================================
// DEPOSIT FUNDS
// ============================================================================

/**
 * POST /escrow/:escrowAddress/deposit
 * Buyer deposits funds into escrow
 * 
 * Body:
 * {
 *   "amountInEther": 5.5
 * }
 */
router.post('/:escrowAddress/deposit', async (req, res) => {
  try {
    const { escrowAddress } = req.params;
    const { amountInEther } = req.body;

    if (!amountInEther) {
      return sendError(res, 400, 'Missing required field: amountInEther');
    }

    // Convert ether to wei
    const amountInWei = blockchain.etherToWei(amountInEther.toString());

    const result = await blockchain.depositFunds(escrowAddress, amountInWei);

    res.status(200).json({
      message: 'Funds deposited successfully',
      escrowAddress,
      amountEther: amountInEther,
      ...result
    });
  } catch (error) {
    sendError(res, 400, `Failed to deposit funds: ${error.message}`);
  }
});

// ============================================================================
// MARK AS DELIVERED
// ============================================================================

/**
 * POST /escrow/:escrowAddress/mark-delivered
 * Farmer marks produce as delivered
 */
router.post('/:escrowAddress/mark-delivered', async (req, res) => {
  try {
    const { escrowAddress } = req.params;

    const result = await blockchain.markAsDelivered(escrowAddress);

    res.status(200).json({
      message: 'Marked as delivered successfully',
      escrowAddress,
      ...result
    });
  } catch (error) {
    sendError(res, 400, `Failed to mark as delivered: ${error.message}`);
  }
});

// ============================================================================
// CONFIRM DELIVERY
// ============================================================================

/**
 * POST /escrow/:escrowAddress/confirm-delivery
 * Buyer confirms delivery and releases funds to farmer
 */
router.post('/:escrowAddress/confirm-delivery', async (req, res) => {
  try {
    const { escrowAddress } = req.params;

    const result = await blockchain.confirmDelivery(escrowAddress);

    res.status(200).json({
      message: 'Delivery confirmed and funds released to farmer',
      escrowAddress,
      ...result
    });
  } catch (error) {
    sendError(res, 400, `Failed to confirm delivery: ${error.message}`);
  }
});

// ============================================================================
// REJECT DELIVERY
// ============================================================================

/**
 * POST /escrow/:escrowAddress/reject-delivery
 * Buyer rejects delivery and initiates refund with penalty
 * 
 * Body:
 * {
 *   "reason": "Quality is poor"
 * }
 */
router.post('/:escrowAddress/reject-delivery', async (req, res) => {
  try {
    const { escrowAddress } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return sendError(res, 400, 'Missing required field: reason');
    }

    const result = await blockchain.rejectDelivery(escrowAddress, reason);

    res.status(200).json({
      message: 'Delivery rejected and refund initiated with penalty',
      escrowAddress,
      rejectionReason: reason,
      ...result
    });
  } catch (error) {
    sendError(res, 400, `Failed to reject delivery: ${error.message}`);
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
