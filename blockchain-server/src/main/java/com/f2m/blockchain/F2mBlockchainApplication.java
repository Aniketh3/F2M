package com.f2m.blockchain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class F2mBlockchainApplication {

    public static void main(String[] args) {
        SpringApplication.run(F2mBlockchainApplication.class, args);
        System.out.println("═══════════════════════════════════════════");
        System.out.println("  F2M Blockchain Server running on :8080  ");
        System.out.println("═══════════════════════════════════════════");
    }
}
