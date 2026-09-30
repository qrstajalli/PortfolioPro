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
 * Real Market Data Provider integrating Alpha Vantage API for live & historical equities.
 * Uses real Alpha Vantage API responses without substituting fabricated prices.
 */
@Slf4j
@Service
@Primary
public class AlphaVantageMarketDataProvider implements MarketDataProvider {

    private final AppProperties appProperties;
    private final RestClient restClient;
    private final StockRepository stockRepository;
    private final Map<String, CachedQuote> quoteCache = new ConcurrentHashMap<>();
    private final Map<String, CachedHistory> historyCache = new ConcurrentHashMap<>();

    // 5-minute TTL for quotes, 15-minute TTL for historical data to respect standard API limits
    private static final long QUOTE_CACHE_TTL_MS = 300_000L;
    private static final long HISTORY_CACHE_TTL_MS = 900_000L;

    @Autowired
    public AlphaVantageMarketDataProvider(AppProperties appProperties, @Autowired(required = false) StockRepository stockRepository) {
        this.appProperties = appProperties;
        this.stockRepository = stockRepository;
        this.restClient = RestClient.builder()
                .baseUrl(appProperties.getAlphaVantage().getBaseUrl())
                .build();
    }

    public AlphaVantageMarketDataProvider(AppProperties appProperties) {
        this(appProperties, null);
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

    private String resolveSymbolForAlphaVantage(String symbol) {
        String clean = symbol.trim().toUpperCase();
        if (stockRepository != null) {
            Optional<Stock> stockOpt = stockRepository.findBySymbolIgnoreCase(clean);
            if (stockOpt.isPresent() && stockOpt.get().getProviderSymbol() != null && !stockOpt.get().getProviderSymbol().isBlank()) {
                return stockOpt.get().getProviderSymbol();
            }
        }
        // Known Indian stocks listed on BSE on Alpha Vantage
        Set<String> indianStocks = Set.of("RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "LT");
        if (indianStocks.contains(clean) && !clean.contains(".")) {
            return clean + ".BSE";
        }
        return clean;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Optional<StockQuoteDto> getQuote(String symbol) {
        if (symbol == null || symbol.trim().isEmpty()) {
            return Optional.empty();
        }
        String cleanSymbol = symbol.trim().toUpperCase();
        String avSymbol = resolveSymbolForAlphaVantage(cleanSymbol);

        // Check cache for either symbol representation
        CachedQuote cached = quoteCache.get(cleanSymbol);
        if (cached == null && !cleanSymbol.equals(avSymbol)) {
            cached = quoteCache.get(avSymbol);
        }
        if (cached != null && !cached.isExpired(QUOTE_CACHE_TTL_MS)) {
            log.debug("Returning cached Alpha Vantage quote for symbol: {}", cleanSymbol);
            return Optional.of(cached.quote());
        }

        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Alpha Vantage API key is not configured");
            throw new MarketDataException("Alpha Vantage API key is not configured in environment (ALPHA_VANTAGE_API_KEY)");
        }

        log.info("Requesting live quote from Alpha Vantage for symbol: {}", avSymbol);

        try {
            Map<String, Object> root = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/query")
                            .queryParam("function", "GLOBAL_QUOTE")
                            .queryParam("symbol", avSymbol)
                            .queryParam("apikey", apiKey.trim())
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (root == null || root.isEmpty()) {
                log.warn("Empty response received from Alpha Vantage for symbol: {}", avSymbol);
                return Optional.empty();
            }

            if (root.containsKey("Note")) {
                String note = sanitizeMessage(String.valueOf(root.get("Note")));
                log.warn("Alpha Vantage API rate limit note received for symbol: {}", avSymbol);
                throw new RateLimitExceededException("Alpha Vantage rate limit reached: " + note);
            }

            if (root.containsKey("Information")) {
                String info = sanitizeMessage(String.valueOf(root.get("Information")));
                log.warn("Alpha Vantage API information notice received for symbol: {}", avSymbol);
                throw new RateLimitExceededException("Alpha Vantage rate limit reached: " + info);
            }

            if (root.containsKey("Error Message")) {
                String error = sanitizeMessage(String.valueOf(root.get("Error Message")));
                log.error("Alpha Vantage API error received for symbol {}: {}", avSymbol, error);
                throw new MarketDataException("Alpha Vantage API error: " + error);
            }

            Object quoteObj = root.get("Global Quote");
            if (!(quoteObj instanceof Map)) {
                log.info("No Global Quote data found for symbol: {}", avSymbol);
                return Optional.empty();
            }

            Map<String, Object> quoteMap = (Map<String, Object>) quoteObj;
            if (quoteMap.isEmpty()) {
                log.info("Empty Global Quote map returned for symbol: {}", avSymbol);
                return Optional.empty();
            }

            StockQuoteDto quoteDto = mapToStockQuoteDto(avSymbol, quoteMap);
            quoteCache.put(cleanSymbol, new CachedQuote(quoteDto, System.currentTimeMillis()));
            quoteCache.put(avSymbol, new CachedQuote(quoteDto, System.currentTimeMillis()));

            if (stockRepository != null) {
                stockRepository.findBySymbolIgnoreCase(cleanSymbol).ifPresent(s -> {
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
            log.error("Alpha Vantage HTTP error status {} for symbol: {}", e.getStatusCode(), avSymbol);
            throw new MarketDataException("Alpha Vantage HTTP error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Unexpected error fetching market quote for symbol {}: {}", avSymbol, e.getMessage());
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
            String provSymbol = stock.getProviderSymbol() != null ? stock.getProviderSymbol() : resolveSymbolForAlphaVantage(symbol);

            CachedQuote cq = quoteCache.get(symbol);
            if (cq == null && !symbol.equals(provSymbol)) {
                cq = quoteCache.get(provSymbol);
            }

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
                        .providerSymbol(provSymbol)
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
                String provSymbol = stock.getProviderSymbol() != null ? stock.getProviderSymbol() : resolveSymbolForAlphaVantage(symbol);

                CachedQuote cq = quoteCache.get(symbol);
                if (cq == null && !symbol.equals(provSymbol)) {
                    cq = quoteCache.get(provSymbol);
                }

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
                            .providerSymbol(provSymbol)
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

        // 2. Check existing cached quotes
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

        // 2. Query Alpha Vantage SYMBOL_SEARCH
        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            Map<String, Object> root = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/query")
                            .queryParam("function", "SYMBOL_SEARCH")
                            .queryParam("keywords", cleanQuery)
                            .queryParam("apikey", apiKey.trim())
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (root == null || root.isEmpty() || root.containsKey("Note") || root.containsKey("Information")) {
                return Collections.emptyList();
            }

            Object bestMatchesObj = root.get("bestMatches");
            if (bestMatchesObj instanceof List) {
                List<Map<String, Object>> matches = (List<Map<String, Object>>) bestMatchesObj;
                List<StockQuoteDto> remoteResults = new ArrayList<>();

                for (Map<String, Object> match : matches) {
                    String symbol = getString(match, "1. symbol", "");
                    String name = getString(match, "2. name", symbol);
                    String region = getString(match, "4. region", "");
                    String currency = getString(match, "8. currency", "INR");

                    String exchange = "NSE";
                    if (symbol.contains(".")) {
                        String[] parts = symbol.split("\\.");
                        if (parts.length >= 2) {
                            exchange = parts[1].toUpperCase();
                        }
                    } else if (region.toLowerCase().contains("united states")) {
                        exchange = "NASDAQ";
                    }

                    StockQuoteDto dto = StockQuoteDto.builder()
                            .symbol(symbol)
                            .name(name)
                            .company(name)
                            .exchange(exchange)
                            .market(exchange)
                            .currency(currency)
                            .isDelayed(true)
                            .build();

                    // If we have cached price data, attach it
                    CachedQuote cached = quoteCache.get(symbol.toUpperCase());
                    if (cached != null) {
                        dto.setCurrentPrice(cached.quote().getCurrentPrice());
                        dto.setPrice(cached.quote().getPrice());
                        dto.setChangeAmount(cached.quote().getChangeAmount());
                        dto.setChange(cached.quote().getChange());
                        dto.setChangePercent(cached.quote().getChangePercent());
                    }

                    remoteResults.add(dto);
                }
                return remoteResults;
            }

        } catch (Exception e) {
            log.warn("SYMBOL_SEARCH call to Alpha Vantage failed: {}", e.getMessage());
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
    public Optional<StockHistoryDto> getHistoricalPrices(String symbol) {
        if (symbol == null || symbol.trim().isEmpty()) {
            return Optional.empty();
        }
        String cleanSymbol = symbol.trim().toUpperCase();
        String avSymbol = resolveSymbolForAlphaVantage(cleanSymbol);

        // Check history cache
        CachedHistory cached = historyCache.get(cleanSymbol);
        if (cached == null && !cleanSymbol.equals(avSymbol)) {
            cached = historyCache.get(avSymbol);
        }
        if (cached != null && !cached.isExpired(HISTORY_CACHE_TTL_MS)) {
            log.debug("Returning cached historical candles for symbol: {}", cleanSymbol);
            return Optional.of(cached.history());
        }

        String apiKey = resolveApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("Alpha Vantage API key is not configured for history");
            throw new MarketDataException("Alpha Vantage API key is not configured (ALPHA_VANTAGE_API_KEY)");
        }

        log.info("Requesting historical daily series from Alpha Vantage for symbol: {}", avSymbol);

        try {
            Map<String, Object> root = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/query")
                            .queryParam("function", "TIME_SERIES_DAILY")
                            .queryParam("symbol", avSymbol)
                            .queryParam("apikey", apiKey.trim())
                            .build())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (root == null || root.isEmpty()) {
                log.warn("Empty response received from Alpha Vantage history for symbol: {}", avSymbol);
                return Optional.empty();
            }

            if (root.containsKey("Note")) {
                String note = sanitizeMessage(String.valueOf(root.get("Note")));
                log.warn("Alpha Vantage API rate limit note received for history symbol: {}", avSymbol);
                throw new RateLimitExceededException("Alpha Vantage rate limit reached: " + note);
            }

            if (root.containsKey("Information")) {
                String info = sanitizeMessage(String.valueOf(root.get("Information")));
                log.warn("Alpha Vantage API information notice received for history symbol: {}", avSymbol);
                throw new RateLimitExceededException("Alpha Vantage rate limit reached: " + info);
            }

            if (root.containsKey("Error Message")) {
                String error = sanitizeMessage(String.valueOf(root.get("Error Message")));
                log.error("Alpha Vantage API error for history symbol {}: {}", avSymbol, error);
                throw new MarketDataException("Alpha Vantage API error: " + error);
            }

            Object timeSeriesObj = root.get("Time Series (Daily)");
            if (!(timeSeriesObj instanceof Map)) {
                log.info("No Time Series (Daily) found for symbol: {}", avSymbol);
                return Optional.empty();
            }

            Map<String, Map<String, Object>> timeSeries = (Map<String, Map<String, Object>>) timeSeriesObj;
            if (timeSeries.isEmpty()) {
                return Optional.empty();
            }

            List<HistoricalDataPointDto> candles = new ArrayList<>();
            for (Map.Entry<String, Map<String, Object>> entry : timeSeries.entrySet()) {
                String date = entry.getKey();
                Map<String, Object> dayData = entry.getValue();

                BigDecimal open = parseBigDecimal(dayData.get("1. open"));
                BigDecimal high = parseBigDecimal(dayData.get("2. high"));
                BigDecimal low = parseBigDecimal(dayData.get("3. low"));
                BigDecimal close = parseBigDecimal(dayData.get("4. close"));
                Long volume = parseLong(dayData.get("5. volume"));

                candles.add(HistoricalDataPointDto.builder()
                        .date(date)
                        .open(open)
                        .high(high)
                        .low(low)
                        .close(close)
                        .volume(volume)
                        .build());
            }

            // Sort chronologically ascending (oldest first)
            candles.sort(Comparator.comparing(HistoricalDataPointDto::getDate));

            Map<String, Object> metaData = (Map<String, Object>) root.get("Meta Data");
            String lastRefreshed = metaData != null ? getString(metaData, "3. Last Refreshed", "") : "";
            String timeZone = metaData != null ? getString(metaData, "5. Time Zone", "Asia/Kolkata") : "Asia/Kolkata";

            String exchange = "BSE";
            if (avSymbol.contains(".")) {
                String[] p = avSymbol.split("\\.");
                if (p.length >= 2) exchange = p[1].toUpperCase();
            }

            StockHistoryDto historyDto = StockHistoryDto.builder()
                    .symbol(cleanSymbol)
                    .exchange(exchange)
                    .currency("INR")
                    .lastRefreshed(lastRefreshed)
                    .timeZone(timeZone)
                    .candles(candles)
                    .build();

            historyCache.put(cleanSymbol, new CachedHistory(historyDto, System.currentTimeMillis()));
            historyCache.put(avSymbol, new CachedHistory(historyDto, System.currentTimeMillis()));

            return Optional.of(historyDto);

        } catch (RateLimitExceededException | MarketDataException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("Alpha Vantage HTTP error status {} for history symbol: {}", e.getStatusCode(), avSymbol);
            throw new MarketDataException("Alpha Vantage HTTP error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Unexpected error fetching historical data for symbol {}: {}", avSymbol, e.getMessage());
            throw new MarketDataException("Failed to fetch historical market data: " + e.getMessage(), e);
        }
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
        String latestTradingDay = getString(quoteMap, "07. latest trading day", "");

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
        } else if ("TCS.BSE".equalsIgnoreCase(symbol) || "TCS".equalsIgnoreCase(name)) {
            name = "Tata Consultancy Services";
        } else if ("INFY.BSE".equalsIgnoreCase(symbol) || "INFY".equalsIgnoreCase(name)) {
            name = "Infosys Ltd";
        } else if ("HDFCBANK.BSE".equalsIgnoreCase(symbol) || "HDFCBANK".equalsIgnoreCase(name)) {
            name = "HDFC Bank Ltd";
        } else if ("ICICIBANK.BSE".equalsIgnoreCase(symbol) || "ICICIBANK".equalsIgnoreCase(name)) {
            name = "ICICI Bank Ltd";
        }

        return StockQuoteDto.builder()
                .symbol(symbol)
                .name(name)
                .company(name)
                .exchange(exchange)
                .market(exchange)
                .currentPrice(currentPrice)
                .price(currentPrice)
                .previousClose(prevClose)
                .changeAmount(changeAmount)
                .change(changeAmount)
                .changePercent(changePercent)
                .dayHigh(dayHigh)
                .dayLow(dayLow)
                .volume(volume)
                .timestamp(latestTradingDay)
                .isDelayed(true)
                .currency("INR")
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

    private String sanitizeMessage(String raw) {
        if (raw == null) {
            return "";
        }
        String key = resolveApiKey();
        String sanitized = raw;
        if (key != null && !key.isBlank()) {
            sanitized = sanitized.replace(key, "[REDACTED]");
        }
        return sanitized.replaceAll("(?i)(api[_-]?key\\s+(?:as\\s+)?|apikey=)[a-zA-Z0-9]+", "$1[REDACTED]");
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

    private record CachedHistory(StockHistoryDto history, long timestamp) {
        boolean isExpired(long ttlMs) {
            return System.currentTimeMillis() - timestamp > ttlMs;
        }
    }
}
