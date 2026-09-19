# Dockerfile for 24/7 Free MuleSoft Backend Deployment on Render / Railway
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy MuleSoft application executable JAR
COPY target/email_test1-1.0.0-SNAPSHOT-mule-application.jar /app/mule-app.jar

EXPOSE 8081

CMD ["java", "-jar", "/app/mule-app.jar"]
