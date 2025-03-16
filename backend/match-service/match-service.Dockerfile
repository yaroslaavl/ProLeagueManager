FROM openjdk:21-jdk-slim

WORKDIR /match-service
COPY match-service/target/match-service-1.0-SNAPSHOT.jar /match-service/match-service.jar

COPY match-service/src/main/resources/application.yml /match-service/application.yml

EXPOSE 8085
ENTRYPOINT ["java", "-jar", "match-service.jar"]
CMD ["--spring.config.location=file:/match-service/application.yml"]