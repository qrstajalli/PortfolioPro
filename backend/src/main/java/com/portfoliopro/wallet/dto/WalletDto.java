package com.portfoliopro.wallet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletDto {
    private Long id;
    private Long userId;
    private BigDecimal balance;
    private BigDecimal initialBalance;
    private Boolean isConfigured;
    private String currency;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;
}
