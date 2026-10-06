package stats

import java.io.File
import scala.io.Source

object Data:
  private val expectedHeader = "leagueId,leagueName,playerName,team,goals,assists"

  def loadPlayers(csvPath: String): Either[String, Vector[Player]] =
    val file = new File(csvPath)
    if !file.exists() then
      Left(s"CSV-Datei nicht gefunden: $csvPath")
    else
      try
        val lines = Source.fromFile(file, "UTF-8").getLines().toVector
        if lines.isEmpty then
          Left(s"CSV-Datei ist leer: $csvPath")
        else
          val header = lines.head.trim
          if header != expectedHeader then
            Left(
              s"CSV-Header ist ungültig. Erwartet: $expectedHeader; gefunden: $header"
            )
          else
            val parsedRows = lines.tail.filter(_.trim.nonEmpty).zipWithIndex.map { case (line, index) =>
              parseRow(line, index + 2)
            }
            val errors = parsedRows.collect { case Left(error) => error }
            if errors.nonEmpty then Left(errors.head)
            else
              Right(parsedRows.collect { case Right(player) => player })
      catch
        case error: Exception =>
          Left(s"CSV konnte nicht gelesen werden: ${error.getMessage}")

  private def parseRow(line: String, lineNumber: Int): Either[String, Player] =
    val parts = line.split(",", -1).map(_.trim)
    if parts.length != 6 then
      Left(s"Zeile $lineNumber: ungültige Spaltenanzahl (${parts.length})")
    else
      val Array(leagueId, leagueName, playerName, team, goalsText, assistsText) = parts
      for
        goals <- parseInt(goalsText, s"Zeile $lineNumber: Tore ist ungültig")
        assists <- parseInt(assistsText, s"Zeile $lineNumber: Assists sind ungültig")
        name <- validateText(playerName, s"Zeile $lineNumber: Spielername fehlt")
        teamName <- validateText(team, s"Zeile $lineNumber: Team fehlt")
        league <- validateText(leagueId, s"Zeile $lineNumber: Liga fehlt")
        leagueDisplay <- validateText(leagueName, s"Zeile $lineNumber: Ligabezeichnung fehlt")
      yield
        Player(
          id = s"${league}_${name}_${teamName}",
          name = name,
          team = teamName,
          leagueId = league,
          leagueName = leagueDisplay,
          goals = goals,
          assists = assists
        )

  private def parseInt(value: String, errorMessage: String): Either[String, Int] =
    try Right(value.toInt)
    catch
      case _: NumberFormatException => Left(errorMessage)

  private def validateText(value: String, errorMessage: String): Either[String, String] =
    if value.isEmpty then Left(errorMessage)
    else Right(value)

  def groupByLeague(players: Vector[Player]): Vector[League] =
    players.groupBy(_.leagueId).toVector
      .sortBy(_._1)
      .map { case (leagueId, leaguePlayers) =>
        val first = leaguePlayers.head
        League(id = leagueId, name = first.leagueName, players = leaguePlayers.sortBy(_.name.toLowerCase))
      }
