package com.f2m.blockchain.service;

import com.f2m.blockchain.model.Block;
import com.f2m.blockchain.model.EscrowAgreement;
import com.f2m.blockchain.repository.BlockRepository;
import com.f2m.blockchain.repository.EscrowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Core blockchain service that manages the chain of blocks
 * and escrow agreement state transitions.
 * 
 * Every escrow operation (create, accept, deliver, confirm, reject)
 * adds a new block to the chain, making the history immutable.
 */
@Service
public class BlockchainService {

    @Autowired
    private BlockRepository blockRepository;

    @Autowired
    private EscrowRepository escrowRepository;

    // ═══════════════════════════════════════════════════════════════
    // BLOCKCHAIN OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * On startup, create the genesis block if the chain is empty.
     */
    @PostConstruct
    public void initializeChain() {
        if (blockRepository.count() == 0) {
            Block genesis = new Block(0, "GENESIS", "0", "Farm2Market Blockchain Initialized", "0");
            blockRepository.save(genesis);
            System.out.println("✅ Genesis block created: " + genesis.getHash());
        } else {
            System.out.println("✅ Blockchain loaded with " + blockRepository.count() + " blocks");
        }
    }

    /**
     * Add a new block to the chain.
     */
    public Block addBlock(String action, String escrowId, String details) {
        Block lastBlock = getLastBlock();
        int newIndex = lastBlock.getIndex() + 1;
        Block newBlock = new Block(newIndex, action, escrowId, details, lastBlock.getHash());
        blockRepository.save(newBlock);
        System.out.println("⛓️  Block #" + newIndex + " added: " + action + " | " + escrowId);
        return newBlock;
    }

    /**
     * Get the last block in the chain.
     */
    public Block getLastBlock() {
        return blockRepository.findTopByOrderByIndexDesc()
                .orElseThrow(() -> new RuntimeException("Blockchain is empty!"));
    }

    /**
     * Get the entire chain in order.
     */
    public List<Block> getFullChain() {
        return blockRepository.findAllByOrderByIndexAsc();
    }

    /**
     * Get all blocks related to a specific escrow.
     */
    public List<Block> getBlocksForEscrow(String escrowId) {
        return blockRepository.findByEscrowIdOrderByIndexAsc(escrowId);
    }

    /**
     * Validate the entire blockchain integrity.
     * Checks that:
     *  1. Each block's hash matches its recalculated hash
     *  2. Each block's previousHash matches the prior block's hash
     */
    public Map<String, Object> validateChain() {
        List<Block> chain = getFullChain();
        Map<String, Object> result = new HashMap<>();
        result.put("totalBlocks", chain.size());

        for (int i = 1; i < chain.size(); i++) {
            Block current = chain.get(i);
            Block previous = chain.get(i - 1);

            // Check 1: current block's hash is valid
            if (!current.getHash().equals(current.calculateHash())) {
                result.put("valid", false);
                result.put("error", "Block #" + current.getIndex() + " hash is invalid (data tampered)");
                result.put("corruptedBlockIndex", current.getIndex());
                return result;
            }

            // Check 2: current block points to previous block's hash
            if (!current.getPreviousHash().equals(previous.getHash())) {
                result.put("valid", false);
                result.put("error", "Block #" + current.getIndex() + " previousHash doesn't match Block #" + previous.getIndex());
                result.put("corruptedBlockIndex", current.getIndex());
                return result;
            }
        }

        result.put("valid", true);
        result.put("message", "Blockchain is valid ✅ — all " + chain.size() + " blocks verified");
        return result;
    }

    // ═══════════════════════════════════════════════════════════════
    // ESCROW OPERATIONS (Phase 1: Simple Flow)
    // ═══════════════════════════════════════════════════════════════

    /**
     * CREATE — Company creates a new escrow agreement.
     * Status: -> CREATED
     * Adds a block to the chain.
     */
    public Map<String, Object> createAgreement(String farmer, String company,
                                                double totalPrice, double quantity,
                                                String produceType) {
        // Create the agreement in MongoDB
        EscrowAgreement agreement = new EscrowAgreement(farmer, company, totalPrice, quantity, produceType);
        escrowRepository.save(agreement);

        // Add a block to the chain
        String details = String.format(
            "Agreement created | Farmer: %s | Company: %s | Produce: %s | Qty: %.1f kg | Price: ₹%.2f",
            farmer, company, produceType, quantity, totalPrice
        );
        Block block = addBlock("CREATE_AGREEMENT", agreement.getId(), details);

        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Escrow agreement created successfully");
        response.put("agreement", agreement);
        response.put("block", block);
        return response;
    }

