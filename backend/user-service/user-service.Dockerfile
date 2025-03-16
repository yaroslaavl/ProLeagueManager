FROM openjdk:21-jdk-slim

WORKDIR /user-service
COPY user-service/target/user-service-1.0-SNAPSHOT.jar /user-service/user-service.jar

COPY user-service/src/main/resources/application.yml /user-service/application.yml

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "user-service.jar"]
CMD ["--spring.config.location=file:/user-service/application.yml"]