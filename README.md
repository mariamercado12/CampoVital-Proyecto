# AgroSmart Magdalena - Plataforma de Gestión Agrícola

AgroSmart Magdalena es una plataforma web orientada al sector cacaotero/bananero (y agrícola general) diseñada para operar en zonas de baja conectividad. 

## Stack Tecnológico 
*   **Backend**: Spring Boot 3.2.x, Java 17, Spring Security (JWT), Spring Data JPA, Maven.
*   **Frontend**: React.js 18.x, react-router-dom, Axios, Vanilla CSS (CSS Modules/Global).
*   **Base de Datos**: PostgreSQL 15+.
*   **Estrategia Offline**: LocalStorage, Axios Interceptors (caché/cola), Fallback UI.

## Estructura de Capas (Backend)
El sistema utiliza una arquitectura de Monolito Modular con capas estrictas:
*   **`controller`**: Controladores REST autodefinidos con validación `@Valid` (ej: `CultivoController`, `DashboardController`).
*   **`service`**: Contiene la lógica de negocio, validación cruzada y transaccionalidad (`FincaService`, `SincronizacionOfflineService`).
*   **`repository`**: Interfaces Spring Data JPA inyectadas.
*   **`domain`**: Entidades ORM (`Cultivo`, `SincronizacionOffline`) interconectadas mediantes flujos foráneos strictos y Eventos de Dominio (ej. `CultivoStateChangedEvent`).
*   **`security`**: Filtro JWT stateless estricto por Roles (`@PreAuthorize`).
*   **`exception`**: `@ControllerAdvice` global mapeando excepciones hacia un envoltorio `ApiResponse`.

## Cómo Ejecutar el Proyecto

### 1. Base de datos
Crear una base de datos local en PostgreSQL llamada `agrosmart` (o modificar `application.properties` en caso distinto):
```sql
CREATE DATABASE agrosmart;
```

### 2. Ejecutar el Backend (Spring Boot)
1. Navegar a `\backend`.
2. Renombrar o revisar `application.properties` verificando `spring.datasource.url`, `username` y `password`.
3. Ejecutar:
   ```bash
   mvn clean spring-boot:run
   ```
4. Para ejecutar la suite de pruebas unitarias y de integración (Validación de Servicios Críticos, Sync Offline y Auth):
   ```bash
   mvn clean test
   ```

### 3. Ejecutar el Frontend (React)
1. Navegar a `\frontend`.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

## Módulos Críticos Implementados y Activos
*   **Seguridad**: Autenticación JWT y sistema de roles (`ADMIN`, `PRODUCTOR`, `TECNICO`).
*   **Core Agrícola**: Fincas, Lotes(Parcelas), Cultivos e Inventario con Validaciones DTO y lógicas (Ej. control área utilizable <= área de lote).
*   **Offline-First**: Caché automático de lecturas GET, encolamiento de operaciones transaccionales (CREATE/UPDATE) y sincronizador automático (`/sync`) implementado tanto en DB (`SincronizacionOfflineService`) como en navegador (`offlineService.js`).
*   **Recomendaciones & Alertas Climatológicas**: *Event-Driven*: Al cambiar un cultivo de estado, `RecomendacionEngineService` genera reglas automáticas de nutrición. Exportador CSV del ecosistema vivo incorporado.
*   **Exportación de Datos y Dashboard**: Endpoints de generación nativa CSV y agregación dinámica para Productores y Administradores.


prueba commit