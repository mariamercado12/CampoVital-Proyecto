package com.agrosmart.magdalena.service;

import com.agrosmart.magdalena.domain.entity.Productor;
import com.agrosmart.magdalena.domain.entity.Reporte;
import com.agrosmart.magdalena.domain.enums.TipoReporte;
import com.agrosmart.magdalena.dto.request.ReporteRequest;
import com.agrosmart.magdalena.dto.response.ReporteResponse;
import com.agrosmart.magdalena.exception.BadRequestException;
import com.agrosmart.magdalena.exception.ResourceNotFoundException;
import com.agrosmart.magdalena.repository.CultivoRepository;
import com.agrosmart.magdalena.repository.FincaRepository;
import com.agrosmart.magdalena.repository.ProductorRepository;
import com.agrosmart.magdalena.repository.ReporteRepository;
import com.agrosmart.magdalena.repository.AlertaClimaticaRepository;
import com.agrosmart.magdalena.domain.entity.Cultivo;
import com.agrosmart.magdalena.domain.entity.AlertaClimatica;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio de generación y consulta de reportes de producción.
 * Genera un resumen en formato texto/JSON del estado productivo del productor.
 */
@Service
@RequiredArgsConstructor
public class ReporteService {

    private final ReporteRepository reporteRepository;
    private final ProductorRepository productorRepository;
    private final FincaRepository fincaRepository;
    private final CultivoRepository cultivoRepository;
    private final AlertaClimaticaRepository alertaRepository;

    @Transactional(readOnly = true)
    public Page<ReporteResponse> listarPorProductor(Long productorId, Pageable pageable) {
        return reporteRepository.findByProductorId(productorId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ReporteResponse obtenerPorId(Long id) {
        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reporte", "id", id));
        return toResponse(reporte);
    }

    /**
     * Genera un reporte de producción para un productor.
     * El contenido se genera automáticamente basado en las fincas y cultivos del productor.
     */
    @Transactional
    public ReporteResponse generar(Long productorId, ReporteRequest request) {
        Productor productor = productorRepository.findById(productorId)
                .orElseThrow(() -> new ResourceNotFoundException("Productor", "id", productorId));

        TipoReporte tipo;
        try {
            tipo = TipoReporte.valueOf(request.getTipo().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Tipo de reporte inválido: " + request.getTipo());
        }

        // Generar contenido del reporte
        long totalFincas = fincaRepository.countByProductorIdAndActivoTrue(productorId);
        String contenido = generarContenidoReporte(productor, tipo, totalFincas);

        Reporte reporte = Reporte.builder()
                .productor(productor)
                .tipo(tipo)
                .titulo(request.getTitulo() != null ? request.getTitulo()
                        : "Reporte de " + tipo.name().toLowerCase() + " - Agricultor ID: " + productor.getUsuarioId())
                .contenido(contenido)
                .periodoInicio(request.getPeriodoInicio())
                .periodoFin(request.getPeriodoFin())
                .build();

        reporte = reporteRepository.save(reporte);
        return toResponse(reporte);
    }

    private String generarContenidoReporte(Productor productor, TipoReporte tipo, long totalFincas) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("{\"productor\": \"%s\", ", "Agricultor " + productor.getUsuarioId()));
        sb.append(String.format("\"cedula\": \"%s\", ", productor.getCedula()));
        sb.append(String.format("\"tipo_reporte\": \"%s\", ", tipo.name()));
        sb.append(String.format("\"total_fincas\": %d, ", totalFincas));
        sb.append(String.format("\"asociacion\": \"%s\"}",
                productor.getAsociacion() != null ? productor.getAsociacion().getNombre() : "Sin asociación"));
        return sb.toString();
    }

    private ReporteResponse toResponse(Reporte r) {
        return ReporteResponse.builder()
                .id(r.getId())
                .titulo(r.getTitulo())
                .tipo(r.getTipo().name())
                .contenido(r.getContenido())
                .periodoInicio(r.getPeriodoInicio())
                .periodoFin(r.getPeriodoFin())
                .fechaGeneracion(r.getFechaGeneracion())
                .createdAt(r.getCreatedAt())
                .productorId(r.getProductor().getId())
                .productorNombre("Agricultor ID: " + r.getProductor().getUsuarioId())
                .build();
    }

    @Transactional(readOnly = true)
    public String generarCsvProduccion(Long productorId) {
        StringBuilder csv = new StringBuilder();
        csv.append("Productor,Cultivo,Area_Utilizada,Rendimiento_Estimado,Estado\n");
        // Simplified query logic for quick export
        Iterable<Cultivo> cultivos = productorId != null 
            ? cultivoRepository.findByProductorId(productorId, Pageable.unpaged()) 
            : cultivoRepository.findAll();
        for (Cultivo c : cultivos) {
            String prodNombre = "Agricultor ID: " + c.getParcela().getFinca().getProductor().getUsuarioId();
            csv.append(String.format("%s,%s,%.2f,%.2f,%s\n", 
                prodNombre, c.getNombre(), c.getAreaUtilizada(), c.getRendimientoEsperado(), c.getEstado().name()
            ));
        }
        return csv.toString();
    }

    @Transactional(readOnly = true)
    public String generarCsvInventarioCultivos(Long fincaId) {
        StringBuilder csv = new StringBuilder();
        csv.append("Finca,Parcela,Cultivo,Variedad,Fecha_Siembra,Estado\n");
        Iterable<Cultivo> cultivos = fincaId != null 
            ? cultivoRepository.findByFincaId(fincaId, Pageable.unpaged()) 
            : cultivoRepository.findAll();
        for (Cultivo c : cultivos) {
            csv.append(String.format("%s,%s,%s,%s,%s,%s\n", 
                c.getParcela().getFinca().getNombre(),
                c.getParcela().getNombre(),
                c.getNombre(),
                c.getVariedad(),
                c.getFechaSiembra() != null ? c.getFechaSiembra().toString() : "N/A",
                c.getEstado().name()
            ));
        }
        return csv.toString();
    }

    @Transactional(readOnly = true)
    public String generarCsvAlertas() {
        StringBuilder csv = new StringBuilder();
        csv.append("Tipo_Alerta,Titulo,Fecha_Emision,Estado,Activa\n");
        List<AlertaClimatica> alertas = alertaRepository.findAll();
        for (AlertaClimatica a : alertas) {
            csv.append(String.format("%s,%s,%s,%s,%s\n", 
                a.getTipo().name(),
                a.getTitulo(),
                a.getFechaEmision() != null ? a.getFechaEmision().toString() : "N/A",
                a.getEstadoAlerta().name(),
                a.getActiva().toString()
            ));
        }
        return csv.toString();
    }
}
