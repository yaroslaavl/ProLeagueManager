FROM openjdk:21-jdk-slim

WORKDIR /gateway
COPY gateway/target/gateway-1.0-SNAPSHOT.jar /gateway/gateway.jar

COPY gateway/src/main/resources/application.yml /gateway/application.yml

EXPOSE 8765
ENTRYPOINT ["java", "-jar", "gateway.jar"]
CMD ["--spring.config.location=file:/gateway/application.yml"]