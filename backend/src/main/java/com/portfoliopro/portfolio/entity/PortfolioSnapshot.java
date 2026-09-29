package com.portfoliopro.portfolio.entity;

import com.portfoliopro.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "portfolio_snapshots", indexes = {
        @Index(name = "idx_snapshot_portfolio_id", columnList = "portfolio_id"),
        @Index(name = "idx_snapshot_time", columnList = "snapshot_time")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioSnapshot extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @Column(name = "total_equity", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalEquity;

    @Column(name = "cash_balance", nullable = false, precision = 19, scale = 4)
    private BigDecimal cashBalance;

    @Column(name = "invested_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal investedAmount;

    @Column(name = "current_value", nullable = false, precision = 19, scale = 4)
    private BigDecimal currentValue;

    @Column(name = "unrealized_pnl", precision = 19, scale = 4)
    private BigDecimal unrealizedPnl;

    @Column(name = "realized_pnl", precision = 19, scale = 4)
    private BigDecimal realizedPnl;

    @Column(name = "snapshot_time", nullable = false)
    @Builder.Default
    private Instant snapshotTime = Instant.now();
}
