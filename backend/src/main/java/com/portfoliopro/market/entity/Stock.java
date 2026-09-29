package com.portfoliopro.market.entity;

import com.portfoliopro.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "stocks", indexes = {
        @Index(name = "idx_stock_symbol", columnList = "symbol"),
        @Index(name = "idx_stock_sector", columnList = "sector")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "symbol", nullable = false, unique = true, length = 20)
    private String symbol;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "exchange", nullable = false, length = 20)
    private String exchange;

    @Column(name = "sector", length = 50)
    private String sector;

    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "current_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal currentPrice;

    @Column(name = "previous_close", nullable = false, precision = 19, scale = 4)
    private BigDecimal previousClose;

    @Column(name = "day_high", precision = 19, scale = 4)
    private BigDecimal dayHigh;

    @Column(name = "day_low", precision = 19, scale = 4)
    private BigDecimal dayLow;

    @Column(name = "fifty_two_week_high", precision = 19, scale = 4)
    private BigDecimal fiftyTwoWeekHigh;

    @Column(name = "fifty_two_week_low", precision = 19, scale = 4)
    private BigDecimal fiftyTwoWeekLow;

    @Column(name = "volume")
    private Long volume;

    @Column(name = "market_cap", precision = 24, scale = 4)
    private BigDecimal marketCap;

    @Column(name = "pe_ratio", precision = 10, scale = 4)
    private BigDecimal peRatio;

    @Column(name = "pb_ratio", precision = 10, scale = 4)
    private BigDecimal pbRatio;

    @Column(name = "dividend_yield", precision = 10, scale = 4)
    private BigDecimal dividendYield;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
