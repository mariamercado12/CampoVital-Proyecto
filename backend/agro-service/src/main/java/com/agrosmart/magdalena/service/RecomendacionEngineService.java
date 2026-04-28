package com.agrosmart.magdalena.service;

import com.agrosmart.magdalena.domain.entity.Cultivo;
import com.agrosmart.magdalena.domain.entity.Recomendacion;
import com.agrosmart.magdalena.domain.event.CultivoStateChangedEvent;
import com.agrosmart.magdalena.repository.RecomendacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecomendacionEngineService {

    private final RecomendacionRepository recomendacionRepository;

    @EventListener
    public void onCultivoStateChanged(CultivoStateChangedEvent event) {
        Cultivo cultivo = event.getCultivo();
        String nuevoEstado = event.getEstadoNuevo();
        
        log.info("Motor de recomendaciones detectó cambio de estado a {} para el cultivo ID {}", nuevoEstado, cultivo.getId());
        
        // Simulación de Motor de Reglas
        String titulo = "";
        String descripcion = "";
        
        switch (nuevoEstado) {
            case "SEMBRADO":
                titulo = "Fertilización de Establecimiento y Riego";
                descripcion = "Se recomienda aplicar fertilizante rico en Fósforo y mantener el lote " + cultivo.getParcela().getNombre() + " con humedad de capacidad de campo durante la primera semana.";
                break;
            case "EN_CRECIMIENTO":
                titulo = "Control Preventivo de Plagas y Malezas";
                descripcion = "Dado el desarrollo foliar, es prioridad realizar desyerba química o manual y aplicar fungicida preventivo.";
                break;
            case "EN_COSECHA":
                titulo = "Protocolo de Recolección Segura";
                descripcion = "Inicie la recolección en las horas más frescas de la mañana. No prolongue el acopio en campo bajo el sol de forma directa.";
                break;
            default:
                return; // No rules for this state
        }
        
        Recomendacion recomendacion = Recomendacion.builder()
                .titulo("Autogenerado: " + titulo)
                .descripcion(descripcion)
                .cultivo(cultivo)
                .aplicada(false)
                .build();
                
        recomendacionRepository.save(recomendacion);
        log.info("Recomendación autogenerada y guardada exitosamente.");
    }
}
