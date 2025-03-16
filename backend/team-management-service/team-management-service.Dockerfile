FROM openjdk:21-jdk-slim

WORKDIR /team-management-service
COPY team-management-service/target/team-management-service-1.0-SNAPSHOT.jar /team-management-service/team-management-service.jar

COPY team-management-service/src/main/resources/application.yml /team-management-service/application.yml

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "team-management-service.jar"]
CMD ["--spring.config.location=file:/team-management-service/application.yml"]