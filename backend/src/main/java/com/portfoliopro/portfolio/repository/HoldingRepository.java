package com.portfoliopro.portfolio.repository;

import com.portfoliopro.portfolio.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, Long> {
    List<Holding> findByPortfolioId(Long portfolioId);
    Optional<Holding> findByPortfolioIdAndStockId(Long portfolioId, Long stockId);
    boolean existsByPortfolioIdAndStockId(Long portfolioId, Long stockId);
}
