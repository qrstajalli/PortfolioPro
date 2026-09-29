package com.portfoliopro.wallet.repository;

import com.portfoliopro.user.entity.User;
import com.portfoliopro.wallet.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByUserId(Long userId);
    Optional<Wallet> findByUser(User user);
    Optional<Wallet> findByUserEmail(String email);
    boolean existsByUserId(Long userId);
}
