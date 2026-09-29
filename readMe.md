# Stats — Tore & Assists

Eine einfache statische Fussball-Seite mit zwei Ranglisten:

- **Topscorer:** acht Spieler nach Toren sortiert.
- **Assists:** dieselben acht Spieler nach Vorlagen sortiert.

Alle Namen, Vereine und Werte sind erfundene Testdaten. Es gibt keine API, keine externen Datenabfragen, kein JavaScript, kein Konto und keine Anmeldung.

## Einfach öffnen

`src/main/resources/public/index.html` im Browser öffnen. Die Seite funktioniert direkt als Datei und ohne Internet. Testdaten stehen in den beiden HTML-Tabellen und können dort geändert werden; die Reihenfolge ist manuell absteigend sortiert.

## Optional über Scala starten

Das bestehende Scala-Projekt enthält nur einen kleinen statischen Webserver. Voraussetzungen: JDK 21 und sbt. Beim ersten Build werden die Build-Abhängigkeiten heruntergeladen.

```sh
sbt run
```

Anschliessend http://localhost:8080 öffnen. Mit `Strg+C` stoppen. `PORT` (Standard `8080`) und `HOST` (Standard `0.0.0.0`) sind optional als Prozess-Umgebungsvariablen einstellbar. Eine `.env`-Datei wird nicht automatisch geladen.

## Prüfen und paketieren

```sh
sbt test stage
java -cp "target/stage/*" stats.Main
```

Die Tests prüfen die statischen Dateien, dass die entfernten API-Endpunkte nicht mehr verfügbar sind, den Pfadschutz sowie GET/HEAD und abgewiesene Schreibzugriffe.

## Online bereitstellen

Für statisches Hosting genügt der Inhalt von `src/main/resources/public/`: `index.html`, `styles.css` und `favicon.svg`. Ein Backend oder API-Schlüssel ist dafür nicht nötig.

Alternativ kann der statische Scala-Server mit Docker laufen:

```sh
docker build -t football-stats .
docker run --rm -p 8080:8080 football-stats
```

Die Webseite ist noch nicht öffentlich veröffentlicht. Der Docker-Build wurde hier nicht ausgeführt.
