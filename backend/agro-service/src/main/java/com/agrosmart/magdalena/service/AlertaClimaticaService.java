package com.agrosmart.magdalena.service;

import com.agrosmart.magdalena.domain.entity.AlertaClimatica;
import com.agrosmart.magdalena.domain.entity.Usuario;
import com.agrosmart.magdalena.domain.enums.TipoAlerta;
import com.agrosmart.magdalena.dto.request.AlertaClimaticaRequest;
import com.agrosmart.magdalena.dto.response.AlertaClimaticaResponse;
import com.agrosmart.magdalena.exception.BadRequestException;
import com.agrosmart.magdalena.exception.ResourceNotFoundException;
import com.agrosmart.magdalena.repository.AlertaClimaticaRepository;
import com.agrosmart.magdalena.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de gestión de alertas climáticas.
 *
 * Reglas de negocio:
 *   - Las alertas se emiten por un administrador
 *   - Se filtran por municipios afectados
 *   - Pueden tener fecha de expiración
 *   - Se pueden consultar por historial
 */
@Service
@RequiredArgsConstructor
public class AlertaClimaticaService {

    private final AlertaClimaticaRepository alertaRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public Page<AlertaClimaticaResponse> listarActivas(Pageable pageable) {
        return alertaRepository.findByActivaTrue(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AlertaClimaticaResponse> listarHistorial(Pageable pageable) {
        return alertaRepository.findAllByOrderByFechaEmisionDesc(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<AlertaClimaticaResponse> listarPorMunicipio(String municipio) {
        return alertaRepository.findActivasByMunicipio(municipio).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AlertaClimaticaResponse obtenerPorId(Long id) {
        AlertaClimatica alerta = alertaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AlertaClimatica", "id", id));
        return toResponse(alerta);
    }

    @Transactional
    public AlertaClimaticaResponse crear(AlertaClimaticaRequest request, String emailUsuario) {
        Usuario emisor = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", emailUsuario));

        TipoAlerta tipo;
        try {
            tipo = TipoAlerta.valueOf(request.getTipo().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Tipo de alerta inválido: " + request.getTipo());
        }

        AlertaClimatica alerta = AlertaClimatica.builder()
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .tipo(tipo)
                .fechaExpiracion(request.getFechaExpiracion())
                .municipiosAfectados(request.getMunicipiosAfectados() != null
                        ? request.getMunicipiosAfectados() : List.of())
                .emitidaPor(emisor)
                .build();

        alerta = alertaRepository.save(alerta);
        return toResponse(alerta);
    }

    @Transactional
    public void desactivar(Long id) {
        AlertaClimatica alerta = alertaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AlertaClimatica", "id", id));
        alerta.setActiva(false);
        alertaRepository.save(alerta);
    }

    private AlertaClimaticaResponse toResponse(AlertaClimatica a) {
        return AlertaClimaticaResponse.builder()
                .id(a.getId())
                .titulo(a.getTitulo())
                .descripcion(a.getDescripcion())
                .tipo(a.getTipo().name())
                .fechaEmision(a.getFechaEmision())
                .fechaExpiracion(a.getFechaExpiracion())
                .municipiosAfectados(a.getMunicipiosAfectados())
                .activa(a.getActiva())
                .estadoAlerta(a.getEstadoAlerta() != null ? a.getEstadoAlerta().name() : null)
                .generadaPorId(a.getEmitidaPor() != null ? a.getEmitidaPor().getId() : null)
                .createdAt(a.getCreatedAt())
                .emitidaPor(a.getEmitidaPor() != null ? a.getEmitidaPor().getNombreCompleto() : null)
                .build();
    }
}
