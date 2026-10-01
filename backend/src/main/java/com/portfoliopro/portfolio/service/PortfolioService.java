package com.portfoliopro.portfolio.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.ResourceNotFoundException;
import com.portfoliopro.market.dto.StockQuoteDto;
import com.portfoliopro.market.entity.Stock;
import com.portfoliopro.market.service.MarketDataProvider;
import com.portfoliopro.portfolio.dto.HoldingDto;
import com.portfoliopro.portfolio.dto.PortfolioDto;
import com.portfoliopro.portfolio.entity.Holding;
import com.portfoliopro.portfolio.entity.Portfolio;
import com.portfoliopro.portfolio.entity.PortfolioSnapshot;
import com.portfoliopro.portfolio.repository.HoldingRepository;
import com.portfoliopro.portfolio.repository.PortfolioRepository;
import com.portfoliopro.portfolio.repository.PortfolioSnapshotRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final HoldingRepository holdingRepository;
    private final PortfolioSnapshotRepository portfolioSnapshotRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final MarketDataProvider marketDataProvider;
    private final AppProperties appProperties;

    @Transactional
    public PortfolioDto getPortfolioByUserEmail(String email) {
        User user = getUserByEmail(email);
        Portfolio portfolio = getOrCreateUserPortfolio(user);

        List<Holding> holdings = holdingRepository.findByPortfolioId(portfolio.getId());
        List<HoldingDto> holdingDtos = new ArrayList<>();

        BigDecimal totalInvestedValue = BigDecimal.ZERO; // Current market value of all holdings
        BigDecimal totalCostBasis = BigDecimal.ZERO;     // Total amount invested to buy holdings

        for (Holding holding : holdings) {
            if (holding.getQuantity() == null || holding.getQuantity() <= 0) {
                continue;
            }

            Stock stock = holding.getStock();
            String symbol = stock.getSymbol();
            Optional<StockQuoteDto> quoteOpt = marketDataProvider.getQuote(symbol);

            BigDecimal currentPrice;
            String currency = "USD";
            if (quoteOpt.isPresent() && quoteOpt.get().getCurrentPrice() != null) {
                currentPrice = quoteOpt.get().getCurrentPrice();
                if (quoteOpt.get().getCurrency() != null) {
                    currency = quoteOpt.get().getCurrency();
                }
            } else if (stock.getCurrentPrice() != null && stock.getCurrentPrice().compareTo(BigDecimal.ZERO) > 0) {
                currentPrice = stock.getCurrentPrice();
            } else {
                currentPrice = holding.getAverageBuyPrice();
            }

            BigDecimal qty = BigDecimal.valueOf(holding.getQuantity());
            BigDecimal currentValue = currentPrice.multiply(qty).setScale(4, RoundingMode.HALF_UP);
            BigDecimal costBasis = holding.getTotalInvested() != null
                    ? holding.getTotalInvested()
                    : holding.getAverageBuyPrice().multiply(qty).setScale(4, RoundingMode.HALF_UP);

            BigDecimal pnl = currentValue.subtract(costBasis);
            BigDecimal pnlPercent = costBasis.compareTo(BigDecimal.ZERO) > 0
                    ? pnl.divide(costBasis, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;

            totalInvestedValue = totalInvestedValue.add(currentValue);
            totalCostBasis = totalCostBasis.add(costBasis);

            HoldingDto hDto = HoldingDto.builder()
                    .id(holding.getId())
                    .symbol(symbol)
                    .name(stock.getName())
                    .exchange(stock.getExchange())
                    .quantity(holding.getQuantity())
                    .averageBuyPrice(holding.getAverageBuyPrice())
                    .totalInvested(costBasis)
                    .currentPrice(currentPrice)
                    .currentValue(currentValue)
                    .pnl(pnl)
                    .pnlPercent(pnlPercent)
                    .allocation(BigDecimal.ZERO) // Will calculate below
                    .currency(currency)
                    .build();

            holdingDtos.add(hDto);
        }

        // Calculate allocation percentages
        if (totalInvestedValue.compareTo(BigDecimal.ZERO) > 0) {
            for (HoldingDto dto : holdingDtos) {
                BigDecimal alloc = dto.getCurrentValue()
                        .divide(totalInvestedValue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
                dto.setAllocation(alloc);
            }
        }

        // Cash balance from portfolio or wallet
        BigDecimal cashBalance = portfolio.getCashBalance();
        if (cashBalance == null) {
            cashBalance = walletRepository.findByUser(user)
                    .map(Wallet::getBalance)
                    .orElse(BigDecimal.ZERO);
        }

        BigDecimal netWorth = cashBalance.add(totalInvestedValue);
        BigDecimal unrealizedPnL = totalInvestedValue.subtract(totalCostBasis);
        BigDecimal unrealizedPnLPercent = totalCostBasis.compareTo(BigDecimal.ZERO) > 0
                ? unrealizedPnL.divide(totalCostBasis, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        return PortfolioDto.builder()
                .id(portfolio.getId())
                .userId(user.getId())
                .cashBalance(cashBalance)
                .investedValue(totalInvestedValue)
                .totalCostBasis(totalCostBasis)
                .totalNetWorth(netWorth)
                .unrealizedPnL(unrealizedPnL)
                .unrealizedPnLPercent(unrealizedPnLPercent)
                .activePositions(holdingDtos.size())
                .currency(portfolio.getCurrency() != null ? portfolio.getCurrency() : "INR")
                .holdings(holdingDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PortfolioSnapshot> getPortfolioHistory(String email) {
        User user = getUserByEmail(email);
        Optional<Portfolio> portfolioOpt = portfolioRepository.findByUser(user);
        if (portfolioOpt.isEmpty()) {
            return List.of();
        }
        return portfolioSnapshotRepository.findByPortfolioIdOrderBySnapshotTimeAsc(portfolioOpt.get().getId());
    }

    private User getUserByEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));
    }

    private Portfolio getOrCreateUserPortfolio(User user) {
        return portfolioRepository.findByUser(user)
                .orElseGet(() -> {
                    BigDecimal initialBal = walletRepository.findByUser(user)
                            .map(Wallet::getBalance)
                            .orElse(BigDecimal.ZERO);

                    Portfolio p = Portfolio.builder()
                            .user(user)
                            .cashBalance(initialBal)
                            .initialCapital(initialBal)
                            .currency(appProperties.getPortfolio().getDefaultCurrency())
                            .build();
                    return portfolioRepository.save(p);
                });
    }
}
