package com.f2m.blockchain.controller;

import com.f2m.blockchain.model.EscrowAgreement;
import com.f2m.blockchain.service.BlockchainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Escrow Agreement operations.
 * 
 * Phase 1 Flow:
 *   CREATE -> ACCEPT -> DELIVER -> CONFIRM / REJECT
 * 
 * Each operation adds a block to the blockchain.
 */
@RestController
@RequestMapping("/api/escrow")
public class EscrowController {

    @Autowired
    private BlockchainService blockchainService;

    // ═══════════════════════════════════════════════════════════════
    // CREATE AGREEMENT
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/escrow/create
     * Body: { farmer, company, totalPrice, quantity, produceType }
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createAgreement(@RequestBody Map<String, Object> body) {
        try {
            String farmer = (String) body.get("farmer");
            String company = (String) body.get("company");
            double totalPrice = Double.parseDouble(body.get("totalPrice").toString());
            double quantity = Double.parseDouble(body.get("quantity").toString());
            String produceType = (String) body.get("produceType");

            // Validation
            if (farmer == null || farmer.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Farmer name is required"));
            }
            if (company == null || company.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Company name is required"));
            }
            if (totalPrice <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Total price must be greater than 0"));
            }

            Map<String, Object> result = blockchainService.createAgreement(
                farmer, company, totalPrice, quantity, produceType
            );
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ACCEPT AGREEMENT (Farmer accepts)
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/escrow/{id}/accept
     */
    @PostMapping("/{id}/accept")
    public ResponseEntity<Map<String, Object>> acceptAgreement(@PathVariable String id) {
        try {
            Map<String, Object> result = blockchainService.acceptAgreement(id);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // MARK AS DELIVERED (Farmer delivers)
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/escrow/{id}/deliver
     */
    @PostMapping("/{id}/deliver")
    public ResponseEntity<Map<String, Object>> markAsDelivered(@PathVariable String id) {
        try {
            Map<String, Object> result = blockchainService.markAsDelivered(id);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIRM DELIVERY (Company confirms)
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/escrow/{id}/confirm
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<Map<String, Object>> confirmDelivery(@PathVariable String id) {
        try {
            Map<String, Object> result = blockchainService.confirmDelivery(id);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // REJECT DELIVERY (Company rejects)
    // ═══════════════════════════════════════════════════════════════

    /**
     * POST /api/escrow/{id}/reject
     * Body: { reason: "Quality not acceptable" }
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectDelivery(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String reason = body.getOrDefault("reason", "No reason provided");
            Map<String, Object> result = blockchainService.rejectDelivery(id, reason);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // QUERY ENDPOINTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * GET /api/escrow/all
     */
    @GetMapping("/all")
    public ResponseEntity<List<EscrowAgreement>> getAllAgreements() {
        return ResponseEntity.ok(blockchainService.getAllAgreements());
    }

    /**
     * GET /api/escrow/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAgreement(@PathVariable String id) {
        try {
            return ResponseEntity.ok(blockchainService.getAgreement(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/escrow/farmer/{name}
     */
    @GetMapping("/farmer/{name}")
    public ResponseEntity<List<EscrowAgreement>> getByFarmer(@PathVariable String name) {
        return ResponseEntity.ok(blockchainService.getAgreementsByFarmer(name));
    }

    /**
     * GET /api/escrow/company/{name}
     */
    @GetMapping("/company/{name}")
    public ResponseEntity<List<EscrowAgreement>> getByCompany(@PathVariable String name) {
        return ResponseEntity.ok(blockchainService.getAgreementsByCompany(name));
    }

    /**
     * GET /api/escrow/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<EscrowAgreement>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(blockchainService.getAgreementsByStatus(status.toUpperCase()));
    }
}
