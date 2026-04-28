# ==============================================================================
# AgroSmart Magdalena — Dockerfile (Multi-stage build)
# ==============================================================================
# Etapa 1: Build con Maven + JDK 21
# Etapa 2: Runtime con JRE 21 slim (imagen mínima)
# ==============================================================================

# --- Etapa 1: Build ---
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Etapa 2: Runtime ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S agrosmart && adduser -S agrosmart -G agrosmart
COPY --from=build /app/target/*.jar app.jar
RUN chown agrosmart:agrosmart app.jar
USER agrosmart

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
