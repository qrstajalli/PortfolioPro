package com.portfoliopro.trade.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.BadRequestException;
import com.portfoliopro.exception.ResourceNotFoundException;
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
import com.portfoliopro.trade.dto.TransactionDto;
import com.portfoliopro.trade.entity.Order;
import com.portfoliopro.trade.entity.OrderStatus;
import com.portfoliopro.trade.entity.OrderType;
import com.portfoliopro.trade.entity.Transaction;
import com.portfoliopro.trade.entity.TransactionType;
import com.portfoliopro.trade.repository.OrderRepository;
import com.portfoliopro.trade.repository.TransactionRepository;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import com.portfoliopro.wallet.entity.Wallet;
import com.portfoliopro.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TradeService {

    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final HoldingRepository holdingRepository;
    private final PortfolioRepository portfolioRepository;
    private final WalletRepository walletRepository;
    private final MarketDataProvider marketDataProvider;
    private final AppProperties appProperties;

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByUserEmail(String email) {
        User user = getUserByEmail(email);
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        return orders.stream().map(order -> OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .symbol(order.getStock() != null ? order.getStock().getSymbol() : "UNKNOWN")
                .name(order.getStock() != null ? order.getStock().getName() : "")
                .exchange(order.getStock() != null ? order.getStock().getExchange() : "")
                .side(order.getOrderType() != null ? order.getOrderType().name() : "BUY")
                .orderType(order.getOrderType() != null ? order.getOrderType().name() : "MARKET")
                .orderStatus(order.getOrderStatus() != null ? order.getOrderStatus().name() : "PENDING")
                .quantity(order.getQuantity())
                .executionPrice(order.getExecutionPrice())
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .executedAt(order.getExecutedAt())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionDto> getTransactionsByUserEmail(String email) {
        User user = getUserByEmail(email);
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByTransactionTimeDesc(user.getId());

        return transactions.stream().map(tx -> TransactionDto.builder()
                .id(tx.getId())
                .transactionReference(tx.getTransactionReference())
                .symbol(tx.getSymbol() != null ? tx.getSymbol() : (tx.getStock() != null ? tx.getStock().getSymbol() : ""))
                .name(tx.getStock() != null ? tx.getStock().getName() : "")
                .exchange(tx.getStock() != null ? tx.getStock().getExchange() : "")
                .type(tx.getType() != null ? tx.getType().name() : "")
                .quantity(tx.getQuantity())
                .price(tx.getPrice())
                .amount(tx.getAmount())
                .balanceAfter(tx.getBalanceAfter())
                .description(tx.getDescription())
                .transactionTime(tx.getTransactionTime())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public OrderDto executeOrder(String email, TradeOrderRequest request) {
        if (request.getSymbol() == null || request.getSymbol().isBlank()) {
            throw new BadRequestException("Symbol cannot be empty");
        }
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new BadRequestException("Quantity must be greater than zero");
        }
        String side = request.getSide() != null ? request.getSide().trim().toUpperCase() : "BUY";
        if (!"BUY".equals(side) && !"SELL".equals(side)) {
            throw new BadRequestException("Invalid side: " + side + ". Must be BUY or SELL.");
        }
        String symbol = request.getSymbol().trim().toUpperCase();

        User user = getUserByEmail(email);

        // Fetch or dynamically create Stock entity
        Stock stock = stockRepository.findBySymbolIgnoreCase(symbol)
                .orElseGet(() -> {
                    Optional<StockQuoteDto> quoteOpt = marketDataProvider.getQuote(symbol);
                    if (quoteOpt.isPresent()) {
                        StockQuoteDto q = quoteOpt.get();
                        Stock newStock = Stock.builder()
                                .symbol(symbol)
                                .name(q.getName() != null ? q.getName() : symbol)
                                .exchange(q.getExchange() != null ? q.getExchange() : "NASDAQ")
                                .sector(q.getSector() != null ? q.getSector() : "Equities")
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
                    throw new ResourceNotFoundException("Stock quote unavailable for symbol: " + symbol);
                });

        // Resolve real current price from Twelve Data
        BigDecimal executionPrice;
        Optional<StockQuoteDto> liveQuoteOpt = marketDataProvider.getQuote(symbol);
        if (liveQuoteOpt.isPresent() && liveQuoteOpt.get().getCurrentPrice() != null && liveQuoteOpt.get().getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
            executionPrice = liveQuoteOpt.get().getCurrentPrice();
        } else if (stock.getCurrentPrice() != null && stock.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
            executionPrice = stock.getCurrentPrice();
        } else if (request.getLimitPrice() != null && request.getLimitPrice().compareTo(BigDecimal.ZERO) > 0) {
            executionPrice = request.getLimitPrice();
        } else {
            throw new BadRequestException("Live market price is currently unavailable for " + symbol + ".");
        }

        // Resolve user's Wallet
        Wallet wallet = walletRepository.findByUser(user)
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .user(user)
                            .balance(new BigDecimal("100000.0000"))
                            .initialBalance(new BigDecimal("100000.0000"))
                            .isConfigured(true)
                            .currency(appProperties.getPortfolio().getDefaultCurrency())
                            .build();
                    return walletRepository.save(w);
                });

        // Resolve user's Portfolio
        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseGet(() -> {
                    Portfolio p = Portfolio.builder()
                            .user(user)
                            .cashBalance(wallet.getBalance())
                            .initialCapital(wallet.getInitialBalance())
                            .currency(wallet.getCurrency())
                            .build();
                    return portfolioRepository.save(p);
                });

        BigDecimal totalAmount = executionPrice.multiply(BigDecimal.valueOf(request.getQuantity())).setScale(4, RoundingMode.HALF_UP);

        if ("BUY".equals(side)) {
            // Check available cash
            if (wallet.getBalance().compareTo(totalAmount) < 0) {
                throw new BadRequestException(String.format("Insufficient funds. Required: %s, Available Cash: %s",
                        totalAmount.setScale(2, RoundingMode.HALF_UP),
                        wallet.getBalance().setScale(2, RoundingMode.HALF_UP)));
            }

            // Deduct funds
            wallet.setBalance(wallet.getBalance().subtract(totalAmount));
            portfolio.setCashBalance(wallet.getBalance());
            walletRepository.save(wallet);
            portfolioRepository.save(portfolio);

            // Update or create Holding
            Optional<Holding> holdingOpt = holdingRepository.findByPortfolioIdAndStockId(portfolio.getId(), stock.getId());
            if (holdingOpt.isPresent()) {
                Holding holding = holdingOpt.get();
                long newQty = holding.getQuantity() + request.getQuantity();
                BigDecimal newInvested = (holding.getTotalInvested() != null ? holding.getTotalInvested() : BigDecimal.ZERO).add(totalAmount);
                BigDecimal newAvgBuyPrice = newInvested.divide(BigDecimal.valueOf(newQty), 4, RoundingMode.HALF_UP);

                holding.setQuantity(newQty);
                holding.setTotalInvested(newInvested);
                holding.setAverageBuyPrice(newAvgBuyPrice);
                holdingRepository.save(holding);
            } else {
                Holding newHolding = Holding.builder()
                        .portfolio(portfolio)
                        .stock(stock)
                        .quantity(request.getQuantity())
                        .averageBuyPrice(executionPrice)
                        .totalInvested(totalAmount)
                        .build();
                holdingRepository.save(newHolding);
            }
        } else {
            // SELL
            Holding holding = holdingRepository.findByPortfolioIdAndStockId(portfolio.getId(), stock.getId())
                    .orElseThrow(() -> new BadRequestException("You do not own any shares of " + symbol + " to sell."));

            if (holding.getQuantity() < request.getQuantity()) {
                throw new BadRequestException(String.format("Insufficient shares to sell. Owned: %d, Requested: %d",
                        holding.getQuantity(), request.getQuantity()));
            }

            // Add proceeds to cash
            wallet.setBalance(wallet.getBalance().add(totalAmount));
            portfolio.setCashBalance(wallet.getBalance());
            walletRepository.save(wallet);
            portfolioRepository.save(portfolio);

            // Update holding
            long remainingQty = holding.getQuantity() - request.getQuantity();
            if (remainingQty == 0) {
                holdingRepository.delete(holding);
            } else {
                BigDecimal remainingInvested = holding.getAverageBuyPrice().multiply(BigDecimal.valueOf(remainingQty)).setScale(4, RoundingMode.HALF_UP);
                holding.setQuantity(remainingQty);
                holding.setTotalInvested(remainingInvested);
                holdingRepository.save(holding);
            }
        }

        // Create Order
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .portfolio(portfolio)
                .stock(stock)
                .orderType("SELL".equals(side) ? OrderType.SELL : OrderType.BUY)
                .orderStatus(OrderStatus.EXECUTED)
                .quantity(request.getQuantity())
                .executionPrice(executionPrice)
                .totalAmount(totalAmount)
                .notes("Paper trade executed via TradingView terminal")
                .executedAt(Instant.now())
                .build();
        Order savedOrder = orderRepository.save(order);

        // Create Transaction
        String txnRef = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction transaction = Transaction.builder()
                .transactionReference(txnRef)
                .portfolio(portfolio)
                .user(user)
                .order(savedOrder)
                .stock(stock)
                .symbol(symbol)
                .type("SELL".equals(side) ? TransactionType.SELL : TransactionType.BUY)
                .quantity(request.getQuantity())
                .price(executionPrice)
                .amount(totalAmount)
                .balanceAfter(wallet.getBalance())
                .description(("SELL".equals(side) ? "Sold " : "Bought ") + request.getQuantity() + " shares of " + symbol + " @ " + executionPrice)
                .transactionTime(Instant.now())
                .build();
        transactionRepository.save(transaction);

        log.info("User {} executed paper trade: {} {} shares of {} at {}", email, side, request.getQuantity(), symbol, executionPrice);

        return OrderDto.builder()
                .id(savedOrder.getId())
                .orderNumber(savedOrder.getOrderNumber())
                .symbol(symbol)
                .name(stock.getName())
                .exchange(stock.getExchange())
                .side(side)
                .orderType("MARKET")
                .orderStatus("EXECUTED")
                .quantity(request.getQuantity())
                .executionPrice(executionPrice)
                .totalAmount(totalAmount)
                .notes(savedOrder.getNotes())
                .createdAt(savedOrder.getCreatedAt())
                .executedAt(savedOrder.getExecutedAt())
                .build();
    }

    private User getUserByEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));
    }
}
