package com.portfoliopro.market.controller;

import com.portfoliopro.common.ApiResponse;
import com.portfoliopro.exception.ResourceNotFoundException;
import com.portfoliopro.market.dto.StockHistoryDto;
import com.portfoliopro.market.dto.StockQuoteDto;
import com.portfoliopro.market.service.MarketDataProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketDataProvider marketDataProvider;

    @GetMapping("/stocks")
    public ResponseEntity<ApiResponse<List<StockQuoteDto>>> getAllStocks(
            @RequestParam(value = "sector", required = false) String sector) {
        List<StockQuoteDto> quotes = (sector != null && !sector.isBlank())
                ? marketDataProvider.getQuotesBySector(sector)
                : marketDataProvider.getAllQuotes();
        return ResponseEntity.ok(ApiResponse.ok("Market quotes retrieved successfully", quotes));
    }

    @GetMapping(value = {"/quote/{symbol}", "/stocks/{symbol}"})
    public ResponseEntity<ApiResponse<StockQuoteDto>> getStockQuote(
            @PathVariable("symbol") String symbol) {
        StockQuoteDto quote = marketDataProvider.getQuote(symbol)
                .orElseThrow(() -> new ResourceNotFoundException("Stock quote", "symbol", symbol));
        return ResponseEntity.ok(ApiResponse.ok("Stock quote retrieved successfully", quote));
    }

    @GetMapping(value = {"/search", "/stocks/search"})
    public ResponseEntity<ApiResponse<List<StockQuoteDto>>> searchStocks(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "q", required = false) String q) {
        String searchQuery = (query != null && !query.isBlank()) ? query : q;
        if (searchQuery == null || searchQuery.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok("Search results retrieved successfully", List.of()));
        }
        List<StockQuoteDto> results = marketDataProvider.searchStocks(searchQuery);
        return ResponseEntity.ok(ApiResponse.ok("Search results retrieved successfully", results));
    }

    @GetMapping("/history/{symbol}")
    public ResponseEntity<ApiResponse<StockHistoryDto>> getStockHistory(
            @PathVariable("symbol") String symbol,
            @RequestParam(value = "range", required = false) String range) {
        StockHistoryDto history = (range != null && !range.isBlank())
                ? marketDataProvider.getHistoricalPrices(symbol, range).orElseThrow(() -> new ResourceNotFoundException("Stock history", "symbol", symbol))
                : marketDataProvider.getHistoricalPrices(symbol).orElseThrow(() -> new ResourceNotFoundException("Stock history", "symbol", symbol));
        return ResponseEntity.ok(ApiResponse.ok("Historical data retrieved successfully", history));
    }
}
