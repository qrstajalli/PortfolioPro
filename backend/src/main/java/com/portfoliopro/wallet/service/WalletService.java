package com.portfoliopro.wallet.service;

import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.ResourceNotFoundException;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import com.portfoliopro.wallet.dto.WalletDto;
import com.portfoliopro.wallet.entity.Wallet;
import com.portfoliopro.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Transactional
    public WalletDto getWalletByUserEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));

        Wallet wallet = walletRepository.findByUser(user)
                .orElseGet(() -> {
                    log.warn("Wallet not found for user id={}, creating default wallet", user.getId());
                    Wallet newWallet = Wallet.builder()
                            .user(user)
                            .balance(appProperties.getPortfolio().getInitialCashBalance())
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

    private WalletDto toDto(Wallet wallet) {
        return WalletDto.builder()
                .id(wallet.getId())
                .userId(wallet.getUser().getId())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .version(wallet.getVersion())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}
