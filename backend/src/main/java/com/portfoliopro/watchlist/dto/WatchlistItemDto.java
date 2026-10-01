package com.portfoliopro.watchlist.dto;

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
public class WatchlistItemDto {

    private Long id;
    private String symbol;
    private String name;
    private String exchange;
    private String sector;
    private BigDecimal currentPrice;
    private BigDecimal changeAmount;
    private BigDecimal changePercent;
    private BigDecimal dayLow;
    private BigDecimal dayHigh;
    private Long volume;
    private BigDecimal peRatio;
    private String currency;
    private Instant addedAt;
}
