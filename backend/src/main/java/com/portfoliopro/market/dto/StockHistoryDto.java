package com.portfoliopro.market.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockHistoryDto {

    private String symbol;
    private String exchange;
    private String currency;
    private String lastRefreshed;
    private String timeZone;
    private List<HistoricalDataPointDto> candles;
}
