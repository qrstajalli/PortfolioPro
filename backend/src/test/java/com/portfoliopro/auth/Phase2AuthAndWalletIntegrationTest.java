package com.portfoliopro.auth;

import com.jayway.jsonpath.JsonPath;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("local-h2")
public class Phase2AuthAndWalletIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private WalletRepository walletRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("Should successfully register with configurable virtual capital, login, and access protected endpoints")
    void testFullAuthAndWalletLifecycle() throws Exception {
        String regPayload = """
                {
                    "name": "Sarah Connor",
                    "email": "sarah.connor@test.com",
                    "password": "Password123!",
                    "initialCapital": 250000.00
                }
                """;

        // 1. Register new user with user-chosen starting capital
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.name").value("Sarah Connor"))
                .andExpect(jsonPath("$.data.user.email").value("sarah.connor@test.com"))
                .andReturn();

        String responseString = regResult.getResponse().getContentAsString();
        String token = JsonPath.read(responseString, "$.data.token");
        Number userIdNum = JsonPath.read(responseString, "$.data.user.id");
        Long userId = userIdNum.longValue();

        // 2. Verify automatic wallet creation with user's configured capital
        Optional<Wallet> walletOpt = walletRepository.findByUserId(userId);
        assertThat(walletOpt).isPresent();
        assertThat(walletOpt.get().getBalance()).isEqualByComparingTo(new BigDecimal("250000.00"));
        assertThat(walletOpt.get().getCurrency()).isEqualTo("INR");

        // 3. Login with credentials
        String loginPayload = """
                {
                    "email": "sarah.connor@test.com",
                    "password": "Password123!"
                }
                """;

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("sarah.connor@test.com"))
                .andReturn();

        String loginToken = JsonPath.read(loginResult.getResponse().getContentAsString(), "$.data.token");

        // 4. Access protected /api/v1/auth/me using Bearer token
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + loginToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("sarah.connor@test.com"))
                .andExpect(jsonPath("$.data.name").value("Sarah Connor"));

        // 5. Access protected /api/v1/wallet using Bearer token
        mockMvc.perform(get("/api/v1/wallet")
                        .header("Authorization", "Bearer " + loginToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.balance").value(250000.00))
                .andExpect(jsonPath("$.data.currency").value("INR"))
                .andExpect(jsonPath("$.data.userId").value(userId));

        // 6. Test updating/configuring capital via /api/v1/wallet/setup
        String setupPayload = """
                {
                    "initialCapital": 500000.00
                }
                """;
        mockMvc.perform(post("/api/v1/wallet/setup")
                        .header("Authorization", "Bearer " + loginToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(setupPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.balance").value(500000.00))
                .andExpect(jsonPath("$.data.initialBalance").value(500000.00));
    }

    @Test
    @DisplayName("Should reject duplicate email registration with 400 Bad Request")
    void testDuplicateEmailRegistration() throws Exception {
        String payload = """
                {
                    "name": "Original User",
                    "email": "duplicate@test.com",
                    "password": "Secret123"
                }
                """;

        // First registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());

        // Duplicate registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("already exists")));
    }

    @Test
    @DisplayName("Should reject invalid login credentials with 401 Unauthorized")
    void testInvalidLoginCredentials() throws Exception {
        // Unknown email
        String unknownEmailPayload = """
                {
                    "email": "nobody@test.com",
                    "password": "wrongPassword"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unknownEmailPayload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        // Wrong password for existing user
        String regPayload = """
                {
                    "name": "Real User",
                    "email": "realuser@test.com",
                    "password": "correctPassword"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isCreated());

        String wrongPassPayload = """
                {
                    "email": "realuser@test.com",
                    "password": "wrongPassword"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrongPassPayload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Should reject unauthenticated access to protected endpoints with 401")
    void testUnauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/v1/wallet"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Should preserve Phase 1 public market and health endpoints without authentication")
    void testPhase1EndpointsStillPublic() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"));

        mockMvc.perform(get("/api/v1/market/stocks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
