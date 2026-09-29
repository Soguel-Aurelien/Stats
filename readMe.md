# Stats

Grundprojekt für eine Scala-Anwendung mit sbt.

## Voraussetzungen

- Git
- Java Development Kit (JDK) 21
- sbt (die Projektversion wird automatisch aus `project/build.properties` geladen)
- Internetzugang zum Herunterladen der Build-Werkzeuge und Abhängigkeiten beim ersten Start

Das Projekt verwendet Scala **3.3.8** und sbt **1.10.7**. Scala muss nicht separat installiert werden: sbt lädt die im Projekt festgelegte Version herunter.

## Installation unter Windows

1. [Git für Windows](https://git-scm.com/downloads/win) installieren.
2. Ein JDK 21 installieren, beispielsweise [Eclipse Temurin](https://adoptium.net/temurin/releases/?version=21). Bei der Installation Java zum `PATH` hinzufügen und `JAVA_HOME` auf das JDK-Verzeichnis setzen.
3. sbt gemäß der [offiziellen Windows-Anleitung](https://www.scala-sbt.org/1.x/docs/Installing-sbt-on-Windows.html) installieren, beispielsweise mit dem dort verlinkten Windows-Installer. Danach PowerShell neu öffnen, damit Änderungen am `PATH` wirksam werden.
4. Git und Java überprüfen:

   ```powershell
   git --version
   java -version
   javac -version
   ```

5. PowerShell im Projektordner `Stats` öffnen. Falls das Projekt bereits in einem Remote-Repository veröffentlicht wurde, kann es alternativ geklont werden (die URL ersetzen):

   ```powershell
   git clone <REPOSITORY-URL> Stats
   cd Stats
   ```

   Das lokale Repository ist bereits initialisiert; eine Remote-URL ist noch nicht eingerichtet.

6. Im Projektordner sbt überprüfen und das Projekt kompilieren:

   ```powershell
   sbt sbtVersion
   sbt compile
   ```

   Beim ersten Aufruf lädt sbt die benötigten Komponenten herunter. Das kann einige Minuten dauern.

7. Anwendung starten:

   ```powershell
   sbt run
   ```

   Die Anwendung gibt `Willkommen bei Stats!` aus.

Unter macOS und Linux ebenfalls Git, JDK 21 und sbt installieren; die sbt-Befehle bleiben gleich. Siehe die [sbt-Installationsanleitung](https://www.scala-sbt.org/1.x/docs/Setup.html).

## Projektstruktur

```text
Stats/
├── build.sbt                       # Projektname und Scala-Version
├── project/
│   └── build.properties            # sbt-Version
├── src/main/scala/stats/
│   └── Main.scala                  # Einstiegspunkt
├── .gitignore
└── readMe.md
```

## Nützliche Befehle

| Befehl | Zweck |
| --- | --- |
| `sbt compile` | Quellcode kompilieren |
| `sbt run` | Anwendung starten |
| `sbt test` | Tests ausführen, sobald Tests und ein Testframework ergänzt wurden |
| `sbt clean` | Build-Ausgaben entfernen |
| `git status` | Änderungen im Repository anzeigen |

Falls `sbt` oder `java` nicht erkannt wird, die Installation und den `PATH` prüfen und das Terminal neu öffnen.
