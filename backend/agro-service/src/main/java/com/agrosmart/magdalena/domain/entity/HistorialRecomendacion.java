package com.agrosmart.magdalena.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Representa una entrada en el historial de seguimiento de una recomendación.
 * Permite rastrear cuándo y cómo se aplicó una recomendación técnica.
 */
@Entity
@Table(name = "historial_recomendaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialRecomendacion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recomendacion_id", nullable = false)
    private Recomendacion recomendacion;

    @NotNull
    @Column(name = "fecha_registro", nullable = false)
    @Builder.Default
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Builder.Default
    @Column(nullable = false)
    private Boolean aplicada = false;

    @Size(max = 100)
    @Column(name = "registrado_por", length = 100)
    private String registradoPor;
}
