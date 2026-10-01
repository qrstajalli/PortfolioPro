package com.portfoliopro.portfolio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioDto {

    private Long id;
    private Long userId;
    private BigDecimal cashBalance;
    private BigDecimal investedValue;
    private BigDecimal totalCostBasis;
    private BigDecimal totalNetWorth;
    private BigDecimal unrealizedPnL;
    private BigDecimal unrealizedPnLPercent;
    private int activePositions;
    private String currency;
    @Builder.Default
    private List<HoldingDto> holdings = new ArrayList<>();
}
