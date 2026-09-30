package com.portfoliopro.market.service;

import com.portfoliopro.market.dto.StockHistoryDto;
import com.portfoliopro.market.dto.StockQuoteDto;

import java.util.List;
import java.util.Optional;

/**
 * Abstraction layer for stock quotes and market data.
 * Real implementation provided by TwelveDataMarketDataProvider,
 * or MockMarketDataProvider for offline/testing scenarios.
 */
public interface MarketDataProvider {

    Optional<StockQuoteDto> getQuote(String symbol);

    List<StockQuoteDto> getAllQuotes();

    List<StockQuoteDto> searchStocks(String query);

    List<StockQuoteDto> getQuotesBySector(String sector);

    Optional<StockHistoryDto> getHistoricalPrices(String symbol);
}
