FROM openjdk:21-jdk-slim

WORKDIR /sport-service
COPY sport-service/target/sport-service-1.0-SNAPSHOT.jar /sport-service/sport-service.jar

COPY sport-service/src/main/resources/application.yml /sport-service/application.yml

EXPOSE 8083
ENTRYPOINT ["java", "-jar", "sport-service.jar"]
ENTRYPOINT ["sh", "-c", "sleep 20 && exec java -jar sport-service.jar --spring.config.location=file:/sport-service/application.yml"]