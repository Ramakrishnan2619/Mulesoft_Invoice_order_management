# Multi-Stage Dockerfile for Automated Render Cloud Deployment

# Stage 1: Build application with Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lightweight Runtime Environment
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/target/email_test1-1.0.0-SNAPSHOT-mule-application.jar /app/mule-app.jar

EXPOSE 8081

CMD ["java", "-jar", "/app/mule-app.jar"]
