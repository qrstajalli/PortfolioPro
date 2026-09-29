package com.portfoliopro.market.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockQuoteDto {

    private String symbol;
    private String name;
    private String exchange;
    private String sector;
    private BigDecimal currentPrice;
    private BigDecimal previousClose;
    private BigDecimal changeAmount;
    private BigDecimal changePercent;
    private BigDecimal dayHigh;
    private BigDecimal dayLow;
    private Long volume;
    private BigDecimal marketCap;
    private BigDecimal peRatio;
}
