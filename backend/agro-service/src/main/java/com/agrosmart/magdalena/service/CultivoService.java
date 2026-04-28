package com.agrosmart.magdalena.service;

import com.agrosmart.magdalena.domain.entity.Cultivo;
import com.agrosmart.magdalena.domain.entity.Parcela;
import com.agrosmart.magdalena.domain.enums.EstadoCultivo;
import com.agrosmart.magdalena.dto.request.CultivoRequest;
import com.agrosmart.magdalena.dto.response.CultivoResponse;
import com.agrosmart.magdalena.exception.BadRequestException;
import com.agrosmart.magdalena.exception.ResourceNotFoundException;
import com.agrosmart.magdalena.repository.CultivoRepository;
import com.agrosmart.magdalena.repository.ParcelaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.agrosmart.magdalena.domain.event.CultivoStateChangedEvent;

/**
 * Servicio de gestión de cultivos.
 *
 * Reglas de negocio:
 *   - Un cultivo pertenece a una parcela
 *   - El área utilizada no debe exceder el área de la parcela
 *   - La fecha de siembra no puede ser posterior a la fecha estimada de cosecha
 *   - El estado del cultivo sigue el ciclo: PLANIFICADO → SEMBRADO → EN_CRECIMIENTO → EN_COSECHA → COSECHADO
 */
@Service
@RequiredArgsConstructor
public class CultivoService {

