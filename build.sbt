ThisBuild / scalaVersion := "3.3.8"
ThisBuild / version := "0.1.0-SNAPSHOT"

lazy val root = (project in file("."))
  .settings(
    name := "Stats",
    Compile / mainClass := Some("stats.Main"),
    Compile / run / fork := true,
    Compile / run / connectInput := true,
    Compile / run / outputStrategy := Some(StdoutOutput),
    Compile / run / javaOptions += "-Dfile.encoding=UTF-8",
    libraryDependencies += "org.scalameta" %% "munit" % "1.0.2" % Test
  )
