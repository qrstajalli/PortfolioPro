package com.portfoliopro.market.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.MarketDataException;
import com.portfoliopro.exception.RateLimitExceededException;
import com.portfoliopro.market.dto.StockHistoryDto;
import com.portfoliopro.market.dto.StockQuoteDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

public class TwelveDataMarketDataProviderTest {

    private AppProperties appProperties;
    private TwelveDataMarketDataProvider provider;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() throws Exception {
        appProperties = new AppProperties();
        appProperties.getTwelveData().setApiKey("test-twelve-data-key");
        appProperties.getTwelveData().setBaseUrl("https://api.twelvedata.com");

        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.twelvedata.com");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();

        provider = new TwelveDataMarketDataProvider(appProperties);

        // Inject mock RestClient into provider
        Field field = TwelveDataMarketDataProvider.class.getDeclaredField("restClient");
        field.setAccessible(true);
        field.set(provider, restClient);
    }

    @Test
    @DisplayName("Should successfully parse real Twelve Data quote for AAPL")
    void testSuccessfulQuoteParsing() {
        String mockResponse = """
                {
                    "symbol": "AAPL",
                    "name": "Apple Inc.",
                    "exchange": "NASDAQ",
                    "mic_code": "XNGS",
                    "currency": "USD",
                    "datetime": "2026-09-29",
                    "timestamp": 1790688600,
                    "last_quote_at": 1790711940,
                    "open": "336.97000",
                    "high": "337.089996",
                    "low": "328.70001",
                    "close": "329.39999",
                    "volume": "38427200",
                    "previous_close": "338.39999",
                    "change": "-9",
                    "percent_change": "-2.65957",
                    "average_volume": "39262280",
                    "is_market_open": false
                }
                """;

        mockServer.expect(requestTo("https://api.twelvedata.com/quote?symbol=AAPL&apikey=test-twelve-data-key"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(mockResponse, MediaType.APPLICATION_JSON));

        Optional<StockQuoteDto> quoteOpt = provider.getQuote("AAPL");

        assertThat(quoteOpt).isPresent();
        StockQuoteDto quote = quoteOpt.get();
        assertThat(quote.getSymbol()).isEqualTo("AAPL");
        assertThat(quote.getName()).isEqualTo("Apple Inc.");
        assertThat(quote.getCurrentPrice()).isEqualByComparingTo(new BigDecimal("329.39999"));
        assertThat(quote.getPreviousClose()).isEqualByComparingTo(new BigDecimal("338.39999"));
        assertThat(quote.getChange()).isEqualByComparingTo(new BigDecimal("-9"));
        assertThat(quote.getChangePercent()).isEqualByComparingTo(new BigDecimal("-2.65957"));
        assertThat(quote.getCurrency()).isEqualTo("USD");
        assertThat(quote.getExchange()).isEqualTo("NASDAQ");
    }

    @Test
    @DisplayName("Should handle 429 rate limit error gracefully")
    void testRateLimitHandling() {
        String mockRateLimit = """
                {
                    "code": 429,
                    "message": "You have run out of API credits for the current minute. 9 API credits were used, with the current limit being 8.",
                    "status": "error"
                }
                """;

        mockServer.expect(requestTo("https://api.twelvedata.com/quote?symbol=NVDA&apikey=test-twelve-data-key"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(mockRateLimit, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> provider.getQuote("NVDA"))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("Twelve Data rate limit reached");
    }

    @Test
    @DisplayName("Should handle 404 premium/unavailable tier symbol by returning empty")
    void testUnavailableSymbolHandling() {
        String mockUnavailable = """
                {
                    "code": 404,
                    "message": "This symbol is available starting with the Grow or Venture plan. Consider upgrading now at https://twelvedata.com/pricing",
                    "status": "error"
                }
                """;

        mockServer.expect(requestTo("https://api.twelvedata.com/quote?symbol=RELIANCE&apikey=test-twelve-data-key&exchange=BSE"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(mockUnavailable, MediaType.APPLICATION_JSON));

        Optional<StockQuoteDto> quoteOpt = provider.getQuote("RELIANCE");
        assertThat(quoteOpt).isEmpty();
    }

    @Test
    @DisplayName("Should successfully parse /time_series historical data")
    void testSuccessfulTimeSeriesParsing() {
        String mockTimeSeries = """
                {
                    "meta": {
                        "symbol": "MSFT",
                        "interval": "1day",
                        "currency": "USD",
                        "exchange_timezone": "America/New_York",
                        "exchange": "NASDAQ"
                    },
                    "values": [
                        {
                            "datetime": "2026-09-29",
                            "open": "512.00",
                            "high": "515.50",
                            "low": "507.20",
                            "close": "508.95999",
                            "volume": "18230000"
                        }
                    ],
                    "status": "ok"
                }
                """;

        mockServer.expect(requestTo("https://api.twelvedata.com/time_series?symbol=MSFT&interval=1day&outputsize=30&apikey=test-twelve-data-key"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(mockTimeSeries, MediaType.APPLICATION_JSON));

        Optional<StockHistoryDto> historyOpt = provider.getHistoricalPrices("MSFT");

        assertThat(historyOpt).isPresent();
        StockHistoryDto history = historyOpt.get();
        assertThat(history.getSymbol()).isEqualTo("MSFT");
        assertThat(history.getExchange()).isEqualTo("NASDAQ");
        assertThat(history.getCandles()).hasSize(1);
        assertThat(history.getCandles().get(0).getClose()).isEqualByComparingTo(new BigDecimal("508.95999"));
        assertThat(history.getCandles().get(0).getDate()).isEqualTo("2026-09-29");
    }

    @Test
    @DisplayName("Should serve from cache on repeated requests within TTL")
    void testCacheUsage() {
        String mockResponse = """
                {
                    "symbol": "AAPL",
                    "name": "Apple Inc.",
                    "exchange": "NASDAQ",
                    "currency": "USD",
                    "close": "329.39999",
                    "previous_close": "338.39999"
                }
                """;

        mockServer.expect(requestTo("https://api.twelvedata.com/quote?symbol=AAPL&apikey=test-twelve-data-key"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(mockResponse, MediaType.APPLICATION_JSON));

        // First call hits server
        Optional<StockQuoteDto> first = provider.getQuote("AAPL");
        assertThat(first).isPresent();

        // Second call should return from cache without making a second HTTP call
        Optional<StockQuoteDto> second = provider.getQuote("AAPL");
        assertThat(second).isPresent();
        assertThat(second.get().getCurrentPrice()).isEqualByComparingTo(new BigDecimal("329.39999"));
    }
}
