package com.f2m.blockchain.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

/**
 * Represents a single block in the F2M blockchain.
 * Each block contains:
 *   - index: position in the chain
 *   - timestamp: when the block was created
 *   - data: description of the action (e.g. "CREATE_AGREEMENT", "ACCEPT", etc.)
 *   - escrowId: which escrow agreement this block relates to
 *   - details: JSON-like string with extra info
 *   - previousHash: hash of the previous block
 *   - hash: SHA-256 hash of this block's contents
 */
@Document(collection = "blockchain")
public class Block {

    @Id
    private String id;

    private int index;
    private String timestamp;
    private String action;       // CREATE_AGREEMENT, ACCEPT, DELIVER, CONFIRM, REJECT
    private String escrowId;     // links to which EscrowAgreement
    private String details;      // extra info about the action
    private String previousHash;
    private String hash;

    // ── Constructors ──────────────────────────────────────────────

    public Block() {}

    /**
     * Creates a new block and auto-calculates its hash.
     */
    public Block(int index, String action, String escrowId, String details, String previousHash) {
        this.index = index;
        this.timestamp = Instant.now().toString();
        this.action = action;
        this.escrowId = escrowId;
        this.details = details;
        this.previousHash = previousHash;
        this.hash = calculateHash();
    }

    // ── Hash Calculation ──────────────────────────────────────────

    /**
     * SHA-256 hash of: index + timestamp + action + escrowId + details + previousHash
     */
    public String calculateHash() {
        String input = index + timestamp + action + escrowId + details + previousHash;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    // ── Getters & Setters ─────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getIndex() { return index; }
    public void setIndex(int index) { this.index = index; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEscrowId() { return escrowId; }
    public void setEscrowId(String escrowId) { this.escrowId = escrowId; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    @Override
    public String toString() {
        return "Block{" +
                "index=" + index +
                ", action='" + action + '\'' +
                ", escrowId='" + escrowId + '\'' +
                ", hash='" + hash.substring(0, 16) + "...'" +
                '}';
    }
}
