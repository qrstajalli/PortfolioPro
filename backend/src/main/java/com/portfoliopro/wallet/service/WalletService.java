package com.portfoliopro.wallet.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.BadRequestException;
import com.portfoliopro.exception.ResourceNotFoundException;
import com.portfoliopro.portfolio.entity.Portfolio;
import com.portfoliopro.portfolio.repository.PortfolioRepository;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import com.portfoliopro.wallet.dto.WalletDto;
import com.portfoliopro.wallet.entity.Wallet;
import com.portfoliopro.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final PortfolioRepository portfolioRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Transactional
    public WalletDto getWalletByUserEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        Wallet wallet = walletRepository.findByUser(user)
                .orElseGet(() -> {
                    log.info("Wallet not found for user id={}, creating unconfigured wallet", user.getId());
                    Wallet newWallet = Wallet.builder()
                            .user(user)
                            .balance(BigDecimal.ZERO)
                            .initialBalance(BigDecimal.ZERO)
                            .isConfigured(false)
                            .currency(appProperties.getPortfolio().getDefaultCurrency())
                            .build();
                    return walletRepository.save(newWallet);
                });

        return toDto(wallet);
    }

    @Transactional(readOnly = true)
    public WalletDto getWalletByUserId(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user id: " + userId));

        return toDto(wallet);
    }

    @Transactional
    public WalletDto setupCapital(String email, BigDecimal initialCapital) {
        if (initialCapital == null || initialCapital.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Virtual starting capital must be greater than zero");
        }
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        Wallet wallet = walletRepository.findByUser(user)
                .orElseGet(() -> Wallet.builder()
                        .user(user)
                        .currency(appProperties.getPortfolio().getDefaultCurrency())
                        .build());

        wallet.setBalance(initialCapital);
        wallet.setInitialBalance(initialCapital);
        wallet.setIsConfigured(true);
        Wallet savedWallet = walletRepository.save(wallet);

        // Keep Portfolio cash balance and initial capital in sync
        Portfolio portfolio = portfolioRepository.findByUser(user)
                .orElseGet(() -> Portfolio.builder()
                        .user(user)
                        .currency(appProperties.getPortfolio().getDefaultCurrency())
                        .build());
        portfolio.setCashBalance(initialCapital);
        portfolio.setInitialCapital(initialCapital);
        portfolioRepository.save(portfolio);

        log.info("User id={} successfully configured virtual capital to {}", user.getId(), initialCapital);
        return toDto(savedWallet);
    }

    private WalletDto toDto(Wallet wallet) {
        BigDecimal balance = wallet.getBalance() != null ? wallet.getBalance() : BigDecimal.ZERO;
        BigDecimal initialBal = wallet.getInitialBalance() != null ? wallet.getInitialBalance() : balance;
        boolean configured = Boolean.TRUE.equals(wallet.getIsConfigured()) || balance.compareTo(BigDecimal.ZERO) > 0;

        return WalletDto.builder()
                .id(wallet.getId())
                .userId(wallet.getUser().getId())
                .balance(balance)
                .initialBalance(initialBal)
                .isConfigured(configured)
                .currency(wallet.getCurrency())
                .version(wallet.getVersion())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}
