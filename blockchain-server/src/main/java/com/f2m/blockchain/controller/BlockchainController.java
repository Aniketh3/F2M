package com.f2m.blockchain.controller;

import com.f2m.blockchain.model.Block;
import com.f2m.blockchain.service.BlockchainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for blockchain operations.
 * View the chain, validate integrity, get blocks for a specific escrow.
 */
@RestController
@RequestMapping("/api/blockchain")
public class BlockchainController {

    @Autowired
    private BlockchainService blockchainService;

    /**
     * GET /api/blockchain/chain
     * Returns the full blockchain in order.
     */
    @GetMapping("/chain")
    public ResponseEntity<List<Block>> getFullChain() {
        return ResponseEntity.ok(blockchainService.getFullChain());
    }

    /**
     * GET /api/blockchain/validate
     * Validates the integrity of the entire blockchain.
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateChain() {
        return ResponseEntity.ok(blockchainService.validateChain());
    }

    /**
     * GET /api/blockchain/escrow/{escrowId}
     * Returns all blocks related to a specific escrow agreement.
     */
    @GetMapping("/escrow/{escrowId}")
    public ResponseEntity<List<Block>> getBlocksForEscrow(@PathVariable String escrowId) {
        return ResponseEntity.ok(blockchainService.getBlocksForEscrow(escrowId));
    }

    /**
     * GET /api/blockchain/latest
     * Returns the latest block in the chain.
     */
    @GetMapping("/latest")
    public ResponseEntity<Block> getLatestBlock() {
        return ResponseEntity.ok(blockchainService.getLastBlock());
    }
}