    /**
     * ACCEPT — Farmer accepts the agreement.
     * Status: CREATED -> ACTIVE
     */
    public Map<String, Object> acceptAgreement(String escrowId) {
        EscrowAgreement agreement = findAgreementOrThrow(escrowId);

        if (!"CREATED".equals(agreement.getStatus())) {
            throw new IllegalStateException("Agreement must be in CREATED status to accept. Current: " + agreement.getStatus());
        }

        agreement.setStatus("ACTIVE");
        escrowRepository.save(agreement);

        String details = String.format(
            "Agreement accepted by farmer: %s | Escrow: %s",
            agreement.getFarmer(), escrowId
        );
        Block block = addBlock("ACCEPT_AGREEMENT", escrowId, details);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Agreement accepted by farmer");
        response.put("agreement", agreement);
        response.put("block", block);
        return response;
    }

    /**
     * DELIVER — Farmer marks the produce as delivered.
     * Status: ACTIVE -> DELIVERED
     */
    public Map<String, Object> markAsDelivered(String escrowId) {
        EscrowAgreement agreement = findAgreementOrThrow(escrowId);

        if (!"ACTIVE".equals(agreement.getStatus())) {
            throw new IllegalStateException("Agreement must be in ACTIVE status to deliver. Current: " + agreement.getStatus());
        }

        agreement.setStatus("DELIVERED");
        agreement.setDeliveredAt(java.time.Instant.now().toString());
        escrowRepository.save(agreement);

        String details = String.format(
            "Produce delivered by farmer: %s | Type: %s | Qty: %.1f kg",
            agreement.getFarmer(), agreement.getProduceType(), agreement.getQuantity()
        );
        Block block = addBlock("MARK_DELIVERED", escrowId, details);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Produce marked as delivered");
        response.put("agreement", agreement);
        response.put("block", block);
        return response;
    }

    /**
     * CONFIRM — Company confirms delivery (quality is good).
     * Status: DELIVERED -> COMPLETED
     * In a real system, this is where funds would be released to farmer.
     */
    public Map<String, Object> confirmDelivery(String escrowId) {
        EscrowAgreement agreement = findAgreementOrThrow(escrowId);

        if (!"DELIVERED".equals(agreement.getStatus())) {
            throw new IllegalStateException("Agreement must be in DELIVERED status to confirm. Current: " + agreement.getStatus());
        }

        agreement.setStatus("COMPLETED");
        agreement.setCompletedAt(java.time.Instant.now().toString());
        escrowRepository.save(agreement);

        String details = String.format(
            "Delivery confirmed by company: %s | Funds released to farmer: %s | Amount: ₹%.2f",
            agreement.getCompany(), agreement.getFarmer(), agreement.getTotalPrice()
        );
        Block block = addBlock("CONFIRM_DELIVERY", escrowId, details);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Delivery confirmed — funds released to farmer");
        response.put("agreement", agreement);
        response.put("block", block);
        return response;
    }

    /**
     * REJECT — Company rejects delivery (quality is bad).
     * Status: DELIVERED -> REJECTED
     */
    public Map<String, Object> rejectDelivery(String escrowId, String reason) {
        EscrowAgreement agreement = findAgreementOrThrow(escrowId);

        if (!"DELIVERED".equals(agreement.getStatus())) {
            throw new IllegalStateException("Agreement must be in DELIVERED status to reject. Current: " + agreement.getStatus());
        }

        agreement.setStatus("REJECTED");
        escrowRepository.save(agreement);

        String details = String.format(
            "Delivery rejected by company: %s | Reason: %s | Farmer: %s",
            agreement.getCompany(), reason, agreement.getFarmer()
        );
        Block block = addBlock("REJECT_DELIVERY", escrowId, details);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Delivery rejected — " + reason);
        response.put("agreement", agreement);
        response.put("block", block);
        return response;
    }

    // ═══════════════════════════════════════════════════════════════
    // QUERY OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    public EscrowAgreement getAgreement(String escrowId) {
        return findAgreementOrThrow(escrowId);
    }

    public List<EscrowAgreement> getAllAgreements() {
        return escrowRepository.findAll();
    }

    public List<EscrowAgreement> getAgreementsByFarmer(String farmer) {
        return escrowRepository.findByFarmer(farmer);
    }

    public List<EscrowAgreement> getAgreementsByCompany(String company) {
        return escrowRepository.findByCompany(company);
    }

    public List<EscrowAgreement> getAgreementsByStatus(String status) {
        return escrowRepository.findByStatus(status);
    }

    // ── Helper ────────────────────────────────────────────────────

    private EscrowAgreement findAgreementOrThrow(String escrowId) {
        return escrowRepository.findById(escrowId)
                .orElseThrow(() -> new RuntimeException("Escrow agreement not found: " + escrowId));
    }
}
