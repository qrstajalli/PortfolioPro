package com.portfoliopro.trade.dto;

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
public class TransactionDto {

    private Long id;
    private String transactionReference;
    private String symbol;
    private String name;
    private String exchange;
    private String type;
    private Long quantity;
    private BigDecimal price;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String description;
    private Instant transactionTime;
}
