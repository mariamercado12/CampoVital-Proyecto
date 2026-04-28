package com.agrosmart.magdalena.controller;

import com.agrosmart.magdalena.dto.request.FincaRequest;
import com.agrosmart.magdalena.dto.response.ApiResponse;
import com.agrosmart.magdalena.dto.response.FincaResponse;
import com.agrosmart.magdalena.service.FincaService;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Fincas", description = "Gestión de fincas/unidades productivas")
@RestController
@RequestMapping("/fincas")
@RequiredArgsConstructor
public class FincaController {

    private final FincaService fincaService;

    @Operation(summary = "Listar todas las fincas activas")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<FincaResponse>>> listar(
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(fincaService.listarTodas(pageable)));
    }

    @Operation(summary = "Listar fincas por productor")
    @GetMapping("/productor/{productorId}")
    public ResponseEntity<ApiResponse<Page<FincaResponse>>> listarPorProductor(
            @PathVariable Long productorId, @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(fincaService.listarPorProductor(productorId, pageable)));
    }

    @Operation(summary = "Buscar fincas por municipio")
    @GetMapping("/municipio/{municipio}")
    public ResponseEntity<ApiResponse<List<FincaResponse>>> buscarPorMunicipio(
            @PathVariable String municipio) {
        return ResponseEntity.ok(ApiResponse.ok(fincaService.buscarPorMunicipio(municipio)));
    }

    @Operation(summary = "Obtener finca por ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FincaResponse>> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(fincaService.obtenerPorId(id)));
    }

    @Operation(summary = "Crear nueva finca")
    @PostMapping("/productor/{productorId}")
    @PreAuthorize("hasAnyRole('AGRICULTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<FincaResponse>> crear(
            @PathVariable Long productorId, @Valid @RequestBody FincaRequest request) {
        FincaResponse response = fincaService.crear(productorId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @Operation(summary = "Actualizar finca")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGRICULTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<FincaResponse>> actualizar(
            @PathVariable Long id, @Valid @RequestBody FincaRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Finca actualizada", fincaService.actualizar(id, request)));
    }

    @Operation(summary = "Eliminar finca (soft delete)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGRICULTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> eliminar(@PathVariable Long id) {
        fincaService.eliminar(id);
        return ResponseEntity.ok(ApiResponse.ok("Finca eliminada", null));
    }
}
