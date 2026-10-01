package com.portfoliopro.watchlist.service;

import com.portfoliopro.exception.BadRequestException;
import com.portfoliopro.exception.ResourceNotFoundException;
import com.portfoliopro.market.dto.StockQuoteDto;
import com.portfoliopro.market.entity.Stock;
import com.portfoliopro.market.repository.StockRepository;
import com.portfoliopro.market.service.MarketDataProvider;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import com.portfoliopro.watchlist.dto.WatchlistItemDto;
import com.portfoliopro.watchlist.entity.Watchlist;
import com.portfoliopro.watchlist.entity.WatchlistItem;
import com.portfoliopro.watchlist.repository.WatchlistItemRepository;
import com.portfoliopro.watchlist.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final WatchlistItemRepository watchlistItemRepository;
    private final StockRepository stockRepository;
    private final UserRepository userRepository;
    private final MarketDataProvider marketDataProvider;

    @Transactional
    public List<WatchlistItemDto> getWatchlist(String email) {
        User user = getUserByEmail(email);
        Watchlist watchlist = getOrCreateUserWatchlist(user);

        List<WatchlistItem> items = watchlistItemRepository.findByWatchlistId(watchlist.getId());
        List<WatchlistItemDto> result = new ArrayList<>();

        for (WatchlistItem item : items) {
            Stock stock = item.getStock();
            String symbol = stock.getSymbol();
            Optional<StockQuoteDto> quoteOpt = marketDataProvider.getQuote(symbol);

            WatchlistItemDto.WatchlistItemDtoBuilder builder = WatchlistItemDto.builder()
                    .id(item.getId())
                    .symbol(symbol)
                    .name(stock.getName())
                    .exchange(stock.getExchange())
                    .sector(stock.getSector())
                    .addedAt(item.getCreatedAt());

            if (quoteOpt.isPresent()) {
                StockQuoteDto q = quoteOpt.get();
                builder.currentPrice(q.getCurrentPrice() != null ? q.getCurrentPrice() : q.getPrice())
                        .changeAmount(q.getChangeAmount() != null ? q.getChangeAmount() : q.getChange())
                        .changePercent(q.getChangePercent())
                        .dayLow(q.getDayLow())
                        .dayHigh(q.getDayHigh())
                        .volume(q.getVolume())
                        .peRatio(q.getPeRatio())
                        .currency(q.getCurrency() != null ? q.getCurrency() : "USD");
            } else {
                builder.currentPrice(stock.getCurrentPrice())
                        .changeAmount(stock.getCurrentPrice() != null && stock.getPreviousClose() != null
                                ? stock.getCurrentPrice().subtract(stock.getPreviousClose()) : null)
                        .dayLow(stock.getDayLow())
                        .dayHigh(stock.getDayHigh())
                        .volume(stock.getVolume())
                        .peRatio(stock.getPeRatio())
                        .currency("USD");
            }

            result.add(builder.build());
        }

        return result;
    }

    @Transactional
    public void addToWatchlist(String email, String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new BadRequestException("Symbol cannot be empty");
        }
        String cleanSymbol = symbol.trim().toUpperCase();
        User user = getUserByEmail(email);
        Watchlist watchlist = getOrCreateUserWatchlist(user);

        Stock stock = stockRepository.findBySymbolIgnoreCase(cleanSymbol)
                .orElseGet(() -> {
                    // Try to resolve from market data provider
                    Optional<StockQuoteDto> quoteOpt = marketDataProvider.getQuote(cleanSymbol);
                    if (quoteOpt.isPresent()) {
                        StockQuoteDto q = quoteOpt.get();
                        Stock newStock = Stock.builder()
                                .symbol(cleanSymbol)
                                .name(q.getName() != null ? q.getName() : cleanSymbol)
                                .exchange(q.getExchange() != null ? q.getExchange() : "NASDAQ")
                                .sector(q.getSector() != null ? q.getSector() : "Technology")
                                .currentPrice(q.getCurrentPrice() != null ? q.getCurrentPrice() : q.getPrice())
                                .previousClose(q.getPreviousClose())
                                .dayHigh(q.getDayHigh())
                                .dayLow(q.getDayLow())
                                .volume(q.getVolume())
                                .peRatio(q.getPeRatio())
                                .isActive(true)
                                .build();
                        return stockRepository.save(newStock);
                    }
                    throw new ResourceNotFoundException("Stock not found with symbol: " + cleanSymbol);
                });

        if (!watchlistItemRepository.existsByWatchlistIdAndStockId(watchlist.getId(), stock.getId())) {
            WatchlistItem item = WatchlistItem.builder()
                    .watchlist(watchlist)
                    .stock(stock)
                    .build();
            watchlistItemRepository.save(item);
            log.info("Added {} to watchlist for user {}", cleanSymbol, user.getEmail());
        }
    }

    @Transactional
    public void removeFromWatchlist(String email, String symbol) {
        if (symbol == null || symbol.isBlank()) {
            throw new BadRequestException("Symbol cannot be empty");
        }
        String cleanSymbol = symbol.trim().toUpperCase();
        User user = getUserByEmail(email);
        Watchlist watchlist = getOrCreateUserWatchlist(user);

        stockRepository.findBySymbolIgnoreCase(cleanSymbol).ifPresent(stock -> {
            watchlistItemRepository.deleteByWatchlistIdAndStockId(watchlist.getId(), stock.getId());
            log.info("Removed {} from watchlist for user {}", cleanSymbol, user.getEmail());
        });
    }

    private User getUserByEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));
    }

    private Watchlist getOrCreateUserWatchlist(User user) {
        return watchlistRepository.findFirstByUserId(user.getId())
                .orElseGet(() -> {
                    Watchlist wl = Watchlist.builder()
                            .user(user)
                            .name("Default Watchlist")
                            .build();
                    return watchlistRepository.save(wl);
                });
    }
}
