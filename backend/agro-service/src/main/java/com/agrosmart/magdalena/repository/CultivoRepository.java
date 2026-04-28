package com.agrosmart.magdalena.repository;

import com.agrosmart.magdalena.domain.entity.Cultivo;
import com.agrosmart.magdalena.domain.enums.EstadoCultivo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CultivoRepository extends JpaRepository<Cultivo, Long> {

    Page<Cultivo> findByParcelaIdAndActivoTrue(Long parcelaId, Pageable pageable);

    List<Cultivo> findByParcelaIdAndActivoTrue(Long parcelaId);

    Page<Cultivo> findByEstadoAndActivoTrue(EstadoCultivo estado, Pageable pageable);

    @Query("SELECT c FROM Cultivo c WHERE c.parcela.finca.productor.id = :productorId AND c.activo = true")
    Page<Cultivo> findByProductorId(@Param("productorId") Long productorId, Pageable pageable);

    @Query("SELECT c FROM Cultivo c WHERE c.parcela.finca.id = :fincaId AND c.activo = true")
    Page<Cultivo> findByFincaId(@Param("fincaId") Long fincaId, Pageable pageable);

    @Query("SELECT SUM(c.areaUtilizada) FROM Cultivo c WHERE c.parcela.id = :parcelaId AND c.activo = true")
    Double sumAreaUtilizadaByParcelaId(@Param("parcelaId") Long parcelaId);

    Page<Cultivo> findByActivoTrue(Pageable pageable);
}
