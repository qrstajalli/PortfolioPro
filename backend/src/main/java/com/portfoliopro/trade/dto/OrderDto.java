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
public class OrderDto {

    private Long id;
    private String orderNumber;
    private String symbol;
    private String name;
    private String exchange;
    private String side;
    private String orderType;
    private String orderStatus;
    private Long quantity;
    private BigDecimal executionPrice;
    private BigDecimal totalAmount;
    private String notes;
    private Instant createdAt;
    private Instant executedAt;
}
