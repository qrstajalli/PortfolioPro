package com.portfoliopro.market.repository;

import com.portfoliopro.market.entity.Instrument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstrumentRepository extends JpaRepository<Instrument, Long> {

    Optional<Instrument> findBySymbol(String symbol);

    List<Instrument> findByExchangeAndIsActiveTrue(String exchange);

    List<Instrument> findByInstrumentTypeAndIsActiveTrue(String instrumentType);

    List<Instrument> findByIsActiveTrue();

    boolean existsBySymbol(String symbol);
}
