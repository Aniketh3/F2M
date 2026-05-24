package com.f2m.blockchain.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Represents an Escrow Agreement between a Farmer and a Company.
 * 
 * Phase 1 statuses: CREATED, ACTIVE, DELIVERED, COMPLETED, REJECTED
 * 
 * This mirrors the Solidity FarmerEscrow contract but runs in Java.
 */
@Document(collection = "escrow_agreements")
public class EscrowAgreement {

    @Id
    private String id;

    // ── Parties ──
    private String farmer;        // farmer's name or ID
    private String company;       // company/buyer's name or ID

    // ── Agreement Details ──
    private double totalPrice;    // agreed total price
    private double quantity;      // quantity of produce (in kg)
    private String produceType;   // e.g., "Tomato", "Wheat", "Rice"

    // ── Status ──
    private String status;        // CREATED, ACTIVE, DELIVERED, COMPLETED, REJECTED

    // ── Timestamps ──
    private String createdAt;
    private String updatedAt;
    private String deliveredAt;   // when farmer marked as delivered
    private String completedAt;   // when buyer confirmed

    // ── Constructors ──────────────────────────────────────────────

    public EscrowAgreement() {}

    public EscrowAgreement(String farmer, String company, double totalPrice, 
                           double quantity, String produceType) {
        this.farmer = farmer;
        this.company = company;
        this.totalPrice = totalPrice;
        this.quantity = quantity;
        this.produceType = produceType;
        this.status = "CREATED";
        this.createdAt = Instant.now().toString();
        this.updatedAt = this.createdAt;
    }

    // ── Getters & Setters ─────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFarmer() { return farmer; }
    public void setFarmer(String farmer) { this.farmer = farmer; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }

    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }

    public String getProduceType() { return produceType; }
    public void setProduceType(String produceType) { this.produceType = produceType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { 
        this.status = status; 
        this.updatedAt = Instant.now().toString();
    }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(String deliveredAt) { this.deliveredAt = deliveredAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
}
