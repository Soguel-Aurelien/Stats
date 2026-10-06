package stats

import scala.annotation.tailrec
import scala.io.StdIn.readLine

case class AppState(leagues: Vector[League], players: Vector[Player], selectedLeagueId: String, csvPath: String):
  def leagueName: String = leagues.find(_.id == selectedLeagueId).map(_.name).getOrElse("Keine Liga")
  def leaguePlayers: Vector[Player] = players.filter(_.leagueId == selectedLeagueId)

object Main:
  def main(args: Array[String]): Unit =
    val csvPath = args.headOption.getOrElse("players.csv")
    Data.loadPlayers(csvPath) match
      case Left(error) => println(s"Fehler: $error")
      case Right(players) =>
        val leagues = Data.groupByLeague(players)
        if leagues.isEmpty then println("Keine Spieler vorhanden.")
        else
          println("FOTSTATS - Fussballstatistiken im Terminal")
          println(s"Änderungen werden automatisch in $csvPath gespeichert.")
          try menuLoop(AppState(leagues, players, leagues.head.id, csvPath))
          catch case _: java.io.EOFException => println("\nEingabe beendet. Auf Wiedersehen!")

  // Das Menü ruft sich mit den aktuellen Daten wieder auf.
  @tailrec
  private def menuLoop(state: AppState): Unit =
    println(s"\n${state.leagueName}")
    println("1 Liga wählen | 2 Tore | 3 Assists | 4 Scorer")
    println("5 Werte ändern | 6 Spieler suchen | 0 Beenden")
    ask("Auswahl: ") match
      case "0" => println("Auf Wiedersehen!")
      case "1" => menuLoop(chooseLeague(state))
      case "2" =>
        showRanking(state, "goals", "Tore")
        menuLoop(state)
      case "3" =>
        showRanking(state, "assists", "Assists")
        menuLoop(state)
      case "4" =>
        showRanking(state, "scorer", "Scorerpunkte")
        menuLoop(state)
      case "5" => menuLoop(editPlayer(state))
      case "6" =>
        findPlayers(state)
        menuLoop(state)
      case _ =>
        println("Bitte eine Zahl von 0 bis 6 eingeben.")
        menuLoop(state)

  private def chooseLeague(state: AppState): AppState =
    state.leagues.zipWithIndex.foreach { (league, index) =>
      println(s"${index + 1} ${league.name}")
    }
    val choice = ask("Liga-Nummer (0 = zurück): ").toIntOption
    if choice.contains(0) then state
    else
      choice.flatMap(number => state.leagues.lift(number - 1)) match
        case Some(league) => state.copy(selectedLeagueId = league.id)
        case None =>
          println("Ungültige Liga-Nummer.")
          state

  private def showRanking(state: AppState, metric: String, label: String): Unit =
    println(s"\nTop 15: $label - ${state.leagueName}")
    println(f"${"#"}%3s ${"Spieler"}%-22s ${"Verein"}%-22s ${"Tore"}%5s ${"Assists"}%7s ${"Scorer"}%7s")
    Model.topPlayers(state.leaguePlayers, metric).zipWithIndex.foreach { (player, index) =>
      println(f"${index + 1}%3d ${player.name.take(22)}%-22s ${player.team.take(22)}%-22s ${player.goals}%5d ${player.assists}%7d ${player.scorerPoints}%7d")
    }

  // Diese Suche brauchen wir auch beim Ändern der Werte.
  private def findPlayers(state: AppState): Vector[Player] =
    val query = ask("Spielername oder Team: ")
    val matches = Model.searchPlayers(state.leaguePlayers, query).sortBy(_.name.toLowerCase)
    if matches.isEmpty then println("Keine Treffer. Bitte einen Namen oder ein Team eingeben.")
    matches.zipWithIndex.foreach { (player, index) =>
      println(s"${index + 1} ${player.name} (${player.team}) - ${player.goals} Tore, ${player.assists} Assists, ${player.scorerPoints} Scorer")
    }
    matches

  private def editPlayer(state: AppState): AppState =
    val matches = findPlayers(state)
    if matches.isEmpty then state
    else
      val choice = ask("Spieler-Nummer (0 = abbrechen): ").toIntOption
      if choice.contains(0) then
        println("Abgebrochen. Werte bleiben erhalten.")
        state
      else
        choice.flatMap(number => matches.lift(number - 1)) match
          case None =>
            println("Ungültige Auswahl. Werte bleiben erhalten.")
            state
          case Some(player) =>
            println(s"${player.name}: bisher ${player.goals} Tore, ${player.assists} Assists.")
            println("Neue Gesamtwerte eingeben, nicht die Anzahl zusätzlicher Tore/Assists.")
            val updated = for
              goals <- readCount("Neue Tore: ")
              assists <- readCount("Neue Assists: ")
            yield Model.updateStats(player, goals, assists)
            updated match
              case None => state
              case Some(changed) =>
                val players = state.players.map(p => if p.id == changed.id then changed else p)
                Data.savePlayers(state.csvPath, players) match
                  case Left(error) =>
                    println(s"Nicht gespeichert: $error. Die bisherigen Werte bleiben erhalten.")
                    state
                  case Right(_) =>
                    val next = state.copy(players = players)
                    println(s"Gespeichert in ${state.csvPath}: ${changed.name} - ${changed.goals} Tore + ${changed.assists} Assists = ${changed.scorerPoints} Scorerpunkte.")
                    showRanking(next, "scorer", "Scorerpunkte")
                    next

  private def ask(prompt: String): String =
    print(prompt)
    Option(readLine()).getOrElse(throw new java.io.EOFException()).trim

  private def readCount(prompt: String): Option[Int] =
    val number = ask(prompt).toIntOption.filter(_ >= 0)
    if number.isEmpty then println("Bitte eine ganze Zahl ab 0 eingeben. Werte bleiben erhalten.")
    number
