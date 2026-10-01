package com.portfoliopro.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HoldingDto {

    private Long id;
    private String symbol;
    private String name;
    private String exchange;
    private Long quantity;
    private BigDecimal averageBuyPrice;
    private BigDecimal totalInvested;
    private BigDecimal currentPrice;
    private BigDecimal currentValue;
    private BigDecimal pnl;
    private BigDecimal pnlPercent;
    private BigDecimal allocation;
    private String currency;
}
