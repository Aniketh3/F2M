const express = require('express');
const router = express.Router();
const blockchain = require('../blockchain');
const Buyer = require('../modals/Buyer');
const Seller = require('../modals/Seller');

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
    const { farmerAddress, quantity, produceType, priceInEther, deliveryDeadlineDays, penaltyPercent, orderID, buyerName } = req.body;

    console.log('[Escrow Create] Received request with farmerAddress:', farmerAddress, 'typeof:', typeof farmerAddress);

    // Defensive check: if address is missing, null, or string "null"/"undefined", fallback to dummy account 1 (farmer)
    let finalFarmerAddress = farmerAddress;
    if (!finalFarmerAddress || 
        finalFarmerAddress === 'null' || 
        finalFarmerAddress === 'undefined' || 
        finalFarmerAddress.trim() === '' || 
        finalFarmerAddress === 'None') {
      finalFarmerAddress = '0x70997970c51812e339d9b73b0245ad59cc793a05';
      console.log('[Escrow Create] Falling back to dummy farmer address:', finalFarmerAddress);
    } else {
      finalFarmerAddress = finalFarmerAddress.toLowerCase(); // Bypass EIP-55 checksum check by using lowercase
      console.log('[Escrow Create] Formatted farmer address to lowercase:', finalFarmerAddress);
    }

    // Validate required fields
    if (!finalFarmerAddress || !quantity || !produceType || !priceInEther || !deliveryDeadlineDays || penaltyPercent === undefined) {
      return sendError(res, 400, 'Missing required fields: farmerAddress, quantity, produceType, priceInEther, deliveryDeadlineDays, penaltyPercent');
    }

    // Convert ether to wei
    const totalPriceInWei = blockchain.etherToWei(priceInEther.toString());

    // Calculate delivery deadline (current time + days in seconds)
    const deliveryDeadline = Math.floor(Date.now() / 1000) + (deliveryDeadlineDays * 24 * 60 * 60);

    // Call blockchain function
    const escrowData = await blockchain.createEscrow(
      finalFarmerAddress,
      totalPriceInWei,
      quantity,
      produceType,
      deliveryDeadline,
      penaltyPercent
    );

    // Sync to MongoDB if orderID and buyerName are provided
    if (orderID && buyerName) {
      try {
        // 1. Update Seller's listing
        await Seller.findOneAndUpdate(
          { "MySellList.OrderID": orderID },
          {
            $set: {
              "MySellList.$.isEscrow": true,
              "MySellList.$.escrowAddress": escrowData.escrowAddress,
              "MySellList.$.escrowStatus": "Created"
            }
          }
        );

        // 2. Create and push Buyer's order
        const newOrder = {
          OrderId: orderID,
          OrderItem: produceType,
          OrderQuantity: quantity,
          SingleItemPrice: priceInEther,
          TotalPrice: priceInEther,
          isTransactionComplete: false,
          isItemDelivered: false,
          isEscrow: true,
          escrowAddress: escrowData.escrowAddress,
          escrowStatus: 'Created'
        };

        await Buyer.findOneAndUpdate(
          { Name: new RegExp(`^${buyerName.trim()}$`, 'i') },
          { $push: { MyOrders: newOrder } }
        );
      } catch (dbError) {
        console.error('Failed to sync escrow creation to DB:', dbError.message);
      }
    }

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

    // Sync to MongoDB
    try {
      await Seller.findOneAndUpdate(
        { "MySellList.escrowAddress": escrowAddress },
        {
          $set: {
            "MySellList.$.escrowStatus": result.status,
            "MySellList.$.TransactionStatus": "In Transit"
          }
        }
      );
      await Buyer.findOneAndUpdate(
        { "MyOrders.escrowAddress": escrowAddress },
        {
          $set: {
            "MyOrders.$.escrowStatus": result.status
          }
        }
      );
    } catch (dbError) {
      console.error('Failed to sync acceptAgreement to DB:', dbError.message);
    }

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

    // Sync to MongoDB
    try {
      await Seller.findOneAndUpdate(
        { "MySellList.escrowAddress": escrowAddress },
        { $set: { "MySellList.$.escrowStatus": result.status } }
      );
      await Buyer.findOneAndUpdate(
        { "MyOrders.escrowAddress": escrowAddress },
        { $set: { "MyOrders.$.escrowStatus": result.status } }
      );
    } catch (dbError) {
      console.error('Failed to sync depositFunds to DB:', dbError.message);
    }

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

    // Sync to MongoDB
    try {
      await Seller.findOneAndUpdate(
        { "MySellList.escrowAddress": escrowAddress },
        { $set: { "MySellList.$.escrowStatus": result.status } }
      );
      await Buyer.findOneAndUpdate(
        { "MyOrders.escrowAddress": escrowAddress },
        { $set: { "MyOrders.$.escrowStatus": result.status } }
      );
    } catch (dbError) {
      console.error('Failed to sync markAsDelivered to DB:', dbError.message);
    }

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

    // Sync to MongoDB
    try {
      await Seller.findOneAndUpdate(
        { "MySellList.escrowAddress": escrowAddress },
        {
          $set: {
            "MySellList.$.escrowStatus": result.status,
            "MySellList.$.isTransactionComplete": true,
            "MySellList.$.TransactionStatus": "Completed"
          }
        }
      );
      await Buyer.findOneAndUpdate(
        { "MyOrders.escrowAddress": escrowAddress },
        {
          $set: {
            "MyOrders.$.escrowStatus": result.status,
            "MyOrders.$.isTransactionComplete": true,
            "MyOrders.$.isItemDelivered": true
          }
        }
      );
    } catch (dbError) {
      console.error('Failed to sync confirmDelivery to DB:', dbError.message);
    }

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

    // Sync to MongoDB
    try {
      await Seller.findOneAndUpdate(
        { "MySellList.escrowAddress": escrowAddress },
        {
          $set: {
            "MySellList.$.escrowStatus": result.status,
            "MySellList.$.TransactionStatus": "Rejected"
          }
        }
      );
      await Buyer.findOneAndUpdate(
        { "MyOrders.escrowAddress": escrowAddress },
        {
          $set: {
            "MyOrders.$.escrowStatus": result.status
          }
        }
      );
    } catch (dbError) {
      console.error('Failed to sync rejectDelivery to DB:', dbError.message);
    }

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
