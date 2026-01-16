# ---------- Build stage ----------
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy Frontend first because pom.xml refers to it
COPY Frontend ./Frontend
COPY Backend ./Backend

WORKDIR /app/Backend

RUN mvn clean package -DskipTests

# ---------- Runtime stage ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/Backend/target/*.jar app.jar

EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
