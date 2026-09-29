# Fotstats

Fussballstatistiken für Premier League, Bundesliga, Serie A, LaLiga, Ligue 1
und die Schweizer Super League. Pro Rangliste werden maximal 15 Spieler
angezeigt, durchgehend nummeriert. Bei gleichen Werten wird alphabetisch sortiert.

Beim Öffnen oder Anklicken einer Liga erscheint zuerst die vollständige **Ligatabelle**.
Das Menü darüber wechselt zwischen **Tabelle**, **Torschützen**, **Assists** und
**Scorer** (Tore + Vorlagen). Auch ein erneuter Klick auf dieselbe Liga führt zur Tabelle.

Die Tabellen sind ausdrücklich **Testdaten**: alle Mannschaften aus dem vorhandenen
Vereinsbestand, aber erfundene Ergebnisse und Platzierungen. Sie enthalten Spiele,
Siege, Unentschieden, Niederlagen, Tore, Tordifferenz und Punkte. Auf kleinen Bildschirmen
ist die vollständige Tabelle horizontal scrollbar. Spielerstatistiken verwenden weiterhin
den bisherigen gespeicherten Datenstand; Quelle und Abrufdatum stehen unter der Rangliste.

Die Testtabellen liegen separat in `src/main/resources/public/data/standings.json`.
Sie werden nicht beim Aktualisieren der Spielerstatistiken überschrieben. Für eine neue
Testsaison können sie ohne Netzwerkzugriff aus dem gespeicherten Vereinsbestand neu
erzeugt werden: `node scripts/create-test-standings.mjs`.

## Starten

Mit Java und sbt:

```sh
sbt run
```

Alternativ mit Node.js 22 oder neuer, ohne zusätzliche Pakete:

```sh
npm.cmd start
```

Dann http://localhost:8080 öffnen. Nur einen Server gleichzeitig starten.
Mit Strg+C stoppen. `PORT` und `HOST` können als Prozess-Umgebungsvariablen
gesetzt werden; eine `.env`-Datei wird nicht automatisch gelesen.

## Daten aktualisieren

```sh
npm.cmd run refresh-data
```

Benötigt Internet. Quellen: ESPN und Swiss Football League; Clublogos kommen
von deren Bildservern. Der Import speichert `src/main/resources/public/data/stats.json`.
Danach die Webseite neu laden; beim Scala-Server vorher neu starten.
Es gibt keinen automatischen Abruf. Bei Fehlern bleibt der letzte Datenstand erhalten.

## Tests

```sh
npm.cmd test
sbt test
```

## Aufbau

- `src/main/resources/public/`: Webseite und gespeicherte Statistiken.
- `src/main/scala/`: Scala-Webserver; Tests unter `src/test/scala/`.
- `scripts/`: Datenimport und alternativer Node-Webserver.
- `tests/`: Tests für Datenverarbeitung, Ranglisten und Node-Server.

`target/` und `project/target/` sind automatisch erzeugte Build-Ordner.
Sie dürfen gelöscht werden und entstehen beim nächsten Scala-Build erneut.
Der vorhandene `Dockerfile` baut den Scala-Server mit Java 21; alternativ kann
der Inhalt von `src/main/resources/public/` statisch gehostet werden.
