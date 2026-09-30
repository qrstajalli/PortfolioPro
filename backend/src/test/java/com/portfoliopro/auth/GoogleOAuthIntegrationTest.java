package com.portfoliopro.auth;

import com.portfoliopro.auth.dto.RegisterRequest;
import com.portfoliopro.auth.service.AuthService;
import com.portfoliopro.exception.DuplicateEmailException;
import com.portfoliopro.portfolio.entity.Portfolio;
import com.portfoliopro.portfolio.repository.PortfolioRepository;
import com.portfoliopro.security.jwt.JwtTokenProvider;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import com.portfoliopro.wallet.entity.Wallet;
import com.portfoliopro.wallet.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("local-h2")
public class GoogleOAuthIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("Should create brand new user, wallet, and portfolio on first-time Google OAuth login")
    void testFirstTimeGoogleOAuthUserCreation() {
        String googleSub = "google_sub_1010101";
        String email = "googleuser@test.com";
        String name = "Google Tester";
        String picture = "https://lh3.googleusercontent.com/a/photo123";

        User user = authService.processGoogleOAuthUser(googleSub, email, name, picture);

        assertThat(user).isNotNull();
        assertThat(user.getId()).isNotNull();
        assertThat(user.getGoogleSub()).isEqualTo(googleSub);
        assertThat(user.getEmail()).isEqualTo(email);
        assertThat(user.getName()).isEqualTo(name);
        assertThat(user.getImageUrl()).isEqualTo(picture);
        assertThat(user.getAuthProvider()).isEqualTo("GOOGLE");
        assertThat(user.getEnabled()).isTrue();

        // Verify wallet created
        Optional<Wallet> walletOpt = walletRepository.findByUserId(user.getId());
        assertThat(walletOpt).isPresent();

        // Verify portfolio created
        Optional<Portfolio> portfolioOpt = portfolioRepository.findByUserId(user.getId());
        assertThat(portfolioOpt).isPresent();
    }

    @Test
    @DisplayName("Should be idempotent and update profile when existing Google user logs in again")
    void testExistingGoogleOAuthUserLogin() {
        String googleSub = "google_sub_2020202";
        String email = "returning@test.com";

        User firstLogin = authService.processGoogleOAuthUser(googleSub, email, "Old Name", "http://old-pic.com");
        Long originalUserId = firstLogin.getId();

        // Second login with updated name and picture
        User secondLogin = authService.processGoogleOAuthUser(googleSub, email, "New Name", "http://new-pic.com");

        assertThat(secondLogin.getId()).isEqualTo(originalUserId);
        assertThat(secondLogin.getName()).isEqualTo("New Name");
        assertThat(secondLogin.getImageUrl()).isEqualTo("http://new-pic.com");

        // Verify no duplicate users created
        Optional<User> found = userRepository.findByGoogleSub(googleSub);
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(originalUserId);
    }

    @Test
    @DisplayName("Should safely link Google identity to existing local email/password account preserving data")
    void testLinkGoogleToExistingLocalAccount() {
        String localEmail = "existinglocal@test.com";
        RegisterRequest registerRequest = RegisterRequest.builder()
                .name("Local Trader")
                .email(localEmail)
                .password("Password123!")
                .initialCapital(new BigDecimal("100000.00"))
                .build();
        authService.register(registerRequest);

        User localUserBefore = userRepository.findByEmail(localEmail).orElseThrow();
        Long originalUserId = localUserBefore.getId();
        Wallet walletBefore = walletRepository.findByUserId(originalUserId).orElseThrow();
        assertThat(localUserBefore.getGoogleSub()).isNull();
        assertThat(localUserBefore.getAuthProvider()).isEqualTo("LOCAL");

        // User logs in via Google with the matching verified email
        String googleSub = "google_sub_3030303";
        User linkedUser = authService.processGoogleOAuthUser(googleSub, localEmail, "Local Trader", "http://avatar.com/1");

        assertThat(linkedUser.getId()).isEqualTo(originalUserId);
        assertThat(linkedUser.getGoogleSub()).isEqualTo(googleSub);
        assertThat(linkedUser.getAuthProvider()).isEqualTo("GOOGLE_AND_LOCAL");

        // Verify wallet and portfolios are intact
        Wallet walletAfter = walletRepository.findByUserId(originalUserId).orElseThrow();
        assertThat(walletAfter.getId()).isEqualTo(walletBefore.getId());
        assertThat(walletAfter.getBalance()).isEqualByComparingTo(new BigDecimal("100000.00"));
    }

    @Test
    @DisplayName("Should reject linking if existing account is already tied to a different Google sub")
    void testRejectConflictingGoogleAccountLink() {
        String email = "conflict@test.com";
        authService.processGoogleOAuthUser("google_sub_orig", email, "Original User", null);

        // Attempt linking a different Google sub with the same email
        assertThatThrownBy(() -> authService.processGoogleOAuthUser("google_sub_different", email, "Imposter", null))
                .isInstanceOf(DuplicateEmailException.class)
                .hasMessageContaining("already associated with another Google account");
    }

    @Test
    @DisplayName("Generated internal JWT should authenticate successfully and access /api/v1/auth/me")
    void testGoogleUserJwtAccess() throws Exception {
        String googleSub = "google_sub_jwt_test";
        String email = "jwttest@test.com";
        User user = authService.processGoogleOAuthUser(googleSub, email, "JWT User", "http://photo.com/me");

        String jwtToken = jwtTokenProvider.generateToken(user);
        assertThat(jwtToken).isNotBlank();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + jwtToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.authProvider").value("GOOGLE"))
                .andExpect(jsonPath("$.data.imageUrl").value("http://photo.com/me"));
    }
}
