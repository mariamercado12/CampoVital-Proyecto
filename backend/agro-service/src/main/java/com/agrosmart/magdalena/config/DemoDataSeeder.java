package com.agrosmart.magdalena.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Cargador inicial de datos de demostración.
 * Crea 3 fincas adicionales con cultivos si no existen datos de demo previos.
 * Se ejecuta automáticamente al iniciar el servidor.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        try {
            LocalDateTime now = LocalDateTime.now();

            // Solo ejecutar si ya hay al menos un usuario productor registrado
            Integer productoresCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM productores", Integer.class);
            
            if (productoresCount == null || productoresCount == 0) {
                log.info("=== Sin productores registrados, omitiendo datos de demo ===");
                return;
            }

            // Solo insertar si no existen las fincas demo
            Integer fincasDemo = jdbc.queryForObject(
                "SELECT COUNT(*) FROM fincas WHERE nombre IN ('La Esperanza','El Progreso','Villa del Carmen')",
                Integer.class);
            
            if (fincasDemo != null && fincasDemo >= 3) {
                log.info("=== Datos de demostración ya existen ===");
                return;
            }

            // 1. Crear o obtener un productor de demostración dedicado (ID 9999)
            jdbc.update("INSERT INTO productores (usuario_id, cedula, activo, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?) ON CONFLICT (cedula) DO NOTHING",
                    9999L, "DEMO-DATA-001", true, now, now);
            
            Long productorId = jdbc.queryForObject(
                "SELECT id FROM productores WHERE cedula = 'DEMO-DATA-001' LIMIT 1", Long.class);
            
            if (productorId == null) return;

            // ──────────────────────────────────────────────────────
            // FINCA 1: La Esperanza – Aracataca
            // ──────────────────────────────────────────────────────
            Long ub1 = createUbicacion(jdbc, "Magdalena", "Aracataca", "El Retiro", now);
            
            jdbc.update("INSERT INTO fincas (nombre, productor_id, ubicacion_id, area_total, unidad_area, activo, created_at, updated_at) " +
                "VALUES (?,?,?,?,?,?,?,?)",
                "La Esperanza", productorId, ub1, 120.0, "hectáreas", true, now, now);
            
            Long f1 = jdbc.queryForObject(
                "SELECT id FROM fincas WHERE nombre='La Esperanza' AND productor_id=? ORDER BY id DESC LIMIT 1",
                Long.class, productorId);

            // Parcelas finca 1
            Long p1a = createParcela(jdbc, "Lote Banano Norte", f1, 30.0, now);
            Long p1b = createParcela(jdbc, "Lote Cacao Sur", f1, 20.0, now);
            Long p1c = createParcela(jdbc, "Lote Palma", f1, 15.0, now);

            // Cultivos finca 1
            insertCultivo(jdbc, "Banano", "Gran Enano", p1a, 28.0, "EN_CRECIMIENTO", "2025-09-10", "2026-06-10", 45.0,
                "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400", now);
            insertCultivo(jdbc, "Cacao", "CCN-51", p1b, 18.0, "SEMBRADO", "2025-11-05", "2026-08-05", 12.0,
                "https://images.unsplash.com/photo-1606313564200-e75d5e31949d?w=400", now);
            insertCultivo(jdbc, "Palma Africana", "Híbrido OxG", p1c, 14.0, "PLANIFICADO", "2026-02-01", null, 20.0,
                "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400", now);

            // ──────────────────────────────────────────────────────
            // FINCA 2: El Progreso – Ciénaga
            // ──────────────────────────────────────────────────────
            Long ub2 = createUbicacion(jdbc, "Magdalena", "Ciénaga", "San Pedro", now);

            jdbc.update("INSERT INTO fincas (nombre, productor_id, ubicacion_id, area_total, unidad_area, activo, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)",
                "El Progreso", productorId, ub2, 80.0, "hectáreas", true, now, now);
            Long f2 = jdbc.queryForObject(
                "SELECT id FROM fincas WHERE nombre='El Progreso' AND productor_id=? ORDER BY id DESC LIMIT 1", Long.class, productorId);

            Long p2a = createParcela(jdbc, "Lote Yuca", f2, 20.0, now);
            Long p2b = createParcela(jdbc, "Lote Maíz", f2, 25.0, now);

            insertCultivo(jdbc, "Yuca", "Venezolana", p2a, 18.0, "EN_CRECIMIENTO", "2025-10-15", "2026-04-15", 22.0,
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", now);
            insertCultivo(jdbc, "Maíz", "ICA V-109", p2b, 23.0, "SEMBRADO", "2025-12-01", "2026-05-01", 5.0,
                "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400", now);

            // ──────────────────────────────────────────────────────
            // FINCA 3: Villa del Carmen – El Banco
            // ──────────────────────────────────────────────────────
            Long ub3 = createUbicacion(jdbc, "Magdalena", "El Banco", "Los Mangos", now);

            jdbc.update("INSERT INTO fincas (nombre, productor_id, ubicacion_id, area_total, unidad_area, activo, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)",
                "Villa del Carmen", productorId, ub3, 60.0, "hectáreas", true, now, now);
            Long f3 = jdbc.queryForObject(
                "SELECT id FROM fincas WHERE nombre='Villa del Carmen' AND productor_id=? ORDER BY id DESC LIMIT 1", Long.class, productorId);

            Long p3a = createParcela(jdbc, "Lote Papaya", f3, 12.0, now);
            Long p3b = createParcela(jdbc, "Lote Plátano", f3, 18.0, now);

            insertCultivo(jdbc, "Papaya", "Maradol", p3a, 10.0, "EN_COSECHA", "2025-06-20", "2026-01-20", 50.0,
                "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400", now);
            insertCultivo(jdbc, "Plátano", "Hartón", p3b, 16.0, "EN_CRECIMIENTO", "2025-08-10", "2026-07-10", 30.0,
                "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400", now);

            log.info("=== ✅ Datos demo cargados correctamente ===");

            // --- NUEVO: LIMPIEZA DE DATOS ANTIGUOS ---
            log.info("=== 🧹 LIMPIEZA DE HECTÁREAS: Ajustando Lotes Principales === Rose");
            // Si hay un lote que se llama 'Lote Principal', le ponemos área 0 
            // para que el productor pueda registrar sus propios lotes/cultivos sin bloqueos.
            jdbc.execute("UPDATE parcelas SET area_parcela = 0 WHERE nombre = 'Lote Principal' AND activo = true");
            log.info("=== ✅ Limpieza de Lotes Principales completada ===");

        } catch (Exception e) {
            log.error("=== ❌ Error al cargar datos demo: {} ===", e.getMessage(), e);
        }
    }

    private Long createUbicacion(JdbcTemplate jdbc, String dpto, String mnp, String vereda, LocalDateTime now) {
        jdbc.update("INSERT INTO ubicaciones_geograficas (departamento, municipio, vereda, created_at, updated_at) VALUES (?,?,?,?,?)",
                dpto, mnp, vereda, now, now);
        return jdbc.queryForObject("SELECT id FROM ubicaciones_geograficas WHERE municipio=? ORDER BY id DESC LIMIT 1", Long.class, mnp);
    }

    private Long createParcela(JdbcTemplate jdbc, String nombre, Long fincaId, Double area, LocalDateTime now) {
        jdbc.update("INSERT INTO parcelas (nombre,finca_id,area_parcela,unidad_area,activo,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
                nombre, fincaId, area, "hectáreas", true, now, now);
        return jdbc.queryForObject("SELECT id FROM parcelas WHERE nombre=? AND finca_id=? ORDER BY id DESC LIMIT 1", Long.class, nombre, fincaId);
    }

    private void insertCultivo(JdbcTemplate jdbc, String nombre, String variedad, Long parcelaId,
                                Double area, String estado, String fechaSiembra, String fechaCosecha,
                                Double rendimiento, String imagenUrl, LocalDateTime now) {
        jdbc.update(
            "INSERT INTO cultivos (nombre,variedad,parcela_id,area_utilizada,estado,fecha_siembra," +
            "fecha_cosecha_estimada,rendimiento_esperado,unidad_rendimiento,imagen_url,activo,created_at,updated_at) " +
            "VALUES (?,?,?,?,?,?,?,?,'toneladas/hectárea',?,?,?,?)",
            nombre, variedad, parcelaId, area, estado,
            fechaSiembra != null ? java.sql.Date.valueOf(fechaSiembra) : null,
            fechaCosecha != null ? java.sql.Date.valueOf(fechaCosecha) : null,
            rendimiento, imagenUrl, true, now, now
        );
    }
}
