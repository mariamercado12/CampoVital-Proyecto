package com.agrosmart.magdalena.integration.weather;

import com.agrosmart.magdalena.domain.enums.TipoAlerta;
import com.agrosmart.magdalena.dto.request.AlertaClimaticaRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class MockWeatherServiceClient implements WeatherServiceClient {

    @Override
    public List<AlertaClimaticaRequest> fetchCurrentAlerts(String region) {
        // Simulan 2 alertas nuevas si la región es Magdalena (por defecto)
        return List.of(
            AlertaClimaticaRequest.builder()
                .titulo("Ola de Calor Inminente")
                .descripcion("Altas temperaturas esperadas para el fin de semana. Mock API.")
                .tipo(TipoAlerta.ONDA_DE_CALOR.name())
                .fechaEmision(LocalDateTime.now())
                .fechaExpiracion(LocalDateTime.now().plusDays(3))
                .municipiosAfectados(List.of("Santa Marta", "Ciénaga", "Aracataca"))
                .build(),
            AlertaClimaticaRequest.builder()
                .titulo("Alerta por Vientos Fuertes")
                .descripcion("Ráfagas fuertes de viento. Posible afectación a cultivos altos. Mock API.")
                .tipo(TipoAlerta.VIENTO_FUERTE.name())
                .fechaEmision(LocalDateTime.now())
                .fechaExpiracion(LocalDateTime.now().plusDays(1))
                .municipiosAfectados(List.of("Zona Bananera", "Fundación"))
                .build()
        );
    }
}
