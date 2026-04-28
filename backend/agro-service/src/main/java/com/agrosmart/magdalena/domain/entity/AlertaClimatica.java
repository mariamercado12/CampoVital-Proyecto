package com.agrosmart.magdalena.domain.entity;

import com.agrosmart.magdalena.domain.enums.EstadoAlerta;
import com.agrosmart.magdalena.domain.enums.TipoAlerta;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Representa una alerta climática emitida por un administrador.
 * Las alertas se filtran por municipios afectados para notificar
 * a los productores de las zonas correspondientes.
 *
 * Reglas de negocio:
 *   - Una alerta puede afectar a múltiples municipios
 *   - Las alertas tienen fecha de expiración
 *   - Se pueden consultar por historial
 *   - Soporta soft delete via 'activa'
 */
@Entity
@Table(name = "alertas_climaticas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertaClimatica extends BaseEntity {

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String titulo;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoAlerta tipo;

    @NotNull
    @Column(name = "fecha_emision", nullable = false)
    @Builder.Default
    private LocalDateTime fechaEmision = LocalDateTime.now();

    @Column(name = "fecha_expiracion")
    private LocalDateTime fechaExpiracion;

    /**
     * Lista de municipios del Magdalena afectados por esta alerta.
     * Permite filtrar alertas relevantes por ubicación del productor.
     */
    @ElementCollection
    @CollectionTable(name = "alerta_municipios", joinColumns = @JoinColumn(name = "alerta_id"))
    @Column(name = "municipio")
    @Builder.Default
    private List<String> municipiosAfectados = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emitida_por")
    private Usuario emitidaPor;

    @Builder.Default
    @Column(nullable = false)
    private Boolean activa = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", length = 20)
    @Builder.Default
    private EstadoAlerta estadoAlerta = EstadoAlerta.NUEVA;
}
