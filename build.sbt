ThisBuild / scalaVersion := "3.3.8"
ThisBuild / version := "0.1.0-SNAPSHOT"

lazy val root = (project in file("."))
  .settings(
    name := "Stats",
    Compile / mainClass := Some("stats.Main"),
    Compile / run / fork := true,
    libraryDependencies += "org.scalameta" %% "munit" % "1.0.2" % Test
  )

// A portable distribution without a packaging plugin.
lazy val stage = taskKey[File]("Copy application and runtime jars for deployment")
stage := {
  val destination = target.value / "stage"
  IO.createDirectory(destination)
  val application = (Compile / packageBin).value
  val dependencies = (Compile / dependencyClasspath).value.files
  (application +: dependencies).foreach(file => IO.copyFile(file, destination / file.getName))
  destination
}
