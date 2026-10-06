package stats

import java.io.File
import java.nio.file.{Files, Paths, StandardCopyOption}
import scala.io.Source
import scala.util.{Try, Using}

object Data:
  private val header = "leagueId,leagueName,playerName,team,goals,assists"

  // Erst die neue Datei fertig schreiben, dann die alte ersetzen.
  def savePlayers(path: String, players: Vector[Player]): Either[String, Unit] =
    val rows = players.map { p =>
      Vector(p.leagueId, p.leagueName, p.name, p.team, p.goals.toString, p.assists.toString)
    }
    if rows.exists(_.exists(value => value.exists(c => c == ',' || c == '\n' || c == '\r'))) then
      Left("CSV-Felder dürfen keine Kommas oder Zeilenumbrüche enthalten")
    else
      val lines = header +: rows.map(_.mkString(","))
      parse(lines).flatMap { _ =>
        Try {
          val target = Paths.get(path).toAbsolutePath
          val temporary = Files.createTempFile(target.getParent, ".fotstats-", ".tmp")
          try
            Files.writeString(temporary, lines.mkString("\n") + "\n")
            Files.move(temporary, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
            ()
          finally Files.deleteIfExists(temporary)
        }.toEither.left.map(error => s"CSV konnte nicht gespeichert werden: ${error.getMessage}")
      }

  // Using schliesst die Datei nach dem Lesen, auch bei einem Fehler.
  def loadPlayers(path: String): Either[String, Vector[Player]] =
    if !new File(path).exists() then Left(s"CSV-Datei nicht gefunden: $path")
    else
      Using(Source.fromFile(path, "UTF-8")) { source =>
        parse(source.getLines().toVector)
      }.toEither.left.map(error => s"CSV konnte nicht gelesen werden: ${error.getMessage}").flatMap(identity)

  private def parse(lines: Vector[String]): Either[String, Vector[Player]] =
    if lines.headOption.map(_.trim) != Some(header) then Left("CSV-Header ist ungültig oder die Datei ist leer.")
    else
      val rows = lines.tail.zipWithIndex.filter(_._1.trim.nonEmpty).map { (line, index) =>
        parseRow(line, index + 2)
      }
      rows.collectFirst { case Left(error) => error } match
        case Some(error) => Left(error)
        case None => Right(rows.collect { case Right(player) => player })

  private def parseRow(line: String, number: Int): Either[String, Player] =
    line.split(",", -1).map(_.trim) match
      case Array(leagueId, leagueName, name, team, goalsText, assistsText)
          if Vector(leagueId, leagueName, name, team).forall(_.nonEmpty) =>
        for
          goals <- goalsText.toIntOption.filter(_ >= 0).toRight(s"Zeile $number: Tore ist ungültig")
          assists <- assistsText.toIntOption.filter(_ >= 0).toRight(s"Zeile $number: Assists sind ungültig")
        yield Player(s"${leagueId}_${name}_${team}", name, team, leagueId, leagueName, goals, assists)
      case _ => Left(s"Zeile $number: sechs Spalten und vollständige Namen erforderlich.")

  def groupByLeague(players: Vector[Player]): Vector[League] =
    players.groupBy(_.leagueId).toVector
      .sortBy(_._1)
      .map { (id, members) => League(id, members.head.leagueName, members.sortBy(_.name.toLowerCase)) }
