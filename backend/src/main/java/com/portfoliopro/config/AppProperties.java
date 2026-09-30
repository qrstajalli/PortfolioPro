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
    private Auth auth = new Auth();
    private Mail mail = new Mail();
    private TwelveData twelveData = new TwelveData();

    @Getter
    @Setter
    public static class TwelveData {
        private String apiKey = "";
        private String baseUrl = "https://api.twelvedata.com";
    }

    @Getter
    @Setter
    public static class Portfolio {
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

    @Getter
    @Setter
    public static class Auth {
        private boolean devMode = true;
    }

    @Getter
    @Setter
    public static class Mail {
        private String from = "noreply@portfoliopro.com";
        private String frontendUrl = "http://localhost:5173";
    }
}
