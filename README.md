# Fotstats

Eine Scala-Konsolen-App für Fussballstatistiken. Man kann Ligen auswählen, Spieler suchen und Tore oder Assists ändern.

## Starten

Für Windows braucht man Java JDK 17 oder neuer. Beim ersten Start ist Internet nötig, um Scala und sbt herunterzuladen.

Den Projektordner entpacken, in VS Code öffnen und im Terminal ausführen:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1
```

Falls Java fehlt, zuerst ein JDK installieren und das Terminal neu öffnen. Mit `java -version` kann man das prüfen. Der erste Start kann ein paar Minuten dauern.

## Bedienung

Eine Zahl eingeben und Enter drücken:

- 1: Liga wählen
- 2: Tore anzeigen
- 3: Assists anzeigen
- 4: Scorer anzeigen
- 5: Werte ändern
- 6: Spieler suchen
- 0: Beenden

Scorerpunkte sind Tore plus Assists. Bei Änderungen gibt man die neuen Gesamtwerte ein. Sie werden in `players.csv` gespeichert und bleiben nach dem Neustart erhalten. Die App bestätigt das Speichern im Terminal.

## Tests

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 test
```

## Dateien

Der Code liegt in `src/main/scala/stats`:

- `Main.scala`: Menü
- `Model.scala`: Berechnungen
- `Data.scala`: Daten lesen und speichern

Beim Weitergeben den ganzen Projektordner kopieren. Nur `target`, `project/target` und `.tools` kann man weglassen, da sie automatisch erstellt werden. `players.csv` muss dabei sein.
