package com.portfoliopro.market.repository;

import com.portfoliopro.market.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findBySymbol(String symbol);

    boolean existsBySymbol(String symbol);

    @Query("SELECT s FROM Stock s WHERE s.isActive = true AND " +
           "(LOWER(s.symbol) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Stock> searchStocks(@Param("query") String query);

    List<Stock> findBySectorIgnoreCase(String sector);

    List<Stock> findByIsActiveTrue();
}
