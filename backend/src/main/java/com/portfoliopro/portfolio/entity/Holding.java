package com.portfoliopro.portfolio.entity;

import com.portfoliopro.common.BaseEntity;
import com.portfoliopro.market.entity.Stock;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "holdings", uniqueConstraints = {
        @UniqueConstraint(name = "uk_holding_portfolio_stock", columnNames = {"portfolio_id", "stock_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Holding extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Column(name = "quantity", nullable = false)
    private Long quantity;

    @Column(name = "average_buy_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal averageBuyPrice;

    @Column(name = "total_invested", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalInvested;

    @Version
    @Column(name = "version")
    private Long version;
}
