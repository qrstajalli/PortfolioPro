package com.portfoliopro.watchlist.service;

import com.portfoliopro.market.dto.StockQuoteDto;
import com.portfoliopro.market.entity.Stock;
import com.portfoliopro.market.repository.StockRepository;
import com.portfoliopro.market.service.MarketDataProvider;
import com.portfoliopro.user.entity.Role;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import com.portfoliopro.watchlist.dto.WatchlistItemDto;
import com.portfoliopro.watchlist.entity.Watchlist;
import com.portfoliopro.watchlist.entity.WatchlistItem;
import com.portfoliopro.watchlist.repository.WatchlistItemRepository;
import com.portfoliopro.watchlist.repository.WatchlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WatchlistServiceTest {

    @Mock
    private WatchlistRepository watchlistRepository;

    @Mock
    private WatchlistItemRepository watchlistItemRepository;

    @Mock
    private StockRepository stockRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MarketDataProvider marketDataProvider;

    @InjectMocks
    private WatchlistService watchlistService;

    private User testUser;
    private Watchlist testWatchlist;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(2L)
                .email("investor@portfoliopro.com")
                .name("Investor")
                .role(Role.ROLE_USER)
                .build();

        testWatchlist = Watchlist.builder()
                .id(20L)
                .user(testUser)
                .name("Default Watchlist")
                .build();
    }

    @Test
    @DisplayName("Should return empty list when user has empty watchlist")
    void testGetEmptyWatchlist() {
        when(userRepository.findByEmail("investor@portfoliopro.com")).thenReturn(Optional.of(testUser));
        when(watchlistRepository.findFirstByUserId(2L)).thenReturn(Optional.of(testWatchlist));
        when(watchlistItemRepository.findByWatchlistId(20L)).thenReturn(List.of());

        List<WatchlistItemDto> items = watchlistService.getWatchlist("investor@portfoliopro.com");

        assertThat(items).isEmpty();
    }

    @Test
    @DisplayName("Should return user watchlist enriched with Twelve Data quotes")
    void testGetWatchlistEnriched() {
        Stock stock = Stock.builder()
                .id(200L)
                .symbol("NVDA")
                .name("NVIDIA Corporation")
                .exchange("NASDAQ")
                .sector("Technology")
                .build();

        WatchlistItem item = WatchlistItem.builder()
                .id(30L)
                .watchlist(testWatchlist)
                .stock(stock)
                .build();

        when(userRepository.findByEmail("investor@portfoliopro.com")).thenReturn(Optional.of(testUser));
        when(watchlistRepository.findFirstByUserId(2L)).thenReturn(Optional.of(testWatchlist));
        when(watchlistItemRepository.findByWatchlistId(20L)).thenReturn(List.of(item));

        StockQuoteDto quote = StockQuoteDto.builder()
                .symbol("NVDA")
                .currentPrice(new BigDecimal("125.5000"))
                .changeAmount(new BigDecimal("3.2000"))
                .changePercent(new BigDecimal("2.6165"))
                .currency("USD")
                .build();
        when(marketDataProvider.getQuote("NVDA")).thenReturn(Optional.of(quote));

        List<WatchlistItemDto> items = watchlistService.getWatchlist("investor@portfoliopro.com");

        assertThat(items).hasSize(1);
        assertThat(items.get(0).getSymbol()).isEqualTo("NVDA");
        assertThat(items.get(0).getCurrentPrice()).isEqualByComparingTo("125.5000");
        assertThat(items.get(0).getChangeAmount()).isEqualByComparingTo("3.2000");
    }
}
