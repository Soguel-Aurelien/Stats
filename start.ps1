param([ValidateSet('run', 'test')][string]$Command = 'run')
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
$previousCache = $env:COURSIER_CACHE
$previousInputEncoding = [Console]::InputEncoding
$previousOutputEncoding = [Console]::OutputEncoding
$previousPipelineEncoding = $OutputEncoding
try {
    # Damit Umlaute im Terminal richtig angezeigt werden.
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [Console]::InputEncoding = $utf8
    [Console]::OutputEncoding = $utf8
    $OutputEncoding = $utf8
    New-Item -ItemType Directory -Force .tools | Out-Null
    if (-not (Test-Path -LiteralPath '.tools/sbt-launch.jar')) {
        Write-Host 'Lade sbt herunter...'
        Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/scala-sbt/sbt-launch/1.10.7/sbt-launch-1.10.7.jar' -OutFile '.tools/sbt-launch.jar' -UseBasicParsing
    }
    "[repositories]`nlocal`nmaven-central: https://repo.maven.apache.org/maven2/" | Set-Content -LiteralPath '.tools/repositories' -Encoding ascii
    $env:COURSIER_CACHE = Join-Path $PSScriptRoot '.tools/coursier'
    & java '-Dsbt.global.base=.tools/sbt' '-Dsbt.boot.directory=.tools/boot' '-Dsbt.ivy.home=.tools/ivy' '-Dsbt.repository.config=.tools/repositories' '-Dsbt.override.build.repos=true' '-Dsbt.boot.server=false' '-Dsbt.server.autostart=false' '-Dsbt.supershell=false' '-Dsbt.log.noformat=true' '-Dfile.encoding=UTF-8' -jar .tools/sbt-launch.jar $Command
    $result = $LASTEXITCODE
} finally {
    [Console]::InputEncoding = $previousInputEncoding
    [Console]::OutputEncoding = $previousOutputEncoding
    $OutputEncoding = $previousPipelineEncoding
    $env:COURSIER_CACHE = $previousCache
    Pop-Location
}
exit $result
