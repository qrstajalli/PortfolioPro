package com.portfoliopro.portfolio.repository;

import com.portfoliopro.portfolio.entity.PortfolioSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, Long> {

    List<PortfolioSnapshot> findByPortfolioIdOrderBySnapshotTimeAsc(Long portfolioId);

    List<PortfolioSnapshot> findByPortfolioIdAndSnapshotTimeBetweenOrderBySnapshotTimeAsc(
            Long portfolioId,
            Instant startTime,
            Instant endTime
    );
}
