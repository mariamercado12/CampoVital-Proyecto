# Identidad del Proyecto
* **Nombre:** CampoVital
* **Eslogan:** "Tecnología que echa raíces" / "Conectando el campo con el futuro"

---

# Documento Consolidado: Arquitectura, Casos de Uso y Requerimientos
---

## 1. Resumen: Microservicios y Bases de Datos Necesarias
Para este proyecto bajo una arquitectura de microservicios, serán necesarios **4 Microservicios principales** y, aplicando el patrón de diseño, se requerirán **4 Bases de Datos lógicas** (esquemas independientes dentro de un servidor PostgreSQL).

1. **Microservicio de Autenticación y Usuarios:** 
   * **¿Para qué sirve?** Gestiona el inicio de sesión, contraseñas, roles (Admin, Técnico, etc.) y recuperación de cuentas.
   * **Base de datos:** `db_usuarios` (PostgreSQL).
2. **Microservicio Agrícola (Fincas y Cultivos):**
   * **¿Para qué sirve?** Es el núcleo (Core) donde el agricultor y técnico registran las fincas, hectáreas, parcelas y siembras.
   * **Base de datos:** `db_agro` (PostgreSQL).
3. **Microservicio de Recomendaciones y Clima:**
   * **¿Para qué sirve?** Consume las APIs externas del clima, evalúa las reglas agronómicas y genera sugerencias automáticas o manuales.
   * **Base de datos:** `db_recomendaciones` (PostgreSQL).
4. **Microservicio de Sincronización Offline:**
   * **¿Para qué sirve?** Recibe todos los paquetes de datos cuando un celular recupera la señal de internet, los guarda en una cola (RabbitMQ) y los distribuye a los otros servicios para no saturarlos.
   * **Base de datos:** No usa base de datos propia persistente, usa un broker de mensajería (RabbitMQ).

*(Nota: También puede existir un microservicio ligero de "Reportes" para la Asociación Agrícola que consuma datos de lectura).*

---

## 2. Requerimientos Funcionales Corregidos y Detallados

*   **UC0: Autenticación de Usuarios (Nuevo)**
    *   **RF-00:** El sistema debe proporcionar un mecanismo de autenticación centralizado que permita a todos los usuarios registrados (Agricultores, Técnicos, Asociación y Administradores) iniciar sesión en la plataforma de manera segura mediante la validación estricta de sus credenciales de acceso (correo electrónico y contraseña cifrada), garantizando así que solo personal autorizado pueda acceder a las funcionalidades correspondientes a su rol a través de su dispositivo.

*   **UC6: Gestionar Usuarios (Corregido)**
    *   **RF-25:** El sistema debe habilitar un módulo administrativo integral que le permita al perfil de Administrador crear, editar y gestionar de forma centralizada las cuentas de acceso para todos los actores de la plataforma, permitiendo la asignación obligatoria de roles específicos (Agricultores, Técnicos Agropecuarios y Asociación Agrícola) para establecer un control de acceso adecuado.

*   **UC10: Sincronizar Información (Corregido)**
    *   **RF-40.1:** El sistema debe incorporar un almacenamiento local en el navegador que permita al Agricultor guardar temporalmente y de forma segura todos los registros detallados de sus fincas, parcelas y ciclos de cultivos directamente en la memoria de su dispositivo, garantizando que el flujo de trabajo no se interrumpa en caso de pérdida de conectividad a internet.
    *   **RF-40.2:** El sistema debe proporcionar al Técnico Agropecuario la capacidad de persistir localmente en su dispositivo todas las evaluaciones técnicas y recomendaciones agronómicas que genere durante sus visitas de campo, asegurando que la información recolectada en zonas sin cobertura de red se mantenga íntegra.
    *   **RF-40.3:** El sistema debe implementar un servicio en segundo plano que monitoree el estado de la red del dispositivo, de manera que, al detectar una conexión estable, inicie automáticamente la transmisión de todos los datos almacenados localmente hacia el Microservicio de Sincronización en la nube.

