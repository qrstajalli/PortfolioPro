package com.portfoliopro.trade.repository;

import com.portfoliopro.trade.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionReference(String transactionReference);

    List<Transaction> findByPortfolioIdOrderByTransactionTimeDesc(Long portfolioId);

    List<Transaction> findByUserIdOrderByTransactionTimeDesc(Long userId);

    Page<Transaction> findByUserIdOrderByTransactionTimeDesc(Long userId, Pageable pageable);

    Page<Transaction> findByPortfolioIdOrderByTransactionTimeDesc(Long portfolioId, Pageable pageable);
}
