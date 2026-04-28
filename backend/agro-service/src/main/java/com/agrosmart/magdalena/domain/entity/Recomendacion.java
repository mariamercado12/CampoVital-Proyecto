package com.agrosmart.magdalena.domain.entity;

import com.agrosmart.magdalena.domain.enums.Prioridad;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Representa una recomendación técnica emitida por un técnico agropecuario
 * para un cultivo específico.
 *
 * Reglas de negocio:
 *   - Una recomendación está vinculada a un cultivo
 *   - Opcionalmente, está vinculada al técnico que la emitió
 *   - Tiene un nivel de prioridad (BAJA, MEDIA, ALTA, CRITICA)
 *   - Genera historial cuando se aplica o se registra seguimiento
 */
@Entity
@Table(name = "recomendaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recomendacion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cultivo_id", nullable = false)
    private Cultivo cultivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tecnico_id")
    private TecnicoAgropecuario tecnico;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String titulo;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @NotNull
    @Column(name = "fecha_emision", nullable = false)
    @Builder.Default
    private LocalDateTime fechaEmision = LocalDateTime.now();

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Prioridad prioridad = Prioridad.MEDIA;

    @Builder.Default
    @Column(nullable = false)
    private Boolean aplicada = false;

    @OneToMany(mappedBy = "recomendacion", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<HistorialRecomendacion> historial = new ArrayList<>();
}
