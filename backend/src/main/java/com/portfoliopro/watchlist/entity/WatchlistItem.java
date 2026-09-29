package com.portfoliopro.watchlist.entity;

import com.portfoliopro.common.BaseEntity;
import com.portfoliopro.market.entity.Stock;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "watchlist_items", uniqueConstraints = {
        @UniqueConstraint(name = "uk_watchlist_stock", columnNames = {"watchlist_id", "stock_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchlistItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "watchlist_id", nullable = false)
    private Watchlist watchlist;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;
}
