# Plan de Migración a Microservicios: CampoVital (Enfoque Prototipo 50%)

# Plan de Migración a Microservicios: CampoVital (Alcance: Prototipo 40-50%)

De los **47 Requerimientos Funcionales** definidos, el 40-50% equivale a implementar aproximadamente 20 requerimientos. Para que el prototipo sea funcional y demostrable, nos enfocaremos en la base del sistema (El "Core"):

**Incluido en este Prototipo (Fase 1 y 2):**
*   **UC6 y UC8 (Usuarios y Perfil):** RF-25 al RF-28, RF-33 al RF-35 (Gestión de roles y autenticación).
*   **UC9 (Gestionar Fincas):** RF-36 al RF-39 (Creación y mapeo de fincas).
*   **UC1 (Gestionar Cultivos):** RF-01 al RF-06 (Registro de siembras y validaciones lógicas).

**Pendiente para el restante 50% (Fases Futuras):**
*   Recomendaciones (UC2, UC3), Alertas Climáticas (UC4), Reportes (UC5) y Sincronización Offline (UC10).

## Fase 1: Reestructuración del Proyecto (Multi-Módulo Maven) ✅ [COMPLETADO]
**Objetivo:** Convertir la carpeta monolítica actual en una estructura capaz de alojar múltiples microservicios.
*   **Acción:** Se transformó el `pom.xml` principal en un "Padre" y se crearon carpetas independientes para `agro-service`, `auth-service` y `api-gateway`. El código viejo se movió a `agro-service`.
*   **Puertos Asignados:** Gateway (9000), Auth Service (8081), Agro Service (8082).
**Objetivo:** Preparar el terreno para que los microservicios puedan vivir y comunicarse.
*   **Paso 1.1:** Configurar un archivo `docker-compose.yml` (o configuración local) para levantar el servidor de base de datos **PostgreSQL** (con 4 bases de datos lógicas) y el servidor de mensajería **RabbitMQ** (para la sincronización offline).
*   **Paso 1.2:** Crear el proyecto "Raíz" o reestructurar las carpetas del proyecto para alojar múltiples sub-proyectos (cada microservicio será una pequeña aplicación independiente).

## Fase 2: Pasarela de APIs (API Gateway) ✅ [COMPLETADO]
**Objetivo:** Crear el punto de entrada único para el frontend.
*   **Explicación:** El Frontend (React) ya no llamará a "localhost:8080/cultivos". Llamará a la Pasarela (ej. "localhost:9000/api/agro/cultivos"). La Pasarela sabrá a qué microservicio redirigir la petición.
*   **Tecnología:** Spring Cloud Gateway (Configurado en el puerto 9000).

## Fase 3: Microservicio de Autenticación (Auth Service) ✅ [COMPLETADO]
**Objetivo:** Separar toda la lógica de usuarios y seguridad.
*   **Acción:** Se migró exitosamente la entidad `Usuario`, `Rol`, JWT y el `AuthController` hacia el nuevo sub-proyecto `auth-service`.
*   **Flujo de Datos:** El Frontend envía usuario/contraseña a la Pasarela -> La Pasarela enruta al Auth Service -> Auth Service valida en `db_usuarios` -> Devuelve un Token JWT.

## Fase 4: Microservicio Agrícola (Agro Service)
**Objetivo:** El núcleo del negocio.
*   **Paso 4.1:** Crear el proyecto Spring Boot para Agro.
*   **Paso 4.2:** Migrar `Finca`, `Parcela`, `Cultivo` y sus controladores.
*   **Flujo de Datos:** Todas las peticiones deben venir con un Token JWT. Este servicio validará el token y guardará los datos en `db_agro`.

## Fase 5: Microservicio de Recomendaciones
**Objetivo:** Motor de reglas y clima.
*   **Paso 5.1:** Crear proyecto Spring Boot para Recomendaciones.
*   **Paso 5.2:** Migrar la conexión a la API del Clima y las lógicas de alertas.
*   **Flujo de Datos:** Consultas asíncronas externas (cron jobs) que guardan resultados en `db_recomendaciones`.

## Fase 6: Servicio de Sincronización (Offline Sync)
**Objetivo:** Manejar las peticiones masivas cuando vuelve el internet.
*   **Flujo de Datos:** El celular recupera señal -> Envía 50 cultivos nuevos a la Pasarela -> Llegan al Sync Service -> El Sync Service no guarda en BD, sino que los mete a una cola de **RabbitMQ** -> El *Agro Service* lee la cola poco a poco y guarda en la base de datos sin saturarse.

## Fase 7: Refactorización del Frontend ✅ [COMPLETADO (Paso 7.1)]
**Objetivo:** Conectar la aplicación web React con la nueva arquitectura.
*   **Paso 7.1:** Cambiar las URLs base en los servicios de Axios/Fetch para apuntar a la Pasarela de APIs (Cambiado el proxy de Vite de 8080 a 9000).
*   **Paso 7.2:** Implementar la lógica de almacenamiento local (IndexedDB) e intercepción de red para cumplir el requerimiento offline real (Fase Futura).
