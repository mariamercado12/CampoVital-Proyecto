package com.agrosmart.magdalena.integration.weather;

import com.agrosmart.magdalena.dto.request.AlertaClimaticaRequest;
import java.util.List;

public interface WeatherServiceClient {
    List<AlertaClimaticaRequest> fetchCurrentAlerts(String region);
}
