# ---------- Build stage ----------
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml first to cache dependencies
COPY Backend/pom.xml ./Backend/pom.xml
# Copy Frontend since it's needed for resources (unlikely to change often?)
COPY Frontend ./Frontend

WORKDIR /app/Backend
# Download dependencies - this layer will be cached unless pom.xml changes
RUN mvn dependency:go-offline

# Now copy the rest of the source code
COPY Backend/src ./src

# Build the application
RUN mvn clean package -DskipTests

# ---------- Runtime stage ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/Backend/target/*.jar app.jar

EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
