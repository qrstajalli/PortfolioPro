package com.portfoliopro.trade.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TradeOrderRequest {

    @NotBlank(message = "Symbol is required")
    private String symbol;

    @NotBlank(message = "Side is required (BUY or SELL)")
    private String side;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Long quantity;

    @Builder.Default
    private String orderType = "MARKET";

    private BigDecimal limitPrice;
}
