package stats

import scala.annotation.tailrec
import scala.io.StdIn.readLine

case class AppState(leagues: Vector[League], players: Vector[Player], selectedLeagueId: String):
  def selectedLeague: Option[League] = leagues.find(_.id == selectedLeagueId)

object Main:
  def main(args: Array[String]): Unit =
    val csvPath = args.headOption.getOrElse("players.csv")
    Data.loadPlayers(csvPath) match
      case Left(error) =>
        println(s"Fehler: $error")
        println("Bitte prüfen Sie die CSV-Datei und starten Sie das Programm erneut.")
      case Right(allPlayers) =>
        val leagues = Data.groupByLeague(allPlayers)
        val selectedId = leagues.headOption.map(_.id).getOrElse("")
        println("Fußballstatistiken – Konsolenanwendung")
        println("====================================")
        menuLoop(AppState(leagues, allPlayers, selectedId))

  @tailrec
  private def menuLoop(state: AppState): Unit =
    println()
    println("Menü:")
    println("1) Liga wählen")
    println("2) Top 15 nach Toren")
    println("3) Top 15 nach Assists")
    println("4) Top 15 nach Scorer")
    println("5) Spieler suchen")
    println("6) Tore und Assists ändern")
    println("0) Beenden")
    println(s"Aktive Liga: ${state.selectedLeague.map(_.name).getOrElse("Keine")}")

    readIntOption() match
      case Some(0) =>
        println("Auf Wiedersehen! Das Programm wird sauber beendet.")
      case Some(1) =>
        chooseLeague(state) match
          case Some(newLeagueId) => menuLoop(state.copy(selectedLeagueId = newLeagueId))
          case None => menuLoop(state)
      case Some(2) =>
        showRanking(state, "goals")
        menuLoop(state)
      case Some(3) =>
        showRanking(state, "assists")
        menuLoop(state)
      case Some(4) =>
        showRanking(state, "scorer")
        menuLoop(state)
      case Some(5) =>
        searchPlayers(state)
        menuLoop(state)
      case Some(6) =>
        val nextState = updatePlayerStats(state)
        menuLoop(nextState)
      case _ =>
        println("Ungültige Eingabe. Bitte nur Zahlen von 0 bis 6 eingeben.")
        menuLoop(state)

  private def chooseLeague(state: AppState): Option[String] =
    if state.leagues.isEmpty then
      println("Keine Ligen verfügbar.")
      None
    else
      println("Verfügbare Ligen:")
      state.leagues.zipWithIndex.foreach { case (league, index) =>
        println(s"${index + 1}. ${league.name}")
      }
      println("0. Zurück")
      readIntOption() match
        case Some(0) => None
        case Some(choice) if choice > 0 && choice <= state.leagues.size =>
          Some(state.leagues(choice - 1).id)
        case _ =>
          println("Ungültige Auswahl. Bitte eine gültige Liga wählen.")
          None

  private def showRanking(state: AppState, metric: String): Unit =
    state.selectedLeague match
      case Some(selectedLeague) =>
        val leaguePlayers = state.players.filter(_.leagueId == selectedLeague.id)
        val ranking = Model.topPlayers(leaguePlayers, metric, 15)

        if ranking.isEmpty then
          println(s"Für ${selectedLeague.name} sind keine Spieler vorhanden.")
        else
          printRankingHeader(metric, selectedLeague.name)
          ranking.zipWithIndex.foreach { case (player, index) =>
            println(
              f"${index + 1}. ${player.name}%-22s ${player.team}%-22s Tore: ${player.goals}%-2d | Assists: ${player.assists}%-2d | Scorer: ${player.scorerPoints}%-2d"
            )
          }
      case None =>
        println("Bitte zuerst eine Liga auswählen.")

  private def printRankingHeader(metric: String, leagueName: String): Unit =
    val label = metric.toLowerCase match
      case "goals" => "Tore"
      case "assists" => "Assists"
      case "scorer" => "Scorerpunkte"
      case _ => "Scorerpunkte"
    println(s"\nTop 15 nach $label – $leagueName")

  private def searchPlayers(state: AppState): Unit =
    state.selectedLeague match
      case Some(selectedLeague) =>
        print("Suchbegriff für Name oder Team: ")
        val term = readLine().trim
        if term.isEmpty then
          println("Ein leerer Suchbegriff ist nicht gültig.")
        else
          val matches = Model.searchPlayers(state.players.filter(_.leagueId == selectedLeague.id), term)
          if matches.isEmpty then
            println(s"Keine Treffer für '$term' in ${selectedLeague.name}.")
          else
            matches.sortBy(_.name.toLowerCase).zipWithIndex.foreach { case (player, index) =>
              println(s"${index + 1}. ${player.name} | ${player.team} | Tore: ${player.goals} | Assists: ${player.assists} | Scorer: ${player.scorerPoints}")
            }
      case None =>
        println("Bitte zuerst eine Liga auswählen.")

  private def updatePlayerStats(state: AppState): AppState =
    state.selectedLeague match
      case Some(selectedLeague) =>
        val leaguePlayers = state.players.filter(_.leagueId == selectedLeague.id)
        if leaguePlayers.isEmpty then
          println(s"In ${selectedLeague.name} gibt es keine Spieler zum Ändern.")
          state
        else
          print("Spielername oder Teilstring: ")
          val query = readLine().trim
          val matches = Model.searchPlayers(leaguePlayers, query)
          if matches.isEmpty then
            println(s"Kein passender Spieler in ${selectedLeague.name} gefunden.")
            state
          else
            val selected = matches.sortBy(_.name.toLowerCase).head
            println(s"Ausgewählt: ${selected.name} (${selected.team})")
            readNonNegativeInt("Neue Tore: ") match
              case None =>
                println("Die Tore müssen eine gültige nicht-negative Zahl sein.")
                state
              case Some(newGoals) =>
                readNonNegativeInt("Neue Assists: ") match
                  case None =>
                    println("Die Assists müssen eine gültige nicht-negative Zahl sein.")
                    state
                  case Some(newAssists) =>
                    val updatedPlayers = state.players.map { player =>
                      if player.id == selected.id then Model.updateStats(player, newGoals, newAssists) else player
                    }
                    val updatedPlayer = updatedPlayers.find(_.id == selected.id).getOrElse(selected)
                    println(
                      s"Aktualisiert: ${updatedPlayer.name} -> Tore: ${updatedPlayer.goals}, Assists: ${updatedPlayer.assists}, Scorer: ${updatedPlayer.scorerPoints}"
                    )
                    state.copy(players = updatedPlayers)
      case None =>
        println("Bitte zuerst eine Liga auswählen.")
        state

  private def readIntOption(): Option[Int] =
    val entered = readLine()
    if entered == null || entered.trim.isEmpty then None
    else
      try Some(entered.trim.toInt)
      catch
        case _: NumberFormatException => None

  private def readNonNegativeInt(prompt: String): Option[Int] =
    print(prompt)
    readIntOption() match
      case Some(value) if value >= 0 => Some(value)
      case _ => None
