package com.portfoliopro.market.repository;

import com.portfoliopro.market.entity.StockHistoricalPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface StockHistoricalPriceRepository extends JpaRepository<StockHistoricalPrice, Long> {

    List<StockHistoricalPrice> findByStockIdAndTimestampBetweenOrderByTimestampAsc(
            Long stockId,
            Instant start,
            Instant end
    );

    List<StockHistoricalPrice> findTop30ByStockIdOrderByTimestampDesc(Long stockId);
}
