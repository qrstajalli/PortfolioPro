package com.portfoliopro.market.controller;

import com.portfoliopro.exception.RateLimitExceededException;
import com.portfoliopro.exception.ResourceNotFoundException;
import com.portfoliopro.market.dto.HistoricalDataPointDto;
import com.portfoliopro.market.dto.StockHistoryDto;
import com.portfoliopro.market.dto.StockQuoteDto;
import com.portfoliopro.market.service.MarketDataProvider;
import com.portfoliopro.security.jwt.JwtAuthenticationEntryPoint;
import com.portfoliopro.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MarketController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
                classes = {com.portfoliopro.security.jwt.JwtAuthenticationFilter.class}))
public class MarketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MarketDataProvider marketDataProvider;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Test
    @DisplayName("GET /api/v1/market/quote/{symbol} returns full quote object with all required fields")
    void testGetQuote() throws Exception {
        StockQuoteDto quote = StockQuoteDto.builder()
                .symbol("RELIANCE.BSE")
                .name("Reliance Industries Ltd")
                .company("Reliance Industries Ltd")
                .exchange("BSE")
                .market("BSE")
                .currentPrice(new BigDecimal("1184.00"))
                .price(new BigDecimal("1184.00"))
                .changeAmount(new BigDecimal("-14.50"))
                .change(new BigDecimal("-14.50"))
                .changePercent(new BigDecimal("-1.21"))
                .volume(866666L)
                .timestamp("2026-09-29")
                .isDelayed(true)
                .currency("INR")
                .build();

        when(marketDataProvider.getQuote("RELIANCE.BSE")).thenReturn(Optional.of(quote));

        mockMvc.perform(get("/api/v1/market/quote/RELIANCE.BSE")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.symbol").value("RELIANCE.BSE"))
                .andExpect(jsonPath("$.data.company").value("Reliance Industries Ltd"))
                .andExpect(jsonPath("$.data.price").value(1184.00))
                .andExpect(jsonPath("$.data.change").value(-14.50))
                .andExpect(jsonPath("$.data.changePercent").value(-1.21))
                .andExpect(jsonPath("$.data.volume").value(866666))
                .andExpect(jsonPath("$.data.timestamp").value("2026-09-29"))
                .andExpect(jsonPath("$.data.market").value("BSE"))
                .andExpect(jsonPath("$.data.isDelayed").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/market/search?query=RELIANCE returns matching symbols")
    void testSearchSymbols() throws Exception {
        StockQuoteDto match = StockQuoteDto.builder()
                .symbol("RELIANCE.BSE")
                .name("Reliance Industries Limited")
                .company("Reliance Industries Limited")
                .exchange("BSE")
                .market("BSE")
                .currency("INR")
                .isDelayed(true)
                .build();

        when(marketDataProvider.searchStocks("RELIANCE")).thenReturn(List.of(match));

        mockMvc.perform(get("/api/v1/market/search")
                        .param("query", "RELIANCE")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].symbol").value("RELIANCE.BSE"))
                .andExpect(jsonPath("$.data[0].company").value("Reliance Industries Limited"));
    }

    @Test
    @DisplayName("GET /api/v1/market/history/{symbol} returns historical OHLCV candles")
    void testGetHistory() throws Exception {
        HistoricalDataPointDto candle = HistoricalDataPointDto.builder()
                .date("2026-09-29")
                .open(new BigDecimal("1194.40"))
                .high(new BigDecimal("1198.00"))
                .low(new BigDecimal("1182.05"))
                .close(new BigDecimal("1184.00"))
                .volume(866666L)
                .build();

        StockHistoryDto history = StockHistoryDto.builder()
                .symbol("RELIANCE.BSE")
                .exchange("BSE")
                .currency("INR")
                .lastRefreshed("2026-09-29")
                .timeZone("Asia/Kolkata")
                .candles(List.of(candle))
                .build();

        when(marketDataProvider.getHistoricalPrices("RELIANCE.BSE")).thenReturn(Optional.of(history));

        mockMvc.perform(get("/api/v1/market/history/RELIANCE.BSE")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.symbol").value("RELIANCE.BSE"))
                .andExpect(jsonPath("$.data.candles[0].date").value("2026-09-29"))
                .andExpect(jsonPath("$.data.candles[0].close").value(1184.00));
    }

    @Test
    @DisplayName("GET /api/v1/market/quote/{symbol} throws 404 when quote not found")
    void testQuoteNotFound() throws Exception {
        when(marketDataProvider.getQuote("NONEXISTENT")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/market/quote/NONEXISTENT"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Rate limit note returns 429 Too Many Requests")
    void testRateLimitHandling() throws Exception {
        when(marketDataProvider.getQuote("LIMITED"))
                .thenThrow(new RateLimitExceededException("Alpha Vantage rate limit reached"));

        mockMvc.perform(get("/api/v1/market/quote/LIMITED"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Alpha Vantage rate limit reached"));
    }
}
