package com.agrosmart.magdalena.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecomendacionResponse {
    private Long id;
    private String titulo;
    private String descripcion;
    private String prioridad;
    private Boolean aplicada;
    private LocalDateTime fechaEmision;
    private LocalDateTime createdAt;

    // Cultivo
    private Long cultivoId;
    private String cultivoNombre;

    // Técnico
    private Long tecnicoId;
    private String tecnicoNombre;
}
