package com.portfoliopro.trade.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.BadRequestException;
import com.portfoliopro.market.dto.StockQuoteDto;
import com.portfoliopro.market.entity.Stock;
import com.portfoliopro.market.repository.StockRepository;
import com.portfoliopro.market.service.MarketDataProvider;
import com.portfoliopro.portfolio.entity.Holding;
import com.portfoliopro.portfolio.entity.Portfolio;
import com.portfoliopro.portfolio.repository.HoldingRepository;
import com.portfoliopro.portfolio.repository.PortfolioRepository;
import com.portfoliopro.trade.dto.OrderDto;
import com.portfoliopro.trade.dto.TradeOrderRequest;
import com.portfoliopro.trade.entity.Order;
import com.portfoliopro.trade.entity.OrderStatus;
import com.portfoliopro.trade.entity.Transaction;
import com.portfoliopro.trade.repository.OrderRepository;
import com.portfoliopro.trade.repository.TransactionRepository;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TradeServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StockRepository stockRepository;

    @Mock
    private HoldingRepository holdingRepository;

    @Mock
    private PortfolioRepository portfolioRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private MarketDataProvider marketDataProvider;

    @Mock
    private AppProperties appProperties;

    @InjectMocks
    private TradeService tradeService;

    private User testUser;
    private Wallet testWallet;
    private Portfolio testPortfolio;
    private Stock testStock;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("trader@portfoliopro.com")
                .name("Pro Trader")
                .build();

        testWallet = Wallet.builder()
                .id(1L)
                .user(testUser)
                .balance(new BigDecimal("50000.0000"))
                .initialBalance(new BigDecimal("50000.0000"))
                .currency("USD")
                .build();

        testPortfolio = Portfolio.builder()
                .id(1L)
                .user(testUser)
                .cashBalance(new BigDecimal("50000.0000"))
                .currency("USD")
                .build();

        testStock = Stock.builder()
                .id(1L)
                .symbol("AAPL")
                .name("Apple Inc.")
                .exchange("NASDAQ")
                .currentPrice(new BigDecimal("200.00"))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("executeOrder successfully executes BUY order when cash is sufficient")
    void executeOrder_BuySuccess() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(stockRepository.findBySymbolIgnoreCase("AAPL")).thenReturn(Optional.of(testStock));
        when(marketDataProvider.getQuote("AAPL")).thenReturn(Optional.of(StockQuoteDto.builder()
                .symbol("AAPL")
                .currentPrice(new BigDecimal("200.00"))
                .build()));
        when(walletRepository.findByUser(testUser)).thenReturn(Optional.of(testWallet));
        when(portfolioRepository.findByUser(testUser)).thenReturn(Optional.of(testPortfolio));
        when(holdingRepository.findByPortfolioIdAndStockId(testPortfolio.getId(), testStock.getId())).thenReturn(Optional.empty());

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(holdingRepository.save(any(Holding.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(portfolioRepository.save(any(Portfolio.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TradeOrderRequest req = new TradeOrderRequest();
        req.setSymbol("AAPL");
        req.setSide("BUY");
        req.setQuantity(10L);
        req.setOrderType("MARKET");

        OrderDto result = tradeService.executeOrder(testUser.getEmail(), req);

        assertThat(result).isNotNull();
        assertThat(result.getSymbol()).isEqualTo("AAPL");
        assertThat(result.getSide()).isEqualTo("BUY");
        assertThat(result.getQuantity()).isEqualTo(10L);
        assertThat(result.getExecutionPrice()).isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(result.getTotalAmount()).isEqualByComparingTo(new BigDecimal("2000.00"));
        assertThat(result.getOrderStatus()).isEqualTo(OrderStatus.EXECUTED.name());

        // Verify balance decreased: 50,000 - 2,000 = 48,000
        assertThat(testWallet.getBalance()).isEqualByComparingTo(new BigDecimal("48000.0000"));
        assertThat(testPortfolio.getCashBalance()).isEqualByComparingTo(new BigDecimal("48000.0000"));
    }

    @Test
    @DisplayName("executeOrder throws BadRequestException when buying with insufficient virtual cash")
    void executeOrder_BuyInsufficientCash() {
        testWallet.setBalance(new BigDecimal("500.00"));
        testPortfolio.setCashBalance(new BigDecimal("500.00"));

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(stockRepository.findBySymbolIgnoreCase("AAPL")).thenReturn(Optional.of(testStock));
        when(marketDataProvider.getQuote("AAPL")).thenReturn(Optional.of(StockQuoteDto.builder()
                .symbol("AAPL")
                .currentPrice(new BigDecimal("200.00"))
                .build()));
        when(walletRepository.findByUser(testUser)).thenReturn(Optional.of(testWallet));
        when(portfolioRepository.findByUser(testUser)).thenReturn(Optional.of(testPortfolio));

        TradeOrderRequest req = new TradeOrderRequest();
        req.setSymbol("AAPL");
        req.setSide("BUY");
        req.setQuantity(10L); // costs 2000 > 500

        assertThatThrownBy(() -> tradeService.executeOrder(testUser.getEmail(), req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient funds");
    }

    @Test
    @DisplayName("executeOrder throws BadRequestException when selling with insufficient holdings")
    void executeOrder_SellInsufficientHolding() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(stockRepository.findBySymbolIgnoreCase("AAPL")).thenReturn(Optional.of(testStock));
        when(marketDataProvider.getQuote("AAPL")).thenReturn(Optional.of(StockQuoteDto.builder()
                .symbol("AAPL")
                .currentPrice(new BigDecimal("200.00"))
                .build()));
        when(walletRepository.findByUser(testUser)).thenReturn(Optional.of(testWallet));
        when(portfolioRepository.findByUser(testUser)).thenReturn(Optional.of(testPortfolio));
        when(holdingRepository.findByPortfolioIdAndStockId(testPortfolio.getId(), testStock.getId())).thenReturn(Optional.empty());

        TradeOrderRequest req = new TradeOrderRequest();
        req.setSymbol("AAPL");
        req.setSide("SELL");
        req.setQuantity(5L);

        assertThatThrownBy(() -> tradeService.executeOrder(testUser.getEmail(), req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("You do not own any shares of AAPL to sell");
    }
}
