package com.portfoliopro.wallet.controller;

import com.portfoliopro.common.ApiResponse;
import com.portfoliopro.wallet.dto.WalletDto;
import com.portfoliopro.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
