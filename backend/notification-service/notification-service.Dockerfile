FROM openjdk:21-jdk-slim

WORKDIR /notification-service
COPY notification-service/target/notification-service-1.0-SNAPSHOT.jar /notification-service/notification-service.jar

COPY notification-service/src/main/resources/application.yml /notification-service/application.yml

EXPOSE 8081
ENTRYPOINT ["sh", "-c", "sleep 40 && exec java -jar notification-service.jar --spring.config.location=file:/notification-service/application.yml"]