package com.portfoliopro.auth.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.portfolio.entity.Portfolio;
import com.portfoliopro.portfolio.repository.PortfolioRepository;
import com.portfoliopro.user.entity.Role;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import com.portfoliopro.wallet.entity.Wallet;
import com.portfoliopro.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LegacyUserMigrationService implements ApplicationRunner {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PortfolioRepository portfolioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        migrateLegacyUserIfNotExists("Tajalli", "qrstajalli@gmail.com", new BigDecimal("50000.00"));
        migrateLegacyUserIfNotExists("Tajalli us Samad", "tajalliussamad.2017@gmail.com", new BigDecimal("100000.00"));
        migrateLegacyUserIfNotExists("Jasminum", "jasminum9026200305@gmail.com", new BigDecimal("500000.00"));
    }

    private void migrateLegacyUserIfNotExists(String name, String email, BigDecimal startingCapital) {
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            return;
        }

        // Set an unguessable migration hash requiring password reset to access
        String unguessableMigrationHash = passwordEncoder.encode("MIGRATED_LEGACY_ACCOUNT_" + UUID.randomUUID());

        User user = User.builder()
                .name(name)
                .email(normalizedEmail)
                .username(normalizedEmail)
                .passwordHash(unguessableMigrationHash)
                .role(Role.ROLE_USER)
                .enabled(true)
                .build();
        User savedUser = userRepository.save(user);

        Wallet wallet = Wallet.builder()
                .user(savedUser)
                .balance(startingCapital)
                .initialBalance(startingCapital)
                .isConfigured(true)
                .currency(appProperties.getPortfolio().getDefaultCurrency())
                .build();
        walletRepository.save(wallet);

        Portfolio portfolio = Portfolio.builder()
                .user(savedUser)
                .cashBalance(startingCapital)
                .initialCapital(startingCapital)
                .currency(appProperties.getPortfolio().getDefaultCurrency())
                .build();
        portfolioRepository.save(portfolio);

        log.info("Migrated legacy user [REDACTED_EMAIL] id={} with capital={}", savedUser.getId(), startingCapital);
    }
}
