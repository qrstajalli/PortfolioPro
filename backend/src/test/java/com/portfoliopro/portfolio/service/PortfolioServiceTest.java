package com.portfoliopro.portfolio.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.market.dto.StockQuoteDto;
import com.portfoliopro.market.entity.Stock;
import com.portfoliopro.market.service.MarketDataProvider;
import com.portfoliopro.portfolio.dto.PortfolioDto;
import com.portfoliopro.portfolio.entity.Holding;
import com.portfoliopro.portfolio.entity.Portfolio;
import com.portfoliopro.portfolio.repository.HoldingRepository;
import com.portfoliopro.portfolio.repository.PortfolioRepository;
import com.portfoliopro.portfolio.repository.PortfolioSnapshotRepository;
import com.portfoliopro.user.entity.Role;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import com.portfoliopro.wallet.entity.Wallet;
import com.portfoliopro.wallet.repository.WalletRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PortfolioServiceTest {

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private HoldingRepository holdingRepository;

    @Mock
    private PortfolioSnapshotRepository portfolioSnapshotRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private MarketDataProvider marketDataProvider;

    @Mock
    private AppProperties appProperties;

    @InjectMocks
    private PortfolioService portfolioService;

    private User testUser;
    private Portfolio testPortfolio;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("trader@portfoliopro.com")
                .name("Pro Trader")
                .role(Role.ROLE_USER)
                .build();

        testPortfolio = Portfolio.builder()
                .id(10L)
                .user(testUser)
                .cashBalance(new BigDecimal("100000.0000"))
                .currency("INR")
                .build();
    }

    @Test
    @DisplayName("Should return clean zero-state portfolio when user has never traded")
    void testGetPortfolioNeverTraded() {
        when(userRepository.findByEmail("trader@portfoliopro.com")).thenReturn(Optional.of(testUser));
        when(portfolioRepository.findByUser(testUser)).thenReturn(Optional.of(testPortfolio));
        when(holdingRepository.findByPortfolioId(10L)).thenReturn(List.of());

        PortfolioDto dto = portfolioService.getPortfolioByUserEmail("trader@portfoliopro.com");

        assertThat(dto).isNotNull();
        assertThat(dto.getCashBalance()).isEqualByComparingTo("100000.0000");
        assertThat(dto.getInvestedValue()).isEqualByComparingTo("0");
        assertThat(dto.getTotalNetWorth()).isEqualByComparingTo("100000.0000");
        assertThat(dto.getUnrealizedPnL()).isEqualByComparingTo("0");
        assertThat(dto.getUnrealizedPnLPercent()).isEqualByComparingTo("0");
        assertThat(dto.getActivePositions()).isEqualTo(0);
        assertThat(dto.getHoldings()).isEmpty();
    }

    @Test
    @DisplayName("Should calculate accurate invested value and PnL with Twelve Data quote")
    void testGetPortfolioWithHoldingsAndLiveQuote() {
        Stock stock = Stock.builder()
                .id(100L)
                .symbol("AAPL")
                .name("Apple Inc.")
                .exchange("NASDAQ")
                .build();

        Holding holding = Holding.builder()
                .id(50L)
                .portfolio(testPortfolio)
                .stock(stock)
                .quantity(10L)
                .averageBuyPrice(new BigDecimal("150.0000"))
                .totalInvested(new BigDecimal("1500.0000"))
                .build();

        when(userRepository.findByEmail("trader@portfoliopro.com")).thenReturn(Optional.of(testUser));
        when(portfolioRepository.findByUser(testUser)).thenReturn(Optional.of(testPortfolio));
        when(holdingRepository.findByPortfolioId(10L)).thenReturn(List.of(holding));

        // Mock Twelve Data quote at $200.00
        StockQuoteDto quote = StockQuoteDto.builder()
                .symbol("AAPL")
                .currentPrice(new BigDecimal("200.0000"))
                .currency("USD")
                .build();
        when(marketDataProvider.getQuote("AAPL")).thenReturn(Optional.of(quote));

        PortfolioDto dto = portfolioService.getPortfolioByUserEmail("trader@portfoliopro.com");

        assertThat(dto).isNotNull();
        assertThat(dto.getActivePositions()).isEqualTo(1);
        assertThat(dto.getHoldings()).hasSize(1);

        // 10 * 200 = 2000 current value
        assertThat(dto.getInvestedValue()).isEqualByComparingTo("2000.0000");
        // Cost basis = 1500, PnL = 500
        assertThat(dto.getUnrealizedPnL()).isEqualByComparingTo("500.0000");
        // Net worth = 100,000 cash + 2000 holdings = 102,000
        assertThat(dto.getTotalNetWorth()).isEqualByComparingTo("102000.0000");
    }
}
