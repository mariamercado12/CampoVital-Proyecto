package com.agrosmart.magdalena.service;

import com.agrosmart.magdalena.domain.entity.Cultivo;
import com.agrosmart.magdalena.domain.entity.HistorialRecomendacion;
import com.agrosmart.magdalena.domain.entity.Recomendacion;
import com.agrosmart.magdalena.domain.entity.TecnicoAgropecuario;
import com.agrosmart.magdalena.domain.enums.Prioridad;
import com.agrosmart.magdalena.dto.request.RecomendacionRequest;
import com.agrosmart.magdalena.dto.response.RecomendacionResponse;
import com.agrosmart.magdalena.exception.BadRequestException;
import com.agrosmart.magdalena.exception.ResourceNotFoundException;
import com.agrosmart.magdalena.repository.CultivoRepository;
import com.agrosmart.magdalena.repository.HistorialRecomendacionRepository;
import com.agrosmart.magdalena.repository.RecomendacionRepository;
import com.agrosmart.magdalena.repository.UsuarioRepository;
import com.agrosmart.magdalena.repository.TecnicoAgropecuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Servicio de gestión de recomendaciones técnicas.
 *
 * Reglas de negocio:
 *   - Las recomendaciones están vinculadas a un cultivo
 *   - Un técnico agropecuario puede complementar o revisar recomendaciones
 *   - Al marcar una recomendación como aplicada, se registra en el historial
 */
@Service
@RequiredArgsConstructor
public class RecomendacionService {

    private final RecomendacionRepository recomendacionRepository;
    private final CultivoRepository cultivoRepository;
    private final HistorialRecomendacionRepository historialRepository;
    private final UsuarioRepository usuarioRepository;
    private final TecnicoAgropecuarioRepository tecnicoRepository;

    @Transactional(readOnly = true)
    public Page<RecomendacionResponse> listarPorCultivo(Long cultivoId, Pageable pageable) {
        return recomendacionRepository.findByCultivoId(cultivoId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<RecomendacionResponse> listarPorProductor(Long productorId, Pageable pageable) {
        return recomendacionRepository.findByProductorId(productorId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<RecomendacionResponse> listarPendientes(Pageable pageable) {
        return recomendacionRepository.findByAplicadaFalse(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public RecomendacionResponse obtenerPorId(Long id) {
        Recomendacion r = recomendacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recomendacion", "id", id));
        return toResponse(r);
    }

    @Transactional
    public RecomendacionResponse crear(RecomendacionRequest request) {
        Cultivo cultivo = cultivoRepository.findById(request.getCultivoId())
                .orElseThrow(() -> new ResourceNotFoundException("Cultivo", "id", request.getCultivoId()));

        Prioridad prioridad = Prioridad.MEDIA;
        if (request.getPrioridad() != null) {
            try {
                prioridad = Prioridad.valueOf(request.getPrioridad().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Prioridad inválida: " + request.getPrioridad());
            }
        }

        Recomendacion recomendacion = Recomendacion.builder()
                .cultivo(cultivo)
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .prioridad(prioridad)
                .build();

        recomendacion = recomendacionRepository.save(recomendacion);
        return toResponse(recomendacion);
    }

    /**
     * Marca una recomendación como aplicada y registra en el historial.
     */
    @Transactional
    public RecomendacionResponse marcarComoAplicada(Long id, String observaciones) {
        Recomendacion r = recomendacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recomendacion", "id", id));

        r.setAplicada(true);
        r = recomendacionRepository.save(r);

        // Registrar en historial
        HistorialRecomendacion historial = HistorialRecomendacion.builder()
                .recomendacion(r)
                .fechaRegistro(LocalDateTime.now())
                .observaciones(observaciones)
                .aplicada(true)
                .build();
        historialRepository.save(historial);

        return toResponse(r);
    }

    @Transactional
    public RecomendacionResponse complementar(Long id, String notaComplementaria, String emailTecnico) {
        Recomendacion r = recomendacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recomendacion", "id", id));
                
        // Find Tecnico
        var usuario = usuarioRepository.findByEmail(emailTecnico)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailTecnico));
                
        TecnicoAgropecuario tecnico = tecnicoRepository.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new BadRequestException("El usuario no es un técnico agropecuario"));

        // Registrar en historial
        HistorialRecomendacion historial = HistorialRecomendacion.builder()
                .recomendacion(r)
                .fechaRegistro(LocalDateTime.now())
                .observaciones("COMPLEMENTO TÉCNICO: " + notaComplementaria)
                .aplicada(r.getAplicada()) // mantiene el estado
                .build();
        historialRepository.save(historial);
        
        // Link tecnico to recomendacion if not linked
        if (r.getTecnico() == null) {
            r.setTecnico(tecnico);
            recomendacionRepository.save(r);
        }

        return toResponse(r);
    }

    private RecomendacionResponse toResponse(Recomendacion r) {
        TecnicoAgropecuario tecnico = r.getTecnico();
        return RecomendacionResponse.builder()
                .id(r.getId())
                .titulo(r.getTitulo())
                .descripcion(r.getDescripcion())
                .prioridad(r.getPrioridad().name())
                .aplicada(r.getAplicada())
                .fechaEmision(r.getFechaEmision())
                .createdAt(r.getCreatedAt())
                .cultivoId(r.getCultivo().getId())
                .cultivoNombre(r.getCultivo().getNombre())
                .tecnicoId(tecnico != null ? tecnico.getId() : null)
                .tecnicoNombre(tecnico != null ? "Técnico ID: " + tecnico.getUsuarioId() : null)
                .build();
    }
}
