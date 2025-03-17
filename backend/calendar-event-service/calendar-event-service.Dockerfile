FROM openjdk:21-jdk-slim

WORKDIR /calendar-event-service
COPY calendar-event-service/target/calendar-event-service-1.0-SNAPSHOT.jar /calendar-event-service/calendar-event-service.jar

COPY calendar-event-service/src/main/resources/application.yml /calendar-event-service/application.yml

EXPOSE 8087
ENTRYPOINT ["sh", "-c", "sleep 100 && exec java -jar calendar-event-service.jar --spring.config.location=file:/calendar-event-service/application.yml"]