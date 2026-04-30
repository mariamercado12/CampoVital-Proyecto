package com.agrosmart.magdalena;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
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
public class AgroSmartApplication extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(AgroSmartApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(AgroSmartApplication.class, args);
    }

    @Bean
    public CommandLineRunner fixDatabaseConstraints(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE ubicaciones_geograficas ALTER COLUMN latitud DROP NOT NULL");
                jdbcTemplate.execute("ALTER TABLE ubicaciones_geograficas ALTER COLUMN longitud DROP NOT NULL");
                jdbcTemplate.execute("ALTER TABLE cultivos ALTER COLUMN fecha_siembra DROP NOT NULL");
                jdbcTemplate.execute("ALTER TABLE cultivos ALTER COLUMN imagen_url TYPE TEXT");
                System.out.println("Restricción NOT NULL eliminada de fecha_siembra e imagen_url convertida a TEXT.");

                // Insertar alertas climáticas de ejemplo si no existen
                long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM alertas_climaticas", Long.class);
                if (count == 0) {
                    jdbcTemplate.execute("INSERT INTO alertas_climaticas (id, titulo, descripcion, tipo, fecha_emision, activa, estado, created_at, updated_at) " +
                        "VALUES (101, 'Alerta de Sequía Prolongada', 'Se prevén bajas precipitaciones en la zona norte del departamento. Se recomienda optimizar el riego.', 'SEQUIA', NOW(), true, 'NUEVA', NOW(), NOW())");
                    jdbcTemplate.execute("INSERT INTO alerta_municipios (alerta_id, municipio) VALUES (101, 'Santa Marta'), (101, 'Ciénaga'), (101, 'Zona Bananera')");
                    
                    jdbcTemplate.execute("INSERT INTO alertas_climaticas (id, titulo, descripcion, tipo, fecha_emision, activa, estado, created_at, updated_at) " +
                        "VALUES (102, 'Riesgo de Inundación por Lluvias', 'Aumento en el nivel de los ríos del sur. Precaución en zonas bajas.', 'INUNDACION', NOW(), true, 'NUEVA', NOW(), NOW())");
                    jdbcTemplate.execute("INSERT INTO alerta_municipios (alerta_id, municipio) VALUES (102, 'El Banco'), (102, 'Guamal')");
                    
                    System.out.println("Alertas climáticas de ejemplo insertadas.");
                }
                System.out.println("=== NOT NULL CONSTRAINTS SUCCESSFULLY REMOVED FROM DATABASE ===");
            } catch (Exception e) {
                System.out.println("=== FAILED TO ALTER TABLE (MIGHT BE ALREADY DROPPED) ===");
            }
        };
    }
}
