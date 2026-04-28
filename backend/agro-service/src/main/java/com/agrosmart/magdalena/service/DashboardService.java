package com.agrosmart.magdalena.service;

import com.agrosmart.magdalena.domain.entity.Usuario;
import com.agrosmart.magdalena.exception.ResourceNotFoundException;
import com.agrosmart.magdalena.repository.CultivoRepository;
import com.agrosmart.magdalena.repository.FincaRepository;
import com.agrosmart.magdalena.repository.UsuarioRepository;
import com.agrosmart.magdalena.repository.RecomendacionRepository;
import com.agrosmart.magdalena.repository.SincronizacionOfflineRepository;
import com.agrosmart.magdalena.repository.AlertaClimaticaRepository;
import com.agrosmart.magdalena.domain.enums.EstadoSincronizacion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final FincaRepository fincaRepository;
    private final CultivoRepository cultivoRepository;
    private final RecomendacionRepository recomendacionRepository;
    private final AlertaClimaticaRepository alertaClimaticaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SincronizacionOfflineRepository syncRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getProductorStats(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
        Long productorId = usuario.getId(); // En nuestra base simplificada, el ID usuario es la foreign key productor_id

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFincas", fincaRepository.count()); // Usando datos globales (mock)
        stats.put("cultivosActivos", cultivoRepository.count());
        stats.put("recomendacionesPendientes", recomendacionRepository.count());
        stats.put("alertasActivas", alertaClimaticaRepository.count());
        stats.put("syncPendientes", syncRepository.findByUsuarioIdAndEstado(productorId, EstadoSincronizacion.PENDIENTE).size());
        
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAsociacionStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("productoresAsociados", usuarioRepository.count());
        stats.put("cultivosPorZonaActivos", cultivoRepository.count());
        stats.put("alertasRelevantes", alertaClimaticaRepository.count());
        return stats;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsuarios", usuarioRepository.count());
        stats.put("fincasTotales", fincaRepository.count());
        stats.put("cultivosTotales", cultivoRepository.count());
        stats.put("alertasEmitidas", alertaClimaticaRepository.count());
        return stats;
    }
}
