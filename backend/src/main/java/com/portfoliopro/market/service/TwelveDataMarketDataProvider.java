package com.portfoliopro.market.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.MarketDataException;
import com.portfoliopro.exception.RateLimitExceededException;
import com.portfoliopro.market.dto.HistoricalDataPointDto;
import com.portfoliopro.market.dto.StockHistoryDto;
import com.portfoliopro.market.dto.StockQuoteDto;
import com.portfoliopro.market.entity.Stock;
import com.portfoliopro.market.repository.StockRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Real Market Data Provider integrating Twelve Data REST API for live & historical equities.
 * Uses real Twelve Data API responses (/quote and /time_series) without substituting fabricated prices.
 */
@Slf4j
@Service("twelveDataMarketDataProvider")
@Primary
public class TwelveDataMarketDataProvider implements MarketDataProvider {

    private final AppProperties appProperties;
    private final RestClient restClient;
    private final StockRepository stockRepository;
    private final Map<String, CachedQuote> quoteCache = new ConcurrentHashMap<>();
    private final Map<String, CachedHistory> historyCache = new ConcurrentHashMap<>();

    // 5-minute TTL for quotes, 15-minute TTL for historical data to respect API quota limits
    private static final long QUOTE_CACHE_TTL_MS = 300_000L;
    private static final long HISTORY_CACHE_TTL_MS = 900_000L;

    @Value("${TWELVE_DATA_API_KEY:${app.twelve-data.api-key:}}")
    private String envApiKey;

