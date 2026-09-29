package com.portfoliopro.market.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.MarketDataException;
import com.portfoliopro.exception.RateLimitExceededException;
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

public class AlphaVantageMarketDataProviderTest {

    private AppProperties appProperties;
    private AlphaVantageMarketDataProvider provider;
    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() throws Exception {
        appProperties = new AppProperties();
        appProperties.getAlphaVantage().setApiKey("test-key");
        appProperties.getAlphaVantage().setBaseUrl("https://www.alphavantage.co");

        RestClient.Builder builder = RestClient.builder().baseUrl("https://www.alphavantage.co");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();

        provider = new AlphaVantageMarketDataProvider(appProperties);

        // Inject mock RestClient into provider
        Field field = AlphaVantageMarketDataProvider.class.getDeclaredField("restClient");
        field.setAccessible(true);
        field.set(provider, restClient);
    }

    @Test
    @DisplayName("Should successfully parse real Alpha Vantage quote for RELIANCE.BSE")
    void testSuccessfulQuoteParsing() {
        String mockResponse = """
                {
                    "Global Quote": {
                        "01. symbol": "RELIANCE.BSE",
                        "02. open": "1222.9000",
                        "03. high": "1222.9000",
                        "04. low": "1196.0500",
                        "05. price": "1198.5000",
                        "06. volume": "962615",
                        "07. latest trading day": "2026-09-28",
                        "08. previous close": "1226.0000",
                        "09. change": "-27.5000",
                        "10. change percent": "-2.2431%"
                    }
                }
                """;

        mockServer.expect(requestTo("https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=RELIANCE.BSE&apikey=test-key"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(mockResponse, MediaType.APPLICATION_JSON));

        Optional<StockQuoteDto> quoteOpt = provider.getQuote("RELIANCE.BSE");

        assertThat(quoteOpt).isPresent();
        StockQuoteDto quote = quoteOpt.get();
        assertThat(quote.getSymbol()).isEqualTo("RELIANCE.BSE");
        assertThat(quote.getName()).isEqualTo("Reliance Industries Ltd");
        assertThat(quote.getExchange()).isEqualTo("BSE");
        assertThat(quote.getCurrentPrice()).isEqualByComparingTo(new BigDecimal("1198.5000"));
        assertThat(quote.getPreviousClose()).isEqualByComparingTo(new BigDecimal("1226.0000"));
        assertThat(quote.getChangeAmount()).isEqualByComparingTo(new BigDecimal("-27.5000"));
        assertThat(quote.getChangePercent()).isEqualByComparingTo(new BigDecimal("-2.2431"));
        assertThat(quote.getDayHigh()).isEqualByComparingTo(new BigDecimal("1222.9000"));
        assertThat(quote.getDayLow()).isEqualByComparingTo(new BigDecimal("1196.0500"));
        assertThat(quote.getVolume()).isEqualTo(962615L);
    }

    @Test
    @DisplayName("Should throw RateLimitExceededException when rate limit Note is returned")
    void testRateLimitNote() {
        String rateLimitResponse = """
                {
                    "Note": "Thank you for using Alpha Vantage! Our standard API call frequency is 5 calls per minute and 25 calls per day."
                }
                """;

        mockServer.expect(requestTo("https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=RELIANCE.BSE&apikey=test-key"))
                .andRespond(withSuccess(rateLimitResponse, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> provider.getQuote("RELIANCE.BSE"))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("rate limit reached");
    }

    @Test
    @DisplayName("Should throw MarketDataException when Alpha Vantage returns Error Message")
    void testErrorMessage() {
        String errorResponse = """
                {
                    "Error Message": "Invalid API call. Please check your query parameters."
                }
                """;

        mockServer.expect(requestTo("https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=INVALID&apikey=test-key"))
                .andRespond(withSuccess(errorResponse, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> provider.getQuote("INVALID"))
                .isInstanceOf(MarketDataException.class)
                .hasMessageContaining("Alpha Vantage API error");
    }

    @Test
    @DisplayName("Should return Optional.empty() when Global Quote is empty")
    void testEmptyGlobalQuote() {
        String emptyResponse = """
                {
                    "Global Quote": {}
                }
                """;

        mockServer.expect(requestTo("https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=UNKNOWN&apikey=test-key"))
                .andRespond(withSuccess(emptyResponse, MediaType.APPLICATION_JSON));

        Optional<StockQuoteDto> quoteOpt = provider.getQuote("UNKNOWN");
        assertThat(quoteOpt).isEmpty();
    }
}
