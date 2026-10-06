# Präsentationsunterlagen

## 1) Reine Funktionen

```scala
object Model:
  def topPlayers(players: Vector[Player], metric: String, limit: Int = 15): Vector[Player] =
    players.sortBy(player => (-player.scorerPoints, -player.goals, player.name.toLowerCase)).take(limit)
```

Die Funktion erzeugt nur aus den Eingabewerten ein neues Ergebnis. Sie verändert keine vorhandenen Daten.

## 2) Unveränderbare Daten und Collections

```scala
case class Player(id: String, name: String, team: String, leagueId: String, leagueName: String, goals: Int, assists: Int):
  def scorerPoints: Int = goals + assists

val updated = player.copy(goals = 12, assists = 4)
```

Mit `copy` entsteht ein neues Objekt, das Original bleibt unverändert. `Vector` wird ebenfalls nicht verändert, sondern als neue Struktur zurückgegeben.

## 3) Rekursion

```scala
@tailrec
private def menuLoop(state: AppState): Unit =
  // ...
  menuLoop(newState)
```

Das Menü ruft sich endrekursiv selbst auf. Dadurch bleibt der Ablauf übersichtlich und ohne Stack-Aufbau.

## 4) Pipelines

```scala
players
  .groupBy(_.leagueId)
  .toVector
  .sortBy(_._1)
  .map { case (leagueId, leaguePlayers) =>
    League(leagueId, leaguePlayers.head.leagueName, leaguePlayers.sortBy(_.name.toLowerCase))
  }
```

Diese Pipeline zeigt, wie Daten in klarer Reihenfolge verarbeitet werden: gruppieren, sortieren, transformieren.

## Beispiel aus der Anwendung

- `Top 15` sortiert nach Toren, Assists oder Scorerpunkten
- `Suche` filtert mit `filter`
- `Update` nutzt `map` und `copy`, um die Sitzung lokal zu ändern