    @Autowired
    public TwelveDataMarketDataProvider(AppProperties appProperties, @Autowired(required = false) StockRepository stockRepository) {
        this.appProperties = appProperties;
        this.stockRepository = stockRepository;
        String baseUrl = appProperties.getTwelveData() != null && appProperties.getTwelveData().getBaseUrl() != null
                && !appProperties.getTwelveData().getBaseUrl().isBlank()
                ? appProperties.getTwelveData().getBaseUrl()
                : "https://api.twelvedata.com";
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public TwelveDataMarketDataProvider(AppProperties appProperties) {
        this(appProperties, null);
    }

    private String resolveApiKey() {
        if (envApiKey != null && !envApiKey.trim().isEmpty() && !envApiKey.startsWith("${")) {
            return envApiKey.trim();
        }
        if (appProperties.getTwelveData() != null && appProperties.getTwelveData().getApiKey() != null
                && !appProperties.getTwelveData().getApiKey().trim().isEmpty()) {
            return appProperties.getTwelveData().getApiKey().trim();
        }
        String sysEnv = System.getenv("TWELVE_DATA_API_KEY");
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
                        if (line.startsWith("TWELVE_DATA_API_KEY=")) {
                            String val = line.substring("TWELVE_DATA_API_KEY=".length()).trim();
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

    private String cleanSymbol(String symbol) {
        String clean = symbol.trim().toUpperCase();
        if (clean.endsWith(".BSE") || clean.endsWith(".NSE")) {
            clean = clean.substring(0, clean.lastIndexOf('.'));
        }
        return clean;
    }

    private String resolveExchange(String symbol) {
        String upper = symbol.trim().toUpperCase();
        if (upper.endsWith(".BSE")) {
            return "BSE";
        }
        if (upper.endsWith(".NSE")) {
            return "NSE";
        }
        if (stockRepository != null) {
            Optional<Stock> stockOpt = stockRepository.findBySymbolIgnoreCase(cleanSymbol(upper));
            if (stockOpt.isPresent() && stockOpt.get().getExchange() != null) {
                return stockOpt.get().getExchange();
            }
        }
        Set<String> bseStocks = Set.of("RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "LT");
        if (bseStocks.contains(cleanSymbol(upper))) {
            return "BSE";
        }
        return null;
    }

    @Override
    public Optional<StockQuoteDto> getQuote(String rawSymbol) {
        if (rawSymbol == null || rawSymbol.trim().isEmpty()) {
            return Optional.empty();
        }
        String clean = cleanSymbol(rawSymbol);
        String exchange = resolveExchange(rawSymbol);

        // 1. Check cache first
        CachedQuote cached = quoteCache.get(clean);
        if (cached != null && !cached.isExpired(QUOTE_CACHE_TTL_MS)) {
            log.debug("Returning cached Twelve Data quote for symbol: {}", clean);
            return Optional.of(cached.quote());
        }

        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Twelve Data API key is not configured");
            throw new MarketDataException("Twelve Data API key is not configured in environment (TWELVE_DATA_API_KEY)");
        }

        log.info("Requesting live quote from Twelve Data for symbol: {} (exchange: {})", clean, exchange != null ? exchange : "DEFAULT");

        try {
            Map<String, Object> root = restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/quote")
                                .queryParam("symbol", clean)
                                .queryParam("apikey", apiKey.trim());
                        if (exchange != null && !exchange.isBlank() && !"NASDAQ".equalsIgnoreCase(exchange) && !"NYSE".equalsIgnoreCase(exchange)) {
                            uriBuilder.queryParam("exchange", exchange);
                        }
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (root == null || root.isEmpty()) {
                log.warn("Empty response received from Twelve Data for symbol: {}", clean);
                return Optional.empty();
            }

            // Check for API errors or rate limits
            if (root.containsKey("code") || "error".equalsIgnoreCase(String.valueOf(root.get("status")))) {
                int code = root.get("code") instanceof Number num ? num.intValue() : 400;
                String message = sanitizeMessage(String.valueOf(root.getOrDefault("message", "Unknown Twelve Data error")));

                if (code == 429) {
                    log.warn("Twelve Data API rate limit reached (429) for symbol: {}", clean);
                    if (cached != null) {
                        return Optional.of(cached.quote());
                    }
                    throw new RateLimitExceededException("Twelve Data rate limit reached: " + message);
                }

                if (code == 404) {
                    log.info("Twelve Data symbol unavailable or requires higher tier for symbol {}: {}", clean, message);
                    if (cached != null) {
                        return Optional.of(cached.quote());
                    }
                    return Optional.empty();
                }

                log.warn("Twelve Data API response code {} for symbol {}: {}", code, clean, message);
                if (cached != null) {
                    return Optional.of(cached.quote());
                }
                return Optional.empty();
            }

            StockQuoteDto quoteDto = mapToStockQuoteDto(clean, exchange, root);
            quoteCache.put(clean, new CachedQuote(quoteDto, System.currentTimeMillis()));
            if (!rawSymbol.equalsIgnoreCase(clean)) {
                quoteCache.put(rawSymbol.toUpperCase(), new CachedQuote(quoteDto, System.currentTimeMillis()));
            }

            // Sync latest valid quote with database
            if (stockRepository != null) {
                stockRepository.findBySymbolIgnoreCase(clean).ifPresent(s -> {
                    if (quoteDto.getCurrentPrice() != null) {
                        s.setCurrentPrice(quoteDto.getCurrentPrice());
                    }
                    if (quoteDto.getPreviousClose() != null) {
                        s.setPreviousClose(quoteDto.getPreviousClose());
                    }
                    if (quoteDto.getDayHigh() != null) {
                        s.setDayHigh(quoteDto.getDayHigh());
                    }
                    if (quoteDto.getDayLow() != null) {
                        s.setDayLow(quoteDto.getDayLow());
                    }
                    if (quoteDto.getVolume() != null) {
                        s.setVolume(quoteDto.getVolume());
                    }
                    stockRepository.save(s);
                });
            }

            return Optional.of(quoteDto);

        } catch (RateLimitExceededException | MarketDataException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("Twelve Data HTTP error status {} for symbol: {}", e.getStatusCode(), clean);
            if (e.getStatusCode().value() == 429) {
                if (cached != null) {
                    return Optional.of(cached.quote());
                }
                throw new RateLimitExceededException("Twelve Data rate limit reached: HTTP 429");
            }
            if (e.getStatusCode().value() == 404) {
                log.info("Twelve Data symbol unavailable or requires higher tier (404) for symbol: {}", clean);
                if (cached != null) {
                    return Optional.of(cached.quote());
                }
                return Optional.empty();
            }
            throw new MarketDataException("Twelve Data HTTP error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Unexpected error fetching market quote for symbol {}: {}", clean, e.getMessage());
            if (cached != null) {
                return Optional.of(cached.quote());
            }
            throw new MarketDataException("Failed to fetch market data: " + e.getMessage(), e);
        }
    }

    @Override
    public List<StockQuoteDto> getAllQuotes() {
        if (stockRepository == null) {
            return new ArrayList<>(quoteCache.values().stream().map(CachedQuote::quote).toList());
        }

        List<Stock> stocks = stockRepository.findByIsActiveTrue();
        List<StockQuoteDto> list = new ArrayList<>();

        for (Stock stock : stocks) {
            String symbol = stock.getSymbol();
            CachedQuote cq = quoteCache.get(symbol);

            if (cq != null && !cq.isExpired(QUOTE_CACHE_TTL_MS)) {
                list.add(cq.quote());
            } else {
                BigDecimal price = (stock.getCurrentPrice() != null && stock.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0)
                        ? stock.getCurrentPrice() : null;
                BigDecimal prevClose = (stock.getPreviousClose() != null && stock.getPreviousClose().compareTo(BigDecimal.ZERO) > 0)
                        ? stock.getPreviousClose() : null;
                BigDecimal changeAmount = (price != null && prevClose != null) ? price.subtract(prevClose) : null;
                BigDecimal changePercent = (changeAmount != null && prevClose != null && prevClose.compareTo(BigDecimal.ZERO) != 0)
                        ? changeAmount.divide(prevClose, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                        : null;

                StockQuoteDto dto = StockQuoteDto.builder()
                        .symbol(stock.getSymbol())
                        .name(stock.getName())
                        .company(stock.getName())
                        .exchange(stock.getExchange())
                        .market(stock.getExchange())
                        .providerSymbol(stock.getProviderSymbol() != null ? stock.getProviderSymbol() : stock.getSymbol())
                        .sector(stock.getSector())
                        .currentPrice(price)
                        .price(price)
                        .previousClose(prevClose)
                        .changeAmount(changeAmount)
                        .change(changeAmount)
                        .changePercent(changePercent)
                        .dayHigh(stock.getDayHigh())
                        .dayLow(stock.getDayLow())
                        .volume(stock.getVolume())
                        .marketCap(stock.getMarketCap())
                        .peRatio(stock.getPeRatio())
                        .isDelayed(true)
                        .currency(stock.getExchange().equalsIgnoreCase("NASDAQ") ? "USD" : "INR")
                        .build();

                list.add(dto);
            }
        }

        return list;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<StockQuoteDto> searchStocks(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String cleanQuery = query.trim().toUpperCase();

        List<StockQuoteDto> results = new ArrayList<>();

        // 1. Search database stocks first
        if (stockRepository != null) {
            List<Stock> matchingStocks = stockRepository.searchStocks(cleanQuery);
            for (Stock stock : matchingStocks) {
                String symbol = stock.getSymbol();
                CachedQuote cq = quoteCache.get(symbol);

                if (cq != null && !cq.isExpired(QUOTE_CACHE_TTL_MS)) {
                    results.add(cq.quote());
                } else {
                    BigDecimal price = (stock.getCurrentPrice() != null && stock.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0)
                            ? stock.getCurrentPrice() : null;
                    BigDecimal prevClose = (stock.getPreviousClose() != null && stock.getPreviousClose().compareTo(BigDecimal.ZERO) > 0)
                            ? stock.getPreviousClose() : null;
                    BigDecimal changeAmount = (price != null && prevClose != null) ? price.subtract(prevClose) : null;
                    BigDecimal changePercent = (changeAmount != null && prevClose != null && prevClose.compareTo(BigDecimal.ZERO) != 0)
                            ? changeAmount.divide(prevClose, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                            : null;

                    results.add(StockQuoteDto.builder()
                            .symbol(stock.getSymbol())
                            .name(stock.getName())
                            .company(stock.getName())
                            .exchange(stock.getExchange())
                            .market(stock.getExchange())
                            .providerSymbol(stock.getProviderSymbol() != null ? stock.getProviderSymbol() : stock.getSymbol())
                            .sector(stock.getSector())
                            .currentPrice(price)
                            .price(price)
                            .previousClose(prevClose)
                            .changeAmount(changeAmount)
                            .change(changeAmount)
                            .changePercent(changePercent)
                            .dayHigh(stock.getDayHigh())
                            .dayLow(stock.getDayLow())
                            .volume(stock.getVolume())
                            .marketCap(stock.getMarketCap())
                            .peRatio(stock.getPeRatio())
                            .isDelayed(true)
                            .currency(stock.getExchange().equalsIgnoreCase("NASDAQ") ? "USD" : "INR")
                            .build());
                }
            }
        }

        if (!results.isEmpty()) {
            return results;
        }

        // 2. Check cached quotes
        for (CachedQuote cq : quoteCache.values()) {
            StockQuoteDto q = cq.quote();
            if (q.getSymbol().toUpperCase().contains(cleanQuery) ||
                (q.getName() != null && q.getName().toUpperCase().contains(cleanQuery))) {
                if (!results.contains(q)) {
                    results.add(q);
                }
            }
        }
        if (!results.isEmpty()) {
            return results;
        }

        // 3. Search via Twelve Data /symbol_search
        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            Map<String, Object> root = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/symbol_search")
                            .queryParam("symbol", cleanQuery)
                            .queryParam("apikey", apiKey.trim())
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (root != null && root.get("data") instanceof List<?> list) {
                List<StockQuoteDto> remoteResults = new ArrayList<>();
                for (Object item : list) {
                    if (item instanceof Map<?, ?> map) {
                        String s = getString((Map<String, Object>) map, "symbol", "");
                        String name = getString((Map<String, Object>) map, "instrument_name", s);
                        String ex = getString((Map<String, Object>) map, "exchange", "");
                        String cur = getString((Map<String, Object>) map, "currency", "USD");

                        remoteResults.add(StockQuoteDto.builder()
                                .symbol(s)
                                .name(name)
                                .company(name)
                                .exchange(ex)
                                .market(ex)
                                .providerSymbol(s)
                                .currency(cur)
                                .isDelayed(true)
                                .build());
                    }
                }
                return remoteResults;
            }

        } catch (Exception e) {
            log.warn("symbol_search call to Twelve Data failed: {}", e.getMessage());
        }

        // Direct quote attempt fallback
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

    @Override
    @SuppressWarnings("unchecked")
    public Optional<StockHistoryDto> getHistoricalPrices(String rawSymbol) {
        if (rawSymbol == null || rawSymbol.trim().isEmpty()) {
            return Optional.empty();
        }
        String clean = cleanSymbol(rawSymbol);
        String exchange = resolveExchange(rawSymbol);

        // 1. Check history cache
        CachedHistory cached = historyCache.get(clean);
        if (cached != null && !cached.isExpired(HISTORY_CACHE_TTL_MS)) {
            log.debug("Returning cached Twelve Data historical candles for symbol: {}", clean);
            return Optional.of(cached.history());
        }

        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Twelve Data API key is not configured for history");
            throw new MarketDataException("Twelve Data API key is not configured (TWELVE_DATA_API_KEY)");
        }

        log.info("Requesting historical time_series from Twelve Data for symbol: {} (exchange: {})", clean, exchange != null ? exchange : "DEFAULT");

        try {
            Map<String, Object> root = restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/time_series")
                                .queryParam("symbol", clean)
                                .queryParam("interval", "1day")
                                .queryParam("outputsize", 30)
                                .queryParam("apikey", apiKey.trim());
                        if (exchange != null && !exchange.isBlank() && !"NASDAQ".equalsIgnoreCase(exchange) && !"NYSE".equalsIgnoreCase(exchange)) {
                            uriBuilder.queryParam("exchange", exchange);
                        }
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (root == null || root.isEmpty()) {
                log.warn("Empty response received from Twelve Data history for symbol: {}", clean);
                return Optional.empty();
            }

            if (root.containsKey("code") || "error".equalsIgnoreCase(String.valueOf(root.get("status")))) {
                int code = root.get("code") instanceof Number num ? num.intValue() : 400;
                String message = sanitizeMessage(String.valueOf(root.getOrDefault("message", "Unknown Twelve Data error")));

                if (code == 429) {
                    log.warn("Twelve Data API rate limit reached (429) for history symbol: {}", clean);
                    if (cached != null) {
                        return Optional.of(cached.history());
                    }
                    throw new RateLimitExceededException("Twelve Data rate limit reached: " + message);
                }

                if (code == 404) {
                    log.info("Twelve Data history unavailable or requires higher tier for symbol {}: {}", clean, message);
                    if (cached != null) {
                        return Optional.of(cached.history());
                    }
                    return Optional.empty();
                }

                log.warn("Twelve Data history API response code {} for symbol {}: {}", code, clean, message);
                if (cached != null) {
                    return Optional.of(cached.history());
                }
                return Optional.empty();
            }

            Object valuesObj = root.get("values");
            if (!(valuesObj instanceof List<?> valuesList) || valuesList.isEmpty()) {
                log.info("No time series values returned by Twelve Data for symbol: {}", clean);
                return Optional.empty();
            }

            Map<String, Object> meta = (Map<String, Object>) root.getOrDefault("meta", Collections.emptyMap());
            String responseSymbol = getString(meta, "symbol", clean);
            String responseExchange = getString(meta, "exchange", exchange != null ? exchange : "UNKNOWN");
            String currency = getString(meta, "currency", "USD");
            String timeZone = getString(meta, "exchange_timezone", "America/New_York");

            List<HistoricalDataPointDto> candles = new ArrayList<>();
            for (Object obj : valuesList) {
                if (obj instanceof Map<?, ?> item) {
                    Map<String, Object> candleMap = (Map<String, Object>) item;
                    candles.add(HistoricalDataPointDto.builder()
                            .date(getString(candleMap, "datetime", ""))
                            .open(parseBigDecimal(candleMap.get("open")))
                            .high(parseBigDecimal(candleMap.get("high")))
                            .low(parseBigDecimal(candleMap.get("low")))
                            .close(parseBigDecimal(candleMap.get("close")))
                            .volume(parseLong(candleMap.get("volume")))
                            .build());
                }
            }

            String lastRefreshed = candles.isEmpty() ? null : candles.get(0).getDate();

            StockHistoryDto historyDto = StockHistoryDto.builder()
                    .symbol(responseSymbol)
                    .exchange(responseExchange)
                    .currency(currency)
                    .lastRefreshed(lastRefreshed)
                    .timeZone(timeZone)
                    .candles(candles)
                    .build();

            historyCache.put(clean, new CachedHistory(historyDto, System.currentTimeMillis()));
            return Optional.of(historyDto);

        } catch (RateLimitExceededException | MarketDataException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("Twelve Data HTTP error status {} for history: {}", e.getStatusCode(), clean);
            if (e.getStatusCode().value() == 429) {
                if (cached != null) {
                    return Optional.of(cached.history());
                }
                throw new RateLimitExceededException("Twelve Data rate limit reached: HTTP 429");
            }
            if (e.getStatusCode().value() == 404) {
                log.info("Twelve Data history unavailable or requires higher tier (404) for symbol: {}", clean);
                if (cached != null) {
                    return Optional.of(cached.history());
                }
                return Optional.empty();
            }
            throw new MarketDataException("Twelve Data HTTP error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Unexpected error fetching market history for symbol {}: {}", clean, e.getMessage());
            if (cached != null) {
                return Optional.of(cached.history());
            }
            throw new MarketDataException("Failed to fetch market history: " + e.getMessage(), e);
        }
    }

    private StockQuoteDto mapToStockQuoteDto(String cleanSymbol, String defaultExchange, Map<String, Object> map) {
        String name = getString(map, "name", cleanSymbol);
        String exchange = getString(map, "exchange", defaultExchange != null ? defaultExchange : "UNKNOWN");
        String currency = getString(map, "currency", "USD");
        String datetime = getString(map, "datetime", null);

        BigDecimal price = parseBigDecimal(map.get("close"));
        BigDecimal prevClose = parseBigDecimal(map.get("previous_close"));
        BigDecimal change = parseBigDecimal(map.get("change"));
        BigDecimal percentChange = parseBigDecimal(map.get("percent_change"));
        BigDecimal dayHigh = parseBigDecimal(map.get("high"));
        BigDecimal dayLow = parseBigDecimal(map.get("low"));
        Long volume = parseLong(map.get("volume"));

        Boolean isMarketOpen = map.get("is_market_open") instanceof Boolean b ? b : false;

        String sector = null;
        if (stockRepository != null) {
            Optional<Stock> stockOpt = stockRepository.findBySymbolIgnoreCase(cleanSymbol);
            if (stockOpt.isPresent()) {
                sector = stockOpt.get().getSector();
                if (name.equals(cleanSymbol) && stockOpt.get().getName() != null) {
                    name = stockOpt.get().getName();
                }
            }
        }

        return StockQuoteDto.builder()
                .symbol(cleanSymbol)
                .name(name)
                .company(name)
                .exchange(exchange)
                .market(exchange)
                .providerSymbol(cleanSymbol)
                .sector(sector)
                .currentPrice(price)
                .price(price)
                .previousClose(prevClose)
                .changeAmount(change)
                .change(change)
                .changePercent(percentChange)
                .dayHigh(dayHigh)
                .dayLow(dayLow)
                .volume(volume)
                .timestamp(datetime)
                .isDelayed(!isMarketOpen)
                .currency(currency)
                .build();
    }

    private String getString(Map<String, Object> map, String key, String defaultVal) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val).trim() : defaultVal;
    }

    private BigDecimal parseBigDecimal(Object val) {
        if (val == null) return null;
        try {
            String str = String.valueOf(val).trim().replace(",", "");
            if (str.isEmpty() || "None".equalsIgnoreCase(str) || "null".equalsIgnoreCase(str)) {
                return null;
            }
            return new BigDecimal(str);
        } catch (Exception e) {
            return null;
        }
    }

    private Long parseLong(Object val) {
        if (val == null) return null;
        try {
            String str = String.valueOf(val).trim().replace(",", "");
            if (str.isEmpty() || "None".equalsIgnoreCase(str) || "null".equalsIgnoreCase(str)) {
                return null;
            }
            return Long.parseLong(str);
        } catch (Exception e) {
            return null;
        }
    }

    private String sanitizeMessage(String message) {
        if (message == null) return "";
        String key = resolveApiKey();
        if (key != null && !key.isEmpty()) {
            return message.replace(key, "***REDACTED***");
        }
        return message;
    }

    private record CachedQuote(StockQuoteDto quote, long timestamp) {
        boolean isExpired(long ttlMs) {
            return (System.currentTimeMillis() - timestamp) > ttlMs;
        }
    }

    private record CachedHistory(StockHistoryDto history, long timestamp) {
        boolean isExpired(long ttlMs) {
            return (System.currentTimeMillis() - timestamp) > ttlMs;
        }
    }
}
