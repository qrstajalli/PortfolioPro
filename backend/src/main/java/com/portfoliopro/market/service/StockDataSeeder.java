package com.portfoliopro.market.service;

import com.portfoliopro.market.entity.Instrument;
import com.portfoliopro.market.entity.Stock;
import com.portfoliopro.market.repository.InstrumentRepository;
import com.portfoliopro.market.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class StockDataSeeder implements ApplicationRunner {

    private final StockRepository stockRepository;
    private final InstrumentRepository instrumentRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedStockUniverse();
    }

    public void seedStockUniverse() {
        List<StockSeedDefinition> definitions = List.of(
                new StockSeedDefinition("RELIANCE", "Reliance Industries Limited", "BSE", "RELIANCE.BSE", "Energy", "Oil & Gas Refining & Marketing"),
                new StockSeedDefinition("TCS", "Tata Consultancy Services Limited", "BSE", "TCS.BSE", "Information Technology", "IT Consulting & Software"),
                new StockSeedDefinition("HDFCBANK", "HDFC Bank Limited", "BSE", "HDFCBANK.BSE", "Financial Services", "Private Sector Bank"),
                new StockSeedDefinition("INFY", "Infosys Limited", "BSE", "INFY.BSE", "Information Technology", "IT Consulting & Software"),
                new StockSeedDefinition("ICICIBANK", "ICICI Bank Limited", "BSE", "ICICIBANK.BSE", "Financial Services", "Private Sector Bank"),
                new StockSeedDefinition("SBIN", "State Bank of India", "BSE", "SBIN.BSE", "Financial Services", "Public Sector Bank"),
                new StockSeedDefinition("BHARTIARTL", "Bharti Airtel Limited", "BSE", "BHARTIARTL.BSE", "Telecommunications", "Telecom Services"),
                new StockSeedDefinition("ITC", "ITC Limited", "BSE", "ITC.BSE", "Consumer Goods", "Diversified FMCG"),
                new StockSeedDefinition("KOTAKBANK", "Kotak Mahindra Bank Limited", "BSE", "KOTAKBANK.BSE", "Financial Services", "Private Sector Bank"),
                new StockSeedDefinition("LT", "Larsen & Toubro Limited", "BSE", "LT.BSE", "Industrials", "Engineering & Construction"),
                new StockSeedDefinition("AAPL", "Apple Inc.", "NASDAQ", "AAPL", "Technology", "Consumer Electronics"),
                new StockSeedDefinition("MSFT", "Microsoft Corporation", "NASDAQ", "MSFT", "Technology", "Software - Infrastructure"),
                new StockSeedDefinition("NVDA", "NVIDIA Corporation", "NASDAQ", "NVDA", "Technology", "Semiconductors")
        );

        int newStocks = 0;
        int newInstruments = 0;

        for (StockSeedDefinition def : definitions) {
            if (!stockRepository.existsBySymbol(def.symbol())) {
                Stock stock = Stock.builder()
                        .symbol(def.symbol())
                        .name(def.name())
                        .exchange(def.exchange())
                        .providerSymbol(def.providerSymbol())
                        .sector(def.sector())
                        .industry(def.industry())
                        .currentPrice(BigDecimal.ZERO)
                        .previousClose(BigDecimal.ZERO)
                        .isActive(true)
                        .build();
                stockRepository.save(stock);
                newStocks++;
            } else {
                stockRepository.findBySymbol(def.symbol()).ifPresent(existing -> {
                    boolean changed = false;
                    if (existing.getProviderSymbol() == null || !existing.getProviderSymbol().equals(def.providerSymbol())) {
                        existing.setProviderSymbol(def.providerSymbol());
                        changed = true;
                    }
                    if (existing.getSector() == null || !existing.getSector().equals(def.sector())) {
                        existing.setSector(def.sector());
                        changed = true;
                    }
                    if (changed) {
                        stockRepository.save(existing);
                    }
                });
            }

            if (!instrumentRepository.existsBySymbol(def.symbol())) {
                Instrument instrument = Instrument.builder()
                        .symbol(def.symbol())
                        .tradingSymbol(def.providerSymbol())
                        .name(def.name())
                        .exchange(def.exchange())
                        .instrumentType("EQUITY")
                        .segment(def.exchange().equalsIgnoreCase("NASDAQ") ? "US_EQ" : "EQ")
                        .lotSize(1)
                        .tickSize(new BigDecimal("0.0500"))
                        .lastPrice(BigDecimal.ZERO)
                        .isActive(true)
                        .build();
                instrumentRepository.save(instrument);
                newInstruments++;
            }
        }

        if (newStocks > 0 || newInstruments > 0) {
            log.info("StockDataSeeder successfully initialized {} stocks and {} instruments in the database.", newStocks, newInstruments);
        } else {
            log.info("Stock universe verified ({} stocks, {} instruments in database).", stockRepository.count(), instrumentRepository.count());
        }
    }

    private record StockSeedDefinition(
            String symbol,
            String name,
            String exchange,
            String providerSymbol,
            String sector,
            String industry
    ) {}
}
