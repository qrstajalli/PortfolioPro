package com.portfoliopro.health.controller;

import com.portfoliopro.common.ApiResponse;
import com.portfoliopro.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthController {

    private final Environment environment;
    private final AppProperties appProperties;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> details = Map.of(
                "status", "UP",
                "app", "PortfolioPro Backend",
                "phase", "Phase 1: Project Scaffolding & Core Architecture",
                "profiles", Arrays.asList(environment.getActiveProfiles()),
                "currency", appProperties.getPortfolio().getDefaultCurrency(),
                "timestamp", Instant.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.ok("PortfolioPro service is operational", details));
    }
}
