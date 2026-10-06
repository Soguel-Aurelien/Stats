# Fotstats – kurze Dokumentation

## Idee

Fotstats ist eine Scala-App für das Terminal. Sie zeigt Fussballstatistiken aus sechs Ligen. Die Spielerwerte stehen in einer CSV-Datei und werden nicht live aus dem Internet geladen.

## Funktionen

Im Menü kann man eine Liga wählen und die besten 15 Spieler nach Toren, Assists oder Scorerpunkten anzeigen. Ausserdem kann man nach Spielern oder Teams suchen und die Tore und Assists eines Spielers ändern. Scorerpunkte werden als Tore plus Assists berechnet.

Bei einer Änderung gibt man die neuen Gesamtwerte ein. Zum Beispiel ergeben 10 Tore und 3 Assists insgesamt 13 Scorerpunkte. Nach erfolgreichem Speichern zeigt die App die neue Rangliste.

## Aufbau

Der Code liegt in `src/main/scala/stats`:

| Datei | Aufgabe |
| --- | --- |
| `Main.scala` | Menü anzeigen, Eingaben lesen und Ergebnisse ausgeben |
| `Model.scala` | Spieler und Ligen beschreiben, Ranglisten berechnen und Spieler suchen |
| `Data.scala` | CSV-Datei lesen, prüfen und speichern |

Damit ist die Bedienung von den Berechnungen getrennt. Das Modell liest keine Dateien und gibt nichts im Terminal aus.

## Funktionale Programmierung

`Player`, `League` und `AppState` sind Case Classes mit unveränderbaren Feldern. Die Sammlungen sind unveränderbare `Vector`-Werte. Eine Änderung erstellt mit `copy` einen neuen Spieler:

```scala
player.copy(goals = newGoals, assists = newAssists)
```

Der alte Spieler bleibt erhalten. Mit `map` entsteht daraus eine neue Spielerliste. Die Modellfunktionen liefern bei gleichen Eingaben die gleichen Ergebnisse und verändern keine bestehenden Daten.

Für die Verarbeitung werden unter anderem `filter`, `sortBy`, `take` und `map` verwendet. Die Suche filtert passende Namen oder Teams. Die Rangliste sortiert die Spieler und begrenzt das Ergebnis auf 15 Einträge.

Das Menü verwendet Rekursion: `menuLoop` ruft sich nach einer Aktion mit dem nächsten Zustand erneut auf. Bei Eingabe `0` endet es. `@tailrec` prüft, dass der Aufruf endrekursiv ist und der Aufrufstapel dabei nicht wächst.

## Daten speichern

Beim Start wird `players.csv` geladen. Eine gültige Änderung wird sofort gespeichert und bleibt nach einem Neustart erhalten. Dafür wird zuerst eine temporäre Datei fertig geschrieben und danach die bisherige CSV ersetzt. Falls das Speichern fehlschlägt, zeigt die App einen Fehler und behält die bisherigen Werte.

Dateizugriff und Konsolenausgabe haben Seiteneffekte. Sie liegen deshalb ausserhalb des rein funktionalen Modells. Negative Zahlen und ungültige Eingaben werden abgewiesen. Die CSV verwendet ein einfaches Kommaformat; Kommas innerhalb von Namen werden nicht unterstützt.

## Tests

Die neun Tests in `src/test/scala/stats/StatsSuite.scala` prüfen unter anderem Sortierung, Suche, unveränderbare Updates, fehlerhafte CSV-Daten und das Speichern mit erneutem Laden.

Start- und Testbefehle stehen in der [README](README.md).
