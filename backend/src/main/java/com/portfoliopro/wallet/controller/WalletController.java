package com.portfoliopro.wallet.controller;

import com.portfoliopro.common.ApiResponse;
import com.portfoliopro.wallet.dto.SetupCapitalRequest;
import com.portfoliopro.wallet.dto.WalletDto;
import com.portfoliopro.wallet.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<ApiResponse<WalletDto>> getWallet(@AuthenticationPrincipal UserDetails userDetails) {
        WalletDto wallet = walletService.getWalletByUserEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Wallet retrieved successfully", wallet));
    }

    @PostMapping("/setup")
    public ResponseEntity<ApiResponse<WalletDto>> setupCapital(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SetupCapitalRequest request) {
        WalletDto wallet = walletService.setupCapital(userDetails.getUsername(), request.getInitialCapital());
        return ResponseEntity.ok(ApiResponse.ok("Virtual trading capital configured successfully", wallet));
    }

    @PutMapping("/capital")
    public ResponseEntity<ApiResponse<WalletDto>> updateCapital(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SetupCapitalRequest request) {
        WalletDto wallet = walletService.setupCapital(userDetails.getUsername(), request.getInitialCapital());
        return ResponseEntity.ok(ApiResponse.ok("Virtual trading capital updated successfully", wallet));
    }
}