*   **UC3: Validar Recomendaciones Técnicas (Restaurado)**
    *   **RF-12:** El sistema debe permitir al Técnico Agropecuario visualizar y auditar las sugerencias de manejo generadas automáticamente por el motor de reglas del sistema, otorgándole la autoridad técnica para aprobar, modificar o rechazar su publicación hacia el perfil del Agricultor.

*   **Nuevos Requerimientos de Backend (Añadir al final de tu documento, ej. RF-43 a RF-45)**
    *   **RF-43:** El sistema debe ejecutar una tarea programada (cron job) cada 12 horas que se encargue de establecer comunicación con las APIs meteorológicas externas para extraer y procesar variables climáticas críticas (humedad, precipitación y temperatura) según las coordenadas geográficas de cada finca.
    *   **RF-44:** El sistema debe ejecutar un motor de reglas que tome los datos climáticos obtenidos y los compare detalladamente con las constantes térmicas y requerimientos hídricos específicos que exige la etapa fenológica actual de cada cultivo (ej. germinación, floración) para detectar posibles anomalías.
    *   **RF-45:** El sistema debe generar y enviar notificaciones de pre-alerta técnica a la bandeja del Técnico Agropecuario advirtiendo cuando las variables climáticas proyectadas superen los umbrales de tolerancia del cultivo, permitiéndole validar sugerencias preventivas antes de publicarlas.

---

## 3. Diagramas de Casos de Uso (PlantUML)

