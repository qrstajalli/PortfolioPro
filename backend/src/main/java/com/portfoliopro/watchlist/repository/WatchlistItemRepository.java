package com.portfoliopro.watchlist.repository;

import com.portfoliopro.watchlist.entity.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {

    List<WatchlistItem> findByWatchlistId(Long watchlistId);

    Optional<WatchlistItem> findByWatchlistIdAndStockId(Long watchlistId, Long stockId);

    boolean existsByWatchlistIdAndStockId(Long watchlistId, Long stockId);

    void deleteByWatchlistIdAndStockId(Long watchlistId, Long stockId);
}
