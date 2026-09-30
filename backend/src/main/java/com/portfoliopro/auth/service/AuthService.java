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

import java.math.BigDecimal;

import com.portfoliopro.auth.dto.ForgotPasswordRequest;
import com.portfoliopro.auth.dto.ResetPasswordRequest;
import com.portfoliopro.auth.entity.PasswordResetToken;
import com.portfoliopro.auth.repository.PasswordResetTokenRepository;
import com.portfoliopro.email.service.EmailService;
import com.portfoliopro.exception.BadRequestException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

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
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

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

        BigDecimal startingCapital = request.getInitialCapital() != null && request.getInitialCapital().compareTo(BigDecimal.ZERO) > 0
                ? request.getInitialCapital()
                : BigDecimal.ZERO;
        boolean isConfigured = request.getInitialCapital() != null && request.getInitialCapital().compareTo(BigDecimal.ZERO) > 0;

        // Allocate virtual wallet with user-chosen starting capital
        Wallet wallet = Wallet.builder()
                .user(savedUser)
                .balance(startingCapital)
                .initialBalance(startingCapital)
                .isConfigured(isConfigured)
                .currency(appProperties.getPortfolio().getDefaultCurrency())
                .build();
        walletRepository.save(wallet);
        log.info("Created virtual wallet for user id={} with initial balance={}", savedUser.getId(), wallet.getBalance());

        // Initialize portfolio representation with configured capital
        Portfolio portfolio = Portfolio.builder()
                .user(savedUser)
                .cashBalance(startingCapital)
                .initialCapital(startingCapital)
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
                .authProvider(user.getAuthProvider())
                .imageUrl(user.getImageUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public User processGoogleOAuthUser(String googleSub, String email, String name, String picture) {
        if (googleSub == null || googleSub.isBlank()) {
            throw new BadRequestException("Google subject identifier (sub) is missing");
        }

        String normalizedEmail = email != null ? email.trim().toLowerCase() : null;

        // 1. Try finding by stable Google Sub identifier
        Optional<User> userBySub = userRepository.findByGoogleSub(googleSub);
        if (userBySub.isPresent()) {
            User existingUser = userBySub.get();
            boolean updated = false;
            if (name != null && !name.isBlank() && !name.equals(existingUser.getName())) {
                existingUser.setName(name);
                updated = true;
            }
            if (picture != null && !picture.isBlank() && !picture.equals(existingUser.getImageUrl())) {
                existingUser.setImageUrl(picture);
                updated = true;
            }
            if (updated) {
                existingUser = userRepository.save(existingUser);
            }
            log.info("Google OAuth login for existing user id={} googleSub={}", existingUser.getId(), googleSub);
            return existingUser;
        }

        // 2. Not found by googleSub: check if an existing account has this email
        if (normalizedEmail != null) {
            Optional<User> userByEmail = userRepository.findByEmail(normalizedEmail);
            if (userByEmail.isPresent()) {
                User existingUser = userByEmail.get();
                if (existingUser.getGoogleSub() != null && !existingUser.getGoogleSub().equals(googleSub)) {
                    log.warn("Account conflict: email {} already linked to googleSub={}", normalizedEmail, existingUser.getGoogleSub());
                    throw new DuplicateEmailException("This email is already associated with another Google account.");
                }

                existingUser.setGoogleSub(googleSub);
                if (existingUser.getAuthProvider() == null || "LOCAL".equalsIgnoreCase(existingUser.getAuthProvider())) {
                    existingUser.setAuthProvider("GOOGLE_AND_LOCAL");
                }
                if (picture != null && !picture.isBlank() && existingUser.getImageUrl() == null) {
                    existingUser.setImageUrl(picture);
                }
                User savedUser = userRepository.save(existingUser);
                log.info("Safely linked Google OAuth identity (sub={}) to existing user id={} email={}",
                        googleSub, savedUser.getId(), normalizedEmail);
                return savedUser;
            }
        }

        // 3. Brand new user via Google OAuth
        String effectiveName = (name != null && !name.isBlank()) ? name.trim() : (normalizedEmail != null ? normalizedEmail.split("@")[0] : "Google User");
        String effectiveUsername = normalizedEmail != null ? normalizedEmail : "google_" + googleSub;

        User newUser = User.builder()
                .name(effectiveName)
                .email(normalizedEmail)
                .username(effectiveUsername)
                .googleSub(googleSub)
                .authProvider("GOOGLE")
                .imageUrl(picture)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(Role.ROLE_USER)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(newUser);
        log.info("Registered new user via Google OAuth id={} email={} googleSub={}", savedUser.getId(), normalizedEmail, googleSub);

        // Allocate virtual wallet (INR 0 unconfigured initial balance)
        Wallet wallet = Wallet.builder()
                .user(savedUser)
                .balance(BigDecimal.ZERO)
                .initialBalance(BigDecimal.ZERO)
                .isConfigured(false)
                .currency(appProperties.getPortfolio().getDefaultCurrency())
                .build();
        walletRepository.save(wallet);

        // Initialize portfolio
        Portfolio portfolio = Portfolio.builder()
                .user(savedUser)
                .cashBalance(BigDecimal.ZERO)
                .initialCapital(BigDecimal.ZERO)
                .currency(appProperties.getPortfolio().getDefaultCurrency())
                .build();
        portfolioRepository.save(portfolio);

        return savedUser;
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email [REDACTED]");
            return;
        }

        User user = userOpt.get();
        // Invalidate any existing unused reset tokens for this user
        passwordResetTokenRepository.invalidateActiveTokensForUser(user);

        // Generate cryptographically secure random token (64 hex characters)
        String rawToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .tokenHash(tokenHash)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        passwordResetTokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String rawToken = request.getToken().trim();
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHashAndUsedFalse(tokenHash)
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset token"));

        if (resetToken.isExpired()) {
            resetToken.setUsed(true);
            passwordResetTokenRepository.save(resetToken);
            throw new BadRequestException("Password reset token has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        log.info("Password successfully reset for user id={}", user.getId());
    }

    public String getDevResetToken(String email) {
        return emailService.getLatestDevResetToken(email);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
