$ErrorActionPreference = 'Stop'

Write-Host "Starte Scala-Fußballstatistik-App..."
& sbt "runMain stats.Main"
