# Fotstats

Kleine Scala-Konsolen-App: Liga auswählen, Ranglisten anzeigen, Spieler suchen und Tore oder Assists dauerhaft speichern.

## Auf einem anderen Rechner starten

Benötigt werden **Java JDK 17 oder neuer**, unter Windows **PowerShell** und beim ersten Start eine **Internetverbindung**. Scala und sbt lädt das Startskript selbst herunter. VS Code ist optional.

1. Den Projektordner kopieren oder eine ZIP-Datei zuerst vollständig entpacken. `players.csv`, `src`, `project`, `build.sbt` und `start.ps1` müssen enthalten sein.
2. Den Ordner in VS Code öffnen und **Terminal → Neues Terminal** wählen. Alternativ PowerShell im Projektordner öffnen.
3. Mit `java -version` prüfen, ob Java verfügbar ist. Falls der Befehl fehlt: ein JDK ab Version 17 installieren, dessen `bin`-Ordner zum `PATH` hinzufügen und ein neues Terminal öffnen.
4. Im Ordner, in dem `start.ps1` liegt, diesen Befehl ausführen:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1
```

Der erste Start kann wegen der Downloads einige Minuten dauern. Wenn das Menü mit „Auswahl:“ erscheint, ist die App bereit. Die Bedienung erfolgt vollständig im Terminal; es wird kein Browser benötigt.

Falls sbt nach `Create a new server?` fragt, zuerst andere laufende Starts dieses Projekts beenden und dann mit `y` bestätigen. Die App jeweils nur einmal mit derselben CSV öffnen, damit Änderungen sich nicht gegenseitig überschreiben.

Auf macOS/Linux werden ein JDK und installiertes sbt benötigt. Im Projektordner mit `sbt run` starten. Dieser Startweg wurde hier nicht separat getestet.

## Tests ausführen

Unter Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 test
```

Mit installiertem sbt: `sbt test`. Es gibt neun Tests, unter anderem für Ranglisten, Suche, unveränderbare Updates, CSV-Dateien und dauerhaftes Speichern. Bei Erfolg meldet sbt `Passed: Total 9` und `Failed 0`.

## Häufige Startprobleme

| Meldung / Problem | Lösung |
| --- | --- |
| `start.ps1` nicht gefunden | In den entpackten Projektordner wechseln, in dem die Datei liegt. |
| `java` nicht gefunden | JDK installieren, PATH prüfen und Terminal neu öffnen. |
| Download fehlgeschlagen | Internetverbindung prüfen; Zugriff auf Maven Central muss erlaubt sein. |
| `CSV-Datei nicht gefunden` | Prüfen, ob `players.csv` im Projektordner enthalten ist. |
| Änderungen werden nicht gespeichert | Projekt in einen beschreibbaren Ordner entpacken und die Fehlermeldung in der Konsole prüfen. |
| Alte Anzeige nach Codeänderungen | Laufende App mit `0` beenden und neu starten. |

## Bedienung

- 1: Liga wählen
- 2 / 3 / 4: Tore / Assists / Scorer anzeigen
- 5: Spieler suchen, Treffer auswählen und Werte ändern
- 6: Spieler oder Team suchen
- 0: Beenden

Demo: `5`, `Haaland`, `1`, `10`, `3`, jeweils mit Enter. Dabei sind 10 Tore und 3 Assists die neuen Gesamtwerte. Danach erscheinen 13 Scorerpunkte in der neuen Rangliste.

Jede gültige Änderung wird sofort in `players.csv` im Projektordner gespeichert und bleibt nach einem Neustart erhalten. Die Konsole bestätigt das mit „Gespeichert in …“. Bei einem Speicherfehler bleiben die bisherigen Werte erhalten. Beim Start mit einem anderen CSV-Pfad wird genau diese Datei verwendet. Keine Dateien unter `target` bearbeiten; manuelle CSV-Änderungen vor dem App-Start speichern und die App danach neu starten.

## Dateien

- `src/main/scala/stats/Main.scala`: Konsolenmenü und Eingabe/Ausgabe.
- `src/main/scala/stats/Model.scala`: unveränderbare Daten und reine Berechnungen.
- `src/main/scala/stats/Data.scala`: CSV laden und prüfen.
- `src/test/scala/stats/StatsSuite.scala`: Tests für Modell und CSV.
- `players.csv`: 854 gespeicherte Spieler aus dem bisherigen Projekt; keine Live-Daten.
- `build.sbt`, `project/build.properties`, `start.ps1`: Scala-Build und Start.

`target` und `.tools` entstehen automatisch und sind in VS Code sichtbar, gehören aber nicht in Git. Diese Dateien niemals von Hand bearbeiten.

Beim Weitergeben des Ordners können `target`, `project/target` und `.tools` weggelassen werden. Sie werden auf dem anderen Rechner neu erstellt. `project/build.properties` und `players.csv` unbedingt mitgeben. Zum Starten ist kein GitHub-Login nötig; für das Klonen eines privaten Repositorys braucht man hingegen Zugriff.

## Bewertungskriterien

Das Modell verwendet Case Classes, `copy`, unveränderbare `Vector`-Collections und reine Funktionen. `map`, `filter`, `sortBy` und `take` verarbeiten die Daten. Das Menü ist mit `@tailrec` rekursiv. Ein-/Ausgabe liegt ausserhalb des Modells.

Vor der Abgabe: Tests und Demo ausführen, Änderungen prüfen, sinnvoll committen und pushen. Projekt, interessante Codestellen und Live-Demo selbst erklären können. Repository: https://github.com/Soguel-Aurelien/Stats.git
