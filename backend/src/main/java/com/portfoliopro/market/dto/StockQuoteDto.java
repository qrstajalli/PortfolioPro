package com.portfoliopro.market.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StockQuoteDto {

    private String symbol;
    private String name;
    private String company;
    private String exchange;
    private String market;
    private String sector;
    private BigDecimal currentPrice;
    private BigDecimal price;
    private BigDecimal previousClose;
    private BigDecimal changeAmount;
    private BigDecimal change;
    private BigDecimal changePercent;
    private BigDecimal dayHigh;
    private BigDecimal dayLow;
    private Long volume;
    private BigDecimal marketCap;
    private BigDecimal peRatio;
    private String timestamp;
    private Boolean isDelayed;
    private String currency;
}
