package com.agrosmart.magdalena;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * AgroSmart Magdalena — Punto de entrada de la aplicación.
 *
 * Plataforma Digital de Agricultura Inteligente para Pequeños Productores del Magdalena.
 *
 * Arquitectura: Monolito modular en capas.
 * Se descarta microservicios en esta primera versión por:
 *   - Bajo costo operativo requerido
 *   - Simplicidad de despliegue (un solo artefacto)
 *   - Escala esperada (~miles de usuarios, no millones)
 *   - Equipo de mantenimiento pequeño
 *   - Posibilidad de evolución futura si la demanda crece
 */
@SpringBootApplication
public class AgroSmartApplication {

    public static void main(String[] args) {
        SpringApplication.run(AgroSmartApplication.class, args);
    }

    @Bean
    public CommandLineRunner fixDatabaseConstraints(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE ubicaciones_geograficas ALTER COLUMN latitud DROP NOT NULL");
                jdbcTemplate.execute("ALTER TABLE ubicaciones_geograficas ALTER COLUMN longitud DROP NOT NULL");
                System.out.println("=== NOT NULL CONSTRAINTS SUCCESSFULLY REMOVED FROM DATABASE ===");
            } catch (Exception e) {
                System.out.println("=== FAILED TO ALTER TABLE (MIGHT BE ALREADY DROPPED) ===");
            }
        };
    }
}
