package com.portfoliopro.market.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.MarketDataException;
import com.portfoliopro.exception.RateLimitExceededException;
import com.portfoliopro.market.dto.StockQuoteDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Real Market Data Provider integrating Alpha Vantage API for live Indian & global equities.
 * Uses real API responses without fallback to mock data.
 */
@Slf4j
@Service
@Primary
public class AlphaVantageMarketDataProvider implements MarketDataProvider {

    private final AppProperties appProperties;
    private final RestClient restClient;
    private final Map<String, CachedQuote> quoteCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60_000L; // 1-minute TTL to respect API limits

    public AlphaVantageMarketDataProvider(AppProperties appProperties) {
        this.appProperties = appProperties;
        this.restClient = RestClient.builder()
                .baseUrl(appProperties.getAlphaVantage().getBaseUrl())
                .build();
    }

    @org.springframework.beans.factory.annotation.Value("${ALPHA_VANTAGE_API_KEY:${app.alpha-vantage.api-key:}}")
    private String envApiKey;

    private String resolveApiKey() {
        if (envApiKey != null && !envApiKey.trim().isEmpty() && !envApiKey.startsWith("${")) {
            return envApiKey.trim();
        }
        if (appProperties.getAlphaVantage() != null && appProperties.getAlphaVantage().getApiKey() != null
                && !appProperties.getAlphaVantage().getApiKey().trim().isEmpty()) {
            return appProperties.getAlphaVantage().getApiKey().trim();
        }
        String sysEnv = System.getenv("ALPHA_VANTAGE_API_KEY");
        if (sysEnv != null && !sysEnv.trim().isEmpty()) {
            return sysEnv.trim();
        }
        return readApiKeyFromDotenvFile();
    }

