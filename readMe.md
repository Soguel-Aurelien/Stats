# Stats — Tore, Assists & Scorer

Eine responsive Fussballseite mit Premier League, Bundesliga, Serie A, LaLiga,
Ligue 1 und Schweizer Super League. Die Navigation wechselt die Liga; Tore,
Assists und Scorerpunkte lassen sich separat sortieren. Top 10, Top 20 und alle
Spieler mit einem positiven Wert sind auswählbar. Gleichstände erhalten denselben
Rang; innerhalb eines Gleichstands wird alphabetisch sortiert.

## Lokal starten

Voraussetzung: Node.js 22 oder neuer. Keine npm-Pakete erforderlich.

```sh
npm start
```

Unter Windows PowerShell bei blockierten npm-Skripten: `npm.cmd start`.
Danach http://localhost:8080 öffnen. Mit Strg+C stoppen. Standardmässig nur lokal
auf 127.0.0.1 erreichbar; `PORT` und `HOST` können als Umgebungsvariablen gesetzt werden.

## Echte Daten aktualisieren

```sh
npm run refresh-data
```

Unter Windows alternativ `npm.cmd run refresh-data` oder `node scripts/refresh-data.mjs`.
Der Import benötigt Internet und speichert `src/main/resources/public/data/stats.json`.
Danach im Browser „Datenstand neu laden“ drücken. Dieser Knopf liest die gespeicherte
Datei erneut; er ruft die Anbieter nicht selbst ab. Es gibt keinen automatischen
Hintergrundabruf und keinen Live-Ticker. Abrufzeit und Saison werden pro Liga angezeigt;
Daten älter als 24 Stunden werden gekennzeichnet.

- Die fünf grossen Ligen beziehen ihre Statistiken aus den öffentlichen ESPN-
  Saisonranglisten. Der Import liest beide vollständigen Listen bis zu den Nullwerten,
  kombiniert Vereinswechsel innerhalb derselben Liga und löst Spieler-/Vereinsnamen auf.
- Die Schweizer Liga nutzt die öffentlich von sfl.ch geladenen SFL-Statistiken.
  Tor- und Assistlisten werden vollständig und mit Pagination zusammengeführt, damit
  auch Spieler ohne Tore berücksichtigt werden. Namen erscheinen in der Schreibweise
  der SFL, teilweise mit abgekürztem Vornamen.
- Scorerpunkte sind immer Tore + Assists. Nur Ligaspiele, keine Pokalspiele.
- Beide Anbieter bestimmen die aktive Saison. Quelle, Saison und Abrufzeit stehen in
  der Oberfläche. Assistdefinitionen können sich zwischen den Anbietern unterscheiden.
- Bei einem Abruffehler bleibt der bisherige Stand der betroffenen Liga mit einem
  Hinweis erhalten. Es werden keine fiktiven Ersatzwerte erzeugt. Öffentliche
  Datenendpunkte können sich ändern und haben keine Verfügbarkeitsgarantie.

## Prüfen

```sh
npm test
```

Prüft Sortierung, Gleichstände, Transfers, vollständige Datenimporte, Scorer-Summen,
gespeicherte Daten sowie HTTP-Auslieferung und Pfadschutz.

## Optional mit Scala

Mit JDK 21 und sbt kann der bestehende Scala-Server weiter verwendet werden:

```sh
sbt test stage
sbt run
```

Die gespeicherten Statistiken werden als Ressourcen mitgebaut. Nach einem Datenimport
Scala neu starten bzw. neu paketieren. JavaScript und JSON werden mit passenden
Content-Types und einer auf lokale Ressourcen beschränkten CSP ausgeliefert.

## Bereitstellen

Für statisches Hosting den gesamten Inhalt von `src/main/resources/public/` inklusive
`data/`, `app.js` und `rankings.js` bereitstellen. Direktes Öffnen als `file://` reicht
wegen JavaScript-Modulen und JSON-Abruf nicht aus.

Alternativ ist der vorhandene Scala-Docker-Build nutzbar:

```sh
docker build -t football-stats .
docker run --rm -p 8080:8080 football-stats
```

Vor dem Build Daten aktualisieren. Die Webseite ist nicht öffentlich veröffentlicht.
