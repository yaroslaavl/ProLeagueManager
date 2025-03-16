FROM openjdk:21-jdk-slim

WORKDIR /competition-management-service
COPY competition-management-service/target/competition-management-service-1.0-SNAPSHOT.jar /competition-management-service/competition-management-service.jar

COPY competition-management-service/src/main/resources/application.yml /competition-management-service/application.yml

EXPOSE 8084
ENTRYPOINT ["java", "-jar", "competition-management-service.jar"]
CMD ["--spring.config.location=file:/competition-management-service/application.yml"]