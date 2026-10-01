package com.portfoliopro.trade.controller;

import com.portfoliopro.common.ApiResponse;
import com.portfoliopro.trade.dto.OrderDto;
import com.portfoliopro.trade.dto.TransactionDto;
import com.portfoliopro.trade.service.TradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.portfoliopro.trade.dto.TradeOrderRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trade")
@RequiredArgsConstructor
public class TradeController {

    private final TradeService tradeService;

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<OrderDto> orders = tradeService.getOrdersByUserEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Orders retrieved successfully", orders));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<TransactionDto>>> getTransactions(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<TransactionDto> transactions = tradeService.getTransactionsByUserEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Transactions retrieved successfully", transactions));
    }

    @PostMapping("/order")
    public ResponseEntity<ApiResponse<OrderDto>> executeOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TradeOrderRequest request) {
        OrderDto order = tradeService.executeOrder(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Trade order executed successfully", order));
    }
}
