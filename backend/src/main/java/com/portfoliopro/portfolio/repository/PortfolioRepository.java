package com.portfoliopro.portfolio.repository;

import com.portfoliopro.portfolio.entity.Portfolio;
import com.portfoliopro.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    Optional<Portfolio> findByUserId(Long userId);
    Optional<Portfolio> findByUser(User user);
    boolean existsByUserId(Long userId);
}
