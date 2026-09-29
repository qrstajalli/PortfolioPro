package com.portfoliopro.auth.service;

import com.portfoliopro.auth.dto.AuthResponse;
import com.portfoliopro.auth.dto.LoginRequest;
import com.portfoliopro.auth.dto.RegisterRequest;
import com.portfoliopro.config.AppProperties;
import com.portfoliopro.exception.DuplicateEmailException;
import com.portfoliopro.exception.ResourceNotFoundException;
import com.portfoliopro.portfolio.entity.Portfolio;
import com.portfoliopro.portfolio.repository.PortfolioRepository;
import com.portfoliopro.security.jwt.JwtTokenProvider;
import com.portfoliopro.user.dto.UserDto;
import com.portfoliopro.user.entity.Role;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import com.portfoliopro.wallet.entity.Wallet;
import com.portfoliopro.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PortfolioRepository portfolioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AppProperties appProperties;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateEmailException("An account with email " + normalizedEmail + " already exists");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .username(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new user id={} email={}", savedUser.getId(), savedUser.getEmail());

        // Automatically allocate virtual wallet with default initial cash balance (₹1,00,000)
        Wallet wallet = Wallet.builder()
                .user(savedUser)
                .balance(appProperties.getPortfolio().getInitialCashBalance())
                .currency(appProperties.getPortfolio().getDefaultCurrency())
                .build();
        walletRepository.save(wallet);
        log.info("Created virtual wallet for user id={} with initial balance={}", savedUser.getId(), wallet.getBalance());

        // Initialize Phase 1 portfolio representation
        Portfolio portfolio = Portfolio.builder()
                .user(savedUser)
                .cashBalance(appProperties.getPortfolio().getInitialCashBalance())
                .currency(appProperties.getPortfolio().getDefaultCurrency())
                .build();
        portfolioRepository.save(portfolio);

        String token = jwtTokenProvider.generateToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInMs(jwtTokenProvider.getExpirationMs())
                .user(toUserDto(savedUser))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(user);
        log.info("User id={} email={} successfully logged in", user.getId(), user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresInMs(jwtTokenProvider.getExpirationMs())
                .user(toUserDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + normalizedEmail));

        return toUserDto(user);
    }

    public UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.getEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
