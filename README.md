# Fotstats

Fotstats ist eine Konsolen-App in Scala für Fussballstatistiken. Man kann eine Liga auswählen, Ranglisten anschauen und Tore oder Assists ändern. Scorerpunkte sind Tore plus Assists. Die Daten sind gespeichert, nicht live.

## Starten

Unter Windows braucht man Java JDK 17 oder neuer und PowerShell. Beim ersten Start ist Internet nötig, weil Scala und sbt heruntergeladen werden.

1. Den Projektordner herunterladen und gegebenenfalls die ZIP entpacken.
2. Den Ordner in VS Code öffnen und ein neues Terminal öffnen.
3. Mit `java -version` prüfen, ob Java installiert ist. Falls der Befehl fehlt, zuerst ein JDK installieren und das Terminal neu öffnen.
4. Im Projektordner starten:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1
```

Der erste Start dauert etwas länger. Sobald das Menü erscheint, eine Zahl eingeben und mit Enter bestätigen. Falls `Create a new server?` erscheint, andere laufende Starts beenden und mit `y` bestätigen.

Mit installiertem sbt geht auch `sbt run`. Unter macOS/Linux braucht man Java und sbt; dort haben wir den Start noch nicht getestet.

## Bedienung

- 1: Liga wählen
- 2: Torschützen anzeigen
- 3: Assists anzeigen
- 4: Scorer anzeigen
- 5: Spielerwerte ändern
- 6: Spieler oder Team suchen
- 0: Beenden

Beispiel: `5`, `Haaland`, `1`, `10`, `3` eingeben, jeweils mit Enter. Haaland hat danach insgesamt 10 Tore, 3 Assists und 13 Scorerpunkte.

Änderungen werden direkt in `players.csv` gespeichert und bleiben nach dem Neustart erhalten. Die Meldung „Gespeichert in …“ bestätigt das. Bei einem Speicherfehler bleiben die alten Werte erhalten. Nur eine App gleichzeitig mit derselben Datei öffnen.

## Tests

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 test
```

Mit sbt: `sbt test`. Die Tests prüfen unter anderem Ranglisten, Suche und Speichern.

## Aufbau

Der Code liegt in `src/main/scala/stats`:

- `Main.scala`: Menü und Ein-/Ausgabe
- `Model.scala`: Daten und Berechnungen
- `Data.scala`: CSV lesen und speichern

Die Tests stehen in `src/test/scala/stats/StatsSuite.scala`. Das Modell arbeitet mit unveränderbaren Daten. Das Menü ist rekursiv.

Zum Weitergeben den Projektordner mit `src`, `project`, `players.csv`, `build.sbt` und `start.ps1` kopieren. `target`, `project/target` und `.tools` braucht man nicht mitzugeben. Diese Ordner werden automatisch erstellt. Spielerwerte nur in der `players.csv` im Projektordner ändern, nicht unter `target`.
