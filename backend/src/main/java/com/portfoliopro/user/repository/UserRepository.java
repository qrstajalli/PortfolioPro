package com.portfoliopro.user.repository;

import com.portfoliopro.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleSub(String googleSub);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByGoogleSub(String googleSub);
}
