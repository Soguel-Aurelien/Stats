FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
ADD https://repo.maven.apache.org/maven2/org/scala-sbt/sbt-launch/1.10.7/sbt-launch-1.10.7.jar /opt/sbt-launch.jar
COPY build.sbt ./
COPY project/build.properties project/build.properties
COPY src ./src
RUN java -jar /opt/sbt-launch.jar test stage

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/stage ./lib
ENV PORT=8080
EXPOSE 8080
USER 10001
CMD ["java", "-cp", "/app/lib/*", "stats.Main"]
