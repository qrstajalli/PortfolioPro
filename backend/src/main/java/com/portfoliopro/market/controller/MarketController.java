package com.portfoliopro.market.controller;

import com.portfoliopro.common.ApiResponse;
import com.portfoliopro.exception.ResourceNotFoundException;
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

    @GetMapping("/stocks/search")
    public ResponseEntity<ApiResponse<List<StockQuoteDto>>> searchStocks(
            @RequestParam("q") String query) {
        List<StockQuoteDto> results = marketDataProvider.searchStocks(query);
        return ResponseEntity.ok(ApiResponse.ok("Search results retrieved successfully", results));
    }

    @GetMapping("/stocks/{symbol}")
    public ResponseEntity<ApiResponse<StockQuoteDto>> getStockBySymbol(
            @PathVariable("symbol") String symbol) {
        StockQuoteDto quote = marketDataProvider.getQuote(symbol)
                .orElseThrow(() -> new ResourceNotFoundException("Stock quote", "symbol", symbol));
        return ResponseEntity.ok(ApiResponse.ok("Stock quote retrieved successfully", quote));
    }
}
