package com.agrosmart.magdalena.repository;

import com.agrosmart.magdalena.domain.entity.Reporte;
import com.agrosmart.magdalena.domain.enums.TipoReporte;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    Page<Reporte> findByProductorId(Long productorId, Pageable pageable);

    Page<Reporte> findByTipo(TipoReporte tipo, Pageable pageable);

    Page<Reporte> findByProductorIdAndTipo(Long productorId, TipoReporte tipo, Pageable pageable);
}
