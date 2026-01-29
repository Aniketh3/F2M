import axios from 'axios';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Backend API base URL - update this based on your backend server location
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/escrow`,
  timeout: 30000, // 30 second timeout for blockchain transactions
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Extract error message from axios error
 */
const getErrorMessage = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// ============================================================================
// BLOCKCHAIN SERVICE - ESCROW OPERATIONS
// ============================================================================

const blockchainService = {
  /**
   * Check blockchain connection status and get backend balance
   * @returns {Promise<{balanceEther, backendAddress, factoryAddress}>}
   */
  async getBlockchainStatus() {
    try {
      const response = await apiClient.get('/status');
      return response.data;
    } catch (error) {
      throw new Error(`Blockchain status check failed: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Create a new escrow agreement
   * @param {object} escrowData - {
   *   farmerAddress: string,
   *   quantity: number,
   *   produceType: string,
   *   priceInEther: number,
   *   deliveryDeadlineDays: number,
   *   penaltyPercent: number
   * }
   * @returns {Promise<{escrowAddress, txHash, status}>}
   */
  async createEscrow(escrowData) {
    try {
      const response = await apiClient.post('/create', escrowData);
      return response.data;
    } catch (error) {
      throw new Error(`Create escrow failed: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Get status and details of a specific escrow
   * @param {string} escrowAddress - Address of the escrow contract
   * @returns {Promise<{status, totalPrice, quantity, produceType, ...}>}
   */
  async getEscrowStatus(escrowAddress) {
    try {
      const response = await apiClient.get(`/${escrowAddress}/status`);
      return response.data;
    } catch (error) {
      throw new Error(`Fetch escrow status failed: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Farmer accepts the escrow agreement
   * @param {string} escrowAddress - Address of the escrow contract
   * @returns {Promise<{txHash, status}>}
   */
  async acceptAgreement(escrowAddress) {
    try {
      const response = await apiClient.post(`/${escrowAddress}/accept`, {});
      return response.data;
    } catch (error) {
      throw new Error(`Accept agreement failed: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Buyer deposits funds into escrow
   * @param {string} escrowAddress - Address of the escrow contract
   * @param {number} amountInEther - Amount to deposit in ether
   * @returns {Promise<{txHash, status}>}
   */
  async depositFunds(escrowAddress, amountInEther) {
    try {
      const response = await apiClient.post(`/${escrowAddress}/deposit`, {
        amountInEther,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Deposit funds failed: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Farmer marks produce as delivered
   * @param {string} escrowAddress - Address of the escrow contract
   * @returns {Promise<{txHash, status}>}
   */
  async markAsDelivered(escrowAddress) {
    try {
      const response = await apiClient.post(`/${escrowAddress}/mark-delivered`, {});
      return response.data;
    } catch (error) {
      throw new Error(`Mark as delivered failed: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Buyer confirms delivery (releases funds to farmer)
   * @param {string} escrowAddress - Address of the escrow contract
   * @returns {Promise<{txHash, status}>}
   */
  async confirmDelivery(escrowAddress) {
    try {
      const response = await apiClient.post(`/${escrowAddress}/confirm-delivery`, {});
      return response.data;
    } catch (error) {
      throw new Error(`Confirm delivery failed: ${getErrorMessage(error)}`);
    }
  },

  /**
   * Buyer rejects delivery and initiates refund
   * @param {string} escrowAddress - Address of the escrow contract
   * @param {string} reason - Reason for rejection
   * @returns {Promise<{txHash, status}>}
   */
  async rejectDelivery(escrowAddress, reason) {
    try {
      const response = await apiClient.post(`/${escrowAddress}/reject-delivery`, {
        reason,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Reject delivery failed: ${getErrorMessage(error)}`);
    }
  },
};

export default blockchainService;
