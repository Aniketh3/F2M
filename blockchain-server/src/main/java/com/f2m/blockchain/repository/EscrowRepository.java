package com.f2m.blockchain.repository;

import com.f2m.blockchain.model.EscrowAgreement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscrowRepository extends MongoRepository<EscrowAgreement, String> {

    /**
     * Find all escrows for a specific farmer.
     */
    List<EscrowAgreement> findByFarmer(String farmer);

    /**
     * Find all escrows for a specific company.
     */
    List<EscrowAgreement> findByCompany(String company);

    /**
     * Find all escrows with a specific status.
     */
    List<EscrowAgreement> findByStatus(String status);

    /**
     * Find escrows by farmer and status.
     */
    List<EscrowAgreement> findByFarmerAndStatus(String farmer, String status);

    /**
     * Find escrows by company and status.
     */
    List<EscrowAgreement> findByCompanyAndStatus(String company, String status);
}
