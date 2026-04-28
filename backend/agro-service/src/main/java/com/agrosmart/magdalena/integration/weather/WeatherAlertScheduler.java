package com.agrosmart.magdalena.integration.weather;

import com.agrosmart.magdalena.dto.request.AlertaClimaticaRequest;
import com.agrosmart.magdalena.service.AlertaClimaticaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WeatherAlertScheduler {

    private final WeatherServiceClient weatherServiceClient;
    private final AlertaClimaticaService alertaService;

    // Se ejecuta según cron (ejemplo cada hora, pero aquí cada minuto para dev testing)
    @Scheduled(cron = "0 * * * * *")
    public void scheduleWeatherAlerts() {
        log.info("Consultando proveedor meteorológico mock...");
        try {
            List<AlertaClimaticaRequest> alertas = weatherServiceClient.fetchCurrentAlerts("Magdalena");
            for (AlertaClimaticaRequest req : alertas) {
                // En producción habría un hash/id externo para evitar duplicados
                // Aquí simplemente creamos las alertas mock usando el admin 1 = Sistema
                alertaService.crear(req, "admin@agrosmart.com");
            }
            log.info("Se han sincronizado {} nuevas alertas meteorológicas.", alertas.size());
        } catch(Exception e) {
            log.error("Error consultando alertas climáticas", e);
        }
    }
}
