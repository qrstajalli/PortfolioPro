package com.portfoliopro.watchlist.controller;

import com.portfoliopro.common.ApiResponse;
import com.portfoliopro.watchlist.dto.WatchlistItemDto;
import com.portfoliopro.watchlist.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/watchlist")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WatchlistItemDto>>> getWatchlist(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<WatchlistItemDto> items = watchlistService.getWatchlist(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Watchlist retrieved successfully", items));
    }

    @PostMapping("/{symbol}")
    public ResponseEntity<ApiResponse<Void>> addToWatchlist(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("symbol") String symbol) {
        watchlistService.addToWatchlist(userDetails.getUsername(), symbol);
        return ResponseEntity.ok(ApiResponse.ok("Stock added to watchlist successfully", null));
    }

    @DeleteMapping("/{symbol}")
    public ResponseEntity<ApiResponse<Void>> removeFromWatchlist(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable("symbol") String symbol) {
        watchlistService.removeFromWatchlist(userDetails.getUsername(), symbol);
        return ResponseEntity.ok(ApiResponse.ok("Stock removed from watchlist successfully", null));
    }
}
