package com.agrosmart.magdalena.repository;

import com.agrosmart.magdalena.domain.entity.Parcela;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParcelaRepository extends JpaRepository<Parcela, Long> {

    Page<Parcela> findByFincaIdAndActivoTrue(Long fincaId, Pageable pageable);

    List<Parcela> findByFincaIdAndActivoTrue(Long fincaId);

    long countByFincaIdAndActivoTrue(Long fincaId);
}
