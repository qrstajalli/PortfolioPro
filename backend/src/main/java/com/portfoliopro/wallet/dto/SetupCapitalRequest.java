package com.portfoliopro.wallet.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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
public class SetupCapitalRequest {

    @NotNull(message = "Starting virtual capital is required")
    @DecimalMin(value = "100.00", message = "Virtual capital must be at least ₹100.00")
    @DecimalMax(value = "1000000000.00", message = "Virtual capital must not exceed ₹1,00,00,00,000.00")
    private BigDecimal initialCapital;
}