    private String readApiKeyFromDotenvFile() {
        List<java.io.File> candidates = List.of(
                new java.io.File(".env"),
                new java.io.File("../.env"),
                new java.io.File(System.getProperty("user.dir", "."), ".env"),
                new java.io.File(System.getProperty("user.dir", "."), "../.env")
        );
        for (java.io.File file : candidates) {
            if (file.exists() && file.isFile() && file.canRead()) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.FileReader(file, java.nio.charset.StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.startsWith("ALPHA_VANTAGE_API_KEY=")) {
                            String val = line.substring("ALPHA_VANTAGE_API_KEY=".length()).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) ||
                                (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (!val.isEmpty()) {
                                return val;
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }
        return "";
    }

    @Override
    @SuppressWarnings("unchecked")
    public Optional<StockQuoteDto> getQuote(String symbol) {
        if (symbol == null || symbol.trim().isEmpty()) {
            return Optional.empty();
        }
        String cleanSymbol = symbol.trim().toUpperCase();

        CachedQuote cached = quoteCache.get(cleanSymbol);
        if (cached != null && !cached.isExpired(CACHE_TTL_MS)) {
            log.debug("Returning cached Alpha Vantage quote for symbol: {}", cleanSymbol);
            return Optional.of(cached.quote());
        }

        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Alpha Vantage API key is not configured");
            throw new MarketDataException("Alpha Vantage API key is not configured in environment (ALPHA_VANTAGE_API_KEY)");
        }

        log.info("Requesting live quote from Alpha Vantage for symbol: {}", cleanSymbol);

        try {
            Map<String, Object> root = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/query")
                            .queryParam("function", "GLOBAL_QUOTE")
                            .queryParam("symbol", cleanSymbol)
                            .queryParam("apikey", apiKey.trim())
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (root == null || root.isEmpty()) {
                log.warn("Empty response received from Alpha Vantage for symbol: {}", cleanSymbol);
                return Optional.empty();
            }

            if (root.containsKey("Note")) {
                String note = String.valueOf(root.get("Note"));
                log.warn("Alpha Vantage API rate limit note received for symbol: {}", cleanSymbol);
                throw new RateLimitExceededException("Alpha Vantage rate limit reached: " + note);
            }

            if (root.containsKey("Information")) {
                String info = String.valueOf(root.get("Information"));
                log.warn("Alpha Vantage API information notice received for symbol: {}", cleanSymbol);
                throw new RateLimitExceededException("Alpha Vantage request limit reached: " + info);
            }

            if (root.containsKey("Error Message")) {
                String error = String.valueOf(root.get("Error Message"));
                log.error("Alpha Vantage API error received for symbol {}: {}", cleanSymbol, error);
                throw new MarketDataException("Alpha Vantage API error: " + error);
            }

            Object quoteObj = root.get("Global Quote");
            if (!(quoteObj instanceof Map)) {
                log.info("No Global Quote data found for symbol: {}", cleanSymbol);
                return Optional.empty();
            }

            Map<String, Object> quoteMap = (Map<String, Object>) quoteObj;
            if (quoteMap.isEmpty()) {
                log.info("Empty Global Quote map returned for symbol: {}", cleanSymbol);
                return Optional.empty();
            }

            StockQuoteDto quoteDto = mapToStockQuoteDto(cleanSymbol, quoteMap);
            quoteCache.put(cleanSymbol, new CachedQuote(quoteDto, System.currentTimeMillis()));
            return Optional.of(quoteDto);

        } catch (RateLimitExceededException | MarketDataException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("Alpha Vantage HTTP error status {} for symbol: {}", e.getStatusCode(), cleanSymbol);
            throw new MarketDataException("Alpha Vantage HTTP error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Unexpected error fetching market quote for symbol {}: {}", cleanSymbol, e.getMessage());
            throw new MarketDataException("Failed to fetch market data: " + e.getMessage(), e);
        }
    }

    @Override
    public List<StockQuoteDto> getAllQuotes() {
        List<StockQuoteDto> list = new ArrayList<>();
        try {
            Optional<StockQuoteDto> relianceQuote = getQuote("RELIANCE.BSE");
            relianceQuote.ifPresent(list::add);
        } catch (Exception e) {
            log.warn("Could not fetch default quote from Alpha Vantage in getAllQuotes: {}", e.getMessage());
        }

        for (CachedQuote cq : quoteCache.values()) {
            if (!list.contains(cq.quote())) {
                list.add(cq.quote());
            }
        }
        return list;
    }

    @Override
    public List<StockQuoteDto> searchStocks(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String cleanQuery = query.trim().toUpperCase();

        for (CachedQuote cq : quoteCache.values()) {
            if (cq.quote().getSymbol().toUpperCase().contains(cleanQuery) ||
                (cq.quote().getName() != null && cq.quote().getName().toUpperCase().contains(cleanQuery))) {
                return List.of(cq.quote());
            }
        }

        try {
            Optional<StockQuoteDto> direct = getQuote(cleanQuery);
            if (direct.isPresent()) {
                return List.of(direct.get());
            }
        } catch (Exception ignored) {
        }

        return Collections.emptyList();
    }

    @Override
    public List<StockQuoteDto> getQuotesBySector(String sector) {
        return getAllQuotes().stream()
                .filter(q -> q.getSector() != null && q.getSector().equalsIgnoreCase(sector))
                .toList();
    }

    private StockQuoteDto mapToStockQuoteDto(String requestedSymbol, Map<String, Object> quoteMap) {
        String symbol = getString(quoteMap, "01. symbol", requestedSymbol);
        BigDecimal currentPrice = parseBigDecimal(quoteMap.get("05. price"));
        BigDecimal prevClose = parseBigDecimal(quoteMap.get("08. previous close"));
        BigDecimal changeAmount = parseBigDecimal(quoteMap.get("09. change"));
        BigDecimal changePercent = parsePercent(quoteMap.get("10. change percent"));
        BigDecimal dayHigh = parseBigDecimal(quoteMap.get("03. high"));
        BigDecimal dayLow = parseBigDecimal(quoteMap.get("04. low"));
        Long volume = parseLong(quoteMap.get("06. volume"));

        String exchange = "BSE";
        String name = symbol;
        if (symbol.contains(".")) {
            String[] parts = symbol.split("\\.");
            if (parts.length >= 2) {
                exchange = parts[1].toUpperCase();
                name = parts[0];
            }
        }
        if ("RELIANCE.BSE".equalsIgnoreCase(symbol) || "RELIANCE".equalsIgnoreCase(name)) {
            name = "Reliance Industries Ltd";
        }

        return StockQuoteDto.builder()
                .symbol(symbol)
                .name(name)
                .exchange(exchange)
                .currentPrice(currentPrice)
                .previousClose(prevClose)
                .changeAmount(changeAmount)
                .changePercent(changePercent)
                .dayHigh(dayHigh)
                .dayLow(dayLow)
                .volume(volume)
                .build();
    }

    private String getString(Map<String, Object> map, String key, String defaultValue) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val).trim() : defaultValue;
    }

    private BigDecimal parseBigDecimal(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
            return null;
        }
        try {
            return new BigDecimal(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal parsePercent(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).replace("%", "").trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
            return null;
        }
        try {
            return new BigDecimal(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long parseLong(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
            return null;
        }
        try {
            return Long.parseLong(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private record CachedQuote(StockQuoteDto quote, long timestamp) {
        boolean isExpired(long ttlMs) {
            return System.currentTimeMillis() - timestamp > ttlMs;
        }
    }
}
