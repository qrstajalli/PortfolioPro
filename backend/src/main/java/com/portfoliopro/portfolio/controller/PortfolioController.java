package com.portfoliopro.portfolio.controller;

import com.portfoliopro.common.ApiResponse;
import com.portfoliopro.portfolio.dto.PortfolioDto;
import com.portfoliopro.portfolio.entity.PortfolioSnapshot;
import com.portfoliopro.portfolio.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping
    public ResponseEntity<ApiResponse<PortfolioDto>> getPortfolio(
            @AuthenticationPrincipal UserDetails userDetails) {
        PortfolioDto portfolio = portfolioService.getPortfolioByUserEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Portfolio retrieved successfully", portfolio));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PortfolioSnapshot>>> getPortfolioHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<PortfolioSnapshot> history = portfolioService.getPortfolioHistory(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Portfolio history retrieved successfully", history));
    }
}
