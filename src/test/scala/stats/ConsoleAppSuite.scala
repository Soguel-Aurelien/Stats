package stats

import scala.util.Try

class ConsoleAppSuite extends munit.FunSuite:
  test("topPlayers sorts by goals descending") {
    val players = Vector(
      Player("eng.1_1", "Erling Haaland", "Manchester City", "eng.1", "Premier League", 5, 0),
      Player("eng.1_2", "Pascal Gross", "Brighton & Hove Albion", "eng.1", "Premier League", 3, 3),
      Player("eng.1_3", "Bruno Fernandes", "Manchester United", "eng.1", "Premier League", 2, 5)
    )

    val ranking = Model.topPlayers(players, "goals", 10)
    assertEquals(ranking.head.name, "Erling Haaland")
    assertEquals(ranking.map(_.name), Vector("Erling Haaland", "Pascal Gross", "Bruno Fernandes"))
  }

  test("topPlayers sorts by scorer points and then goals") {
    val players = Vector(
      Player("eng.1_1", "A", "Team A", "eng.1", "Premier League", 2, 2),
      Player("eng.1_2", "B", "Team B", "eng.1", "Premier League", 3, 0),
      Player("eng.1_3", "C", "Team C", "eng.1", "Premier League", 1, 5)
    )

    val ranking = Model.topPlayers(players, "scorer", 10)
    assertEquals(ranking.map(_.name), Vector("C", "A", "B"))
  }

  test("searchPlayers finds names and teams case-insensitively") {
    val players = Vector(
      Player("eng.1_1", "Erling Haaland", "Manchester City", "eng.1", "Premier League", 5, 0),
      Player("eng.1_2", "Bruno Fernandes", "Manchester United", "eng.1", "Premier League", 2, 5),
      Player("eng.1_3", "Kevin Schade", "Brentford", "eng.1", "Premier League", 3, 0)
    )

    val matches = Model.searchPlayers(players, "city")
    assertEquals(matches.size, 1)
    assertEquals(matches.head.name, "Erling Haaland")

    val matchesByName = Model.searchPlayers(players, "bruno")
    assertEquals(matchesByName.head.name, "Bruno Fernandes")
  }

  test("updates create new immutable player instances") {
    val player = Player("eng.1_1", "Erling Haaland", "Manchester City", "eng.1", "Premier League", 5, 0)
    val next = Model.updateStats(player, 7, 2)

    assertEquals(player.goals, 5)
    assertEquals(player.assists, 0)
    assertEquals(next.goals, 7)
    assertEquals(next.assists, 2)
    assertEquals(next.scorerPoints, 9)
  }

  test("CSV loader rejects invalid header and row data") {
    val tempFile = java.nio.file.Files.createTempFile("football-stats", ".csv")
    java.nio.file.Files.writeString(tempFile, "leagueId,leagueName,playerName,team,goals,assists\neng.1,Premier League,Test,Team,abc,1\n")

    val result = Data.loadPlayers(tempFile.toString)
    assert(result.isLeft)
    assert(result.left.toOption.exists(_.contains("Tore ist ungültig")))

    val invalidHeader = java.nio.file.Files.createTempFile("football-stats-bad-header", ".csv")
    java.nio.file.Files.writeString(invalidHeader, "wrong,header\n")
    val invalidHeaderResult = Data.loadPlayers(invalidHeader.toString)
    assert(invalidHeaderResult.isLeft)
  }
