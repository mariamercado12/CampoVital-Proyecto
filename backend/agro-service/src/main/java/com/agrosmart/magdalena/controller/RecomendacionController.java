package com.agrosmart.magdalena.controller;

import com.agrosmart.magdalena.dto.request.RecomendacionRequest;
import com.agrosmart.magdalena.dto.response.ApiResponse;
import com.agrosmart.magdalena.dto.response.RecomendacionResponse;
import com.agrosmart.magdalena.service.RecomendacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Recomendaciones", description = "Gestión de recomendaciones técnicas")
@RestController
@RequestMapping("/recomendaciones")
@RequiredArgsConstructor
public class RecomendacionController {

    private final RecomendacionService recomendacionService;

    @Operation(summary = "Listar recomendaciones por cultivo")
    @GetMapping("/cultivo/{cultivoId}")
    public ResponseEntity<ApiResponse<Page<RecomendacionResponse>>> listarPorCultivo(
            @PathVariable Long cultivoId, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(recomendacionService.listarPorCultivo(cultivoId, pageable)));
    }

    @Operation(summary = "Listar recomendaciones por productor")
    @GetMapping("/productor/{productorId}")
    public ResponseEntity<ApiResponse<Page<RecomendacionResponse>>> listarPorProductor(
            @PathVariable Long productorId, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(recomendacionService.listarPorProductor(productorId, pageable)));
    }

    @Operation(summary = "Listar recomendaciones pendientes")
    @GetMapping("/pendientes")
    public ResponseEntity<ApiResponse<Page<RecomendacionResponse>>> listarPendientes(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(recomendacionService.listarPendientes(pageable)));
    }

    @Operation(summary = "Obtener recomendación por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RecomendacionResponse>> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(recomendacionService.obtenerPorId(id)));
    }

    @Operation(summary = "Crear nueva recomendación")
    @PostMapping
    @PreAuthorize("hasAnyRole('TECNICO', 'ADMIN')")
    public ResponseEntity<ApiResponse<RecomendacionResponse>> crear(
            @Valid @RequestBody RecomendacionRequest request) {
        RecomendacionResponse response = recomendacionService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @Operation(summary = "Marcar recomendación como aplicada")
    @PatchMapping("/{id}/aplicar")
    public ResponseEntity<ApiResponse<RecomendacionResponse>> aplicar(
            @PathVariable Long id, @RequestParam(required = false) String observaciones) {
        return ResponseEntity.ok(ApiResponse.ok("Recomendación aplicada",
                recomendacionService.marcarComoAplicada(id, observaciones)));
    }

    @Operation(summary = "Complementar recomendación por un técnico")
    @PutMapping("/{id}/complementar")
    @PreAuthorize("hasRole('TECNICO')")
    public ResponseEntity<ApiResponse<RecomendacionResponse>> complementar(
            @PathVariable Long id, @RequestParam String nota, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Recomendación complementada",
                recomendacionService.complementar(id, nota, auth.getName())));
    }
}
