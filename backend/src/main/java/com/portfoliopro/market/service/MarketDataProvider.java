package com.portfoliopro.market.service;

import com.portfoliopro.market.dto.StockQuoteDto;

import java.util.List;
import java.util.Optional;

/**
 * Abstraction layer for stock quotes and market data.
 * Can be implemented by MockMarketDataProvider, or external providers like
 * AlphaVantage, YahooFinance, TwelveData, etc.
 */
public interface MarketDataProvider {

    Optional<StockQuoteDto> getQuote(String symbol);

    List<StockQuoteDto> getAllQuotes();

    List<StockQuoteDto> searchStocks(String query);

    List<StockQuoteDto> getQuotesBySector(String sector);
}