*(Instrucción: Copia el código a https://www.planttext.com/ para generar las imágenes de Casos de Uso y pegarlas en el Word)*

**Caso de Uso Nivel 0 (Visión General de Actores y Módulos)**
```plantuml
@startuml
left to right direction
actor "Agricultor" as Agr
actor "Técnico Agropecuario" as Tec
actor "Asociación Agrícola" as Aso
actor "Administrador" as Adm

rectangle "Plataforma CampoVital Web (PWA)" {
  usecase "Gestionar Fincas y Cultivos" as UC_Agro
  usecase "Gestionar y Validar Recomendaciones" as UC_Rec
  usecase "Consultar Reportes de Producción" as UC_Rep
  usecase "Sincronización Offline de Datos" as UC_Sync
  usecase "Administrar Usuarios y Configuración" as UC_Admin
}

Agr --> UC_Agro
Agr --> UC_Rec
Agr --> UC_Sync

Tec --> UC_Agro
Tec --> UC_Rec
Tec --> UC_Sync

Aso --> UC_Rep

Adm --> UC_Admin
@enduml
```

**Caso de Uso Nivel 1 (Detalle de Flujo Agrícola y Recomendaciones)**
```plantuml
@startuml
left to right direction
actor "Agricultor" as Agr
actor "Técnico Agropecuario" as Tec

package "Módulos de Campo" {
  usecase "Registrar/Editar Finca" as UC1
  usecase "Registrar Ciclo de Cultivo" as UC2
  usecase "Consultar Alertas Climáticas" as UC3
  usecase "Aplicar Recomendación" as UC4
  usecase "Aprobar/Crear Recomendación Manual" as UC5
}

Agr --> UC1
Agr --> UC2
Agr --> UC3
Agr --> UC4

Tec --> UC1
Tec --> UC2
Tec --> UC3
Tec --> UC5

UC4 .> UC5 : <<Extends>> \n (El agricultor aplica\nlo que el técnico aprueba)
@enduml
```

---

## 4. Diseño Arquitectónico (Microservicios)

*(Mantener el texto generado anteriormente en el documento Word sobre la justificación de microservicios, aislamiento de fallos, servidores Tomcat externos y la naturaleza de Aplicación Web Responsiva).*

---

## 5. Diagramas de Arquitectura (PlantUML)

**Diagramas de Datos (Una Base de Datos por Microservicio)**

*Base de Datos: Autenticación*
```plantuml
@startuml
entity "USUARIO" as user {
  * id_usuario : int
  --
  nombre : varchar
  rol : varchar
  correo : varchar
  contrasena : varchar
}
@enduml
```

*Base de Datos: Agrícola*
```plantuml
@startuml
entity "FINCA" as finca {
  * id_finca : int
  --
  id_usuario_fk : int
  ubicacion : varchar
  hectareas : float
}

entity "PARCELA" as parcela {
  * id_parcela : int
  --
  id_finca : int
  nombre : varchar
}

entity "CULTIVO" as cultivo {
  * id_cultivo : int
  --
  id_parcela : int
  tipo_cultivo : varchar
  fecha_siembra : date
}

finca ||--o{ parcela : contiene
parcela ||--o{ cultivo : aloja
@enduml
```

*Base de Datos: Recomendaciones*
```plantuml
@startuml
entity "RECOMENDACION" as rec {
  * id_recomendacion : int
  --
  id_cultivo_fk : int
  descripcion : varchar
  nivel_urgencia : varchar
}

entity "REGLA_AGRONOMICA" as regla {
  * id_regla : int
  --
  tipo_cultivo : varchar
  condicion_climatica : varchar
}
@enduml
```

**Diagrama de Bloques**
```plantuml
@startuml
node "Navegador Web\n(Celular, Tablet, PC)" as Navegador

package "Infraestructura de Servidores" {
  [Pasarela de APIs] as Pasarela
  
  package "Clúster Tomcat (Microservicios)" {
    [Servicio Autenticación] as S_Auth
    [Servicio Fincas y Cultivos] as S_Agro
    [Servicio Recomendaciones] as S_Rec
    [Servicio Sincronización] as S_Sync
  }
  
  database "PostgreSQL (Usuarios)" as BD_Auth
  database "PostgreSQL (Agro)" as BD_Agro
  database "PostgreSQL (Reglas)" as BD_Rec
  queue "Cola RabbitMQ" as Cola
}

Navegador --> Pasarela : HTTPS
Pasarela --> S_Auth
Pasarela --> S_Agro
Pasarela --> S_Rec
Pasarela --> S_Sync

S_Auth --> BD_Auth
S_Agro --> BD_Agro
S_Rec --> BD_Rec

S_Sync --> Cola : Envía datos offline
Cola --> S_Agro : Procesa asíncronamente
Cola --> S_Rec : Procesa asíncronamente
@enduml
```

**Diagrama de Paquetes**
```plantuml
@startuml
package "Microservicio_Estandar" {
  package "Capa Controlador" {
    class "Controladores REST"
    class "Objetos DTO"
  }
  package "Capa Servicio" {
    class "Lógica de Negocio"
    class "Interfaces"
  }
  package "Capa Repositorio" {
    class "Repositorios JPA"
    class "Entidades de BD"
  }
  package "Capa Configuración" {
    class "Seguridad y CORS"
    class "Tomcat Embebido"
  }
  
  "Capa Controlador" ..> "Capa Servicio"
  "Capa Servicio" ..> "Capa Repositorio"
}
@enduml
```

**Diagrama de Despliegue**
```plantuml
@startuml
node "Dispositivo del Usuario" <<Dispositivo>> {
  node "Navegador Web" <<Aplicación PWA>> {
    component "Frontend Responsivo"
  }
}

node "Internet" <<Red Publica>> as Red

node "Servidor de Producción" <<Servidor Web>> {
  node "Balanceador / Cortafuegos" as Firewall
  node "Pasarela de APIs" as API_Gateway
  
  node "Contenedores Apache Tomcat" {
    component "WAR/JAR Autenticación" as MS1
    component "WAR/JAR Agropecuario" as MS2
    component "WAR/JAR Recomendación" as MS3
    component "WAR/JAR Sincronización" as MS4
  }
  
  database "Base de Datos PostgreSQL" {
    artifact "Esquema Usuarios" as ESQ1
    artifact "Esquema Cultivos" as ESQ2
    artifact "Esquema Reglas" as ESQ3
  }
}

"Frontend Responsivo" --> Red : Tráfico HTTPS
Red --> Firewall
Firewall --> API_Gateway
API_Gateway --> MS1
API_Gateway --> MS2
API_Gateway --> MS3
API_Gateway --> MS4

MS1 --> ESQ1
MS2 --> ESQ2
MS3 --> ESQ3
@enduml
```