    private final CultivoRepository cultivoRepository;
    private final ParcelaRepository parcelaRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public Page<CultivoResponse> listarTodos(Pageable pageable) {
        return cultivoRepository.findByActivoTrue(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<CultivoResponse> listarPorParcela(Long parcelaId, Pageable pageable) {
        return cultivoRepository.findByParcelaIdAndActivoTrue(parcelaId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<CultivoResponse> listarPorProductor(Long productorId, Pageable pageable) {
        return cultivoRepository.findByProductorId(productorId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<CultivoResponse> listarPorFinca(Long fincaId, Pageable pageable) {
        return cultivoRepository.findByFincaId(fincaId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<CultivoResponse> listarPorEstado(EstadoCultivo estado, Pageable pageable) {
        return cultivoRepository.findByEstadoAndActivoTrue(estado, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CultivoResponse obtenerPorId(Long id) {
        Cultivo cultivo = buscarCultivoActivo(id);
        return toResponse(cultivo);
    }

    @Transactional
    public CultivoResponse crear(CultivoRequest request) {
        Parcela parcela = parcelaRepository.findById(request.getParcelaId())
                .orElseThrow(() -> new ResourceNotFoundException("Parcela", "id", request.getParcelaId()));

        // Validar área disponible en la parcela
        if (request.getAreaUtilizada() != null) {
            validarAreaDisponible(parcela.getId(), request.getAreaUtilizada(), null);
        }

        // Validar fechas
        if (request.getFechaCosechaEstimada() != null
                && request.getFechaSiembra().isAfter(request.getFechaCosechaEstimada())) {
            throw new BadRequestException("La fecha de siembra no puede ser posterior a la fecha estimada de cosecha");
        }

        // Determinar estado
        EstadoCultivo estado = EstadoCultivo.PLANIFICADO;
        if (request.getEstado() != null) {
            try {
                estado = EstadoCultivo.valueOf(request.getEstado().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Estado de cultivo inválido: " + request.getEstado());
            }
        }

        Cultivo cultivo = Cultivo.builder()
                .nombre(request.getNombre())
                .variedad(request.getVariedad())
                .parcela(parcela)
                .fechaSiembra(request.getFechaSiembra())
                .fechaCosechaEstimada(request.getFechaCosechaEstimada())
                .estado(estado)
                .areaUtilizada(request.getAreaUtilizada())
                .observaciones(request.getObservaciones())
                .rendimientoEsperado(request.getRendimientoEsperado())
                .unidadRendimiento(request.getUnidadRendimiento() != null
                        ? request.getUnidadRendimiento() : "toneladas/hectárea")
                .imagenUrl(request.getImagenUrl())
                .build();

        cultivo = cultivoRepository.save(cultivo);
        return toResponse(cultivo);
    }

    @Transactional
    public CultivoResponse actualizar(Long id, CultivoRequest request) {
        Cultivo cultivo = buscarCultivoActivo(id);

        if (request.getAreaUtilizada() != null) {
            validarAreaDisponible(cultivo.getParcela().getId(), request.getAreaUtilizada(), id);
        }

        if (request.getFechaCosechaEstimada() != null
                && request.getFechaSiembra().isAfter(request.getFechaCosechaEstimada())) {
            throw new BadRequestException("La fecha de siembra no puede ser posterior a la fecha estimada de cosecha");
        }

        cultivo.setNombre(request.getNombre());
        cultivo.setVariedad(request.getVariedad());
        cultivo.setFechaSiembra(request.getFechaSiembra());
        cultivo.setFechaCosechaEstimada(request.getFechaCosechaEstimada());
        cultivo.setAreaUtilizada(request.getAreaUtilizada());
        cultivo.setObservaciones(request.getObservaciones());
        cultivo.setRendimientoEsperado(request.getRendimientoEsperado());
        if (request.getUnidadRendimiento() != null) {
            cultivo.setUnidadRendimiento(request.getUnidadRendimiento());
        }
        if (request.getImagenUrl() != null) {
            cultivo.setImagenUrl(request.getImagenUrl());
        }
        if (request.getEstado() != null) {
            try {
                EstadoCultivo nuevoEstado = EstadoCultivo.valueOf(request.getEstado().toUpperCase());
                String estadoAnterior = cultivo.getEstado().name();
                if (cultivo.getEstado() != nuevoEstado) {
                    cultivo.setEstado(nuevoEstado);
                    eventPublisher.publishEvent(new CultivoStateChangedEvent(cultivo, estadoAnterior, nuevoEstado.name()));
                }
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Estado de cultivo inválido: " + request.getEstado());
            }
        }

        cultivo = cultivoRepository.save(cultivo);
        return toResponse(cultivo);
    }

    @Transactional
    public void eliminar(Long id) {
        Cultivo cultivo = buscarCultivoActivo(id);
        cultivo.setActivo(false);
        cultivoRepository.save(cultivo);
    }

    /**
     * Valida que el área del nuevo cultivo no exceda el área de la parcela.
     */
    private void validarAreaDisponible(Long parcelaId, Double nuevaArea, Long excludeId) {
        Parcela parcela = parcelaRepository.findById(parcelaId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcela", "id", parcelaId));

        Double areaUsada = cultivoRepository.sumAreaUtilizadaByParcelaId(parcelaId);
        if (areaUsada == null) areaUsada = 0.0;

        // Si es actualización, restar el área actual del cultivo
        if (excludeId != null) {
            cultivoRepository.findById(excludeId).ifPresent(c -> {
                // No podemos usar areaUsada directly in lambda (it's not effectively final)
            });
            Cultivo existente = cultivoRepository.findById(excludeId).orElse(null);
            if (existente != null && existente.getAreaUtilizada() != null) {
                areaUsada -= existente.getAreaUtilizada();
            }
        }

        if (areaUsada + nuevaArea > parcela.getAreaParcela()) {
            throw new BadRequestException(String.format(
                    "El área del cultivo (%.2f) excede el área disponible de la parcela (%.2f de %.2f %s)",
                    nuevaArea, parcela.getAreaParcela() - areaUsada, parcela.getAreaParcela(), parcela.getUnidadArea()));
        }
    }

    private Cultivo buscarCultivoActivo(Long id) {
        Cultivo cultivo = cultivoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo", "id", id));
        if (!cultivo.getActivo()) {
            throw new ResourceNotFoundException("Cultivo", "id", id);
        }
        return cultivo;
    }

    private CultivoResponse toResponse(Cultivo c) {
        return CultivoResponse.builder()
                .id(c.getId())
                .nombre(c.getNombre())
                .variedad(c.getVariedad())
                .fechaSiembra(c.getFechaSiembra())
                .fechaCosechaEstimada(c.getFechaCosechaEstimada())
                .fechaCosechaReal(c.getFechaCosechaReal())
                .estado(c.getEstado().name())
                .areaUtilizada(c.getAreaUtilizada())
                .observaciones(c.getObservaciones())
                .rendimientoEsperado(c.getRendimientoEsperado())
                .rendimientoReal(c.getRendimientoReal())
                .unidadRendimiento(c.getUnidadRendimiento())
                .activo(c.getActivo())
                .createdAt(c.getCreatedAt())
                .parcelaId(c.getParcela().getId())
                .parcelaNombre(c.getParcela().getNombre())
                .fincaId(c.getParcela().getFinca().getId())
                .fincaNombre(c.getParcela().getFinca().getNombre())
                .imagenUrl(c.getImagenUrl())
                .build();
    }
}
