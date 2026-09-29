package com.portfoliopro.market.entity;

import com.portfoliopro.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "instruments", indexes = {
        @Index(name = "idx_instrument_symbol", columnList = "symbol"),
        @Index(name = "idx_instrument_exchange", columnList = "exchange"),
        @Index(name = "idx_instrument_type", columnList = "instrument_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Instrument extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "symbol", nullable = false, unique = true, length = 30)
    private String symbol;

    @Column(name = "trading_symbol", length = 50)
    private String tradingSymbol;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "exchange", nullable = false, length = 20)
    private String exchange;

    @Column(name = "instrument_type", nullable = false, length = 30)
    @Builder.Default
    private String instrumentType = "EQUITY";

    @Column(name = "segment", length = 30)
    @Builder.Default
    private String segment = "EQ";

    @Column(name = "isin", length = 30)
    private String isin;

    @Column(name = "lot_size")
    @Builder.Default
    private Integer lotSize = 1;

    @Column(name = "tick_size", precision = 10, scale = 4)
    @Builder.Default
    private BigDecimal tickSize = new BigDecimal("0.0500");

    @Column(name = "last_price", precision = 19, scale = 4)
    private BigDecimal lastPrice;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
