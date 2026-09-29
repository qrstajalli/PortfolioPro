package com.portfoliopro.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Portfolio portfolio = new Portfolio();
    private Cors cors = new Cors();
    private Jwt jwt = new Jwt();

    @Getter
    @Setter
    public static class Portfolio {
        private BigDecimal initialCashBalance = new BigDecimal("100000.0000");
        private String defaultCurrency = "INR";
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5173", "http://127.0.0.1:5173");
    }

    @Getter
    @Setter
    public static class Jwt {
        private String secret = "4a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b";
        private long expirationMs = 86400000L;
        private String issuer = "portfoliopro";
    }
}
