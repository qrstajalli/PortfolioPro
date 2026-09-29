package com.portfoliopro.market.service;

import com.portfoliopro.market.dto.StockQuoteDto;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class MockMarketDataProvider implements MarketDataProvider {

    private final Map<String, StockQuoteDto> quoteCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void initSeedData() {
        seedQuote("RELIANCE", "Reliance Industries Ltd", "NSE", "Energy",
                new BigDecimal("2980.50"), new BigDecimal("2945.00"),
                new BigDecimal("3010.00"), new BigDecimal("2930.00"),
                14500000L, new BigDecimal("20150000000000"), new BigDecimal("28.4"));

        seedQuote("TCS", "Tata Consultancy Services", "NSE", "Information Technology",
                new BigDecimal("4210.75"), new BigDecimal("4180.00"),
                new BigDecimal("4245.00"), new BigDecimal("4160.00"),
                8200000L, new BigDecimal("15200000000000"), new BigDecimal("32.1"));

        seedQuote("HDFCBANK", "HDFC Bank Ltd", "NSE", "Financial Services",
                new BigDecimal("1650.20"), new BigDecimal("1665.00"),
                new BigDecimal("1670.00"), new BigDecimal("1640.00"),
                18900000L, new BigDecimal("12500000000000"), new BigDecimal("19.5"));

        seedQuote("INFY", "Infosys Ltd", "NSE", "Information Technology",
                new BigDecimal("1890.30"), new BigDecimal("1860.50"),
                new BigDecimal("1905.00"), new BigDecimal("1850.00"),
                12400000L, new BigDecimal("7800000000000"), new BigDecimal("27.3"));

        seedQuote("ICICIBANK", "ICICI Bank Ltd", "NSE", "Financial Services",
                new BigDecimal("1220.80"), new BigDecimal("1205.00"),
                new BigDecimal("1230.00"), new BigDecimal("1198.00"),
                11200000L, new BigDecimal("8600000000000"), new BigDecimal("18.2"));

        seedQuote("AAPL", "Apple Inc.", "NASDAQ", "Technology",
                new BigDecimal("230.50"), new BigDecimal("228.00"),
                new BigDecimal("232.00"), new BigDecimal("227.50"),
                45000000L, new BigDecimal("3500000000000"), new BigDecimal("34.2"));

        seedQuote("MSFT", "Microsoft Corporation", "NASDAQ", "Technology",
                new BigDecimal("445.20"), new BigDecimal("448.00"),
                new BigDecimal("450.00"), new BigDecimal("442.10"),
                22000000L, new BigDecimal("3300000000000"), new BigDecimal("36.8"));

        seedQuote("NVDA", "NVIDIA Corporation", "NASDAQ", "Semiconductors",
                new BigDecimal("128.40"), new BigDecimal("124.50"),
                new BigDecimal("130.00"), new BigDecimal("123.80"),
                89000000L, new BigDecimal("3150000000000"), new BigDecimal("55.4"));
    }

    private void seedQuote(String symbol, String name, String exchange, String sector,
                           BigDecimal currentPrice, BigDecimal previousClose,
                           BigDecimal dayHigh, BigDecimal dayLow,
                           Long volume, BigDecimal marketCap, BigDecimal peRatio) {
        BigDecimal changeAmount = currentPrice.subtract(previousClose);
        BigDecimal changePercent = changeAmount
                .divide(previousClose, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);

        StockQuoteDto quote = StockQuoteDto.builder()
                .symbol(symbol.toUpperCase())
                .name(name)
                .exchange(exchange)
                .sector(sector)
                .currentPrice(currentPrice)
                .previousClose(previousClose)
                .changeAmount(changeAmount)
                .changePercent(changePercent)
                .dayHigh(dayHigh)
                .dayLow(dayLow)
                .volume(volume)
                .marketCap(marketCap)
                .peRatio(peRatio)
                .build();

        quoteCache.put(symbol.toUpperCase(), quote);
    }

    @Override
    public Optional<StockQuoteDto> getQuote(String symbol) {
        if (symbol == null) return Optional.empty();
        return Optional.ofNullable(quoteCache.get(symbol.toUpperCase()));
    }

    @Override
    public List<StockQuoteDto> getAllQuotes() {
        return new ArrayList<>(quoteCache.values());
    }

    @Override
    public List<StockQuoteDto> searchStocks(String query) {
        if (query == null || query.isBlank()) {
            return getAllQuotes();
        }
        String q = query.trim().toLowerCase();
        return quoteCache.values().stream()
                .filter(quote -> quote.getSymbol().toLowerCase().contains(q) ||
                                 quote.getName().toLowerCase().contains(q) ||
                                 (quote.getSector() != null && quote.getSector().toLowerCase().contains(q)))
                .collect(Collectors.toList());
    }

    @Override
    public List<StockQuoteDto> getQuotesBySector(String sector) {
        if (sector == null || sector.isBlank()) {
            return Collections.emptyList();
        }
        return quoteCache.values().stream()
                .filter(quote -> sector.equalsIgnoreCase(quote.getSector()))
                .collect(Collectors.toList());
    }
}
