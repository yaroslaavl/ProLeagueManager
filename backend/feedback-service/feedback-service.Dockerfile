FROM openjdk:21-jdk-slim

WORKDIR /feedback-service
COPY feedback-service/target/feedback-service-1.0-SNAPSHOT.jar /feedback-service/feedback-service.jar

COPY feedback-service/src/main/resources/application.yml /feedback-service/application.yml

EXPOSE 8086
ENTRYPOINT ["java", "-jar", "feedback-service.jar"]
CMD ["--spring.config.location=file:/feedback-service/application.yml"]