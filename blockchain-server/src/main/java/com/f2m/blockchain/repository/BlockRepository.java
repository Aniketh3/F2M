package com.f2m.blockchain.repository;

import com.f2m.blockchain.model.Block;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockRepository extends MongoRepository<Block, String> {

    /**
     * Get all blocks ordered by index (the chain in order).
     */
    List<Block> findAllByOrderByIndexAsc();

    /**
     * Find the last block in the chain (highest index).
     */
    Optional<Block> findTopByOrderByIndexDesc();

    /**
     * Find all blocks related to a specific escrow agreement.
     */
    List<Block> findByEscrowIdOrderByIndexAsc(String escrowId);

    /**
     * Count total blocks in the chain.
     */
    long count();
}
